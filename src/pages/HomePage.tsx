import { Link, useLoaderData } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Hammer, MessagesSquare } from 'lucide-react'
import { FORUM_CATEGORIES } from '../../shared/bowl'
import { timeAgo, type HomeData } from '@/lib/api'
import { useBowlStore } from '@/store/bowl'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'
import { BuildCard } from '@/components/social/BuildCard'
import { Empty } from '@/components/site/PageBits'

export function HomePage() {
  const data = useLoaderData() as HomeData
  const draft = useBowlStore((s) => s.bowl)
  const hero = data.builds.find((b) => b.id === data.topBuildId) ?? data.builds[0]

  return (
    <div className="grid gap-10">
      <section className="grid items-center gap-8 lg:grid-cols-[1fr_420px]">
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
            Broth, tare, noodles, aroma oil, toppings — every part with real specs. A compatibility checker that knows thin noodles die under miso. A community that will tell you the same thing, louder.
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
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="grain rounded-2xl border border-border bg-card/40 p-4">
          <BowlCanvas bowl={hero?.bowl ?? draft} interactive={!hero} />
          <p className="mt-1 text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
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
            <ul className="divide-y divide-border rounded-xl border border-border bg-card/60">
              {data.threads.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={t.author.name} image={t.author.image} className="size-7 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/forum/${t.id}`} className="block truncate font-medium hover:underline">
                      {t.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{t.body}</p>
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {FORUM_CATEGORIES.find((c) => c.id === t.category)?.label}
                  </Badge>
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
            <Link key={c.id} to={`/forum?category=${c.id}`} className="rounded-lg border border-border bg-card/60 px-3.5 py-2.5 transition-colors hover:border-primary/40">
              <div className="text-sm font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.blurb}</div>
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
