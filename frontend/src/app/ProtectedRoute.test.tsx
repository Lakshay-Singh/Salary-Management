import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { tokenStorage } from '@/features/auth/tokenStorage'
import { ProtectedRoute } from './ProtectedRoute'

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>Login page</p> },
      { element: <ProtectedRoute />, children: [{ path: '/employees', element: <p>Employees page</p> }] },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

describe('ProtectedRoute', () => {
  it('sends a visitor without a token to the login page', () => {
    renderAt('/employees')

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Employees page')).not.toBeInTheDocument()
  })

  it('shows the page when a token is stored', () => {
    tokenStorage.set('a.jwt.token')

    renderAt('/employees')

    expect(screen.getByText('Employees page')).toBeInTheDocument()
  })
})
