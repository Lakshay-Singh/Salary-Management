import { Banknote, ChartColumn, LogOut, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
        {/* On phones the title takes the first line, and the navigation and Sign out share the second.
            The narrowest phones have no room for all three there, so Sign out wraps rather than being cut off. */}
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-3 sm:h-14 sm:flex-row sm:items-center sm:gap-6 sm:py-0">
          <span className="flex items-center gap-2.5 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Banknote className="size-4" aria-hidden />
            </span>
            Salary Management
          </span>
          <div className="flex w-full flex-wrap items-center gap-2 sm:flex-1">
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
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="ml-auto" />}>
                <LogOut aria-hidden />
                Sign out
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={signOut}>Sign out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
