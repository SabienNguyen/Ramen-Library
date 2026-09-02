import { relations } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Bowl } from '../../shared/bowl'
import { user } from './auth-schema'

export * from './auth-schema'

const now = () => new Date()

export const builds = sqliteTable(
  'builds',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    bowl: text('bowl', { mode: 'json' }).$type<Bowl>().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now).$onUpdate(now),
  },
  (t) => [index('builds_user_idx').on(t.userId), index('builds_created_idx').on(t.createdAt)],
)

export const buildLikes = sqliteTable(
  'build_likes',
  {
    buildId: text('build_id')
      .notNull()
      .references(() => builds.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
  },
  (t) => [primaryKey({ columns: [t.buildId, t.userId] })],
)

export const buildComments = sqliteTable(
  'build_comments',
  {
    id: text('id').primaryKey(),
    buildId: text('build_id')
      .notNull()
      .references(() => builds.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
  },
  (t) => [index('build_comments_build_idx').on(t.buildId)],
)

export const threads = sqliteTable(
  'forum_threads',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
    lastActivityAt: integer('last_activity_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
  },
  (t) => [index('threads_category_idx').on(t.category), index('threads_activity_idx').on(t.lastActivityAt)],
)

export const posts = sqliteTable(
  'forum_posts',
  {
    id: text('id').primaryKey(),
    threadId: text('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now),
  },
  (t) => [index('posts_thread_idx').on(t.threadId)],
)

export const buildsRelations = relations(builds, ({ one, many }) => ({
  author: one(user, { fields: [builds.userId], references: [user.id] }),
  likes: many(buildLikes),
  comments: many(buildComments),
}))
export const buildLikesRelations = relations(buildLikes, ({ one }) => ({
  build: one(builds, { fields: [buildLikes.buildId], references: [builds.id] }),
  user: one(user, { fields: [buildLikes.userId], references: [user.id] }),
}))
export const buildCommentsRelations = relations(buildComments, ({ one }) => ({
  build: one(builds, { fields: [buildComments.buildId], references: [builds.id] }),
  author: one(user, { fields: [buildComments.userId], references: [user.id] }),
}))
export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(user, { fields: [threads.userId], references: [user.id] }),
  posts: many(posts),
}))
export const postsRelations = relations(posts, ({ one }) => ({
  thread: one(threads, { fields: [posts.threadId], references: [threads.id] }),
  author: one(user, { fields: [posts.userId], references: [user.id] }),
}))
