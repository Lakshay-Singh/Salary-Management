import { describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/apiClient'
import { getCountries, getJobTitles, listEmployees } from './employeesApi'

vi.mock('@/lib/apiClient', () => ({ api: { get: vi.fn() } }))
const get = vi.mocked(api.get)

const requestedPath = () => get.mock.calls[0][0]

describe('listEmployees', () => {
  it('requests the default first page when given no parameters', async () => {
    get.mockResolvedValueOnce({})

    await listEmployees()

    expect(requestedPath()).toBe('/api/employees')
  })

  it('puts page, search, countryCode, sortBy and sortOrder in the query string', async () => {
    get.mockResolvedValueOnce({})

    await listEmployees({ page: 2, search: 'asha', countryCode: 'IN', sortBy: 'salary', sortOrder: 'desc' })

    expect(requestedPath()).toBe('/api/employees?page=2&search=asha&countryCode=IN&sortBy=salary&sortOrder=desc')
  })

  it('always uses the same parameter order, however the caller builds the object', async () => {
    get.mockResolvedValueOnce({})

    await listEmployees({ sortOrder: 'asc', sortBy: 'fullName', countryCode: 'US', page: 3 })

    expect(requestedPath()).toBe('/api/employees?page=3&countryCode=US&sortBy=fullName&sortOrder=asc')
  })

  it('includes pageSize and jobTitle, encoding spaces and special characters', async () => {
    get.mockResolvedValueOnce({})

    await listEmployees({ pageSize: 50, jobTitle: 'R&D Engineer' })

    expect(requestedPath()).toBe('/api/employees?pageSize=50&jobTitle=R%26D+Engineer')
  })

  it('leaves out empty and blank values, so a cleared filter means no filter', async () => {
    get.mockResolvedValueOnce({})

    await listEmployees({ page: 1, search: '   ', countryCode: '', jobTitle: undefined })

    expect(requestedPath()).toBe('/api/employees?page=1')
  })

  it('trims whitespace around the search term', async () => {
    get.mockResolvedValueOnce({})

    await listEmployees({ search: '  asha  ' })

    expect(requestedPath()).toBe('/api/employees?search=asha')
  })

  it('returns the page of employees from the API', async () => {
    const page = {
      data: [{ id: 1, fullName: 'Asha Rao', jobTitle: 'Software Engineer', countryCode: 'IN', salary: 1_200_000, currencyCode: 'INR' }],
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
    }
    get.mockResolvedValueOnce(page)

    expect(await listEmployees()).toEqual(page)
  })
})

describe('getCountries', () => {
  it('requests the supported countries and returns them', async () => {
    const countries = [{ countryCode: 'IN', name: 'India', currencyCode: 'INR' }]
    get.mockResolvedValueOnce(countries)

    expect(await getCountries()).toEqual(countries)
    expect(requestedPath()).toBe('/api/countries')
  })
})

describe('getJobTitles', () => {
  it('requests the job titles across all countries when none is given', async () => {
    get.mockResolvedValueOnce(['Software Engineer'])

    expect(await getJobTitles()).toEqual(['Software Engineer'])
    expect(requestedPath()).toBe('/api/job-titles')
  })

  it('requests only one country\'s job titles when a country is given', async () => {
    get.mockResolvedValueOnce([])

    await getJobTitles('IN')

    expect(requestedPath()).toBe('/api/job-titles?countryCode=IN')
  })
})
