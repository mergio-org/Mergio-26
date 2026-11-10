# Mergio-26

A Turborepo monorepo with a Next.js app, a shared UI library and a Prisma 7 + PostgreSQL database package.

## Project structure

```
apps/
  web/                    Next.js 16 app (http://localhost:3001)
  super-admin/            Next.js 16 super admin dashboard (http://localhost:3002)
  backend/                Express 5 + TypeScript API (http://localhost:4000)
packages/
  db/                     Prisma 7 schema, migrations and the shared `prisma` client
  ui/                     Shared React components (Tailwind CSS v4)
  tailwind-config/        Shared Tailwind theme and PostCSS config
  eslint-config/          Shared ESLint configs
  typescript-config/      Shared tsconfig files
docker-compose.yml        Local PostgreSQL for development
```

## Prerequisites

- [Node.js](https://nodejs.org/) 24 or newer
- [pnpm](https://pnpm.io/) (`npm install -g pnpm` or `corepack enable`)
- A PostgreSQL database. See [Database setup](#database-setup) for options.

## Getting started

### 1. Clone and install

```sh
git clone git@github.com:TheCodeHeist-Coder/Mergio-26.git
cd Mergio-26
pnpm install
```

### 2. Configure environment variables

```sh
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env
```

Both files need the same `DATABASE_URL`. Prisma reads `packages/db/.env`, and the Next.js app reads `apps/web/.env`. The default value matches the Docker setup below. If you use a different database, change it in both files.

`apps/web/.env` also holds the sign-in settings. Fill them in using [GitHub sign-in](#github-sign-in) below.

### 3. Set up the database

Choose one of the [database options](#database-setup), then create the tables:

```sh
pnpm db:migrate
```

### 4. Start the dev server

```sh
pnpm dev
```

The web app runs at http://localhost:3001 and the super admin app at http://localhost:3002.

To run only one app, use `pnpm dev --filter web` or `pnpm dev --filter super-admin`.

The super admin app and the backend also need their own `.env`:

```sh
cp packages/db/.env.example apps/super-admin/.env
cp apps/backend/.env.example apps/backend/.env
```

The backend API runs at http://localhost:4000. `GET /health` checks that the server and database are up.

## GitHub sign-in

Registration uses [Better Auth](https://www.better-auth.com) with GitHub as the only provider. We request only `read:user` and `user:email`, never repository access.

1. On GitHub, go to **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Set **Homepage URL** to `https://mergio.in`. Under **Redirect URIs** add `http://localhost:3001/api/auth/callback/github` and `https://mergio.in/api/auth/callback/github`. Leave wildcard matching, device flow and token expiry off.
3. Copy the **Client ID** into `GITHUB_CLIENT_ID`. Generate a **Client secret** and copy it into `GITHUB_CLIENT_SECRET`.
4. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`, and set `BETTER_AUTH_URL="http://localhost:3001"`.
5. Optional: list GitHub usernames in `ADMIN_GITHUB_LOGINS` (comma separated) to make them admins the next time they sign in.

The same app serves dev and production because it has both redirect URIs. Each environment sets its own `BETTER_AUTH_URL` (`http://localhost:3001` locally, `https://mergio.in` in production), and Better Auth builds the redirect URI from it. Both environments share one client secret, so give teammates a separate dev app once more than one person runs the project locally. In production, also set `AUTH_COOKIE_DOMAIN=".mergio.in"` so the session cookie is shared with `admin.mergio.in`.

Sign-in is checked in two places. `apps/web/proxy.ts` only looks for a session cookie and redirects early. The real check is `requireUser()` in `apps/web/lib/dal.ts`, so call it in every page and action that needs a signed-in user.

### Roles and registration

People pick any of **Contributor**, **Maintainer** and **Mentor** and can hold several. Each role is its own `Registration` row with a status. Contributors are `APPROVED` immediately. Maintainers and mentors start as `PENDING` until an admin reviews them. Shared details (college, graduation year, phone, Discord) live in one `Profile` per person.

### Exporting leads

Until the admin dashboard exists, dump every registration to CSV:

```sh
pnpm --silent export:registrations > registrations.csv
```

The file contains personal data. `registrations*.csv` is git-ignored, so keep it that way.

## Database setup

The app works with any PostgreSQL database. Choose one of these options and put its connection string in `DATABASE_URL`.

### Option A: Docker Compose (recommended)

You need [Docker](https://docs.docker.com/get-docker/) installed. From the repo root:

```sh
docker compose up -d
```

This starts PostgreSQL 16 on **port 5433**. That port avoids a clash with any Postgres you already run on 5432. The default URL works as-is:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mergio?schema=public"
```

Useful commands:

```sh
docker compose ps         # check status
docker compose down       # stop (data is kept)
docker compose down -v    # stop and delete all data
```

### Option B: Plain `docker run`

Use this to run the same database without Docker Compose:

```sh
docker run -d --name mergio-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mergio \
  -p 5433:5432 -v mergio-postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

The default `DATABASE_URL` works as-is.

### Option C: PostgreSQL installed locally

Install PostgreSQL with your system package manager (`sudo apt install postgresql`, `brew install postgresql@16`, or the [Windows installer](https://www.postgresql.org/download/windows/)). Then create a database:

```sh
createdb mergio
```

Update `DATABASE_URL` with your local user, password and port (usually 5432):

```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/mergio?schema=public"
```

### Option D: Hosted PostgreSQL (no local install)

Create a free database on a hosted provider such as [Neon](https://neon.tech), [Supabase](https://supabase.com) or [Prisma Postgres](https://www.prisma.io/postgres). Copy its connection string into `DATABASE_URL`. Hosted providers usually require SSL, so add `?sslmode=require` if the provider's string doesn't already include it.

> Use the **direct** (non-pooled) connection string when running migrations.

## Working with the database

The schema is in [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma). After you change it:

```sh
pnpm db:migrate     # create and apply a migration (asks for a name)
```

Other commands:

| Command            | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `pnpm db:generate` | Regenerate the Prisma client (also runs before `dev`/`build`) |
| `pnpm db:migrate`  | Create and apply a new migration in development         |
| `pnpm db:push`     | Sync the schema without creating a migration (prototyping) |
| `pnpm db:studio`   | Open Prisma Studio to browse and edit data              |

Apply migrations in production with `pnpm --filter @repo/db db:deploy`.

### Using the client

Import the shared client in server-side code only, such as server components, route handlers and server actions:

```ts
import { prisma } from "@repo/db";

const users = await prisma.user.findMany();
```

## Scripts

Run these from the repo root:

| Command            | What it does                         |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | Start all apps in development mode   |
| `pnpm build`       | Build all apps and packages          |
| `pnpm lint`        | Lint all packages                    |
| `pnpm check-types` | Type-check all packages              |
| `pnpm format`      | Format code with Prettier            |

## Troubleshooting

**`OS file watch limit reached` (Linux).** The dev server watches more files than the default limit allows. Raise the limit:

```sh
echo -e "fs.inotify.max_user_watches=524288\nfs.inotify.max_user_instances=512" | sudo tee /etc/sysctl.d/60-inotify.conf
sudo sysctl --system
```

**Strange build or CSS errors after a crash.** Clear the Next.js cache and restart:

```sh
rm -rf apps/web/.next && pnpm dev
```

**`Sign in with GitHub` does nothing or shows an error.** Check that `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are set in `apps/web/.env`, and that the OAuth App's callback URL matches `BETTER_AUTH_URL` exactly. Restart `pnpm dev` after editing `.env`.

**`Can't reach database server`.** Check that your database is running (`docker compose ps` for Docker). Also check that `DATABASE_URL` is the same in `packages/db/.env` and `apps/web/.env`.
