import { AnimatePresence, motion } from 'motion/react'
import { ChefHat, Trash2 } from 'lucide-react'
import { byId } from '@/data/ingredients'
import { checkCompatibility } from '@/lib/compat'
import { computeTotals, fmtMinutes, fmtPrice } from '@/lib/totals'
import { useBowlStore } from '@/store/bowl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'

export function LibraryGrid({ onLoad }: { onLoad: () => void }) {
  const library = useBowlStore((s) => s.library)
  const load = useBowlStore((s) => s.load)
  const remove = useBowlStore((s) => s.remove)

  if (library.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
          <ChefHat className="size-6 text-muted-foreground" />
        </div>
        <h3 className="font-serif text-2xl">No saved builds yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">Drafts you save from the build page appear here.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {library.map((b, i) => {
          const toppingNames = [...new Set(b.toppings.map((t) => byId.topping[t.toppingId].name))]
          const totals = computeTotals(b)
          const errors = checkCompatibility(b).filter((i) => i.level === 'error').length
          const partLine = [b.tareId && byId.tare[b.tareId].name, b.brothId && byId.broth[b.brothId].name, b.noodleId && byId.noodle[b.noodleId].name].filter(Boolean).join(' · ')
          return (
            <motion.div key={b.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: i * 0.03 }}>
              <Card className="group overflow-hidden">
                <div className="grain bg-[radial-gradient(ellipse_at_50%_35%,oklch(0.97_0.02_85),oklch(0.93_0.03_80))] p-4">
                  <BowlCanvas bowl={b} className="mx-auto max-w-56" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-serif text-2xl leading-tight">{b.name}</h3>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {partLine || 'Empty build'} · {new Date(b.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <div className="mt-2 flex items-center gap-3 font-mono text-xs tabular-nums">
                    <span>{fmtPrice(totals.price)}</span>
                    <span className="text-muted-foreground">{fmtMinutes(totals.minutes)}</span>
                    <span className="text-muted-foreground">{totals.kcal} kcal</span>
                    {errors > 0 && <Badge variant="default" className="ml-auto text-[10px]">{errors} issue{errors > 1 ? 's' : ''}</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {toppingNames.slice(0, 5).map((n) => (
                      <Badge key={n} variant="outline" className="text-[11px]">
                        {n}
                      </Badge>
                    ))}
                    {toppingNames.length > 5 && <Badge variant="outline">+{toppingNames.length - 5}</Badge>}
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      load(b.id)
                      onLoad()
                    }}
                  >
                    Load build
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`Delete ${b.name}`} onClick={() => remove(b.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
