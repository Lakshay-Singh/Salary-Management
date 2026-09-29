import { useId, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useCountries } from '@/features/employees/useReferenceData'
import { ApiError } from '@/lib/api'
import { formatSalary } from '@/lib/formatSalary'
import type { CountryStats, JobTitleStats } from './insightsApi'
import { type StatsColumn, StatsTable } from './StatsTable'
import { useCountryStats, useJobTitleStats } from './useInsights'

const formatCount = (count: number) => count.toLocaleString('en-US')

const countryLink = (countryCode: string) => ({ search: `?${new URLSearchParams({ country: countryCode })}` })

export function InsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The chosen country lives in the URL, so a reload or a shared link opens the same breakdown
  const country = (searchParams.get('country') ?? '').toUpperCase()
  const chooseCountry = (countryCode: string) => setSearchParams(countryCode ? { country: countryCode } : {})

  const countries = useCountries()
  const countryStats = useCountryStats()
  const jobTitleStats = useJobTitleStats(country)

  const countriesByCode = useMemo(
    () => new Map((countries.data ?? []).map((entry) => [entry.countryCode, entry])),
    [countries.data],
  )
  const nameOf = (countryCode: string) => countriesByCode.get(countryCode)?.name ?? countryCode
  const selected = countriesByCode.get(country)

  const overviewRows = [...(countryStats.data ?? [])].sort((a, b) =>
    nameOf(a.countryCode).localeCompare(nameOf(b.countryCode)),
  )

  const countryColumns: StatsColumn<CountryStats>[] = [
    {
      header: 'Country',
      cell: (row) => (
        <Link
          to={countryLink(row.countryCode)}
          className="font-medium underline-offset-4 transition-colors duration-150 hover:text-primary hover:underline"
        >
          {nameOf(row.countryCode)}
        </Link>
      ),
    },
    { header: 'Currency', cell: (row) => row.currencyCode },
    { header: 'Headcount', numeric: true, cell: (row) => formatCount(row.headcount) },
    { header: 'Min', numeric: true, cell: (row) => formatSalary(row.min, row.currencyCode) },
    { header: 'Average', numeric: true, cell: (row) => formatSalary(row.average, row.currencyCode) },
    { header: 'Median', numeric: true, cell: (row) => formatSalary(row.median, row.currencyCode) },
    { header: 'Max', numeric: true, cell: (row) => formatSalary(row.max, row.currencyCode) },
  ]

  // Pay by role carries no currency of its own: it is always the chosen country's
  const currency = selected?.currencyCode ?? ''
  const jobTitleColumns: StatsColumn<JobTitleStats>[] = [
    { header: 'Job Title', cell: (row) => <span className="font-medium">{row.jobTitle}</span> },
    { header: 'Headcount', numeric: true, cell: (row) => formatCount(row.headcount) },
    { header: 'Min', numeric: true, cell: (row) => formatSalary(row.min, currency) },
    { header: 'Average', numeric: true, cell: (row) => formatSalary(row.average, currency) },
    { header: 'Max', numeric: true, cell: (row) => formatSalary(row.max, currency) },
  ]

  const unknownCountry = jobTitleStats.error instanceof ApiError && jobTitleStats.error.status === 404
  const jobTitleError = unknownCountry
    ? `${country} is not a supported country.`
    : jobTitleStats.isError
      ? 'Could not load pay by role.'
      : undefined

  const byCountryHeading = useId()
  const byRoleHeading = useId()

  return (
    <section className="space-y-10">
      <div className="space-y-1">
        <h1>Insights</h1>
        <p className="text-sm text-muted-foreground">
          How ACME pays people, country by country and role by role. Figures are annual gross salaries in each
          country's own currency, so they are compared within a country and never averaged across currencies.
        </p>
      </div>

      <section aria-labelledby={byCountryHeading} className="space-y-3">
        <div className="space-y-1">
          <h2 id={byCountryHeading}>Pay by country</h2>
          <p className="text-sm text-muted-foreground">
            The median is the middle salary: half earn less and half earn more, so a few very high earners move it
            less than the average. Choose a country to see its pay by role.
          </p>
        </div>
        <StatsTable
          labelledBy={byCountryHeading}
          columns={countryColumns}
          rows={overviewRows}
          rowKey={(row) => row.countryCode}
          isLoading={countryStats.isLoading || countries.isLoading}
          errorMessage={countryStats.isError ? 'Could not load pay by country.' : undefined}
          onRetry={() => countryStats.refetch()}
          emptyMessage="No salary data yet. Add employees to see pay by country."
        />
      </section>

      <section aria-labelledby={byRoleHeading} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 id={byRoleHeading}>Pay by role</h2>
            <p className="text-sm text-muted-foreground">
              {selected ? `Every job title in ${selected.name}, in ${selected.currencyCode}.` : 'Job titles within one country.'}
            </p>
          </div>
          <NativeSelect
            aria-label="Country"
            className="w-full sm:w-56"
            value={country}
            onChange={(event) => chooseCountry(event.target.value)}
          >
            <NativeSelectOption value="">Choose a country</NativeSelectOption>
            {countries.data?.map((entry) => (
              <NativeSelectOption key={entry.countryCode} value={entry.countryCode}>
                {entry.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {country ? (
          <StatsTable
            labelledBy={byRoleHeading}
            columns={jobTitleColumns}
            rows={jobTitleStats.data ?? []}
            rowKey={(row) => row.jobTitle}
            isLoading={jobTitleStats.isLoading || countries.isLoading}
            errorMessage={jobTitleError}
            onRetry={unknownCountry ? undefined : () => jobTitleStats.refetch()}
            emptyMessage={`No employees in ${selected?.name ?? country} yet.`}
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            Choose a country to see pay by role.
          </div>
        )}
      </section>
    </section>
  )
}
