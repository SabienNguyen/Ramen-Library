import { Minus, Plus } from 'lucide-react'
import { formatAmount, type PartBase } from '../../../shared/ingredients'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/** Stepper for ml / g / pieces, three-way toggle for portion toppings. `undefined` = the part's default. */
export function AmountControl({ part, value, onChange }: { part: PartBase; value: number | undefined; onChange: (v: number | undefined) => void }) {
  const s = part.serving
  if (s.unit === 'portion') {
    const level = value ?? s.amount
    return (
      <div className="inline-flex rounded-md border border-border text-[11px]" role="radiogroup" aria-label={`${part.name} amount`}>
        {s.levels.map((label, i) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={level === i}
            onClick={() => onChange(i === s.amount ? undefined : i)}
            className={cn('px-2 py-0.5 first:rounded-l-md last:rounded-r-md', level === i ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }
  const n = value ?? s.amount
  const set = (next: number) => onChange(next === s.amount ? undefined : next)
  return (
    <div className="inline-flex items-center gap-0.5 whitespace-nowrap">
      <Button size="icon-sm" variant="ghost" aria-label={`Less ${part.name}`} disabled={n <= s.min} onClick={() => set(Math.max(s.min, n - s.step))}>
        <Minus />
      </Button>
      <span className="min-w-14 text-center tabular-nums">{formatAmount(part, n)}</span>
      <Button size="icon-sm" variant="ghost" aria-label={`More ${part.name}`} disabled={n >= s.max} onClick={() => set(Math.min(s.max, n + s.step))}>
        <Plus />
      </Button>
    </div>
  )
}
