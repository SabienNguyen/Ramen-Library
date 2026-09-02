import { Link } from 'react-router'
import { Heart, MessageCircle } from 'lucide-react'
import { byId } from '@/data/ingredients'
import { timeAgo, type BuildItem } from '@/lib/api'
import { computeTotals, fmtPrice } from '@/lib/totals'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { BuildCover } from '@/components/build/CoverArt'

export function BuildCard({ build, className }: { build: BuildItem; className?: string }) {
  const totals = computeTotals(build.bowl)
  const partLine = [build.bowl.tareId && byId.tare[build.bowl.tareId]?.name, build.bowl.brothId && byId.broth[build.bowl.brothId]?.name, build.bowl.noodleId && byId.noodle[build.bowl.noodleId]?.name]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card shadow-card transition-colors hover:border-input', className)}>
      <Link to={`/builds/${build.id}`} className="block border-b border-border">
        <BuildCover build={build} />
      </Link>
      <div className="px-3.5 py-3 text-[12px]">
        <Link to={`/builds/${build.id}`} className="block truncate text-sm font-semibold text-foreground">
          {build.name}
        </Link>
        <div className="truncate text-muted-foreground">{partLine || 'Empty build'}</div>
        <div className="mt-2.5 flex items-center gap-2 text-muted-foreground">
          <Link to={`/u/${build.author.id}`} className="flex min-w-0 items-center gap-1.5 text-foreground hover:underline">
            <Avatar name={build.author.name} image={build.author.image} className="size-5 text-[9px]" />
            <span className="truncate">{build.author.name}</span>
          </Link>
          <span>· {timeAgo(build.createdAt)}</span>
          <span className="ml-auto flex items-center gap-2.5 tabular-nums">
            <span className="text-foreground">{fmtPrice(totals.price)}</span>
            <span className={cn('flex items-center gap-1', build.likedByMe && 'text-destructive')}>
              <Heart className={cn('size-3.5', build.likedByMe && 'fill-current')} /> {build.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" /> {build.commentCount}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
