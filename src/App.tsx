import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Soup } from 'lucide-react'
import { checkCompatibility } from '@/lib/compat'
import { readShareHash } from '@/lib/share'
import { computeTotals } from '@/lib/totals'
import { useBowlStore } from '@/store/bowl'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'
import { BuildSummary, CompatBar } from '@/components/build/BuildSummary'
import { BuildTable } from '@/components/build/BuildTable'
import { LibraryGrid } from '@/components/library/LibraryGrid'

export default function App() {
  const [view, setView] = useState<'build' | 'library'>('build')
  const bowl = useBowlStore((s) => s.bowl)
  const replace = useBowlStore((s) => s.replace)
  const libraryCount = useBowlStore((s) => s.library.length)

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
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]">
            <Soup className="size-5" />
          </div>
          <div>
            <h1 className="font-serif text-3xl leading-none">
              Ramen Library <span className="hidden text-muted-foreground italic sm:inline">ラーメン</span>
            </h1>
            <p className="text-xs text-muted-foreground">Pick parts. Check compatibility. Build the bowl.</p>
          </div>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="build">
              <Soup /> Build
            </TabsTrigger>
            <TabsTrigger value="library">
              <BookOpen /> Saved builds
              {libraryCount > 0 && (
                <Badge variant="accent" className="ml-1 h-4 px-1.5 text-[10px] tabular-nums">
                  {libraryCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="flex-1">
        <TabsContent value="build">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="flex flex-col gap-4">
              <CompatBar issues={issues} />
              <BuildTable issues={issues} />
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              <section className="grain flex flex-col items-center rounded-2xl border border-border bg-card/40 p-3">
                <BowlCanvas bowl={bowl} interactive className="max-w-[320px]" />
                <p className="mt-1 text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Preview · drag toppings · tap to remove</p>
              </section>
              <BuildSummary totals={totals} issues={issues} />
            </aside>
          </div>
        </TabsContent>
        <TabsContent value="library">
          <LibraryGrid onLoad={() => setView('build')} />
        </TabsContent>
      </Tabs>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span>Builds save to this browser. Share links carry the whole build. Itadakimasu.</span>
        <span className="font-mono">React 19 · Tailwind v4 · Base UI · Motion</span>
      </footer>
    </div>
  )
}
