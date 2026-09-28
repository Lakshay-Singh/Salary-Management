# Salary Management — Architecture (v1)

Companion to [requirements.md](requirements.md). That document says *what* we build and *why*; this one says *how*.

## 1. System overview

Three independently deployed pieces:

| Piece | Host | Responsibility |
|---|---|---|
| Frontend | Vercel | Static React build; runs entirely in the HR Manager's browser |
| API | Railway | Express app: authentication, validation, business rules, all data access |
| Database | Neon | PostgreSQL; only the API holds its credentials |

The browser loads the app from Vercel, then calls the API on Railway directly (cross-origin, HTTPS, JSON). The browser never talks to the database.

```text
                    +--------------------------------+
                    |  Vercel: static React build    |
                    +--------------------------------+
                                    |
                                    | (1) browser downloads the app
                                    v
+-------------------------------------------------------------------------+
|  HR Manager's browser: React SPA                                        |
|  keeps the JWT in sessionStorage after login                            |
+-------------------------------------------------------------------------+
     |                                         |
     | (2) POST /api/auth/login                | (3) every other call
     |     username + password                 |     Bearer <JWT> header
     v                                         v
+-------------------------------------------------------------------------+
|  Express API (Railway)                                                  |
|                                                                         |
|  helmet -> cors (ALLOWED_ORIGIN only) -> JSON parser                    |
|    |                                         |                          |
|    v                                         v                          |
|  PUBLIC ROUTER                          requireAuth                     |
|  GET  /api/health                       verifies signature,             |
|  POST /api/auth/login                   expiry and HS256                |
|   - rate-limited                             |              |           |
|   - bcrypt.compare                   invalid |              | valid     |
|   - returns JWT (8h)                         v              v           |
|                                        401: SPA clears  PROTECTED       |
|                                        token, shows     ROUTERS         |
|                                        /login           controllers     |
|                                                         services        |
|                                                         repositories    |
+-------------------------------------------------------------------------+
                                                              |
                                                              | (4) SQL via Prisma
                                                              |     pooled, TLS
                                                              v
                                                   +---------------------+
                                                   |  PostgreSQL (Neon)  |
                                                   +---------------------+
```

**Request pipeline inside the API:** `helmet → cors → JSON parser → public router (health, login) → requireAuth → protected routers → 404 handler → error handler`

**Configuration:**

| Where | Variable | Purpose |
|---|---|---|
| Vercel | `VITE_API_URL` | API base URL, baked in at build time |
| Railway | `DATABASE_URL` | Neon pooled connection, used at runtime |
| Railway | `DIRECT_URL` | Neon direct connection, used only by migrations |
| Railway | `ALLOWED_ORIGIN` | The Vercel production origin allowed by CORS |
| Railway | `JWT_SECRET` | Signs and verifies tokens |
| Railway | `HR_USERNAME`, `HR_PASSWORD_HASH` | The single login. The password exists only as a bcrypt hash, generated once with `backend/scripts/generate-hash.ts` |

**Deployment:**
- Railway builds from `backend/` and runs `prisma migrate deploy` as its pre-deploy step. Seeding is a manual one-off command, never part of a deploy, because it resets employee data.
- Vercel builds from `frontend/`. A rewrite serves `index.html` for every path so deep links like `/employees/42` don't 404.
- Neon's free tier suspends idle compute, so the first request after a quiet period can take about a second. Accepted for v1.

**Repository layout:**

```
Salary-Management/
├── backend/             Express API, deployed to Railway
├── frontend/            React SPA, deployed to Vercel
├── docs/                Requirements, architecture, decision notes, AI prompts
├── docker-compose.yml   Local PostgreSQL for development and integration tests
└── .github/workflows/   CI: typecheck, lint and test both apps on every push
```

`backend/` and `frontend/` are separate npm projects with no shared package, so each deploys from its own folder. Tests on both sides keep the API contract honest.

## 2. Backend structure

```
backend/
├── prisma/
│   ├── schema.prisma     Data model; single source of truth for the database
│   ├── migrations/       Generated SQL migrations, committed and applied on deploy
│   └── seed/             Deterministic 10,000-employee seed and its reference data (names, titles, salary bands)
├── scripts/
│   └── generate-hash.ts  One-off: turns a plain password into the bcrypt hash stored in HR_PASSWORD_HASH
├── src/
│   ├── server.ts         Entry point: load config, build the app, listen
│   ├── app.ts            Builds the Express app from injected dependencies; no listen(), so tests import it directly
│   ├── config/           Reads and validates env vars at startup; the app refuses to boot if one is missing
│   ├── routes/           Maps URLs to controllers; separates the public router from the protected ones
│   ├── controllers/      HTTP only: take validated input, call a service, choose status code and response shape
│   ├── services/         Use cases (list employees, compute peer position…); no Express, no Prisma
│   ├── repositories/     The only code that touches Prisma, including the raw SQL for analytics
│   ├── domain/           Pure business rules with no I/O: peer-position classification, pagination limits
│   ├── validation/       Zod schemas for request bodies, route params and query strings
│   ├── middleware/       requireAuth, validate, login rate limiter, 404 handler, error handler
│   ├── errors/           Typed application errors (NotFound, Validation, Unauthorized) and their HTTP status
│   └── lib/              Infrastructure helpers: Prisma client, logger, JWT and password hashing
└── tests/
    ├── unit/             Domain, services and routes against in-memory fake repositories; no database, milliseconds
    ├── integration/      Repositories and key API flows against a real PostgreSQL test database
    └── helpers/          Test data builders, database reset, token helper
```

Dependencies point one way: `routes → controllers → services → repositories + domain`. Services depend on repository interfaces. `app.ts` is the composition root: it wires Prisma-backed repositories in production and in-memory fakes in unit tests.

## 3. Frontend structure

```
frontend/
├── public/               Static files served as-is (favicon)
├── vercel.json           SPA rewrite so client-side routes survive a refresh
└── src/
    ├── main.tsx          Entry: mounts providers (router, query client, auth)
    ├── app/              App shell: route table, layout and navigation, ProtectedRoute
    ├── features/
    │   ├── auth/         Login page, auth context, token storage
    │   ├── employees/    Directory, detail page with peer position, add/edit form, delete confirmation
    │   └── insights/     Pay-by-country and pay-by-role screens
    ├── components/       Shared app components: DataTable, Pagination, ConfirmDialog, Money, EmptyState
    │   └── ui/           shadcn/ui primitives, generated into the repo; we own this code
    ├── lib/              API client (fetch wrapper), money formatting, query-string helpers
    └── test/             Vitest and Testing Library setup, MSW API mocks, render helpers
```

Each feature folder holds its own pages, components, API calls and data hooks, so code that changes together lives together. Tests sit next to the file they test (`*.test.tsx`).

**Libraries:** React Router for routing. TanStack Query for server state: caching, loading and error states, and refetching after edits. shadcn's DataTable (TanStack Table) in server-driven mode. react-hook-form with zod for forms; the zod rules mirror the backend's for instant feedback, but the server stays the authority.

**Screens:**

| Route | Screen |
|---|---|
| `/login` | Sign in |
| `/employees` | Directory: search, filters, sort, pagination |
| `/employees/new` | Add employee |
| `/employees/:id` | Employee detail with peer position |
| `/employees/:id/edit` | Edit employee |
| `/insights` | Pay by country |
| `/insights/:countryCode` | Pay by role within one country |

## 4. API route map

All paths are under `/api`; requests and responses are JSON.

| Method | Path | Description | Auth required |
|---|---|---|---|
| GET | `/api/health` | Liveness check for Railway | No |
| POST | `/api/auth/login` | Exchange username and password for a JWT | No |
| GET | `/api/employees` | Paginated list. Query: `page`, `pageSize`, `search`, `country`, `jobTitle`, `sortBy`, `sortOrder` | Yes |
| POST | `/api/employees` | Create an employee | Yes |
| GET | `/api/employees/:id` | One employee | Yes |
| PUT | `/api/employees/:id` | Replace an employee's editable fields | Yes |
| DELETE | `/api/employees/:id` | Permanently delete an employee | Yes |
| GET | `/api/employees/:id/peer-position` | Salary against peers: peer count, peer average, % difference, label | Yes |
| GET | `/api/countries` | Supported countries with their currency codes (form dropdown, filters) | Yes |
| GET | `/api/job-titles` | Distinct existing job titles, optionally for one `country` (autocomplete, filters) | Yes |
| GET | `/api/analytics/countries` | Every country: headcount, min, max, average and median salary | Yes |
| GET | `/api/analytics/countries/:countryCode/job-titles` | One country, per job title: headcount, min, average and max salary | Yes |

**Conventions:**
- **Status codes:** 200 for reads and updates, 201 for create (returns the new employee), 204 for delete, 400 for validation errors, 401 for a bad token or bad credentials, 404 for an unknown employee or country, 429 for too many login attempts, 500 for anything unexpected.
- **Errors:** every error has the same shape: a machine-readable code, a human-readable message and, for validation failures, per-field details the form shows next to each input.
- **PUT, not PATCH:** the form always sends all editable fields, and a full replace is simpler to validate.
- **Peer position is its own endpoint:** the employee resource stays plain, and the detail page loads the comparison independently.

## 5. Key technical decisions

### JWT authentication
- **Password hash:** generated once with `bcrypt.hash(password, 12)` (cost factor 12, the current recommendation) by the one-off script `backend/scripts/generate-hash.ts`, and stored in `HR_PASSWORD_HASH`. The plain password is never stored anywhere, env vars included.
- **Login:** checks the username against `HR_USERNAME` and the password against `HR_PASSWORD_HASH` with `bcrypt.compare`. On success it returns an HS256 token signed with `JWT_SECRET`, valid for 8 hours (a working day), with no refresh token. On failure it returns one generic 401, whichever field was wrong.
- **Rate limiting:** the login route is rate-limited per IP because the API is on the public internet. Express is configured to trust Railway's proxy so the limiter sees the real client IP.
- **Protected by default:** the public router (health, login) is mounted first, then `requireAuth`, then every other router. A new route is protected unless someone deliberately adds it to the public router.
- **requireAuth:** reads the `Authorization: Bearer` header, verifies signature and expiry with the algorithm pinned to HS256, and attaches the user to the request. Anything else gets a 401.
- **Header, not cookie:** the SPA (`vercel.app`) and the API (`railway.app`) are different sites, so an auth cookie would be a third-party cookie. Safari already blocks those and other browsers are following. A header works everywhere and removes CSRF as a concern.
- **In the browser:** the token lives in sessionStorage, so it survives a refresh and is gone when the tab closes. The API client attaches it to every request; any 401 clears it and redirects to `/login`. The trade-off is that JavaScript can read it, so an XSS bug would expose it. React's output escaping, no raw HTML rendering and the short expiry limit that risk.

### Pagination, filtering and sorting
- **Offset pagination** (`page`, `pageSize`): HR expects "page 3 of 400" and jumping between pages, and at 10,000 rows the offset cost is negligible. Cursor pagination solves a scale problem we don't have.
- **Limits:** `pageSize` defaults to 25 and is capped at 100.
- **Safe sorting:** the query string is validated with zod before it reaches the controller. `sortBy` is an allow-list of columns mapped to Prisma's `orderBy`, so user input never reaches SQL. `id` is always added as a secondary sort so rows with equal values (the same salary, say) don't jump between pages.
- **Search and filters:** search is a case-insensitive partial match on full name. Filters are an exact country code and an exact job title. Everything combines with AND.
- **Consistent totals:** the page query and the total count run in one transaction.
- **Response:** the rows plus `page`, `pageSize`, `total` and `totalPages`.
- **Frontend:** page, filters and sort live in the URL query string, so refresh, the back button and shared links keep the view. The search box is debounced (~300 ms), and the current page stays on screen while the next one loads.

### Median
- **Postgres computes it** with `percentile_cont(0.5) WITHIN GROUP (ORDER BY salary)` in the same grouped query as headcount, min, max and average. One round trip returns the stats for every country.
- **The one raw query:** Prisma's `groupBy` covers count, min, max and average but not percentiles, so this query uses `$queryRaw` (a parameterised tagged template). It lives in the analytics repository and nowhere else.
- **Plain numbers out:** the SQL rounds average and median to whole currency units (matching storage) and casts counts to integers, so results serialise as plain JSON numbers instead of Prisma's BigInt and Decimal types.
- **`percentile_cont`, not `percentile_disc`:** a group with an even number of employees gets the mean of the two middle salaries, which is the standard median.
- **Not in Node:** computing it there would mean loading every salary into memory to sort it. The database does it in one pass, next to the data.
- **Tested against real Postgres:** because the logic is in SQL, integration tests cover it with tiny hand-built datasets (odd count, even count, a single employee).

### CORS for two deployments
- **Order:** `cors` runs before `requireAuth`, so browser preflight (`OPTIONS`) requests are answered without a token.
- **Origin:** an exact match on `ALLOWED_ORIGIN`, with no wildcard. If the variable is missing, the API refuses to start.
- **Allowed:** methods GET, POST, PUT and DELETE; headers `Content-Type` and `Authorization`; credentials off, because no cookies are used.
- **Preflight caching:** every authenticated call sends an `Authorization` header, which triggers a preflight. `maxAge` lets the browser cache it so each call doesn't cost two round trips.
- **Local development:** `ALLOWED_ORIGIN=http://localhost:5173`, and the SPA calls the API directly with no Vite proxy, so CORS behaves locally exactly as in production.
- **Vercel previews are not allowed:** preview URLs differ per deployment. Only the production frontend talks to the production API.
- **CORS is not access control:** it is a browser rule that curl ignores. The JWT is what protects the data.

### Also decided
- **Peer position:** the repository returns the count and average salary of employees with the same country and job title, excluding the employee. A pure domain function turns salary, peer average and peer count into the % difference and label. Fewer than 3 peers gives "Not enough peers"; within ±5% inclusive gives "At average"; otherwise "Below" or "Above". It is unit-tested at the boundaries: exactly 5%, exactly 3 peers.
- **Job-title lookup:** `/api/job-titles` is served by the `(countryCode, jobTitle)` composite index, so no separate index is needed. Filtered by country, it reads only that country's slice of the index; unfiltered, a DISTINCT over 10,000 rows takes milliseconds anyway.
- **Test layers:** domain rules are tested as pure functions. Services and routes are tested with in-memory fake repositories (supertest against `app.ts`), which is fast with no database. Repositories and raw SQL run against real Postgres: Docker locally, a service container in CI, tables truncated between tests. The frontend uses Vitest, Testing Library and MSW.
- **Errors:** services throw typed errors, and one error handler maps them to a status and the shared error shape. Unknown errors return a generic 500; stack traces are logged, never sent to the client.
- **Configuration:** env vars are validated with zod at boot, so a missing `JWT_SECRET` fails the deploy rather than the first login.
