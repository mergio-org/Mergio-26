# Deploying the backend

The Express backend (`apps/backend`: the API and the GitHub sync worker) runs in Docker on our
VPS. The web app stays on Vercel. The VPS already has a reverse proxy (Nginx Proxy Manager)
that owns ports 80 and 443, so the backend joins its Docker network and has no public port of
its own; the proxy serves it at `https://api.mergio.in` with a Let's Encrypt certificate.

```
Browser ─► mergio.in (Vercel) ─► api.mergio.in ─► Nginx Proxy Manager ─► mergio-backend:4000
                                                                           │
                         production Postgres + Upstash Redis ◄─────────────┘
```

## First deploy

On the server, as root:

```sh
git clone https://github.com/mergio-org/Mergio-26.git /opt/mergio/src
cd /opt/mergio/src/deploy

cp .env.example .env                      # PROXY_NETWORK: the proxy's Docker network
cp backend.env.example /opt/mergio/backend.env
chmod 600 /opt/mergio/backend.env
nano /opt/mergio/backend.env              # fill in DATABASE_URL, Redis, GitHub App

docker compose run --rm migrate           # what is pending in the database?
docker compose run --rm migrate migrate deploy   # apply it (never drops data)
docker compose up -d --build
docker exec mergio-backend wget -qO- http://127.0.0.1:4000/health
```

Then:

1. DNS: an A record for `api.mergio.in` pointing to the server's IP.
2. Nginx Proxy Manager (`http://<server>:81`) → Hosts → Proxy Hosts → Add: domain
   `api.mergio.in`, scheme `http`, forward hostname `mergio-backend`, port `4000`, Block
   Common Exploits on; SSL tab: request a new Let's Encrypt certificate, Force SSL, HTTP/2.
3. Check `https://api.mergio.in/health` → `{"status":"ok","database":"connected"}`.

## Updating: automatic

`.github/workflows/ci-cd.yml` runs lint, type checks, tests and the build on every pull request
and push to main. After it passes on main, it deploys the backend if the push changed anything
the backend is built from (`apps/backend`, `packages/` including migrations, `deploy/`, the
lockfile). Pushes that change only the web app skip the deploy; Vercel deploys those itself.

- **Deploy now:** GitHub → Actions → **CI/CD** → **Run workflow** (branch `main`).
- **Roll back:** the same, with an older commit's full SHA in "Commit". Images of the last 3
  deploys stay on the server, so going back to one of them doesn't rebuild.

On the server, `deploy.sh` builds images tagged with the commit, backs up the database to
`/opt/mergio/backups/pre-<commit>-<time>.dump` and applies migrations if any are pending,
starts the new container, and waits for `/health` to report the database connected. If it
doesn't, the previous image is started again, the job fails, and the new container's logs are
in `/opt/mergio/last-failed-deploy.log`. Deploy history: `/opt/mergio/deploys.log`.

Migrations are applied before the new code starts, and Vercel deploys the web app at the same
time, so a migration must also work with the code that's still running: add columns and tables
first, and remove old ones in a later release.

**Don't run `prisma migrate deploy` against production yourself.** Merging to main applies
migrations, after a backup. A manual run at the same time as a deploy makes the deploy fail.
The pipeline skips Prisma's advisory lock (`PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK`): through the
Supabase session pooler that lock can stay held after the process ends and block the next
deploy, and deploys are already serialized.

### One-time setup

GitHub connects with its own SSH key, which can run only `mergio-deploy` (it accepts
`deploy <commit on main>` and nothing else). On the server, as root:

```sh
install -m 755 /opt/mergio/src/deploy/mergio-deploy /usr/local/bin/mergio-deploy
ssh-keygen -t ed25519 -N "" -C github-actions-mergio-deploy -f /root/mergio-deploy-key
echo "restrict,command=\"/usr/local/bin/mergio-deploy\" $(cat /root/mergio-deploy-key.pub)" \
  >> /root/.ssh/authorized_keys
```

In GitHub → repo Settings → Environments → **production** (deployment branches: `main` only):

| Name | Kind | Value |
| --- | --- | --- |
| `DEPLOY_SSH_KEY` | secret | contents of `/root/mergio-deploy-key`; then delete that file |
| `DEPLOY_KNOWN_HOSTS` | secret | `<server IP> ` + contents of `/etc/ssh/ssh_host_ed25519_key.pub` |
| `DEPLOY_HOST` | variable | the server's IP |

Rerun the `install` line whenever `mergio-deploy` changes. `deploy.sh` needs nothing: it runs
from the commit being deployed.

## Updating: by hand

```sh
cd /opt/mergio/src && git fetch && git checkout --detach origin/main
bash deploy/deploy.sh "$(git rev-parse HEAD)"
```

Logs: `docker compose logs -f backend` (in `deploy/`).

## Settings

All in `/opt/mergio/backend.env` (template: `backend.env.example`); restart after a change
with `docker compose up -d`. Without the GitHub App ID and key the API still runs, and sync
jobs wait in the queue until they are set.
