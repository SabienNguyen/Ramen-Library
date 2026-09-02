import { zValidator as zv } from '@hono/zod-validator'
import { createMiddleware } from 'hono/factory'
import type { ZodType } from 'zod'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { auth } from './auth'
import { db } from './db/client'
import { buildComments, buildLikes, builds, posts, threads, user } from './db/schema'
import { commentSchema, postSchema, profileSchema, publishBuildSchema, threadSchema, updateBuildSchema } from '../shared/validation'
import { saveUpload } from './uploads'

type Session = typeof auth.$Infer.Session
export type Env = { Variables: { user: Session['user'] | null; session: Session['session'] | null } }

export const api = new Hono<Env>()

const uid = () => crypto.randomUUID()
const authorCols = { id: true, name: true, image: true } as const

function requireUser(c: { get: (k: 'user') => Session['user'] | null }) {
  const u = c.get('user')
  if (!u) throw new HTTPException(401, { message: 'Sign in to do that.' })
  return u
}

/** 401 before any body parsing, so anonymous writes get a clear answer. */
const authed = createMiddleware<Env>(async (c, next) => {
  requireUser(c)
  await next()
})

/** zod-validator with a readable first-error message instead of a ZodError dump. */
const zValidator = <T extends ZodType>(schema: T) =>
  zv('json', schema, (result, c) => {
    if (!result.success) {
      const issue = result.error.issues[0]
      const path = issue?.path?.length ? `${issue.path.join('.')}: ` : ''
      return c.json({ error: `${path}${issue?.message ?? 'Invalid input.'}` }, 400)
    }
  })

api.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
  console.error(err)
  return c.json({ error: 'Something went wrong.' }, 500)
})

/* ---------------------------------- me ---------------------------------- */

api.get('/me', (c) => c.json({ user: c.get('user') }))

api.patch('/me', authed, zValidator(profileSchema), async (c) => {
  const u = requireUser(c)
  const body = c.req.valid('json')
  await db.update(user).set({ name: body.name, bio: body.bio }).where(eq(user.id, u.id))
  return c.json({ ok: true })
})

/* -------------------------------- builds -------------------------------- */

async function countsFor(buildIds: string[]) {
  if (buildIds.length === 0) return { likes: new Map<string, number>(), comments: new Map<string, number>() }
  const likeRows = await db.select({ id: buildLikes.buildId, n: count() }).from(buildLikes).where(inArray(buildLikes.buildId, buildIds)).groupBy(buildLikes.buildId)
  const commentRows = await db.select({ id: buildComments.buildId, n: count() }).from(buildComments).where(inArray(buildComments.buildId, buildIds)).groupBy(buildComments.buildId)
  return {
    likes: new Map(likeRows.map((r) => [r.id, r.n])),
    comments: new Map(commentRows.map((r) => [r.id, r.n])),
  }
}

async function likedSet(userId: string | undefined, buildIds: string[]) {
  if (!userId || buildIds.length === 0) return new Set<string>()
  const rows = await db.select({ id: buildLikes.buildId }).from(buildLikes).where(and(eq(buildLikes.userId, userId), inArray(buildLikes.buildId, buildIds)))
  return new Set(rows.map((r) => r.id))
}

api.get('/builds', async (c) => {
  const sort = c.req.query('sort') === 'top' ? 'top' : 'new'
  const userId = c.req.query('user')
  const limit = Math.min(60, Number(c.req.query('limit') ?? 24))

  const rows = await db.query.builds.findMany({
    where: userId ? eq(builds.userId, userId) : undefined,
    orderBy: [desc(builds.createdAt)],
    limit: sort === 'top' ? 200 : limit,
    with: { author: { columns: authorCols } },
  })
  const ids = rows.map((r) => r.id)
  const [counts, liked] = await Promise.all([countsFor(ids), likedSet(c.get('user')?.id, ids)])
  let items = rows.map((r) => ({
    ...r,
    likeCount: counts.likes.get(r.id) ?? 0,
    commentCount: counts.comments.get(r.id) ?? 0,
    likedByMe: liked.has(r.id),
  }))
  if (sort === 'top') items = items.sort((a, b) => b.likeCount - a.likeCount || b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)
  return c.json({ items })
})

api.post('/builds', authed, zValidator(publishBuildSchema), async (c) => {
  const u = requireUser(c)
  const body = c.req.valid('json')
  const id = uid()
  await db.insert(builds).values({
    id,
    userId: u.id,
    name: body.name,
    description: body.description,
    bowl: body.bowl,
    imageUrl: body.imageUrl ?? null,
    thumbUrl: body.thumbUrl ?? null,
    templateId: body.templateId ?? null,
  })
  return c.json({ id }, 201)
})

api.patch('/builds/:id', authed, zValidator(updateBuildSchema), async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  const row = await db.query.builds.findFirst({ where: eq(builds.id, id), columns: { userId: true } })
  if (!row) throw new HTTPException(404, { message: 'Build not found.' })
  if (row.userId !== u.id) throw new HTTPException(403, { message: 'Not your build.' })
  const body = c.req.valid('json')
  await db.update(builds).set(body).where(eq(builds.id, id))
  return c.json({ ok: true })
})

/* -------------------------------- uploads ------------------------------- */

api.post('/uploads', authed, async (c) => {
  const form = await c.req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) throw new HTTPException(400, { message: 'No file.' })
  const result = await saveUpload(file)
  return c.json(result, 201)
})

api.get('/builds/:id', async (c) => {
  const id = c.req.param('id')
  const row = await db.query.builds.findFirst({
    where: eq(builds.id, id),
    with: {
      author: { columns: { ...authorCols, bio: true } },
      comments: { with: { author: { columns: authorCols } }, orderBy: [buildComments.createdAt] },
    },
  })
  if (!row) throw new HTTPException(404, { message: 'Build not found.' })
  const [counts, liked] = await Promise.all([countsFor([id]), likedSet(c.get('user')?.id, [id])])
  return c.json({ build: { ...row, likeCount: counts.likes.get(id) ?? 0, commentCount: row.comments.length, likedByMe: liked.has(id) } })
})

api.delete('/builds/:id', authed, async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  const row = await db.query.builds.findFirst({ where: eq(builds.id, id), columns: { userId: true } })
  if (!row) throw new HTTPException(404, { message: 'Build not found.' })
  if (row.userId !== u.id) throw new HTTPException(403, { message: 'Not your build.' })
  await db.delete(builds).where(eq(builds.id, id))
  return c.json({ ok: true })
})

api.post('/builds/:id/like', authed, async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  const exists = await db.query.builds.findFirst({ where: eq(builds.id, id), columns: { id: true } })
  if (!exists) throw new HTTPException(404, { message: 'Build not found.' })
  const already = await db.query.buildLikes.findFirst({ where: and(eq(buildLikes.buildId, id), eq(buildLikes.userId, u.id)) })
  if (already) await db.delete(buildLikes).where(and(eq(buildLikes.buildId, id), eq(buildLikes.userId, u.id)))
  else await db.insert(buildLikes).values({ buildId: id, userId: u.id })
  const [{ n }] = await db.select({ n: count() }).from(buildLikes).where(eq(buildLikes.buildId, id))
  return c.json({ liked: !already, likeCount: n })
})

api.post('/builds/:id/comments', authed, zValidator(commentSchema), async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  const exists = await db.query.builds.findFirst({ where: eq(builds.id, id), columns: { id: true } })
  if (!exists) throw new HTTPException(404, { message: 'Build not found.' })
  const commentId = uid()
  await db.insert(buildComments).values({ id: commentId, buildId: id, userId: u.id, body: c.req.valid('json').body })
  return c.json({ id: commentId }, 201)
})

api.delete('/comments/:id', authed, async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  const row = await db.query.buildComments.findFirst({ where: eq(buildComments.id, id), columns: { userId: true } })
  if (!row) throw new HTTPException(404, { message: 'Comment not found.' })
  if (row.userId !== u.id) throw new HTTPException(403, { message: 'Not your comment.' })
  await db.delete(buildComments).where(eq(buildComments.id, id))
  return c.json({ ok: true })
})

/* --------------------------------- forum -------------------------------- */

api.get('/forum/threads', async (c) => {
  const category = c.req.query('category')
  const rows = await db.query.threads.findMany({
    where: category ? eq(threads.category, category) : undefined,
    orderBy: [desc(threads.lastActivityAt)],
    limit: 50,
    with: { author: { columns: authorCols } },
  })
  const ids = rows.map((r) => r.id)
  const replyRows = ids.length ? await db.select({ id: posts.threadId, n: count() }).from(posts).where(inArray(posts.threadId, ids)).groupBy(posts.threadId) : []
  const replies = new Map(replyRows.map((r) => [r.id, r.n]))
  return c.json({ items: rows.map((r) => ({ ...r, body: r.body.slice(0, 200), replyCount: replies.get(r.id) ?? 0 })) })
})

api.post('/forum/threads', authed, zValidator(threadSchema), async (c) => {
  const u = requireUser(c)
  const body = c.req.valid('json')
  const id = uid()
  await db.insert(threads).values({ id, userId: u.id, ...body })
  return c.json({ id }, 201)
})

api.get('/forum/threads/:id', async (c) => {
  const row = await db.query.threads.findFirst({
    where: eq(threads.id, c.req.param('id')),
    with: {
      author: { columns: authorCols },
      posts: { with: { author: { columns: authorCols } }, orderBy: [posts.createdAt] },
    },
  })
  if (!row) throw new HTTPException(404, { message: 'Thread not found.' })
  return c.json({ thread: row })
})

api.delete('/forum/threads/:id', authed, async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  const row = await db.query.threads.findFirst({ where: eq(threads.id, id), columns: { userId: true } })
  if (!row) throw new HTTPException(404, { message: 'Thread not found.' })
  if (row.userId !== u.id) throw new HTTPException(403, { message: 'Not your thread.' })
  await db.delete(threads).where(eq(threads.id, id))
  return c.json({ ok: true })
})

api.post('/forum/threads/:id/posts', authed, zValidator(postSchema), async (c) => {
  const u = requireUser(c)
  const threadId = c.req.param('id')
  const exists = await db.query.threads.findFirst({ where: eq(threads.id, threadId), columns: { id: true } })
  if (!exists) throw new HTTPException(404, { message: 'Thread not found.' })
  const id = uid()
  await db.insert(posts).values({ id, threadId, userId: u.id, body: c.req.valid('json').body })
  await db.update(threads).set({ lastActivityAt: new Date() }).where(eq(threads.id, threadId))
  return c.json({ id }, 201)
})

api.delete('/forum/posts/:id', authed, async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  const row = await db.query.posts.findFirst({ where: eq(posts.id, id), columns: { userId: true } })
  if (!row) throw new HTTPException(404, { message: 'Post not found.' })
  if (row.userId !== u.id) throw new HTTPException(403, { message: 'Not your post.' })
  await db.delete(posts).where(eq(posts.id, id))
  return c.json({ ok: true })
})

/* --------------------------------- users -------------------------------- */

api.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const profile = await db.query.user.findFirst({ where: eq(user.id, id), columns: { id: true, name: true, image: true, bio: true, createdAt: true } })
  if (!profile) throw new HTTPException(404, { message: 'User not found.' })
  const userBuilds = await db.query.builds.findMany({ where: eq(builds.userId, id), orderBy: [desc(builds.createdAt)], limit: 30, with: { author: { columns: authorCols } } })
  const ids = userBuilds.map((b) => b.id)
  const [counts, liked, userThreads, [postStats]] = await Promise.all([
    countsFor(ids),
    likedSet(c.get('user')?.id, ids),
    db.query.threads.findMany({ where: eq(threads.userId, id), orderBy: [desc(threads.createdAt)], limit: 10, columns: { id: true, title: true, category: true, createdAt: true } }),
    db.select({ n: count() }).from(posts).where(eq(posts.userId, id)),
  ])
  return c.json({
    profile,
    builds: userBuilds.map((b) => ({ ...b, likeCount: counts.likes.get(b.id) ?? 0, commentCount: counts.comments.get(b.id) ?? 0, likedByMe: liked.has(b.id) })),
    threads: userThreads,
    postCount: postStats.n,
  })
})

/* ---------------------------------- home -------------------------------- */

api.get('/home', async (c) => {
  const [buildCount, userCount, threadCount] = await Promise.all([
    db.select({ n: count() }).from(builds),
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(threads),
  ])
  const recentBuilds = await db.query.builds.findMany({ orderBy: [desc(builds.createdAt)], limit: 6, with: { author: { columns: authorCols } } })
  const ids = recentBuilds.map((b) => b.id)
  const [counts, liked] = await Promise.all([countsFor(ids), likedSet(c.get('user')?.id, ids)])
  const recentThreads = await db.query.threads.findMany({ orderBy: [desc(threads.lastActivityAt)], limit: 5, with: { author: { columns: authorCols } } })
  const threadIds = recentThreads.map((t) => t.id)
  const replyRows = threadIds.length ? await db.select({ id: posts.threadId, n: count() }).from(posts).where(inArray(posts.threadId, threadIds)).groupBy(posts.threadId) : []
  const replies = new Map(replyRows.map((r) => [r.id, r.n]))
  const topLike = await db.select({ id: buildLikes.buildId, n: count() }).from(buildLikes).groupBy(buildLikes.buildId).orderBy(sql`count(*) desc`).limit(1)
  return c.json({
    stats: { builds: buildCount[0].n, users: userCount[0].n, threads: threadCount[0].n },
    builds: recentBuilds.map((b) => ({ ...b, likeCount: counts.likes.get(b.id) ?? 0, commentCount: counts.comments.get(b.id) ?? 0, likedByMe: liked.has(b.id) })),
    threads: recentThreads.map((t) => ({ ...t, body: t.body.slice(0, 160), replyCount: replies.get(t.id) ?? 0 })),
    topBuildId: topLike[0]?.id ?? null,
  })
})
