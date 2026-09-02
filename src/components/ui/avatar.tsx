import { cn } from '@/lib/utils'

/** Square initials avatar, forum style. */
export function Avatar({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return image ? (
    <img src={image} alt="" className={cn('size-8 shrink-0 border border-border object-cover', className)} />
  ) : (
    <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center border border-border bg-secondary text-[11px] font-bold text-muted-foreground', className)}>
      {initials || '?'}
    </span>
  )
}
