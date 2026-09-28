import request from 'supertest';
import { bearerFor } from '../helpers/auth';
import { TEST_ORIGIN, buildTestApp } from '../helpers/testApp';

const app = buildTestApp();

describe('GET /api/health', () => {
  it('returns 200 without a token', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('route protection', () => {
  it('rejects an /api request without a token before routing, so it never reveals which routes exist', async () => {
    const res = await request(app).get('/api/no-such-route');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('lets an authenticated request through to routing', async () => {
    const res = await request(app).get('/api/no-such-route').set('Authorization', bearerFor());

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns a JSON 404 outside /api', async () => {
    const res = await request(app).get('/no-such-page');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('CORS', () => {
  const preflight = (origin: string) =>
    request(app)
      .options('/api/employees')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'DELETE')
      .set('Access-Control-Request-Headers', 'Authorization');

  it('answers a preflight from the allowed origin without needing a token', async () => {
    const res = await preflight(TEST_ORIGIN);

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(TEST_ORIGIN);
    expect(res.headers['access-control-allow-methods']).toBe('GET,POST,PUT,DELETE');
    expect(res.headers['access-control-allow-headers']).toBe('Content-Type,Authorization');
    expect(res.headers['access-control-max-age']).toBe('7200');
  });

  it('gives any other origin no Access-Control-Allow-Origin header', async () => {
    const res = await preflight('https://attacker.example.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('security headers', () => {
  it('sets helmet headers and does not advertise Express', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('JSON request bodies', () => {
  const postJson = (body: string) =>
    request(app).post('/api/health').set('Content-Type', 'application/json').send(body);

  it('rejects malformed JSON with 400', async () => {
    const res = await postJson('{"fullName": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects a body over 10kb with 413', async () => {
    const res = await postJson(JSON.stringify({ note: 'x'.repeat(11 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
