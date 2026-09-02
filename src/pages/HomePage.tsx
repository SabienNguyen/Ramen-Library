import { Link, useLoaderData } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Hammer, MessagesSquare } from 'lucide-react'
import { FORUM_CATEGORIES } from '../../shared/bowl'
import { authClient } from '@/lib/auth-client'
import { categoryStyle } from '@/lib/forum'
import { CategoryChip } from '@/components/social/CategoryChip'
import { timeAgo, type HomeData } from '@/lib/api'
import { useBowlStore } from '@/store/bowl'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'
import { BuildCover } from '@/components/build/CoverArt'
import { BuildCard } from '@/components/social/BuildCard'
import { Empty } from '@/components/site/PageBits'

export function HomePage() {
  const data = useLoaderData() as HomeData
  const draft = useBowlStore((s) => s.bowl)
  const hero = data.builds.find((b) => b.id === data.topBuildId) ?? data.builds[0]
  const { data: session, isPending } = authClient.useSession()

  return (
    <div className="grid gap-10">
      {!isPending && !session && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent bg-accent/40 px-4 py-3 text-sm">
          <span>
            <span className="font-semibold">New here?</span> You can browse everything. An account lets you publish bowls, like, comment and post in the forum.
          </span>
          <div className="flex gap-2">
            <Link to="/signup" className={buttonVariants({ size: 'sm' })}>
              Join the counter
            </Link>
            <Link to="/login" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>
              Sign in
            </Link>
          </div>
        </div>
      )}
      <section className="grid items-center gap-8 lg:grid-cols-[1fr_440px]">
        <div>
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-[11px] tracking-widest text-primary uppercase">
            PCPartPicker, but for ramen
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 font-serif text-5xl leading-[1.05] sm:text-6xl">
            Pick the parts. <br />
            Check they fit. <br />
            <span className="text-muted-foreground italic">Post the bowl.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 max-w-lg text-muted-foreground">
            Every part with real specs. A compatibility checker that knows thin noodles die under miso. And a friendly counter full of people who will happily tell you why your tare is wrong.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 flex flex-wrap gap-2">
            <Link to="/build" className={buttonVariants({ size: 'lg' })}>
              <Hammer /> Start a build
            </Link>
            <Link to="/builds" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Browse builds
            </Link>
            <Link to="/forum" className={buttonVariants({ size: 'lg', variant: 'ghost' })}>
              <MessagesSquare /> Forum
            </Link>
          </motion.div>
          <dl className="mt-8 flex gap-8 font-mono text-sm">
            <Stat n={data.stats.builds} label="builds" />
            <Stat n={data.stats.users} label="cooks" />
            <Stat n={data.stats.threads} label="threads" />
          </dl>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {hero ? (
            <Link to={`/builds/${hero.id}`}>
              <BuildCover build={hero} variant="full" />
            </Link>
          ) : (
            <div className="grain p-4">
              <BowlCanvas bowl={draft} interactive />
            </div>
          )}
          <p className="px-3 py-2 text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {hero ? (
              <>
                Most liked · <Link to={`/builds/${hero.id}`} className="text-foreground hover:underline">{hero.name}</Link> by {hero.author.name}
              </>
            ) : (
              'Your draft · nobody has published yet'
            )}
          </p>
        </motion.div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-3xl">Fresh builds</h2>
          <Link to="/builds" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            All builds <ArrowRight className="size-4" />
          </Link>
        </div>
        {data.builds.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.builds.map((b) => (
              <BuildCard key={b.id} build={b} />
            ))}
          </div>
        ) : (
          <Empty title="No builds published yet" blurb="Be the first. Build a bowl, hit Publish, claim the top spot." action={<Link to="/build" className={buttonVariants()}>Start a build</Link>} />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-serif text-3xl">On the forum</h2>
            <Link to="/forum" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              All threads <ArrowRight className="size-4" />
            </Link>
          </div>
          {data.threads.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
              {data.threads.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={t.author.name} image={t.author.image} className="size-7 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/forum/${t.id}`} className="block truncate font-medium hover:underline">
                      {t.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{t.body}</p>
                  </div>
                  <CategoryChip id={t.category} className="hidden sm:inline-flex" />
                  <span className="text-xs whitespace-nowrap text-muted-foreground">{timeAgo(t.lastActivityAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Quiet counter" blurb="No threads yet. Start one." action={<Link to="/forum/new" className={buttonVariants({ variant: 'outline' })}>New thread</Link>} />
          )}
        </div>
        <div className="grid content-start gap-2">
          <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Categories</h3>
          {FORUM_CATEGORIES.map((c) => (
            <Link key={c.id} to={`/forum?category=${c.id}`} className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-card transition-colors hover:border-primary/40">
              <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', categoryStyle[c.id]?.dot)} />
              <span>
                <span className="block text-sm font-semibold">{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <dt className="text-2xl tabular-nums">{n}</dt>
      <dd className="text-xs text-muted-foreground">{label}</dd>
    </div>
  )
}
