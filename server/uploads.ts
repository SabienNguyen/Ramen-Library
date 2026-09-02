import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { HTTPException } from 'hono/http-exception'
import sharp from 'sharp'

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(path.dirname(process.env.DATABASE_FILE ?? 'data/ramen.db'), 'uploads')
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic'])

/**
 * Accept a photo, re-encode it as WebP (which also strips EXIF and any
 * embedded nonsense), and write a full-size and a 4:3 thumbnail version.
 */
export async function saveUpload(file: File): Promise<{ imageUrl: string; thumbUrl: string }> {
  if (!ALLOWED.has(file.type)) throw new HTTPException(400, { message: 'Use a JPEG, PNG, WebP or GIF.' })
  if (file.size > MAX_BYTES) throw new HTTPException(413, { message: 'Photo is over 8 MB. Shrink it a little.' })
  const buf = Buffer.from(await file.arrayBuffer())
  await mkdir(UPLOAD_DIR, { recursive: true })
  const id = crypto.randomUUID()
  const base = sharp(buf, { failOn: 'error', animated: false }).rotate()
  try {
    await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(UPLOAD_DIR, `${id}.webp`))
    await base.clone().resize({ width: 800, height: 600, fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toFile(path.join(UPLOAD_DIR, `${id}.thumb.webp`))
  } catch {
    throw new HTTPException(400, { message: 'That file does not look like an image.' })
  }
  return { imageUrl: `/uploads/${id}.webp`, thumbUrl: `/uploads/${id}.thumb.webp` }
}
