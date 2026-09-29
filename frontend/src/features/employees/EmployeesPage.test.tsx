import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Employee, type EmployeeListResult, getCountries, getJobTitles, listEmployees } from './employeesApi'
import { EmployeesPage } from './EmployeesPage'

vi.mock('./employeesApi', () => ({ listEmployees: vi.fn(), getCountries: vi.fn(), getJobTitles: vi.fn() }))

const ASHA: Employee = {
  id: 1,
  fullName: 'Asha Rao',
  jobTitle: 'Software Engineer',
  countryCode: 'IN',
  salary: 1_500_000,
  currencyCode: 'INR',
}
const JOHN: Employee = {
  id: 2,
  fullName: 'John Smith',
  jobTitle: 'Engineering Manager',
  countryCode: 'US',
  salary: 125_000,
  currencyCode: 'USD',
}

const pageOf = (employees: Employee[], totalPages = 1): EmployeeListResult => ({
  data: employees,
  page: 1,
  pageSize: 25,
  total: employees.length,
  totalPages,
})

beforeEach(() => {
  vi.mocked(listEmployees).mockResolvedValue(pageOf([ASHA, JOHN]))
  vi.mocked(getCountries).mockResolvedValue([
    { countryCode: 'IN', name: 'India', currencyCode: 'INR' },
    { countryCode: 'US', name: 'United States', currencyCode: 'USD' },
  ])
  vi.mocked(getJobTitles).mockResolvedValue(['Engineering Manager', 'Software Engineer'])
})

function renderPage(url = '/employees') {
  const router = createMemoryRouter([{ path: '/employees', element: <EmployeesPage /> }], { initialEntries: [url] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { urlParams: () => new URLSearchParams(router.state.location.search) }
}

const lastListRequest = () => vi.mocked(listEmployees).mock.lastCall?.[0]

describe('EmployeesPage', () => {
  it('shows the first page of employees, with full country names and the total', async () => {
    renderPage()

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
    expect(await screen.findByRole('cell', { name: 'India' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'United States' })).toBeInTheDocument()
    expect(screen.getByText('2 employees')).toBeInTheDocument()
    expect(lastListRequest()).toMatchObject({ page: 1, pageSize: 25, sortBy: 'id', sortOrder: 'asc' })
  })

  it('reads the search, filters, sort and page from the URL, so a shared link opens the same view', async () => {
    renderPage('/employees?search=asha&countryCode=IN&jobTitle=Software+Engineer&sortBy=salary&sortOrder=desc&page=2')

    await screen.findByText('Asha Rao')
    expect(lastListRequest()).toMatchObject({
      search: 'asha',
      countryCode: 'IN',
      jobTitle: 'Software Engineer',
      sortBy: 'salary',
      sortOrder: 'desc',
      page: 2,
    })
    expect(screen.getByRole('searchbox', { name: 'Search employees' })).toHaveValue('asha')
  })

  it('typing in the search box puts the search in the URL and returns to page 1', async () => {
    const { urlParams } = renderPage('/employees?page=3')
    await screen.findByText('Asha Rao')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search employees' }), 'asha')

    expect(urlParams().get('search')).toBe('asha')
    expect(urlParams().get('page')).toBeNull()
    await waitFor(() => expect(lastListRequest()).toMatchObject({ search: 'asha', page: 1 }))
  })

  it('picking a country filters by it, lists only its job titles, and returns to page 1', async () => {
    const { urlParams } = renderPage('/employees?page=3')
    await screen.findByRole('option', { name: 'India' })

    await userEvent.selectOptions(screen.getByLabelText('Country'), 'IN')

    expect(urlParams().get('countryCode')).toBe('IN')
    expect(urlParams().get('page')).toBeNull()
    await waitFor(() => expect(lastListRequest()).toMatchObject({ countryCode: 'IN', page: 1 }))
    await waitFor(() => expect(getJobTitles).toHaveBeenLastCalledWith('IN'))
  })

  it('picking a job title filters by it and returns to page 1', async () => {
    const { urlParams } = renderPage('/employees?page=3')
    await screen.findByRole('option', { name: 'Software Engineer' })

    await userEvent.selectOptions(screen.getByLabelText('Job title'), 'Software Engineer')

    expect(urlParams().get('jobTitle')).toBe('Software Engineer')
    expect(urlParams().get('page')).toBeNull()
  })

  it('clicking a column header sorts by it in the URL and returns to page 1', async () => {
    const { urlParams } = renderPage('/employees?page=3')
    await screen.findByText('Asha Rao')

    await userEvent.click(screen.getByRole('button', { name: 'Salary' }))

    expect(urlParams().get('sortBy')).toBe('salary')
    expect(urlParams().get('sortOrder')).toBeNull()
    expect(urlParams().get('page')).toBeNull()
  })

  it('clicking Next moves to the next page', async () => {
    vi.mocked(listEmployees).mockResolvedValue(pageOf([ASHA, JOHN], 3))
    const { urlParams } = renderPage()
    await screen.findByText('Page 1 of 3')

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(urlParams().get('page')).toBe('2')
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    await waitFor(() => expect(lastListRequest()).toMatchObject({ page: 2 }))
  })

  it.each([
    ['/employees', 'Previous'],
    ['/employees?page=3', 'Next'],
  ])('at %s, disables %s: there is no page beyond it', async (url, disabledButton) => {
    vi.mocked(listEmployees).mockResolvedValue(pageOf([ASHA, JOHN], 3))
    renderPage(url)
    await screen.findByText('Asha Rao')

    const otherButton = disabledButton === 'Previous' ? 'Next' : 'Previous'
    expect(screen.getByRole('button', { name: disabledButton })).toBeDisabled()
    expect(screen.getByRole('button', { name: otherButton })).toBeEnabled()
  })

  it('shows an error with a way to retry when the employees cannot be loaded', async () => {
    vi.mocked(listEmployees).mockRejectedValueOnce(new Error('network down'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load employees/i)

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument()
  })
})
