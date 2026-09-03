import { describe, expect, test } from 'bun:test'
import { bowlSchema, coverSchema } from './validation.ts'

describe('uploadUrl validation (via coverSchema)', () => {
  test('accepts a local /uploads/<id>.webp URL', () => {
    const res = coverSchema.safeParse({ imageUrl: '/uploads/abc123.webp' })
    expect(res.success).toBe(true)
  })

  test('accepts a local /uploads/<id>.thumb.webp URL', () => {
    const res = coverSchema.safeParse({ imageUrl: '/uploads/abc-123.thumb.webp' })
    expect(res.success).toBe(true)
  })

  test('accepts an absolute http(s) URL of the same shape', () => {
    const res = coverSchema.safeParse({ imageUrl: 'https://img.example.com/abc123.webp' })
    expect(res.success).toBe(true)
    const res2 = coverSchema.safeParse({ imageUrl: 'http://localhost:8081/abc-123.thumb.webp' })
    expect(res2.success).toBe(true)
  })

  test('rejects arbitrary paths', () => {
    const res = coverSchema.safeParse({ imageUrl: '/etc/passwd' })
    expect(res.success).toBe(false)
  })

  test('rejects non-webp extensions', () => {
    const res = coverSchema.safeParse({ imageUrl: '/uploads/abc123.png' })
    expect(res.success).toBe(false)
  })
})

const base = { brothId: 'tonkotsu', tareId: 'shio', noodleId: 'thin', oilId: null, toppings: [] }

describe('bowl amounts', () => {
  test('amounts are optional', () => {
    expect(bowlSchema.safeParse(base).success).toBe(true)
  })
  test('in-range amounts pass', () => {
    const r = bowlSchema.safeParse({ ...base, brothMl: 500, tareMl: 20, noodleG: 150, toppings: [{ key: 'a', toppingId: 'chashu', x: 1, y: 1, rotation: 0, qty: 3 }] })
    expect(r.success).toBe(true)
  })
  test('out-of-range broth is rejected naming the part', () => {
    const r = bowlSchema.safeParse({ ...base, brothMl: 900 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toContain('Tonkotsu')
  })
  test('portion topping qty above 2 is rejected', () => {
    const r = bowlSchema.safeParse({ ...base, toppings: [{ key: 'a', toppingId: 'scallion', x: 1, y: 1, rotation: 0, qty: 3 }] })
    expect(r.success).toBe(false)
  })
  test('countable topping qty 0 is rejected', () => {
    const r = bowlSchema.safeParse({ ...base, toppings: [{ key: 'a', toppingId: 'chashu', x: 1, y: 1, rotation: 0, qty: 0 }] })
    expect(r.success).toBe(false)
  })
})
