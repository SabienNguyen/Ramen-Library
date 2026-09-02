import { useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { api, timeAgo, type BuildItem, type Profile } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { Avatar } from '@/components/ui/avatar'
import { CategoryChip } from '@/components/social/CategoryChip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BuildCard } from '@/components/social/BuildCard'
import { Empty, PageHeader } from '@/components/site/PageBits'

type ProfileData = {
  profile: Profile
  builds: BuildItem[]
  threads: { id: string; title: string; category: string; createdAt: string }[]
  postCount: number
}

export function ProfilePage() {
  const { profile, builds, threads, postCount } = useLoaderData() as ProfileData
  const { data: session } = authClient.useSession()
  const me = session?.user.id === profile.id

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={profile.name} image={profile.image} className="size-16 text-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-4xl leading-none">{profile.name}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · {builds.length} build{builds.length === 1 ? '' : 's'} · {threads.length} thread
            {threads.length === 1 ? '' : 's'} · {postCount} repl{postCount === 1 ? 'y' : 'ies'}
          </p>
          {profile.bio && <p className="mt-2 max-w-prose text-sm whitespace-pre-wrap">{profile.bio}</p>}
        </div>
        {me && (
          <Link to="/settings" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Edit profile
          </Link>
        )}
      </div>

      <section>
        <h2 className="mb-3 font-serif text-2xl">Builds</h2>
        {builds.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {builds.map((b) => (
              <BuildCard key={b.id} build={b} />
            ))}
          </div>
        ) : (
          <Empty title="No published builds" />
        )}
      </section>

      {threads.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-2xl">Threads</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
            {threads.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <CategoryChip id={t.category} />
                <Link to={`/forum/${t.id}`} className="min-w-0 flex-1 truncate hover:underline">
                  {t.title}
                </Link>
                <span className="text-xs text-muted-foreground">{timeAgo(t.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const navigate = useNavigate()
  const [name, setName] = useState<string | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (isPending) return null
  if (!session) {
    navigate('/login?next=/settings')
    return null
  }
  const user = session.user as typeof session.user & { bio?: string | null }
  const curName = name ?? user.name
  const curBio = bio ?? user.bio ?? ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await api('/me', { method: 'PATCH', json: { name: curName, bio: curBio } })
      await refetch()
      setMsg('Saved.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Display name</span>
              <Input value={curName} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={40} required />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Bio</span>
              <Textarea value={curBio} onChange={(e) => setBio(e.target.value)} maxLength={300} placeholder="A line about you" />
            </label>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy}>
                Save
              </Button>
              {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
              <span className="ml-auto text-xs text-muted-foreground">{user.email}</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
