import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export interface Storage {
  /** Store bytes under `key` and return the public URL they are reachable at. */
  putObject(key: string, bytes: Buffer | Uint8Array, contentType: string): Promise<string>
}

/** Minimal shape of the parts of S3Client we depend on, so a fake client can be injected in tests. */
interface S3Like {
  send(command: unknown): Promise<unknown>
}

export const s3Configured = Boolean(process.env.S3_ENDPOINT)

export const LOCAL_UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'data/uploads'

function createS3Storage(env: NodeJS.ProcessEnv, client?: S3Like): Storage {
  const required = ['S3_BUCKET', 'S3_PUBLIC_URL', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const
  const missing = required.filter((key) => !env[key])
  if (missing.length > 0) {
    throw new Error(`S3 storage is misconfigured: missing ${missing.join(', ')}`)
  }

  const bucket = env.S3_BUCKET
  const publicUrl = (env.S3_PUBLIC_URL as string).replace(/\/+$/, '')
  const s3 =
    client ??
    new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION ?? 'garage',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
      },
      forcePathStyle: true,
    })

  return {
    async putObject(key, bytes, contentType) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
      return `${publicUrl}/${key}`
    },
  }
}

function createLocalStorage(env: NodeJS.ProcessEnv): Storage {
  return {
    async putObject(key, bytes, _contentType) {
      // Read lazily (not captured at creation time) so the process-wide `storage`
      // singleton stays correct even if UPLOAD_DIR is set after module load
      // (e.g. tests that mutate process.env before dynamically importing).
      const dir = env.UPLOAD_DIR ?? 'data/uploads'
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, key), bytes)
      return `/uploads/${key}`
    },
  }
}

/**
 * True only if `url` points at this deployment's own upload storage (S3 public URL prefix
 * when S3 is configured, `/uploads/` when serving local files) — never a third-party host.
 * Reads `process.env` live (not captured) so it stays correct alongside `storage`'s lazy env reads.
 */
export function isOwnUploadUrl(url: string): boolean {
  if (process.env.S3_ENDPOINT) {
    const publicUrl = (process.env.S3_PUBLIC_URL ?? '').replace(/\/+$/, '')
    return publicUrl !== '' && url.startsWith(`${publicUrl}/`)
  }
  return url.startsWith('/uploads/')
}

export function createStorage(env: NodeJS.ProcessEnv = process.env, s3Client?: S3Like): Storage {
  if (env.S3_ENDPOINT) return createS3Storage(env, s3Client)
  return createLocalStorage(env)
}

export const storage: Storage = createStorage(process.env)
