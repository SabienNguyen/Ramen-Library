# Ramen Library 🍜

**PCPartPicker, but for ramen.**

Pick a broth, a tare, noodles, an aroma oil and toppings from a parts catalogue with real specs (price, prep time, calories, sodium, diet tags). A compatibility checker flags builds that don't work — thin noodles under miso, butter on a clear broth, more toppings than the broth can carry. Totals update live, the bowl renders as you go, and finished builds save to a library or share as a permalink.

## How it maps

| PCPartPicker | Ramen Library |
| --- | --- |
| Component slots (CPU, GPU, …) | Broth, tare, noodles, aroma oil, toppings (multiple) |
| Parts list with specs & prices | `src/data/ingredients.ts` — price, minutes, kcal, sodium, tags |
| Compatibility checker | `src/lib/compat.ts` — errors, warnings, notes per slot |
| Wattage vs. PSU | Topping "body" vs. broth richness |
| Price total | Price, prep time, calories, sodium totals |
| Saved / completed builds | Library tab, localStorage |
| Permalink | `#b=broth.tare.noodle.oil.topping,topping` |

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # typecheck + production build into dist/
pnpm lint       # oxlint
```

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build | Vite 8 + React 19 + TypeScript | Instant HMR, no framework tax for a client-only app |
| Styling | Tailwind CSS v4 | CSS-first config, `@theme` tokens, tiny output |
| Primitives | Base UI (`@base-ui-components/react`) | The primitive layer shadcn/ui now defaults to; accessible, headless |
| Components | shadcn/ui-style, hand-written in `src/components/ui` | Owned code, not a dependency |
| Motion | Motion (`motion/react`) | Springs, layout animation, drag — the toppings physics |
| State | Zustand + `persist` | Bowl + library, saved to `localStorage` |
| Icons | Lucide | The shadcn default |

See [`docs/UI_LIBRARY_RESEARCH.md`](docs/UI_LIBRARY_RESEARCH.md) for what was considered and why.

## Layout

```
src/
  components/
    ui/         button, card, badge, input, tabs, dialog, slider, tooltip
    build/      BuildTable (the build sheet), PartPickerDialog (sortable parts table), BuildSummary + CompatBar
    bowl/       BowlCanvas (SVG preview + draggable toppings), ToppingGlyph
    library/    LibraryGrid (saved builds)
  data/         ingredients.ts — the parts catalogue and slot metadata
  store/        bowl.ts — zustand store (current build + saved library)
  lib/          compat.ts (rules), totals.ts, share.ts (permalinks), naming.ts, colour helpers
```

## Adding a part

Append to the right array in `src/data/ingredients.ts` with its specs. A new topping also needs a glyph in `src/components/bowl/ToppingGlyph.tsx` (60×60 viewBox). Add a rule to `src/lib/compat.ts` if the part has opinions about what it pairs with.

## Roadmap ideas

- Price by vendor / region and a "where to buy" column
- Regional presets (Hakata, Sapporo, Tokyo, Kitakata, Kumamoto) as starter builds
- Export a build as a PNG or a shopping list
- A real recipe view: quantities, timings, and the method behind each layer
