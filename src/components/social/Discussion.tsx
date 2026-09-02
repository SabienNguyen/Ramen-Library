import { useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { api, timeAgo, type Author } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SignInPrompt } from '@/components/site/PageBits'

export type Message = { id: string; userId: string; body: string; createdAt: string; author: Author }

/** A classic two-column post: author on the left, body on the right. */
export function PostRow({ author, createdAt, children, tag, onDelete, index }: { author: Author; createdAt: string; children: React.ReactNode; tag?: string; onDelete?: () => void; index?: number }) {
  return (
    <div className="grid grid-cols-[130px_1fr] border border-border bg-card">
      <div className="border-r border-border bg-muted px-2 py-2 text-[11px]">
        <Link to={`/u/${author.id}`} className="font-bold">
          {author.name}
        </Link>
        <Avatar name={author.name} image={author.image} className="mt-1.5 size-12" />
        {tag && <div className="mt-1 text-muted-foreground">{tag}</div>}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 border-b border-border bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
          <span>Posted {timeAgo(createdAt)}</span>
          {index !== undefined && <span className="ml-auto">#{index}</span>}
          {onDelete && (
            <button type="button" onClick={onDelete} className={index === undefined ? 'ml-auto text-primary hover:underline' : 'text-primary hover:underline'}>
              delete
            </button>
          )}
        </div>
        <div className="px-2 py-2 text-[12px] leading-relaxed whitespace-pre-wrap">{children}</div>
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
  postTo,
  deletePath,
  placeholder,
  next,
  noun = 'comment',
  startIndex = 1,
}: {
  items: Message[]
  postTo: string
  deletePath: (id: string) => string
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
      await api(postTo, { method: 'POST', json: { body } })
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
    await api(deletePath(id), { method: 'DELETE' })
    revalidator.revalidate()
  }

  return (
    <div className="grid gap-2">
      {items.map((m, i) => (
        <PostRow key={m.id} author={m.author} createdAt={m.createdAt} index={startIndex + i} onDelete={session?.user.id === m.userId ? () => remove(m.id) : undefined}>
          {m.body}
        </PostRow>
      ))}
      {items.length === 0 && <p className="text-[11px] text-muted-foreground">No {noun === 'reply' ? 'replies' : 'comments'} yet.</p>}

      {session ? (
        <form onSubmit={submit} className="border border-border">
          <div className="border-b border-border bg-secondary px-2 py-1 text-[11px] font-bold">Post a {noun}</div>
          <div className="grid gap-2 p-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} className="min-h-20" maxLength={10000} />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy || !body.trim()}>
                Submit
              </Button>
              {error && <span className="text-[11px] text-destructive">{error}</span>}
            </div>
          </div>
        </form>
      ) : (
        <SignInPrompt what={`post a ${noun}`} next={next} />
      )}
    </div>
  )
}
