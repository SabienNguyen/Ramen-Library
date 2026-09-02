/**
 * The ingredient catalogue — the "library" half of Ramen Library.
 * Every entry carries what the bowl renderer needs (colours, glyph id)
 * plus a one-line note so the palette doubles as a learning tool.
 */

export type Broth = {
  id: string
  name: string
  jp: string
  note: string
  color: string // surface colour of the broth
  deep: string // colour at the rim / shadow
  opacity: number // how opaque the broth is (clear shio vs. milky tonkotsu)
  richness: number // 0–100 baseline body
}

export type Tare = {
  id: string
  name: string
  jp: string
  note: string
  tint: string // blended over the broth
  tintStrength: number // 0–1
}

export type Noodle = {
  id: string
  name: string
  note: string
  color: string
  width: number // stroke width in the SVG
  wave: number // wave amplitude (0 = straight, 1 = very curly)
}

export type Topping = {
  id: string
  name: string
  jp?: string
  note: string
  glyph: ToppingGlyph
  /** rough footprint, used for spacing when auto-placing */
  size: number
}

export type AromaOil = {
  id: string
  name: string
  jp: string
  note: string
  color: string
  drops: number
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
  { id: 'tonkotsu', name: 'Tonkotsu', jp: '豚骨', note: 'Pork bones boiled hard for 12+ hours until milky and emulsified.', color: '#e9d8b8', deep: '#c9ad82', opacity: 0.98, richness: 85 },
  { id: 'chintan', name: 'Chintan', jp: '清湯', note: 'Clear chicken or pork stock, simmered gently so it never clouds.', color: '#d8b06a', deep: '#a8783a', opacity: 0.72, richness: 40 },
  { id: 'paitan', name: 'Tori Paitan', jp: '鶏白湯', note: 'Chicken bones at a rolling boil — creamy, lighter than tonkotsu.', color: '#efe3c6', deep: '#d0bb8d', opacity: 0.95, richness: 70 },
  { id: 'gyokai', name: 'Gyokai', jp: '魚介', note: 'Dried fish, niboshi and katsuobushi layered onto a pork base.', color: '#b98a4d', deep: '#7f5a2a', opacity: 0.85, richness: 60 },
  { id: 'miso-base', name: 'Miso Stock', jp: '味噌', note: 'Sapporo-style: stir-fried miso and lard whisked into hot stock.', color: '#c9973f', deep: '#8f6320', opacity: 0.92, richness: 75 },
  { id: 'vegan', name: 'Kombu Dashi', jp: '昆布', note: 'Kombu, shiitake and roasted vegetables. Clean, deep umami.', color: '#cfae72', deep: '#9a7a44', opacity: 0.7, richness: 30 },
]

export const tares: Tare[] = [
  { id: 'shio', name: 'Shio', jp: '塩', note: 'Salt tare. Lets the broth speak — often with kombu and dried scallop.', tint: '#ffffff', tintStrength: 0.08 },
  { id: 'shoyu', name: 'Shoyu', jp: '醤油', note: 'Soy tare. The classic Tokyo bowl; savoury, slightly sweet.', tint: '#4a2a12', tintStrength: 0.45 },
  { id: 'miso', name: 'Miso', jp: '味噌', note: 'Fermented soybean paste, sometimes blended with gochujang.', tint: '#b8742b', tintStrength: 0.5 },
  { id: 'spicy', name: 'Kara-miso', jp: '辛味噌', note: 'Miso tare cut with chili, doubanjiang and sesame.', tint: '#b2321d', tintStrength: 0.55 },
]

export const noodles: Noodle[] = [
  { id: 'thin', name: 'Hakata thin', note: 'Low-hydration, straight, cooked in seconds. Made for tonkotsu.', color: '#f3e3b3', width: 3, wave: 0.15 },
  { id: 'medium', name: 'Medium wavy', note: 'The everyday Tokyo noodle — springy with a gentle wave.', color: '#f0dd9f', width: 4.5, wave: 0.6 },
  { id: 'thick', name: 'Sapporo thick', note: 'High-hydration, chewy, curly. Holds up to miso.', color: '#e9cf7c', width: 6.5, wave: 1 },
  { id: 'tsukemen', name: 'Tsukemen', note: 'Extra-thick, served cold for dipping. Just here to flex.', color: '#e3cc8a', width: 8, wave: 0.35 },
]

export const toppings: Topping[] = [
  { id: 'chashu', name: 'Chashu', jp: 'チャーシュー', note: 'Rolled pork belly braised in soy and mirin, then seared.', glyph: 'chashu', size: 52 },
  { id: 'ajitama', name: 'Ajitama', jp: '味玉', note: 'Soft-boiled egg marinated overnight in shoyu and dashi.', glyph: 'ajitama', size: 40 },
  { id: 'nori', name: 'Nori', jp: '海苔', note: 'Roasted seaweed sheets, leaned against the rim.', glyph: 'nori', size: 30 },
  { id: 'scallion', name: 'Negi', jp: 'ネギ', note: 'Thinly sliced scallions. Non-negotiable.', glyph: 'scallion', size: 26 },
  { id: 'menma', name: 'Menma', jp: 'メンマ', note: 'Lacto-fermented bamboo shoots. Crunchy, savoury.', glyph: 'menma', size: 34 },
  { id: 'corn', name: 'Corn', note: 'Sweet corn — a Sapporo habit that stuck.', glyph: 'corn', size: 30 },
  { id: 'naruto', name: 'Narutomaki', jp: 'なると', note: 'Fish cake with the pink spiral. Mostly decoration, entirely joy.', glyph: 'naruto', size: 30 },
  { id: 'butter', name: 'Butter', note: 'A cold pat that melts into miso broth. Hokkaido style.', glyph: 'butter', size: 24 },
  { id: 'sprouts', name: 'Moyashi', jp: 'もやし', note: 'Bean sprouts, blanched or stir-fried for crunch.', glyph: 'sprouts', size: 40 },
  { id: 'kikurage', name: 'Kikurage', jp: 'きくらげ', note: 'Wood-ear mushroom, sliced thin. Snappy texture.', glyph: 'kikurage', size: 34 },
  { id: 'bokchoy', name: 'Bok choy', note: 'Blanched greens for colour and a little relief.', glyph: 'bokchoy', size: 40 },
  { id: 'chili', name: 'Chili threads', note: 'Ito-togarashi — heat and drama in equal measure.', glyph: 'chili', size: 26 },
  { id: 'garlic', name: 'Fried garlic', note: 'Crispy garlic chips. Smells like a Hakata alley.', glyph: 'garlic', size: 24 },
  { id: 'sesame', name: 'Sesame', note: 'Toasted white sesame, scattered last.', glyph: 'sesame', size: 24 },
]

export const oils: AromaOil[] = [
  { id: 'none', name: 'None', jp: '—', note: 'Keep it clean.', color: 'transparent', drops: 0 },
  { id: 'chicken', name: 'Chicken fat', jp: '鶏油', note: 'Chi-yu: rendered chicken fat for a golden sheen.', color: '#f2c94c', drops: 8 },
  { id: 'mayu', name: 'Mayu', jp: 'マー油', note: 'Black garlic oil — burnt garlic in sesame oil. Kumamoto signature.', color: '#1a1410', drops: 7 },
  { id: 'rayu', name: 'Rayu', jp: 'ラー油', note: 'Chili oil. Bright red, medium heat.', color: '#d63b1f', drops: 9 },
  { id: 'niboshi', name: 'Niboshi oil', jp: '煮干し油', note: 'Sardine-infused oil. Funky, coastal.', color: '#b98a3a', drops: 6 },
]

export const byId = {
  broth: Object.fromEntries(broths.map((b) => [b.id, b])) as Record<string, Broth>,
  tare: Object.fromEntries(tares.map((t) => [t.id, t])) as Record<string, Tare>,
  noodle: Object.fromEntries(noodles.map((n) => [n.id, n])) as Record<string, Noodle>,
  topping: Object.fromEntries(toppings.map((t) => [t.id, t])) as Record<string, Topping>,
  oil: Object.fromEntries(oils.map((o) => [o.id, o])) as Record<string, AromaOil>,
}
