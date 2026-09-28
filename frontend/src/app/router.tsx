import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { LoginPage } from '@/features/auth/LoginPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { AppShell } from './AppShell'
import { NotFoundPage } from './NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/employees" replace /> },
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/insights', element: <InsightsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(routes)
