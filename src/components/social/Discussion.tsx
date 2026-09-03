import { useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { timeAgo, type Author } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SignInPrompt } from '@/components/site/PageBits'

export type Message = { id: string; userId: string; body: string; createdAt: string; author: Author }

/** A classic two-column post: author on the left, body on the right. */
export function PostRow({ author, createdAt, children, tag, onDelete, index }: { author: Author; createdAt: string; children: React.ReactNode; tag?: string; onDelete?: () => void; index?: number }) {
  return (
    <div className="grid grid-cols-[150px_1fr] overflow-hidden rounded-lg border border-border bg-card shadow-card max-sm:grid-cols-1">
      <div className="border-r border-border bg-muted px-3.5 py-3 text-[12px] max-sm:border-r-0 max-sm:border-b">
        <div className="flex items-center gap-2.5 sm:flex-col sm:items-start">
          <Avatar name={author.name} image={author.image} className="size-10 text-[12px]" />
          <div>
            <Link to={`/u/${author.id}`} className="font-semibold text-foreground">
              {author.name}
            </Link>
            {tag && <div className="text-muted-foreground">{tag}</div>}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[12px] text-muted-foreground">
          <span>{timeAgo(createdAt)}</span>
          {index !== undefined && <span className="ml-auto tabular-nums">#{index}</span>}
          {onDelete && (
            <button type="button" onClick={onDelete} className={cn('hover:text-destructive', index === undefined && 'ml-auto')}>
              Delete
            </button>
          )}
        </div>
        <div className="px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  )
}

/**
 * A comment thread. Used for comments on builds and replies in the forum —
 * same shape, different endpoints.
 */
export function Discussion({
  items,
  onPost,
  onDelete,
  placeholder,
  next,
  noun = 'comment',
  startIndex = 1,
}: {
  items: Message[]
  onPost: (body: string) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
  placeholder: string
  next: string
  noun?: string
  startIndex?: number
}) {
  const { data: session } = authClient.useSession()
  const revalidator = useRevalidator()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setError(null)
    try {
      await onPost(body)
      setBody('')
      revalidator.revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!confirm(`Delete this ${noun}?`)) return
    await onDelete(id)
    revalidator.revalidate()
  }

  return (
    <div className="grid gap-3">
      {items.map((m, i) => (
        <PostRow key={m.id} author={m.author} createdAt={m.createdAt} index={startIndex + i} onDelete={session?.user.id === m.userId ? () => remove(m.id) : undefined}>
          {m.body}
        </PostRow>
      ))}
      {items.length === 0 && <p className="text-[13px] text-muted-foreground">No {noun === 'reply' ? 'replies' : 'comments'} yet.</p>}

      {session ? (
        <form onSubmit={submit} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-2 text-[13px] font-semibold">Post a {noun}</div>
          <div className="grid gap-3 p-4">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} className="min-h-20" maxLength={10000} />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy || !body.trim()}>
                Submit
              </Button>
              {error && <span className="text-[12px] text-destructive">{error}</span>}
            </div>
          </div>
        </form>
      ) : (
        <SignInPrompt what={`post a ${noun}`} next={next} />
      )}
    </div>
  )
}
