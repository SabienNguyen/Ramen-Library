# Ramen Library 🍜

**A visual library for creating ramen.**

Build a bowl layer by layer — broth, tare, noodles, aroma oil, toppings — watch it render live, then save it to your library. Every ingredient comes with a one-line note, so the palette doubles as a field guide.

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
    bowl/       BowlCanvas (SVG + draggable toppings), IngredientPalette, RecipePanel, ToppingGlyph
    library/    LibraryGrid (saved bowls)
  data/         ingredients.ts — the catalogue (broths, tares, noodles, toppings, oils)
  store/        bowl.ts — zustand store (current bowl + saved library)
  lib/          cn(), colour mixing, bowl naming
```

## Adding an ingredient

Append to the right array in `src/data/ingredients.ts`. Broths/tares/oils are colour-driven and need nothing else. A new topping also needs a glyph in `src/components/bowl/ToppingGlyph.tsx` (60×60 viewBox).

## Roadmap ideas

- Drag from the palette straight into the bowl (dnd-kit or Motion `Reorder`)
- Share a bowl as a URL (encode the store state) and as a PNG
- Regional presets (Hakata, Sapporo, Tokyo, Kitakata, Kumamoto) as one-tap starting points
- A real recipe view: quantities, timings, and the actual method behind each layer
