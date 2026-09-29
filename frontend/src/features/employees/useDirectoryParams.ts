import { useSearchParams } from 'react-router'
import type { EmployeeSortField, SortOrder } from './employeesApi'

// Every sortable column exactly once: the compiler flags a missing or unknown field
const SORTABLE_FIELDS: Record<EmployeeSortField, true> = {
  id: true,
  fullName: true,
  jobTitle: true,
  countryCode: true,
  salary: true,
}
// The API's own order when no sort is given, so leaving it out of the URL changes nothing
const DEFAULT_SORT_BY: EmployeeSortField = 'id'
const DEFAULT_SORT_ORDER: SortOrder = 'asc'

export interface DirectoryParams {
  search: string
  countryCode: string
  jobTitle: string
  sortBy: EmployeeSortField
  sortOrder: SortOrder
  page: number
}

type ViewChanges = Partial<Omit<DirectoryParams, 'page'>>

const isSortField = (value: string | null): value is EmployeeSortField =>
  value !== null && Object.hasOwn(SORTABLE_FIELDS, value)

function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

const isDefault = (name: string, value: unknown) =>
  value === undefined ||
  value === '' ||
  (name === 'sortBy' && value === DEFAULT_SORT_BY) ||
  (name === 'sortOrder' && value === DEFAULT_SORT_ORDER)

/**
 * The directory's search, filters, sort and page, kept in the URL so a link or the back button restores the exact view.
 * Unusable values in a hand-edited URL fall back to the defaults; defaults are left out, so plain links stay plain.
 */
export function useDirectoryParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const sortBy = searchParams.get('sortBy')
  const params: DirectoryParams = {
    search: searchParams.get('search') ?? '',
    countryCode: searchParams.get('countryCode') ?? '',
    jobTitle: searchParams.get('jobTitle') ?? '',
    sortBy: isSortField(sortBy) ? sortBy : DEFAULT_SORT_BY,
    sortOrder: searchParams.get('sortOrder') === 'desc' ? 'desc' : DEFAULT_SORT_ORDER,
    page: parsePage(searchParams.get('page')),
  }

  /** Changing what is shown always returns to page 1. Pass `replace` for keystrokes, so they don't flood the history. */
  const changeView = (changes: ViewChanges, { replace = false } = {}) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [name, value] of Object.entries(changes)) {
          if (isDefault(name, value)) next.delete(name)
          else next.set(name, String(value))
        }
        next.delete('page')
        return next
      },
      { replace },
    )
  }

  const goToPage = (page: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (page <= 1) next.delete('page')
      else next.set('page', String(page))
      return next
    })
  }

  return { params, changeView, goToPage }
}
