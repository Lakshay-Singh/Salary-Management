import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

const MAX_RETRIES = 2

/** A 4xx will give the same answer however often it is asked; server and network failures may be transient. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000, refetchOnWindowFocus: false },
    },
  })
}
