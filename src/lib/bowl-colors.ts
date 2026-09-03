import { byId } from '../../shared/ingredients'
import type { Bowl } from '@/store/bowl'
import { mix } from './color'

/** Surface / deep colours for a bowl's broth after the tare is blended in. */
export function brothColors(bowl: Bowl) {
  const broth = bowl.brothId ? byId.broth[bowl.brothId] : null
  const tare = bowl.tareId ? byId.tare[bowl.tareId] : null
  const base = broth?.color ?? '#d6c6a8'
  const deep = broth?.deep ?? '#b8a381'
  return {
    surface: tare ? mix(base, tare.tint, tare.tintStrength) : base,
    deep: tare ? mix(deep, tare.tint, tare.tintStrength * 0.8) : deep,
    noodle: bowl.noodleId ? byId.noodle[bowl.noodleId].color : '#f0dd9f',
    opacity: broth?.opacity ?? 0.6,
  }
}
