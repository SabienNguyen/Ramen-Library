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
