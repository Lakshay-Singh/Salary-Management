import { describe, expect, it } from 'vitest'
import { tokenStorage } from './tokenStorage'

describe('tokenStorage', () => {
  it('has no token until one is stored', () => {
    expect(tokenStorage.get()).toBeNull()
  })

  it('returns the stored token', () => {
    tokenStorage.set('a.jwt.token')

    expect(tokenStorage.get()).toBe('a.jwt.token')
  })

  it('forgets the token when cleared', () => {
    tokenStorage.set('a.jwt.token')

    tokenStorage.clear()

    expect(tokenStorage.get()).toBeNull()
  })

  it('keeps the token in sessionStorage, so it is gone when the tab closes, never in localStorage', () => {
    tokenStorage.set('a.jwt.token')

    expect(sessionStorage.length).toBe(1)
    expect(localStorage.length).toBe(0)
  })
})
