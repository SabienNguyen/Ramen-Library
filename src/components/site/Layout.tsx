import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { BookOpen, Hammer, LogOut, MessagesSquare, Settings, Soup } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const nav = [
  { to: '/build', label: 'Build', icon: Hammer },
  { to: '/builds', label: 'Builds', icon: BookOpen },
  { to: '/forum', label: 'Forum', icon: MessagesSquare },
]

export function Layout() {
  return (
    <TooltipProvider delay={300}>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-[1400px] border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Ramen Library
        </footer>
      </div>
    </TooltipProvider>
  )
}

function Header() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]">
            <Soup className="size-4" />
          </span>
          <span className="font-serif text-xl leading-none">
            Ramen Library
          </span>
        </Link>

        <nav className="ml-2 flex items-center gap-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-secondary hover:text-foreground', isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground')
              }
            >
              <n.icon className="size-4" />
              <span className="hidden sm:inline">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isPending ? null : session ? (
            <>
              <Link to={`/u/${session.user.id}`} className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-semibold hover:bg-secondary">
                <Avatar name={session.user.name} image={session.user.image} className="size-7" />
                <span className="hidden max-w-32 truncate sm:inline">{session.user.name}</span>
              </Link>
              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Settings" onClick={() => navigate('/settings')} />}>
                  <Settings />
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sign out"
                      onClick={async () => {
                        await authClient.signOut()
                        navigate('/')
                      }}
                    />
                  }
                >
                  <LogOut />
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
