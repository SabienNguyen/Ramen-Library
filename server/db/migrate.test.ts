import { afterAll, beforeAll, describe, expect, spyOn, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const tmpDir = mkdtempSync(join(tmpdir(), 'ramen-db-test-'))
const dbPath = join(tmpDir, 't.db')
process.env.DATABASE_URL = `file:${dbPath}`
process.env.BETTER_AUTH_SECRET = 'test-secret-at-least-32-characters-long'
process.env.BETTER_AUTH_URL = 'http://localhost:5173'

const { migrateToLatest } = await import('./migrate')
const { db } = await import('./client')
const { auth } = await import('../auth')

const EXPECTED_TABLES = [
  'user',
  'session',
  'account',
  'verification',
  'builds',
  'build_likes',
  'build_comments',
  'forum_threads',
  'forum_posts',
]

async function listTables(): Promise<string[]> {
  const { sql } = await import('kysely')
  const result = await sql<{ name: string }>`select name from sqlite_master where type = 'table'`.execute(db)
  return result.rows.map((r) => r.name)
}

describe('migrateToLatest', () => {
  beforeAll(async () => {
    await migrateToLatest()
  })

  afterAll(async () => {
    await db.destroy()
    rmSync(tmpDir, { recursive: true, force: true })
  })

  test('creates all nine tables', async () => {
    const tables = await listTables()
    for (const t of EXPECTED_TABLES) {
      expect(tables).toContain(t)
    }
  })

  test('running migrations a second time is a no-op', async () => {
    await expect(migrateToLatest()).resolves.toBeUndefined()
    const tables = await listTables()
    for (const t of EXPECTED_TABLES) {
      expect(tables.filter((name) => name === t)).toHaveLength(1)
    }
  })

  test('sign up creates a user row with null bio', async () => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})

    const res = await auth.api.signUpEmail({
      body: {
        email: 'tester@example.com',
        password: 'password123',
        name: 'Tester',
      },
    })
    expect(res.user).toBeTruthy()
    expect(res.user.email).toBe('tester@example.com')

    // The verification email hook logs the link when EMAIL_PROVIDER_KEY is
    // unset — asserting this fired confirms sendVerificationEmail is
    // actually wired up (sendOnSignUp) rather than silently skipped.
    expect(logSpy).toHaveBeenCalled()
    logSpy.mockRestore()

    const row = await db
      .selectFrom('user')
      .selectAll()
      .where('email', '=', 'tester@example.com')
      .executeTakeFirst()

    expect(row).toBeTruthy()
    expect(row?.bio).toBeNull()
    expect(typeof row?.createdAt).toBe('string')
    expect(Number.isNaN(new Date(row!.createdAt).getTime())).toBe(false)
  })

  test('journal_mode is wal for the file db', async () => {
    const { sql } = await import('kysely')
    const result = await sql<{ journal_mode: string }>`PRAGMA journal_mode`.execute(db)
    expect(result.rows[0]?.journal_mode).toBe('wal')
  })
})
