import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/client'
import * as schema from './db/schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-only-secret-change-me-please-32chars',
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      bio: { type: 'string', required: false, input: true },
    },
  },
  session: { cookieCache: { enabled: true, maxAge: 60 * 5 } },
  trustedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
})

export type Auth = typeof auth
