import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { ASHA, COUNTRIES, fillEmployeeForm, JOB_TITLES } from '@/test/employeeFixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { AddEmployeePage } from './AddEmployeePage'
import { createEmployee, getCountries, getJobTitles } from './employeesApi'
import { employeeKeys } from './useEmployeesList'

vi.mock('./employeesApi', () => ({ getCountries: vi.fn(), getJobTitles: vi.fn(), createEmployee: vi.fn() }))

beforeEach(() => {
  vi.mocked(getCountries).mockResolvedValue(COUNTRIES)
  vi.mocked(getJobTitles).mockResolvedValue(JOB_TITLES)
  vi.mocked(createEmployee).mockResolvedValue(ASHA)
})

function renderAddPage(state?: unknown) {
  return renderRoutes(
    [
      { path: '/employees', element: <p>Employee directory</p> },
      { path: '/employees/new', element: <AddEmployeePage /> },
    ],
    { url: '/employees/new', state },
  )
}

async function addAsha() {
  await fillEmployeeForm({ fullName: 'Asha Rao', jobTitle: 'Software Engineer', countryCode: 'IN', salary: '1500000' })
  await userEvent.click(screen.getByRole('button', { name: 'Add employee' }))
}

describe('AddEmployeePage', () => {
  it('adds the employee and returns to the directory', async () => {
    renderAddPage()

    await addAsha()

    expect(await screen.findByText('Employee directory')).toBeInTheDocument()
    expect(createEmployee).toHaveBeenCalledWith({
      fullName: 'Asha Rao',
      jobTitle: 'Software Engineer',
      countryCode: 'IN',
      salary: 1_500_000,
    })
  })

  it('returns to the directory view it came from, keeping its filters and page', async () => {
    const { currentUrl } = renderAddPage({ returnTo: '/employees?countryCode=IN&page=3' })

    await addAsha()

    await screen.findByText('Employee directory')
    expect(currentUrl()).toBe('/employees?countryCode=IN&page=3')
  })

  it('marks cached employee lists as out of date, so the directory refreshes', async () => {
    const { queryClient } = renderAddPage()
    const cachedList = employeeKeys.list({ page: 1 })
    queryClient.setQueryData(cachedList, { data: [], page: 1, pageSize: 25, total: 0, totalPages: 0 })

    await addAsha()

    await screen.findByText('Employee directory')
    expect(queryClient.getQueryState(cachedList)?.isInvalidated).toBe(true)
  })

  it("stays on the form, with the server's error beside the field, when the API rejects the employee", async () => {
    vi.mocked(createEmployee).mockRejectedValueOnce(
      new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', [
        { field: 'countryCode', message: 'Unknown country' },
      ]),
    )
    renderAddPage()

    await addAsha()

    expect(await screen.findByText('Unknown country')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add employee' })).toBeInTheDocument()
  })

  it('Cancel returns to the directory without saving', async () => {
    renderAddPage()
    await screen.findByRole('option', { name: 'India' })

    await userEvent.click(screen.getByRole('link', { name: 'Cancel' }))

    expect(await screen.findByText('Employee directory')).toBeInTheDocument()
    expect(createEmployee).not.toHaveBeenCalled()
  })
})
