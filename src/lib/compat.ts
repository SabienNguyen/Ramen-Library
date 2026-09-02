import { byId, slotMeta, type Slot } from '@/data/ingredients'
import type { Bowl } from '@/store/bowl'
import { computeTotals } from './totals'

export type Issue = {
  level: 'error' | 'warn' | 'note'
  message: string
  /** slots involved, so the build sheet can flag the rows */
  slots: Slot[]
}

/**
 * The compatibility checker — PCPartPicker's "these parts don't fit" bar,
 * translated to ramen. Errors are things a cook would send back; warnings
 * are questionable pairings; notes are trivia worth knowing.
 */
export function checkCompatibility(bowl: Bowl): Issue[] {
  const issues: Issue[] = []
  const t = computeTotals(bowl)
  const broth = bowl.brothId ? byId.broth[bowl.brothId] : null
  const tare = bowl.tareId ? byId.tare[bowl.tareId] : null
  const noodle = bowl.noodleId ? byId.noodle[bowl.noodleId] : null
  const oil = bowl.oilId ? byId.oil[bowl.oilId] : null
  const tops = bowl.toppings.map((p) => byId.topping[p.toppingId])
  const count = (id: string) => tops.filter((x) => x.id === id).length

  // Required slots
  for (const slot of ['broth', 'tare', 'noodle'] as const) {
    const filled = slot === 'broth' ? broth : slot === 'tare' ? tare : noodle
    if (!filled) issues.push({ level: 'note', message: `No ${slotMeta[slot].label.toLowerCase()} selected.`, slots: [slot] })
  }

  // Body budget — the wattage check
  if (broth && t.bodyLoad > t.bodyCapacity) {
    issues.push({
      level: 'error',
      message: `${broth.name} can't carry these toppings: ${t.bodyLoad} body needed, ${t.bodyCapacity} available. Pick a richer broth, a miso tare, or drop the heavy stuff (butter, chashu).`,
      slots: ['broth', 'topping'],
    })
  } else if (broth && t.bodyLoad > t.bodyCapacity * 0.85) {
    issues.push({ level: 'warn', message: `Body budget is tight (${t.bodyLoad}/${t.bodyCapacity}). One more heavy topping tips it over.`, slots: ['broth', 'topping'] })
  }

  // Noodle vs broth weight
  if (noodle && broth) {
    const heavy = broth.richness >= 70 || tare?.id === 'miso' || tare?.id === 'spicy'
    if (noodle.heft === 1 && (tare?.id === 'miso' || tare?.id === 'spicy')) {
      issues.push({ level: 'warn', message: 'Hakata thin noodles go limp under a miso tare. Sapporo thick is the classic match.', slots: ['noodle', 'tare'] })
    }
    if (noodle.heft >= 3 && broth.richness <= 40 && !heavy) {
      issues.push({ level: 'warn', message: `${noodle.name} noodles will overpower a delicate ${broth.name}. Consider medium or thin.`, slots: ['noodle', 'broth'] })
    }
    if (noodle.id === 'tsukemen') {
      issues.push({ level: 'warn', message: 'Tsukemen noodles are meant to be served on the side for dipping. In soup they turn into a brick. Proceed if you know what you’re doing.', slots: ['noodle'] })
    }
  }

  // Tare vs broth
  if (tare?.id === 'spicy' && broth && broth.richness <= 40) {
    issues.push({ level: 'warn', message: `Kara-miso will bulldoze a ${broth.name}. It wants a fatty broth to hide in.`, slots: ['tare', 'broth'] })
  }
  if (tare?.id === 'shio' && broth?.id === 'miso-base') {
    issues.push({ level: 'note', message: 'Miso stock with a shio tare is double-seasoned in an odd way. Most shops would use a miso tare here.', slots: ['tare', 'broth'] })
  }

  // Butter
  if (count('butter') && broth && tare && tare.id !== 'miso' && tare.id !== 'spicy') {
    issues.push({ level: 'warn', message: 'Butter slicks on a non-miso bowl. The classic pairing is miso + corn + butter.', slots: ['topping', 'tare'] })
  }

  // Oils
  if (oil?.id === 'mayu' && broth && broth.id !== 'tonkotsu') {
    issues.push({ level: 'note', message: 'Mayu is a Kumamoto tonkotsu thing. It works elsewhere, just unusual.', slots: ['oil'] })
  }
  if (oil?.id === 'niboshi' && broth?.id === 'gyokai') {
    issues.push({ level: 'note', message: 'Niboshi oil on a gyokai broth: fish on fish. Delicious for fish people, a lot for everyone else.', slots: ['oil', 'broth'] })
  }

  // Diet clash
  if (broth?.id === 'kombu') {
    const animal = [...(tare ? [tare] : []), ...(oil ? [oil] : []), ...tops].filter((p) => !p.tags.includes('vegan'))
    if (animal.length) {
      const names = [...new Set(animal.map((p) => p.name))].join(', ')
      issues.push({ level: 'note', message: `Kombu Dashi is plant-based but ${names} ${animal.length > 1 ? 'aren’t' : 'isn’t'}. The build is no longer vegan.`, slots: ['broth', 'topping'] })
    }
  }

  // Crowding
  if (tops.length > 7) {
    issues.push({ level: 'warn', message: `${tops.length} toppings. The noodles will be unreachable. Seven is plenty.`, slots: ['topping'] })
  }
  for (const id of new Set(tops.map((x) => x.id))) {
    if (count(id) >= 3) issues.push({ level: 'note', message: `${byId.topping[id].name} ×${count(id)}. Respect.`, slots: ['topping'] })
  }

  // Nutrition
  if (t.sodium > 2300) {
    issues.push({ level: 'warn', message: `${t.sodium.toLocaleString()} mg sodium — more than a day's worth in one bowl. Drink the broth at your own risk.`, slots: ['broth', 'tare'] })
  }
  if (t.spice >= 3) {
    issues.push({ level: 'note', message: 'Spice 3/3. Inferno tier. Nobody at the counter will look at you.', slots: ['tare', 'oil', 'topping'] })
  }

  const order = { error: 0, warn: 1, note: 2 }
  return issues.sort((a, b) => order[a.level] - order[b.level])
}
