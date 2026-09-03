# Quantities per bowl and bowl-level diet badges

Date: 2026-09-03. Status: approved design.

## Goal

1. Every part in a bowl has an amount the user can adjust in the builder: liquids in ml, noodles in g, toppings as a piece count or a named portion. Price, calories and sodium scale with the amount.
2. Diet labels (vegan, vegetarian, gluten) are shown once per bowl, computed from the parts. Individual ingredients no longer display diet chips.

No existing data needs preserving. Published builds and drafts on any current database are discarded.

## Catalogue changes (`shared/ingredients.ts`)

Remove `tags: Tag[]` and the `Tag` type from `PartBase`. Add:

```ts
export type Diet = 'plant' | 'egg' | 'dairy' | 'fish' | 'chicken' | 'pork'

export type Serving =
  | { unit: 'ml' | 'g' | 'piece'; amount: number; min: number; max: number; step: number }
  | { unit: 'portion'; levels: readonly [string, string, string]; amount: 0 | 1 | 2 }

export type PartBase = {
  id: string; name: string; jp?: string; note: string
  /** USD, kcal and mg sodium are all for `serving.amount` (or the middle portion level) */
  price: number; minutes: number; kcal: number; sodium: number
  diet: Diet
  gluten: boolean
  serving: Serving
}
```

Rules for `serving` by slot:

| Slot | Unit | Default | Range / step |
| --- | --- | --- | --- |
| Broth | ml | 400 | 200–600, step 50 |
| Tare | ml | 30 | 10–60, step 5 |
| Aroma oil | ml | 10 | 0–30, step 5 (0 allowed: a trace) |
| Noodles | g | 130 (tsukemen 200) | 80–250, step 10 |
| Countable toppings (chashu, ajitama, nori, naruto, bokchoy) | piece | per part | 1–6, step 1 |
| Portion toppings (negi, menma, corn, sprouts, kikurage, chili, garlic, sesame, butter) | portion | `amount: 1` | levels per part, e.g. negi `['pinch', 'handful', 'heap']` |

Scale factor for a chosen amount: `amount / serving.amount` for numeric units. For portions: level 0 = 0.5, level 1 = 1, level 2 = 1.75. `minutes` never scales. `price`, `kcal`, `sodium` scale linearly.

Diet assignments: all broths except tonkotsu/paitan/chintan/gyokai are `plant` (kombu, miso-base); tonkotsu `pork`; paitan and chintan `chicken`; gyokai `fish`. Tares are `plant`. Noodles are `plant` with `gluten: true`. Oils: chicken `chicken`, niboshi `fish`, mayu and rayu `plant`. Toppings: chashu `pork`, ajitama `egg`, naruto `fish`, butter `dairy`, rest `plant`. `tagLabel` is replaced by `dietLabel: Record<Diet, string>`.

Export a helper in `shared/ingredients.ts`:

```ts
export function scaleFactor(part: PartBase, amount: number | undefined): number
export function formatAmount(part: PartBase, amount: number | undefined): string   // "400 ml", "2 pcs", "handful"
```

## Bowl shape (`shared/bowl.ts`)

```ts
export type PlacedTopping = { key: string; toppingId: string; x: number; y: number; rotation: number; qty?: number }
export type Bowl = {
  brothId: string | null; tareId: string | null; noodleId: string | null; oilId: string | null
  brothMl?: number; tareMl?: number; noodleG?: number; oilMl?: number
  toppings: PlacedTopping[]
}
```

A missing amount means the part's default `serving.amount`. For portion toppings `qty` is the level index 0–2; for countable toppings it is the piece count.

## Totals (`src/lib/totals.ts`)

`computeTotals` multiplies each part's `price`, `kcal`, `sodium` by `scaleFactor(part, amount)`. `minutes` is summed unscaled. Body load from toppings scales with the same factor so a heap of chashu weighs more than one slice.

`Totals.tags` is removed. `Totals.diet` stays (`'vegan' | 'vegetarian' | 'omnivore'`): vegan when every part is `plant`; vegetarian when every part is `plant`, `egg` or `dairy`; otherwise omnivore. Add `Totals.gluten: boolean` (any part has `gluten`).

## Builder UI

- `BuildTable`: remove the tag chips column content. Add an Amount column between Selection and kcal. Numeric units render a stepper (−, value with unit, +) bound to the store; portion toppings render a three-segment toggle with the level names. kcal, sodium and price cells show scaled values.
- `PartPickerDialog`: remove tag chips per row. Keep the diet filter (all / vegetarian / vegan), now driven by `diet`. Show the default serving in the name cell, e.g. "Chashu · 2 pcs".
- Summary panel (`BuildSummary`): keep the single diet badge, add a "Gluten" badge when `totals.gluten`.
- `BowlCanvas`: countable toppings with `qty > 1` show a small "×N" badge at the glyph's corner. No change for portions.
- `store/bowl.ts`: add `setAmount(slot, value)` and `setToppingQty(key, value)`; `addTopping` sets no qty (default). Share hash (`share.ts`) stays as is: amounts are not encoded, shared links open with defaults.

## Build detail page (`BuildPage`)

The parts table shows the amount next to each part name and scaled kcal/sodium/price. Remove tag chips. The sidebar keeps the diet badge and adds Gluten.

## Validation (`shared/validation.ts`)

`bowlSchema` gains `brothMl`, `tareMl`, `noodleG`, `oilMl` as optional numbers 0–1000, and `toppings[].qty` as optional integer 0–6. Range checks against each part's serving happen in a `.superRefine` so a chashu count of 9 or a broth of 900 ml is rejected with a message naming the part.

## Server

No schema migration: `bowl` is a JSON column. `server/routes.test.ts` publish payloads gain amounts and one test asserts an out-of-range amount returns 400.

## Testing

- `src/lib/totals.test.ts` (new, bun test): scaling of kcal/price/sodium, minutes unscaled, portion factors, diet and gluten computation.
- `shared/validation.test.ts`: amount bounds and per-part range refinement.
- `server/routes.test.ts`: publish with amounts round-trips; out-of-range rejected.
- Manual: builder stepper changes totals live; build detail shows amounts.

## Out of scope

Editing amounts of an already published build, encoding amounts in share links, and vendor pricing.
