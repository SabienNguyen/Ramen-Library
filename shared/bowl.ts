/** Build shapes shared by the client store and the API. */
export type PlacedTopping = {
  key: string
  toppingId: string
  x: number
  y: number
  rotation: number
}

export type Bowl = {
  brothId: string | null
  tareId: string | null
  noodleId: string | null
  oilId: string | null
  toppings: PlacedTopping[]
}

export const MAX_TOPPINGS = 12

export const FORUM_CATEGORIES = [
  { id: 'general', label: 'General', blurb: 'Anything ramen.' },
  { id: 'recipes', label: 'Recipes', blurb: 'Tare ratios, broth timings, the stuff that works.' },
  { id: 'technique', label: 'Technique', blurb: 'Emulsions, noodle hydration, kansui, tools.' },
  { id: 'show', label: 'Show & tell', blurb: 'Post the bowl. Get roasted lovingly.' },
  { id: 'regional', label: 'Regional', blurb: 'Hakata vs Sapporo vs Kitakata vs everyone.' },
] as const
export type ForumCategory = (typeof FORUM_CATEGORIES)[number]['id']
