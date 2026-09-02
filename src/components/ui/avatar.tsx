import { cn } from '@/lib/utils'

/** Initials avatar, softly rounded, with a hue derived from the name. */
export function Avatar({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return image ? (
    <img src={image} alt="" className={cn('size-8 shrink-0 rounded-md object-cover', className)} />
  ) : (
    <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white', className)} style={{ background: `oklch(0.55 0.1 ${h})` }}>
      {initials || '?'}
    </span>
  )
}
