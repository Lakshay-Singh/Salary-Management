import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { COUNTRIES, fillEmployeeForm, JOB_TITLES } from '@/test/employeeFixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { EmployeeForm } from './EmployeeForm'
import { getCountries, getJobTitles } from './employeesApi'

vi.mock('./employeesApi', () => ({ getCountries: vi.fn(), getJobTitles: vi.fn() }))

beforeEach(() => {
  vi.mocked(getCountries).mockResolvedValue(COUNTRIES)
  vi.mocked(getJobTitles).mockResolvedValue(JOB_TITLES)
})

function renderForm(props: Partial<ComponentProps<typeof EmployeeForm>> = {}) {
  const onSubmit = vi.fn()
  renderRoutes(
    [
      {
        path: '/employees/new',
        element: (
          <EmployeeForm
            submitLabel="Add employee"
            submittingLabel="Adding..."
            isSubmitting={false}
            error={null}
            cancelTo="/employees"
            onSubmit={onSubmit}
            {...props}
          />
        ),
      },
    ],
    { url: '/employees/new' },
  )
  return { onSubmit }
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Add employee' }))

describe('EmployeeForm', () => {
  it('shows an error beside every field, and does not submit, when submitted blank', async () => {
    const { onSubmit } = renderForm()

    await submit()

    expect(screen.getByText('Enter a full name')).toBeInTheDocument()
    expect(screen.getByText('Enter a job title')).toBeInTheDocument()
    expect(screen.getByText('Choose a country')).toBeInTheDocument()
    expect(screen.getByText('Enter a salary')).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Full name')).toHaveAccessibleDescription('Enter a full name')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the trimmed values with the salary as a number', async () => {
    const { onSubmit } = renderForm()

    await fillEmployeeForm({ fullName: ' Asha Rao ', jobTitle: 'Software Engineer', countryCode: 'IN', salary: '1500000' })
    await submit()

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      fullName: 'Asha Rao',
      jobTitle: 'Software Engineer',
      countryCode: 'IN',
      salary: 1_500_000,
    })
  })

  it("clears a field's error as soon as it is corrected", async () => {
    renderForm()
    await submit()

    await fillEmployeeForm({ fullName: 'Asha Rao' })

    expect(screen.queryByText('Enter a full name')).not.toBeInTheDocument()
    expect(screen.getByText('Enter a job title')).toBeInTheDocument()
  })

  it('suggests the job titles already in use', async () => {
    renderForm()

    const listId = screen.getByLabelText('Job title').getAttribute('list') ?? ''
    const suggestions = () =>
      [...(document.getElementById(listId)?.querySelectorAll('option') ?? [])].map((option) => option.value)

    await waitFor(() => expect(suggestions()).toEqual(JOB_TITLES))
  })

  it('names the currency the salary is in once a country is chosen', async () => {
    renderForm()

    await fillEmployeeForm({ countryCode: 'IN' })

    expect(screen.getByLabelText('Salary')).toHaveAccessibleDescription('Annual gross salary in INR')
  })

  it("shows the server's field errors beside the right field", async () => {
    renderForm({
      error: new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', [
        { field: 'countryCode', message: 'Unknown country' },
      ]),
    })

    expect(await screen.findByLabelText('Country')).toHaveAccessibleDescription('Unknown country')
    expect(screen.getByLabelText('Country')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows any other server error above the form', async () => {
    renderForm({ error: new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong') })

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
  })

  it('shows progress and blocks a second submit while saving', () => {
    renderForm({ isSubmitting: true })

    expect(screen.getByRole('button', { name: 'Adding...' })).toBeDisabled()
  })
})
