import { describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

describe('local storage', () => {
  test('writes the file and returns /uploads/<key>', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ramen-uploads-'))
    process.env.UPLOAD_DIR = dir

    const { createStorage } = await import('./storage.ts')
    const storage = createStorage({ ...process.env, UPLOAD_DIR: dir })

    const url = await storage.putObject('abc.webp', Buffer.from('hello'), 'image/webp')

    expect(url).toBe('/uploads/abc.webp')
    const written = path.join(dir, 'abc.webp')
    expect(existsSync(written)).toBe(true)
    expect(readFileSync(written, 'utf8')).toBe('hello')
  })
})

describe('exported constants', () => {
  test('s3Configured and LOCAL_UPLOAD_DIR reflect env', async () => {
    const mod = await import('./storage.ts')
    expect(typeof mod.s3Configured).toBe('boolean')
    expect(typeof mod.LOCAL_UPLOAD_DIR).toBe('string')
    expect(mod.storage).toBeTruthy()
  })
})

describe('s3 storage', () => {
  test('createStorage picks S3 impl when S3_ENDPOINT set, and builds public URL from injected client', async () => {
    const { createStorage } = await import('./storage.ts')

    const calls: unknown[] = []
    const fakeClient = {
      send: async (command: unknown) => {
        calls.push(command)
        return {}
      },
    }

    const storage = createStorage(
      {
        S3_ENDPOINT: 'http://x',
        S3_PUBLIC_URL: 'https://img.example',
        S3_BUCKET: 'b',
        S3_ACCESS_KEY_ID: 'a',
        S3_SECRET_ACCESS_KEY: 's',
      } as NodeJS.ProcessEnv,
      fakeClient as never,
    )

    const url = await storage.putObject('foo/bar.webp', Buffer.from('data'), 'image/webp')

    expect(url).toBe('https://img.example/foo/bar.webp')
    expect(calls.length).toBe(1)
  })
})
