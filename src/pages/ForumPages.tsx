import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator, useSearchParams } from 'react-router'
import { MessageCircle, PenLine, Trash2 } from 'lucide-react'
import { FORUM_CATEGORIES } from '../../shared/bowl'
import { api, timeAgo, type ThreadDetail, type ThreadItem } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Discussion } from '@/components/social/Discussion'
import { Empty, PageHeader, SignInPrompt } from '@/components/site/PageBits'

const catLabel = (id: string) => FORUM_CATEGORIES.find((c) => c.id === id)?.label ?? id

export function ForumPage() {
  const { items } = useLoaderData() as { items: ThreadItem[] }
  const [params] = useSearchParams()
  const category = params.get('category')

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <aside className="grid gap-1 lg:sticky lg:top-20">
        <Link to="/forum/new" className={cn(buttonVariants(), 'mb-2 justify-start')}>
          <PenLine /> New thread
        </Link>
        <CatLink to="/forum" active={!category} label="All threads" />
        {FORUM_CATEGORIES.map((c) => (
          <CatLink key={c.id} to={`/forum?category=${c.id}`} active={category === c.id} label={c.label} blurb={c.blurb} />
        ))}
      </aside>

      <div>
        <PageHeader title={category ? catLabel(category) : 'Forum'} jp="掲示板" blurb={category ? FORUM_CATEGORIES.find((c) => c.id === category)?.blurb : 'Recipes, technique, regional beef. Keep it about the bowl.'} className="mb-4" />
        {items.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card/60">
            {items.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={t.author.name} image={t.author.image} className="size-8" />
                <div className="min-w-0 flex-1">
                  <Link to={`/forum/${t.id}`} className="block truncate font-medium hover:underline">
                    {t.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.author.name} · {timeAgo(t.createdAt)} · {t.body}
                  </p>
                </div>
                {!category && (
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {catLabel(t.category)}
                  </Badge>
                )}
                <span className="flex w-12 items-center justify-end gap-1 font-mono text-xs text-muted-foreground tabular-nums">
                  <MessageCircle className="size-3.5" /> {t.replyCount}
                </span>
                <span className="hidden w-16 text-right text-xs text-muted-foreground sm:block">{timeAgo(t.lastActivityAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No threads here yet" blurb="Every good forum started with one person talking to themselves." action={<Link to="/forum/new" className={buttonVariants({ variant: 'outline' })}>Start the first one</Link>} />
        )}
      </div>
    </div>
  )
}

function CatLink({ to, active, label, blurb }: { to: string; active: boolean; label: string; blurb?: string }) {
  return (
    <Link to={to} className={cn('rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary/60', active ? 'bg-secondary text-foreground' : 'text-muted-foreground')}>
      <div className="font-medium">{label}</div>
      {blurb && <div className="text-[11px] text-muted-foreground">{blurb}</div>}
    </Link>
  )
}

export function NewThreadPage() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [category, setCategory] = useState(params.get('category') ?? 'general')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { id } = await api<{ id: string }>('/forum/threads', { method: 'POST', json: { category, title, body } })
      navigate(`/forum/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New thread" blurb="Pick a category, say the thing." />
      {isPending ? null : !session ? (
        <SignInPrompt what="start a thread" next="/forum/new" />
      ) : (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={submit} className="grid gap-4">
              <div className="flex flex-wrap gap-1.5">
                {FORUM_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', category === c.id ? 'border-primary bg-primary/15 text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <Input placeholder="Title" required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 font-serif text-lg" />
              <Textarea placeholder="Body. Recipes, ratios, questions, hot takes." required className="min-h-48" value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                  Post thread
                </Button>
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function ThreadPage() {
  const { thread } = useLoaderData() as { thread: ThreadDetail }
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const mine = session?.user.id === thread.userId

  async function remove() {
    if (!confirm('Delete this thread and all its replies?')) return
    await api(`/forum/threads/${thread.id}`, { method: 'DELETE' })
    navigate('/forum')
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link to={`/forum?category=${thread.category}`} className="text-xs text-muted-foreground hover:text-foreground">
          ← {catLabel(thread.category)}
        </Link>
        <h1 className="mt-1 font-serif text-4xl leading-tight">{thread.title}</h1>
      </div>

      <article className="flex gap-3">
        <Link to={`/u/${thread.author.id}`} className="mt-0.5 shrink-0">
          <Avatar name={thread.author.name} image={thread.author.image} className="size-10" />
        </Link>
        <div className="min-w-0 flex-1 rounded-xl border border-primary/30 bg-card/80 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to={`/u/${thread.author.id}`} className="font-medium text-foreground hover:underline">
              {thread.author.name}
            </Link>
            <Badge variant="default" className="px-1.5 py-0 text-[10px]">
              OP
            </Badge>
            <span>{timeAgo(thread.createdAt)}</span>
            {mine && (
              <button type="button" onClick={remove} className="ml-auto rounded p-1 hover:text-destructive" aria-label="Delete thread">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{thread.body}</p>
        </div>
      </article>

      <section>
        <h2 className="mb-3 font-serif text-2xl">
          Replies <span className="font-sans text-sm text-muted-foreground">{thread.posts.length}</span>
        </h2>
        <Discussion
          key={revalidator.state}
          items={thread.posts}
          postTo={`/forum/threads/${thread.id}/posts`}
          deletePath={(id) => `/forum/posts/${id}`}
          placeholder="Reply. Bring ratios."
          next={`/forum/${thread.id}`}
          noun="reply"
        />
      </section>
    </div>
  )
}
