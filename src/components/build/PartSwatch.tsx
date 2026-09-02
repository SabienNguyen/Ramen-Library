import type { AromaOil, Broth, Noodle, PartBase, Slot, Tare, Topping } from '@/data/ingredients'
import { cn } from '@/lib/utils'
import { ToppingGlyph } from '@/components/bowl/ToppingGlyph'

/** A little visual for a part: broth/tare/oil colour, noodle wave, or the topping glyph. */
export function PartSwatch({ slot, part, className }: { slot: Slot; part: PartBase; className?: string }) {
  if (slot === 'topping') return <ToppingGlyph glyph={(part as Topping).glyph} className={className} />
  if (slot === 'noodle') {
    const n = part as Noodle
    const amp = 2 + n.wave * 6
    const d = `M 2 16 Q 10 ${16 - amp} 18 16 T 34 16`
    return (
      <svg viewBox="0 0 36 32" className={className}>
        {[-9, 0, 9].map((dy) => (
          <path key={dy} d={d} transform={`translate(0 ${dy})`} fill="none" stroke={n.color} strokeWidth={n.width * 0.8} strokeLinecap="round" opacity={dy ? 0.7 : 1} />
        ))}
      </svg>
    )
  }
  const { color, deep, opacity } =
    slot === 'broth'
      ? { color: (part as Broth).color, deep: (part as Broth).deep, opacity: (part as Broth).opacity }
      : slot === 'tare'
        ? { color: (part as Tare).tint, deep: (part as Tare).tint, opacity: 0.35 + (part as Tare).tintStrength }
        : { color: (part as AromaOil).color, deep: (part as AromaOil).color, opacity: 0.9 }
  return (
    <div className={cn('relative overflow-hidden rounded-full bg-[#c9b596] ring-1 ring-black/10', className)}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 35% 30%, ${color}, ${deep})`, opacity }} />
    </div>
  )
}
