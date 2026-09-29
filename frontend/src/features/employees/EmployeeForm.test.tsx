import { screen, within } from '@testing-library/react'
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

  describe('job title', () => {
    const jobTitleField = () => screen.getByRole('combobox', { name: 'Job title' })
    const suggestionList = () => screen.findByRole('listbox', { name: 'Job title suggestions' })
    const suggestions = async () =>
      within(await suggestionList())
        .getAllByRole('option')
        .map((option) => option.textContent)

    it('is a plain text field, without the native datalist', () => {
      renderForm()

      expect(jobTitleField()).not.toHaveAttribute('list')
      expect(document.querySelector('datalist')).not.toBeInTheDocument()
    })

    it('suggests the titles in use when clicked, narrowing them as you type', async () => {
      renderForm()

      await userEvent.click(jobTitleField())

      expect(await suggestions()).toEqual(JOB_TITLES)
      expect(jobTitleField()).toHaveAttribute('aria-expanded', 'true')

      await userEvent.type(jobTitleField(), 'manager')

      expect(await suggestions()).toEqual(['Engineering Manager'])
    })

    it('fills the field with a suggestion when it is clicked', async () => {
      renderForm()
      await userEvent.type(jobTitleField(), 'eng')

      await userEvent.click(await screen.findByRole('option', { name: 'Software Engineer' }))

      expect(jobTitleField()).toHaveValue('Software Engineer')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('highlights suggestions with the arrow keys, and Enter fills the field with the highlighted one', async () => {
      renderForm()
      await userEvent.type(jobTitleField(), 'eng')
      await suggestionList()

      await userEvent.keyboard('{ArrowDown}{ArrowDown}')

      const highlighted = screen.getByRole('option', { name: 'Software Engineer' })
      expect(highlighted).toHaveAttribute('aria-selected', 'true')
      expect(jobTitleField()).toHaveAttribute('aria-activedescendant', highlighted.id)

      await userEvent.keyboard('{Enter}')

      expect(jobTitleField()).toHaveValue('Software Engineer')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(screen.queryByText('Enter a full name')).not.toBeInTheDocument()
    })

    it('keeps what was typed when Enter is pressed with no suggestion highlighted', async () => {
      renderForm()
      await userEvent.type(jobTitleField(), 'Engineer')
      await suggestionList()

      await userEvent.keyboard('{Enter}')

      expect(jobTitleField()).toHaveValue('Engineer')
    })

    it('keeps a new title, and closes the suggestions, when you click away', async () => {
      renderForm()
      await userEvent.type(jobTitleField(), 'Engineer')
      await suggestionList()

      await userEvent.click(screen.getByLabelText('Full name'))

      expect(jobTitleField()).toHaveValue('Engineer')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('keeps a new title, and closes the suggestions, on Escape', async () => {
      renderForm()
      await userEvent.type(jobTitleField(), 'Engineer')
      await suggestionList()

      await userEvent.keyboard('{Escape}')

      expect(jobTitleField()).toHaveValue('Engineer')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(jobTitleField()).toHaveAttribute('aria-expanded', 'false')
    })

    it('takes the existing spelling of a title in use that was typed in a different case', async () => {
      const { onSubmit } = renderForm()
      await fillEmployeeForm({ fullName: 'Asha Rao', jobTitle: 'software engineer', countryCode: 'IN', salary: '1500000' })

      expect(jobTitleField()).toHaveValue('Software Engineer')

      await submit()

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ jobTitle: 'Software Engineer' }))
    })

    it('is marked invalid, and described by its error, when submitted blank', async () => {
      renderForm()

      await submit()

      expect(jobTitleField()).toHaveAttribute('aria-invalid', 'true')
      expect(jobTitleField()).toHaveAccessibleDescription('Enter a job title')
    })
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
