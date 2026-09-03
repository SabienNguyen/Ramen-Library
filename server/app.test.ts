import { afterAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// This file exercises `server/app.ts`'s production-only branches (static uploads mount +
// SPA fallback), which only run when NODE_ENV === 'production' at import time. Bun shares
// its ES module registry across every test file in one `bun test` run (confirmed: two test
// files importing the same specifier see the same module instance), so importing
// `./app.ts` here under a different query string gets a *separate* module instance from
// the one `server/routes.test.ts` imports normally — this file's NODE_ENV='production'
// therefore can't leak into (or be clobbered by) that file's import.
const tmpDbDir = mkdtempSync(join(tmpdir(), 'ramen-app-db-'))
const uploadDir = mkdtempSync(join(tmpdir(), 'ramen-app-uploads-'))
process.env.DATABASE_URL = `file:${join(tmpDbDir, 't.db')}`
process.env.UPLOAD_DIR = uploadDir
process.env.BETTER_AUTH_SECRET = 'test-secret-at-least-32-characters-long'
process.env.BETTER_AUTH_URL = 'http://localhost:5173'
delete process.env.S3_ENDPOINT
process.env.NODE_ENV = 'production'

const { migrateToLatest } = await import('./db/migrate')
await migrateToLatest()

// `dist` is a real, hardcoded relative path in app.ts (not env-configurable), so we
// temporarily seed it with a tiny index.html and restore whatever was there afterward,
// leaving no stray files behind in the repo.
const distExisted = existsSync('dist')
const indexExisted = existsSync('dist/index.html')
const originalIndex = indexExisted ? readFileSync('dist/index.html', 'utf8') : null
mkdirSync('dist', { recursive: true })
writeFileSync('dist/index.html', '<!doctype html><title>spa-fallback-test</title>')

// @ts-expect-error bun-specific cache-busting query so this import gets its own module
// instance instead of sharing whatever `./app.ts` other test files already imported.
const { app } = await import('./app.ts?production-test')
// `server/storage.ts` is NOT cache-busted (only `app.ts` is, above), so its `LOCAL_UPLOAD_DIR`
// constant was fixed at whichever test file first imported it process-wide — possibly not
// this file's own `uploadDir`, if another test file's import happened to run first in this
// `bun test` invocation. Read back the value the running app actually mounted, so this test
// writes into (and only cleans up within) the directory that's really being served.
const { LOCAL_UPLOAD_DIR } = await import('./storage.ts')

afterAll(() => {
  rmSync(tmpDbDir, { recursive: true, force: true })
  rmSync(uploadDir, { recursive: true, force: true })
  rmSync(join(LOCAL_UPLOAD_DIR, 'after-boot.txt'), { force: true })
  if (indexExisted && originalIndex !== null) {
    writeFileSync('dist/index.html', originalIndex)
  } else if (!distExisted) {
    rmSync('dist', { recursive: true, force: true })
  } else {
    rmSync('dist/index.html', { force: true })
  }
})

describe('production uploads mount', () => {
  test('serves a file written to UPLOAD_DIR after the app was imported (alwaysStatic: false)', async () => {
    writeFileSync(join(LOCAL_UPLOAD_DIR, 'after-boot.txt'), 'written-after-boot')

    const res = await app.handle(new Request('http://localhost/uploads/after-boot.txt'))

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('written-after-boot')
  })
})

describe('production SPA fallback', () => {
  test('GET /api/nope returns the JSON 404, not index.html', async () => {
    const res = await app.handle(new Request('http://localhost/api/nope'))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Not found.' })
  })

  test('GET /some/client/route falls back to index.html with 200', async () => {
    const res = await app.handle(new Request('http://localhost/some/client/route'))

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('spa-fallback-test')
  })
})
