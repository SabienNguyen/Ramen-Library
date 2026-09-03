# Self-hosted stack migration plan

Status: **plan only, no code changed yet.** `main` still runs the Node / Hono / Drizzle / SQLite-file stack described in the README.

This document is the agreed target and the order of work, written so it can be executed locally step by step. Each step ends with the full browser flow passing (register, publish with photo, like, comment, new thread, reply, edit profile, sign out, sign in).

## Target stack

Everything self-hosted except outbound email.

| Layer | Now (`main`) | Target |
| --- | --- | --- |
| Runtime | Node 22 | Bun |
| API framework | Hono | Elysia |
| API client | Hand-written `fetch` wrapper + types | Eden (Elysia's typed client) |
| Validation | Zod, shared | Zod, shared, passed to Elysia routes via Standard Schema |
| Auth | Better Auth, Drizzle adapter | Better Auth, Kysely adapter |
| Query layer | Drizzle ORM | Kysely |
| Migrations | drizzle-kit | Kysely `Migrator` |
| DB driver | better-sqlite3 | `@libsql/client` |
| Database | SQLite file | libSQL. Local file in dev, `sqld` container in production |
| Image processing | sharp | sharp (unchanged) |
| Image storage | Local disk | Garage (S3-compatible) in production, local disk in dev |
| Server data on client | React Router loaders | React Router loaders + TanStack Query |
| Client state | Zustand | Zustand (unchanged) |
| Build tool | Vite | Vite (unchanged) |
| Styling / UI | Tailwind v4, Base UI components | Unchanged |

Infrastructure:

| Need | Choice |
| --- | --- |
| Host | Any VPS (Hetzner CX22 or similar) or a home machine |
| Containers | Docker Compose: `app`, `sqld`, `garage`, `caddy` |
| Reverse proxy + TLS | Caddy with automatic Let's Encrypt |
| DNS | Registrar, or Cloudflare's free DNS (no other Cloudflare product needed) |
| Backups | Nightly `restic` job for the sqld and Garage volumes to an off-machine target |
| Monitoring | Uptime Kuma (optional) |
| Email | Transactional provider (Resend / Postmark / SES) via Better Auth's send hook. Off until configured. |

## What is open source vs. rented

- Open source, runs in your containers: Bun, Elysia, Kysely, libSQL + sqld, Garage, Caddy, Better Auth, sharp, everything on the client.
- Rented: the VPS, a domain, and (optionally) an email provider.
- No accounts required with Turso, Cloudflare, AWS, or anyone else.

## Dependencies

Add:

```
elysia @elysiajs/static @elysiajs/eden
kysely @libsql/client @libsql/kysely-libsql
@aws-sdk/client-s3
@tanstack/react-query
-D @types/bun
```

Remove:

```
hono @hono/node-server @hono/zod-validator
drizzle-orm drizzle-kit
better-sqlite3 @types/better-sqlite3
tsx concurrently
```

Keep: `better-auth`, `sharp`, `zod`, `react-router`, `zustand`, everything client-side.

`package.json` scripts become:

```json
{
  "dev": "bun run --watch server/index.ts & vite",
  "dev:api": "bun run --watch server/index.ts",
  "dev:web": "vite",
  "build": "tsc -b && vite build",
  "start": "NODE_ENV=production bun run server/index.ts",
  "lint": "oxlint",
  "db:migrate": "bun run server/db/migrate.ts",
  "auth:generate": "bunx @better-auth/cli@latest generate --config server/auth.ts -y"
}
```

Remove the `pnpm.onlyBuiltDependencies` block (it existed for better-sqlite3).

## Environment variables

`.env.example` to commit; `.env` stays ignored.

| Variable | Dev default | Production |
| --- | --- | --- |
| `DATABASE_URL` | `file:data/ramen.db` | `http://sqld:8080` |
| `DATABASE_AUTH_TOKEN` | empty | token if sqld is started with auth, else empty |
| `S3_ENDPOINT` | empty → local disk | `http://garage:3900` |
| `S3_REGION` | | `garage` |
| `S3_BUCKET` | | `ramen-uploads` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | | from `garage key create` |
| `S3_PUBLIC_URL` | | `https://img.yourdomain.tld` (Caddy → Garage web endpoint) |
| `BETTER_AUTH_SECRET` | dev placeholder | 32+ random bytes, required |
| `BETTER_AUTH_URL` | `http://localhost:5173` | `https://yourdomain.tld` |
| `PORT` / `HOST` | `3000` / `127.0.0.1` | `3000` / `0.0.0.0` |
| `EMAIL_PROVIDER_KEY` | empty → verification off | provider API key |

## Files that change

### Rewritten

**`server/db/client.ts`**
```ts
import { createClient } from '@libsql/client'
import { Kysely } from 'kysely'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import type { DB } from './types'

export const libsql = createClient({
  url: process.env.DATABASE_URL ?? 'file:data/ramen.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
})
export const db = new Kysely<DB>({ dialect: new LibsqlDialect({ client: libsql }) })
```

**`server/db/types.ts`** (replaces `schema.ts`)
A Kysely `DB` interface: one interface per table listing column types. Nine tables:
`user`, `session`, `account`, `verification` (Better Auth) and `builds`, `build_likes`, `build_comments`, `forum_threads`, `forum_posts` (app). Column names stay exactly as in the current migrations so the existing SQLite file can be reused as-is in dev.

Note on Better Auth column naming: the current Drizzle schema uses snake_case columns (`email_verified`, `created_at`, …) because the Drizzle adapter mapped them. Better Auth's Kysely adapter expects camelCase by default. Two options; pick **A**:
- **A.** Regenerate the auth tables with `bunx @better-auth/cli generate` against the Kysely config. It emits SQL with camelCase columns. Use that for the four auth tables in the initial migration and start from a fresh database. Cleanest.
- **B.** Keep snake_case and map every field with `fieldName` in `server/auth.ts`. Verbose, avoids a data reset.
Data on `main` is test data only, so A is fine. Check the generated SQL includes `issuer` on `account`; the CLI once lagged the library and omitted it.

**`server/db/migrations/`**
Delete Drizzle's SQL + `meta/`. Add Kysely migrations as TypeScript modules:
- `0001_init.ts` — `up()` runs the CREATE TABLE / CREATE INDEX statements for all nine tables via `sql` template. Copy the app tables from the old `0000_*.sql` and `0001_*.sql` (builds includes `image_url`, `thumb_url`, `template_id`); take the auth tables from the Better Auth CLI output.
- `index.ts` — a `MigrationProvider` that returns `{ '0001_init': m0001 }` (static imports, no filesystem scan, so it bundles cleanly).

**`server/db/migrate.ts`**
```ts
const migrator = new Migrator({ db, provider })
const { error, results } = await migrator.migrateToLatest()
```
Called from `server/index.ts` at boot and runnable standalone via `bun run db:migrate`.

**`server/auth.ts`**
Same options as today; adapter changes to the Kysely instance:
```ts
database: { db, type: 'sqlite' },
```
`emailAndPassword`, `additionalFields.bio`, `trustedOrigins`, cookie cache all stay. Add `emailVerification.sendVerificationEmail` wired to a small `server/email.ts` that no-ops when `EMAIL_PROVIDER_KEY` is empty.

**`server/index.ts`**
```ts
new Elysia()
  .onError(...)                                  // ApiError → { error }, Zod → 400 with first issue
  .derive(async ({ request }) => {               // session on every request
    const s = await auth.api.getSession({ headers: request.headers })
    return { user: s?.user ?? null }
  })
  .all('/api/auth/*', ({ request }) => auth.handler(request))
  .use(api)                                      // from routes.ts
  .use(staticPlugin({ assets: 'data/uploads', prefix: '/uploads' }))   // only when S3 not configured
  .use(staticPlugin({ assets: 'dist', prefix: '/' }))                  // production only
  .get('*', () => Bun.file('dist/index.html'))                         // SPA fallback, production only
  .listen({ port, hostname })
export type App = typeof app                     // for Eden
```
Run migrations before `listen`.

**`server/routes.ts`**
Same 25 endpoints, same paths, same request/response JSON. Changes:
- Elysia route syntax; `body: publishBuildSchema` etc. on each route (Zod via Standard Schema). Drop the `zValidator` helper.
- `authed` becomes a guard: `.guard({ beforeHandle: ({ user }) => { if (!user) throw new ApiError(401, 'Sign in to do that.') } }, app => …)` around the write routes.
- Every query rewritten in Kysely. The relational "with author / with comments" queries become explicit joins:
  - `builds` list: `selectFrom('builds').innerJoin('user', 'user.id', 'builds.user_id').select([...])` with author columns aliased, `orderBy('builds.created_at', 'desc')`.
  - Counts: keep the two grouped count queries (`build_likes`, `build_comments`) and the liked-set query, merged in memory as today.
  - Build detail: build + author in one query; comments joined to authors in a second, ordered by `created_at`.
  - Threads: same pattern; posts joined to authors.
  - `bowl` is stored as a JSON string: `JSON.stringify` on insert, `JSON.parse` on read (add a tiny `parseBuild` helper).
  - Timestamps: store as integer ms like today; convert with `new Date()` on read for the API JSON.
- `server/uploads.ts`: see storage below.

**`server/uploads.ts` → `server/storage.ts` + `server/uploads.ts`**
`storage.ts` exports `putObject(key, bytes, contentType): Promise<string /* public URL */>` with two implementations chosen at startup:
- S3 (Garage) when `S3_ENDPOINT` is set: `new S3Client({ endpoint, region, credentials, forcePathStyle: true })`, `PutObjectCommand`, returns `${S3_PUBLIC_URL}/${key}`.
- Local disk otherwise: writes to `data/uploads/`, returns `/uploads/${key}`.
`uploads.ts` keeps the sharp pipeline exactly as today (validate → rotate → 1600px WebP + 800×600 thumb) and calls `putObject` twice.

`shared/validation.ts`: the `uploadUrl` regex currently requires `/uploads/…webp`. Relax to "either `/uploads/<uuid>(.thumb).webp` or `${S3_PUBLIC_URL}/<uuid>(.thumb).webp`". Simplest: validate the path portion only and let the server prefix the public URL on read.

**`src/lib/api.ts`**
Replace the fetch wrapper with Eden:
```ts
import { treaty } from '@elysiajs/eden'
import type { App } from '../../server/index'
export const client = treaty<App>(window.location.origin)
```
Delete the hand-written `BuildItem`, `ThreadItem`, … types; infer from the server. Keep `timeAgo` and `uploadPhoto` (Eden handles multipart via `{ file }`).
`tsconfig.app.json` needs `"types": ["vite/client", "bun"]` so the type-only server import checks under the client config.

### Lightly touched

- `vite.config.ts`: keep the `/api` proxy; keep `/uploads` proxy for dev-only local storage.
- Page files: loaders call `client.api.builds.get()` etc. `BuildPage` like button → TanStack Query mutation with optimistic update. Wrap the app in `QueryClientProvider` in `main.tsx`.
- `README.md`: new run instructions, env table, deployment section.

### Untouched

`src/components/**`, `src/store/**`, `src/lib/compat.ts`, `src/lib/totals.ts`, `src/lib/share.ts`, `shared/ingredients.ts`, `shared/bowl.ts`, all styling.

## Deployment files to add

**`Dockerfile`**
```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* pnpm-lock.yaml* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["bun", "run", "server/index.ts"]
```
(sharp needs glibc; `oven/bun:1-slim` is Debian-based, fine. Do not use the Alpine image.)

**`docker-compose.yml`**
```yaml
services:
  app:
    build: .
    env_file: .env
    depends_on: [sqld, garage]
    restart: unless-stopped
  sqld:
    image: ghcr.io/tursodatabase/libsql-server:latest
    command: ["sqld", "--http-listen-addr", "0.0.0.0:8080"]
    volumes: ["sqld-data:/var/lib/sqld"]
    restart: unless-stopped
  garage:
    image: dxflrs/garage:v1
    volumes:
      - ./deploy/garage.toml:/etc/garage.toml:ro
      - garage-meta:/var/lib/garage/meta
      - garage-data:/var/lib/garage/data
    restart: unless-stopped
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on: [app]
    restart: unless-stopped
volumes: { sqld-data: {}, garage-meta: {}, garage-data: {}, caddy-data: {}, caddy-config: {} }
```

**`deploy/Caddyfile`**
```
yourdomain.tld {
  reverse_proxy app:3000
}
img.yourdomain.tld {
  reverse_proxy garage:3902   # Garage's web endpoint serving the bucket read-only
}
```

**`deploy/garage.toml`** — single-node config: `replication_factor = 1`, `s3_api.api_bind_addr = "0.0.0.0:3900"`, `s3_web.bind_addr = "0.0.0.0:3902"`, `s3_web.root_domain = ".img.yourdomain.tld"`, an `rpc_secret`.

One-time Garage setup after first `docker compose up`:
```
docker compose exec garage garage status                     # note node id
docker compose exec garage garage layout assign -z dc1 -c 10G <node-id>
docker compose exec garage garage layout apply --version 1
docker compose exec garage garage bucket create ramen-uploads
docker compose exec garage garage bucket website --allow ramen-uploads
docker compose exec garage garage key create ramen-app        # prints key id + secret → .env
docker compose exec garage garage bucket allow --read --write ramen-uploads --key ramen-app
```

**`deploy/backup.sh`** — `restic backup` of the `sqld-data`, `garage-meta`, `garage-data` volumes to a repository of your choice (another machine, Backblaze, Hetzner Storage Box), plus `restic forget --keep-daily 14 --keep-weekly 8`. Run from cron on the host.

**`.env.example`** — every variable above with comments.

## Order of work

1. **Branch** from `main`.
2. **Runtime + framework.** Bun, Elysia, routes ported, still on the local SQLite file through `@libsql/client` (temporarily keep Drizzle if you want to split the step). Run the browser flow.
3. **Query layer.** Kysely, migrations, Better Auth Kysely adapter, fresh database. Browser flow.
4. **Storage abstraction.** `storage.ts` with local + S3 implementations. Test S3 path against a local Garage container (`docker run dxflrs/garage:v1`). Browser flow with photo upload.
5. **Client.** Eden client, delete hand-written types, TanStack Query for the like button. Typecheck + browser flow.
6. **Deployment files.** Dockerfile, compose, Caddyfile, garage.toml, backup script, `.env.example`. `docker compose up` locally and run the browser flow against `http://localhost` through Caddy.
7. **Docs.** README run + deploy sections. Push branch, open PR against `main`.

Rough effort: steps 2–3 half a day, 4–5 a couple of hours, 6 a couple of hours the first time.

## Things to watch

- **Better Auth column names** (see above). Decide A before writing the migration.
- **Elysia + Zod**: Elysia ≥ 1.3 accepts Standard Schema validators directly in `body:`; if the version installed complains, wrap with `t.Unsafe` or move the shared schemas to TypeBox.
- **Eden + client typecheck**: the type-only import of `App` pulls server types into `tsc -b` for the client. Add `"bun"` to the client `types` array. If it gets slow, export the `App` type from a small `server/app-type.ts`.
- **sharp on Bun**: works; run `bun -e "require('sharp')"` once after install to confirm the prebuilt binary loaded.
- **`@libsql/client` on Bun**: local `file:` URLs use a native module; `http://` URLs are pure fetch. Both work on Bun 1.1+.
- **Elysia on Node** is second-class; this plan assumes Bun everywhere.
- **Orphaned uploads**: unchanged from today. Add a weekly job later that deletes objects not referenced by any build.
- **Rate limiting**: still absent. `@elysiajs/rate-limit` is a one-line add once the port is done; do it before going public.

## Migrating existing data (only if you care about the test data on `main`)

- Database: `sqlite3 data/ramen.db .dump` → adjust auth column names to camelCase → `turso db shell` / `sqld` HTTP import, or just start fresh.
- Images: `aws s3 cp data/uploads/ s3://ramen-uploads/ --recursive --endpoint-url http://localhost:3900`.
