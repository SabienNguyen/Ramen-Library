import { Link } from 'react-router'
import { timeAgo, type Author } from '@/lib/api'
import { CategoryChip } from './CategoryChip'

export type ThreadRow = { id: string; title: string; category: string; author: Author; createdAt: string; lastActivityAt: string; replyCount?: number }

/** The classic topic list: Topic | Author | Replies | Last post. */
export function ThreadTable({ threads, showCategory = true }: { threads: ThreadRow[]; showCategory?: boolean }) {
  return (
    <table className="w-full border border-border text-[12px]">
      <thead className="bg-secondary text-left text-[11px]">
        <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-2 [&>th]:py-1 [&>th]:font-bold">
          <th>Topic</th>
          <th className="w-32">Author</th>
          <th className="w-16 text-center">Replies</th>
          <th className="w-28">Last post</th>
        </tr>
      </thead>
      <tbody>
        {threads.map((t, i) => (
          <tr key={t.id} className={i % 2 ? 'bg-muted' : 'bg-card'}>
            <td className="px-2 py-1.5">
              {showCategory && <CategoryChip id={t.category} className="mr-1.5 text-muted-foreground" />}
              <Link to={`/forum/${t.id}`} className="font-bold">
                {t.title}
              </Link>
            </td>
            <td className="px-2 py-1.5">
              <Link to={`/u/${t.author.id}`}>{t.author.name}</Link>
            </td>
            <td className="px-2 py-1.5 text-center">{t.replyCount ?? '–'}</td>
            <td className="px-2 py-1.5 text-[11px] text-muted-foreground">{timeAgo(t.lastActivityAt)}</td>
          </tr>
        ))}
        {threads.length === 0 && (
          <tr>
            <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">
              No threads yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
