import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { broths, noodles, oils, tares, toppings, type Slot } from '@/data/ingredients'

export type PlacedTopping = {
  /** unique instance id */
  key: string
  toppingId: string
  /** position inside the bowl, in bowl-space (viewBox 0..400) */
  x: number
  y: number
  rotation: number
}

/** A build. Single slots are nullable = "Choose a …" like an empty part row. */
export type Bowl = {
  brothId: string | null
  tareId: string | null
  noodleId: string | null
  oilId: string | null
  toppings: PlacedTopping[]
}

export type SavedBowl = Bowl & {
  id: string
  name: string
  savedAt: number
}

type SingleSlot = Exclude<Slot, 'topping'>

type BowlState = {
  bowl: Bowl
  library: SavedBowl[]
  setPart: (slot: SingleSlot, id: string | null) => void
  addTopping: (id: string) => void
  removeTopping: (key: string) => void
  moveTopping: (key: string, x: number, y: number) => void
  clearToppings: () => void
  randomize: () => void
  reset: () => void
  replace: (bowl: Bowl) => void
  save: (name: string) => SavedBowl
  load: (id: string) => void
  remove: (id: string) => void
}

export const emptyBowl: Bowl = { brothId: null, tareId: null, noodleId: null, oilId: null, toppings: [] }

export const slotKey: Record<SingleSlot, keyof Bowl> = { broth: 'brothId', tare: 'tareId', noodle: 'noodleId', oil: 'oilId' }

const uid = () => Math.random().toString(36).slice(2, 9)

/** Golden-angle spiral so toppings never pile up on the exact centre. */
export function spotFor(index: number): { x: number; y: number; rotation: number } {
  const golden = 2.399963
  const r = 28 + 22 * Math.sqrt((index % 9) + 1)
  const a = index * golden
  return {
    x: 200 + Math.cos(a) * r * 1.35,
    y: 205 + Math.sin(a) * r * 0.55,
    rotation: ((index * 37) % 60) - 30,
  }
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export const MAX_TOPPINGS = 12

export const useBowlStore = create<BowlState>()(
  persist(
    (set, get) => ({
      bowl: emptyBowl,
      library: [],
      setPart: (slot, id) => set((s) => ({ bowl: { ...s.bowl, [slotKey[slot]]: id } })),
      addTopping: (toppingId) =>
        set((s) => {
          if (s.bowl.toppings.length >= MAX_TOPPINGS) return s
          const placed: PlacedTopping = { key: uid(), toppingId, ...spotFor(s.bowl.toppings.length) }
          return { bowl: { ...s.bowl, toppings: [...s.bowl.toppings, placed] } }
        }),
      removeTopping: (key) => set((s) => ({ bowl: { ...s.bowl, toppings: s.bowl.toppings.filter((t) => t.key !== key) } })),
      moveTopping: (key, x, y) =>
        set((s) => ({
          bowl: { ...s.bowl, toppings: s.bowl.toppings.map((t) => (t.key === key ? { ...t, x, y } : t)) },
        })),
      clearToppings: () => set((s) => ({ bowl: { ...s.bowl, toppings: [] } })),
      randomize: () => {
        const count = 3 + Math.floor(Math.random() * 4)
        const chosen = [...toppings].sort(() => Math.random() - 0.5).slice(0, count)
        set({
          bowl: {
            brothId: pick(broths).id,
            tareId: pick(tares).id,
            noodleId: pick(noodles).id,
            oilId: Math.random() < 0.3 ? null : pick(oils).id,
            toppings: chosen.map((t, i) => ({ key: uid(), toppingId: t.id, ...spotFor(i) })),
          },
        })
      },
      reset: () => set({ bowl: emptyBowl }),
      replace: (bowl) => set({ bowl }),
      save: (name) => {
        const saved: SavedBowl = { ...get().bowl, id: uid(), name: name.trim() || 'Untitled build', savedAt: Date.now() }
        set((s) => ({ library: [saved, ...s.library] }))
        return saved
      },
      load: (id) => {
        const found = get().library.find((b) => b.id === id)
        if (!found) return
        set({ bowl: { brothId: found.brothId, tareId: found.tareId, noodleId: found.noodleId, oilId: found.oilId, toppings: found.toppings } })
      },
      remove: (id) => set((s) => ({ library: s.library.filter((b) => b.id !== id) })),
    }),
    {
      name: 'ramen-library',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Partial<BowlState>
        if (version < 2) {
          const fix = <T extends Bowl>(b: T): T => ({ ...b, oilId: b.oilId === 'none' ? null : b.oilId })
          return {
            ...state,
            bowl: state.bowl ? fix(state.bowl) : emptyBowl,
            library: (state.library ?? []).map(fix),
          }
        }
        return state
      },
    },
  ),
)
