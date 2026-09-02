import { useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { api, timeAgo, type Author } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SignInPrompt } from '@/components/site/PageBits'

export type Message = { id: string; userId: string; body: string; createdAt: string; author: Author }

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
}: {
  items: Message[]
  postTo: string
  deletePath: (id: string) => string
  placeholder: string
  next: string
  noun?: string
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
    <div className="grid gap-4">
      <ul className="grid gap-3">
        <AnimatePresence initial={false}>
          {items.map((m) => (
            <motion.li key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
              <Link to={`/u/${m.author.id}`} className="mt-0.5 shrink-0">
                <Avatar name={m.author.name} image={m.author.image} />
              </Link>
              <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link to={`/u/${m.author.id}`} className="font-semibold text-foreground hover:underline">
                    {m.author.name}
                  </Link>
                  <span>{timeAgo(m.createdAt)}</span>
                  {session?.user.id === m.userId && (
                    <button type="button" onClick={() => remove(m.id)} className="ml-auto rounded p-1 hover:text-destructive" aria-label={`Delete ${noun}`}>
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {items.length === 0 && <li className="text-sm text-muted-foreground italic">No {noun}s yet. Be the first at the counter.</li>}
      </ul>

      {session ? (
        <form onSubmit={submit} className="flex gap-3">
          <Avatar name={session.user.name} image={session.user.image} className="mt-0.5" />
          <div className="flex-1">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} className={cn('min-h-20', error && 'border-destructive')} maxLength={10000} />
            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" size="sm" disabled={busy || !body.trim()}>
                Post {noun}
              </Button>
              {error && <span className="text-xs text-destructive">{error}</span>}
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">⌘/Ctrl + Enter to post</span>
            </div>
          </div>
        </form>
      ) : (
        <SignInPrompt what={`post a ${noun}`} next={next} />
      )}
    </div>
  )
}
