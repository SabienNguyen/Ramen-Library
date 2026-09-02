import { Link } from 'react-router'
import { categoryLabel } from '@/lib/forum'
import { cn } from '@/lib/utils'

/** Small neutral pill. */
export function CategoryChip({ id, link = true, className }: { id: string; link?: boolean; className?: string }) {
  const cls = cn('inline-flex items-center rounded border border-border bg-secondary px-1.5 text-[11px] font-medium leading-[18px] whitespace-nowrap text-muted-foreground', className)
  return link ? (
    <Link to={`/forum?category=${id}`} className={cn(cls, 'hover:border-input hover:text-foreground hover:no-underline')}>
      {categoryLabel(id)}
    </Link>
  ) : (
    <span className={cls}>{categoryLabel(id)}</span>
  )
}
