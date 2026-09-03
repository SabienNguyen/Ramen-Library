import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createClient } from '@libsql/client'
import { Kysely } from 'kysely'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import type { DB } from './types'

const url = process.env.DATABASE_URL ?? 'file:data/ramen.db'

if (url.startsWith('file:')) {
  const path = url.slice('file:'.length)
  if (path && path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true })
  }
}

export const libsql = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
})

if (url.startsWith('file:')) {
  // The old raw sqlite3 client set these pragmas by default; libsql's
  // createClient sets neither, so set them explicitly for local file DBs.
  await libsql.execute('PRAGMA journal_mode = WAL')
  await libsql.execute('PRAGMA busy_timeout = 5000')
}

// `@libsql/kysely-libsql` bundles its own (older) copy of `@libsql/client`, whose
// `Client` type doesn't structurally match the one we construct above (Bun/npm
// hoisting doesn't dedupe transitive deps here). The runtime object is identical;
// the cast only works around the type mismatch between the two copies.
export const db = new Kysely<DB>({ dialect: new LibsqlDialect({ client: libsql as never }) })
