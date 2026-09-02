import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'

const nav = [
  { to: '/build', label: 'Build' },
  { to: '/builds', label: 'Builds' },
  { to: '/forum', label: 'Forum' },
]

export function Layout() {
  return (
    <TooltipProvider delay={300}>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-[1120px] border-t border-border px-4 py-4 text-[12px] text-muted-foreground sm:px-6">Ramen Library</footer>
      </div>
    </TooltipProvider>
  )
}

function Header() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-13 w-full max-w-[1120px] items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="text-[15px] font-semibold text-foreground hover:no-underline">
          Ramen Library
        </Link>
        <nav className="flex h-full items-center gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn('relative flex h-full items-center px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:no-underline', isActive && 'text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-foreground')
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[13px]">
          {isPending ? null : session ? (
            <>
              <Link to={`/u/${session.user.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 font-medium text-foreground hover:bg-secondary hover:no-underline">
                <Avatar name={session.user.name} image={session.user.image} className="size-6 text-[10px]" />
                <span className="hidden max-w-32 truncate sm:inline">{session.user.name}</span>
              </Link>
              <Link to="/settings" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:no-underline')}>
                Settings
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={async () => {
                  await authClient.signOut()
                  navigate('/')
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hover:no-underline')}>
                Log in
              </Link>
              <Link to="/signup" className={cn(buttonVariants({ size: 'sm' }), 'text-primary-foreground hover:no-underline')}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
