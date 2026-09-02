import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border text-[13px] font-medium leading-none outline-none transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground hover:bg-[#2c3239]',
        secondary: 'border-input bg-card text-foreground shadow-card hover:bg-secondary',
        outline: 'border-input bg-card text-foreground shadow-card hover:bg-secondary',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-secondary',
        accent: 'border-primary bg-primary text-primary-foreground hover:bg-[#2c3239]',
        destructive: 'border-input bg-card text-destructive shadow-card hover:bg-[#fdf2f1]',
        link: 'border-0 bg-transparent p-0 text-link hover:underline',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-7 px-2.5 text-[12px]',
        lg: 'h-9 px-4 text-sm',
        icon: 'size-8',
        'icon-sm': 'size-7',
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
