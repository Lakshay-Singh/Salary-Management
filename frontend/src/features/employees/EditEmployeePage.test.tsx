import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { ASHA, COUNTRIES, JOB_TITLES } from '@/test/employeeFixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { EditEmployeePage } from './EditEmployeePage'
import {
  deleteEmployee,
  getCountries,
  getEmployee,
  getJobTitles,
  getPeerPosition,
  updateEmployee,
} from './employeesApi'

vi.mock('./employeesApi', () => ({
  getCountries: vi.fn(),
  getJobTitles: vi.fn(),
  getEmployee: vi.fn(),
  getPeerPosition: vi.fn(),
  updateEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(getCountries).mockResolvedValue(COUNTRIES)
  vi.mocked(getJobTitles).mockResolvedValue(JOB_TITLES)
  vi.mocked(getEmployee).mockResolvedValue(ASHA)
  vi.mocked(getPeerPosition).mockResolvedValue({
    peerCount: 3,
    peerAverage: 1_000_000,
    percentageDiff: 20,
    label: 'Above average',
  })
  vi.mocked(updateEmployee).mockResolvedValue({ ...ASHA, salary: 1_600_000 })
  vi.mocked(deleteEmployee).mockResolvedValue(undefined)
})

function renderEditPage(id = '1') {
  return renderRoutes(
    [
      { path: '/employees', element: <p>Employee directory</p> },
      { path: '/employees/:id/edit', element: <EditEmployeePage /> },
    ],
    { url: `/employees/${id}/edit` },
  )
}

// The country list loads separately from the employee, so wait for both before reading the form
async function waitForPrefilledForm() {
  await screen.findByDisplayValue('Asha Rao')
  await screen.findByRole('option', { name: 'India' })
}

describe('EditEmployeePage', () => {
  it('loads the employee and pre-fills the form', async () => {
    renderEditPage()

    await waitForPrefilledForm()

    expect(getEmployee).toHaveBeenCalledWith('1')
    expect(screen.getByLabelText('Full name')).toHaveValue('Asha Rao')
    expect(screen.getByLabelText('Job title')).toHaveValue('Software Engineer')
    expect(screen.getByLabelText('Country')).toHaveValue('IN')
    expect(screen.getByLabelText('Salary')).toHaveValue(1_500_000)
  })

  it('saves the changes and returns to the directory', async () => {
    renderEditPage()
    await waitForPrefilledForm()

    await userEvent.clear(screen.getByLabelText('Salary'))
    await userEvent.type(screen.getByLabelText('Salary'), '1600000')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Employee directory')).toBeInTheDocument()
    expect(updateEmployee).toHaveBeenCalledWith('1', {
      fullName: 'Asha Rao',
      jobTitle: 'Software Engineer',
      countryCode: 'IN',
      salary: 1_600_000,
    })
  })

  it("shows the employee's peer position below the form", async () => {
    renderEditPage()
    await waitForPrefilledForm()

    const peerPosition = await screen.findByRole('region', { name: 'Peer position' })

    expect(await within(peerPosition).findByText('Above average')).toBeInTheDocument()
    expect(getPeerPosition).toHaveBeenCalledWith('1')
  })

  it('shows no peer position, and never asks for one, when there is no such employee', async () => {
    vi.mocked(getEmployee).mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND', 'Employee 999 not found'))
    renderEditPage('999')

    await screen.findByRole('heading', { name: 'Employee not found' })

    expect(screen.queryByRole('region', { name: 'Peer position' })).not.toBeInTheDocument()
    expect(getPeerPosition).not.toHaveBeenCalled()
  })

  it('says so when no employee has that id, with a way back to the directory', async () => {
    vi.mocked(getEmployee).mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND', 'Employee 999 not found'))
    renderEditPage('999')

    expect(await screen.findByRole('heading', { name: 'Employee not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to employees/i })).toHaveAttribute('href', '/employees')
  })

  it('asks for confirmation before deleting, and deletes nothing if cancelled', async () => {
    renderEditPage()
    await waitForPrefilledForm()

    await userEvent.click(screen.getByRole('button', { name: 'Delete employee' }))
    const dialog = await screen.findByRole('alertdialog')

    expect(dialog).toHaveTextContent('Delete Asha Rao?')
    expect(deleteEmployee).not.toHaveBeenCalled()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(deleteEmployee).not.toHaveBeenCalled()
    expect(screen.getByDisplayValue('Asha Rao')).toBeInTheDocument()
  })

  it('deletes the employee once confirmed, and returns to the directory', async () => {
    renderEditPage()
    await waitForPrefilledForm()

    await userEvent.click(screen.getByRole('button', { name: 'Delete employee' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Employee directory')).toBeInTheDocument()
    expect(deleteEmployee).toHaveBeenCalledExactlyOnceWith('1')
  })
})
