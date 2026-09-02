import { Link } from 'react-router'
import { categoryLabel } from '@/lib/forum'
import { cn } from '@/lib/utils'

/** Plain "[Category]" link. */
export function CategoryChip({ id, link = true, className }: { id: string; link?: boolean; className?: string }) {
  const cls = cn('text-[11px] whitespace-nowrap', className)
  return link ? (
    <Link to={`/forum?category=${id}`} className={cls}>
      [{categoryLabel(id)}]
    </Link>
  ) : (
    <span className={cn(cls, 'text-muted-foreground')}>[{categoryLabel(id)}]</span>
  )
}
