# Ramen Library 🍜

**PCPartPicker, but for ramen.**

Pick a broth, a tare, noodles, an aroma oil and toppings from a parts catalogue with real specs (price, prep time, calories, sodium, diet tags). A compatibility checker flags builds that don't work — thin noodles under miso, butter on a clear broth, more toppings than the broth can carry. Totals update live and the bowl renders as you go.

Then publish it. Accounts, a community gallery with likes and comments, a forum, user profiles — the whole site, backed by a small API and a SQLite file.

Every published build gets a cover: a photo you upload (resized and re-encoded to WebP on the server), or one of five illustrated templates that tint themselves to your broth for people who haven't shot the bowl yet.

## Design

"Warm paper." Cream ground, white rounded cards, chili red as the one loud colour, yolk and scallion as friendly secondaries. Nunito for text, Fraunces for headlines. Categories are colour-coded so the forum scans at a glance. Tokens live in `src/index.css`; a dark palette is kept under `.dark` for a future toggle.

## How it maps

| PCPartPicker | Ramen Library |
| --- | --- |
| Component slots (CPU, GPU, …) | Broth, tare, noodles, aroma oil, toppings (multiple) |
| Parts list with specs & prices | `src/data/ingredients.ts` — price, minutes, kcal, sodium, tags |
| Compatibility checker | `src/lib/compat.ts` — errors, warnings, notes per slot |
| Wattage vs. PSU | Topping "body" vs. broth richness |
| Price total | Price, prep time, calories, sodium totals |
| Saved builds | Drafts (localStorage) and published builds (database) |
| Completed builds gallery | `/builds` with likes and comments |
| Forums | `/forum` with categories, threads and replies |
| User profiles | `/u/:id` — builds, threads, bio |
| Permalink | `/builds/:id`, plus `#b=…` hash links for unpublished drafts |

## Run it

```bash
pnpm install
pnpm dev        # web on http://localhost:5173, API on :3000 (proxied under /api)
pnpm build      # typecheck + production build into dist/
pnpm start      # production: API + static site on :3000
pnpm lint       # oxlint
```

The SQLite database is created at `data/ramen.db` on first boot and migrations apply automatically. No setup.

Environment (all optional in dev):

| Var | Default | Purpose |
| --- | --- | --- |
| `DATABASE_FILE` | `data/ramen.db` | SQLite path |
| `UPLOAD_DIR` | `data/uploads` | Where photos are stored; served at `/uploads/*` |
| `BETTER_AUTH_SECRET` | dev placeholder | **Set this in production.** Signs sessions |
| `BETTER_AUTH_URL` | `http://localhost:5173` | Public origin of the site |
| `PORT` / `HOST` | `3000` / `127.0.0.1` | API bind |

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build | Vite 8 + React 19 + TypeScript | Instant HMR, no framework tax for a client-only app |
| Styling | Tailwind CSS v4 | CSS-first config, `@theme` tokens, tiny output |
| Primitives | Base UI (`@base-ui-components/react`) | The primitive layer shadcn/ui now defaults to; accessible, headless |
| Components | shadcn/ui-style, hand-written in `src/components/ui` | Owned code, not a dependency |
| Motion | Motion (`motion/react`) | Springs, layout animation, drag — the toppings physics |
| State | Zustand + `persist` | Current build + drafts, saved to `localStorage` |
| Routing | React Router (data router) | Loaders per page, `useRevalidator` after mutations |
| Icons | Lucide | The shadcn default |
| API | Hono on Node | Tiny, typed, Web-standard; `/api/*` |
| Auth | Better Auth | Email + password, cookie sessions, Drizzle adapter |
| Database | Drizzle ORM + SQLite (better-sqlite3) | One file, zero ops; swap the driver for Postgres/Turso later |
| Validation | Zod, shared between client and server | `shared/validation.ts` |

See [`docs/UI_LIBRARY_RESEARCH.md`](docs/UI_LIBRARY_RESEARCH.md) for what was considered and why.

## Layout

```
shared/         ingredients.ts (parts catalogue), bowl.ts (types), validation.ts (zod) — used by both sides
server/
  index.ts      Hono app: migrations, session middleware, auth handler, API, static serving
  routes.ts     /api — builds, likes, comments, forum, users, home
  auth.ts       Better Auth config
  db/           client.ts, schema.ts (+ generated auth-schema.ts), migrations/
src/
  pages/        Home, Builder, Drafts, Builds, Build, Forum/NewThread/Thread, Profile/Settings, Login/Signup
  components/
    ui/         button, card, badge, input, textarea, avatar, tabs, dialog, slider, tooltip
    build/      BuildTable, PartPickerDialog, BuildSummary + CompatBar, CoverArt (templates), CoverPicker (upload)
    bowl/       BowlCanvas (SVG preview + draggable toppings), ToppingGlyph
    social/     BuildCard, Discussion (comments and forum replies)
    site/       Layout (header/nav/footer), PageBits
    library/    LibraryGrid (drafts)
  store/        bowl.ts — zustand store (current build + drafts)
  lib/          api.ts, auth-client.ts, compat.ts, totals.ts, share.ts, naming.ts
```

## API

All under `/api`. Writes need a session cookie (401 otherwise).

| Method | Path | What |
| --- | --- | --- |
| GET | `/home` | Stats, fresh builds, recent threads |
| GET | `/builds?sort=new\|top&user=` | Gallery |
| POST | `/builds` | Publish `{ name, description, bowl }` |
| GET / DELETE | `/builds/:id` | Build with comments / delete own |
| POST | `/builds/:id/like` | Toggle like |
| POST | `/builds/:id/comments` · DELETE `/comments/:id` | Comments |
| GET / POST | `/forum/threads?category=` | List / create |
| GET / DELETE | `/forum/threads/:id` | Thread with posts / delete own |
| POST | `/forum/threads/:id/posts` · DELETE `/forum/posts/:id` | Replies |
| GET | `/users/:id` | Profile, builds, threads |
| PATCH | `/builds/:id` | Rename, edit description, change cover (owner) |
| POST | `/uploads` | Multipart photo → `{ imageUrl, thumbUrl }` (WebP, max 8 MB) |
| PATCH | `/me` | Update name and bio |
| * | `/auth/*` | Better Auth (sign-up, sign-in, session, sign-out) |

## Adding a part

Append to the right array in `src/data/ingredients.ts` with its specs. A new topping also needs a glyph in `src/components/bowl/ToppingGlyph.tsx` (60×60 viewBox). Add a rule to `src/lib/compat.ts` if the part has opinions about what it pairs with.

## Roadmap ideas

- Social sign-in (Google / GitHub) — Better Auth makes this a config change
- Email verification and password reset (needs a mail provider)
- Moderation: report, admin role, rate limits
- Notifications (someone commented on your build)
- Price by vendor / region and a "where to buy" column
- Regional presets as starter builds; export as PNG or shopping list
