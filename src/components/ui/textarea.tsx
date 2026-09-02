import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn('min-h-24 w-full border border-input bg-white px-1.5 py-1 text-[12px] outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50', className)}
      {...props}
    />
  )
}

export { Textarea }
