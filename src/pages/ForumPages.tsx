import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { FORUM_CATEGORIES } from '../../shared/bowl'
import { client, unwrap, type ThreadDetail, type ThreadItem } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { categoryBlurb, categoryLabel } from '@/lib/forum'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CategoryChip } from '@/components/social/CategoryChip'
import { Discussion, PostRow } from '@/components/social/Discussion'
import { ThreadTable } from '@/components/social/ThreadTable'
import { PageHeader, SignInPrompt } from '@/components/site/PageBits'

export function ForumPage() {
  const { items } = useLoaderData() as { items: ThreadItem[] }
  const [params] = useSearchParams()
  const category = params.get('category')

  return (
    <div>
      <PageHeader
        title={category ? categoryLabel(category) : 'Forum'}
        blurb={category ? categoryBlurb(category) : undefined}
        action={
          <Link to={`/forum/new${category ? `?category=${category}` : ''}`} className={buttonVariants()}>
            New thread
          </Link>
        }
      />
      <div className="mb-3 text-[13px]">
        <span className="text-muted-foreground">Categories: </span>
        <Link to="/forum" className={cn(!category && 'font-semibold text-foreground')}>
          All
        </Link>
        {FORUM_CATEGORIES.map((c) => (
          <span key={c.id}>
            <span className="px-1 text-muted-foreground">·</span>
            <Link to={`/forum?category=${c.id}`} className={cn(category === c.id && 'font-semibold text-foreground')} title={c.blurb}>
              {c.label}
            </Link>
          </span>
        ))}
      </div>
      <ThreadTable threads={items} showCategory={!category} />
    </div>
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
      const { id } = await unwrap(client.api.forum.threads.post({ category, title, body }))
      navigate(`/forum/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New thread" />
      {isPending ? null : !session ? (
        <SignInPrompt what="start a thread" next="/forum/new" />
      ) : (
        <form onSubmit={submit} className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <table className="w-full text-[13px]">
            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border [&>tr>td]:px-3 [&>tr>td]:py-2.5 [&>tr>td:first-child]:w-28 [&>tr>td:first-child]:bg-muted [&>tr>td:first-child]:text-[12px] [&>tr>td:first-child]:font-medium [&>tr>td:first-child]:text-muted-foreground [&>tr>td:first-child]:align-top">
              <tr>
                <td>Category</td>
                <td>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-8 rounded-md border border-input bg-card px-2 text-[13px] shadow-card">
                    {FORUM_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Title</td>
                <td>
                  <Input required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td>Message</td>
                <td>
                  <Textarea required className="min-h-40" value={body} onChange={(e) => setBody(e.target.value)} maxLength={10000} />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex items-center gap-2 p-3">
            <Button type="submit" disabled={busy}>
              Submit
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            {error && <span className="text-[12px] text-destructive">{error}</span>}
          </div>
        </form>
      )}
    </div>
  )
}

export function ThreadPage() {
  const { thread } = useLoaderData() as { thread: ThreadDetail }
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const mine = session?.user.id === thread.userId

  async function remove() {
    if (!confirm('Delete this thread and all its replies?')) return
    await unwrap(client.api.forum.threads({ id: thread.id }).delete())
    navigate('/forum')
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Link to="/forum">Forum</Link> <span>/</span> <CategoryChip id={thread.category} />
      </div>
      <h1 className="text-xl font-semibold">{thread.title}</h1>
      <PostRow author={thread.author} createdAt={thread.createdAt} tag="Original poster" onDelete={mine ? remove : undefined}>
        {thread.body}
      </PostRow>
      <Discussion
        items={thread.posts}
        onPost={(body) => unwrap(client.api.forum.threads({ id: thread.id }).posts.post({ body }))}
        onDelete={(id) => unwrap(client.api.forum.posts({ id }).delete())}
        placeholder=""
        next={`/forum/${thread.id}`}
        noun="reply"
        startIndex={2}
      />
    </div>
  )
}
