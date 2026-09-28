import { tokenStorage } from '@/features/auth/tokenStorage'
import { createApiClient } from './api'

function apiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL
  if (!url) {
    throw new Error('VITE_API_URL is not set: see frontend/.env.example (locally) or the Vercel project settings')
  }
  return url
}

/** The app's API client: sends the stored token, and ends the session when the API rejects it. */
export const api = createApiClient({
  baseUrl: apiBaseUrl(),
  getToken: tokenStorage.get,
  onUnauthorized: () => {
    tokenStorage.clear()
    // A full page load rather than a client-side navigation, so no cached salary data survives the session
    window.location.assign('/login')
  },
})
