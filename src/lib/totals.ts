import { byId, type PartBase, type Tag } from '../../shared/ingredients'
import type { Bowl } from '@/store/bowl'

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
  tags: Tag[]
  partCount: number
  complete: boolean
}

export function partsOf(bowl: Bowl): PartBase[] {
  const parts: PartBase[] = []
  if (bowl.brothId) parts.push(byId.broth[bowl.brothId])
  if (bowl.tareId) parts.push(byId.tare[bowl.tareId])
  if (bowl.noodleId) parts.push(byId.noodle[bowl.noodleId])
  if (bowl.oilId) parts.push(byId.oil[bowl.oilId])
  for (const t of bowl.toppings) parts.push(byId.topping[t.toppingId])
  return parts.filter(Boolean)
}

export function computeTotals(bowl: Bowl): Totals {
  const parts = partsOf(bowl)
  const broth = bowl.brothId ? byId.broth[bowl.brothId] : null
  const tare = bowl.tareId ? byId.tare[bowl.tareId] : null
  const oil = bowl.oilId ? byId.oil[bowl.oilId] : null
  const tops = bowl.toppings.map((t) => byId.topping[t.toppingId])

  const sum = (k: 'price' | 'minutes' | 'kcal' | 'sodium') => parts.reduce((a, p) => a + p[k], 0)

  const bodyCapacity = (broth?.richness ?? 0) + (tare?.bodyBonus ?? 0)
  const bodyLoad = tops.reduce((a, t) => a + t.weight, 0) + (oil?.fat ?? 0)
  const spice = Math.min(3, (tare?.spice ?? 0) + (oil?.spice ?? 0) + tops.reduce((a, t) => a + t.spice, 0))
  const richness = Math.min(100, (broth?.richness ?? 0) * 0.7 + (oil?.fat ?? 0) + Math.min(30, bodyLoad * 0.4))

  const tags = [...new Set(parts.flatMap((p) => p.tags))]
  const diet: Totals['diet'] =
    parts.length > 0 && parts.every((p) => p.tags.includes('vegan'))
      ? 'vegan'
      : parts.length > 0 && parts.every((p) => p.tags.includes('vegan') || p.tags.includes('vegetarian'))
        ? 'vegetarian'
        : 'omnivore'

  return {
    price: sum('price'),
    minutes: sum('minutes'),
    kcal: sum('kcal'),
    sodium: sum('sodium'),
    bodyCapacity,
    bodyLoad,
    spice,
    richness,
    diet,
    tags,
    partCount: parts.length,
    complete: !!(bowl.brothId && bowl.tareId && bowl.noodleId),
  }
}

export const fmtPrice = (n: number) => `$${n.toFixed(2)}`
export const fmtMinutes = (m: number) => (m >= 60 ? `${(m / 60).toFixed(m % 60 ? 1 : 0)} h` : `${m} min`)
