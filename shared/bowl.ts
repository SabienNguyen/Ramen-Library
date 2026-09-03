/** Build shapes shared by the client store and the API. */
export type PlacedTopping = {
  key: string
  toppingId: string
  x: number
  y: number
  rotation: number
  /** Piece count for countable toppings, level index 0–2 for portion toppings. Missing = default. */
  qty?: number
}

export type Bowl = {
  brothId: string | null
  tareId: string | null
  noodleId: string | null
  oilId: string | null
  /** Missing = the part's default serving. */
  brothMl?: number
  tareMl?: number
  noodleG?: number
  oilMl?: number
  toppings: PlacedTopping[]
}

export const AMOUNT_KEY = { broth: 'brothMl', tare: 'tareMl', noodle: 'noodleG', oil: 'oilMl' } as const

export const MAX_TOPPINGS = 12

/** Illustrated cover templates for builds without a photo. 'live' = the procedural bowl render. */
export const COVER_TEMPLATES = [
  { id: 'live', label: 'Live render', blurb: 'Drawn from your exact parts.' },
  { id: 'topdown', label: 'Top-down', blurb: 'The classic overhead shot.' },
  { id: 'chopsticks', label: 'Noodle lift', blurb: 'Chopsticks, steam, sunburst.' },
  { id: 'noren', label: 'Shop curtain', blurb: 'Noren with your bowl’s colour.' },
  { id: 'waves', label: 'Seigaiha', blurb: 'Wave pattern, bowl badge.' },
] as const
export type CoverTemplateId = (typeof COVER_TEMPLATES)[number]['id']

export const FORUM_CATEGORIES = [
  { id: 'general', label: 'General', blurb: 'Anything ramen.' },
  { id: 'recipes', label: 'Recipes', blurb: 'Tare ratios, broth timings, the stuff that works.' },
  { id: 'technique', label: 'Technique', blurb: 'Emulsions, noodle hydration, kansui, tools.' },
  { id: 'show', label: 'Show & tell', blurb: 'Post the bowl. Get roasted lovingly.' },
  { id: 'regional', label: 'Regional', blurb: 'Hakata vs Sapporo vs Kitakata vs everyone.' },
] as const
export type ForumCategory = (typeof FORUM_CATEGORIES)[number]['id']
