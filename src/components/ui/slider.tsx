import * as React from 'react'
import { Slider as BaseSlider } from '@base-ui-components/react/slider'
import { cn } from '@/lib/utils'

type SliderProps = React.ComponentProps<typeof BaseSlider.Root> & { label?: string }

function Slider({ className, label, ...props }: SliderProps) {
  return (
    <BaseSlider.Root data-slot="slider" className={cn('w-full', className)} {...props}>
      <BaseSlider.Control className="relative flex w-full touch-none items-center py-2 select-none">
        <BaseSlider.Track className="relative h-1.5 w-full grow border border-border bg-muted">
          <BaseSlider.Indicator className="absolute h-full bg-primary" />
        </BaseSlider.Track>
        <BaseSlider.Thumb aria-label={label} className="absolute top-1/2 block size-3.5 border border-[#666] bg-[#e6e6e6] outline-none focus-visible:outline-1 focus-visible:outline-dotted" />
      </BaseSlider.Control>
    </BaseSlider.Root>
  )
}

export { Slider }
