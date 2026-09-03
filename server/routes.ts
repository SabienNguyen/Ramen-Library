import { Elysia, t } from 'elysia'
import { sql } from 'kysely'
import { db } from './db/client'
import { ApiError } from './errors'
import { rateLimit } from './ratelimit'
import { session } from './session'
import { saveUpload } from './uploads'
import { isOwnUploadUrl } from './storage'
import {
  commentSchema,
  postSchema,
  profileSchema,
  publishBuildSchema,
  threadSchema,
  updateBuildSchema,
} from '../shared/validation'

const uid = () => crypto.randomUUID()

/** Throws if `imageUrl`/`thumbUrl` are set but don't point at this deployment's own upload storage. */
function assertOwnUploadUrls(body: { imageUrl?: string | null; thumbUrl?: string | null }): void {
  for (const [field, value] of [
    ['imageUrl', body.imageUrl],
    ['thumbUrl', body.thumbUrl],
  ] as const) {
    if (typeof value === 'string' && !isOwnUploadUrl(value)) {
      throw new ApiError(400, `${field}: not an upload`)
    }
  }
}

const AUTHOR_COLS = ['user.id as author_id', 'user.name as author_name', 'user.image as author_image'] as const

interface AuthorRow {
  author_id: string
  author_name: string
  author_image: string | null
}

function toAuthor(row: AuthorRow) {
  return { id: row.author_id, name: row.author_name, image: row.author_image }
}

interface BuildRow extends AuthorRow {
  id: string
  user_id: string
  name: string
  description: string
  bowl: string
  image_url: string | null
  thumb_url: string | null
  template_id: string | null
  created_at: number
  updated_at: number
}

function toBuildItem(row: BuildRow, likeCount: number, commentCount: number, likedByMe: boolean) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    bowl: JSON.parse(row.bowl),
    imageUrl: row.image_url,
    thumbUrl: row.thumb_url,
    templateId: row.template_id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    author: toAuthor(row),
    likeCount,
    commentCount,
    likedByMe,
  }
}

interface CommentRow extends AuthorRow {
  id: string
  build_id: string
  user_id: string
  body: string
  created_at: number
}

function toComment(row: CommentRow) {
  return {
    id: row.id,
    buildId: row.build_id,
    userId: row.user_id,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    author: toAuthor(row),
  }
}

interface ThreadRow extends AuthorRow {
  id: string
  user_id: string
  category: string
  title: string
  body: string
  created_at: number
  last_activity_at: number
}

function toThreadItem(row: ThreadRow, replyCount: number, bodyLimit: number) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    body: row.body.slice(0, bodyLimit),
    createdAt: new Date(row.created_at).toISOString(),
    lastActivityAt: new Date(row.last_activity_at).toISOString(),
    author: toAuthor(row),
    replyCount,
  }
}

function toThreadDetail(row: ThreadRow) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    lastActivityAt: new Date(row.last_activity_at).toISOString(),
    author: toAuthor(row),
  }
}

interface PostRow extends AuthorRow {
  id: string
  thread_id: string
  user_id: string
  body: string
  created_at: number
}

function toPost(row: PostRow) {
  return {
    id: row.id,
    threadId: row.thread_id,
    userId: row.user_id,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    author: toAuthor(row),
  }
}

async function countsFor(buildIds: string[]) {
  if (buildIds.length === 0) return { likes: new Map<string, number>(), comments: new Map<string, number>() }
  const likeRows = await db
    .selectFrom('build_likes')
    .select(['build_id', sql<number>`count(*)`.as('n')])
    .where('build_id', 'in', buildIds)
    .groupBy('build_id')
    .execute()
  const commentRows = await db
    .selectFrom('build_comments')
    .select(['build_id', sql<number>`count(*)`.as('n')])
    .where('build_id', 'in', buildIds)
    .groupBy('build_id')
    .execute()
  return {
    likes: new Map(likeRows.map((r) => [r.build_id, Number(r.n)])),
    comments: new Map(commentRows.map((r) => [r.build_id, Number(r.n)])),
  }
}

async function likedSet(userId: string | undefined, buildIds: string[]) {
  if (!userId || buildIds.length === 0) return new Set<string>()
  const rows = await db
    .selectFrom('build_likes')
    .select(['build_id'])
    .where('user_id', '=', userId)
    .where('build_id', 'in', buildIds)
    .execute()
  return new Set(rows.map((r) => r.build_id))
}

async function replyCounts(threadIds: string[]) {
  if (threadIds.length === 0) return new Map<string, number>()
  const rows = await db
    .selectFrom('forum_posts')
    .select(['thread_id', sql<number>`count(*)`.as('n')])
    .where('thread_id', 'in', threadIds)
    .groupBy('thread_id')
    .execute()
  return new Map(rows.map((r) => [r.thread_id, Number(r.n)]))
}

/** Requires an authenticated session before any body validation runs. Registered as a
 * `transform` hook (not `beforeHandle`), because Elysia validates `body`/`query`/`params`
 * before running `beforeHandle` hooks but after `transform` hooks — so an anonymous
 * request with an invalid body still gets a clean 401 instead of a 400. */
function requireAuth({ user }: { user: { id: string } | null }) {
  if (!user) throw new ApiError(401, 'Sign in to do that.')
}

export const api = new Elysia({ prefix: '/api' })
  .use(session)

  /* ---------------------------------- me ---------------------------------- */

  .get('/me', ({ user }) => ({ user }))

  .guard({ transform: requireAuth }, (app) =>
    app
      .use(rateLimit({ name: 'writes', windowMs: 15 * 60 * 1000, max: 60, keyFor: 'user-or-ip' }))
      .patch(
        '/me',
        async ({ user, body }) => {
          await db.updateTable('user').set({ name: body.name, bio: body.bio }).where('id', '=', user!.id).execute()
          return { ok: true }
        },
        { body: profileSchema },
      )

      /* -------------------------------- builds -------------------------------- */

      .post(
        '/builds',
        async ({ user, body, set }) => {
          assertOwnUploadUrls(body)
          const id = uid()
          const now = Date.now()
          await db
            .insertInto('builds')
            .values({
              id,
              user_id: user!.id,
              name: body.name,
              description: body.description,
              bowl: JSON.stringify(body.bowl),
              image_url: body.imageUrl ?? null,
              thumb_url: body.thumbUrl ?? null,
              template_id: body.templateId ?? null,
              created_at: now,
              updated_at: now,
            })
            .execute()
          set.status = 201
          return { id }
        },
        { body: publishBuildSchema },
      )

      .patch(
        '/builds/:id',
        async ({ user, params, body }) => {
          assertOwnUploadUrls(body)
          const row = await db.selectFrom('builds').select(['user_id']).where('id', '=', params.id).executeTakeFirst()
          if (!row) throw new ApiError(404, 'Build not found.')
          if (row.user_id !== user!.id) throw new ApiError(403, 'Not your build.')
          await db
            .updateTable('builds')
            .set({
              ...(body.name !== undefined ? { name: body.name } : {}),
              ...(body.description !== undefined ? { description: body.description } : {}),
              ...(body.imageUrl !== undefined ? { image_url: body.imageUrl } : {}),
              ...(body.thumbUrl !== undefined ? { thumb_url: body.thumbUrl } : {}),
              ...(body.templateId !== undefined ? { template_id: body.templateId } : {}),
              updated_at: Date.now(),
            })
            .where('id', '=', params.id)
            .execute()
          return { ok: true }
        },
        { body: updateBuildSchema },
      )

      .delete('/builds/:id', async ({ user, params }) => {
        const row = await db.selectFrom('builds').select(['user_id']).where('id', '=', params.id).executeTakeFirst()
        if (!row) throw new ApiError(404, 'Build not found.')
        if (row.user_id !== user!.id) throw new ApiError(403, 'Not your build.')
        await db.deleteFrom('builds').where('id', '=', params.id).execute()
        return { ok: true }
      })

      .post('/builds/:id/like', async ({ user, params }) => {
        const exists = await db.selectFrom('builds').select(['id']).where('id', '=', params.id).executeTakeFirst()
        if (!exists) throw new ApiError(404, 'Build not found.')
        const already = await db
          .selectFrom('build_likes')
          .select(['build_id'])
          .where('build_id', '=', params.id)
          .where('user_id', '=', user!.id)
          .executeTakeFirst()
        if (already) {
          await db
            .deleteFrom('build_likes')
            .where('build_id', '=', params.id)
            .where('user_id', '=', user!.id)
            .execute()
        } else {
          await db.insertInto('build_likes').values({ build_id: params.id, user_id: user!.id, created_at: Date.now() }).execute()
        }
        const row = await db
          .selectFrom('build_likes')
          .select(sql<number>`count(*)`.as('n'))
          .where('build_id', '=', params.id)
          .executeTakeFirstOrThrow()
        return { liked: !already, likeCount: Number(row.n) }
      })

      .post(
        '/builds/:id/comments',
        async ({ user, params, body, set }) => {
          const exists = await db.selectFrom('builds').select(['id']).where('id', '=', params.id).executeTakeFirst()
          if (!exists) throw new ApiError(404, 'Build not found.')
          const commentId = uid()
          await db
            .insertInto('build_comments')
            .values({ id: commentId, build_id: params.id, user_id: user!.id, body: body.body, created_at: Date.now() })
            .execute()
          set.status = 201
          return { id: commentId }
        },
        { body: commentSchema },
      )

      .delete('/comments/:id', async ({ user, params }) => {
        const row = await db.selectFrom('build_comments').select(['user_id']).where('id', '=', params.id).executeTakeFirst()
        if (!row) throw new ApiError(404, 'Comment not found.')
        if (row.user_id !== user!.id) throw new ApiError(403, 'Not your comment.')
        await db.deleteFrom('build_comments').where('id', '=', params.id).execute()
        return { ok: true }
      })

      /* --------------------------------- forum -------------------------------- */

      .post(
        '/forum/threads',
        async ({ user, body, set }) => {
          const id = uid()
          const now = Date.now()
          await db
            .insertInto('forum_threads')
            .values({
              id,
              user_id: user!.id,
              category: body.category,
              title: body.title,
              body: body.body,
              created_at: now,
              last_activity_at: now,
            })
            .execute()
          set.status = 201
          return { id }
        },
        { body: threadSchema },
      )

      .delete('/forum/threads/:id', async ({ user, params }) => {
        const row = await db.selectFrom('forum_threads').select(['user_id']).where('id', '=', params.id).executeTakeFirst()
        if (!row) throw new ApiError(404, 'Thread not found.')
        if (row.user_id !== user!.id) throw new ApiError(403, 'Not your thread.')
        await db.deleteFrom('forum_threads').where('id', '=', params.id).execute()
        return { ok: true }
      })

      .post(
        '/forum/threads/:id/posts',
        async ({ user, params, body, set }) => {
          const exists = await db.selectFrom('forum_threads').select(['id']).where('id', '=', params.id).executeTakeFirst()
          if (!exists) throw new ApiError(404, 'Thread not found.')
          const id = uid()
          await db
            .insertInto('forum_posts')
            .values({ id, thread_id: params.id, user_id: user!.id, body: body.body, created_at: Date.now() })
            .execute()
          await db.updateTable('forum_threads').set({ last_activity_at: Date.now() }).where('id', '=', params.id).execute()
          set.status = 201
          return { id }
        },
        { body: postSchema },
      )

      .delete('/forum/posts/:id', async ({ user, params }) => {
        const row = await db.selectFrom('forum_posts').select(['user_id']).where('id', '=', params.id).executeTakeFirst()
        if (!row) throw new ApiError(404, 'Post not found.')
        if (row.user_id !== user!.id) throw new ApiError(403, 'Not your post.')
        await db.deleteFrom('forum_posts').where('id', '=', params.id).execute()
        return { ok: true }
      }),
  )

  /* -------------------------------- uploads -------------------------------- */
  // Its own guard block (rather than living in the block above) so it gets the
  // `uploads` rate-limit tier instead of `writes`.

  .guard({ transform: requireAuth }, (app) =>
    app
      .use(rateLimit({ name: 'uploads', windowMs: 60 * 60 * 1000, max: 20, keyFor: 'user-or-ip' }))
      .post(
        '/uploads',
        async ({ body, set }) => {
          const result = await saveUpload(body.file)
          set.status = 201
          return result
        },
        { body: t.Object({ file: t.File() }) },
      ),
  )

  /* -------------------------------- builds (reads) ------------------------- */

  .get('/builds', async ({ query, user }) => {
    const sort = query.sort === 'top' ? 'top' : 'new'
    const userId = query.user
    const parsedLimit = Number(query.limit ?? 24)
    const limit = Math.min(60, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 24))

    let q = db
      .selectFrom('builds')
      .innerJoin('user', 'user.id', 'builds.user_id')
      .select([
        'builds.id',
        'builds.user_id',
        'builds.name',
        'builds.description',
        'builds.bowl',
        'builds.image_url',
        'builds.thumb_url',
        'builds.template_id',
        'builds.created_at',
        'builds.updated_at',
        ...AUTHOR_COLS,
      ])
      .orderBy('builds.created_at', 'desc')
      .limit(sort === 'top' ? 200 : limit)
    if (userId) q = q.where('builds.user_id', '=', userId)
    const rows = (await q.execute()) as unknown as BuildRow[]

    const ids = rows.map((r) => r.id)
    const [counts, liked] = await Promise.all([countsFor(ids), likedSet(user?.id, ids)])
    let items = rows.map((r) =>
      toBuildItem(r, counts.likes.get(r.id) ?? 0, counts.comments.get(r.id) ?? 0, liked.has(r.id)),
    )
    if (sort === 'top') {
      items = items
        .sort((a, b) => b.likeCount - a.likeCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    }
    return { items }
  })

  .get('/builds/:id', async ({ params, user }) => {
    const row = (await db
      .selectFrom('builds')
      .innerJoin('user', 'user.id', 'builds.user_id')
      .select([
        'builds.id',
        'builds.user_id',
        'builds.name',
        'builds.description',
        'builds.bowl',
        'builds.image_url',
        'builds.thumb_url',
        'builds.template_id',
        'builds.created_at',
        'builds.updated_at',
        ...AUTHOR_COLS,
        'user.bio as author_bio',
      ])
      .where('builds.id', '=', params.id)
      .executeTakeFirst()) as unknown as (BuildRow & { author_bio: string | null }) | undefined
    if (!row) throw new ApiError(404, 'Build not found.')

    const commentRows = (await db
      .selectFrom('build_comments')
      .innerJoin('user', 'user.id', 'build_comments.user_id')
      .select([
        'build_comments.id',
        'build_comments.build_id',
        'build_comments.user_id',
        'build_comments.body',
        'build_comments.created_at',
        ...AUTHOR_COLS,
      ])
      .where('build_comments.build_id', '=', params.id)
      .orderBy('build_comments.created_at', 'asc')
      .execute()) as unknown as CommentRow[]

    const [counts, liked] = await Promise.all([countsFor([params.id]), likedSet(user?.id, [params.id])])

    return {
      build: {
        ...toBuildItem(row, counts.likes.get(params.id) ?? 0, commentRows.length, liked.has(params.id)),
        author: { ...toAuthor(row), bio: row.author_bio },
        comments: commentRows.map(toComment),
      },
    }
  })

  /* --------------------------------- forum (reads) -------------------------- */

  .get('/forum/threads', async ({ query }) => {
    const category = query.category
    let q = db
      .selectFrom('forum_threads')
      .innerJoin('user', 'user.id', 'forum_threads.user_id')
      .select([
        'forum_threads.id',
        'forum_threads.user_id',
        'forum_threads.category',
        'forum_threads.title',
        'forum_threads.body',
        'forum_threads.created_at',
        'forum_threads.last_activity_at',
        ...AUTHOR_COLS,
      ])
      .orderBy('forum_threads.last_activity_at', 'desc')
      .limit(50)
    if (category) q = q.where('forum_threads.category', '=', category)
    const rows = (await q.execute()) as unknown as ThreadRow[]
    const ids = rows.map((r) => r.id)
    const replies = await replyCounts(ids)
    return { items: rows.map((r) => toThreadItem(r, replies.get(r.id) ?? 0, 200)) }
  })

  .get('/forum/threads/:id', async ({ params }) => {
    const row = (await db
      .selectFrom('forum_threads')
      .innerJoin('user', 'user.id', 'forum_threads.user_id')
      .select([
        'forum_threads.id',
        'forum_threads.user_id',
        'forum_threads.category',
        'forum_threads.title',
        'forum_threads.body',
        'forum_threads.created_at',
        'forum_threads.last_activity_at',
        ...AUTHOR_COLS,
      ])
      .where('forum_threads.id', '=', params.id)
      .executeTakeFirst()) as unknown as ThreadRow | undefined
    if (!row) throw new ApiError(404, 'Thread not found.')

    const postRows = (await db
      .selectFrom('forum_posts')
      .innerJoin('user', 'user.id', 'forum_posts.user_id')
      .select([
        'forum_posts.id',
        'forum_posts.thread_id',
        'forum_posts.user_id',
        'forum_posts.body',
        'forum_posts.created_at',
        ...AUTHOR_COLS,
      ])
      .where('forum_posts.thread_id', '=', params.id)
      .orderBy('forum_posts.created_at', 'asc')
      .execute()) as unknown as PostRow[]

    return { thread: { ...toThreadDetail(row), posts: postRows.map(toPost) } }
  })

  /* --------------------------------- users -------------------------------- */

  .get('/users/:id', async ({ params, user }) => {
    const profile = await db
      .selectFrom('user')
      .select(['id', 'name', 'image', 'bio', 'createdAt'])
      .where('id', '=', params.id)
      .executeTakeFirst()
    if (!profile) throw new ApiError(404, 'User not found.')

    const userBuilds = (await db
      .selectFrom('builds')
      .innerJoin('user', 'user.id', 'builds.user_id')
      .select([
        'builds.id',
        'builds.user_id',
        'builds.name',
        'builds.description',
        'builds.bowl',
        'builds.image_url',
        'builds.thumb_url',
        'builds.template_id',
        'builds.created_at',
        'builds.updated_at',
        ...AUTHOR_COLS,
      ])
      .where('builds.user_id', '=', params.id)
      .orderBy('builds.created_at', 'desc')
      .limit(30)
      .execute()) as unknown as BuildRow[]
    const ids = userBuilds.map((b) => b.id)

    const [counts, liked, userThreads, postStats] = await Promise.all([
      countsFor(ids),
      likedSet(user?.id, ids),
      db
        .selectFrom('forum_threads')
        .select(['id', 'title', 'category', 'created_at'])
        .where('user_id', '=', params.id)
        .orderBy('created_at', 'desc')
        .limit(10)
        .execute(),
      db
        .selectFrom('forum_posts')
        .select(sql<number>`count(*)`.as('n'))
        .where('user_id', '=', params.id)
        .executeTakeFirstOrThrow(),
    ])

    return {
      profile: {
        id: profile.id,
        name: profile.name,
        image: profile.image,
        bio: profile.bio,
        createdAt: profile.createdAt,
      },
      builds: userBuilds.map((b) =>
        toBuildItem(b, counts.likes.get(b.id) ?? 0, counts.comments.get(b.id) ?? 0, liked.has(b.id)),
      ),
      threads: userThreads.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        createdAt: new Date(t.created_at).toISOString(),
      })),
      postCount: Number(postStats.n),
    }
  })

  /* ---------------------------------- home -------------------------------- */

  .get('/home', async ({ user }) => {
    const [buildCount, userCount, threadCount] = await Promise.all([
      db.selectFrom('builds').select(sql<number>`count(*)`.as('n')).executeTakeFirstOrThrow(),
      db.selectFrom('user').select(sql<number>`count(*)`.as('n')).executeTakeFirstOrThrow(),
      db.selectFrom('forum_threads').select(sql<number>`count(*)`.as('n')).executeTakeFirstOrThrow(),
    ])

    const recentBuilds = (await db
      .selectFrom('builds')
      .innerJoin('user', 'user.id', 'builds.user_id')
      .select([
        'builds.id',
        'builds.user_id',
        'builds.name',
        'builds.description',
        'builds.bowl',
        'builds.image_url',
        'builds.thumb_url',
        'builds.template_id',
        'builds.created_at',
        'builds.updated_at',
        ...AUTHOR_COLS,
      ])
      .orderBy('builds.created_at', 'desc')
      .limit(6)
      .execute()) as unknown as BuildRow[]
    const ids = recentBuilds.map((b) => b.id)
    const [counts, liked] = await Promise.all([countsFor(ids), likedSet(user?.id, ids)])

    const recentThreads = (await db
      .selectFrom('forum_threads')
      .innerJoin('user', 'user.id', 'forum_threads.user_id')
      .select([
        'forum_threads.id',
        'forum_threads.user_id',
        'forum_threads.category',
        'forum_threads.title',
        'forum_threads.body',
        'forum_threads.created_at',
        'forum_threads.last_activity_at',
        ...AUTHOR_COLS,
      ])
      .orderBy('forum_threads.last_activity_at', 'desc')
      .limit(5)
      .execute()) as unknown as ThreadRow[]
    const threadIds = recentThreads.map((t) => t.id)
    const replies = await replyCounts(threadIds)

    const topLike = await db
      .selectFrom('build_likes')
      .select(['build_id', sql<number>`count(*)`.as('n')])
      .groupBy('build_id')
      .orderBy(sql`count(*) desc`)
      .limit(1)
      .executeTakeFirst()

    return {
      stats: { builds: Number(buildCount.n), users: Number(userCount.n), threads: Number(threadCount.n) },
      builds: recentBuilds.map((b) =>
        toBuildItem(b, counts.likes.get(b.id) ?? 0, counts.comments.get(b.id) ?? 0, liked.has(b.id)),
      ),
      threads: recentThreads.map((t) => toThreadItem(t, replies.get(t.id) ?? 0, 160)),
      topBuildId: topLike?.build_id ?? null,
    }
  })
