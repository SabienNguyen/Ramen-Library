import { treaty } from '@elysiajs/eden'
import type { App } from '../../server/app'

export const client = treaty<App>(window.location.origin)

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

type EdenResponse<T> = { data: T | null; error: { status: unknown; value: unknown } | null }

/** Unwrap an Eden response: return data or throw ApiError(status, error.value.error). */
export async function unwrap<T>(p: Promise<EdenResponse<T>>): Promise<T> {
  const { data, error } = await p
  if (error) {
    const value = error.value as { error?: string; message?: string } | undefined
    const message = value?.error ?? value?.message ?? 'Request failed.'
    const status = typeof error.status === 'number' ? error.status : 500
    throw new ApiError(status, message)
  }
  return data as T
}

/** Upload a photo; returns the stored URLs. */
export async function uploadPhoto(file: File): Promise<{ imageUrl: string; thumbUrl: string }> {
  return unwrap(client.api.uploads.post({ file }))
}

export function timeAgo(iso: string | Date) {
  const t = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime()
  const s = Math.max(1, Math.round((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d > 365 ? 'numeric' : undefined })
}

// --- Types, inferred from the treaty client where possible ---------------

type Data<T> = Awaited<T> extends { data: infer D } ? NonNullable<D> : never

export type HomeData = Data<ReturnType<typeof client.api.home.get>>
export type BuildItem = HomeData['builds'][number]
export type ThreadItem = HomeData['threads'][number]
export type Author = BuildItem['author']

type BuildDetailResponse = Data<ReturnType<ReturnType<typeof client.api.builds>['get']>>
export type BuildDetail = BuildDetailResponse['build']
export type Comment = BuildDetail['comments'][number]

type ThreadDetailResponse = Data<ReturnType<ReturnType<typeof client.api.forum.threads>['get']>>
export type ThreadDetail = ThreadDetailResponse['thread']
export type Post = ThreadDetail['posts'][number]

type UserResponse = Data<ReturnType<ReturnType<typeof client.api.users>['get']>>
export type Profile = UserResponse['profile']
