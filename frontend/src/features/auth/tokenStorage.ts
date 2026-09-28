// sessionStorage, not localStorage: the token survives a refresh but is gone when the tab closes.
const TOKEN_KEY = 'salary-management.token'

export const tokenStorage = {
  get: (): string | null => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string): void => sessionStorage.setItem(TOKEN_KEY, token),
  clear: (): void => sessionStorage.removeItem(TOKEN_KEY),
}
