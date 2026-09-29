import { render, screen, within } from '@testing-library/react'
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

  it('asks for confirmation before signing out', async () => {
    tokenStorage.set('a.jwt.token')
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    const dialog = await screen.findByRole('alertdialog', { name: 'Sign out?' })
    expect(dialog).toHaveAccessibleDescription('Are you sure you want to sign out?')
    expect(tokenStorage.get()).toBe('a.jwt.token')
  })

  it('once confirmed, forgets the token and returns to the login page', async () => {
    tokenStorage.set('a.jwt.token')
    renderShell()
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Sign out?' })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }))

    expect(tokenStorage.get()).toBeNull()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('cancelling keeps you signed in, on the same page', async () => {
    tokenStorage.set('a.jwt.token')
    renderShell()
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Sign out?' })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(tokenStorage.get()).toBe('a.jwt.token')
    expect(screen.getByText('Employees page')).toBeInTheDocument()
  })
})
