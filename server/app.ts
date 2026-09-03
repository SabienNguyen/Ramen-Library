import { mkdirSync } from 'node:fs'
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { auth } from './auth'
import { ApiError } from './errors'
import { clientIp, createLimiter, limiters } from './ratelimit'
import { session } from './session'
import { api } from './routes'
import { s3Configured, LOCAL_UPLOAD_DIR } from './storage'

// `api-global` covers every request under /api/* (including the auth wildcard below).
// The `auth-*` tiers are picked by pathname on that same wildcard route, since Elysia
// treats it as a single `.all` handler rather than separate routes per auth action.
limiters['api-global'] = createLimiter({ name: 'api-global', windowMs: 60 * 1000, max: 300 })
limiters['auth-signup'] = createLimiter({ name: 'auth-signup', windowMs: 60 * 60 * 1000, max: 5 })
limiters['auth-signin'] = createLimiter({ name: 'auth-signin', windowMs: 15 * 60 * 1000, max: 10 })
limiters['auth-other'] = createLimiter({ name: 'auth-other', windowMs: 60 * 1000, max: 60 })

function authLimiterFor(pathname: string) {
  if (pathname === '/api/auth/sign-up/email') return limiters['auth-signup']
  if (pathname === '/api/auth/sign-in/email') return limiters['auth-signin']
  return limiters['auth-other']
}

export const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status
      if (error.headers) for (const [key, value] of Object.entries(error.headers)) set.headers[key] = value
      return { error: error.message }
    }
    if (code === 'VALIDATION') {
      const issue = error.all[0]
      const path = issue && issue.path && issue.path !== 'root' ? `${issue.path}: ` : ''
      set.status = 400
      return { error: `${path}${issue?.message ?? 'Invalid input.'}` }
    }
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Not found.' }
    }
    console.error(error)
    set.status = 500
    return { error: 'Something went wrong.' }
  })
  // Global per-IP cap on every /api/* request (never /uploads/* or other static files).
  // `onRequest` fires before routing, ahead of any `.use()`-mounted plugin's own hooks, so
  // this single hook on the root instance covers `api` and the `/api/auth/*` wildcard alike.
  .onRequest(({ request, server }) => {
    if (process.env.RATE_LIMIT_DISABLED === '1') return
    const { pathname } = new URL(request.url)
    if (!pathname.startsWith('/api/')) return
    const ip = clientIp(request, server)
    const result = limiters['api-global'].hit(`api-global:ip:${ip}`)
    if (!result.allowed) {
      throw new ApiError(429, `Too many requests. Try again in ${result.retryAfterSec}s.`, {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Remaining': String(result.remaining),
      })
    }
  })
  .use(session)
  .onBeforeHandle(({ request, server }) => {
    if (process.env.RATE_LIMIT_DISABLED === '1') return
    const { pathname } = new URL(request.url)
    if (!pathname.startsWith('/api/auth/')) return
    const ip = clientIp(request, server)
    const limiter = authLimiterFor(pathname)
    const result = limiter.hit(`${pathname}:ip:${ip}`)
    if (!result.allowed) {
      throw new ApiError(429, `Too many requests. Try again in ${result.retryAfterSec}s.`, {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Remaining': String(result.remaining),
      })
    }
  })
  .all('/api/auth/*', ({ request }) => auth.handler(request))
  .use(api)

if (!s3Configured) {
  // @elysiajs/static reads the assets directory at mount time, so it must exist even
  // though `storage.ts` otherwise creates it lazily on the first upload.
  mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true })
  app.use(
    await staticPlugin({
      assets: LOCAL_UPLOAD_DIR,
      prefix: '/uploads',
      // Without this, @elysiajs/static defaults `alwaysStatic` to true in production,
      // snapshotting the uploads dir at boot — files uploaded afterward would 404 out of
      // the static plugin and fall through to the SPA index.html fallback below.
      alwaysStatic: false,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }),
  )
}

if (process.env.NODE_ENV === 'production') {
  app.use(await staticPlugin({ assets: 'dist', prefix: '/' })).get('*', ({ request, set }) => {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) {
      set.status = 404
      return { error: 'Not found.' }
    }
    return Bun.file('dist/index.html')
  })
}

export type App = typeof app
