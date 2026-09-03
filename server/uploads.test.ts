import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

const dir = mkdtempSync(path.join(tmpdir(), 'ramen-uploads-test-'))
process.env.UPLOAD_DIR = dir

const { saveUpload } = await import('./uploads.ts')
const { ApiError } = await import('./errors.ts')

async function pngFile(): Promise<File> {
  const buf = await sharp({
    create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
  })
    .png()
    .toBuffer()
  return new File([buf], 'photo.png', { type: 'image/png' })
}

describe('saveUpload', () => {
  test('writes webp image + thumb and returns their urls', async () => {
    const file = await pngFile()
    const { imageUrl, thumbUrl } = await saveUpload(file)

    expect(imageUrl).toMatch(/^\/uploads\/[a-z0-9-]+\.webp$/)
    expect(thumbUrl).toMatch(/^\/uploads\/[a-z0-9-]+\.thumb\.webp$/)

    const imagePath = path.join(dir, imageUrl.replace('/uploads/', ''))
    const thumbPath = path.join(dir, thumbUrl.replace('/uploads/', ''))
    expect(existsSync(imagePath)).toBe(true)
    expect(existsSync(thumbPath)).toBe(true)

    const meta = await sharp(imagePath).metadata()
    expect(meta.format).toBe('webp')
    const thumbMeta = await sharp(thumbPath).metadata()
    expect(thumbMeta.format).toBe('webp')
    expect(thumbMeta.width).toBe(800)
    expect(thumbMeta.height).toBe(600)
  })

  test('rejects a non-image file with 400', async () => {
    const file = new File([Buffer.from('not an image')], 'notes.txt', { type: 'text/plain' })
    let error: unknown
    try {
      await saveUpload(file)
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(ApiError)
    expect((error as InstanceType<typeof ApiError>).status).toBe(400)
  })

  test('rejects an oversize file with 413', async () => {
    const big = Buffer.alloc(8 * 1024 * 1024 + 1)
    const file = new File([big], 'huge.png', { type: 'image/png' })
    let error: unknown
    try {
      await saveUpload(file)
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(ApiError)
    expect((error as InstanceType<typeof ApiError>).status).toBe(413)
  })
})
