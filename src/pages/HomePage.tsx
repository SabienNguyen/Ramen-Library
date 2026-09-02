import { Link, useLoaderData } from 'react-router'
import { FORUM_CATEGORIES } from '../../shared/bowl'
import type { HomeData } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { buttonVariants } from '@/components/ui/button'
import { BuildCard } from '@/components/social/BuildCard'
import { ThreadTable } from '@/components/social/ThreadTable'
import { Empty } from '@/components/site/PageBits'

export function HomePage() {
  const data = useLoaderData() as HomeData
  const { data: session, isPending } = authClient.useSession()

  return (
    <div className="grid gap-5">
      {!isPending && !session && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-[13px] shadow-card">
          <Link to="/login">Log in</Link> or <Link to="/signup">register</Link> to publish builds, comment and post in the forum.
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Latest builds</h1>
          <div className="flex items-center gap-3 text-[12px]">
            <Link to="/builds">All builds</Link>
            <Link to="/build" className={buttonVariants({ size: 'sm' })}>
              New build
            </Link>
          </div>
        </div>
        {data.builds.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.builds.map((b) => (
              <BuildCard key={b.id} build={b} />
            ))}
          </div>
        ) : (
          <Empty title="No builds yet" action={<Link to="/build" className={buttonVariants()}>Start a build</Link>} />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Forum</h2>
          <div className="flex items-center gap-3 text-[12px]">
            <Link to="/forum">All threads</Link>
            <Link to="/forum/new" className={buttonVariants({ size: 'sm' })}>
              New thread
            </Link>
          </div>
        </div>
        <div className="mb-3 text-[13px]">
          <span className="text-muted-foreground">Categories: </span>
          {FORUM_CATEGORIES.map((c, i) => (
            <span key={c.id}>
              {i > 0 && <span className="px-1 text-muted-foreground">·</span>}
              <Link to={`/forum?category=${c.id}`} title={c.blurb}>
                {c.label}
              </Link>
            </span>
          ))}
        </div>
        <ThreadTable threads={data.threads} />
      </section>
    </div>
  )
}
