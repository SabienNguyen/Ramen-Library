import * as React from 'react'
import { Tabs as BaseTabs } from '@base-ui-components/react/tabs'
import { cn } from '@/lib/utils'

function Tabs({ className, ...props }: React.ComponentProps<typeof BaseTabs.Root>) {
  return <BaseTabs.Root data-slot="tabs" className={cn('flex flex-col gap-2', className)} {...props} />
}

function TabsList({ className, children, ...props }: React.ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List data-slot="tabs-list" className={cn('flex items-end border-b border-border', className)} {...props}>
      {children}
    </BaseTabs.List>
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      data-slot="tabs-trigger"
      className={cn(
        "-mb-px inline-flex items-center gap-1 border border-transparent px-2.5 py-1 text-[12px] text-primary outline-none hover:underline data-[active]:border-border data-[active]:border-b-card data-[active]:bg-card data-[active]:font-bold data-[active]:text-foreground data-[active]:no-underline [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
