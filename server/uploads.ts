import sharp from 'sharp'
import { ApiError } from './errors.ts'
import { storage } from './storage.ts'

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic'])

/**
 * Accept a photo, re-encode it as WebP (which also strips EXIF and any
 * embedded nonsense), and write a full-size and a 4:3 thumbnail version.
 */
export async function saveUpload(file: File): Promise<{ imageUrl: string; thumbUrl: string }> {
  if (!ALLOWED.has(file.type)) throw new ApiError(400, 'Use a JPEG, PNG, WebP or GIF.')
  if (file.size > MAX_BYTES) throw new ApiError(413, 'Photo is over 8 MB. Shrink it a little.')
  const buf = Buffer.from(await file.arrayBuffer())
  const id = crypto.randomUUID()
  const base = sharp(buf, { failOn: 'error', animated: false }).rotate()
  let imageBytes: Buffer
  let thumbBytes: Buffer
  try {
    imageBytes = await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
    thumbBytes = await base.clone().resize({ width: 800, height: 600, fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toBuffer()
  } catch {
    throw new ApiError(400, 'That file does not look like an image.')
  }
  const imageUrl = await storage.putObject(`${id}.webp`, imageBytes, 'image/webp')
  const thumbUrl = await storage.putObject(`${id}.thumb.webp`, thumbBytes, 'image/webp')
  return { imageUrl, thumbUrl }
}
