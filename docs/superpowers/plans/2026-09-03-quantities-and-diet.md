# Quantities and Bowl-Level Diet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every part in a bowl carries an adjustable amount (ml, g, pieces, or a named portion) that scales price, kcal and sodium; diet labels are computed once per bowl instead of shown per ingredient.

**Architecture:** The catalogue (`shared/ingredients.ts`) gains `serving`, `diet` and `gluten` per part plus two pure helpers. The `Bowl` shape gains optional amount fields with "missing means default". Totals, validation, store, builder table, picker, canvas and build page read through the helpers. Tasks are ordered so the tree compiles after every task: new fields are added first, the old `tags` system is deleted last.

**Tech Stack:** Bun 1.4, TypeScript, React 19, Zustand, Zod 4, bun test. Run every shell command with `export PATH="$HOME/.bun/bin:$PATH"` first.

**Spec:** `docs/superpowers/specs/2026-09-03-quantities-and-diet-design.md`

## Global Constraints

- `price`, `kcal`, `sodium` in the catalogue are per default serving. `minutes` never scales.
- Portion level factors: level 0 = 0.5, level 1 = 1, level 2 = 1.75.
- A missing amount on a bowl means the part's `serving.amount`.
- Countable topping range 1–6. Portion topping `qty` is a level index 0–2.
- No database migration: `bowl` is JSON. Existing data is discarded.
- Gate before every commit: `bun test`, `bunx tsc -b`, `bun run lint` all clean (lint may show the four pre-existing warnings in `button.tsx`, `badge.tsx`, `CoverPicker.tsx`; no new ones).
- Verification: `bun run build` at the end of Task 7.

---

### Task 1: Catalogue servings, diet, gluten, and helpers (additive)

**Files:**
- Modify: `shared/ingredients.ts`
- Test: `shared/ingredients.test.ts` (create)

**Interfaces:**
- Produces:
  ```ts
  export type Diet = 'plant' | 'egg' | 'dairy' | 'fish' | 'chicken' | 'pork'
  export type Serving =
    | { unit: 'ml' | 'g' | 'piece'; amount: number; min: number; max: number; step: number }
    | { unit: 'portion'; levels: readonly [string, string, string]; amount: 0 | 1 | 2 }
  // PartBase gains: diet: Diet; gluten: boolean; serving: Serving   (tags stays until Task 7)
  export const PORTION_FACTORS: readonly [number, number, number]   // [0.5, 1, 1.75]
  export function scaleFactor(part: PartBase, amount: number | undefined): number
  export function formatAmount(part: PartBase, amount: number | undefined): string
  export const dietLabel: Record<Diet, string>
  ```

- [ ] **Step 1: Write the failing test**

```ts
// shared/ingredients.test.ts
import { describe, expect, test } from 'bun:test'
import { broths, byId, catalogue, formatAmount, noodles, oils, scaleFactor, tares, toppings } from './ingredients'

describe('catalogue servings', () => {
  test('every part has diet, gluten and a serving', () => {
    for (const list of Object.values(catalogue)) {
      for (const p of list) {
        expect(['plant', 'egg', 'dairy', 'fish', 'chicken', 'pork']).toContain(p.diet)
        expect(typeof p.gluten).toBe('boolean')
        expect(p.serving).toBeDefined()
      }
    }
  })
  test('liquids are ml, noodles are g', () => {
    for (const b of broths) expect(b.serving.unit).toBe('ml')
    for (const t of tares) expect(t.serving.unit).toBe('ml')
    for (const o of oils) expect(o.serving.unit).toBe('ml')
    for (const n of noodles) expect(n.serving.unit).toBe('g')
  })
  test('toppings are piece or portion', () => {
    for (const t of toppings) expect(['piece', 'portion']).toContain(t.serving.unit)
    expect(byId.topping.chashu.serving.unit).toBe('piece')
    expect(byId.topping.scallion.serving.unit).toBe('portion')
  })
})

describe('scaleFactor', () => {
  test('undefined amount is the default (factor 1)', () => {
    expect(scaleFactor(byId.broth.tonkotsu, undefined)).toBe(1)
    expect(scaleFactor(byId.topping.scallion, undefined)).toBe(1)
  })
  test('numeric units scale linearly', () => {
    expect(scaleFactor(byId.broth.tonkotsu, 200)).toBe(0.5)
    expect(scaleFactor(byId.topping.chashu, 4)).toBe(2)
    expect(scaleFactor(byId.oil.mayu, 0)).toBe(0)
  })
  test('portion levels map to 0.5 / 1 / 1.75', () => {
    expect(scaleFactor(byId.topping.scallion, 0)).toBe(0.5)
    expect(scaleFactor(byId.topping.scallion, 1)).toBe(1)
    expect(scaleFactor(byId.topping.scallion, 2)).toBe(1.75)
  })
})

describe('formatAmount', () => {
  test('formats each unit', () => {
    expect(formatAmount(byId.broth.tonkotsu, undefined)).toBe('400 ml')
    expect(formatAmount(byId.noodle.thin, 150)).toBe('150 g')
    expect(formatAmount(byId.topping.chashu, 1)).toBe('1 pc')
    expect(formatAmount(byId.topping.chashu, 3)).toBe('3 pcs')
    expect(formatAmount(byId.topping.scallion, 2)).toBe('heap')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test shared/ingredients`
Expected: FAIL, `scaleFactor` is not exported / `serving` undefined.

- [ ] **Step 3: Add the types and helpers**

In `shared/ingredients.ts`, after the `Tag` type add:

```ts
export type Diet = 'plant' | 'egg' | 'dairy' | 'fish' | 'chicken' | 'pork'

export type Serving =
  | { unit: 'ml' | 'g' | 'piece'; amount: number; min: number; max: number; step: number }
  | { unit: 'portion'; levels: readonly [string, string, string]; amount: 0 | 1 | 2 }

export const PORTION_FACTORS = [0.5, 1, 1.75] as const
```

Extend `PartBase` (keep `tags` for now):

```ts
  tags: Tag[]
  /** Single diet category; the bowl derives vegan/vegetarian from these. */
  diet: Diet
  gluten: boolean
  /** Default amount and the range the builder allows. price/kcal/sodium are for `serving.amount`. */
  serving: Serving
```

Add after `catalogue`:

```ts
/** Multiplier for price/kcal/sodium at `amount`. Undefined = the default serving. */
export function scaleFactor(part: PartBase, amount: number | undefined): number {
  const s = part.serving
  if (s.unit === 'portion') return PORTION_FACTORS[(amount ?? s.amount) as 0 | 1 | 2]
  if (amount === undefined) return 1
  return s.amount === 0 ? 0 : amount / s.amount
}

/** "400 ml", "150 g", "2 pcs", "handful". */
export function formatAmount(part: PartBase, amount: number | undefined): string {
  const s = part.serving
  if (s.unit === 'portion') return s.levels[(amount ?? s.amount) as 0 | 1 | 2]
  const n = amount ?? s.amount
  if (s.unit === 'piece') return `${n} ${n === 1 ? 'pc' : 'pcs'}`
  return `${n} ${s.unit}`
}

export const dietLabel: Record<Diet, string> = {
  plant: 'Plant',
  egg: 'Egg',
  dairy: 'Dairy',
  fish: 'Fish',
  chicken: 'Chicken',
  pork: 'Pork',
}
```

- [ ] **Step 4: Add the data to every part**

Define these constants above the arrays:

```ts
const ML = (amount: number, min: number, max: number, step: number): Serving => ({ unit: 'ml', amount, min, max, step })
const G = (amount: number): Serving => ({ unit: 'g', amount, min: 80, max: 250, step: 10 })
const PIECES = (amount: number): Serving => ({ unit: 'piece', amount, min: 1, max: 6, step: 1 })
const PORTION = (levels: readonly [string, string, string]): Serving => ({ unit: 'portion', levels, amount: 1 })
const BROTH = ML(400, 200, 600, 50)
const TARE = ML(30, 10, 60, 5)
const OIL = ML(10, 0, 30, 5)
```

Then add `diet`, `gluten`, `serving` to every object literal (keep existing `tags`):

| id | diet | gluten | serving |
| --- | --- | --- | --- |
| tonkotsu | pork | false | BROTH |
| chintan | chicken | false | BROTH |
| paitan | chicken | false | BROTH |
| gyokai | fish | false | BROTH |
| miso-base | pork | false | BROTH |
| kombu | plant | false | BROTH |
| shio | plant | false | TARE |
| shoyu | plant | true | TARE |
| miso | plant | false | TARE |
| spicy | plant | false | TARE |
| thin | plant | true | G(130) |
| medium | plant | true | G(130) |
| thick | plant | true | G(130) |
| tsukemen | plant | true | G(200) |
| chashu | pork | false | PIECES(2) |
| ajitama | egg | false | PIECES(1) |
| nori | plant | false | PIECES(2) |
| scallion | plant | false | PORTION(['pinch', 'handful', 'heap']) |
| menma | plant | false | PORTION(['few', 'some', 'lots']) |
| corn | plant | false | PORTION(['sprinkle', 'spoonful', 'heap']) |
| naruto | fish | false | PIECES(2) |
| butter | dairy | false | PORTION(['sliver', 'pat', 'slab']) |
| sprouts | plant | false | PORTION(['few', 'handful', 'heap']) |
| kikurage | plant | false | PORTION(['few', 'some', 'lots']) |
| bokchoy | plant | false | PIECES(2) |
| chili | plant | false | PORTION(['pinch', 'some', 'lots']) |
| garlic | plant | false | PORTION(['pinch', 'sprinkle', 'lots']) |
| sesame | plant | false | PORTION(['pinch', 'sprinkle', 'lots']) |
| chicken (oil) | chicken | false | OIL |
| mayu | plant | false | OIL |
| rayu | plant | false | OIL |
| niboshi | fish | false | OIL |

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test shared/ingredients` → PASS. Then `bunx tsc -b` → clean (nothing else reads the new fields yet).

- [ ] **Step 6: Commit**

```bash
git add shared/ingredients.ts shared/ingredients.test.ts
git commit -m "Catalogue: servings, diet category and gluten per part"
```

---

### Task 2: Bowl shape and validation

**Files:**
- Modify: `shared/bowl.ts`, `shared/validation.ts`
- Test: `shared/validation.test.ts` (extend)

**Interfaces:**
- Consumes: `byId`, `Serving` from Task 1.
- Produces:
  ```ts
  export type PlacedTopping = { key; toppingId; x; y; rotation; qty?: number }
  export type Bowl = { brothId; tareId; noodleId; oilId; brothMl?: number; tareMl?: number; noodleG?: number; oilMl?: number; toppings: PlacedTopping[] }
  export const AMOUNT_KEY = { broth: 'brothMl', tare: 'tareMl', noodle: 'noodleG', oil: 'oilMl' } as const   // in shared/bowl.ts
  ```

- [ ] **Step 1: Write the failing tests**

Append to `shared/validation.test.ts`:

```ts
import { bowlSchema } from './validation'

const base = { brothId: 'tonkotsu', tareId: 'shio', noodleId: 'thin', oilId: null, toppings: [] }

describe('bowl amounts', () => {
  test('amounts are optional', () => {
    expect(bowlSchema.safeParse(base).success).toBe(true)
  })
  test('in-range amounts pass', () => {
    const r = bowlSchema.safeParse({ ...base, brothMl: 500, tareMl: 20, noodleG: 150, toppings: [{ key: 'a', toppingId: 'chashu', x: 1, y: 1, rotation: 0, qty: 3 }] })
    expect(r.success).toBe(true)
  })
  test('out-of-range broth is rejected naming the part', () => {
    const r = bowlSchema.safeParse({ ...base, brothMl: 900 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toContain('Tonkotsu')
  })
  test('portion topping qty above 2 is rejected', () => {
    const r = bowlSchema.safeParse({ ...base, toppings: [{ key: 'a', toppingId: 'scallion', x: 1, y: 1, rotation: 0, qty: 3 }] })
    expect(r.success).toBe(false)
  })
  test('countable topping qty 0 is rejected', () => {
    const r = bowlSchema.safeParse({ ...base, toppings: [{ key: 'a', toppingId: 'chashu', x: 1, y: 1, rotation: 0, qty: 0 }] })
    expect(r.success).toBe(false)
  })
})
```

(Add `describe`/`test`/`expect` to the existing import from `bun:test` if not already there.)

- [ ] **Step 2: Run to verify failure**

Run: `bun test shared/validation` → FAIL (amount keys stripped or accepted without range check).

- [ ] **Step 3: Extend `shared/bowl.ts`**

```ts
export type PlacedTopping = {
  key: string
  toppingId: string
  x: number
  y: number
  rotation: number
  /** Piece count for countable toppings, level index 0–2 for portion toppings. Missing = default. */
  qty?: number
}

export type Bowl = {
  brothId: string | null
  tareId: string | null
  noodleId: string | null
  oilId: string | null
  /** Missing = the part's default serving. */
  brothMl?: number
  tareMl?: number
  noodleG?: number
  oilMl?: number
  toppings: PlacedTopping[]
}

export const AMOUNT_KEY = { broth: 'brothMl', tare: 'tareMl', noodle: 'noodleG', oil: 'oilMl' } as const
```

- [ ] **Step 4: Extend `bowlSchema` in `shared/validation.ts`**

```ts
import { byId, type PartBase } from './ingredients'

const amount = z.number().min(0).max(1000).optional()

function checkAmount(ctx: z.RefinementCtx, part: PartBase | undefined, value: number | undefined, path: (string | number)[]) {
  if (!part || value === undefined) return
  const s = part.serving
  const ok = s.unit === 'portion' ? Number.isInteger(value) && value >= 0 && value <= 2 : value >= s.min && value <= s.max && (s.unit !== 'piece' || Number.isInteger(value))
  if (!ok) {
    const range = s.unit === 'portion' ? `one of ${s.levels.join(', ')}` : `${s.min}–${s.max} ${s.unit}`
    ctx.addIssue({ code: 'custom', path, message: `${part.name}: amount must be ${range}` })
  }
}

export const bowlSchema = z
  .object({
    brothId: idIn(byId.broth).nullable(),
    tareId: idIn(byId.tare).nullable(),
    noodleId: idIn(byId.noodle).nullable(),
    oilId: idIn(byId.oil).nullable(),
    brothMl: amount,
    tareMl: amount,
    noodleG: amount,
    oilMl: amount,
    toppings: z
      .array(
        z.object({
          key: z.string().min(1).max(40),
          toppingId: idIn(byId.topping),
          x: z.number().min(0).max(400),
          y: z.number().min(0).max(400),
          rotation: z.number().min(-180).max(180),
          qty: z.number().int().min(0).max(6).optional(),
        }),
      )
      .max(MAX_TOPPINGS),
  })
  .superRefine((b, ctx) => {
    checkAmount(ctx, b.brothId ? byId.broth[b.brothId] : undefined, b.brothMl, ['brothMl'])
    checkAmount(ctx, b.tareId ? byId.tare[b.tareId] : undefined, b.tareMl, ['tareMl'])
    checkAmount(ctx, b.noodleId ? byId.noodle[b.noodleId] : undefined, b.noodleG, ['noodleG'])
    checkAmount(ctx, b.oilId ? byId.oil[b.oilId] : undefined, b.oilMl, ['oilMl'])
    b.toppings.forEach((t, i) => checkAmount(ctx, byId.topping[t.toppingId], t.qty, ['toppings', i, 'qty']))
  })
```

- [ ] **Step 5: Run tests and typecheck**

Run: `bun test shared` → PASS. `bunx tsc -b` → clean.

- [ ] **Step 6: Commit**

```bash
git add shared/bowl.ts shared/validation.ts shared/validation.test.ts
git commit -m "Bowl: optional per-part amounts with range validation"
```

---

### Task 3: Totals scale with amounts; diet and gluten from categories

**Files:**
- Modify: `src/lib/totals.ts`, `src/lib/compat.ts:79-86`
- Test: `src/lib/totals.test.ts` (create)

**Interfaces:**
- Consumes: `scaleFactor`, `Diet` from Task 1; `AMOUNT_KEY` from Task 2.
- Produces:
  ```ts
  export type PartLine = { slot: Slot; part: PartBase; amount: number | undefined; factor: number }
  export function linesOf(bowl: Bowl): PartLine[]      // replaces partsOf; partsOf stays as a thin wrapper
  export type Totals = { ...existing minus tags; gluten: boolean }
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/totals.test.ts
import { describe, expect, test } from 'bun:test'
import { computeTotals, linesOf } from './totals'
import type { Bowl } from '../../shared/bowl'

const bowl: Bowl = { brothId: 'tonkotsu', tareId: 'shio', noodleId: 'thin', oilId: 'mayu', toppings: [{ key: 'a', toppingId: 'chashu', x: 0, y: 0, rotation: 0 }] }

describe('computeTotals scaling', () => {
  test('defaults equal the catalogue sums', () => {
    const t = computeTotals(bowl)
    expect(t.kcal).toBe(380 + 0 + 300 + 90 + 220)
    expect(t.price).toBeCloseTo(3.5 + 0.3 + 0.9 + 0.4 + 2.5)
  })
  test('half the broth halves its kcal and sodium, not minutes', () => {
    const t = computeTotals({ ...bowl, brothMl: 200 })
    expect(t.kcal).toBe(190 + 0 + 300 + 90 + 220)
    expect(t.sodium).toBe(700 + 900 + 400 + 10 + 350)
    expect(t.minutes).toBe(computeTotals(bowl).minutes)
  })
  test('topping qty scales price and body load', () => {
    const two = computeTotals(bowl)
    const four = computeTotals({ ...bowl, toppings: [{ ...bowl.toppings[0], qty: 4 }] })
    expect(four.price).toBeCloseTo(two.price + 2.5)
    expect(four.bodyLoad).toBe(two.bodyLoad + 18)
  })
  test('portion levels use 0.5 / 1 / 1.75', () => {
    const b: Bowl = { ...bowl, toppings: [{ key: 'a', toppingId: 'corn', x: 0, y: 0, rotation: 0, qty: 2 }] }
    expect(computeTotals(b).kcal).toBe(380 + 300 + 90 + 70)
  })
  test('kcal, sodium and price are rounded sensibly', () => {
    const t = computeTotals({ ...bowl, brothMl: 250 })
    expect(Number.isInteger(t.kcal)).toBe(true)
    expect(Number.isInteger(t.sodium)).toBe(true)
  })
})

describe('diet and gluten', () => {
  test('all-plant bowl is vegan with gluten from noodles', () => {
    const t = computeTotals({ brothId: 'kombu', tareId: 'shio', noodleId: 'thin', oilId: null, toppings: [] })
    expect(t.diet).toBe('vegan')
    expect(t.gluten).toBe(true)
  })
  test('egg makes it vegetarian', () => {
    const t = computeTotals({ brothId: 'kombu', tareId: 'shio', noodleId: 'thin', oilId: null, toppings: [{ key: 'a', toppingId: 'ajitama', x: 0, y: 0, rotation: 0 }] })
    expect(t.diet).toBe('vegetarian')
  })
  test('pork makes it omnivore', () => {
    expect(computeTotals(bowl).diet).toBe('omnivore')
  })
  test('empty bowl is omnivore and gluten-free', () => {
    const t = computeTotals({ brothId: null, tareId: null, noodleId: null, oilId: null, toppings: [] })
    expect(t.diet).toBe('omnivore')
    expect(t.gluten).toBe(false)
  })
})

test('linesOf carries amount and factor', () => {
  const lines = linesOf({ ...bowl, brothMl: 200 })
  expect(lines[0]).toMatchObject({ slot: 'broth', amount: 200, factor: 0.5 })
  expect(lines[4]).toMatchObject({ slot: 'topping', amount: undefined, factor: 1 })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test src/lib/totals` → FAIL (`linesOf` missing, scaling absent).

- [ ] **Step 3: Rewrite `src/lib/totals.ts`**

```ts
import { byId, scaleFactor, type PartBase, type Slot } from '../../shared/ingredients'
import { AMOUNT_KEY, type Bowl } from '../../shared/bowl'

export type Totals = {
  price: number
  minutes: number
  kcal: number
  sodium: number
  /** broth body available */
  bodyCapacity: number
  /** body demanded by toppings + oil */
  bodyLoad: number
  /** 0–3 */
  spice: number
  /** 0–100, drives the sheen in the renderer */
  richness: number
  diet: 'vegan' | 'vegetarian' | 'omnivore'
  gluten: boolean
  partCount: number
  complete: boolean
}

export type PartLine = { slot: Slot; part: PartBase; amount: number | undefined; factor: number }

/** Every chosen part with its amount and scale factor, in build-sheet order. */
export function linesOf(bowl: Bowl): PartLine[] {
  const lines: PartLine[] = []
  const single = (slot: Exclude<Slot, 'topping'>, id: string | null) => {
    const part = id ? (byId[slot][id] as PartBase | undefined) : undefined
    if (!part) return
    const amount = bowl[AMOUNT_KEY[slot]]
    lines.push({ slot, part, amount, factor: scaleFactor(part, amount) })
  }
  single('broth', bowl.brothId)
  single('tare', bowl.tareId)
  single('noodle', bowl.noodleId)
  single('oil', bowl.oilId)
  for (const t of bowl.toppings) {
    const part = byId.topping[t.toppingId]
    if (part) lines.push({ slot: 'topping', part, amount: t.qty, factor: scaleFactor(part, t.qty) })
  }
  return lines
}

export function partsOf(bowl: Bowl): PartBase[] {
  return linesOf(bowl).map((l) => l.part)
}

export function computeTotals(bowl: Bowl): Totals {
  const lines = linesOf(bowl)
  const broth = bowl.brothId ? byId.broth[bowl.brothId] : null
  const tare = bowl.tareId ? byId.tare[bowl.tareId] : null
  const oil = bowl.oilId ? byId.oil[bowl.oilId] : null
  const oilFactor = oil ? scaleFactor(oil, bowl.oilMl) : 0
  const topLines = lines.filter((l) => l.slot === 'topping')

  const scaled = (k: 'price' | 'kcal' | 'sodium') => lines.reduce((a, l) => a + l.part[k] * l.factor, 0)

  const bodyCapacity = (broth?.richness ?? 0) + (tare?.bodyBonus ?? 0)
  const bodyLoad = Math.round(topLines.reduce((a, l) => a + byId.topping[l.part.id].weight * l.factor, 0) + (oil?.fat ?? 0) * oilFactor)
  const spice = Math.min(3, (tare?.spice ?? 0) + (oil?.spice ?? 0) + topLines.reduce((a, l) => a + byId.topping[l.part.id].spice, 0))
  const richness = Math.min(100, (broth?.richness ?? 0) * 0.7 + (oil?.fat ?? 0) * oilFactor + Math.min(30, bodyLoad * 0.4))

  const parts = lines.map((l) => l.part)
  const diet: Totals['diet'] =
    parts.length > 0 && parts.every((p) => p.diet === 'plant')
      ? 'vegan'
      : parts.length > 0 && parts.every((p) => p.diet === 'plant' || p.diet === 'egg' || p.diet === 'dairy')
        ? 'vegetarian'
        : 'omnivore'

  return {
    price: Math.round(scaled('price') * 100) / 100,
    minutes: lines.reduce((a, l) => a + l.part.minutes, 0),
    kcal: Math.round(scaled('kcal')),
    sodium: Math.round(scaled('sodium')),
    bodyCapacity,
    bodyLoad,
    spice,
    richness,
    diet,
    gluten: parts.some((p) => p.gluten),
    partCount: parts.length,
    complete: !!(bowl.brothId && bowl.tareId && bowl.noodleId),
  }
}

export const fmtPrice = (n: number) => `$${n.toFixed(2)}`
export const fmtMinutes = (m: number) => (m >= 60 ? `${(m / 60).toFixed(m % 60 ? 1 : 0)} h` : `${m} min`)
```

- [ ] **Step 4: Switch the kombu rule in `src/lib/compat.ts`**

Replace `.filter((p) => !p.tags.includes('vegan'))` with `.filter((p) => p.diet !== 'plant')`.

- [ ] **Step 5: Run tests and typecheck**

Run: `bun test src/lib shared` → PASS. `bunx tsc -b` → clean (nothing read `Totals.tags`; if `tsc` reports a consumer, remove that usage).

- [ ] **Step 6: Commit**

```bash
git add src/lib/totals.ts src/lib/totals.test.ts src/lib/compat.ts
git commit -m "Totals scale with amounts; diet and gluten computed from categories"
```

---

### Task 4: Store actions for amounts

**Files:**
- Modify: `src/store/bowl.ts`

**Interfaces:**
- Produces:
  ```ts
  setAmount: (slot: 'broth' | 'tare' | 'noodle' | 'oil', value: number | undefined) => void
  setToppingQty: (key: string, value: number | undefined) => void
  ```
  `setPart(slot, id)` also clears that slot's amount (a new part gets its own default). `emptyBowl`, `reset`, `load`, `randomize` unchanged except `load` copies the amount fields.

- [ ] **Step 1: Write the failing test**

```ts
// src/store/bowl.test.ts
import { beforeEach, expect, test } from 'bun:test'
import { useBowlStore } from './bowl'

beforeEach(() => useBowlStore.getState().reset())

test('setAmount stores and clears a slot amount', () => {
  const s = useBowlStore.getState()
  s.setPart('broth', 'tonkotsu')
  s.setAmount('broth', 500)
  expect(useBowlStore.getState().bowl.brothMl).toBe(500)
  s.setAmount('broth', undefined)
  expect(useBowlStore.getState().bowl.brothMl).toBeUndefined()
})

test('swapping a part resets its amount', () => {
  const s = useBowlStore.getState()
  s.setPart('broth', 'tonkotsu')
  s.setAmount('broth', 500)
  s.setPart('broth', 'kombu')
  expect(useBowlStore.getState().bowl.brothMl).toBeUndefined()
})

test('setToppingQty sets qty on one placed topping', () => {
  const s = useBowlStore.getState()
  s.addTopping('chashu')
  s.addTopping('nori')
  const [a, b] = useBowlStore.getState().bowl.toppings
  s.setToppingQty(a.key, 3)
  const after = useBowlStore.getState().bowl.toppings
  expect(after[0].qty).toBe(3)
  expect(after[1].qty).toBeUndefined()
  expect(b.key).toBe(after[1].key)
})

test('load restores amounts from a saved bowl', () => {
  const s = useBowlStore.getState()
  s.setPart('broth', 'tonkotsu')
  s.setAmount('broth', 250)
  const saved = s.save('test')
  s.reset()
  s.load(saved.id)
  expect(useBowlStore.getState().bowl.brothMl).toBe(250)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `bun test src/store` → FAIL (`setAmount` is not a function). If `localStorage` is missing under bun, add at the top of the test: `import 'localstorage-polyfill'` is NOT available; instead stub it: `globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} } as unknown as Storage` before importing the store (use a dynamic `await import('./bowl')`).

- [ ] **Step 3: Implement**

In `src/store/bowl.ts`:

```ts
import { AMOUNT_KEY, MAX_TOPPINGS, type Bowl, type PlacedTopping } from '../../shared/bowl'
```

Add to `BowlState`:

```ts
  setAmount: (slot: SingleSlot, value: number | undefined) => void
  setToppingQty: (key: string, value: number | undefined) => void
```

Replace `setPart` and add the two actions:

```ts
      setPart: (slot, id) =>
        set((s) => {
          const next: Bowl = { ...s.bowl, [slotKey[slot]]: id }
          delete next[AMOUNT_KEY[slot]]
          return { bowl: next }
        }),
      setAmount: (slot, value) =>
        set((s) => {
          const next: Bowl = { ...s.bowl }
          if (value === undefined) delete next[AMOUNT_KEY[slot]]
          else next[AMOUNT_KEY[slot]] = value
          return { bowl: next }
        }),
      setToppingQty: (key, value) =>
        set((s) => ({
          bowl: {
            ...s.bowl,
            toppings: s.bowl.toppings.map((t) => {
              if (t.key !== key) return t
              const { qty: _drop, ...rest } = t
              return value === undefined ? rest : { ...rest, qty: value }
            }),
          },
        })),
```

Change `load` to copy amounts:

```ts
        const { id: _id, name: _name, savedAt: _savedAt, ...bowl } = found
        set({ bowl })
```

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test src/store` → PASS. `bunx tsc -b` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/store/bowl.ts src/store/bowl.test.ts
git commit -m "Store: setAmount and setToppingQty"
```

---

### Task 5: Amount controls in the build table

**Files:**
- Create: `src/components/build/AmountControl.tsx`
- Modify: `src/components/build/BuildTable.tsx`

**Interfaces:**
- Consumes: `formatAmount`, `Serving` (Task 1); `AMOUNT_KEY` (Task 2); `linesOf`, `PartLine` (Task 3); `setAmount`, `setToppingQty` (Task 4).
- Produces:
  ```tsx
  export function AmountControl({ part, value, onChange }: { part: PartBase; value: number | undefined; onChange: (v: number | undefined) => void }): JSX.Element
  ```

- [ ] **Step 1: Create `AmountControl.tsx`**

```tsx
import { Minus, Plus } from 'lucide-react'
import { formatAmount, type PartBase } from '../../../shared/ingredients'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/** Stepper for ml / g / pieces, three-way toggle for portion toppings. `undefined` = the part's default. */
export function AmountControl({ part, value, onChange }: { part: PartBase; value: number | undefined; onChange: (v: number | undefined) => void }) {
  const s = part.serving
  if (s.unit === 'portion') {
    const level = value ?? s.amount
    return (
      <div className="inline-flex rounded-md border border-border text-[11px]" role="radiogroup" aria-label={`${part.name} amount`}>
        {s.levels.map((label, i) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={level === i}
            onClick={() => onChange(i === s.amount ? undefined : i)}
            className={cn('px-2 py-0.5 first:rounded-l-md last:rounded-r-md', level === i ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }
  const n = value ?? s.amount
  const set = (next: number) => onChange(next === s.amount ? undefined : next)
  return (
    <div className="inline-flex items-center gap-0.5 whitespace-nowrap">
      <Button size="icon-sm" variant="ghost" aria-label={`Less ${part.name}`} disabled={n <= s.min} onClick={() => set(Math.max(s.min, n - s.step))}>
        <Minus />
      </Button>
      <span className="min-w-14 text-center tabular-nums">{formatAmount(part, n)}</span>
      <Button size="icon-sm" variant="ghost" aria-label={`More ${part.name}`} disabled={n >= s.max} onClick={() => set(Math.min(s.max, n + s.step))}>
        <Plus />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Wire it into `BuildTable.tsx`**

Imports: add `AmountControl` from `./AmountControl`, `scaleFactor` from ingredients, `AMOUNT_KEY` from `../../../shared/bowl`. Pull `setAmount, setToppingQty` from `useBowlStore()`.

Header: insert `<th className="w-40">Amount</th>` after Selection. The empty-slot `colSpan` values become 7 (two places: the topping add-row and the `Row` empty branch).

`Row` gains props `amount: number | undefined`, `onAmount: (v: number | undefined) => void`. Single slots pass `amount={bowl[AMOUNT_KEY[slot]]}` and `onAmount={(v) => setAmount(slot, v)}`; topping rows pass `amount={t.qty}` and `onAmount={(v) => setToppingQty(t.key, v)}`.

In `Row`'s filled branch, replace the tag chip `<div>` with nothing (delete the `mt-0.5 flex flex-wrap gap-1` block and the `TagBadge` import), and insert after the Selection cell:

```tsx
          <td className="px-2 py-1.5">
            <AmountControl part={part} value={amount} onChange={onAmount} />
          </td>
```

Scaled cells:

```tsx
          <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{Math.round(part.kcal * f)}</td>
          <td className="hidden px-2 py-1.5 text-right tabular-nums whitespace-nowrap md:table-cell">{Math.round(part.sodium * f)}</td>
          <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{fmtMinutes(part.minutes)}</td>
          <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{fmtPrice(part.price * f)}</td>
```

with `const f = part ? scaleFactor(part, amount) : 1` at the top of `Row`.

- [ ] **Step 3: Typecheck, lint, and look at it**

Run: `bunx tsc -b && bun run lint` → clean. Then `bun run dev` and open `http://localhost:5173/build#b=tonkotsu.shio.thin.mayu.chashu,scallion`: the table shows "400 ml" with − and +, "2 pcs" for chashu, pinch/handful/heap for negi; pressing + on broth raises the summary kcal. Stop the servers.

- [ ] **Step 4: Commit**

```bash
git add src/components/build/AmountControl.tsx src/components/build/BuildTable.tsx
git commit -m "Builder: amount controls per row, scaled nutrition, no per-row diet chips"
```

---

### Task 6: Picker, summary, build page, and canvas badge

**Files:**
- Modify: `src/components/build/PartPickerDialog.tsx`, `src/components/build/BuildSummary.tsx:124-131`, `src/pages/BuildPage.tsx`, `src/components/bowl/BowlCanvas.tsx:218-224`

**Interfaces:**
- Consumes: `formatAmount`, `scaleFactor`, `dietLabel` (Task 1); `linesOf` and `Totals.gluten` (Task 3).

- [ ] **Step 1: PartPickerDialog**

Diet filter: replace `.filter((p) => diet === 'all' || p.tags.includes('vegan') || (diet === 'vegetarian' && p.tags.includes('vegetarian')))` with
```ts
      .filter((p) => diet === 'all' || p.diet === 'plant' || (diet === 'vegetarian' && (p.diet === 'egg' || p.diet === 'dairy')))
```
Replace the Tags column header with `<th className="hidden text-left sm:table-cell">Serving</th>` and the tag cell body with
```tsx
                    <td className="hidden text-[12px] text-muted-foreground sm:table-cell">{formatAmount(p, undefined)}</td>
```
Delete the `TagBadge` function and the `tagLabel`/`Tag`/`Badge` imports from this file (Task 7 confirms nothing else imports `TagBadge`).

- [ ] **Step 2: BuildSummary and BuildPage sidebar badges**

In both files, after the diet `<Badge>` add:
```tsx
          {totals.gluten && <Badge variant="outline">Gluten</Badge>}
```

- [ ] **Step 3: BuildPage parts table**

Replace the `rows` construction (the block starting `const rows: { slot: Slot; part: PartBase }[] = []`) with
```ts
  const rows = useMemo(() => linesOf(build.bowl), [build.bowl])
```
importing `linesOf` from `@/lib/totals` and dropping the now-unused `byId`, `PartBase`, `Slot` imports. In the table, add a header `<th className="hidden sm:table-cell">Amount</th>` after Part, delete the `TagBadge` chips block and its import, and render:
```tsx
              {rows.map(({ slot, part, amount, factor }, i) => (
                ...
                  <td className="hidden px-2 py-1.5 text-[12px] text-muted-foreground sm:table-cell">{formatAmount(part, amount)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{Math.round(part.kcal * factor)}</td>
                  <td className="hidden px-2 py-1.5 text-right tabular-nums whitespace-nowrap md:table-cell">{fmtMinutes(part.minutes)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtPrice(part.price * factor)}</td>
```
Empty-state `colSpan` becomes 6.

- [ ] **Step 4: Canvas count badge**

In `PlacedToppingView`, compute `const count = topping.serving.unit === 'piece' ? (placed.qty ?? topping.serving.amount) : 1` and change the glyph wrapper to:
```tsx
      <div className="relative aspect-square w-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)]">
        <ToppingGlyph glyph={topping.glyph} className="size-full" />
        {count > 1 && (
          <span className="absolute -right-1 -bottom-1 rounded-full bg-foreground px-1 text-[9px] leading-4 font-semibold text-background">×{count}</span>
        )}
      </div>
```

- [ ] **Step 5: Typecheck, lint, look**

Run: `bunx tsc -b && bun run lint` → clean. `bun run dev`: picker shows "Serving" column, builder summary shows Gluten badge on a shoyu bowl, canvas shows ×2 on chashu. Stop the servers.

- [ ] **Step 6: Commit**

```bash
git add src/components/build/PartPickerDialog.tsx src/components/build/BuildSummary.tsx src/pages/BuildPage.tsx src/components/bowl/BowlCanvas.tsx
git commit -m "Show amounts and one diet badge per bowl; count badge on the canvas"
```

---

### Task 7: Remove the old tag system and cover the API

**Files:**
- Modify: `shared/ingredients.ts` (delete `Tag`, `tags`, `tagLabel`), `server/routes.test.ts`, `README.md` ("Adding a part" paragraph)

- [ ] **Step 1: Delete tags**

In `shared/ingredients.ts` remove the `Tag` type, the `tags: Tag[]` field from `PartBase`, every `tags: [...]` property in the data arrays, and `tagLabel`. Run `grep -rn "tags\|tagLabel\|TagBadge\|type Tag\b" src shared server` and fix anything left (expected: nothing).

- [ ] **Step 2: Extend `server/routes.test.ts`**

Find the publish test's bowl payload and add `brothMl: 500` plus `qty: 3` on its first topping, then assert the round trip:
```ts
    expect(detail.build.bowl.brothMl).toBe(500)
    expect(detail.build.bowl.toppings[0].qty).toBe(3)
```
Add a test in the same describe:
```ts
  test('out-of-range amount is rejected with the part name', async () => {
    const res = await post('/api/builds', { ...validPublishBody, bowl: { ...validPublishBody.bowl, brothMl: 900 } }, cookie)
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toContain('Tonkotsu')
  })
```
(Use whatever helper names the file already has for authenticated POSTs; keep the message shape `{ error }`.)

- [ ] **Step 3: README**

In "Adding a part", after "with its specs" add: "Give it a `diet` category, `gluten`, and a `serving` (ml, g, pieces, or three named portion levels); price, kcal and sodium are for that default serving."

- [ ] **Step 4: Full gate**

Run: `bun test` → all pass. `bunx tsc -b` → clean. `bun run lint` → no new warnings. `bun run build` → succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove per-ingredient tags; API round-trips amounts"
```

---

## Self-review

- **Spec coverage:** catalogue types and data (T1), helpers (T1), bowl shape (T2), validation with per-part refinement (T2), totals scaling and diet/gluten (T3), compat kombu rule (T3), store actions (T4), build table amount column and chip removal (T5), picker filter/serving column (T6), summary and build page badges (T6), build page amounts (T6), canvas ×N (T6), tags removal (T7), route tests (T7). Share hash unchanged by design.
- **Type consistency:** `AMOUNT_KEY` defined in T2 and used in T3, T4, T5. `linesOf`/`PartLine` defined in T3 and used in T6. `setAmount`/`setToppingQty` defined in T4 and used in T5. `formatAmount`/`scaleFactor` defined in T1 and used in T5, T6.
