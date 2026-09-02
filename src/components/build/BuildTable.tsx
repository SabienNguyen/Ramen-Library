import { useState } from 'react'
import { Plus, RefreshCw, X } from 'lucide-react'
import { byId, slotMeta, type PartBase, type Slot } from '@/data/ingredients'
import type { Issue } from '@/lib/compat'
import { fmtMinutes, fmtPrice } from '@/lib/totals'
import { cn } from '@/lib/utils'
import { MAX_TOPPINGS, slotKey, useBowlStore } from '@/store/bowl'
import { Button } from '@/components/ui/button'
import { PartPickerDialog, TagBadge } from './PartPickerDialog'
import { PartSwatch } from './PartSwatch'

const SINGLE_SLOTS = ['broth', 'tare', 'noodle', 'oil'] as const

/** The build sheet: one row per slot, PCPartPicker style. */
export function BuildTable({ issues, className }: { issues: Issue[]; className?: string }) {
  const bowl = useBowlStore((s) => s.bowl)
  const { setPart, addTopping, removeTopping } = useBowlStore()
  const [picker, setPicker] = useState<Slot | null>(null)

  const flag = (slot: Slot): Issue['level'] | null => {
    const hits = issues.filter((i) => i.slots.includes(slot) && i.level !== 'note')
    if (hits.some((i) => i.level === 'error')) return 'error'
    if (hits.length) return 'warn'
    return null
  }

  return (
    <div className={cn('border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[12px]">
          <thead className="bg-secondary text-[11px]">
            <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-2 [&>th]:py-1 [&>th]:text-left [&>th]:font-bold">
              <th className="w-36">Component</th>
              <th>Selection</th>
              <th className="w-16 text-right!">kcal</th>
              <th className="hidden w-20 text-right! md:table-cell">Sodium</th>
              <th className="w-20 text-right!">Time</th>
              <th className="w-20 text-right!">Price</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {SINGLE_SLOTS.map((slot) => {
              const id = bowl[slotKey[slot]] as string | null
              const part = id ? (byId[slot][id] as PartBase) : null
              return (
                <Row key={slot} slot={slot} flag={flag(slot)} part={part} onChoose={() => setPicker(slot)} onRemove={part ? () => setPart(slot, null) : undefined} />
              )
            })}

            {bowl.toppings.map((t, i) => (
                <Row
                  key={t.key}
                  slot="topping"
                  label={i === 0 ? undefined : ''}
                  flag={flag('topping')}
                  part={byId.topping[t.toppingId]}
                  onChoose={() => setPicker('topping')}
                  onRemove={() => removeTopping(t.key)}
                />
              ))}

            <tr className="border-t border-border/60">
              <td className="px-2 py-1.5 align-top">
                {bowl.toppings.length === 0 && <SlotLabel slot="topping" />}
              </td>
              <td colSpan={6} className="px-2 py-1.5">
                <Button variant="outline" size="sm" onClick={() => setPicker('topping')} disabled={bowl.toppings.length >= MAX_TOPPINGS}>
                  <Plus /> {bowl.toppings.length ? 'Add another topping' : 'Choose toppings'}
                </Button>
                {bowl.toppings.length >= MAX_TOPPINGS && <span className="ml-3 text-xs text-muted-foreground">Maximum reached.</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {picker && (
        <PartPickerDialog
          slot={picker}
          open
          onOpenChange={(o) => !o && setPicker(null)}
          currentId={picker === 'topping' ? null : (bowl[slotKey[picker]] as string | null)}
          onPick={(id) => {
            if (picker === 'topping') addTopping(id)
            else {
              setPart(picker, id)
              setPicker(null)
            }
          }}
        />
      )}
    </div>
  )
}

function SlotLabel({ slot }: { slot: Slot }) {
  const meta = slotMeta[slot]
  return (
    <div>
      <div className="font-medium">
        {meta.label}
        {meta.required && <span className="ml-1 text-primary" title="Required">*</span>}
      </div>
      <div className="text-[10px] text-muted-foreground">{meta.jp}</div>
    </div>
  )
}

function Row({
  slot,
  label,
  flag,
  part,
  onChoose,
  onRemove,
}: {
  slot: Slot
  label?: string
  flag: Issue['level'] | null
  part: PartBase | null
  onChoose: () => void
  onRemove?: () => void
}) {
  return (
    <tr
      className={cn(
        'border-t border-border/60 border-l-2 border-l-transparent',
        flag === 'error' && 'border-l-destructive bg-[#fdecea]',
        flag === 'warn' && 'border-l-[#d6c87a] bg-accent',
      )}
    >
      <td className="px-2 py-1.5 align-top">{label === '' ? null : <SlotLabel slot={slot} />}</td>
      {part ? (
        <>
          <td className="px-2 py-1.5">
            <div className="flex items-center gap-3">
              <PartSwatch slot={slot} part={part} className="size-9 shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-bold">{part.name}</span>
                  {part.jp && <span className="text-[10px] text-muted-foreground">{part.jp}</span>}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {part.tags.map((t) => (
                    <TagBadge key={t} tag={t} />
                  ))}
                </div>
              </div>
            </div>
          </td>
          <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{part.kcal}</td>
          <td className="hidden px-2 py-1.5 text-right tabular-nums whitespace-nowrap md:table-cell">{part.sodium}</td>
          <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{fmtMinutes(part.minutes)}</td>
          <td className="px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{fmtPrice(part.price)}</td>
          <td className="px-1 py-1.5">
            <div className="flex justify-end gap-1">
              {slot !== 'topping' && (
                <Button size="icon-sm" variant="ghost" aria-label={`Swap ${slotMeta[slot].label}`} onClick={onChoose} className="text-muted-foreground">
                  <RefreshCw />
                </Button>
              )}
              {onRemove && (
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${part.name}`} onClick={onRemove} className="text-muted-foreground hover:text-destructive">
                  <X />
                </Button>
              )}
            </div>
          </td>
        </>
      ) : (
        <td colSpan={6} className="px-2 py-1.5">
          <Button variant="outline" size="sm" onClick={onChoose}>
            <Plus /> Choose {slot === 'oil' ? 'an aroma oil' : slot === 'noodle' ? 'noodles' : `a ${slotMeta[slot].label.toLowerCase()}`}
          </Button>
          {!slotMeta[slot].required && <span className="ml-3 text-xs text-muted-foreground">Optional</span>}
        </td>
      )}
    </tr>
  )
}
