import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { FORUM_CATEGORIES } from '../../shared/bowl'
import { api, type ThreadDetail, type ThreadItem } from '@/lib/api'
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
      <div className="mb-2 text-[11px]">
        <span className="text-muted-foreground">Categories: </span>
        <Link to="/forum" className={cn(!category && 'font-bold text-foreground')}>
          All
        </Link>
        {FORUM_CATEGORIES.map((c) => (
          <span key={c.id}>
            <span className="px-1 text-muted-foreground">·</span>
            <Link to={`/forum?category=${c.id}`} className={cn(category === c.id && 'font-bold text-foreground')} title={c.blurb}>
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
      const { id } = await api<{ id: string }>('/forum/threads', { method: 'POST', json: { category, title, body } })
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
        <form onSubmit={submit} className="border border-border">
          <table className="w-full text-[12px]">
            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border [&>tr>td]:px-2 [&>tr>td]:py-1.5 [&>tr>td:first-child]:w-28 [&>tr>td:first-child]:bg-muted [&>tr>td:first-child]:font-bold [&>tr>td:first-child]:align-top">
              <tr>
                <td>Category</td>
                <td>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-7 border border-input bg-white px-1 text-[12px]">
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
          <div className="flex items-center gap-2 p-2">
            <Button type="submit" disabled={busy}>
              Submit
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            {error && <span className="text-[11px] text-destructive">{error}</span>}
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
    await api(`/forum/threads/${thread.id}`, { method: 'DELETE' })
    navigate('/forum')
  }

  return (
    <div className="grid gap-2">
      <div className="text-[11px] text-muted-foreground">
        <Link to="/forum">Forum</Link> » <CategoryChip id={thread.category} />
      </div>
      <h1 className="text-[16px] font-bold">{thread.title}</h1>
      <PostRow author={thread.author} createdAt={thread.createdAt} tag="Original poster" onDelete={mine ? remove : undefined}>
        {thread.body}
      </PostRow>
      <Discussion items={thread.posts} postTo={`/forum/threads/${thread.id}/posts`} deletePath={(id) => `/forum/posts/${id}`} placeholder="" next={`/forum/${thread.id}`} noun="reply" startIndex={2} />
    </div>
  )
}
