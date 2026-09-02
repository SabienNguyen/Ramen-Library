import { Link } from 'react-router'
import { categoryLabel, categoryStyle } from '@/lib/forum'
import { cn } from '@/lib/utils'

export function CategoryChip({ id, link = true, className }: { id: string; link?: boolean; className?: string }) {
  const style = categoryStyle[id] ?? categoryStyle.general
  const cls = cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', style.chip, className)
  const inner = (
    <>
      <span className={cn('size-1.5 rounded-full', style.dot)} />
      {categoryLabel(id)}
    </>
  )
  return link ? (
    <Link to={`/forum?category=${id}`} className={cn(cls, 'hover:brightness-95')}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  )
}
