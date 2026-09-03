import type { ColumnType, Generated } from 'kysely'

export interface UserTable {
  id: string
  name: string
  email: string
  emailVerified: ColumnType<number, number | boolean, number | boolean>
  image: string | null
  createdAt: ColumnType<string, string, string>
  updatedAt: ColumnType<string, string, string>
  bio: string | null
}

export interface SessionTable {
  id: string
  expiresAt: string
  token: string
  createdAt: ColumnType<string, string, string>
  updatedAt: ColumnType<string, string, string>
  ipAddress: string | null
  userAgent: string | null
  userId: string
}

export interface AccountTable {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: string | null
  refreshTokenExpiresAt: string | null
  scope: string | null
  issuer: string | null
  password: string | null
  createdAt: ColumnType<string, string, string>
  updatedAt: ColumnType<string, string, string>
}

export interface VerificationTable {
  id: string
  identifier: string
  value: string
  expiresAt: string
  createdAt: ColumnType<string, string, string>
  updatedAt: ColumnType<string, string, string>
}

export interface BuildsTable {
  id: string
  user_id: string
  name: string
  description: Generated<string>
  bowl: string
  image_url: string | null
  thumb_url: string | null
  template_id: string | null
  created_at: number
  updated_at: number
}

export interface BuildLikesTable {
  build_id: string
  user_id: string
  created_at: number
}

export interface BuildCommentsTable {
  id: string
  build_id: string
  user_id: string
  body: string
  created_at: number
}

export interface ForumThreadsTable {
  id: string
  user_id: string
  category: string
  title: string
  body: string
  created_at: number
  last_activity_at: number
}

export interface ForumPostsTable {
  id: string
  thread_id: string
  user_id: string
  body: string
  created_at: number
}

export interface DB {
  user: UserTable
  session: SessionTable
  account: AccountTable
  verification: VerificationTable
  builds: BuildsTable
  build_likes: BuildLikesTable
  build_comments: BuildCommentsTable
  forum_threads: ForumThreadsTable
  forum_posts: ForumPostsTable
}
