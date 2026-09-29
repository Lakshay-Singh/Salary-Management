import { api } from '@/lib/apiClient'
import { withQuery } from '@/lib/queryString'

// These mirror the API's responses (backend/src/services/employee.service.ts and reference.service.ts)

export interface Employee {
  id: number
  fullName: string
  jobTitle: string
  countryCode: string
  /** Annual gross base salary, in whole units of currencyCode. */
  salary: number
  currencyCode: string
}

export interface EmployeeListResult {
  data: Employee[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Country {
  countryCode: string
  name: string
  currencyCode: string
}

export type JobTitle = string

/** The API's sort allow-list; any other column is rejected with a 400. */
export type EmployeeSortField = 'id' | 'fullName' | 'jobTitle' | 'countryCode' | 'salary'
export type SortOrder = 'asc' | 'desc'

export interface EmployeeListParams {
  page?: number
  pageSize?: number
  search?: string
  countryCode?: string
  jobTitle?: string
  sortBy?: EmployeeSortField
  sortOrder?: SortOrder
}

// A fixed order, so the same filters always produce the same URL
const LIST_PARAMETERS = ['page', 'pageSize', 'search', 'countryCode', 'jobTitle', 'sortBy', 'sortOrder'] as const

export const listEmployees = (params: EmployeeListParams = {}) =>
  api.get<EmployeeListResult>(
    withQuery(
      '/api/employees',
      LIST_PARAMETERS.map((name) => [name, params[name]] as const),
    ),
  )

export const getCountries = () => api.get<Country[]>('/api/countries')

export const getJobTitles = (countryCode?: string) =>
  api.get<JobTitle[]>(withQuery('/api/job-titles', [['countryCode', countryCode]]))

/** What the API accepts for create and full replace; the currency is always derived from the country. */
export interface EmployeeInput {
  fullName: string
  jobTitle: string
  countryCode: string
  salary: number
}

// The id comes from the page URL, so it is encoded rather than trusted to be a plain number
const employeePath = (id: string) => `/api/employees/${encodeURIComponent(id)}`

export const getEmployee = (id: string) => api.get<Employee>(employeePath(id))

export const createEmployee = (input: EmployeeInput) => api.post<Employee>('/api/employees', input)

export const updateEmployee = (id: string, input: EmployeeInput) => api.put<Employee>(employeePath(id), input)

export const deleteEmployee = (id: string) => api.delete(employeePath(id))

// Mirrors the API (backend/src/services/employee.service.ts): peers share the employee's country and job title
export type PeerLabel = 'Above average' | 'At average' | 'Below average' | 'Not enough peers'

export interface PeerPosition {
  peerCount: number
  /** Rounded to whole currency units; null when there are too few peers to compare with. */
  peerAverage: number | null
  /** Signed percentage from the peer average, e.g. 19.6 or -15; null alongside peerAverage. */
  percentageDiff: number | null
  label: PeerLabel
}

export const getPeerPosition = (id: string) => api.get<PeerPosition>(`${employeePath(id)}/peer-position`)
