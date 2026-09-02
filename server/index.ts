import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { auth } from './auth'
import { db } from './db/client'
import { api, type Env } from './routes'
import { UPLOAD_DIR } from './uploads'
import path from 'node:path'

// Apply migrations at boot so `pnpm dev` on a fresh clone just works.
migrate(db, { migrationsFolder: new URL('./db/migrations', import.meta.url).pathname })

const app = new Hono<Env>()

app.use(logger())

// Attach the session (if any) to every request.
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)
  await next()
})

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
app.route('/api', api)

// Uploaded photos. Immutable names, so cache hard.
app.use('/uploads/*', async (c, next) => {
  await next()
  if (c.res.ok) c.header('Cache-Control', 'public, max-age=31536000, immutable')
})
app.use('/uploads/*', serveStatic({ root: path.relative(process.cwd(), path.dirname(UPLOAD_DIR)) || '.' }))

// Production: serve the built SPA and fall back to index.html for client routes.
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ root: './dist', path: 'index.html' }))
}

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port, hostname: process.env.HOST ?? '127.0.0.1' }, (info) => {
  console.log(`🍜 API listening on http://${info.address}:${info.port}`)
})
