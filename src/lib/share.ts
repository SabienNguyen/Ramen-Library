import { byId } from '../../shared/ingredients'
import { spotFor, type Bowl } from '@/store/bowl'

/**
 * Permalinks. The build is packed into the URL hash so a bowl can be shared
 * with no backend: #b=<broth>.<tare>.<noodle>.<oil>.<topping,topping,…>
 */
export function encodeBowl(bowl: Bowl): string {
  const seg = (v: string | null) => v ?? '-'
  return [seg(bowl.brothId), seg(bowl.tareId), seg(bowl.noodleId), seg(bowl.oilId), bowl.toppings.map((t) => t.toppingId).join(',')].join('.')
}

export function decodeBowl(code: string): Bowl | null {
  const [b, t, n, o, tops = ''] = code.split('.')
  if (b === undefined || t === undefined || n === undefined || o === undefined) return null
  const valid = (v: string, table: Record<string, unknown>) => (v && v !== '-' && table[v] ? v : null)
  const toppingIds = tops
    .split(',')
    .filter((id) => byId.topping[id])
    .slice(0, 12)
  return {
    brothId: valid(b, byId.broth),
    tareId: valid(t, byId.tare),
    noodleId: valid(n, byId.noodle),
    oilId: valid(o, byId.oil),
    toppings: toppingIds.map((id, i) => ({ key: `${id}-${i}-${Math.random().toString(36).slice(2, 6)}`, toppingId: id, ...spotFor(i) })),
  }
}

export function shareUrl(bowl: Bowl) {
  const url = new URL(window.location.href)
  url.hash = `b=${encodeBowl(bowl)}`
  return url.toString()
}

export function readShareHash(): Bowl | null {
  const m = window.location.hash.match(/^#b=(.+)$/)
  return m ? decodeBowl(decodeURIComponent(m[1])) : null
}
