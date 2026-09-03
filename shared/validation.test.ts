import { describe, expect, test } from 'bun:test'
import { coverSchema } from './validation.ts'

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
