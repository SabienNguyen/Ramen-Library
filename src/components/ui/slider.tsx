import * as React from 'react'
import { Slider as BaseSlider } from '@base-ui-components/react/slider'
import { cn } from '@/lib/utils'

type SliderProps = React.ComponentProps<typeof BaseSlider.Root> & { label?: string }

function Slider({ className, label, ...props }: SliderProps) {
  return (
    <BaseSlider.Root data-slot="slider" className={cn('w-full', className)} {...props}>
      <BaseSlider.Control className="relative flex w-full touch-none items-center py-2 select-none">
        <BaseSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <BaseSlider.Indicator className="absolute h-full rounded-full bg-primary" />
        </BaseSlider.Track>
        <BaseSlider.Thumb
          aria-label={label}
          className="absolute top-1/2 block size-4 rounded-full border-2 border-primary bg-background shadow transition-transform outline-none hover:scale-110 focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-110"
        />
      </BaseSlider.Control>
    </BaseSlider.Root>
  )
}

export { Slider }
