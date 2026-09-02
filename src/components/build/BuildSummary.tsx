import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, BookmarkPlus, Check, CircleAlert, Eraser, Flame, Info, Link2, Shuffle, Upload } from 'lucide-react'
import { api, uploadPhoto } from '@/lib/api'
import { CoverPicker, defaultCover, type CoverChoice } from './CoverPicker'
import { authClient } from '@/lib/auth-client'
import type { Issue } from '@/lib/compat'
import { bowlName } from '@/lib/naming'
import { shareUrl } from '@/lib/share'
import { fmtMinutes, fmtPrice, type Totals } from '@/lib/totals'
import { cn } from '@/lib/utils'
import { useBowlStore } from '@/store/bowl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** PCPartPicker's green/yellow/red bar. */
export function CompatBar({ issues, className }: { issues: Issue[]; className?: string }) {
  const errors = issues.filter((i) => i.level === 'error').length
  const warns = issues.filter((i) => i.level === 'warn').length
  const tone = errors ? 'error' : warns ? 'warn' : 'ok'
  const text = errors
    ? `${errors} incompatibilit${errors === 1 ? 'y' : 'ies'}${warns ? ` and ${warns} potential issue${warns === 1 ? '' : 's'}` : ''} found.`
    : warns
      ? `${warns} potential issue${warns === 1 ? '' : 's'} found.`
      : 'No issues or incompatibilities found.'
  const Icon = tone === 'error' ? CircleAlert : tone === 'warn' ? AlertTriangle : Check
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        tone === 'ok' && 'border-scallion/30 bg-scallion/10 text-scallion',
        tone === 'warn' && 'border-accent bg-accent/40 text-accent-foreground',
        tone === 'error' && 'border-destructive/40 bg-destructive/10 text-destructive',
        className,
      )}
      role="status"
    >
      <Icon className="size-4 shrink-0" />
      <span>
        <span className="font-medium">Compatibility:</span> {text}
      </span>
    </div>
  )
}

export function BuildSummary({ totals, issues, className }: { totals: Totals; issues: Issue[]; className?: string }) {
  const bowl = useBowlStore((s) => s.bowl)
  const { save, randomize, reset, clearToppings } = useBowlStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [flash, setFlash] = useState<'saved' | 'copied' | null>(null)
  const suggested = bowlName(bowl)
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const [pubOpen, setPubOpen] = useState(false)
  const [pubName, setPubName] = useState('')
  const [pubDesc, setPubDesc] = useState('')
  const [pubBusy, setPubBusy] = useState(false)
  const [pubError, setPubError] = useState<string | null>(null)
  const [cover, setCover] = useState<CoverChoice>(() => defaultCover())

  async function onPublish(e: React.FormEvent) {
    e.preventDefault()
    setPubBusy(true)
    setPubError(null)
    try {
      let imageUrl = cover.imageUrl
      let thumbUrl = cover.thumbUrl
      if (cover.file) ({ imageUrl, thumbUrl } = await uploadPhoto(cover.file))
      const { id } = await api<{ id: string }>('/builds', {
        method: 'POST',
        json: { name: pubName || suggested, description: pubDesc, bowl, imageUrl, thumbUrl, templateId: imageUrl ? null : cover.templateId },
      })
      setPubOpen(false)
      navigate(`/builds/${id}`)
    } catch (err) {
      setPubError(err instanceof Error ? err.message : 'Publish failed.')
      setPubBusy(false)
    }
  }

  const ping = (what: 'saved' | 'copied') => {
    setFlash(what)
    setTimeout(() => setFlash(null), 1600)
  }

  function onSave() {
    save(name || suggested)
    setOpen(false)
    setName('')
    ping('saved')
  }

  async function onShare() {
    const url = shareUrl(bowl)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this link', url)
    }
    history.replaceState(null, '', url)
    ping('copied')
  }

  const bodyPct = totals.bodyCapacity ? Math.min(100, (totals.bodyLoad / totals.bodyCapacity) * 100) : 0
  const bodyTone = totals.bodyLoad > totals.bodyCapacity ? 'bg-destructive' : bodyPct > 85 ? 'bg-[oklch(0.78_0.15_85)]' : 'bg-scallion'

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardDescription className="text-xs font-semibold">Summary</CardDescription>
        <AnimatePresence mode="wait">
          <motion.div key={suggested} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <CardTitle className="text-3xl">{suggested}</CardTitle>
          </motion.div>
        </AnimatePresence>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant={totals.diet === 'omnivore' ? 'outline' : 'scallion'}>{totals.diet === 'vegan' ? 'Vegan' : totals.diet === 'vegetarian' ? 'Vegetarian' : 'Omnivore'}</Badge>
          <Badge variant="outline" className="gap-0.5">
            {[0, 1, 2].map((i) => (
              <Flame key={i} className={cn('size-3', i < totals.spice ? 'fill-primary text-primary' : 'text-muted-foreground/40')} />
            ))}
          </Badge>
          {!totals.complete && <Badge variant="secondary">Incomplete</Badge>}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Price" value={fmtPrice(totals.price)} big />
          <Stat label="Prep time" value={fmtMinutes(totals.minutes)} big />
          <Stat label="Calories" value={`${totals.kcal} kcal`} />
          <Stat label="Sodium" value={`${totals.sodium.toLocaleString()} mg`} warn={totals.sodium > 2300} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Broth body</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {totals.bodyLoad} / {totals.bodyCapacity}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className={cn('h-full rounded-full', bodyTone)} animate={{ width: `${bodyPct}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">How much topping weight the broth can carry.</p>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">Compatibility notes</div>
          <ul className="grid gap-1.5">
            <AnimatePresence initial={false}>
              {issues.map((i) => (
                <motion.li
                  key={i.message}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className={cn(
                    'flex gap-2 rounded-md border px-2.5 py-2 text-xs leading-snug',
                    i.level === 'error' && 'border-destructive/40 bg-destructive/10',
                    i.level === 'warn' && 'border-accent bg-accent/30',
                    i.level === 'note' && 'border-border bg-secondary/40 text-muted-foreground',
                  )}
                >
                  {i.level === 'error' ? <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" /> : i.level === 'warn' ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-accent-foreground" /> : <Info className="mt-0.5 size-3.5 shrink-0" />}
                  <span>{i.message}</span>
                </motion.li>
              ))}
            </AnimatePresence>
            {issues.length === 0 && <li className="text-xs text-muted-foreground">No issues.</li>}
          </ul>
        </div>

        <div className="mt-auto grid gap-2 pt-2">
          <Dialog open={pubOpen} onOpenChange={setPubOpen}>
            <DialogTrigger
              render={
                <Button
                  size="lg"
                  disabled={!totals.complete}
                  onClick={(e) => {
                    if (!session) {
                      e.preventDefault()
                      navigate('/login?next=/build')
                    }
                  }}
                >
                  <Upload /> Publish build
                </Button>
              }
            />
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Publish to the community</DialogTitle>
                <DialogDescription>Add a name, a photo or drawing, and an optional description.</DialogDescription>
              </DialogHeader>
              <form onSubmit={onPublish} className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
                <Input autoFocus placeholder={suggested} value={pubName} onChange={(e) => setPubName(e.target.value)} maxLength={60} />
                <CoverPicker bowl={bowl} name={pubName || suggested} value={cover} onChange={setCover} />
                <Textarea placeholder="Why this bowl? What would you change? (optional)" value={pubDesc} onChange={(e) => setPubDesc(e.target.value)} maxLength={2000} />
                {pubError && <p className="text-sm text-destructive">{pubError}</p>}
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
                  <Button type="submit" disabled={pubBusy}>
                    {pubBusy ? (cover.file ? 'Uploading…' : 'Publishing…') : 'Publish'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {!totals.complete && <p className="-mt-1 text-center text-[11px] text-muted-foreground">Broth, tare and noodles are required to publish.</p>}
          <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button variant="secondary" className="flex-1" disabled={totals.partCount === 0}>
                  {flash === 'saved' ? <Check /> : <BookmarkPlus />}
                  {flash === 'saved' ? 'Saved' : 'Save draft'}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save a draft</DialogTitle>
                <DialogDescription>Drafts are saved in this browser only.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onSave()
                }}
                className="grid gap-4"
              >
                <Input autoFocus placeholder={suggested} value={name} onChange={(e) => setName(e.target.value)} />
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Tooltip>
            <TooltipTrigger render={<Button variant="secondary" size="icon" onClick={onShare} aria-label="Copy share link" disabled={totals.partCount === 0} />}>
              {flash === 'copied' ? <Check /> : <Link2 />}
            </TooltipTrigger>
            <TooltipContent>{flash === 'copied' ? 'Link copied' : 'Copy permalink'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="secondary" size="icon" onClick={randomize} aria-label="Random build" />}>
              <Shuffle />
            </TooltipTrigger>
            <TooltipContent>Random build</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="secondary" size="icon" onClick={clearToppings} aria-label="Clear toppings" />}>
              <Eraser />
            </TooltipTrigger>
            <TooltipContent>Clear toppings</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
            Reset
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, big, warn }: { label: string; value: string; big?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/60 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('font-mono tabular-nums', big ? 'text-xl' : 'text-sm', warn && 'text-accent')}>{value}</div>
    </div>
  )
}
