/**
 * The parts catalogue. Every part carries the specs the build sheet needs:
 * price per serving, active prep minutes, calories, sodium, diet tags —
 * plus whatever the bowl renderer and the compatibility checker use.
 */

export type Tag = 'pork' | 'chicken' | 'fish' | 'egg' | 'dairy' | 'vegan' | 'vegetarian' | 'spicy' | 'gluten'

export type PartBase = {
  id: string
  name: string
  jp?: string
  note: string
  /** USD per serving */
  price: number
  /** active + simmer minutes */
  minutes: number
  kcal: number
  /** mg per serving */
  sodium: number
  tags: Tag[]
}

export type Broth = PartBase & {
  color: string
  deep: string
  opacity: number
  /** 0–100: how much body the broth has = how many heavy toppings it can carry */
  richness: number
}

export type Tare = PartBase & {
  tint: string
  tintStrength: number
  /** body added to the broth's capacity */
  bodyBonus: number
  spice: number
}

export type Noodle = PartBase & {
  color: string
  width: number
  wave: number
  /** 1 thin … 4 tsukemen-thick */
  heft: number
}

export type Topping = PartBase & {
  glyph: ToppingGlyph
  size: number
  /** how much broth body this topping demands */
  weight: number
  spice: number
}

export type AromaOil = PartBase & {
  color: string
  drops: number
  fat: number
  spice: number
}

export type ToppingGlyph =
  | 'chashu'
  | 'ajitama'
  | 'nori'
  | 'scallion'
  | 'menma'
  | 'corn'
  | 'naruto'
  | 'butter'
  | 'sprouts'
  | 'kikurage'
  | 'bokchoy'
  | 'chili'
  | 'garlic'
  | 'sesame'

export const broths: Broth[] = [
  { id: 'tonkotsu', name: 'Tonkotsu', jp: '豚骨', note: 'Pork bones boiled hard for 12+ hours until milky and emulsified.', price: 3.5, minutes: 720, kcal: 380, sodium: 1400, tags: ['pork'], color: '#e9d8b8', deep: '#c9ad82', opacity: 0.98, richness: 85 },
  { id: 'chintan', name: 'Chintan', jp: '清湯', note: 'Clear chicken and pork stock, simmered gently so it never clouds.', price: 2.2, minutes: 240, kcal: 120, sodium: 1100, tags: ['chicken', 'pork'], color: '#d8b06a', deep: '#a8783a', opacity: 0.72, richness: 40 },
  { id: 'paitan', name: 'Tori Paitan', jp: '鶏白湯', note: 'Chicken bones at a rolling boil — creamy, lighter than tonkotsu.', price: 2.8, minutes: 360, kcal: 260, sodium: 1200, tags: ['chicken'], color: '#efe3c6', deep: '#d0bb8d', opacity: 0.95, richness: 70 },
  { id: 'gyokai', name: 'Gyokai', jp: '魚介', note: 'Dried fish, niboshi and katsuobushi layered onto a pork base.', price: 3.2, minutes: 300, kcal: 200, sodium: 1300, tags: ['fish', 'pork'], color: '#b98a4d', deep: '#7f5a2a', opacity: 0.85, richness: 60 },
  { id: 'miso-base', name: 'Miso Stock', jp: '味噌', note: 'Sapporo-style: stir-fried miso and lard whisked into hot pork stock.', price: 2.6, minutes: 180, kcal: 300, sodium: 1500, tags: ['pork'], color: '#c9973f', deep: '#8f6320', opacity: 0.92, richness: 75 },
  { id: 'kombu', name: 'Kombu Dashi', jp: '昆布', note: 'Kombu, shiitake and roasted vegetables. Clean, deep umami. Fully plant-based.', price: 1.8, minutes: 60, kcal: 60, sodium: 900, tags: ['vegan', 'vegetarian'], color: '#cfae72', deep: '#9a7a44', opacity: 0.7, richness: 30 },
]

export const tares: Tare[] = [
  { id: 'shio', name: 'Shio', jp: '塩', note: 'Salt tare. Lets the broth speak — often with kombu and dried scallop.', price: 0.3, minutes: 15, kcal: 0, sodium: 900, tags: ['vegan', 'vegetarian'], tint: '#ffffff', tintStrength: 0.08, bodyBonus: 0, spice: 0 },
  { id: 'shoyu', name: 'Shoyu', jp: '醤油', note: 'Soy tare. The classic Tokyo bowl; savoury, slightly sweet.', price: 0.4, minutes: 20, kcal: 15, sodium: 1100, tags: ['vegan', 'vegetarian', 'gluten'], tint: '#4a2a12', tintStrength: 0.45, bodyBonus: 5, spice: 0 },
  { id: 'miso', name: 'Miso', jp: '味噌', note: 'Fermented soybean paste, sometimes blended with gochujang.', price: 0.6, minutes: 25, kcal: 40, sodium: 1000, tags: ['vegan', 'vegetarian'], tint: '#b8742b', tintStrength: 0.5, bodyBonus: 15, spice: 0 },
  { id: 'spicy', name: 'Kara-miso', jp: '辛味噌', note: 'Miso tare cut with chili, doubanjiang and sesame.', price: 0.7, minutes: 25, kcal: 45, sodium: 1050, tags: ['vegan', 'vegetarian', 'spicy'], tint: '#b2321d', tintStrength: 0.55, bodyBonus: 15, spice: 2 },
]

export const noodles: Noodle[] = [
  { id: 'thin', name: 'Hakata thin', note: 'Low-hydration, straight, cooked in seconds. Made for tonkotsu.', price: 0.9, minutes: 1, kcal: 300, sodium: 400, tags: ['vegan', 'vegetarian', 'gluten'], color: '#f3e3b3', width: 3, wave: 0.15, heft: 1 },
  { id: 'medium', name: 'Medium wavy', note: 'The everyday Tokyo noodle — springy with a gentle wave.', price: 1.0, minutes: 2, kcal: 320, sodium: 450, tags: ['vegan', 'vegetarian', 'gluten'], color: '#f0dd9f', width: 4.5, wave: 0.6, heft: 2 },
  { id: 'thick', name: 'Sapporo thick', note: 'High-hydration, chewy, curly. Holds up to miso.', price: 1.1, minutes: 3, kcal: 360, sodium: 500, tags: ['vegan', 'vegetarian', 'gluten'], color: '#e9cf7c', width: 6.5, wave: 1, heft: 3 },
  { id: 'tsukemen', name: 'Tsukemen', note: 'Extra-thick, meant to be served cold on the side for dipping.', price: 1.4, minutes: 4, kcal: 420, sodium: 550, tags: ['vegan', 'vegetarian', 'gluten'], color: '#e3cc8a', width: 8, wave: 0.35, heft: 4 },
]

export const toppings: Topping[] = [
  { id: 'chashu', name: 'Chashu', jp: 'チャーシュー', note: 'Rolled pork belly braised in soy and mirin, then seared.', price: 2.5, minutes: 150, kcal: 220, sodium: 350, tags: ['pork'], glyph: 'chashu', size: 52, weight: 18, spice: 0 },
  { id: 'ajitama', name: 'Ajitama', jp: '味玉', note: 'Soft-boiled egg marinated overnight in shoyu and dashi.', price: 0.8, minutes: 30, kcal: 80, sodium: 200, tags: ['egg', 'vegetarian'], glyph: 'ajitama', size: 40, weight: 6, spice: 0 },
  { id: 'nori', name: 'Nori', jp: '海苔', note: 'Roasted seaweed sheets, leaned against the rim.', price: 0.3, minutes: 0, kcal: 5, sodium: 10, tags: ['vegan', 'vegetarian'], glyph: 'nori', size: 30, weight: 2, spice: 0 },
  { id: 'scallion', name: 'Negi', jp: 'ネギ', note: 'Thinly sliced scallions. Non-negotiable.', price: 0.2, minutes: 3, kcal: 5, sodium: 2, tags: ['vegan', 'vegetarian'], glyph: 'scallion', size: 26, weight: 0, spice: 0 },
  { id: 'menma', name: 'Menma', jp: 'メンマ', note: 'Lacto-fermented bamboo shoots. Crunchy, savoury.', price: 0.6, minutes: 10, kcal: 20, sodium: 250, tags: ['vegan', 'vegetarian'], glyph: 'menma', size: 34, weight: 4, spice: 0 },
  { id: 'corn', name: 'Corn', note: 'Sweet corn — a Sapporo habit that stuck.', price: 0.3, minutes: 2, kcal: 40, sodium: 30, tags: ['vegan', 'vegetarian'], glyph: 'corn', size: 30, weight: 5, spice: 0 },
  { id: 'naruto', name: 'Narutomaki', jp: 'なると', note: 'Fish cake with the pink spiral. Mostly decoration, entirely joy.', price: 0.4, minutes: 2, kcal: 25, sodium: 120, tags: ['fish'], glyph: 'naruto', size: 30, weight: 3, spice: 0 },
  { id: 'butter', name: 'Butter', note: 'A cold pat that melts into miso broth. Hokkaido style.', price: 0.35, minutes: 0, kcal: 70, sodium: 60, tags: ['dairy', 'vegetarian'], glyph: 'butter', size: 24, weight: 22, spice: 0 },
  { id: 'sprouts', name: 'Moyashi', jp: 'もやし', note: 'Bean sprouts, blanched or stir-fried for crunch.', price: 0.25, minutes: 5, kcal: 15, sodium: 5, tags: ['vegan', 'vegetarian'], glyph: 'sprouts', size: 40, weight: 2, spice: 0 },
  { id: 'kikurage', name: 'Kikurage', jp: 'きくらげ', note: 'Wood-ear mushroom, sliced thin. Snappy texture.', price: 0.5, minutes: 10, kcal: 10, sodium: 5, tags: ['vegan', 'vegetarian'], glyph: 'kikurage', size: 34, weight: 3, spice: 0 },
  { id: 'bokchoy', name: 'Bok choy', note: 'Blanched greens for colour and a little relief.', price: 0.45, minutes: 4, kcal: 10, sodium: 30, tags: ['vegan', 'vegetarian'], glyph: 'bokchoy', size: 40, weight: 2, spice: 0 },
  { id: 'chili', name: 'Chili threads', note: 'Ito-togarashi — heat and drama in equal measure.', price: 0.3, minutes: 0, kcal: 2, sodium: 0, tags: ['vegan', 'vegetarian', 'spicy'], glyph: 'chili', size: 26, weight: 0, spice: 1 },
  { id: 'garlic', name: 'Fried garlic', note: 'Crispy garlic chips. Smells like a Hakata alley.', price: 0.25, minutes: 8, kcal: 30, sodium: 40, tags: ['vegan', 'vegetarian'], glyph: 'garlic', size: 24, weight: 6, spice: 0 },
  { id: 'sesame', name: 'Sesame', note: 'Toasted white sesame, scattered last.', price: 0.1, minutes: 1, kcal: 15, sodium: 1, tags: ['vegan', 'vegetarian'], glyph: 'sesame', size: 24, weight: 2, spice: 0 },
]

export const oils: AromaOil[] = [
  { id: 'chicken', name: 'Chicken fat', jp: '鶏油', note: 'Chi-yu: rendered chicken fat for a golden sheen.', price: 0.2, minutes: 15, kcal: 80, sodium: 0, tags: ['chicken'], color: '#f2c94c', drops: 8, fat: 12, spice: 0 },
  { id: 'mayu', name: 'Mayu', jp: 'マー油', note: 'Black garlic oil — burnt garlic in sesame oil. Kumamoto signature.', price: 0.4, minutes: 20, kcal: 90, sodium: 10, tags: ['vegan', 'vegetarian'], color: '#1a1410', drops: 7, fat: 10, spice: 0 },
  { id: 'rayu', name: 'Rayu', jp: 'ラー油', note: 'Chili oil. Bright red, medium heat.', price: 0.25, minutes: 10, kcal: 85, sodium: 20, tags: ['vegan', 'vegetarian', 'spicy'], color: '#d63b1f', drops: 9, fat: 8, spice: 1 },
  { id: 'niboshi', name: 'Niboshi oil', jp: '煮干し油', note: 'Sardine-infused oil. Funky, coastal.', price: 0.35, minutes: 15, kcal: 80, sodium: 40, tags: ['fish'], color: '#b98a3a', drops: 6, fat: 8, spice: 0 },
]

export type Slot = 'broth' | 'tare' | 'noodle' | 'oil' | 'topping'

export const slotMeta: Record<Slot, { label: string; jp: string; required: boolean; multiple: boolean; blurb: string }> = {
  broth: { label: 'Broth', jp: 'スープ', required: true, multiple: false, blurb: 'The chassis. Everything else has to fit it.' },
  tare: { label: 'Tare', jp: 'タレ', required: true, multiple: false, blurb: 'The seasoning concentrate at the bottom of the bowl.' },
  noodle: { label: 'Noodles', jp: '麺', required: true, multiple: false, blurb: 'Match thickness to broth weight.' },
  oil: { label: 'Aroma oil', jp: '香味油', required: false, multiple: false, blurb: 'Optional. The layer that hits your nose first.' },
  topping: { label: 'Toppings', jp: '具', required: false, multiple: true, blurb: 'Add as many as the broth can carry.' },
}

export const catalogue = { broth: broths, tare: tares, noodle: noodles, oil: oils, topping: toppings } as const

export const byId = {
  broth: Object.fromEntries(broths.map((b) => [b.id, b])) as Record<string, Broth>,
  tare: Object.fromEntries(tares.map((t) => [t.id, t])) as Record<string, Tare>,
  noodle: Object.fromEntries(noodles.map((n) => [n.id, n])) as Record<string, Noodle>,
  topping: Object.fromEntries(toppings.map((t) => [t.id, t])) as Record<string, Topping>,
  oil: Object.fromEntries(oils.map((o) => [o.id, o])) as Record<string, AromaOil>,
}

export const tagLabel: Record<Tag, string> = {
  pork: 'Pork',
  chicken: 'Chicken',
  fish: 'Fish',
  egg: 'Egg',
  dairy: 'Dairy',
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  spicy: 'Spicy',
  gluten: 'Gluten',
}
