import { useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router'
import { AlertTriangle, Camera, CircleAlert, Flame, Hammer, Heart, Info, Link2, Trash2 } from 'lucide-react'
import { byId, slotMeta, type PartBase, type Slot } from '@/data/ingredients'
import { api, timeAgo, uploadPhoto, type BuildDetail } from '@/lib/api'
import { BuildCover } from '@/components/build/CoverArt'
import { CoverPicker, defaultCover, type CoverChoice } from '@/components/build/CoverPicker'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { authClient } from '@/lib/auth-client'
import { checkCompatibility } from '@/lib/compat'
import { computeTotals, fmtMinutes, fmtPrice } from '@/lib/totals'
import { cn } from '@/lib/utils'
import { useBowlStore } from '@/store/bowl'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'
import { TagBadge } from '@/components/build/PartPickerDialog'
import { PartSwatch } from '@/components/build/PartSwatch'
import { Discussion } from '@/components/social/Discussion'

export function BuildPage() {
  const { build } = useLoaderData() as { build: BuildDetail }
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const replace = useBowlStore((s) => s.replace)
  const totals = useMemo(() => computeTotals(build.bowl), [build.bowl])
  const issues = useMemo(() => checkCompatibility(build.bowl), [build.bowl])
  const [like, setLike] = useState({ liked: build.likedByMe, count: build.likeCount })
  const [copied, setCopied] = useState(false)
  const mine = session?.user.id === build.userId
  const [coverOpen, setCoverOpen] = useState(false)
  const [cover, setCover] = useState<CoverChoice>(() => defaultCover({ imageUrl: build.imageUrl, thumbUrl: build.thumbUrl, templateId: (build.templateId as CoverChoice['templateId']) ?? 'live' }))
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)

  async function saveCover(e: React.FormEvent) {
    e.preventDefault()
    setCoverBusy(true)
    setCoverError(null)
    try {
      let imageUrl = cover.imageUrl
      let thumbUrl = cover.thumbUrl
      if (cover.file) ({ imageUrl, thumbUrl } = await uploadPhoto(cover.file))
      await api(`/builds/${build.id}`, { method: 'PATCH', json: { imageUrl, thumbUrl, templateId: imageUrl ? null : cover.templateId } })
      setCoverOpen(false)
      revalidator.revalidate()
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setCoverBusy(false)
    }
  }

  async function toggleLike() {
    if (!session) return navigate(`/login?next=/builds/${build.id}`)
    const res = await api<{ liked: boolean; likeCount: number }>(`/builds/${build.id}/like`, { method: 'POST' })
    setLike({ liked: res.liked, count: res.likeCount })
    revalidator.revalidate()
  }

  async function remove() {
    if (!confirm('Delete this build? Comments go with it.')) return
    await api(`/builds/${build.id}`, { method: 'DELETE' })
    navigate('/builds')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const rows: { slot: Slot; part: PartBase }[] = []
  if (build.bowl.brothId) rows.push({ slot: 'broth', part: byId.broth[build.bowl.brothId] })
  if (build.bowl.tareId) rows.push({ slot: 'tare', part: byId.tare[build.bowl.tareId] })
  if (build.bowl.noodleId) rows.push({ slot: 'noodle', part: byId.noodle[build.bowl.noodleId] })
  if (build.bowl.oilId) rows.push({ slot: 'oil', part: byId.oil[build.bowl.oilId] })
  for (const t of build.bowl.toppings) rows.push({ slot: 'topping', part: byId.topping[t.toppingId] })

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
      <aside className="grid gap-4 lg:sticky lg:top-4">
        <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <BuildCover build={build} variant="full" />
          {mine && (
            <Dialog open={coverOpen} onOpenChange={setCoverOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" className="absolute right-2 bottom-2" />}>
                <Camera /> Change cover
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Cover picture</DialogTitle>
                  <DialogDescription>A photo of the real bowl, or one of the drawings.</DialogDescription>
                </DialogHeader>
                <form onSubmit={saveCover} className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                  <CoverPicker bowl={build.bowl} name={build.name} value={cover} onChange={setCover} />
                  {coverError && <p className="text-sm text-destructive">{coverError}</p>}
                  <DialogFooter>
                    <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
                    <Button type="submit" disabled={coverBusy}>
                      {coverBusy ? 'Saving…' : 'Save cover'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </section>
        {(build.imageUrl || (build.templateId && build.templateId !== 'live')) && (
          <section className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card">
            <BowlCanvas bowl={build.bowl} className="w-28 shrink-0" />
            <div className="text-[12px] text-muted-foreground">
              <div className="font-semibold text-foreground">Parts render</div>
              Generated from the parts list.
            </div>
          </section>
        )}
        <Card>
          <CardContent className="grid grid-cols-2 gap-2 p-2">
            <Stat label="Price" value={fmtPrice(totals.price)} />
            <Stat label="Prep time" value={fmtMinutes(totals.minutes)} />
            <Stat label="Calories" value={`${totals.kcal} kcal`} />
            <Stat label="Sodium" value={`${totals.sodium.toLocaleString()} mg`} />
            <div className="col-span-2 flex items-center gap-2 pt-1">
              <Badge variant={totals.diet === 'omnivore' ? 'outline' : 'scallion'}>{totals.diet === 'vegan' ? 'Vegan' : totals.diet === 'vegetarian' ? 'Vegetarian' : 'Omnivore'}</Badge>
              <Badge variant="outline" className="gap-0.5">
                {[0, 1, 2].map((i) => (
                  <Flame key={i} className={cn('size-3', i < totals.spice ? 'fill-primary text-primary' : 'text-muted-foreground/40')} />
                ))}
              </Badge>
              <span className="ml-auto text-[12px] text-muted-foreground">
                body {totals.bodyLoad}/{totals.bodyCapacity}
              </span>
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="grid gap-6">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">{build.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
                <Link to={`/u/${build.author.id}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Avatar name={build.author.name} image={build.author.image} className="size-6 text-[11px]" />
                  {build.author.name}
                </Link>
                <span>· {timeAgo(build.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={like.liked ? 'default' : 'outline'} onClick={toggleLike} aria-pressed={like.liked}>
                <Heart className={cn(like.liked && 'fill-current')} /> {like.count}
              </Button>
              <Button variant="outline" onClick={copyLink}>
                <Link2 /> {copied ? 'Copied' : 'Share'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  replace(structuredClone(build.bowl))
                  navigate('/build')
                }}
              >
                <Hammer /> Open in builder
              </Button>
              {mine && (
                <Button variant="ghost" onClick={remove} className="text-muted-foreground hover:text-destructive" aria-label="Delete build">
                  <Trash2 />
                </Button>
              )}
            </div>
          </div>
          {build.description && <p className="mt-3 max-w-prose text-[13px] leading-relaxed whitespace-pre-wrap">{build.description}</p>}
        </div>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <table className="w-full text-[13px]">
            <thead className="bg-muted text-[12px] text-muted-foreground">
              <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-2 [&>th]:py-1 [&>th]:text-left [&>th]:font-semibold">
                <th className="w-28">Component</th>
                <th>Part</th>
                <th className="text-right!">kcal</th>
                <th className="hidden text-right! md:table-cell">Time</th>
                <th className="text-right!">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ slot, part }, i) => (
                <tr key={`${slot}-${i}`} className="border-t border-border/60">
                  <td className="px-2 py-1.5 text-xs text-muted-foreground">{i > 0 && rows[i - 1].slot === slot ? '' : slotMeta[slot].label}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-3">
                      <PartSwatch slot={slot} part={part} className="size-8 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold">{part.name}</span>
                        {part.jp && <span className="ml-1 text-[11px] text-muted-foreground">{part.jp}</span>}
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {part.tags.map((t) => (
                            <TagBadge key={t} tag={t} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{part.kcal}</td>
                  <td className="hidden px-2 py-1.5 text-right tabular-nums whitespace-nowrap md:table-cell">{fmtMinutes(part.minutes)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtPrice(part.price)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    An empty bowl. Bold.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {issues.length > 0 && (
          <section>
            <h2 className="mb-1 text-[13px] font-semibold">Compatibility notes</h2>
            <ul className="grid gap-1.5">
              {issues.map((i) => (
                <li
                  key={i.message}
                  className={cn(
                    'flex gap-2 rounded-md border px-2.5 py-2 text-[12px] leading-snug',
                    i.level === 'error' && 'border-[#f0c4bf] bg-[#fdf2f1]',
                    i.level === 'warn' && 'border-[#efe0a8] bg-accent',
                    i.level === 'note' && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {i.level === 'error' ? <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" /> : i.level === 'warn' ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-accent-foreground" /> : <Info className="mt-0.5 size-3.5 shrink-0" />}
                  <span>{i.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-2 border-b border-border pb-1 text-[15px] font-semibold">Comments ({build.comments.length})</h2>
          <Discussion items={build.comments} postTo={`/builds/${build.id}/comments`} deletePath={(id) => `/comments/${id}`} placeholder="Write a comment" next={`/builds/${build.id}`} />
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-2.5 py-1.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[13px] tabular-nums">{value}</div>
    </div>
  )
}
