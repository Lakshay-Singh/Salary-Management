import { api } from '@/lib/apiClient'

export interface Credentials {
  username: string
  password: string
}

interface LoginResponse {
  token: string
}

export const login = (credentials: Credentials) => api.post<LoginResponse>('/api/auth/login', credentials)
