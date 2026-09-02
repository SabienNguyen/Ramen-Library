import { Link } from 'react-router'
import { MessageCircle } from 'lucide-react'
import { timeAgo, type Author } from '@/lib/api'
import { Avatar } from '@/components/ui/avatar'
import { CategoryChip } from './CategoryChip'

export type ThreadRow = { id: string; title: string; category: string; author: Author; createdAt: string; lastActivityAt: string; replyCount?: number }

/** Topic list: title and meta on the left, replies and activity on the right. */
export function ThreadTable({ threads, showCategory = true }: { threads: ThreadRow[]; showCategory?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <table className="w-full text-[13px]">
        <thead className="bg-muted text-left text-[12px] text-muted-foreground">
          <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-4 [&>th]:py-2 [&>th]:font-medium">
            <th>Topic</th>
            <th className="w-20 text-center">Replies</th>
            <th className="w-28 text-right">Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {threads.map((t) => (
            <tr key={t.id} className="hover:bg-muted/60">
              <td className="px-4 py-2.5">
                <div className="flex items-start gap-3">
                  <Avatar name={t.author.name} image={t.author.image} className="mt-0.5 size-7 text-[10px]" />
                  <div className="min-w-0">
                    <Link to={`/forum/${t.id}`} className="font-medium text-foreground">
                      {t.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted-foreground">
                      {showCategory && <CategoryChip id={t.category} />}
                      <Link to={`/u/${t.author.id}`} className="text-muted-foreground hover:text-foreground">
                        {t.author.name}
                      </Link>
                      <span>{timeAgo(t.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-center tabular-nums">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageCircle className="size-3.5" /> {t.replyCount ?? 0}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right text-[12px] text-muted-foreground">{timeAgo(t.lastActivityAt)}</td>
            </tr>
          ))}
          {threads.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                No threads yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
