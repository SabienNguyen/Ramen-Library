import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn('h-7 w-full min-w-0 border border-input bg-white px-1.5 text-[12px] outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50', className)}
      {...props}
    />
  )
}

export { Input }
