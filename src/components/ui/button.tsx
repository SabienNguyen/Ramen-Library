import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap border text-[12px] leading-none outline-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'border-[#888] bg-[#e6e6e6] font-bold text-foreground hover:bg-[#d9d9d9] active:bg-[#cccccc]',
        secondary: 'border-[#aaa] bg-[#f2f2f2] text-foreground hover:bg-[#e6e6e6]',
        outline: 'border-[#aaa] bg-white text-foreground hover:bg-[#f2f2f2]',
        ghost: 'border-transparent bg-transparent text-primary hover:underline',
        accent: 'border-[#888] bg-[#e6e6e6] font-bold text-foreground hover:bg-[#d9d9d9]',
        destructive: 'border-[#aaa] bg-white text-destructive hover:bg-[#fdecea]',
        link: 'border-0 bg-transparent p-0 text-primary underline',
      },
      size: {
        default: 'h-7 px-2.5',
        sm: 'h-6 px-2 text-[11px]',
        lg: 'h-8 px-3 text-[13px]',
        icon: 'size-7',
        'icon-sm': 'size-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
