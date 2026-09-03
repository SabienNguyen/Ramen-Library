import { Elysia } from 'elysia'
import { ApiError } from './errors'

export interface LimiterOptions {
  name: string
  windowMs: number
  max: number
}

export interface Limiter {
  hit(key: string): { allowed: boolean; remaining: number; retryAfterSec: number }
  reset(): void
}

interface Entry {
  count: number
  windowStart: number
}

const MAX_ENTRIES_BEFORE_SWEEP = 10_000

/** Fixed-window counter. Stale entries (whose window has already elapsed) are evicted
 * lazily — every `EVICT_EVERY_N_HITS` hits, or whenever the map grows past
 * `MAX_ENTRIES_BEFORE_SWEEP` — so memory stays bounded without a background timer. */
export function createLimiter(opts: LimiterOptions, now: () => number = Date.now): Limiter {
  const counts = new Map<string, Entry>()
  let hits = 0
  const EVICT_EVERY_N_HITS = 1000

  function sweep(currentTime: number) {
    for (const [key, entry] of counts) {
      if (currentTime - entry.windowStart >= opts.windowMs) counts.delete(key)
    }
  }

  return {
    hit(key: string) {
      const t = now()
      hits += 1
      if (hits % EVICT_EVERY_N_HITS === 0 || counts.size > MAX_ENTRIES_BEFORE_SWEEP) sweep(t)

      let entry = counts.get(key)
      if (!entry || t - entry.windowStart >= opts.windowMs) {
        entry = { count: 0, windowStart: t }
        counts.set(key, entry)
      }

      const windowEnd = entry.windowStart + opts.windowMs
      if (entry.count >= opts.max) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSec: Math.max(1, Math.ceil((windowEnd - t) / 1000)),
        }
      }

      entry.count += 1
      return {
        allowed: true,
        remaining: Math.max(0, opts.max - entry.count),
        retryAfterSec: Math.max(0, Math.ceil((windowEnd - t) / 1000)),
      }
    },
    reset() {
      counts.clear()
      hits = 0
    },
  }
}

/** Registry of every active limiter, keyed by tier name, so tests can `reset()` them. */
export const limiters: Record<string, Limiter> = {}

/** Resolves the request's IP. When `TRUST_PROXY=1` (set only behind a proxy that sets
 * the header itself, e.g. Caddy), trusts the first entry of X-Forwarded-For; otherwise
 * falls back to Bun's own view of the socket via `server.requestIP`. */
export function clientIp(
  request: Request,
  server: { requestIP(req: Request): { address: string } | null } | null,
): string {
  if (process.env.TRUST_PROXY === '1') {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      const first = forwarded.split(',')[0]?.trim()
      if (first) return first
    }
  }
  return server?.requestIP(request)?.address ?? 'unknown'
}

/** A scoped plugin: apply with `.use(rateLimit({...}))` inside a `.guard`/group so the
 * `onBeforeHandle` only fires for the routes that opt in. Throws `ApiError(429, ...)` with
 * `Retry-After` / `X-RateLimit-Remaining` carried on the error (see server/errors.ts) since
 * headers set directly in a hook don't survive an error being thrown out of it. */
export function rateLimit(opts: LimiterOptions & { keyFor?: 'ip' | 'user-or-ip' }): Elysia {
  const limiter = limiters[opts.name] ?? createLimiter(opts)
  limiters[opts.name] = limiter

  return new Elysia({ name: `rate-limit-${opts.name}` }).onBeforeHandle(
    { as: 'scoped' },
    ({ request, server, user }: { request: Request; server: unknown; user?: { id: string } | null }) => {
      if (process.env.RATE_LIMIT_DISABLED === '1') return

      const ip = clientIp(request, server as Parameters<typeof clientIp>[1])
      const key =
        opts.keyFor === 'user-or-ip' && user ? `${opts.name}:user:${user.id}` : `${opts.name}:ip:${ip}`

      const result = limiter.hit(key)
      if (!result.allowed) {
        throw new ApiError(429, `Too many requests. Try again in ${result.retryAfterSec}s.`, {
          'Retry-After': String(result.retryAfterSec),
          'X-RateLimit-Remaining': String(result.remaining),
        })
      }
    },
  )
}
