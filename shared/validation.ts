import { z } from 'zod'
import { byId } from './ingredients'
import { COVER_TEMPLATES, FORUM_CATEGORIES, MAX_TOPPINGS } from './bowl'

const idIn = (table: Record<string, unknown>) => z.string().refine((v) => v in table, 'unknown part')

export const bowlSchema = z.object({
  brothId: idIn(byId.broth).nullable(),
  tareId: idIn(byId.tare).nullable(),
  noodleId: idIn(byId.noodle).nullable(),
  oilId: idIn(byId.oil).nullable(),
  toppings: z
    .array(
      z.object({
        key: z.string().min(1).max(40),
        toppingId: idIn(byId.topping),
        x: z.number().min(0).max(400),
        y: z.number().min(0).max(400),
        rotation: z.number().min(-180).max(180),
      }),
    )
    .max(MAX_TOPPINGS),
})

const uploadUrl = z.string().regex(/^\/uploads\/[a-z0-9-]+(\.thumb)?\.webp$/, 'not an upload')
const templateId = z.enum(COVER_TEMPLATES.map((t) => t.id) as [string, ...string[]])

export const coverSchema = z.object({
  imageUrl: uploadUrl.nullable().optional(),
  thumbUrl: uploadUrl.nullable().optional(),
  templateId: templateId.nullable().optional(),
})

export const publishBuildSchema = coverSchema.extend({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(2000).default(''),
  bowl: bowlSchema,
})

export const updateBuildSchema = coverSchema.extend({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(2000).optional(),
})

export const commentSchema = z.object({ body: z.string().trim().min(1).max(2000) })

export const threadSchema = z.object({
  category: z.enum(FORUM_CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(1).max(10000),
})

export const postSchema = z.object({ body: z.string().trim().min(1).max(10000) })

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(40),
  bio: z.string().trim().max(300).default(''),
})
