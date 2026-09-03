import { mkdirSync } from 'node:fs'
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'
import { auth } from './auth'
import { ApiError } from './errors'
import { session } from './session'
import { api } from './routes'
import { s3Configured, LOCAL_UPLOAD_DIR } from './storage'

export const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status
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
  .use(session)
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
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }),
  )
}

if (process.env.NODE_ENV === 'production') {
  app.use(await staticPlugin({ assets: 'dist', prefix: '/' })).get('*', () => Bun.file('dist/index.html'))
}

export type App = typeof app
