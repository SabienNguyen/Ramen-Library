# Backend stack choices

What runs behind `/api`, why each piece was chosen, what it replaced or competed with, and what it costs. The original stack was Node, Hono, Drizzle, and better-sqlite3; the migration plan is in `SELF_HOSTED_STACK_PLAN.md`.

The governing constraint: **everything except outbound email must run on a machine you control, with no third-party accounts.** Every choice below was filtered through that first.

## Runtime: Bun

**Does here.** Runs `server/index.ts` directly, installs packages, runs the test suite (`bun test`), and serves as the Docker base image.

**Considered.** Node 22 (the previous runtime), Deno.

**Why Bun.** One binary covers runtime, package manager, and test runner, so the toolchain has no `tsx`, `concurrently`, or Jest equivalent. TypeScript runs without a compile step in dev and in the container. Elysia is written for Bun and is second-class on Node.

**Costs.** Smaller ecosystem of battle-tested production deployments than Node. Some native modules need checking: sharp and `@libsql/client` both work, but it was verified rather than assumed. Bun shares one module registry across test files in a run, which required care in tests that set environment variables before importing the database client.

## HTTP framework: Elysia

**Does here.** Routing, request validation, error mapping, and static serving. `server/app.ts` builds the app; `server/routes.ts` holds the 20 API routes.

**Considered.** Hono (the previous framework, also Web-standard and runtime-agnostic), Fastify, Express.

**Why Elysia.** The route definitions carry their types, so the client gets a typed API for free through Eden without a code generator or an OpenAPI step. Zod schemas from `shared/validation.ts` are passed straight into route definitions via the Standard Schema interface, so client and server validate with the same objects. Middleware composition through `.use()`, `.guard()`, and `.derive()` maps well to "attach session, then gate write routes".

**Costs.** Hook ordering is subtle. Validation runs before `beforeHandle`, so the auth guard had to be a `transform` hook to return 401 before a 400 on an anonymous request with a bad body. The `@elysiajs/static` plugin defaults to snapshotting the directory at boot in production, which broke serving of files uploaded after startup until `alwaysStatic: false` was set. Both were caught by tests, but they are the kind of thing Hono did not have.

## API client: Eden

**Does here.** `src/lib/api.ts` creates `treaty<App>(origin)` from the server's exported app type. Every page loader and mutation calls typed methods like `client.api.builds({ id }).like.post()`. Response types such as `BuildItem` and `ThreadItem` are inferred, not written.

**Considered.** Keeping the hand-written `fetch` wrapper with a parallel set of TypeScript types (the previous approach), tRPC, OpenAPI generation.

**Why Eden.** It removes a class of drift: a renamed field or changed response shape on the server fails the client typecheck immediately. It costs nothing at runtime beyond a thin proxy over `fetch`.

**Costs.** The client's `tsc` now type-checks server code through the type-only import, so the client tsconfig needs Bun types. Eden types the error status as `unknown` on routes without explicit error schemas, so a small `unwrap` helper narrows it and throws an `ApiError`.

## Validation: Zod 4

**Does here.** Bowl, build, comment, thread, post, and profile schemas in `shared/validation.ts`. The bowl schema includes a `superRefine` that checks each part's amount against its allowed range and names the part in the error.

**Considered.** TypeBox (Elysia's native schema library), Valibot.

**Why Zod.** The client forms already used it, and sharing one schema file between client and server is the whole point. Zod 4 implements Standard Schema, so Elysia accepts it directly.

**Costs.** Slightly larger bundle than Valibot. Elysia's validation error object for a Standard Schema failure had to be inspected to format the first issue as `path: message`.

## Auth: Better Auth

**Does here.** Email and password sign-up and sign-in, cookie sessions with a five-minute cookie cache, a `bio` field on users, and a verification email hook. Mounted at `/api/auth/*`.

**Considered.** Lucia (deprecated in favour of writing it yourself), Auth.js, rolling sessions by hand.

**Why Better Auth.** It owns the parts that are easy to get wrong: password hashing, session tokens, CSRF and origin checks, cookie attributes. It has a first-party Kysely adapter, so it shares the database connection with the app. Social sign-in later is configuration.

**Costs.** It dictates the auth table schema, including camelCase column names, which forced a fresh database when moving from the Drizzle adapter. Its dates are stored as ISO text while the app tables use integer milliseconds, so the row types differ per table. Origin checking is strict: `BETTER_AUTH_URL` must match how the site is actually served, and extra origins go in `TRUSTED_ORIGINS`.

## Query builder: Kysely

**Does here.** Every database read and write in `server/routes.ts`, plus the migration runner in `server/db/migrate.ts`. Table types are hand-written in `server/db/types.ts`.

**Considered.** Drizzle (the previous ORM), Prisma, raw SQL.

**Why Kysely.** It is a typed SQL builder rather than an ORM: joins, grouped counts, and JSON columns are written as SQL shapes with type inference, and nothing is hidden. It has no code generation and no runtime schema object. Better Auth supports it natively, so one client serves both.

**Costs.** No relational query helper. Drizzle's `with: { author: true }` became explicit joins with aliased columns and a reshaping step. Table types are maintained by hand and can drift from the migration; the type for auth date columns was wrong once and caught in review.

## Database: libSQL (SQLite) via sqld

**Does here.** All application and auth data. In dev, a file at `data/ramen.db` opened directly. In production, the `sqld` server in its own container, reached over HTTP at `http://sqld:8080`.

**Considered.** Plain SQLite through better-sqlite3 (the previous driver), PostgreSQL, Turso's hosted service.

**Why libSQL.** It is SQLite, which means a single file, no tuning, and reads that are faster than any networked database at this scale. libSQL adds a server mode, so the database can live in its own container with its own volume and the app can be rebuilt or duplicated without touching it. The same client library talks to a local file and to `sqld`, so dev and production differ by one environment variable. Turso's hosted offering was explicitly rejected because it requires an account.

**Costs.** Single writer. Writes serialize, which is fine for a forum's write rate but is the first thing to change if concurrent writers appear. No built-in replication, so backups are the safety net. Running `sqld` adds a container and a network hop that a bare file would not need; the trade was made for isolation, not performance. WAL mode and `busy_timeout` are set explicitly for file URLs because the libSQL client does not set them.

**When to move to Postgres.** More than one app instance writing, full-text search across posts, or a need for managed failover. Kysely has a Postgres dialect, so the change is the migration DDL and connection setup, not a rewrite.

## Image processing: sharp

**Does here.** Validates the MIME type and size, auto-rotates from EXIF, re-encodes to WebP at up to 1600 px, and produces an 800×600 cover-cropped thumbnail. Re-encoding also strips metadata.

**Considered.** Storing originals, client-side resizing, ImageMagick.

**Why sharp.** Fast, libvips-based, and the de facto Node/Bun choice. Server-side re-encoding means every stored image has a known format, size, and no metadata, regardless of what the browser sent.

**Costs.** Native binary. It needs glibc, so the Docker image is Debian-based rather than Alpine. CPU-heavy under a burst of uploads, which is why uploads have their own rate limit tier.

## Image storage: Garage, with a local-disk fallback

**Does here.** `server/storage.ts` exposes one `putObject` interface. When `S3_ENDPOINT` is set it writes to Garage through the AWS S3 SDK and returns a public URL under `S3_PUBLIC_URL`. Otherwise it writes under `data/uploads` and the app serves `/uploads/*` itself.

**Considered.** Local disk only, MinIO, a hosted bucket.

**Why Garage.** It is a small, self-hosted, S3-compatible object store that runs as one container with a plain config file. Images are outside the app container and its volume, so app rebuilds don't risk them and a second app instance sees the same files. Its web endpoint serves a bucket read-only, which Caddy fronts on the image subdomain. MinIO would work the same way but is heavier and its licensing direction was a concern.

**Costs.** More moving parts than a disk volume for a single-node deployment. One-time setup after first boot (layout, bucket, key). Garage's web endpoint picks the bucket from the Host header, so Caddy rewrites it. The server validates that cover URLs point at its own storage, since the upload URL rule also has to accept the S3 public host.

## Reverse proxy: Caddy

**Does here.** TLS termination with automatic Let's Encrypt certificates, proxying the site to the app and the image subdomain to Garage, and setting `X-Forwarded-For` for the rate limiter.

**Considered.** nginx with certbot, Traefik.

**Why Caddy.** Certificates are automatic with no cron job or sidecar. The whole config is a few lines. Traefik's label-driven model is more than three services need.

**Costs.** Fewer knobs than nginx if fine-grained caching or request buffering is ever needed.

## Rate limiting: in-process counters

**Does here.** `server/ratelimit.ts` keeps fixed-window counters per tier in a `Map`. Six tiers cover the global API, sign-up, sign-in, other auth routes, uploads, and writes. Keys are the client IP, or the user id for uploads and writes when signed in.

**Considered.** `elysia-rate-limit` (requires Elysia 2, the app is on 1.4), Redis-backed limiting, Caddy-level limiting (needs a plugin build).

**Why in-process.** No dependency and no extra service. Bounded memory through lazy eviction. Good enough for one app container, which is what the deployment is.

**Costs.** Counters reset on restart and are per-process, so multiple app instances would each count separately. It does nothing against a volumetric attack that saturates the network link; that is a job for something in front of the host.

## Email: Resend, optional

**Does here.** `server/email.ts` sends the verification email when `EMAIL_PROVIDER_KEY` is set and logs the link otherwise. Failures are logged and never fail sign-up.

**Considered.** Self-hosted SMTP, Postmark, SES.

**Why an external provider.** Deliverability from a fresh VPS IP is poor, and running mail is a discipline of its own. This is the one deliberate exception to self-hosting, and it is off by default.

**Costs.** Verification is not enforced yet, so accounts work without clicking the link.

## Testing

**Does here.** `bun test` runs unit tests for the catalogue, totals, validation, storage, and the limiter, plus integration tests that drive the whole Elysia app in-process with `app.handle()` against a temporary database file: sign-up, publish, like, comment, forum, profile, upload, rate limits, and error cases.

**Why in-process.** No port, no fixtures, no mocks for the database. A test run takes under a second. The app is exported without `.listen` specifically to allow this.

**Costs.** Bun shares module state across test files, so process-wide singletons like the database client and the upload directory are set once per run. Tests that need different environments set them before a dynamic import and avoid tearing down shared state.

## Summary table

| Concern | Choice | Replaces | Main trade-off |
| --- | --- | --- | --- |
| Runtime | Bun | Node + tsx | Smaller production track record |
| HTTP | Elysia | Hono | Subtle hook ordering |
| Client types | Eden | Hand-written types | Client typecheck includes server code |
| Validation | Zod 4 | Zod 3 | None significant |
| Auth | Better Auth | Better Auth (Drizzle adapter) | Dictates auth schema |
| Queries | Kysely | Drizzle | No relational helpers |
| Database | libSQL / sqld | better-sqlite3 file | Single writer, extra container |
| Images | sharp | sharp | Native binary, CPU under load |
| Object storage | Garage | Local disk | Setup steps, more services |
| Proxy | Caddy | none | Fewer knobs than nginx |
| Rate limits | In-process | none | Per-process counters |
| Email | Resend | none | External dependency, opt-in |
