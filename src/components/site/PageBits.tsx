import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function PageHeader({ title, blurb, action, className }: { title: string; jp?: string; blurb?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2', className)}>
      <div>
        <h1 className="text-[18px] font-bold">{title}</h1>
        {blurb && <p className="text-[11px] text-muted-foreground">{blurb}</p>}
      </div>
      {action}
    </div>
  )
}

export function Empty({ title, blurb, action }: { title: string; blurb?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-border bg-muted py-10 text-center">
      <h3 className="text-[13px] font-bold">{title}</h3>
      {blurb && <p className="max-w-sm text-[11px] text-muted-foreground">{blurb}</p>}
      {action}
    </div>
  )
}

export function SignInPrompt({ what, next }: { what: string; next: string }) {
  return (
    <div className="border border-border bg-muted px-3 py-2 text-[12px]">
      You must be <Link to={`/login?next=${encodeURIComponent(next)}`}>logged in</Link> to {what}. No account? <Link to={`/signup?next=${encodeURIComponent(next)}`}>Register</Link>.
    </div>
  )
}

export function ErrorPage() {
  const err = useRouteError()
  const status = isRouteErrorResponse(err) ? err.status : (err as { status?: number })?.status
  const message = isRouteErrorResponse(err) ? err.statusText : err instanceof Error ? err.message : 'Something went wrong.'
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 text-center">
      <div className="text-[11px] text-muted-foreground">{status ?? 'Error'}</div>
      <h1 className="text-[18px] font-bold">{status === 404 ? 'Not found' : 'Something went wrong'}</h1>
      <p className="text-[12px] text-muted-foreground">{message}</p>
      <Button onClick={() => (window.location.href = '/')}>Home</Button>
    </div>
  )
}
