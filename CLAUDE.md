# AI Collaboration Guide — Salary Management

Claude Code reads this file automatically at the start of every session.
It defines the engineering standards and constraints for this project.
Read docs/requirements.md and docs/architecture.md before building anything new.

## Project Context

An HR salary management system for 10,000 employees across multiple countries.
Deployed as two independent services: Express API on Railway, React/Vite frontend on Vercel, PostgreSQL on Neon.

**Stack**
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
- Frontend: React (Vite), TypeScript, Tailwind CSS, shadcn/ui
- Testing: Jest + Supertest (backend), Vitest + Testing Library (frontend)

## TDD — Strict Red-Green-Refactor

1. Write failing tests first. Never write implementation before tests exist.
2. Commit the failing tests before writing any implementation.
3. Write the minimum code to make the tests pass. Then refactor.
4. Tests must be fast, deterministic, and self-explanatory without comments.

## Architecture Constraints

Follow the layered architecture in docs/architecture.md:
- **Routes** — parse and validate the HTTP request, call a controller, nothing else.
- **Controllers** — call a service, map the result to an HTTP response. No DB access.
- **Services** — business logic only. No HTTP concepts (req, res, status codes).
- **Repositories** — all Prisma queries and raw SQL. No business logic.
- **Domain** — pure functions with no side effects. Easy to unit test in isolation.

## Domain Rules

- `salary` is always an `Int` (whole currency units). Never `Float`, never `Decimal`.
- Currency is derived from the employee's country. Never store currency on the employee.
- Peer position requires at least 3 peers. Fewer returns "Not enough peers".
- "At average" means within ±5% of the peer group average.

## Code Quality

- No `any` in TypeScript. Use `unknown` and narrow explicitly.
- All environment variables validated with zod in `src/config/config.ts` at boot.
- SOLID: one responsibility per module. Depend on abstractions, not implementations.
- DRY: extract duplicated logic before it appears a third time.
- Errors: throw typed `AppError` subclasses from services. The error handler maps them to HTTP responses.

## Commits

- One logical change per commit. Keep commits small and independently reviewable.
- Format: `type: short description` (feat, fix, test, chore, refactor, docs)
- Commit red (failing) tests before green (passing) implementation.
- Never commit: `node_modules/`, `.env`, `dist/`, generated Prisma client.

## Scope

Build only what is in docs/requirements.md. Ask before adding features, changing the schema, or restructuring folders.
