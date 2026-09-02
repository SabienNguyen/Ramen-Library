import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

export function PageHeader({ title, jp, blurb, action, className }: { title: string; jp?: string; blurb?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h1 className="font-serif text-4xl leading-none">
          {title} {jp && <span className="text-muted-foreground italic">{jp}</span>}
        </h1>
        {blurb && <p className="mt-1.5 text-sm text-muted-foreground">{blurb}</p>}
      </div>
      {action}
    </div>
  )
}

export function Empty({ title, blurb, action }: { title: string; blurb?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-20 text-center">
      <h3 className="font-serif text-2xl">{title}</h3>
      {blurb && <p className="max-w-sm text-sm text-muted-foreground">{blurb}</p>}
      {action}
    </div>
  )
}

export function SignInPrompt({ what, next }: { what: string; next: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent bg-accent/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">Sign in to {what}.</span>
      <div className="flex gap-2">
        <Link to={`/login?next=${encodeURIComponent(next)}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
          Sign in
        </Link>
        <Link to={`/signup?next=${encodeURIComponent(next)}`} className={buttonVariants({ size: 'sm' })}>
          Create account
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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 text-center">
      <div className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{status ?? 'Error'}</div>
      <h1 className="font-serif text-4xl">{status === 404 ? 'Nothing in this bowl' : 'The kitchen caught fire'}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button onClick={() => (window.location.href = '/')}>Back to the counter</Button>
    </div>
  )
}
