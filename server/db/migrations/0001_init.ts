import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // --- Better Auth tables (camelCase columns, as emitted for the Kysely adapter) ---

  await db.schema
    .createTable('user')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('emailVerified', 'integer', (col) => col.notNull())
    .addColumn('image', 'text')
    .addColumn('createdAt', 'date', (col) => col.notNull())
    .addColumn('updatedAt', 'date', (col) => col.notNull())
    .addColumn('bio', 'text')
    .execute()

  await db.schema
    .createTable('session')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('expiresAt', 'date', (col) => col.notNull())
    .addColumn('token', 'text', (col) => col.notNull().unique())
    .addColumn('createdAt', 'date', (col) => col.notNull())
    .addColumn('updatedAt', 'date', (col) => col.notNull())
    .addColumn('ipAddress', 'text')
    .addColumn('userAgent', 'text')
    .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .execute()

  await db.schema.createIndex('session_userId_idx').on('session').columns(['userId']).execute()

  await db.schema
    .createTable('account')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('accountId', 'text', (col) => col.notNull())
    .addColumn('providerId', 'text', (col) => col.notNull())
    .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('accessToken', 'text')
    .addColumn('refreshToken', 'text')
    .addColumn('idToken', 'text')
    .addColumn('accessTokenExpiresAt', 'date')
    .addColumn('refreshTokenExpiresAt', 'date')
    .addColumn('scope', 'text')
    .addColumn('issuer', 'text', (col) => col.notNull())
    .addColumn('password', 'text')
    .addColumn('createdAt', 'date', (col) => col.notNull())
    .addColumn('updatedAt', 'date', (col) => col.notNull())
    .execute()

  await db.schema.createIndex('account_userId_idx').on('account').columns(['userId']).execute()
  await db.schema
    .createIndex('account_issuer_accountId_uidx')
    .unique()
    .on('account')
    .columns(['issuer', 'accountId'])
    .execute()

  await db.schema
    .createTable('verification')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('identifier', 'text', (col) => col.notNull())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('expiresAt', 'date', (col) => col.notNull())
    .addColumn('createdAt', 'date', (col) => col.notNull())
    .addColumn('updatedAt', 'date', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('verification_identifier_idx')
    .on('verification')
    .columns(['identifier'])
    .execute()

  // --- App tables (snake_case columns, unchanged from the old Drizzle migrations) ---

  await db.schema
    .createTable('builds')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('bowl', 'text', (col) => col.notNull())
    .addColumn('image_url', 'text')
    .addColumn('thumb_url', 'text')
    .addColumn('template_id', 'text')
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .addColumn('updated_at', 'integer', (col) => col.notNull())
    .execute()

  await db.schema.createIndex('builds_user_idx').on('builds').columns(['user_id']).execute()
  await db.schema.createIndex('builds_created_idx').on('builds').columns(['created_at']).execute()

  await db.schema
    .createTable('build_likes')
    .addColumn('build_id', 'text', (col) => col.notNull().references('builds.id').onDelete('cascade'))
    .addColumn('user_id', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('build_likes_pk', ['build_id', 'user_id'])
    .execute()

  await db.schema
    .createTable('build_comments')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('build_id', 'text', (col) => col.notNull().references('builds.id').onDelete('cascade'))
    .addColumn('user_id', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('build_comments_build_idx')
    .on('build_comments')
    .columns(['build_id'])
    .execute()

  await db.schema
    .createTable('forum_threads')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .addColumn('last_activity_at', 'integer', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('threads_category_idx')
    .on('forum_threads')
    .columns(['category'])
    .execute()
  await db.schema
    .createIndex('threads_activity_idx')
    .on('forum_threads')
    .columns(['last_activity_at'])
    .execute()

  await db.schema
    .createTable('forum_posts')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('thread_id', 'text', (col) => col.notNull().references('forum_threads.id').onDelete('cascade'))
    .addColumn('user_id', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .execute()

  await db.schema.createIndex('posts_thread_idx').on('forum_posts').columns(['thread_id']).execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('forum_posts').ifExists().execute()
  await db.schema.dropTable('forum_threads').ifExists().execute()
  await db.schema.dropTable('build_comments').ifExists().execute()
  await db.schema.dropTable('build_likes').ifExists().execute()
  await db.schema.dropTable('builds').ifExists().execute()
  await db.schema.dropTable('verification').ifExists().execute()
  await db.schema.dropTable('account').ifExists().execute()
  await db.schema.dropTable('session').ifExists().execute()
  await db.schema.dropTable('user').ifExists().execute()
}
