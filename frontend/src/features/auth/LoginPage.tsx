import { useMutation } from '@tanstack/react-query'
import { Banknote, CircleAlert, LoaderCircle } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { login } from './authApi'
import { tokenStorage } from './tokenStorage'

// The API's own message covers wrong credentials and rate limiting; anything else means we never got an answer
function describeError(error: Error): string {
  if (error instanceof ApiError) return error.message
  return 'Could not reach the server. Check your connection and try again.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const signIn = useMutation({
    mutationFn: login,
    onSuccess: ({ token }) => {
      tokenStorage.set(token)
      navigate('/employees', { replace: true })
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    signIn.mutate({ username, password })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Banknote className="size-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Salary Management</h1>
            <p className="text-sm text-muted-foreground">Pay data for every ACME employee, in one place</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your HR Manager account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {signIn.error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {describeError(signIn.error)}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={signIn.isPending}>
                {signIn.isPending ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
