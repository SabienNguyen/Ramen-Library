import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookmarkPlus, Check, Eraser, Flame, Shuffle } from 'lucide-react'
import { byId } from '@/data/ingredients'
import { bowlName } from '@/lib/naming'
import { cn } from '@/lib/utils'
import { useBowlStore } from '@/store/bowl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function RecipePanel({ className }: { className?: string }) {
  const bowl = useBowlStore((s) => s.bowl)
  const { setSpice, setRichness, randomize, reset, save, clearToppings } = useBowlStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const broth = byId.broth[bowl.brothId]
  const tare = byId.tare[bowl.tareId]
  const noodle = byId.noodle[bowl.noodleId]
  const oil = byId.oil[bowl.oilId]
  const suggested = bowlName(bowl)

  const toppingCounts = bowl.toppings.reduce<Record<string, number>>((acc, t) => ((acc[t.toppingId] = (acc[t.toppingId] ?? 0) + 1), acc), {})

  function onSave() {
    save(name || suggested)
    setOpen(false)
    setName('')
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1600)
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardDescription className="font-mono text-[11px] tracking-widest uppercase">Current bowl</CardDescription>
        <AnimatePresence mode="wait">
          <motion.div key={suggested} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <CardTitle className="text-3xl">{suggested}</CardTitle>
          </motion.div>
        </AnimatePresence>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <Row label="Broth" value={`${broth.name} ${broth.jp}`} />
          <Row label="Tare" value={`${tare.name} ${tare.jp}`} />
          <Row label="Noodles" value={noodle.name} />
          <Row label="Oil" value={oil.name} />
        </dl>

        <div>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">Toppings</div>
          <div className="flex min-h-7 flex-wrap gap-1.5">
            <AnimatePresence>
              {Object.entries(toppingCounts).map(([id, n]) => (
                <motion.span key={id} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                  <Badge variant="secondary">
                    {byId.topping[id].name}
                    {n > 1 && <span className="text-muted-foreground">×{n}</span>}
                  </Badge>
                </motion.span>
              ))}
            </AnimatePresence>
            {bowl.toppings.length === 0 && <span className="text-xs text-muted-foreground italic">Naked. Add something from the Toppings tab.</span>}
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Spice</span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <Flame key={i} className={cn('size-3.5 transition-colors', i < bowl.spice ? 'fill-primary text-primary' : 'text-muted-foreground/40')} />
                ))}
              </span>
            </div>
            <Slider label="Spice level" min={0} max={3} step={1} value={bowl.spice} onValueChange={(v) => setSpice(v as number)} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Richness</span>
              <span className="font-mono tabular-nums text-muted-foreground">{bowl.richness}</span>
            </div>
            <Slider label="Richness" min={0} max={100} step={5} value={bowl.richness} onValueChange={(v) => setRichness(v as number)} />
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="flex-1">
                  {justSaved ? <Check /> : <BookmarkPlus />}
                  {justSaved ? 'Saved' : 'Save to library'}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Name this bowl</DialogTitle>
                <DialogDescription>It goes into your library with everything exactly as it is now.</DialogDescription>
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
            <TooltipTrigger render={<Button variant="secondary" size="icon" onClick={randomize} aria-label="Randomize bowl" />}>
              <Shuffle />
            </TooltipTrigger>
            <TooltipContent>Omakase — surprise me</TooltipContent>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </>
  )
}
