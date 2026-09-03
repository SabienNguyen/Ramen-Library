import { describe, expect, test } from 'bun:test'
import { broths, byId, catalogue, formatAmount, noodles, oils, scaleFactor, tares, toppings } from './ingredients'

describe('catalogue servings', () => {
  test('every part has diet, gluten and a serving', () => {
    for (const list of Object.values(catalogue)) {
      for (const p of list) {
        expect(['plant', 'egg', 'dairy', 'fish', 'chicken', 'pork']).toContain(p.diet)
        expect(typeof p.gluten).toBe('boolean')
        expect(p.serving).toBeDefined()
      }
    }
  })
  test('liquids are ml, noodles are g', () => {
    for (const b of broths) expect(b.serving.unit).toBe('ml')
    for (const t of tares) expect(t.serving.unit).toBe('ml')
    for (const o of oils) expect(o.serving.unit).toBe('ml')
    for (const n of noodles) expect(n.serving.unit).toBe('g')
  })
  test('toppings are piece or portion', () => {
    for (const t of toppings) expect(['piece', 'portion']).toContain(t.serving.unit)
    expect(byId.topping.chashu.serving.unit).toBe('piece')
    expect(byId.topping.scallion.serving.unit).toBe('portion')
  })
})

describe('scaleFactor', () => {
  test('undefined amount is the default (factor 1)', () => {
    expect(scaleFactor(byId.broth.tonkotsu, undefined)).toBe(1)
    expect(scaleFactor(byId.topping.scallion, undefined)).toBe(1)
  })
  test('numeric units scale linearly', () => {
    expect(scaleFactor(byId.broth.tonkotsu, 200)).toBe(0.5)
    expect(scaleFactor(byId.topping.chashu, 4)).toBe(2)
    expect(scaleFactor(byId.oil.mayu, 0)).toBe(0)
  })
  test('portion levels map to 0.5 / 1 / 1.75', () => {
    expect(scaleFactor(byId.topping.scallion, 0)).toBe(0.5)
    expect(scaleFactor(byId.topping.scallion, 1)).toBe(1)
    expect(scaleFactor(byId.topping.scallion, 2)).toBe(1.75)
  })
})

describe('formatAmount', () => {
  test('formats each unit', () => {
    expect(formatAmount(byId.broth.tonkotsu, undefined)).toBe('400 ml')
    expect(formatAmount(byId.noodle.thin, 150)).toBe('150 g')
    expect(formatAmount(byId.topping.chashu, 1)).toBe('1 pc')
    expect(formatAmount(byId.topping.chashu, 3)).toBe('3 pcs')
    expect(formatAmount(byId.topping.scallion, 2)).toBe('heap')
  })
})
