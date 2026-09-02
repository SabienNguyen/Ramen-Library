import * as React from 'react'
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = BaseDialog.Root
const DialogTrigger = BaseDialog.Trigger
const DialogClose = BaseDialog.Close

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
      <BaseDialog.Popup
        data-slot="dialog-content"
        className={cn('fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-3 border border-[#888] bg-popover p-4 outline-none', className)}
        {...props}
      >
        {children}
        <BaseDialog.Close className="absolute top-2 right-2 border border-transparent p-0.5 hover:border-[#aaa]" aria-label="Close">
          <XIcon className="size-3.5" />
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-0.5 border-b border-border pb-2', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title data-slot="dialog-title" className={cn('text-[14px] font-bold', className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description data-slot="dialog-description" className={cn('text-[11px] text-muted-foreground', className)} {...props} />
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
