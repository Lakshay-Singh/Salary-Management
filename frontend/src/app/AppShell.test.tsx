import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { tokenStorage } from '@/features/auth/tokenStorage'
import { AppShell } from './AppShell'

function renderShell() {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>Login page</p> },
      { element: <AppShell />, children: [{ path: '/employees', element: <p>Employees page</p> }] },
    ],
    { initialEntries: ['/employees'] },
  )
  render(<RouterProvider router={router} />)
}

describe('AppShell', () => {
  it('shows the current page inside the shell', () => {
    renderShell()

    expect(screen.getByText('Employees page')).toBeInTheDocument()
  })

  it('links to the employees and insights pages', () => {
    renderShell()

    expect(screen.getByRole('link', { name: /employees/i })).toHaveAttribute('href', '/employees')
    expect(screen.getByRole('link', { name: /insights/i })).toHaveAttribute('href', '/insights')
  })

  it('signing out forgets the token and returns to the login page', async () => {
    tokenStorage.set('a.jwt.token')
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(tokenStorage.get()).toBeNull()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
