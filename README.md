# Ramen Library

A web app for composing ramen bowls from a parts catalogue, publishing them, and discussing them. Self-hosted: a Bun/Elysia API, a libSQL database, S3-compatible image storage, and a React client, all run from one Docker Compose file.

## What it does

- **Builder.** Choose a broth, tare, noodles, an aroma oil, and up to 12 toppings. Each part has an adjustable amount (ml, g, piece count, or a named portion). Price, calories, and sodium scale with the amount; prep time does not.
- **Compatibility checks.** Rules in `src/lib/compat.ts` flag pairings that don't work (thin noodles under miso, butter on a clear broth, more topping weight than the broth can carry) as errors, warnings, or notes.
- **Bowl render.** An SVG bowl drawn from the chosen parts, with draggable toppings.
- **Diet labels.** Each bowl is computed as vegan, vegetarian, or omnivore from its parts, plus a gluten flag. Ingredients are not labelled individually.
- **Drafts and share links.** Drafts persist in localStorage. A bowl can be shared as a `#b=` hash link without an account.
- **Publishing.** Accounts with email and password. Published builds have a cover: an uploaded photo (re-encoded to WebP with a thumbnail) or one of five illustrated templates tinted by the broth.
- **Community.** A gallery sorted by newest or most liked, likes and comments on builds, a forum with categories, threads, and replies, and user profiles.

## Screenshots

| Home | Builder |
| --- | --- |
| ![Home page: latest builds with illustrated covers](docs/screenshots/home.png) | ![Builder: parts table with amounts, live bowl render, totals and compatibility notes](docs/screenshots/builder.png) |

| Builds gallery | Build detail |
| --- | --- |
| ![Builds gallery sorted by newest or most liked](docs/screenshots/builds.png) | ![Build detail: cover, parts breakdown, likes and comments](docs/screenshots/build.png) |

| Forum | Thread |
| --- | --- |
| ![Forum index with categories and reply counts](docs/screenshots/forum.png) | ![Thread with original post and replies](docs/screenshots/thread.png) |

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | Bun 1.4 | Runs the server's TypeScript directly; also the package manager and test runner |
| API | Elysia | Routes under `/api`. The app object is exported without `.listen` so tests call it in-process |
| API client | Eden (`@elysiajs/eden`) | Client types are inferred from the server's route definitions |
| Validation | Zod 4 | Schemas in `shared/validation.ts` are used by the client forms and passed to Elysia routes |
| Auth | Better Auth | Email and password, cookie sessions, Kysely adapter. Verification email via Resend when a key is set |
| Database | Kysely + libSQL (`@libsql/client`) | SQLite-compatible. A local file in dev; the `sqld` server in production. Migrations are TypeScript modules run at boot |
| Image processing | sharp | Validates, auto-rotates, re-encodes to WebP at 1600 px, and makes an 800×600 thumbnail |
| Image storage | Garage (S3 API) or local disk | Selected at boot by `S3_ENDPOINT` in `server/storage.ts` |
| Client | Vite 8, React 19, TypeScript | |
| Routing | React Router (data router) | One loader per page |
| Client state | Zustand with `persist` | Current build and drafts in localStorage |
| Mutations | TanStack Query | Used for the like button's optimistic update |
| Styling | Tailwind CSS v4, Base UI primitives, Lucide icons, Motion | Components are hand-written in `src/components/ui`. Tokens in `src/index.css` |
| Reverse proxy | Caddy | Automatic TLS via Let's Encrypt |
| Rate limiting | In-process fixed-window counters | No dependency; see Deploy |

Backend choices, alternatives considered, and trade-offs are in [`docs/BACKEND_STACK.md`](docs/BACKEND_STACK.md). Design notes and the component library comparison are in [`docs/UI_LIBRARY_RESEARCH.md`](docs/UI_LIBRARY_RESEARCH.md).

## Run it

Needs [Bun](https://bun.sh) 1.4 or newer.

```bash
bun install
bun run dev         # web on http://localhost:5173, API on :3000 (proxied under /api)
bun run build       # tsc -b + vite build into dist/
bun run start       # production: API and static site on :3000
bun test            # all tests
bun run lint        # oxlint
bun run db:migrate  # apply migrations by hand (the server also does this at boot)
```

The database is created and migrated at boot. A database from before the libSQL migration is not compatible; delete `data/ramen.db` or follow the data section in `docs/SELF_HOSTED_STACK_PLAN.md`.

Environment variables are all optional in dev. Copy [`.env.example`](.env.example) to `.env` to override.

| Var | Dev default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:data/ramen.db` | libSQL URL. `http://sqld:8080` in production |
| `DATABASE_AUTH_TOKEN` | empty | Only if `sqld` runs with auth enabled |
| `S3_ENDPOINT` | empty | Empty means local disk under `UPLOAD_DIR`, served at `/uploads/*`. In production `http://garage:3900` |
| `S3_REGION` | `garage` | Any value works for Garage |
| `S3_BUCKET` | `ramen-uploads` | Ignored when `S3_ENDPOINT` is empty |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | empty | From `garage key create` |
| `S3_PUBLIC_URL` | empty | Base URL images are served from (Caddy in front of Garage's web endpoint) |
| `UPLOAD_DIR` | `data/uploads` | Local-disk uploads, only when `S3_ENDPOINT` is empty |
| `BETTER_AUTH_SECRET` | dev placeholder | Signs sessions. Required in production |
| `BETTER_AUTH_URL` | `http://localhost:5173` | Public origin of the site |
| `TRUSTED_ORIGINS` | empty | Extra comma-separated origins Better Auth accepts |
| `PORT` / `HOST` | `3000` / `127.0.0.1` | API bind. Overridden to `0.0.0.0` in Compose |
| `EMAIL_PROVIDER_KEY` | empty | Resend API key. Empty logs the verification link instead of sending it |
| `TRUST_PROXY` | empty | `1` makes the rate limiter use the first `X-Forwarded-For` entry. Set only behind a proxy |

## Layout

```
shared/         ingredients.ts (parts catalogue), bowl.ts (types), validation.ts (zod); imported by client and server
server/
  index.ts      Runs migrations, then listens
  app.ts        Elysia app: error handling, session, auth handler, API, static serving, rate limits
  routes.ts     /api routes
  session.ts    Attaches the Better Auth session as `user` on every request
  auth.ts       Better Auth config
  email.ts      Verification email hook
  ratelimit.ts  Fixed-window limiter and client IP resolution
  storage.ts    Garage (S3) or local disk
  uploads.ts    Upload validation and the sharp pipeline
  db/           client.ts, types.ts, migrate.ts, migrations/
src/
  pages/        Home, Builder, Drafts, Builds, Build, Forum, Thread, Profile, Settings, Login, Signup
  components/
    ui/         button, card, badge, input, textarea, avatar, tabs, dialog, slider, tooltip
    build/      BuildTable, AmountControl, PartPickerDialog, BuildSummary, CoverArt, CoverPicker
    bowl/       BowlCanvas, ToppingGlyph
    social/     BuildCard, Discussion, ThreadTable
    site/       Layout, PageBits
    library/    LibraryGrid (drafts)
  store/        bowl.ts (zustand)
  lib/          api.ts (Eden client), auth-client.ts, compat.ts, totals.ts, share.ts
deploy/         Caddyfile, Caddyfile.local, garage.toml, backup.sh
```

## API

All under `/api`. Write routes require a session cookie and return 401 otherwise. Errors are `{ "error": string }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/home` | Stats, recent builds, recent threads |
| GET | `/builds?sort=new\|top&user=&limit=` | Gallery |
| POST | `/builds` | Publish `{ name, description, bowl, imageUrl?, thumbUrl?, templateId? }` |
| GET / PATCH / DELETE | `/builds/:id` | Detail with comments; edit name, description, cover; delete (owner only) |
| POST | `/builds/:id/like` | Toggle like |
| POST | `/builds/:id/comments` | Add comment |
| DELETE | `/comments/:id` | Delete own comment |
| GET / POST | `/forum/threads?category=` | List, create |
| GET / DELETE | `/forum/threads/:id` | Thread with posts; delete own |
| POST | `/forum/threads/:id/posts` | Reply |
| DELETE | `/forum/posts/:id` | Delete own reply |
| GET | `/users/:id` | Profile, builds, threads |
| PATCH | `/me` | Update name and bio |
| POST | `/uploads` | Multipart photo, max 8 MB. Returns `{ imageUrl, thumbUrl }` |
| * | `/auth/*` | Better Auth |

## Deploy

Everything except outbound email runs in containers on one host: the app, `sqld`, Garage, and Caddy. Required: a VPS or home machine with Docker and the Compose plugin, and a domain with A records for `yourdomain.tld` and `img.yourdomain.tld`.

### First deploy

1. `cp .env.example .env` and set at least `DATABASE_URL=http://sqld:8080`, `S3_ENDPOINT=http://garage:3900`, `S3_PUBLIC_URL=https://img.yourdomain.tld`, `BETTER_AUTH_URL=https://yourdomain.tld`, and `BETTER_AUTH_SECRET` (`openssl rand -base64 32`). Leave the S3 key pair blank for now.
2. In `deploy/Caddyfile`, replace the two `yourdomain.tld` placeholders.
3. In `deploy/garage.toml`, replace `rpc_secret` (`openssl rand -hex 32`).
4. `docker compose up -d --build`
5. Garage one-time setup. The image has no shell; its binary is `/garage`.
   ```bash
   docker compose exec garage /garage status                                   # note the node ID
   docker compose exec garage /garage layout assign -z dc1 -c 10G <node-id>
   docker compose exec garage /garage layout apply --version 1
   docker compose exec garage /garage bucket create ramen-uploads
   docker compose exec garage /garage bucket website --allow ramen-uploads
   docker compose exec garage /garage key create ramen-app                     # prints key ID and secret
   docker compose exec garage /garage bucket allow --read --write ramen-uploads --key ramen-app
   ```
   Put the key ID and secret into `.env`, then `docker compose up -d app`.

Caddy obtains certificates on the first request to each domain.

### Local full-stack test

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Serves `http://localhost` (app) and `http://localhost:8081` (Garage web endpoint) over plain HTTP. Set `S3_PUBLIC_URL=http://localhost:8081` and `BETTER_AUTH_URL=http://localhost` in `.env`, and run the Garage setup above.

### Backups

`deploy/backup.sh` runs `restic backup` on the `sqld-data`, `garage-meta`, and `garage-data` volumes from a throwaway container, then `restic forget --keep-daily 14 --keep-weekly 8 --prune`. It needs `RESTIC_REPOSITORY` and `RESTIC_PASSWORD` in the environment.

```cron
0 3 * * * RESTIC_REPOSITORY=... RESTIC_PASSWORD=... /path/to/deploy/backup.sh >> /var/log/ramen-backup.log 2>&1
```

Nothing is stopped during the backup. Both stores use a write-ahead log, so the result is crash-consistent but not transaction-consistent.

### Rate limits

Counters live in the app process and reset on restart.

| Tier | Limit | Applies to |
| --- | --- | --- |
| `api-global` | 300 / minute per IP | Every `/api/*` request |
| `auth-signup` | 5 / hour per IP | `POST /api/auth/sign-up/email` |
| `auth-signin` | 10 / 15 min per IP | `POST /api/auth/sign-in/email` |
| `auth-other` | 60 / minute per IP | Other `/api/auth/*` |
| `uploads` | 20 / hour per user, else IP | `POST /api/uploads` |
| `writes` | 60 / 15 min per user, else IP | Other write routes |

Limited requests return 429 with a `Retry-After` header. Compose sets `TRUST_PROXY=1` because Caddy fronts the app. `RATE_LIMIT_DISABLED=1` turns limiting off for load tests.

## Adding a part

Append to the matching array in `shared/ingredients.ts` with `price`, `minutes`, `kcal`, `sodium`, a `diet` category, `gluten`, and a `serving` (ml, g, pieces, or three named portion levels). Price, kcal, and sodium are for the default serving. A new topping also needs a glyph in `src/components/bowl/ToppingGlyph.tsx` (60×60 viewBox). Add a rule in `src/lib/compat.ts` if the part conflicts with others.

## Not built yet

- Social sign-in
- Password reset, and enforcing email verification
- Moderation: reporting, admin role
- Notifications
- Cleanup of uploaded images no build references
- Prices by vendor or region
