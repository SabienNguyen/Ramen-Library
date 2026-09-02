import * as React from 'react'
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = BaseTooltip.Provider
const Tooltip = BaseTooltip.Root
const TooltipTrigger = BaseTooltip.Trigger

function TooltipContent({
  className,
  sideOffset = 6,
  side = 'top',
  children,
  ...props
}: React.ComponentProps<typeof BaseTooltip.Popup> & Pick<React.ComponentProps<typeof BaseTooltip.Positioner>, 'side' | 'sideOffset'>) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} sideOffset={sideOffset} className="z-50">
        <BaseTooltip.Popup
          className={cn(
            'rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
