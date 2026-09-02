import { useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router'
import { AlertTriangle, CircleAlert, Flame, Hammer, Heart, Info, Link2, Trash2 } from 'lucide-react'
import { byId, slotMeta, type PartBase, type Slot } from '@/data/ingredients'
import { api, timeAgo, type BuildDetail } from '@/lib/api'
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
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
      <aside className="grid gap-4 lg:sticky lg:top-20">
        <section className="grain rounded-2xl border border-border bg-card/40 p-4">
          <BowlCanvas bowl={build.bowl} />
        </section>
        <Card>
          <CardContent className="grid grid-cols-2 gap-3 p-4">
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
              <span className="ml-auto font-mono text-xs text-muted-foreground">
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
              <h1 className="font-serif text-4xl leading-none">{build.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Link to={`/u/${build.author.id}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Avatar name={build.author.name} image={build.author.image} className="size-6 text-[10px]" />
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
          {build.description && <p className="mt-4 max-w-prose text-sm leading-relaxed whitespace-pre-wrap">{build.description}</p>}
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
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
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{i > 0 && rows[i - 1].slot === slot ? '' : slotMeta[slot].label}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <PartSwatch slot={slot} part={part} className="size-8 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium">{part.name}</span>
                        {part.jp && <span className="ml-2 font-serif text-xs text-muted-foreground">{part.jp}</span>}
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {part.tags.map((t) => (
                            <TagBadge key={t} tag={t} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{part.kcal}</td>
                  <td className="hidden px-4 py-2.5 text-right font-mono tabular-nums whitespace-nowrap md:table-cell">{fmtMinutes(part.minutes)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{fmtPrice(part.price)}</td>
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
            <h2 className="mb-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Compatibility notes</h2>
            <ul className="grid gap-1.5">
              {issues.map((i) => (
                <li
                  key={i.message}
                  className={cn(
                    'flex gap-2 rounded-md border px-2.5 py-2 text-xs leading-snug',
                    i.level === 'error' && 'border-destructive/40 bg-destructive/10',
                    i.level === 'warn' && 'border-accent/30 bg-accent/10',
                    i.level === 'note' && 'border-border bg-secondary/40 text-muted-foreground',
                  )}
                >
                  {i.level === 'error' ? <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" /> : i.level === 'warn' ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-accent" /> : <Info className="mt-0.5 size-3.5 shrink-0" />}
                  <span>{i.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-serif text-2xl">
            Comments <span className="font-sans text-sm text-muted-foreground">{build.comments.length}</span>
          </h2>
          <Discussion items={build.comments} postTo={`/builds/${build.id}/comments`} deletePath={(id) => `/comments/${id}`} placeholder="Would you eat this? Say why." next={`/builds/${build.id}`} />
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-mono text-sm tabular-nums">{value}</div>
    </div>
  )
}
