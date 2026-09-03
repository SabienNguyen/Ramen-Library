import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const tmpDbDir = mkdtempSync(join(tmpdir(), 'ramen-routes-db-'))
const uploadDir = mkdtempSync(join(tmpdir(), 'ramen-routes-uploads-'))
process.env.DATABASE_URL = `file:${join(tmpDbDir, 't.db')}`
process.env.UPLOAD_DIR = uploadDir
process.env.BETTER_AUTH_SECRET = 'test-secret-at-least-32-characters-long'
process.env.BETTER_AUTH_URL = 'http://localhost:5173'

const { migrateToLatest } = await import('./db/migrate')
const { app } = await import('./app')

await migrateToLatest()

const bowl = {
  brothId: 'tonkotsu',
  tareId: 'shio',
  noodleId: 'thin',
  oilId: null,
  toppings: [],
}

function cookieFrom(res: Response): string {
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('no set-cookie header on response')
  // May contain multiple cookies separated by comma at top level (rare), but
  // better-auth typically sets one session cookie per sign-up/sign-in response.
  return setCookie.split(',').map((c) => c.split(';')[0]).join('; ')
}

async function signUp(email: string, name: string): Promise<{ cookie: string; userId: string }> {
  const res = await app.handle(
    new Request('http://localhost/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name }),
    }),
  )
  expect(res.status).toBe(200)
  const cookie = cookieFrom(res)
  const body = (await json(res)) as { user: { id: string } }
  return { cookie, userId: body.user.id }
}

function req(path: string, init: RequestInit & { cookie?: string } = {}): Request {
  const headers = new Headers(init.headers)
  if (init.cookie) headers.set('cookie', init.cookie)
  return new Request(`http://localhost${path}`, { ...init, headers })
}

async function json(res: Response): Promise<any> {
  return res.json()
}

describe('server routes', () => {
  let cookie: string
  let userId: string
  let buildId: string
  let commentId: string
  let threadId: string

  beforeAll(async () => {
    const signed = await signUp('routes-test@example.com', 'Route Tester')
    cookie = signed.cookie
    userId = signed.userId
  })

  afterAll(async () => {
    // Note: `server/db/client.ts` exports a process-wide `db`/`libsql` singleton bound to
    // whichever test file imports it first (Bun shares the module registry across test
    // files in one `bun test` run). Other files that also touch the database — e.g.
    // `server/db/migrate.test.ts` — may end up sharing this connection, so this file must
    // not tear down the sqlite file itself; only clean up files unique to this file's own
    // fixtures.
    rmSync(uploadDir, { recursive: true, force: true })
  })

  test('GET /api/me returns the signed-in user', async () => {
    const res = await app.handle(req('/api/me', { cookie }))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.user).toBeTruthy()
    expect(body.user.email).toBe('routes-test@example.com')
  })

  test('anonymous POST /api/builds with invalid body returns 401, not 400', async () => {
    const res = await app.handle(
      req('/api/builds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ not: 'valid' }),
      }),
    )
    expect(res.status).toBe(401)
    const body = await json(res)
    expect(body).toEqual({ error: 'Sign in to do that.' })
  })

  test('signed-in POST /api/builds with invalid body returns 400', async () => {
    const res = await app.handle(
      req('/api/builds', {
        method: 'POST',
        cookie,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'a' }),
      }),
    )
    expect(res.status).toBe(400)
    const body = await json(res)
    expect(typeof body.error).toBe('string')
  })

  test('POST /api/builds publishes a build', async () => {
    const res = await app.handle(
      req('/api/builds', {
        method: 'POST',
        cookie,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Tonkotsu Deluxe', description: 'rich', bowl }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(typeof body.id).toBe('string')
    buildId = body.id
  })

  test('GET /api/builds lists it with author + counts', async () => {
    const res = await app.handle(req('/api/builds', { cookie }))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(Array.isArray(body.items)).toBe(true)
    const item = body.items.find((b: { id: string }) => b.id === buildId)
    expect(item).toBeTruthy()
    expect(item.author.id).toBe(userId)
    expect(item.likeCount).toBe(0)
    expect(item.commentCount).toBe(0)
    expect(item.likedByMe).toBe(false)
    expect(typeof item.createdAt).toBe('string')
    expect(Number.isNaN(new Date(item.createdAt).getTime())).toBe(false)
    expect(item.bowl).toEqual(bowl)
  })

  test('POST /api/builds/:id/like toggles', async () => {
    const res1 = await app.handle(req(`/api/builds/${buildId}/like`, { method: 'POST', cookie }))
    expect(res1.status).toBe(200)
    const body1 = await json(res1)
    expect(body1).toEqual({ liked: true, likeCount: 1 })

    const res2 = await app.handle(req(`/api/builds/${buildId}/like`, { method: 'POST', cookie }))
    expect(res2.status).toBe(200)
    const body2 = await json(res2)
    expect(body2).toEqual({ liked: false, likeCount: 0 })

    // Re-like so the detail assertions below see likeCount 1.
    const res3 = await app.handle(req(`/api/builds/${buildId}/like`, { method: 'POST', cookie }))
    expect((await json(res3)).likeCount).toBe(1)
  })

  test('POST /api/builds/:id/comments adds a comment', async () => {
    const res = await app.handle(
      req(`/api/builds/${buildId}/comments`, {
        method: 'POST',
        cookie,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'Looks great!' }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(typeof body.id).toBe('string')
    commentId = body.id
  })

  test('GET /api/builds/:id shows comment and likeCount 1', async () => {
    const res = await app.handle(req(`/api/builds/${buildId}`, { cookie }))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.build.id).toBe(buildId)
    expect(body.build.likeCount).toBe(1)
    expect(body.build.likedByMe).toBe(true)
    expect(body.build.commentCount).toBe(1)
    expect(body.build.comments).toHaveLength(1)
    expect(body.build.comments[0].id).toBe(commentId)
    expect(body.build.comments[0].author.id).toBe(userId)
    expect(body.build.author.bio).toBeNull()
  })

  test('POST /api/forum/threads creates a thread', async () => {
    const res = await app.handle(
      req('/api/forum/threads', {
        method: 'POST',
        cookie,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category: 'general', title: 'Hello forum', body: 'First post body here.' }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(typeof body.id).toBe('string')
    threadId = body.id
  })

  test('GET /api/forum/threads lists it', async () => {
    const res = await app.handle(req('/api/forum/threads', { cookie }))
    expect(res.status).toBe(200)
    const body = await json(res)
    const item = body.items.find((t: { id: string }) => t.id === threadId)
    expect(item).toBeTruthy()
    expect(item.replyCount).toBe(0)
    expect(item.author.id).toBe(userId)
  })

  test('POST /api/forum/threads/:id/posts adds a post', async () => {
    const res = await app.handle(
      req(`/api/forum/threads/${threadId}/posts`, {
        method: 'POST',
        cookie,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'A reply.' }),
      }),
    )
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(typeof body.id).toBe('string')
  })

  test('GET /api/forum/threads/:id shows the post', async () => {
    const res = await app.handle(req(`/api/forum/threads/${threadId}`, { cookie }))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.thread.id).toBe(threadId)
    expect(body.thread.posts).toHaveLength(1)
    expect(body.thread.posts[0].body).toBe('A reply.')
  })

  test('PATCH /api/me updates bio', async () => {
    const res = await app.handle(
      req('/api/me', {
        method: 'PATCH',
        cookie,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Route Tester', bio: 'I make ramen.' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ok: true })
  })

  test('GET /api/users/:id returns profile, builds, threads, postCount', async () => {
    const res = await app.handle(req(`/api/users/${userId}`, { cookie }))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.profile.id).toBe(userId)
    expect(body.profile.bio).toBe('I make ramen.')
    expect(body.builds.length).toBeGreaterThanOrEqual(1)
    expect(body.threads.length).toBeGreaterThanOrEqual(1)
    expect(body.postCount).toBeGreaterThanOrEqual(1)
  })

  test('GET /api/home returns stats, builds, threads, topBuildId', async () => {
    const res = await app.handle(req('/api/home', { cookie }))
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.stats.builds).toBeGreaterThanOrEqual(1)
    expect(body.stats.users).toBeGreaterThanOrEqual(1)
    expect(body.stats.threads).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(body.builds)).toBe(true)
    expect(Array.isArray(body.threads)).toBe(true)
    expect(body.topBuildId).toBe(buildId)
  })

  test('POST /api/uploads with a small PNG returns 201 with webp urls', async () => {
    const png = await sharp({
      create: { width: 40, height: 40, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
    })
      .png()
      .toBuffer()
    const form = new FormData()
    form.set('file', new File([png], 'photo.png', { type: 'image/png' }))
    const headers = new Headers()
    headers.set('cookie', cookie)
    const res = await app.handle(new Request('http://localhost/api/uploads', { method: 'POST', headers, body: form }))
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.imageUrl).toMatch(/^\/uploads\/[a-z0-9-]+\.webp$/)
    expect(body.thumbUrl).toMatch(/^\/uploads\/[a-z0-9-]+\.thumb\.webp$/)
  })

  test('DELETE /api/builds/:id by another user returns 403', async () => {
    const other = await signUp('other-user@example.com', 'Other User')
    const res = await app.handle(req(`/api/builds/${buildId}`, { method: 'DELETE', cookie: other.cookie }))
    expect(res.status).toBe(403)
    const body = await json(res)
    expect(body).toEqual({ error: 'Not your build.' })
  })

  test('DELETE /api/builds/:id by the owner succeeds', async () => {
    const res = await app.handle(req(`/api/builds/${buildId}`, { method: 'DELETE', cookie }))
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ok: true })
  })
})
