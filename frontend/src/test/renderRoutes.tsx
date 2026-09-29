import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'

interface RenderRoutesOptions {
  url: string
  /** Router location state, as a Link with `state` would pass it. */
  state?: unknown
}

/** Renders routes as the app does, with a fresh query cache and no retries, and exposes the router to check navigation. */
export function renderRoutes(routes: RouteObject[], { url, state }: RenderRoutesOptions) {
  const target = new URL(url, 'http://localhost')
  const router = createMemoryRouter(routes, {
    initialEntries: [{ pathname: target.pathname, search: target.search, state }],
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return {
    router,
    queryClient,
    currentUrl: () => router.state.location.pathname + router.state.location.search,
  }
}
