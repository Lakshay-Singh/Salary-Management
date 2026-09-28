import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { api } from '@/lib/apiClient'
import { LoginPage } from './LoginPage'
import { tokenStorage } from './tokenStorage'

vi.mock('@/lib/apiClient', () => ({ api: { post: vi.fn() } }))
const post = vi.mocked(api.post)

function renderLoginPage() {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/employees', element: <p>Employees page</p> },
    ],
    { initialEntries: ['/login'] },
  )
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

async function signIn(username: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  it('signs in with the entered credentials, stores the token and opens the employee directory', async () => {
    post.mockResolvedValueOnce({ token: 'issued.jwt.token' })
    renderLoginPage()

    await signIn('hr.manager', 'correct-password')

    expect(await screen.findByText('Employees page')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/api/auth/login', { username: 'hr.manager', password: 'correct-password' })
    expect(tokenStorage.get()).toBe('issued.jwt.token')
  })

  it('shows the error for wrong credentials, keeps the username, and stays on the page', async () => {
    post.mockRejectedValueOnce(new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password'))
    renderLoginPage()

    await signIn('hr.manager', 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password')
    expect(screen.getByLabelText('Username')).toHaveValue('hr.manager')
    expect(screen.queryByText('Employees page')).not.toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
  })

  it('shows that it is signing in, and blocks a second submit, while the request is in flight', async () => {
    post.mockReturnValueOnce(new Promise(() => {}))
    renderLoginPage()

    await signIn('hr.manager', 'correct-password')

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('shows the server message when there have been too many attempts', async () => {
    post.mockRejectedValueOnce(
      new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts, try again in 15 minutes'),
    )
    renderLoginPage()

    await signIn('hr.manager', 'any-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many login attempts, try again in 15 minutes')
  })

  it('explains when the server cannot be reached', async () => {
    post.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    renderLoginPage()

    await signIn('hr.manager', 'any-password')

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i)
  })
})
