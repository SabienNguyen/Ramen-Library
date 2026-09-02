import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, BookmarkPlus, Check, CircleAlert, Eraser, Flame, Info, Link2, Shuffle } from 'lucide-react'
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
        tone === 'ok' && 'border-scallion/40 bg-scallion/10 text-scallion',
        tone === 'warn' && 'border-accent/40 bg-accent/10 text-accent',
        tone === 'error' && 'border-destructive/50 bg-destructive/10 text-[oklch(0.8_0.14_25)]',
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
  const bodyTone = totals.bodyLoad > totals.bodyCapacity ? 'bg-destructive' : bodyPct > 85 ? 'bg-accent' : 'bg-scallion'

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardDescription className="font-mono text-[11px] tracking-widest uppercase">Build</CardDescription>
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
          <p className="mt-1 text-[11px] text-muted-foreground">How much topping weight the broth can carry. Think wattage.</p>
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
                    i.level === 'warn' && 'border-accent/30 bg-accent/10',
                    i.level === 'note' && 'border-border bg-secondary/40 text-muted-foreground',
                  )}
                >
                  {i.level === 'error' ? <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" /> : i.level === 'warn' ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-accent" /> : <Info className="mt-0.5 size-3.5 shrink-0" />}
                  <span>{i.message}</span>
                </motion.li>
              ))}
            </AnimatePresence>
            {issues.length === 0 && <li className="text-xs text-muted-foreground italic">Clean build. Nothing to flag.</li>}
          </ul>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="flex-1" disabled={totals.partCount === 0}>
                  {flash === 'saved' ? <Check /> : <BookmarkPlus />}
                  {flash === 'saved' ? 'Saved' : 'Save build'}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Name this build</DialogTitle>
                <DialogDescription>It goes into your library exactly as it is now.</DialogDescription>
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
            <TooltipContent>Omakase — random build</TooltipContent>
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
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, big, warn }: { label: string; value: string; big?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('font-mono tabular-nums', big ? 'text-xl' : 'text-sm', warn && 'text-accent')}>{value}</div>
    </div>
  )
}
