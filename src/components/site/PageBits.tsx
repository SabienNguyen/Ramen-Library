import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

export function PageHeader({ title, blurb, action, className }: { title: string; jp?: string; blurb?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {blurb && <p className="text-[13px] text-muted-foreground">{blurb}</p>}
      </div>
      {action}
    </div>
  )
}

export function Empty({ title, blurb, action }: { title: string; blurb?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input py-12 text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      {blurb && <p className="max-w-sm text-[13px] text-muted-foreground">{blurb}</p>}
      {action}
    </div>
  )
}

export function SignInPrompt({ what, next }: { what: string; next: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-[13px] shadow-card">
      <span className="text-muted-foreground">Log in to {what}.</span>
      <div className="flex gap-2">
        <Link to={`/login?next=${encodeURIComponent(next)}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hover:no-underline')}>
          Log in
        </Link>
        <Link to={`/signup?next=${encodeURIComponent(next)}`} className={cn(buttonVariants({ size: 'sm' }), 'text-primary-foreground hover:no-underline')}>
          Register
        </Link>
      </div>
    </div>
  )
}

export function ErrorPage() {
  const err = useRouteError()
  const status = isRouteErrorResponse(err) ? err.status : (err as { status?: number })?.status
  const message = isRouteErrorResponse(err) ? err.statusText : err instanceof Error ? err.message : 'Something went wrong.'
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 text-center">
      <div className="text-[12px] text-muted-foreground">{status ?? 'Error'}</div>
      <h1 className="text-xl font-semibold">{status === 404 ? 'Not found' : 'Something went wrong'}</h1>
      <p className="text-[13px] text-muted-foreground">{message}</p>
      <Button onClick={() => (window.location.href = '/')}>Home</Button>
    </div>
  )
}
