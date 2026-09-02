import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 border px-1 text-[10px] leading-4 whitespace-nowrap [&>svg]:size-3', {
  variants: {
    variant: {
      default: 'border-[#aaa] bg-secondary text-foreground',
      secondary: 'border-[#ccc] bg-muted text-foreground',
      outline: 'border-[#ccc] bg-white text-muted-foreground',
      accent: 'border-[#d6c87a] bg-accent text-accent-foreground',
      scallion: 'border-[#a5d6a7] bg-[#eef7ee] text-scallion',
    },
  },
  defaultVariants: { variant: 'default' },
})

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
