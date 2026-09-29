import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Country, Employee } from '@/features/employees/employeesApi'

export const COUNTRIES: Country[] = [
  { countryCode: 'IN', name: 'India', currencyCode: 'INR' },
  { countryCode: 'US', name: 'United States', currencyCode: 'USD' },
]

export const JOB_TITLES = ['Engineering Manager', 'Software Engineer']

export const ASHA: Employee = {
  id: 1,
  fullName: 'Asha Rao',
  jobTitle: 'Software Engineer',
  countryCode: 'IN',
  salary: 1_500_000,
  currencyCode: 'INR',
}

interface FormEntries {
  fullName?: string
  jobTitle?: string
  countryCode?: string
  salary?: string
}

/**
 * Fills the employee form the way a user would, waiting for the country list to load first.
 * The job title is pasted rather than typed: it is the longest entry, and typing the whole form one key at a time
 * took these tests close to their time limit when every test file runs at once. EmployeeForm's job title tests
 * cover typing into that field.
 */
export async function fillEmployeeForm({ fullName, jobTitle, countryCode, salary }: FormEntries) {
  const user = userEvent.setup()
  await screen.findByRole('option', { name: 'India' })
  if (fullName !== undefined) await user.type(screen.getByLabelText('Full name'), fullName)
  if (jobTitle !== undefined) {
    await user.click(screen.getByLabelText('Job title'))
    await user.paste(jobTitle)
  }
  if (countryCode !== undefined) await user.selectOptions(screen.getByLabelText('Country'), countryCode)
  if (salary !== undefined) await user.type(screen.getByLabelText('Salary'), salary)
}
