import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { catalogue, slotMeta, tagLabel, type PartBase, type Slot, type Tag } from '../../../shared/ingredients'
import { fmtMinutes, fmtPrice } from '@/lib/totals'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PartSwatch } from './PartSwatch'

type SortKey = 'name' | 'price' | 'minutes' | 'kcal' | 'sodium'
const DIET_FILTERS: { id: 'all' | 'vegetarian' | 'vegan'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
]

export function PartPickerDialog({
  slot,
  open,
  onOpenChange,
  currentId,
  onPick,
}: {
  slot: Slot
  open: boolean
  onOpenChange: (open: boolean) => void
  currentId?: string | null
  onPick: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [diet, setDiet] = useState<'all' | 'vegetarian' | 'vegan'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'price', dir: 1 })

  const parts = catalogue[slot] as readonly PartBase[]
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return parts
      .filter((p) => !q || `${p.name} ${p.jp ?? ''} ${p.note}`.toLowerCase().includes(q))
      .filter((p) => diet === 'all' || p.tags.includes('vegan') || (diet === 'vegetarian' && p.tags.includes('vegetarian')))
      .sort((a, b) => {
        const va = a[sort.key]
        const vb = b[sort.key]
        const c = typeof va === 'string' && typeof vb === 'string' ? va.localeCompare(vb) : Number(va) - Number(vb)
        return c * sort.dir
      })
  }, [parts, query, diet, sort])

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' ? 1 : 1 }))
  const meta = slotMeta[slot]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-2 p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>
            Choose {meta.multiple ? 'a topping' : slot === 'noodle' ? 'noodles' : slot === 'oil' ? 'an aroma oil' : `a ${meta.label.toLowerCase()}`}{' '}
            
          </DialogTitle>
          <DialogDescription>{meta.blurb}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 px-5">
          <div className="relative min-w-40 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus placeholder="Search parts…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
          <div className="flex text-[12px]">
            {DIET_FILTERS.map((d, i) => (
              <span key={d.id} className="flex items-center">
                {i > 0 && <span className="px-1 text-muted-foreground">|</span>}
                <button type="button" onClick={() => setDiet(d.id)} className={cn(diet === d.id ? 'font-semibold text-foreground' : 'text-link hover:underline')}>
                  {d.label}
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto border-t border-border">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10 bg-muted text-[12px] text-muted-foreground">
              <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-2 [&>th]:py-1 [&>th]:font-semibold">
                <th className="text-left">
                  <SortButton label="Part" active={sort.key === 'name'} dir={sort.dir} onClick={() => toggleSort('name')} />
                </th>
                <th className="hidden text-left sm:table-cell">Tags</th>
                <th className="text-right">
                  <SortButton label="kcal" active={sort.key === 'kcal'} dir={sort.dir} onClick={() => toggleSort('kcal')} align="right" />
                </th>
                <th className="hidden text-right md:table-cell">
                  <SortButton label="Sodium" active={sort.key === 'sodium'} dir={sort.dir} onClick={() => toggleSort('sodium')} align="right" />
                </th>
                <th className="text-right">
                  <SortButton label="Time" active={sort.key === 'minutes'} dir={sort.dir} onClick={() => toggleSort('minutes')} align="right" />
                </th>
                <th className="text-right">
                  <SortButton label="Price" active={sort.key === 'price'} dir={sort.dir} onClick={() => toggleSort('price')} align="right" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const selected = currentId === p.id
                return (
                  <tr
                    key={p.id}
                    className={cn('border-t border-border hover:bg-muted [&>td]:px-3 [&>td]:py-2', selected && 'bg-accent/50')}
                    onDoubleClick={() => onPick(p.id)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <PartSwatch slot={slot} part={p} className="size-9 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold">{p.name}</span>
                            {p.jp && <span className="text-[11px] text-muted-foreground">{p.jp}</span>}
                          </div>
                          <p className="line-clamp-1 max-w-72 text-[12px] text-muted-foreground">{p.note}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <TagBadge key={t} tag={t} />
                        ))}
                      </div>
                    </td>
                    <td className="text-right tabular-nums whitespace-nowrap">{p.kcal}</td>
                    <td className="hidden text-right tabular-nums whitespace-nowrap md:table-cell">{p.sodium}</td>
                    <td className="text-right tabular-nums whitespace-nowrap">{fmtMinutes(p.minutes)}</td>
                    <td className="text-right tabular-nums whitespace-nowrap">{fmtPrice(p.price)}</td>
                    <td className="text-right">
                      <Button size="sm" variant={selected ? 'secondary' : 'default'} onClick={() => onPick(p.id)}>
                        {meta.multiple ? 'Add' : selected ? 'Selected' : 'Select'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Nothing matches. Loosen the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SortButton({ label, active, dir, onClick, align = 'left' }: { label: string; active: boolean; dir: 1 | -1; onClick: () => void; align?: 'left' | 'right' }) {
  const Icon = active ? (dir === 1 ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'font-semibold text-foreground', align === 'right' && 'flex-row-reverse')}>
      {label}
      <Icon className="size-3" />
    </button>
  )
}

export function TagBadge({ tag }: { tag: Tag }) {
  const variant = tag === 'vegan' || tag === 'vegetarian' ? 'scallion' : tag === 'spicy' ? 'default' : 'outline'
  return (
    <Badge variant={variant}>
      {tagLabel[tag]}
    </Badge>
  )
}
