# Mergio

> **A Nationwide Open-Source Initiative Presented by Google Developer Groups (GDG) on Campus — KNIT Sultanpur, Uttar Pradesh**

Mergio is a premier nationwide open-source program designed to foster engineering excellence, open-source adoption, and large-scale collaborative development across India. Built to connect ambitious developers, active repository maintainers, and seasoned mentors, Mergio provides a high-impact platform where talent collaborates on production-grade software.

---
```
apps/
  web/                    Next.js 16 app (http://localhost:3001)
  super-admin/            Next.js 16 super admin dashboard (http://localhost:3002)
  backend/                Express 5 + TypeScript API (http://localhost:4000)
packages/
  db/                     Prisma 7 schema, migrations and the shared `prisma` client
  scoring/                Scoring engine (pure, unit-tested) and shared ranking/queue helpers
  ui/                     Shared React components (Tailwind CSS v4)
  tailwind-config/        Shared Tailwind theme and PostCSS config
  eslint-config/          Shared ESLint configs
  typescript-config/      Shared tsconfig files
docker-compose.yml        Local PostgreSQL and Redis for development
```

## About Mergio

Open-source software powers modern technology infrastructure. Mergio is architected to scale open-source culture across universities and developer communities throughout India. The initiative bridges the gap between academic learning and industry engineering standards by creating an environment where:

- **Developers** solve real architectural challenges, work within production Git workflows, submit high-quality pull requests, and gain nationwide recognition.
- **Project Maintainers** scale their codebases, accelerate product roadmaps, and build sustained contributor communities around impactful open-source repositories.
- **Domain Mentors** guide technical design decisions, maintain review rigor, and uphold engineering best practices across domains.

All contributions are tracked through a transparent, merit-based scoring system and showcased on a public nationwide leaderboard.

---

## Program Structure & Governance

Mergio is organized and governed by **GDG on Campus KNIT** (Kamla Nehru Institute of Technology, Sultanpur, Uttar Pradesh). The team oversees repository curation, platform infrastructure, issue standardization, and review integrity.

### Core Ecosystem Roles

Participation in Mergio is organized across three specialized tracks:

1. **Contributors**
   - Developers and engineers across India contributing to curated open-source projects.
   - Tackle challenges across distributed systems, modern web platforms, mobile frameworks, developer tooling, and AI/ML pipelines.
   - Deliver clean, tested code, participate in peer reviews, and accumulate points based on issue complexity and impact.

2. **Maintainers**
   - Authors and core leads of established open-source repositories.
   - Define technical roadmaps, curate issues categorized by complexity (`easy`, `medium`, `hard`), and establish contribution standards.
   - Review incoming pull requests, provide architectural feedback, and merge high-standard code into production branches.

3. **Mentors**
   - Senior engineers, alumni, and domain specialists across core technical disciplines.
   - Provide architectural guidance, assist with complex code reviews, and unblock teams on technical roadblocks.
   - Ensure contributions adhere to security standards, performance benchmarks, and clean code principles.

### Program Milestones

The program operates across structured, synchronized phases:

1. **Repository Onboarding & Audit**: Maintainers submit repositories; the organizing committee audits project roadmaps, contribution documentation, and issue readiness.
2. **National Registration & Orientation**: Registrations open nationwide via GitHub OAuth, allowing participants to assemble profiles and browse vetted codebases.
3. **Contribution Sprints**: Intensive engineering cycles where developers claim issues, open pull requests, collaborate with maintainers, and score points on the leaderboard.
4. **Code Freeze & Final Audits**: Contribution cutoff followed by final maintainer reviews and audit verification.
5. **Leaderboard Finalization & Certification**: Publication of nationwide rankings and distribution of verifiable, official credentials recognizing contributors, maintainers, and mentors.

---

## Technical Architecture

The Mergio platform is architected as a high-performance monorepo uniting the public participant portal, the administrative console, backend services, and shared libraries.

### Monorepo Structure

```
apps/
  web/                    Next.js 16 public participant portal (http://localhost:3001)
  super-admin/            Next.js 16 organizer admin console (http://localhost:3002)
  backend/                Express 5 + TypeScript API service (http://localhost:4000)
packages/
  db/                     Prisma 7 schema, PostgreSQL migrations and shared client
  ui/                     Shared design system built on React & Tailwind CSS v4
  tailwind-config/        Shared styling and theme configurations
  eslint-config/          Shared linting configurations
  typescript-config/      Shared TypeScript configurations
docker-compose.yml        Local PostgreSQL 16 container setup
```

### Application Stack

- **Participant Web Portal (`apps/web`)**: Public platform for project discovery, registration, guidelines, milestone timelines, and real-time national leaderboard analytics.
- **Organizer Admin Console (`apps/super-admin`)**: Secured operations hub for the GDG KNIT organizing committee to manage:
  - Project review and maintainer approval queues.
  - Mentor application screening.
  - Nationwide participant search and profile inspection with full score ledgers.
  - Program season management and event timelines with change history diff tracking.
  - Manual score adjustments with mandatory audit justifications.
  - GitHub App webhook health, delivery logs, failure rate tracking, and repository resyncs.
  - Comprehensive CSV exports for participants, merged pull requests, final rankings, and certificate issuing batches.
  - Immutable audit trail recording every administrative state mutation.
- **Backend API (`apps/backend`)**: Express 5 service powering webhook processing, external integrations, and background automations.

---

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 24 or newer
- [pnpm](https://pnpm.io/) (`npm install -g pnpm` or `corepack enable`)
- [Docker](https://docs.docker.com/get-docker/) (for local PostgreSQL database)

---

### Step-by-Step Setup

#### 1. Clone the repository and install dependencies

From the project root:

```sh
git clone git@github.com:TheCodeHeist-Coder/Mergio-26.git
cd Mergio-26
pnpm install
```

> **Note**: As a pnpm monorepo, dependencies for all applications and packages are resolved and installed simultaneously from the **root directory**.

#### 2. Configure environment variables

Generate the environment configuration files for each workspace:

```sh
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env
cp apps/super-admin/.env.example apps/super-admin/.env
cp apps/backend/.env.example apps/backend/.env
```

Ensure the `DATABASE_URL` matches across all `.env` files. The default connection string configured for the local Docker environment is:
```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/mergio?schema=public"
```

## GitHub sign-in & Sessions

Registration uses [Better Auth](https://www.better-auth.com) with GitHub as the only provider. We request only `read:user` and `user:email`, never repository access.

1. On GitHub, go to **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Set **Homepage URL** to `https://mergio.in`. Under **Redirect URIs** add `http://localhost:3001/api/auth/callback/github` and `https://mergio.in/api/auth/callback/github`. Leave wildcard matching, device flow and token expiry off.
3. Copy the **Client ID** into `GITHUB_CLIENT_ID`. Generate a **Client secret** and copy it into `GITHUB_CLIENT_SECRET`.
4. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`, and set `BETTER_AUTH_URL="http://localhost:3001"`.
5. Optional: list GitHub usernames in `ADMIN_GITHUB_LOGINS` (comma separated) to make those people super admins the next time they sign in.

Returning people sign in at `/login`; new people start at `/register`, which asks for a role first. Both accept a `next` path to come back to, and only paths on this site are followed.

### Sessions & Bans

Sessions are rows in the `Session` table, referenced by an httpOnly, `SameSite=Lax` cookie (`Secure` whenever `BETTER_AUTH_URL` is https). They last 30 days and roll: a session used after it is a day old is extended to 30 days from then, with a 60-second cookie cache so bans and revocations take effect within a minute.

Organizers can ban a person (`User.bannedAt`, `banReason`), which deletes all of their sessions in one transaction and blocks future sign-ins.

### Auth and admin API

JSON endpoints under `/api/v1` (authenticated with the session cookie; writes require `Content-Type: application/json`):
- `GET /auth/github?next=/dashboard` — starts GitHub sign-in and redirects back to `next`
- `POST /auth/logout` — deletes the current session and clears the cookie (`204`)
- `GET /me` — returns `{id, githubId, githubLogin, name, email, image, staffRole, roles, registrations, createdAt}`
- `POST /admin/users/{id}/ban` / `DELETE /admin/users/{id}/ban` — ban or unban a user
- `DELETE /admin/users/{id}/sessions` — revoke all sessions for a user
- `PUT /admin/users/{id}/staff-role` — set `staffRole` (`"ORGANIZER" | "SUPER_ADMIN" | null`)

### Site content API (F-16)

Organizers edit public-site content at `/admin/content`; the same operations are available as JSON under `/api/v1` (organizers only unless noted). Every write is live on the public site immediately — no deploy. Field definitions and validation live in `apps/web/lib/site-content.ts`. Until a kind has items, the site shows the built-in copy from `apps/web/lib/content.ts`.

`{kind}` is one of:

| kind | Fields (`*` required) | Shown on |
|---|---|---|
| `faq` | `question`\*, `answer`\* (markdown) | `/`, `/faq` |
| `timeline` | `title`\*, `body`\*, `icon`\*, `when`, `active` (boolean) | `/` |
| `sponsors` | `name`\*, `tier`\* (`platinum`/`gold`/`silver`/`community`), `logoUrl`, `url`, `blurb` | `/sponsors` |
| `team` | `name`\*, `role`\*, `photoUrl`, `githubLogin`, `linkedinUrl` | `/team` |
| `stats` | `value`\*, `label`\*, `icon`\* | `/` (About card) |

`icon` is one of `flake github check merge pr repo issue mentor trophy calendar clock sprout chart award help`.

- `GET /admin/content/{kind}` — `{items: [{id, kind, position, data, updatedAt}]}` in display order
- `POST /admin/content/{kind}` — body: the fields; adds at the end. `201` with the item
- `GET /admin/content/{kind}/{id}` — one item
- `PATCH /admin/content/{kind}/{id}` — body: fields to change (others keep their value)
- `DELETE /admin/content/{kind}/{id}` — `{deleted: true}`
- `PUT /admin/content/{kind}/order` — `{"ids": [...]}` listing every item of the kind once, in the new order
- `POST /admin/content/{kind}/import` — copies the built-in copy into the database so it can be edited (`409` if the kind already has items)
- `GET /admin/content/pages` — `{pages: [{slug, title, description, body, updatedAt}]}`; `updatedAt` is `null` while a page shows its built-in copy
- `GET /admin/content/pages/{slug}` / `PUT` `{title, description, body}` / `DELETE` (back to built-in copy) — `slug`: `about`, `code-of-conduct`, `privacy`, `terms`; `body` is markdown
- `POST /admin/content/uploads` — `{"contentType": "image/png", "size": 12345}` (PNG/JPEG/WebP/GIF/AVIF/SVG, ≤ 5 MB) → `201 {uploadUrl, publicUrl, key, headers, expiresIn}`. `PUT` the file to `uploadUrl` with `headers` within `expiresIn` seconds, then store `publicUrl`. `503` until the `S3_*` env vars are set
- `GET /admin/content/sponsor-inquiries` — latest 200 "Become a sponsor" submissions, newest first
- `POST /sponsor-inquiries` — **public**. `{name, email, organization, message}` → `201 {id}`

Validation errors are `400 {error: {message, fields: {field: message}}}`.

**Image storage:** set `S3_ENDPOINT`, `S3_REGION` (`auto` for R2), `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `S3_PUBLIC_URL` (see `apps/web/.env.example`). The bucket must be publicly readable at `S3_PUBLIC_URL` and allow CORS `PUT` with a `Content-Type` header from the site's origin.

Configure your GitHub OAuth credentials in `apps/web/.env` and `apps/super-admin/.env` (see [Authentication](#github-authentication) below).

#### 3. Initialize the database

Start the PostgreSQL service using Docker Compose:

```sh
docker compose up -d
```

Run schema migrations and generate the Prisma Client:

```sh
pnpm db:migrate
pnpm db:generate
```

#### 4. Launch development services

Start all platform applications concurrently:

```sh
pnpm dev
```

Available endpoints:
- **Participant Web Portal**: http://localhost:3001
- **Organizer Super-Admin**: http://localhost:3002
- **Backend API**: http://localhost:4000

To launch an individual service:
```sh
pnpm dev --filter web          # Participant portal only
pnpm dev --filter super-admin  # Admin console only
pnpm dev --filter backend      # Backend API only
```

---

## GitHub Authentication & Authorization

Authentication is handled via [Better Auth](https://www.better-auth.com) backed by GitHub OAuth.

1. Register a GitHub OAuth App (**Settings > Developer settings > OAuth Apps > New OAuth App**).
2. Set **Homepage URL** to `http://localhost:3001` (or your production domain).
3. Under **Redirect URIs**, register:
   - `http://localhost:3001/api/auth/callback/github`
   - `https://mergio.in/api/auth/callback/github`
4. Copy the **Client ID** into `GITHUB_CLIENT_ID` and **Client Secret** into `GITHUB_CLIENT_SECRET`.
5. Set `BETTER_AUTH_SECRET` to a cryptographically secure random value (`openssl rand -base64 32`).
6. **Administrator Privileges**: In `apps/web/.env`, add your GitHub username to `ADMIN_GITHUB_LOGINS`:
   ```env
   ADMIN_GITHUB_LOGINS="your_github_username"
   ```
   Upon sign-in, your account will be granted `isAdmin: true` in the database, granting access to the Super-Admin operations console at `http://localhost:3002`.

---

## Repository Commands

All project workflows can be triggered from the monorepo root:

| Command | Description |
|---|---|
| `pnpm dev` | Launch all applications in development mode |
| `pnpm build` | Compile and build all applications and packages |
| `pnpm lint` | Execute ESLint verification across workspaces |
| `pnpm check-types` | Run TypeScript type checks across workspaces |
| `pnpm format` | Enforce code formatting with Prettier |
| `pnpm db:migrate` | Apply schema migrations in development |
| `pnpm db:generate` | Rebuild Prisma client types |
| `pnpm db:studio` | Launch Prisma Studio database inspector at `http://localhost:5555` |

---

## Organizing Body

**Mergio** is organized and spearheaded by **Google Developer Groups (GDG) on Campus — KNIT Sultanpur, Uttar Pradesh**.

For partnerships, institutional participation, or project submissions, connect with the organizing committee through the official community channels linked on the portal.
