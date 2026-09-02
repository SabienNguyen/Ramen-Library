import { Link, useLoaderData, useSearchParams } from 'react-router'
import type { BuildItem } from '@/lib/api'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuildCard } from '@/components/social/BuildCard'
import { Empty, PageHeader } from '@/components/site/PageBits'

export function BuildsPage() {
  const { items } = useLoaderData() as { items: BuildItem[] }
  const [params, setParams] = useSearchParams()
  const sort = params.get('sort') === 'top' ? 'top' : 'new'

  return (
    <div>
      <PageHeader
        title="Builds"
        action={
          <div className="flex items-center gap-2">
            <Tabs value={sort} onValueChange={(v) => setParams(v === 'top' ? { sort: 'top' } : {})}>
              <TabsList>
                <TabsTrigger value="new">Newest</TabsTrigger>
                <TabsTrigger value="top">Most liked</TabsTrigger>
              </TabsList>
            </Tabs>
            <Link to="/build" className={buttonVariants({ size: 'sm' })}>
              New build
            </Link>
          </div>
        }
      />
      {items.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((b) => (
            <BuildCard key={b.id} build={b} />
          ))}
        </div>
      ) : (
        <Empty title="No builds yet" action={<Link to="/build" className={buttonVariants()}>Start a build</Link>} />
      )}
    </div>
  )
}
