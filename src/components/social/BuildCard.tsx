import { Link } from 'react-router'
import { Heart, MessageCircle } from 'lucide-react'
import { byId } from '@/data/ingredients'
import { timeAgo, type BuildItem } from '@/lib/api'
import { computeTotals, fmtPrice } from '@/lib/totals'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'

export function BuildCard({ build, className }: { build: BuildItem; className?: string }) {
  const totals = computeTotals(build.bowl)
  const partLine = [build.bowl.tareId && byId.tare[build.bowl.tareId]?.name, build.bowl.brothId && byId.broth[build.bowl.brothId]?.name, build.bowl.noodleId && byId.noodle[build.bowl.noodleId]?.name]
    .filter(Boolean)
    .join(' · ')
  return (
    <Card className={cn('group overflow-hidden transition-colors hover:border-primary/40', className)}>
      <Link to={`/builds/${build.id}`} className="block">
        <div className="grain bg-gradient-to-b from-secondary/40 to-transparent p-3">
          <BowlCanvas bowl={build.bowl} className="mx-auto max-w-44 transition-transform duration-300 group-hover:scale-[1.03]" />
        </div>
        <div className="px-4 pt-3 pb-2">
          <h3 className="truncate font-serif text-xl leading-tight">{build.name}</h3>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{partLine || 'Empty build'}</p>
        </div>
      </Link>
      <div className="grid gap-1.5 px-4 pb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Link to={`/u/${build.author.id}`} className="flex min-w-0 items-center gap-1.5 hover:text-foreground">
            <Avatar name={build.author.name} image={build.author.image} className="size-5 text-[9px]" />
            <span className="truncate">{build.author.name}</span>
          </Link>
          <span className="shrink-0 whitespace-nowrap">· {timeAgo(build.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3 font-mono tabular-nums">
          <span className="text-foreground">{fmtPrice(totals.price)}</span>
          <span className={cn('flex items-center gap-1', build.likedByMe && 'text-primary')}>
            <Heart className={cn('size-3.5', build.likedByMe && 'fill-primary')} /> {build.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {build.commentCount}
          </span>
        </div>
      </div>
    </Card>
  )
}
