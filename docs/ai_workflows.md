# AI Workflows: How This Project Was Built With AI

This document explains how I built the Salary Management system with an AI pair programmer, Claude Code (Anthropic), working inside VS Code. It covers how the work was planned and sliced, how tests drove each feature, how responsibility was split between me and the AI, and real prompts from the build.

Everything here can be checked against the repository: the commit history, [CLAUDE.md](../CLAUDE.md), and the documents in `docs/`.

## At a glance

| | |
|---|---|
| AI tool | Claude Code (Anthropic) in VS Code, one long-running session from the first alignment pass to submission |
| My role | Product owner, architect and reviewer: set the scope, wrote each increment's spec, reviewed and committed the results |
| AI's role | Pair programmer: drafted tests and code, ran the suites, raised risks, and checked behaviour in a real browser |
| Standing instructions | [CLAUDE.md](../CLAUDE.md), committed on day one (`913ed43`) and read automatically at the start of every session |
| History | 71 commits: 26 `test`, 20 `feat`, 6 `refactor`, 5 `fix`, 6 `docs`, 6 `chore`, 1 `style`, plus the brief itself |
| Backend tests | 163 unit tests (about 10 seconds, no database), plus an integration suite against real PostgreSQL |
| Frontend tests | 132 tests in 17 files (Vitest and Testing Library) |

## 1. The development model

The split was deliberate: the AI brought speed to writing code and tests, and I kept the decisions. Every feature went through the same loop.

1. **I wrote the spec for the increment.** The prompt named the files, the test cases, the constraints and what "done" meant.
2. **Claude wrote the failing tests first** and ran them. It reported why each one failed, and we moved on only when the reason was the missing behaviour, not a typo or a broken import.
3. **I reviewed the tests and committed them red.**
4. **Claude wrote the minimum code to make them pass,** then ran the full suites, the linter and the type-checking build.
5. **I reviewed the implementation and committed it green.**
6. **Refactoring came as separate commits,** with every test still passing after each one.

[CLAUDE.md](../CLAUDE.md) turned the craft rules into instructions the AI followed at every step:
- strict red-green-refactor, with failing tests committed first;
- the layered architecture (routes, controllers, services, repositories, plus pure domain functions);
- no `any`, and environment variables validated with zod at boot;
- salaries as whole-number integers;
- "Ask before adding features, changing the schema, or restructuring folders".

That last rule kept the AI from quietly widening the scope.

## 2. Our workflow

### 2.1 From the brief to a plan

No code was written until the problem was understood. My first prompt set the order:

> Before we write a single line of code, I want you to:
>
> 1. Understand the problem space — who the user is, what pain they have, what "done" looks like

The planning documents came next. Each was reviewed and committed before the next was started.

1. **[requirements.md](requirements.md):** core features, nice-to-haves, and what is deliberately out of scope, with a reason for each. I chose the stack and the two-service deployment, and confirmed the product defaults:
   - salaries in each country's local currency;
   - current salary only;
   - hard delete with confirmation;
   - a single-user login.

   I also added peer position to the core scope, because:

   > It directly answers the HR manager's #1 question: "Are we paying this person fairly?"
2. **[architecture.md](architecture.md):** the system overview, backend and frontend structure, the API route map, and the key technical decisions (JWT, pagination, the median computed in PostgreSQL, CORS for two separate deployments).
3. **[schema.prisma](../backend/prisma/schema.prisma):** the data model, reviewed before any backend code existed.

The architecture was then cut into increments, each small enough to review in one sitting. In the history, each increment's tests land before its implementation:

| Increment | Tests | Implementation |
|---|---|---|
| Login endpoint with rate limiting | `9d3af56` | `9b93aed` |
| A: Peer-position domain rules | `2bc21bc` | `829f53d` |
| B: Create, read, update and delete employees | `27a9688` | `a45fba1` |
| C: Employee list with paging, filters and sorting | `5fb9d5b` | `1d77899` |
| D: Peer-position endpoint | `0ce3084` | `ddbf149` |
| E: Countries and job-titles endpoints | `9913f0c` | `1ecf3ac` |
| F: Pay analytics with a PostgreSQL median | `3afa318` | `fcea3e2` |
| G: Prisma repositories behind shared contracts | `3f782fb` | `0dcc292` |
| H: Deterministic 10,000-employee seed | `fa8f875` | `d070890` |
| Frontend foundation: API client, token storage, route guard | `790206f` | `ccb62b7` |
| Login page | `66f2dbe` | `64798f6` |
| Employee directory | `f758cd9` | `5a2177c` |
| Add, edit and delete employees | `197650e` | `8cb33cd` |
| Pay insights by country and by role | `e04835a` | `cc708a3` |
| Peer position on the edit page | `3199f04` | `d844713` |
| Sign-out confirmation | `5d21269` | `d5ba03d` |

### 2.2 TDD in practice

"Red" meant more than "the tests fail". Here is one example. When the job-title autocomplete replaced the browser's datalist, seven new tests failed because the suggestion list did not exist yet. An eighth passed against the old field. That was expected, because it guarded behaviour the new field had to keep (marking the field invalid when left blank), so we noted it rather than forcing it red.

A few commits did not follow the red-then-green pattern:
- **Scaffolding** (`6d0b4b1`) came before its tests (`7b43422`). There was no behaviour to specify until the wiring existed.
- **Visual-only changes have no unit tests,** because the test environment (jsdom) does no layout. These were the design system (`69b1fbd`), the light-mode fix for browser pop-ups (`2e58da5`) and the mobile header (`30ef3fa`). The design system's colours were checked with a contrast-ratio script. The mobile header was checked with screenshots from real Chrome at five widths.
- **The autocomplete's tests** were run red against the old field before any implementation existed, but they were committed together with it (`75a1338`).

### 2.3 Fast, deterministic tests

- **Fast by design.** Services depend on repository interfaces, so the backend unit suite runs against in-memory fakes: 163 tests in about 10 seconds, with no database.
- **Fakes that cannot drift.** The same 28 repository contract cases run against the in-memory fakes (unit suite) and the Prisma repositories on real PostgreSQL (integration suite). If a fake behaves differently from the database, a contract fails.
- **A real database where it matters.** The analytics SQL and the repositories are tested against PostgreSQL in Docker, one test at a time. The setup refuses to run unless the database name ends in `_test`, so a misconfigured URL cannot wipe real data.
- **Deterministic data.** The seed uses a seeded Mulberry32 random-number generator instead of `Math.random()`, so every machine gets the same 10,000 employees. The generator has its own unit tests.
- **Tests that read like requirements.** The frontend tests find elements by their role and name, the way a user or screen reader would (for example "the alert dialog named 'Sign out?'"), rather than by CSS selectors. That keeps them readable, and each one doubles as a small accessibility check.
- **Flakiness treated as a bug.** When the frontend suite began failing now and then under parallel load, we measured the cause before changing anything (see section 5).

### 2.4 Clean code

- **Layers do one job each.** Routes validate and delegate, controllers map results to HTTP, services hold the business logic, and repositories own every query. The peer-position rules are pure functions in `backend/src/domain/`.
- **Configuration fails fast.** It is validated with zod at boot, so a missing variable stops the server at start-up rather than at the first request.
- **Errors are typed.** Services throw `AppError` subclasses, which one error handler maps to HTTP responses.
- **Duplication was removed promptly, in separate `refactor` commits:**
  - a shared test helper (`1abc0c5`);
  - validation errors built in one place (`9b198ea`);
  - the percentage calculation moved into the domain layer (`a330ea6`);
  - the repository contracts run against the fakes too (`0efb301`).
- **The documents stayed true to the code.** When the implementation settled a detail differently from the plan, the architecture document was corrected (`048d9b8`, `23263fd`).

## 3. Extreme ownership and quality

Claude drafted most of the code. I owned what was built and why, in four ways.

**I set the direction.** I chose the stack and the deployment model, confirmed the product defaults, and added peer position to the core scope. Each increment's prompt specified the files, test cases and constraints, so the AI filled in a design rather than inventing one.

**I kept review gates.** The first TDD prompt made the checkpoint explicit:

> Stop here. Do not write any implementation yet.
> Tell me when the tests are written so I can review them.
> Then we commit the failing tests before writing any code.

Every commit in the history is mine, made after reviewing the change. The one exception is the design-system commit (`69b1fbd`): Claude created it at my request, and it carries a `Co-Authored-By` trailer.

**I owned the numeric edge cases.** Salaries are money, so the arithmetic had to be exact.

- **Integers only.** CLAUDE.md fixes the rule: salary is always an `Int` in whole currency units, never `Float` or `Decimal`. Currency comes from the employee's country and is never stored on the employee.
- **Rounding bias.** I specified the failing cases down to the expected values:

  > The bug: Math.round rounds exact halves toward +∞, so negative halves
  > round the wrong way (less negative), and −0 is produced instead of 0.

  The three tests went red (`d0e5194`). The fix (`2c7c923`) rounds halves away from zero and turns −0 into 0. The analytics SQL rounds averages and medians as `numeric` for the same reason, because `double precision` would round halves to the nearest even number.
- **Database limits.** I asked for tests at PostgreSQL's integer boundary:

  > We need to prevent 500 errors when users pass IDs or salaries that exceed Postgres's 32-bit INTEGER limit (2,147,483,647).

  The tests (`b9349bd`) came first, then the fix (`26f9cf0`). Out-of-range ids now return "not found", and salaries above `MAX_DB_INTEGER` (`backend/src/domain/limits.ts`) are rejected with a 400 validation error instead of crashing the query.
- **The median** is computed in PostgreSQL with `PERCENTILE_CONT`, instead of loading 10,000 salaries into Node.

**I corrected the AI when it was wrong, and decided when it pushed back.**

Corrections I made:
- I corrected the documents: bcrypt cost 12, generated once with a one-off script (`backend/scripts/generate-hash.ts`), and an ASCII diagram instead of Mermaid, for readability.
- After editing architecture.md myself, I had Claude re-read it before continuing ("check for architecture.md first, inspect it again"), so it would not work from an outdated version.
- I rejected the first job-title combobox, which put a second search box inside its popup, and wrote a tighter spec for the autocomplete that replaced it.

Risks Claude raised, where I made the call:
- a darker input border (slate-500), to meet WCAG contrast;
- self-hosting the Inter font instead of loading it from Google Fonts, to avoid sending users' IP addresses to Google (a GDPR concern);
- dropping a planned `currencyMap` prop, because the API already returns each employee's currency.

Claude also paused to confirm before running a pasted setup script. That script would have linked the repository to the production database branch and deployed to it.

## 4. Prompt examples

These are three real prompts from the build, copied word for word, typos included. Each follows the same pattern: scope, constraints and the definition of done stated up front, and tests before code.

### Example 1: Setting up the Express backend, then the first red step

The scaffold prompt decided what had to be real on day one and what could wait:

```text
Schema is committed. Scaffold the backend now.

Working dir is backend/. Set up package.json with express, prisma, zod, jsonwebtoken, bcrypt, cors, helmet, express-rate-limit and their types. jest + ts-jest + supertest for tests.

Follow the architecture doc for src/ structure — routes, controllers, services, repositories, middleware, lib. Stubs are fine for now except:
config.ts should validate env vars with zod and fail at boot if anything's missing, app.ts should wire the full middleware chain as documented,
and requireAuth + errorHandler should be real implementations.

GET /api/health returns 200. That's the only working route.
Add .env.example with all var names but no values.
```

The next prompt started strict TDD with the first feature, login:

```text
Follow strict TDD: Red - Green - Refactor.

RED: Write the tests only.
File: tests/integration/auth.test.ts

Test cases:
- valid credentials, 200 + { token: string }
- wrong username, 401, same generic message as wrong password
- wrong password, 401
- missing fields, 400 with validation errors
- empty string fields, 400
- 6th request in window, 429

Stop here. Do not write any implementation yet.
Tell me when the tests are written so I can review them.
Then I will commit the failing tests before writing any code.
```

**Why it worked.** The scaffold was bounded: stubs everywhere except the pieces every later increment depends on (fail-fast configuration, the full middleware chain, and real authentication and error handling). The red-step prompt listed the exact cases, including two security details: a wrong username and a wrong password return the same message, and the sixth attempt is rate-limited. It also ended at a review gate.

**Result.** Scaffold in `5d8424b` and `6d0b4b1`, failing login tests in `9d3af56`, implementation in `9b93aed`.

### Example 2: The deterministic seed script

```text
Increment H Seed Script

Write a deterministic script to seed the database so the frontend has realistic data to build against.

File to create: prisma/seed.ts

Requirements:
1. Truncate existing tables first (employees, then countries) so the script is idempotent.
2. Insert the fixed reference list of countries. Ensure at least one country receives 0 employees (e.g. GB) so we can see it correctly excluded from the analytics endpoints.
3. Generate exactly 10,000 employees.
4. The generation MUST be deterministic. Use a seeded PRNG (like a simple Mulberry32 or LCG implementation, or a deterministic library) instead of Math.random(), so every developer gets the exact same 10,000 rows.
5. Make the data vaguely realistic: distribute across a few job titles, and base the salary on a realistic range for the country and title.
6. Insert them efficiently using prisma.employee.createMany (in batches if necessary).

Add "prisma": { "seed": "ts-node prisma/seed.ts" } to package.json so it runs on `npx prisma db seed`.

Run the seed script against the local Postgres instance. Start the server and hit a few endpoints to confirm it's fast and working.
```

**Why it worked.** The prompt asked for:
- determinism, from a seeded generator rather than `Math.random()`;
- idempotency, by clearing the tables first;
- a deliberately empty country, to exercise an edge case in the analytics;
- a real check at the end: run the seed, start the server and call the endpoints.

**Result.** The generator (`backend/prisma/seed/generate.ts`, using Mulberry32) has its own unit tests (`fa8f875`), and the seed (`d070890`) loads the same 10,000 employees on every machine with `npx prisma db seed`.

### Example 3: The Insights page

```text
Insights page, pay by country and by role.

The InsightsPage at /insights needs two sections. The first is the country overview table, fetched from GET /api/analytics/countries. Columns: Country, Currency, Headcount, Min, Average, Median, Max with salaries formatted using formatSalary.

The second section appears when the user picks a country from a dropdown: it fetches GET /api/analytics/countries/:countryCode/job-titles and shows a table with Job Title, Headcount, Min, Average, Max. This request only fires once a country is selected.

Both tables should have loading skeletons and empty/error states. The selected country should be kept in the URL (?country=IN) so the view is shareable and survives reload.

Tests first. Cover: countries table renders with mocked data, picking a country triggers the job-titles fetch and renders that table, the country selection is reflected in the URL.
```

**Why it worked.** It defined:
- what matters to an HR manager: which numbers, in which currency;
- a performance rule: the per-role request only fires once a country is chosen;
- a product rule: the chosen country lives in the URL, so a view can be shared and survives a reload.

And it opened the test list with "Tests first".

**Result.** Failing tests in `e04835a`, implementation in `cc708a3`. A follow-up closed a gap: after an employee was changed, the insights could show outdated numbers. A red test (`b2c2157`) and a fix (`5f739bc`) followed, and the architecture document was corrected to match the `?country=` URL (`23263fd`).

## 5. Iterative problem solving

Most of the progress came from short loops: find the problem, write a test that shows it, fix it, verify it, commit it.

- **Framework surprises were fixed at the source.**
  - Express 5 makes `req.query` read-only, so validated query parameters are passed on through `res.locals` instead.
  - Prisma's text search treats `%` and `_` as wildcards, so search text is escaped first.
  - Distinct job titles are grouped in the database rather than de-duplicated in Node.
- **A stale-data bug got a red test before its fix.** Changing an employee did not refresh the pay insights (`b2c2157`, then `5f739bc`).
- **The job-title field took two iterations.** Chrome on Windows in dark mode drew the native datalist as a black pop-up that cannot be styled. The first replacement, a combobox with a search box inside its popup, was rejected. The second is a plain text field with a styled suggestion list (`75a1338`, with the pop-up colour fix in `2e58da5`). Two details came out of that work:
  - **No automatic highlight.** The list library highlights the first match by default, so pressing Enter would replace a new title ("Engineer") with an existing one ("Engineering Manager"). Now nothing is highlighted until the user moves into the list.
  - **Case correction.** A title typed in a different case ("software engineer") snaps to the existing spelling, so capitalisation never splits a peer group.
- **Flaky tests were measured before they were fixed.** When the frontend suite failed intermittently, Claude re-ran the previous commit in a separate copy of the repository (a git worktree). The timing margins had already been thin before the change. The fix went at the cause:
  - a 3-second limit when tests wait for the page to appear;
  - pasting the job title when a test only needs the form filled in, instead of typing it key by key.

  The fix was accepted only after five clean full-suite runs in a row (`1a955bd`).
- **A reported bug led to a wider check.** I reported the header squeezing onto one line on phones. Claude checked the fix in real Chrome at 320, 360, 375, 640 and 1280 pixels wide, and found that the narrowest screen still cut off "Sign out". Letting that row wrap fixed it (`30ef3fa`).

The pattern throughout: the AI made the work fast, and the specs, review gates and tests kept it correct.
