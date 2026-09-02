import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
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
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-3 py-4">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-[1100px] border-t border-border px-3 py-3 text-[11px] text-muted-foreground">Ramen Library</footer>
      </div>
    </TooltipProvider>
  )
}

function Header() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  return (
    <header className="border-b border-border bg-secondary">
      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
        <Link to="/" className="text-[16px] font-bold text-foreground no-underline hover:no-underline">
          Ramen Library
        </Link>
        <nav className="flex items-center text-[12px]">
          {nav.map((n, i) => (
            <span key={n.to} className="flex items-center">
              {i > 0 && <span className="px-1.5 text-muted-foreground">|</span>}
              <NavLink to={n.to} className={({ isActive }) => cn(isActive && 'font-bold text-foreground')}>
                {n.label}
              </NavLink>
            </span>
          ))}
        </nav>
        <div className="ml-auto text-[11px] text-muted-foreground">
          {isPending ? null : session ? (
            <>
              Logged in as <Link to={`/u/${session.user.id}`}>{session.user.name}</Link>
              <span className="px-1.5">·</span>
              <Link to="/settings">Settings</Link>
              <span className="px-1.5">·</span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={async () => {
                  await authClient.signOut()
                  navigate('/')
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <span className="px-1.5">·</span>
              <Link to="/signup">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
