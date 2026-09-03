import { betterAuth } from 'better-auth'
import { db } from './db/client'
import { sendVerificationEmail } from './email'

const authUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:5173'

const trustedOrigins = [
  new URL(authUrl).origin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.TRUSTED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
]

export const auth = betterAuth({
  baseURL: authUrl,
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-only-secret-change-me-please-32chars',
  database: { db, type: 'sqlite' },
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  emailVerification: {
    sendVerificationEmail,
    sendOnSignUp: true,
  },
  user: {
    additionalFields: {
      bio: { type: 'string', required: false, input: true },
    },
  },
  session: { cookieCache: { enabled: true, maxAge: 60 * 5 } },
  trustedOrigins: [...new Set(trustedOrigins)],
})

export type Auth = typeof auth
