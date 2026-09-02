import { useState } from 'react'
import { BookOpen, Soup } from 'lucide-react'
import { useBowlStore } from '@/store/bowl'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BowlCanvas } from '@/components/bowl/BowlCanvas'
import { IngredientPalette } from '@/components/bowl/IngredientPalette'
import { RecipePanel } from '@/components/bowl/RecipePanel'
import { LibraryGrid } from '@/components/library/LibraryGrid'

export default function App() {
  const [view, setView] = useState<'build' | 'library'>('build')
  const bowl = useBowlStore((s) => s.bowl)
  const libraryCount = useBowlStore((s) => s.library.length)

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]">
            <Soup className="size-5" />
          </div>
          <div>
            <h1 className="font-serif text-3xl leading-none">
              Ramen Library <span className="hidden text-muted-foreground italic sm:inline">ラーメン</span>
            </h1>
            <p className="text-xs text-muted-foreground">A visual library for creating ramen.</p>
          </div>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="build">
              <Soup /> Build
            </TabsTrigger>
            <TabsTrigger value="library">
              <BookOpen /> Library
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
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_300px] lg:items-start">
            <IngredientPalette className="order-2 lg:order-1" />

            <section className="grain order-1 flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 p-6 lg:order-2 lg:sticky lg:top-6">
              <BowlCanvas bowl={bowl} interactive className="max-w-[560px]" />
              <p className="mt-2 text-center font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Drag toppings · tap to remove</p>
            </section>

            <RecipePanel className="order-3 lg:sticky lg:top-6" />
          </div>
        </TabsContent>
        <TabsContent value="library">
          <LibraryGrid onLoad={() => setView('build')} />
        </TabsContent>
      </Tabs>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span>Bowls save to this browser. Itadakimasu.</span>
        <span className="font-mono">React 19 · Tailwind v4 · Base UI · Motion</span>
      </footer>
    </div>
  )
}
