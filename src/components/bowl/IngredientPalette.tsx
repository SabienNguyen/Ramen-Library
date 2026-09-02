import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { broths, noodles, oils, tares, toppings } from '@/data/ingredients'
import { cn } from '@/lib/utils'
import { useBowlStore } from '@/store/bowl'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToppingGlyph } from './ToppingGlyph'

export function IngredientPalette({ className }: { className?: string }) {
  const bowl = useBowlStore((s) => s.bowl)
  const { setBroth, setTare, setNoodle, setOil, addTopping } = useBowlStore()
  const counts = bowl.toppings.reduce<Record<string, number>>((acc, t) => ((acc[t.toppingId] = (acc[t.toppingId] ?? 0) + 1), acc), {})

  return (
    <Tabs defaultValue="broth" className={cn('min-h-0', className)}>
      <TabsList className="w-full [&>[data-slot=tabs-trigger]]:flex-1 [&>[data-slot=tabs-trigger]]:px-2">
        <TabsTrigger value="broth">Broth</TabsTrigger>
        <TabsTrigger value="tare">Tare</TabsTrigger>
        <TabsTrigger value="noodle">Noodles</TabsTrigger>
        <TabsTrigger value="topping">Toppings</TabsTrigger>
        <TabsTrigger value="oil">Oil</TabsTrigger>
      </TabsList>

      <TabsContent value="broth">
        <Grid>
          {broths.map((b) => (
            <Option
              key={b.id}
              selected={bowl.brothId === b.id}
              onClick={() => setBroth(b.id)}
              swatch={<Swatch color={b.color} deep={b.deep} opacity={b.opacity} />}
              title={b.name}
              jp={b.jp}
              note={b.note}
            />
          ))}
        </Grid>
      </TabsContent>

      <TabsContent value="tare">
        <Grid>
          {tares.map((t) => (
            <Option
              key={t.id}
              selected={bowl.tareId === t.id}
              onClick={() => setTare(t.id)}
              swatch={<Swatch color={t.tint} deep={t.tint} opacity={0.35 + t.tintStrength} />}
              title={t.name}
              jp={t.jp}
              note={t.note}
            />
          ))}
        </Grid>
      </TabsContent>

      <TabsContent value="noodle">
        <Grid>
          {noodles.map((n) => (
            <Option
              key={n.id}
              selected={bowl.noodleId === n.id}
              onClick={() => setNoodle(n.id)}
              swatch={<NoodleSwatch color={n.color} width={n.width} wave={n.wave} />}
              title={n.name}
              note={n.note}
            />
          ))}
        </Grid>
      </TabsContent>

      <TabsContent value="topping">
        <p className="mb-2 text-xs text-muted-foreground">Tap to drop into the bowl. Drag to arrange, tap a topping in the bowl to remove it.</p>
        <Grid>
          {toppings.map((t) => (
            <Option
              key={t.id}
              selected={!!counts[t.id]}
              onClick={() => addTopping(t.id)}
              swatch={<ToppingGlyph glyph={t.glyph} className="size-10" />}
              title={t.name}
              jp={t.jp}
              note={t.note}
              trailing={
                counts[t.id] ? (
                  <Badge variant="accent" className="tabular-nums">
                    ×{counts[t.id]}
                  </Badge>
                ) : (
                  <Plus className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )
              }
            />
          ))}
        </Grid>
      </TabsContent>

      <TabsContent value="oil">
        <Grid>
          {oils.map((o) => (
            <Option
              key={o.id}
              selected={bowl.oilId === o.id}
              onClick={() => setOil(o.id)}
              swatch={<Swatch color={o.color} deep={o.color} opacity={o.drops ? 0.9 : 0} />}
              title={o.name}
              jp={o.jp}
              note={o.note}
            />
          ))}
        </Grid>
      </TabsContent>
    </Tabs>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2">{children}</div>
}

function Option({
  selected,
  onClick,
  swatch,
  title,
  jp,
  note,
  trailing,
}: {
  selected: boolean
  onClick: () => void
  swatch: React.ReactNode
  title: string
  jp?: string
  note: string
  trailing?: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        selected ? 'border-primary/60 bg-primary/10' : 'border-border bg-card/60 hover:border-border hover:bg-secondary/60',
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-background/60 ring-1 ring-white/5">{swatch}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{title}</span>
          {jp && <span className="font-serif text-xs text-muted-foreground">{jp}</span>}
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{note}</p>
      </div>
      {trailing}
    </motion.button>
  )
}

function Swatch({ color, deep, opacity }: { color: string; deep: string; opacity: number }) {
  return (
    <div className="relative size-8 overflow-hidden rounded-full bg-[#3a2a1d] ring-1 ring-white/10">
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 35% 30%, ${color}, ${deep})`, opacity }} />
    </div>
  )
}

function NoodleSwatch({ color, width, wave }: { color: string; width: number; wave: number }) {
  const amp = 2 + wave * 6
  const d = `M 2 16 Q 10 ${16 - amp} 18 16 T 34 16`
  return (
    <svg viewBox="0 0 36 32" className="size-9">
      <path d={d} fill="none" stroke={color} strokeWidth={width * 0.8} strokeLinecap="round" />
      <path d={d} transform="translate(0 9)" fill="none" stroke={color} strokeWidth={width * 0.8} strokeLinecap="round" opacity=".7" />
      <path d={d} transform="translate(0 -9)" fill="none" stroke={color} strokeWidth={width * 0.8} strokeLinecap="round" opacity=".7" />
    </svg>
  )
}
