import type { Bowl } from '../../shared/bowl'

export type Author = { id: string; name: string; image: string | null }
export type BuildItem = {
  id: string
  userId: string
  name: string
  description: string
  bowl: Bowl
  imageUrl: string | null
  thumbUrl: string | null
  templateId: string | null
  createdAt: string
  updatedAt: string
  author: Author
  likeCount: number
  commentCount: number
  likedByMe: boolean
}
export type Comment = { id: string; buildId: string; userId: string; body: string; createdAt: string; author: Author }
export type BuildDetail = BuildItem & { comments: Comment[]; author: Author & { bio: string | null } }
export type ThreadItem = {
  id: string
  userId: string
  category: string
  title: string
  body: string
  createdAt: string
  lastActivityAt: string
  author: Author
  replyCount: number
}
export type Post = { id: string; threadId: string; userId: string; body: string; createdAt: string; author: Author }
export type ThreadDetail = Omit<ThreadItem, 'replyCount'> & { posts: Post[] }
export type Profile = { id: string; name: string; image: string | null; bio: string | null; createdAt: string }
export type HomeData = {
  stats: { builds: number; users: number; threads: number }
  builds: BuildItem[]
  threads: ThreadItem[]
  topBuildId: string | null
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const data = (await res.json()) as { error?: string; message?: string }
      message = data.error ?? data.message ?? message
    } catch {
      /* not json */
    }
    throw new ApiError(res.status, message)
  }
  return res.json() as Promise<T>
}

/** Upload a photo; returns the stored URLs. */
export async function uploadPhoto(file: File): Promise<{ imageUrl: string; thumbUrl: string }> {
  const form = new FormData()
  form.append('file', file)
  return api('/uploads', { method: 'POST', body: form })
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
