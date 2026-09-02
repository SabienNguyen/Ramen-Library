import { Link, useLoaderData } from 'react-router'
import { ArrowRight, Hammer, PenLine } from 'lucide-react'
import { FORUM_CATEGORIES } from '../../shared/bowl'
import { timeAgo, type HomeData } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { categoryStyle } from '@/lib/forum'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { BuildCard } from '@/components/social/BuildCard'
import { CategoryChip } from '@/components/social/CategoryChip'
import { Empty } from '@/components/site/PageBits'

export function HomePage() {
  const data = useLoaderData() as HomeData
  const { data: session, isPending } = authClient.useSession()

  return (
    <div className="grid gap-8">
      {!isPending && !session && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-card">
          <span className="text-muted-foreground">Sign in to publish builds, comment and post in the forum.</span>
          <div className="flex gap-2">
            <Link to="/signup" className={buttonVariants({ size: 'sm' })}>
              Create account
            </Link>
            <Link to="/login" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>
              Sign in
            </Link>
          </div>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="font-serif text-3xl">Latest builds</h1>
          <div className="flex items-center gap-3">
            <Link to="/builds" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              All builds <ArrowRight className="size-4" />
            </Link>
            <Link to="/build" className={buttonVariants({ size: 'sm' })}>
              <Hammer /> New build
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

      <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-serif text-3xl">Forum</h2>
            <div className="flex items-center gap-3">
              <Link to="/forum" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                All threads <ArrowRight className="size-4" />
              </Link>
              <Link to="/forum/new" className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                <PenLine /> New thread
              </Link>
            </div>
          </div>
          {data.threads.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
              {data.threads.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={t.author.name} image={t.author.image} className="size-8 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/forum/${t.id}`} className="block truncate font-semibold hover:text-primary">
                      {t.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.author.name} · {timeAgo(t.lastActivityAt)}
                    </p>
                  </div>
                  <CategoryChip id={t.category} className="hidden sm:inline-flex" />
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No threads yet" action={<Link to="/forum/new" className={buttonVariants({ variant: 'outline' })}>New thread</Link>} />
          )}
        </div>
        <div className="grid content-start gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Categories</h3>
          {FORUM_CATEGORIES.map((c) => (
            <Link key={c.id} to={`/forum?category=${c.id}`} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold shadow-card transition-colors hover:border-primary/40">
              <span className={cn('size-2 shrink-0 rounded-full', categoryStyle[c.id]?.dot)} />
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
