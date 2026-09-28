import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api'
import { shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('does not retry a client error such as 400, 401 or 404: retrying cannot change the answer', () => {
    for (const status of [400, 401, 404]) {
      expect(shouldRetry(0, new ApiError(status, 'ANY', 'client error'))).toBe(false)
    }
  })

  it('retries a server error or network failure up to twice', () => {
    const serverError = new ApiError(503, 'HTTP_ERROR', 'unavailable')
    const networkFailure = new TypeError('Failed to fetch')

    expect(shouldRetry(0, serverError)).toBe(true)
    expect(shouldRetry(1, networkFailure)).toBe(true)
    expect(shouldRetry(2, serverError)).toBe(false)
  })
})
