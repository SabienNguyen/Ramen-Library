import { byId } from '@/data/ingredients'
import type { Bowl } from '@/store/bowl'

export function bowlName(bowl: Bowl) {
  const tare = byId.tare[bowl.tareId]?.name ?? ''
  const broth = byId.broth[bowl.brothId]?.name ?? ''
  const spice = bowl.spice >= 3 ? 'Inferno ' : bowl.spice === 2 ? 'Spicy ' : ''
  return `${spice}${tare} ${broth}`.trim()
}
