import { describe, expect, test } from 'bun:test'
import { computeTotals, linesOf } from './totals'
import type { Bowl } from '../../shared/bowl'

const bowl: Bowl = { brothId: 'tonkotsu', tareId: 'shio', noodleId: 'thin', oilId: 'mayu', toppings: [{ key: 'a', toppingId: 'chashu', x: 0, y: 0, rotation: 0 }] }

describe('computeTotals scaling', () => {
  test('defaults equal the catalogue sums', () => {
    const t = computeTotals(bowl)
    expect(t.kcal).toBe(380 + 0 + 300 + 90 + 220)
    expect(t.price).toBeCloseTo(3.5 + 0.3 + 0.9 + 0.4 + 2.5)
  })
  test('half the broth halves its kcal and sodium, not minutes', () => {
    const t = computeTotals({ ...bowl, brothMl: 200 })
    expect(t.kcal).toBe(190 + 0 + 300 + 90 + 220)
    expect(t.sodium).toBe(700 + 900 + 400 + 10 + 350)
    expect(t.minutes).toBe(computeTotals(bowl).minutes)
  })
  test('topping qty scales price and body load', () => {
    const two = computeTotals(bowl)
    const four = computeTotals({ ...bowl, toppings: [{ ...bowl.toppings[0], qty: 4 }] })
    expect(four.price).toBeCloseTo(two.price + 2.5)
    expect(four.bodyLoad).toBe(two.bodyLoad + 18)
  })
  test('portion levels use 0.5 / 1 / 1.75', () => {
    const b: Bowl = { ...bowl, toppings: [{ key: 'a', toppingId: 'corn', x: 0, y: 0, rotation: 0, qty: 2 }] }
    expect(computeTotals(b).kcal).toBe(380 + 300 + 90 + 70)
  })
  test('kcal, sodium and price are rounded sensibly', () => {
    const t = computeTotals({ ...bowl, brothMl: 250 })
    expect(Number.isInteger(t.kcal)).toBe(true)
    expect(Number.isInteger(t.sodium)).toBe(true)
  })
})

describe('diet and gluten', () => {
  test('all-plant bowl is vegan with gluten from noodles', () => {
    const t = computeTotals({ brothId: 'kombu', tareId: 'shio', noodleId: 'thin', oilId: null, toppings: [] })
    expect(t.diet).toBe('vegan')
    expect(t.gluten).toBe(true)
  })
  test('egg makes it vegetarian', () => {
    const t = computeTotals({ brothId: 'kombu', tareId: 'shio', noodleId: 'thin', oilId: null, toppings: [{ key: 'a', toppingId: 'ajitama', x: 0, y: 0, rotation: 0 }] })
    expect(t.diet).toBe('vegetarian')
  })
  test('pork makes it omnivore', () => {
    expect(computeTotals(bowl).diet).toBe('omnivore')
  })
  test('empty bowl is omnivore and gluten-free', () => {
    const t = computeTotals({ brothId: null, tareId: null, noodleId: null, oilId: null, toppings: [] })
    expect(t.diet).toBe('omnivore')
    expect(t.gluten).toBe(false)
  })
})

test('linesOf carries amount and factor', () => {
  const lines = linesOf({ ...bowl, brothMl: 200 })
  expect(lines[0]).toMatchObject({ slot: 'broth', amount: 200, factor: 0.5 })
  expect(lines[4]).toMatchObject({ slot: 'topping', amount: undefined, factor: 1 })
})
