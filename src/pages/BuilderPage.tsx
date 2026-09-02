import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { checkCompatibility } from '@/lib/compat'
import { readShareHash } from '@/lib/share'
import { computeTotals } from '@/lib/totals'
import { useBowlStore } from '@/store/bowl'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'
import { BuildSummary, CompatBar } from '@/components/build/BuildSummary'
import { BuildTable } from '@/components/build/BuildTable'

export function BuilderPage() {
  const bowl = useBowlStore((s) => s.bowl)
  const replace = useBowlStore((s) => s.replace)
  const draftCount = useBowlStore((s) => s.library.length)
  const totals = useMemo(() => computeTotals(bowl), [bowl])
  const issues = useMemo(() => checkCompatibility(bowl), [bowl])

  // Permalink: #b=… loads a shared build once, then gets out of the URL.
  useEffect(() => {
    const shared = readShareHash()
    if (shared) {
      replace(shared)
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [replace])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Build</h1>
          <Link to="/drafts" className="text-[12px]">
            Drafts{draftCount ? ` (${draftCount})` : ''}
          </Link>
        </div>
        <CompatBar issues={issues} />
        <BuildTable issues={issues} />
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        <section className="flex flex-col items-center rounded-lg border border-border bg-card p-3 shadow-card">
          <BowlCanvas bowl={bowl} interactive className="max-w-[320px]" />
          <p className="mt-1 text-center text-[12px] text-muted-foreground">Drag toppings to arrange. Tap one to remove it.</p>
        </section>
        <BuildSummary totals={totals} issues={issues} />
      </aside>
    </div>
  )
}
