# UI library research (Sept 2026)

Goal: pick a front-end stack for **Ramen Library**, "a visual library for creating ramen".
That phrase drives everything: it's an interactive *builder* (compose a bowl visually) plus a *library* (save, browse, reload bowls). Client-side, playful, animation-heavy, no SEO needs.

## What the cool kids are using

### Foundation layer

| Library | Verdict | Notes |
| --- | --- | --- |
| **shadcn/ui** | ✅ Pattern adopted | The default for new React apps; ~80% satisfaction in 2026 surveys. Copy-paste components you own. As of mid-2026 it defaults to **Base UI** for new projects; Radix is still supported. |
| **Base UI** (MUI team) | ✅ Used | The actively-maintained headless primitive layer. `render` prop composition, `data-starting-style` / `data-ending-style` for CSS transitions. Currently `1.0.0-rc`. |
| **Radix UI** | ⚪ Skipped | Still fine, but slowed since the WorkOS acquisition. No reason to start a new project on it. |
| **Ark UI / Park UI** | ⚪ Skipped | Great multi-framework story (React/Vue/Solid/Svelte), 200K+ weekly downloads, but we're React-only. |
| **Tailwind CSS v4** | ✅ Used | ~51% developer usage in State of CSS 2025; CSS-first `@theme`, no config file. |
| **MUI / Mantine / HeroUI / Chakra** | ⚪ Skipped | Great for dashboards/admin, but they impose a look. This app needs its own visual identity, not Material. |

### Animation

| Library | Verdict | Notes |
| --- | --- | --- |
| **Motion** (`motion/react`, formerly Framer Motion) | ✅ Used | Still the standard. Springs, `AnimatePresence`, `layout`, `drag` — exactly what draggable toppings need. |
| tailwindcss-animate / tw-animate-css | ✅ Used (light) | Enter/exit keyframes for Base UI popups. |
| GSAP / Anime.js | ⚪ Skipped | Overkill for UI-scale motion; GSAP shines for scroll-driven marketing pages. |

### "Wow" component collections (all built on shadcn + Tailwind + Motion)

These are where the eye-candy lives in 2026. They're all copy-paste registries, so they slot into this codebase later without a rewrite:

- **Magic UI** — 150+ animated bits (marquees, animated beams, bento grids, shimmer text). Polished, restrained.
- **Aceternity UI** — 200+ cinematic effects (3D cards, spotlight, glowing beams, particles). Bolder; good for a landing/hero.
- **Motion Primitives** — 50+ Motion-based building blocks (text effects, transitions, in-view reveals).
- **React Bits** — animated/interactive components with a strong "memorable website" bent.
- **Skiper UI**, **Cult UI**, **Velora UI** — smaller registries with distinctive aesthetics.

Recommended use: cherry-pick individual components (e.g. a shimmer button, an in-view reveal for the library grid) rather than adopting a whole registry.

### Interaction

| Library | Verdict | Notes |
| --- | --- | --- |
| **dnd-kit** | ⏳ Later | Community default for drag-and-drop (~2.8M weekly downloads). Reach for it when we do palette → bowl dragging with proper drop zones and keyboard support. |
| Pragmatic drag-and-drop (Atlassian) | ⏳ Later | Tinier and faster, less opinionated, younger docs. |
| Motion `drag` | ✅ Used now | Enough for "rearrange toppings inside the bowl". |

### Framework / routing

| Option | Verdict |
| --- | --- |
| **Vite + React (SPA)** | ✅ Chosen. The app is client-only and interactive; SSR/RSC buys nothing. Sub-second cold start. |
| TanStack Start | Good next step if we ever add a backend (server functions, type-safe routes) — it's Vite underneath, so migration is cheap. |
| Next.js | Safe, staffable, but RSC-first is the wrong shape for an editor. |
| React Router v7 framework mode | Fine, but we don't need routes yet. |

### 3D?

React Three Fiber + drei would make a genuinely stunning bowl. Deliberately parked: it's a big bundle and a big skill jump, and a well-layered SVG bowl already reads as "ramen" at a glance. Revisit once the 2D builder is loved.

## The stack we shipped

```
Vite 8 · React 19 · TypeScript · Tailwind v4 · Base UI · shadcn-style components · Motion · Zustand · Lucide
```

## Sources

- [15 Best React UI Libraries for 2026 — Builder.io](https://www.builder.io/blog/react-component-libraries-2026)
- [15 Best React UI Component Libraries in 2026 — Untitled UI](https://www.untitledui.com/blog/react-component-libraries)
- [shadcn/ui vs Base UI vs Radix: Components in 2026 — PkgPulse](https://www.pkgpulse.com/guides/shadcn-ui-vs-base-ui-vs-radix-components-2026)
- [shadcn vs Radix vs Base UI: Which One Should a Junior Pick in 2026? — DEV](https://dev.to/edriso/shadcn-vs-radix-vs-base-ui-which-one-should-a-junior-pick-in-2026-1jml)
- [Top Headless UI libraries for React in 2026 — GreatFrontEnd](https://www.greatfrontend.com/blog/top-headless-ui-libraries-for-react-in-2026)
- [Tailwind 4 + Framer Motion + shadcn/ui: Indie SaaS Stack](https://www.buildmvpfast.com/blog/tailwind-framer-motion-shadcn-ui-indie-saas-design-stack-2026)
- [Comparing the best React animation libraries for 2026 — LogRocket](https://blog.logrocket.com/best-react-animation-libraries/)
- [Aceternity UI vs Magic UI vs shadcn/ui 2026 — PkgPulse](https://www.pkgpulse.com/guides/aceternity-ui-vs-magic-ui-vs-shadcn-animated-react-2026)
- [21 Best Shadcn Component Libraries in 2026 — ShadcnDeck](https://www.shadcndeck.com/blog/shadcn-component-libraries)
- [React Bits](https://reactbits.dev/) · [Skiper UI](https://skiper-ui.com/components)
- [dnd-kit vs react-beautiful-dnd vs Pragmatic DnD 2026 — PkgPulse](https://www.pkgpulse.com/guides/dnd-kit-vs-react-beautiful-dnd-vs-pragmatic-drag-drop-2026)
- [Top 5 Drag-and-Drop Libraries for React in 2026 — Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [TanStack Start vs Next.js in 2026 — Makerkit](https://makerkit.dev/blog/tutorials/tanstack-start-vs-nextjs)
- [Vite vs Next.js 2026 — DesignRevision](https://designrevision.com/blog/vite-vs-nextjs)
