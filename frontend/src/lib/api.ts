export interface FieldError {
  field: string
  message: string
}

/** Every non-2xx response, in the API's error shape: { error: { code, message, details? } }. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: FieldError[]

  constructor(status: number, code: string, message: string, details: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export interface ApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  put<T>(path: string, body: unknown): Promise<T>
  delete(path: string): Promise<void>
}

interface ApiClientOptions {
  baseUrl: string
  getToken: () => string | null
  /** Called when the API rejects the token (missing, invalid or expired), before the error is thrown. */
  onUnauthorized: () => void
  fetch?: typeof fetch
}

export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  // Wrapped, because calling fetch detached from window throws "Illegal invocation" in some browsers
  fetch: send = (input, init) => fetch(input, init),
}: ApiClientOptions): ApiClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers = new Headers()
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (body !== undefined) headers.set('Content-Type', 'application/json')

    const response = await send(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.status === 204) return undefined as T

    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const error = toApiError(response.status, payload)
      // Only a rejected token ends the session. A wrong password at login is also a 401,
      // but INVALID_CREDENTIALS must reach the login form instead of redirecting.
      if (error.code === 'UNAUTHORIZED') onUnauthorized()
      throw error
    }
    return payload as T
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path),
  }
}

interface ErrorBody {
  error: { code: string; message: string; details?: FieldError[] }
}

function isErrorBody(payload: unknown): payload is ErrorBody {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) return false
  const { error } = payload
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error
}

function toApiError(status: number, payload: unknown): ApiError {
  if (isErrorBody(payload)) {
    const { code, message, details } = payload.error
    return new ApiError(status, code, message, details ?? [])
  }
  return new ApiError(status, 'HTTP_ERROR', `Request failed with status ${status}`)
}
