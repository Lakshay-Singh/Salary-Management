import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient } from './api'

const BASE_URL = 'http://api.test'

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function clientWith(response: Response, token: string | null = 'stored.jwt') {
  const fetchSpy = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response)
  const onUnauthorized = vi.fn()
  const client = createApiClient({ baseUrl: BASE_URL, getToken: () => token, onUnauthorized, fetch: fetchSpy })
  const sentRequest = () => {
    const [url, init] = fetchSpy.mock.calls[0]
    return { url: String(url), init: init ?? {}, headers: new Headers(init?.headers) }
  }
  return { client, onUnauthorized, sentRequest }
}

describe('createApiClient', () => {
  it('sends the stored token as a Bearer Authorization header', async () => {
    const { client, sentRequest } = clientWith(jsonResponse(200, {}))

    await client.get('/api/employees')

    expect(sentRequest().headers.get('Authorization')).toBe('Bearer stored.jwt')
  })

  it('sends no Authorization header when no token is stored', async () => {
    const { client, sentRequest } = clientWith(jsonResponse(200, {}), null)

    await client.get('/api/health')

    expect(sentRequest().headers.has('Authorization')).toBe(false)
  })

  it('calls the API at the base URL', async () => {
    const { client, sentRequest } = clientWith(jsonResponse(200, {}))

    await client.get('/api/employees?page=2')

    expect(sentRequest().url).toBe('http://api.test/api/employees?page=2')
  })

  it('sends a body as JSON with a JSON content type', async () => {
    const { client, sentRequest } = clientWith(jsonResponse(201, {}))

    await client.post('/api/employees', { fullName: 'Asha Rao' })

    expect(sentRequest().init.method).toBe('POST')
    expect(sentRequest().headers.get('Content-Type')).toBe('application/json')
    expect(sentRequest().init.body).toBe(JSON.stringify({ fullName: 'Asha Rao' }))
  })

  it('returns the parsed JSON response', async () => {
    const { client } = clientWith(jsonResponse(200, { id: 1, fullName: 'Asha Rao' }))

    expect(await client.get('/api/employees/1')).toEqual({ id: 1, fullName: 'Asha Rao' })
  })

  it('resolves with nothing for 204 No Content', async () => {
    const { client, sentRequest } = clientWith(new Response(null, { status: 204 }))

    await expect(client.delete('/api/employees/1')).resolves.toBeUndefined()
    expect(sentRequest().init.method).toBe('DELETE')
  })

  it("throws an ApiError carrying the server's status, code, message and field details", async () => {
    const details = [{ field: 'salary', message: 'must be greater than 0' }]
    const { client } = clientWith(
      jsonResponse(400, { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details } }),
    )

    const error = await client.post('/api/employees', {}).catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed', details })
  })

  it('on a 401 for a missing or expired token, reports it so the app can return to the login page', async () => {
    const { client, onUnauthorized } = clientWith(
      jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }),
    )

    await expect(client.get('/api/employees')).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('on a 401 for a wrong password, only throws, so the login page can show the error', async () => {
    const { client, onUnauthorized } = clientWith(
      jsonResponse(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } }),
      null,
    )

    await expect(client.post('/api/auth/login', {})).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('throws a generic ApiError when an error response is not JSON', async () => {
    const { client } = clientWith(new Response('<html>Bad Gateway</html>', { status: 502 }))

    await expect(client.get('/api/employees')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' })
  })
})
