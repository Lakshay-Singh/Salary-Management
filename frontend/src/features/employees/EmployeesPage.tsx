import { ChevronLeft, ChevronRight, CircleAlert, Plus, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { EmployeeTable } from './EmployeeTable'
import { useDirectoryParams } from './useDirectoryParams'
import { useEmployeesList } from './useEmployeesList'
import { useCountries, useJobTitles } from './useReferenceData'
import { returnToState } from './useReturnTo'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

// Keep the chosen title listed even when the chosen country has nobody with it, so the dropdown never hides an active filter
function withSelected(titles: string[], selected: string): string[] {
  if (!selected || titles.includes(selected)) return titles
  return [...titles, selected].sort((a, b) => a.localeCompare(b))
}

const describeCount = (total: number) => `${total.toLocaleString('en-US')} ${total === 1 ? 'employee' : 'employees'}`

export function EmployeesPage() {
  const { params, changeView, goToPage } = useDirectoryParams()
  // The URL follows every keystroke; the request waits until typing pauses
  const search = useDebouncedValue(params.search, SEARCH_DEBOUNCE_MS)

  const employees = useEmployeesList({
    page: params.page,
    pageSize: PAGE_SIZE,
    search,
    countryCode: params.countryCode,
    jobTitle: params.jobTitle,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  })
  const countries = useCountries()
  const jobTitles = useJobTitles(params.countryCode)

  const countryNames = useMemo(
    () => Object.fromEntries((countries.data ?? []).map((country) => [country.countryCode, country.name])),
    [countries.data],
  )
  const totalPages = Math.max(employees.data?.totalPages ?? 1, 1)
  // Adding or editing returns to exactly this view: same filters, sort and page
  const backHere = returnToState(useLocation())

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1>Employees</h1>
          <p className="text-sm text-muted-foreground">Everyone at ACME, with pay shown in each person's local currency.</p>
        </div>
        <Link to="/employees/new" state={backHere} className={buttonVariants({ size: 'lg' })}>
          <Plus aria-hidden />
          Add employee
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search employees"
            placeholder="Search by name"
            className="pl-9"
            value={params.search}
            onChange={(event) => changeView({ search: event.target.value }, { replace: true })}
          />
        </div>
        <NativeSelect
          aria-label="Country"
          className="w-full sm:w-48"
          value={params.countryCode}
          onChange={(event) => changeView({ countryCode: event.target.value })}
        >
          <NativeSelectOption value="">All countries</NativeSelectOption>
          {countries.data?.map((country) => (
            <NativeSelectOption key={country.countryCode} value={country.countryCode}>
              {country.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Job title"
          className="w-full sm:w-56"
          value={params.jobTitle}
          onChange={(event) => changeView({ jobTitle: event.target.value })}
        >
          <NativeSelectOption value="">All job titles</NativeSelectOption>
          {withSelected(jobTitles.data ?? [], params.jobTitle).map((title) => (
            <NativeSelectOption key={title} value={title}>
              {title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {employees.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-12 text-center shadow-card"
        >
          <CircleAlert className="size-5 text-destructive" aria-hidden />
          <p className="text-sm">Could not load employees. Check your connection and try again.</p>
          <Button variant="outline" size="sm" onClick={() => employees.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        // While another page or filter loads, the current rows stay visible but dimmed
        <div className={cn('transition-opacity duration-150', employees.isPlaceholderData && 'opacity-60')}>
          <EmployeeTable
            employees={employees.data?.data ?? []}
            renderName={(employee) => (
              <Link
                to={`/employees/${employee.id}/edit`}
                state={backHere}
                className="rounded-sm underline-offset-4 transition-colors duration-150 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/25"
              >
                {employee.fullName}
              </Link>
            )}
            countryNames={countryNames}
            isLoading={employees.isLoading}
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSort={(sortBy, sortOrder) => changeView({ sortBy, sortOrder })}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {employees.data ? describeCount(employees.data.total) : null}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(params.page - 1)}
            disabled={params.page <= 1}
          >
            <ChevronLeft aria-hidden />
            Previous
          </Button>
          <span className="px-2 text-sm text-muted-foreground tabular-nums">{`Page ${params.page} of ${totalPages}`}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(params.page + 1)}
            disabled={params.page >= totalPages}
          >
            Next
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  )
}
