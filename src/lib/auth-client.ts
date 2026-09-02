import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({ user: { bio: { type: 'string', required: false } } })],
})

export type SessionUser = NonNullable<ReturnType<typeof authClient.useSession>['data']>['user']
