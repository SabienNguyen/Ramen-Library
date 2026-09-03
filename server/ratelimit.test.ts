import { describe, expect, test } from 'bun:test'
import { createLimiter, clientIp } from './ratelimit'

describe('createLimiter', () => {
  test('allows up to max hits then blocks with correct retryAfterSec', () => {
    let now = 1_000_000
    const limiter = createLimiter({ name: 'test', windowMs: 60_000, max: 3 }, () => now)

    const r1 = limiter.hit('a')
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = limiter.hit('a')
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = limiter.hit('a')
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)

    const r4 = limiter.hit('a')
    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
    expect(r4.retryAfterSec).toBeGreaterThan(0)
    expect(r4.retryAfterSec).toBeLessThanOrEqual(60)
  })

  test('allows again after the window elapses, using an injected clock', () => {
    let now = 1_000_000
    const limiter = createLimiter({ name: 'test2', windowMs: 60_000, max: 1 }, () => now)

    expect(limiter.hit('a').allowed).toBe(true)
    expect(limiter.hit('a').allowed).toBe(false)

    now += 60_001
    const after = limiter.hit('a')
    expect(after.allowed).toBe(true)
    expect(after.remaining).toBe(0)
  })

  test('different keys are tracked independently', () => {
    let now = 1_000_000
    const limiter = createLimiter({ name: 'test3', windowMs: 60_000, max: 1 }, () => now)

    expect(limiter.hit('a').allowed).toBe(true)
    expect(limiter.hit('b').allowed).toBe(true)
    expect(limiter.hit('a').allowed).toBe(false)
  })

  test('reset() clears all counters', () => {
    let now = 1_000_000
    const limiter = createLimiter({ name: 'test4', windowMs: 60_000, max: 1 }, () => now)

    expect(limiter.hit('a').allowed).toBe(true)
    expect(limiter.hit('a').allowed).toBe(false)
    limiter.reset()
    expect(limiter.hit('a').allowed).toBe(true)
  })
})

describe('clientIp', () => {
  const fakeServer = { requestIP: (_req: Request) => ({ address: '10.0.0.1' }) }

  test('honours TRUST_PROXY and uses the first X-Forwarded-For entry', () => {
    process.env.TRUST_PROXY = '1'
    const req = new Request('http://localhost/api/x', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.2' },
    })
    expect(clientIp(req, fakeServer)).toBe('203.0.113.5')
    delete process.env.TRUST_PROXY
  })

  test('without TRUST_PROXY ignores the header and falls back to server.requestIP', () => {
    delete process.env.TRUST_PROXY
    const req = new Request('http://localhost/api/x', {
      headers: { 'x-forwarded-for': '203.0.113.5' },
    })
    expect(clientIp(req, fakeServer)).toBe('10.0.0.1')
  })

  test('falls back to "unknown" when there is no server and no trusted header', () => {
    delete process.env.TRUST_PROXY
    const req = new Request('http://localhost/api/x')
    expect(clientIp(req, null)).toBe('unknown')
  })

  test('TRUST_PROXY=1 with no X-Forwarded-For header falls back to server.requestIP', () => {
    process.env.TRUST_PROXY = '1'
    const req = new Request('http://localhost/api/x')
    expect(clientIp(req, fakeServer)).toBe('10.0.0.1')
    delete process.env.TRUST_PROXY
  })
})
