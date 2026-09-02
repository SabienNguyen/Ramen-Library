import { Link } from 'react-router'
import { byId } from '@/data/ingredients'
import { timeAgo, type BuildItem } from '@/lib/api'
import { computeTotals, fmtPrice } from '@/lib/totals'
import { cn } from '@/lib/utils'
import { BuildCover } from '@/components/build/CoverArt'

export function BuildCard({ build, className }: { build: BuildItem; className?: string }) {
  const totals = computeTotals(build.bowl)
  const partLine = [build.bowl.tareId && byId.tare[build.bowl.tareId]?.name, build.bowl.brothId && byId.broth[build.bowl.brothId]?.name, build.bowl.noodleId && byId.noodle[build.bowl.noodleId]?.name]
    .filter(Boolean)
    .join(', ')
  return (
    <div className={cn('border border-border bg-card', className)}>
      <Link to={`/builds/${build.id}`} className="block border-b border-border">
        <BuildCover build={build} />
      </Link>
      <div className="px-2 py-1.5 text-[11px]">
        <Link to={`/builds/${build.id}`} className="text-[13px] font-bold">
          {build.name}
        </Link>
        <div className="text-muted-foreground">{partLine || 'Empty build'}</div>
        <div className="mt-1">
          by <Link to={`/u/${build.author.id}`}>{build.author.name}</Link> <span className="text-muted-foreground">· {timeAgo(build.createdAt)}</span>
        </div>
        <div className="text-muted-foreground">
          {fmtPrice(totals.price)} · {build.likeCount} like{build.likeCount === 1 ? '' : 's'} · {build.commentCount} comment{build.commentCount === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  )
}
