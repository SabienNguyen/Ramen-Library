import { cn } from '@/lib/utils'

/** Initials avatar with a hue derived from the name, so the same person is always the same colour. */
export function Avatar({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return image ? (
    <img src={image} alt="" className={cn('size-8 shrink-0 rounded-full object-cover', className)} />
  ) : (
    <span
      aria-hidden
      className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white', className)}
      style={{ background: `oklch(0.55 0.13 ${h})` }}
    >
      {initials || '?'}
    </span>
  )
}
