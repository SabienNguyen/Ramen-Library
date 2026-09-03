import { Elysia } from 'elysia'
import { auth } from './auth'

/** Attaches the current Better Auth session (if any) as `user` on every request. */
export const session = new Elysia({ name: 'session' }).derive({ as: 'global' }, async ({ request }) => ({
  user: (await auth.api.getSession({ headers: request.headers }))?.user ?? null,
}))
