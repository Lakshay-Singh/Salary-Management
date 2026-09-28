# Salary Management — Requirements (v1)

## 1. Goal

Replace ACME's salary spreadsheets with a web app where the HR Manager maintains salary records for ~10,000 employees across multiple countries and gets trustworthy answers to "how do we pay people?" — by country, by role, and for any individual against their peers. v1 is done when every question that used to need a pivot table takes a couple of clicks.

## 2. Core Features (v1)

1. **Sign in** — a single HR Manager account. Every screen and API route except login requires it.
2. **Employee directory** — all employees in a paginated table showing employee ID (names repeat across 10,000 people), full name, job title, country and salary. Search by name (partial, case-insensitive), filter by country and job title, sort by any column. Paging, filtering and sorting happen on the server.
3. **Add / edit employee** — full name, job title, country, annual salary. Rejects a blank name or title, an unknown country, and any salary that isn't a positive whole number. Currency is set automatically from the country.
4. **Delete employee** — permanent, behind a confirmation step.
5. **Pay by country** — for every country: headcount, min, max, average and median salary, each in that country's currency.
6. **Pay by role within a country** — for a chosen country, each job title's headcount, min, average and max salary.
7. **Peer position** — on an employee's detail page: their salary against the average of their peers (same country and job title), shown as a % difference and a label: **Below / At / Above average**. Answers "are we paying this person fairly?"
8. **Seed data** — a script that loads 10,000 realistic employees and produces the same data on every run.

Insights are presented as tables in v1.

## 3. Nice-to-Have (not in v1)

In priority order:

1. CSV export of the current filtered view
2. CSV / Excel import for bulk migration
3. Cross-country comparison in one reporting currency (static exchange-rate table)
4. Salary history and audit trail (who changed what, when)
5. Pay distribution (percentiles) and outlier flags
6. Charts
7. More fields: department, hire date, employment type
8. Bulk salary adjustments (e.g. +5% for one country)
9. Employment status (leavers kept, excluded from metrics) in place of hard delete

## 4. Deliberately Out of Scope

- **Payroll processing** (tax, deductions, payslips, payouts) — this tool records and explains pay; paying people is a different product.
- **Bonuses, equity, allowances, benefits** — base salary answers the core questions; each of these brings its own model and rules.
- **Signup, multiple users, roles/RBAC, SSO, approval workflows** — one persona, one user.
- **Employee self-service** — a different persona with different privacy needs.
- **Live exchange rates, HRIS or accounting integrations** — external dependencies add failure modes and non-determinism without answering a v1 question.
- **Pay-equity analysis by gender or other protected attributes** — requires sensitive personal data with legal obligations; it deserves its own design, not a bolt-on.
- **Mobile app, UI localisation** — one HR Manager, at a desktop, working in English.

## 5. Assumptions & Key Decisions

| Topic | Decision | Why |
|---|---|---|
| Salary | Annual gross base pay | The figure HR compares; variable pay is out of scope |
| Currency | Each employee is paid in their country's currency, derived from the country | One source of truth; per-country figures never mix currencies |
| Cross-currency maths | None in v1 | Averaging INR with USD gives a wrong answer, not a rough one |
| Money storage | Exact integer in whole currency units; never floating point | Floating-point rounding in money is a bug |
| Countries | Fixed reference list (~10), each with ISO country and currency codes | Validation removes "USA" vs "United States" |
| Job titles | Free text, trimmed; the form suggests existing titles | Keeps per-title stats clean without a premature controlled list |
| Names | Single "full name" field | Many naming cultures don't split into first/last |
| Average vs median | Country stats show both | Salaries are skewed; the median resists outliers |
| Peer group | Other employees with the same country and job title; the employee is excluded | A person is compared with others, not with themselves |
| "At average" | Within ±5% of the peer average; fewer than 3 peers shows "Not enough peers" | Small gaps aren't a fairness signal; tiny groups aren't comparable |
| Delete | Hard delete with confirmation | Matches how Excel works today; employment status is a nice-to-have |
| Salary history | Current salary only; schema shaped so salary can move to a history table later | YAGNI: no v1 question needs history |
| Auth | One user; credentials from env vars; JWT required on every API route except login | Salary data is sensitive even in a demo; a full auth system is out of scope |
| Concurrency | Last write wins | Single user |
| Metrics | Computed on request with SQL aggregation; no cache | 10,000 rows aggregate in milliseconds; a cache only adds staleness bugs |
| Scale | Server-side pagination, filtering and sorting | Never ship 10,000 rows to the browser |
| Seed data | Fixed random seed; realistic salary ranges per country × job title | Reproducible demos and tests; realistic ranges make the insights meaningful |
| Architecture | React (Vite, TypeScript, Tailwind, shadcn/ui) on Vercel · Express + TypeScript + Prisma on Railway · PostgreSQL on Neon · CORS limited to `ALLOWED_ORIGIN` | Frontend and API deploy independently; managed Postgres keeps data that serverless filesystems would lose |
