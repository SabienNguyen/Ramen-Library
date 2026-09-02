import * as React from 'react'
import { Tooltip as BaseTooltip } from '@base-ui-components/react/tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = BaseTooltip.Provider
const Tooltip = BaseTooltip.Root
const TooltipTrigger = BaseTooltip.Trigger

function TooltipContent({
  className,
  sideOffset = 4,
  side = 'top',
  children,
  ...props
}: React.ComponentProps<typeof BaseTooltip.Popup> & Pick<React.ComponentProps<typeof BaseTooltip.Positioner>, 'side' | 'sideOffset'>) {
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} sideOffset={sideOffset} className="z-50">
        <BaseTooltip.Popup className={cn('border border-[#999] bg-paper px-1.5 py-0.5 text-[11px] text-foreground', className)} {...props}>
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
