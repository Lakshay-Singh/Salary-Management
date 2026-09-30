# Salary Management

A web application that replaces ACME's salary spreadsheets. The HR Manager maintains salary records for 10,000 employees across multiple countries and gets clear answers to "how do we pay people?": by country, by role, and for any individual compared with their peers.

- **Employee directory:** server-side search, filters, sorting and paging across 10,000 employees.
- **Add, edit and delete** employees, with validation. Currency is set from the employee's country, and deleting asks for confirmation.
- **Pay insights:** headcount, minimum, maximum, average and median salary for each country, and a breakdown by job title within a country, each in that country's currency.
- **Peer position:** how an employee's salary compares with the average of peers who share their country and job title. It is shown as a percentage difference, labelled Below, At or Above average.
- **Deterministic seed:** the same 10,000 realistic employees on every machine and every run.

The system was built test-first in small increments: the commit history shows failing tests landing before the code that makes them pass.

## Important links

- [▶️ Watch the Video Demo here](https://drive.google.com/file/d/1T-LiLmNfSk7hBCd4q6EIc73OoV5lAAVg/view?usp=sharing)
- **Live application:** the frontend runs on Vercel, and the API on Railway with its PostgreSQL database on Neon.

  | | |
  |---|---|
  | Frontend (Vercel) | https://salary-management-alpha.vercel.app |
  | API (Railway, database on Neon) | https://salary-management-production-8fc1.up.railway.app/api/health |

**Demo Credentials for Live App:**
- **Username:** `hr.manager`
- **Password:** `local-dev-password`

## Documentation

| Document | What it covers |
|---|---|
| [docs/requirements.md](docs/requirements.md) | The one-page requirements: goal, core features, what is deliberately left out and why, key assumptions |
| [docs/architecture.md](docs/architecture.md) | System design: the layered backend, the frontend structure, the API route map and the key technical decisions |
| [docs/ai_workflows.md](docs/ai_workflows.md) | How AI was used: the test-first loop, human ownership of decisions, real prompts and iterative fixes |
| [CLAUDE.md](CLAUDE.md) | The standing engineering rules the AI pair programmer followed throughout |

## Tech stack

- **Frontend:** React 19 with Vite, TypeScript, Tailwind CSS 4, shadcn/ui, React Router and TanStack Query
- **Backend:** Node.js with Express 5 and TypeScript, zod for validation, and JWT with bcrypt for the single HR login
- **Database:** PostgreSQL, accessed through Prisma (Neon in production, Docker locally)
- **Testing:** Jest and Supertest for the backend, Vitest and Testing Library for the frontend
- **Hosting:** Vercel (frontend), Railway (API), Neon (database)

## Repository layout

| Path | Contents |
|---|---|
| `backend/` | Express API: routes, controllers, services and repositories, pure domain logic in `src/domain/`, and the Prisma schema, migrations and seed |
| `frontend/` | React app, organised by feature (`auth`, `employees`, `insights`), with shared UI components |
| `docs/` | Requirements, architecture and AI workflow notes |
| `docker-compose.yml` | Local PostgreSQL for development and the integration tests |

## Running locally

**Prerequisites:** Node.js 22 or newer, and Docker with Compose (for example Docker Desktop).

### 1. Install dependencies

```bash
git clone https://github.com/Lakshay-Singh/Salary-Management.git
cd Salary-Management
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the local database

From `backend/`:

```bash
npm run db:up
```

This starts PostgreSQL 16 from the root `docker-compose.yml` and waits until it is ready. It listens on port **5433**, so it never clashes with a PostgreSQL already installed on 5432. Stop it later with `npm run db:down`; the data is kept in a Docker volume.

### 3. Configure the API

In `backend/`, copy the template and fill it in:

```bash
cp .env.example .env
```

For local development:

```dotenv
PORT=3001
DATABASE_URL=postgresql://salaries:salaries@localhost:5433/salaries
DIRECT_URL=postgresql://salaries:salaries@localhost:5433/salaries
ALLOWED_ORIGIN=http://localhost:5173
JWT_SECRET=<at least 32 random characters>
HR_USERNAME=hr.manager
HR_PASSWORD_HASH='<bcrypt hash of your chosen password>'
```

Generate the two secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"   # JWT_SECRET
npm run hash-password -- 'choose-a-password'                                   # HR_PASSWORD_HASH
```

Keep the hash in single quotes, because it contains `$` characters. `PORT=3001` matters: the frontend's committed `frontend/.env.development` sends its requests to `http://localhost:3001`. The API checks every variable at start-up and refuses to start if one is missing or invalid, naming the variable.

### 4. Create the schema and load the 10,000 employees

From `backend/`:

```bash
npm run db:deploy   # applies the committed Prisma migration
npm run db:seed     # the deterministic seed; equivalent to: npx prisma db seed
```

- **Deterministic:** the seed uses a fixed-seed random number generator, so every machine gets the same 10,000 employees across 10 countries.
- **Safe to re-run:** it clears the tables first.
- **Empty country on purpose:** the United Kingdom has no employees, to show the "no employees" state.
- **Protects remote data:** it refuses to wipe any database that is not on localhost unless `SEED_CONFIRM=<database name>` is set.

### 5. Start the API and the frontend

Use two terminals:

```bash
cd backend && npm run dev    # API on http://localhost:3001, restarts on change
```

```bash
cd frontend && npm run dev   # app on http://localhost:5173
```

Check the API with `curl http://localhost:3001/api/health`. Then open http://localhost:5173 and sign in with `HR_USERNAME` and the password you hashed.

### 6. Run the tests

| Where | Command | What it runs |
|---|---|---|
| `backend/` | `npm test` | Unit tests against in-memory fakes. Fast, and needs no database |
| `backend/` | `npm run test:integration` | The Prisma repositories and the analytics SQL against real PostgreSQL. Needs `npm run db:up`. It uses its own `salaries_test` database, which is migrated automatically, and refuses to run against any database whose name does not end in `_test` |
| `frontend/` | `npm test` | Component and page tests with Vitest and Testing Library |
| `frontend/` | `npm run lint` and `npm run build` | Linting, type-checking and the production build |
