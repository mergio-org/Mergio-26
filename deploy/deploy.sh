#!/usr/bin/env bash
# Builds and starts one commit of the backend on the server. GitHub Actions runs it through
# mergio-deploy, which has already checked the commit out. By hand, as root:
#   cd /opt/mergio/src && git fetch && git checkout --detach <sha> && bash deploy/deploy.sh <sha>
#
# 1. Build the images, tagged with the commit (skipped if they already exist, e.g. a rollback).
# 2. If migrations are pending: back up the database, then apply them.
# 3. Start the new container and wait until /health reports the database connected.
#    If it doesn't, start the previous image again and fail.
#
# Its output ends up in public GitHub Actions logs: never print secrets or container logs.
set -euo pipefail

sha=${1:?usage: deploy.sh <commit sha>}
tag=${sha:0:12}
cd "$(dirname "$0")"
[ -f .env ] && { set -a; . ./.env; set +a; }
env_file=${MERGIO_ENV_FILE:-/opt/mergio/backend.env}
backups=/opt/mergio/backups
export MERGIO_TAG=$tag

step() { printf '\n==> %s\n' "$*"; }

previous=$(docker inspect --format '{{.Config.Image}}' mergio-backend 2>/dev/null || true)
case $previous in
  "") previous_tag="" ;;
  *:*) previous_tag=${previous##*:} ;;
  *) previous_tag=latest ;;
esac

step "Building $tag"
if docker image inspect "mergio-backend:$tag" "mergio-backend-tools:$tag" >/dev/null 2>&1; then
  echo "Images for $tag already exist; not rebuilding."
else
  docker compose --profile tools build backend migrate
fi

step "Checking migrations"
# `migrate status` exits non-zero when migrations are pending, so judge it by its output.
status=$(docker compose run --rm migrate migrate status 2>&1 || true)
grep -vE 'Datasource|schema loaded|config file' <<<"$status" || true
if grep -q "Database schema is up to date" <<<"$status"; then
  echo "Nothing to apply."
elif grep -q "have not yet been applied" <<<"$status"; then
  step "Backing up the database before migrating"
  direct=$(sed -n 's/^DIRECT_URL=//p' "$env_file" | head -n 1)
  direct=${direct#[\"\']}
  direct=${direct%[\"\']}
  [ -n "$direct" ] || { echo "DIRECT_URL is not set in $env_file." >&2; exit 1; }
  mkdir -p "$backups"
  file="$backups/pre-$tag-$(date -u +%Y%m%dT%H%MZ).dump"
  docker run --rm --env-file <(printf 'PGURL=%s\n' "$direct") postgres:17-alpine \
    sh -c 'pg_dump "$PGURL" --format=custom --no-owner' >"$file.partial"
  mv "$file.partial" "$file"
  echo "Saved $file ($(du -h "$file" | cut -f1))."
  # Keep the 10 newest automatic backups. Hand-made ones (other names) are left alone.
  ls -1t "$backups"/pre-*.dump 2>/dev/null | tail -n +11 | xargs -r rm -f

  step "Applying migrations"
  # Prisma normally takes a Postgres advisory lock (pg_advisory_lock) first. Through the
  # Supabase session pooler that lock can outlive the process that took it, because the pooler
  # keeps the server connection open, and the next deploy then times out with P1002. Deploys
  # already run one at a time (mergio-deploy's flock and the workflow's concurrency group), so
  # the lock adds nothing here. Nobody should run `migrate deploy` against production by hand.
  docker compose run --rm -e PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1 migrate migrate deploy 2>&1 |
    { grep -vE 'Datasource|schema loaded|config file' || true; }
else
  echo "Could not read the migration status (is the database reachable?). Nothing was changed." >&2
  exit 1
fi

step "Starting $tag"
docker compose up -d --no-build backend

healthy=false
for _ in $(seq 1 45); do
  if docker exec mergio-backend wget -qO- http://127.0.0.1:4000/health 2>/dev/null |
    grep -q '"database":"connected"'; then
    healthy=true
    break
  fi
  sleep 2
done

if ! $healthy; then
  docker logs --tail 200 mergio-backend >/opt/mergio/last-failed-deploy.log 2>&1 || true
  echo "$tag did not become healthy. Its logs are in /opt/mergio/last-failed-deploy.log on the server." >&2
  if [ -n "$previous_tag" ] && [ "$previous_tag" != "$tag" ]; then
    step "Rolling back to $previous_tag"
    MERGIO_TAG=$previous_tag docker compose up -d --no-build backend
  fi
  exit 1
fi
echo "$tag is healthy."
echo "$(date -u +%FT%TZ) $sha" >>/opt/mergio/deploys.log

step "Cleaning up"
# Keep the 3 newest backend images (instant rollback) and only the current tools image
# (it is only needed for migrations, and is twice the size). Images in use are never removed.
docker images mergio-backend --format '{{.Tag}}' | grep -vxF -e "$tag" -e latest | tail -n +3 |
  sed 's/^/mergio-backend:/' | xargs -r docker image rm >/dev/null 2>&1 || true
docker images mergio-backend-tools --format '{{.Tag}}' | grep -vxF "$tag" |
  sed 's/^/mergio-backend-tools:/' | xargs -r docker image rm >/dev/null 2>&1 || true
docker image prune -f >/dev/null
docker builder prune -f --filter until=168h >/dev/null
echo "Deployed $sha."
