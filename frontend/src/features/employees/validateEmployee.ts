import type { EmployeeInput } from './employeesApi'

/** The form's raw values: everything is text until it has been validated. */
export interface EmployeeFormValues {
  fullName: string
  jobTitle: string
  countryCode: string
  salary: string
}

export type EmployeeField = keyof EmployeeFormValues
export type EmployeeFieldErrors = Partial<Record<EmployeeField, string>>

export type ValidationResult = { ok: true; input: EmployeeInput } | { ok: false; errors: EmployeeFieldErrors }

// Mirrors the API: salaries are stored as a Postgres INTEGER (backend/src/domain/limits.ts)
const MAX_SALARY = 2_147_483_647

function salaryError(text: string): string | undefined {
  if (text === '') return 'Enter a salary'
  const salary = Number(text)
  if (Number.isNaN(salary)) return 'Enter the salary as a number'
  if (!Number.isInteger(salary)) return 'Salary must be a whole number'
  if (salary <= 0) return 'Salary must be greater than 0'
  if (salary > MAX_SALARY) return 'Salary must be at most 2,147,483,647'
  return undefined
}

/** The same rules the API applies, checked before sending so mistakes show at once, next to the field. */
export function validateEmployee(values: EmployeeFormValues): ValidationResult {
  const fullName = values.fullName.trim()
  const jobTitle = values.jobTitle.trim()
  const salaryText = values.salary.trim()

  const errors: EmployeeFieldErrors = {}
  if (!fullName) errors.fullName = 'Enter a full name'
  if (!jobTitle) errors.jobTitle = 'Enter a job title'
  if (!values.countryCode) errors.countryCode = 'Choose a country'
  const salaryProblem = salaryError(salaryText)
  if (salaryProblem) errors.salary = salaryProblem

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, input: { fullName, jobTitle, countryCode: values.countryCode, salary: Number(salaryText) } }
}
