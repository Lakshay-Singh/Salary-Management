import { Banknote, ChartColumn, LogOut, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { tokenStorage } from '@/features/auth/tokenStorage'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/insights', label: 'Insights', icon: ChartColumn },
]

export function AppShell() {
  const navigate = useNavigate()

  const signOut = () => {
    tokenStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="flex items-center gap-2.5 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Banknote className="size-4" aria-hidden />
            </span>
            Salary Management
          </span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
            <LogOut aria-hidden />
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
