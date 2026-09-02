import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { broths, noodles, oils, tares, toppings } from '@/data/ingredients'

export type PlacedTopping = {
  /** unique instance id */
  key: string
  toppingId: string
  /** position inside the bowl, in bowl-space (viewBox 0..400) */
  x: number
  y: number
  rotation: number
}

export type Bowl = {
  brothId: string
  tareId: string
  noodleId: string
  oilId: string
  toppings: PlacedTopping[]
  /** 0–3 chilies */
  spice: number
  /** 0–100 — how much fat / body */
  richness: number
}

export type SavedBowl = Bowl & {
  id: string
  name: string
  savedAt: number
}

type BowlState = {
  bowl: Bowl
  library: SavedBowl[]
  setBroth: (id: string) => void
  setTare: (id: string) => void
  setNoodle: (id: string) => void
  setOil: (id: string) => void
  setSpice: (n: number) => void
  setRichness: (n: number) => void
  addTopping: (id: string) => void
  removeTopping: (key: string) => void
  moveTopping: (key: string, x: number, y: number) => void
  clearToppings: () => void
  randomize: () => void
  reset: () => void
  save: (name: string) => SavedBowl
  load: (id: string) => void
  remove: (id: string) => void
}

const defaultBowl: Bowl = {
  brothId: 'tonkotsu',
  tareId: 'shoyu',
  noodleId: 'thin',
  oilId: 'none',
  toppings: [],
  spice: 0,
  richness: 60,
}

const uid = () => Math.random().toString(36).slice(2, 9)

/** Deterministic-ish spot inside the bowl that avoids the exact centre pile-up. */
function spotFor(index: number): { x: number; y: number; rotation: number } {
  const golden = 2.399963 // golden angle
  const r = 28 + 22 * Math.sqrt((index % 9) + 1)
  const a = index * golden
  return {
    x: 200 + Math.cos(a) * r * 1.35,
    y: 205 + Math.sin(a) * r * 0.55,
    rotation: ((index * 37) % 60) - 30,
  }
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export const useBowlStore = create<BowlState>()(
  persist(
    (set, get) => ({
      bowl: defaultBowl,
      library: [],
      setBroth: (brothId) => set((s) => ({ bowl: { ...s.bowl, brothId } })),
      setTare: (tareId) => set((s) => ({ bowl: { ...s.bowl, tareId } })),
      setNoodle: (noodleId) => set((s) => ({ bowl: { ...s.bowl, noodleId } })),
      setOil: (oilId) => set((s) => ({ bowl: { ...s.bowl, oilId } })),
      setSpice: (spice) => set((s) => ({ bowl: { ...s.bowl, spice } })),
      setRichness: (richness) => set((s) => ({ bowl: { ...s.bowl, richness } })),
      addTopping: (toppingId) =>
        set((s) => {
          if (s.bowl.toppings.length >= 12) return s
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
            oilId: pick(oils).id,
            spice: Math.floor(Math.random() * 4),
            richness: 30 + Math.floor(Math.random() * 60),
            toppings: chosen.map((t, i) => ({ key: uid(), toppingId: t.id, ...spotFor(i) })),
          },
        })
      },
      reset: () => set({ bowl: defaultBowl }),
      save: (name) => {
        const saved: SavedBowl = { ...get().bowl, id: uid(), name: name.trim() || 'Untitled bowl', savedAt: Date.now() }
        set((s) => ({ library: [saved, ...s.library] }))
        return saved
      },
      load: (id) => {
        const found = get().library.find((b) => b.id === id)
        if (!found) return
        set({
          bowl: {
            brothId: found.brothId,
            tareId: found.tareId,
            noodleId: found.noodleId,
            oilId: found.oilId,
            toppings: found.toppings,
            spice: found.spice,
            richness: found.richness,
          },
        })
      },
      remove: (id) => set((s) => ({ library: s.library.filter((b) => b.id !== id) })),
    }),
    { name: 'ramen-library', version: 1 },
  ),
)
