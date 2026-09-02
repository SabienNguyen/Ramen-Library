import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function useNext() {
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/'
  return next.startsWith('/') ? next : '/'
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-[12px]">
      <span className="font-bold">{label}</span>
      {children}
    </label>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const next = useNext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await authClient.signIn.email({ email, password })
    setBusy(false)
    if (error) return setError(error.message ?? 'Sign in failed.')
    navigate(next)
  }

  return (
    <AuthShell title="Log in">
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
        <Button type="submit" disabled={busy}>
          Log in
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          No account?{' '}
          <Link to={`/signup?next=${encodeURIComponent(next)}`}>
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function SignupPage() {
  const navigate = useNavigate()
  const next = useNext()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await authClient.signUp.email({ name, email, password })
    setBusy(false)
    if (error) return setError(error.message ?? 'Sign up failed.')
    navigate(next)
  }

  return (
    <AuthShell title="Register">
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Display name">
          <Input autoComplete="nickname" required minLength={2} maxLength={40} value={name} onChange={(e) => setName(e.target.value)}  />
        </Field>
        <Field label="Email">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </Field>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
        <Button type="submit" disabled={busy}>
          Register
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Already registered?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`}>
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

function AuthShell({ title, blurb, children }: { title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-sm py-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {blurb && <CardDescription>{blurb}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
