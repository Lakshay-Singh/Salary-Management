import { Navigate, Outlet } from 'react-router'
import { tokenStorage } from '@/features/auth/tokenStorage'

/** Pages under this route need a stored token; without one the visitor goes to the login page. */
export function ProtectedRoute() {
  if (!tokenStorage.get()) return <Navigate to="/login" replace />
  return <Outlet />
}
