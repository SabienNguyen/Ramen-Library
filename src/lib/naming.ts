import { byId } from '@/data/ingredients'
import type { Bowl } from '@/store/bowl'
import { computeTotals } from './totals'

export function bowlName(bowl: Bowl) {
  const tare = bowl.tareId ? byId.tare[bowl.tareId].name : ''
  const broth = bowl.brothId ? byId.broth[bowl.brothId].name : ''
  const spice = computeTotals(bowl).spice
  const prefix = spice >= 3 ? 'Inferno ' : spice === 2 ? 'Spicy ' : ''
  const name = `${prefix}${tare} ${broth}`.trim()
  return name || 'Untitled build'
}
