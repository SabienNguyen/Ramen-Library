import { useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { client, timeAgo, unwrap, type BuildItem, type Profile } from '@/lib/api'
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
        <Avatar name={profile.name} image={profile.image} className="size-16 text-[16px]" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{profile.name}</h1>
          <p className="text-[12px] text-muted-foreground">
            Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · {builds.length} build{builds.length === 1 ? '' : 's'} · {threads.length} thread
            {threads.length === 1 ? '' : 's'} · {postCount} repl{postCount === 1 ? 'y' : 'ies'}
          </p>
          {profile.bio && <p className="mt-1 max-w-prose text-[13px] whitespace-pre-wrap">{profile.bio}</p>}
        </div>
        {me && (
          <Link to="/settings" className="text-[12px]">
            Edit profile
          </Link>
        )}
      </div>

      <section>
        <h2 className="mb-2 border-b border-border pb-1 text-[15px] font-semibold">Builds</h2>
        {builds.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <h2 className="mb-2 border-b border-border pb-1 text-[15px] font-semibold">Threads</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
            {threads.map((t) => (
              <li key={t.id} className="flex items-center gap-2 px-2 py-1.5 text-[13px]">
                <CategoryChip id={t.category} />
                <Link to={`/forum/${t.id}`} className="min-w-0 flex-1 truncate hover:underline">
                  {t.title}
                </Link>
                <span className="text-[12px] text-muted-foreground">{timeAgo(t.createdAt)}</span>
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
      await unwrap(client.api.me.patch({ name: curName, bio: curBio }))
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
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1 text-[13px]">
              <span className="font-semibold">Display name</span>
              <Input value={curName} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={40} required />
            </label>
            <label className="grid gap-1 text-[13px]">
              <span className="font-semibold">Bio</span>
              <Textarea value={curBio} onChange={(e) => setBio(e.target.value)} maxLength={300} placeholder="A line about you" />
            </label>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy}>
                Save
              </Button>
              {msg && <span className="text-[12px] text-muted-foreground">{msg}</span>}
              <span className="ml-auto text-[12px] text-muted-foreground">{user.email}</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
