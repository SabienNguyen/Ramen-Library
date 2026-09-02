import { AnimatePresence, motion } from 'motion/react'
import { ChefHat, Trash2 } from 'lucide-react'
import { byId } from '@/data/ingredients'
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
        <h3 className="font-serif text-2xl">Your library is empty</h3>
        <p className="max-w-sm text-sm text-muted-foreground">Build a bowl, hit “Save to library”, and it shows up here as a card you can reload or riff on.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {library.map((b, i) => {
          const toppingNames = [...new Set(b.toppings.map((t) => byId.topping[t.toppingId].name))]
          return (
            <motion.div key={b.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: i * 0.03 }}>
              <Card className="group overflow-hidden">
                <div className="grain bg-gradient-to-b from-secondary/40 to-transparent p-4">
                  <BowlCanvas bowl={b} className="mx-auto max-w-56" />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-serif text-2xl leading-tight">{b.name}</h3>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {byId.tare[b.tareId].name} · {byId.broth[b.brothId].name} · {byId.noodle[b.noodleId].name} ·{' '}
                    {new Date(b.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
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
                    Load into builder
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
