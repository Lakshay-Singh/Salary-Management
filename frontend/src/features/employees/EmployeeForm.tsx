import { CircleAlert, LoaderCircle } from 'lucide-react'
import { type ChangeEvent, type FormEvent, type ReactNode, useId, useState } from 'react'
import { Link } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { EmployeeInput } from './employeesApi'
import { useCountries, useJobTitles } from './useReferenceData'
import {
  type EmployeeField,
  type EmployeeFieldErrors,
  type EmployeeFormValues,
  validateEmployee,
} from './validateEmployee'

const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = { fullName: '', jobTitle: '', countryCode: '', salary: '' }

// In the order the fields appear, so focus goes to the first problem
const FIELD_LABELS: Record<EmployeeField, string> = {
  fullName: 'Full name',
  jobTitle: 'Job title',
  countryCode: 'Country',
  salary: 'Salary',
}
const FIELDS = Object.keys(FIELD_LABELS) as EmployeeField[]

const isEmployeeField = (field: string): field is EmployeeField => Object.hasOwn(FIELD_LABELS, field)

// The API's per-field messages are either sentences ("Unknown country") or fragments ("must be a whole number")
function serverFieldErrors(error: Error | null): EmployeeFieldErrors {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {}
  const errors: EmployeeFieldErrors = {}
  for (const { field, message } of error.details) {
    if (!isEmployeeField(field)) continue
    const isFragment = message.charAt(0) === message.charAt(0).toLowerCase()
    errors[field] = isFragment ? `${FIELD_LABELS[field]} ${message}` : message
  }
  return errors
}

function describeError(error: Error): string {
  if (error instanceof ApiError) return error.message
  return 'Could not reach the server. Check your connection and try again.'
}

interface EmployeeFormProps {
  initialValues?: EmployeeFormValues
  submitLabel: string
  submittingLabel: string
  isSubmitting: boolean
  /** The last save's error: per-field problems appear beside their fields, anything else above the form. */
  error: Error | null
  cancelTo: string
  onSubmit: (input: EmployeeInput) => void
  /** Shown on the opposite side of the footer from Save, e.g. the edit page's Delete button. */
  secondaryAction?: ReactNode
}

export function EmployeeForm({
  initialValues = EMPTY_EMPLOYEE_FORM,
  submitLabel,
  submittingLabel,
  isSubmitting,
  error,
  cancelTo,
  onSubmit,
  secondaryAction,
}: EmployeeFormProps) {
  const [values, setValues] = useState(initialValues)
  const [clientErrors, setClientErrors] = useState<EmployeeFieldErrors>({})
  // A field's error, from either side, is hidden once the user starts correcting it
  const [editedSinceSubmit, setEditedSinceSubmit] = useState<ReadonlySet<EmployeeField>>(new Set())

  const countries = useCountries()
  const jobTitles = useJobTitles()
  const idPrefix = useId()

  const serverErrors = serverFieldErrors(error)
  const formError = error && Object.keys(serverErrors).length === 0 ? describeError(error) : null
  const currency = countries.data?.find((country) => country.countryCode === values.countryCode)?.currencyCode

  const fieldId = (field: EmployeeField) => `${idPrefix}-${field}`
  const errorFor = (field: EmployeeField) =>
    editedSinceSubmit.has(field) ? undefined : (clientErrors[field] ?? serverErrors[field])

  const fieldProps = (field: EmployeeField, hintId?: string) => {
    const fieldError = errorFor(field)
    const describedBy = [fieldError && `${fieldId(field)}-error`, hintId].filter(Boolean).join(' ')
    return {
      id: fieldId(field),
      name: field,
      value: values[field],
      'aria-invalid': fieldError ? true : undefined,
      'aria-describedby': describedBy || undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setValues((current) => ({ ...current, [field]: event.target.value }))
        setEditedSinceSubmit((current) => new Set(current).add(field))
      },
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = validateEmployee(values)
    setEditedSinceSubmit(new Set())
    if (!result.ok) {
      setClientErrors(result.errors)
      const firstInvalid = FIELDS.find((field) => result.errors[field])
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }
    setClientErrors({})
    onSubmit(result.input)
  }

  const salaryHintId = `${fieldId('salary')}-hint`
  const jobTitleListId = `${fieldId('jobTitle')}-suggestions`

  return (
    // noValidate: the browser's own pop-ups would compete with the inline errors below
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field className="sm:col-span-2" label={FIELD_LABELS.fullName} htmlFor={fieldId('fullName')} error={errorFor('fullName')}>
          <Input autoComplete="off" {...fieldProps('fullName')} />
        </Field>

        <Field label={FIELD_LABELS.jobTitle} htmlFor={fieldId('jobTitle')} error={errorFor('jobTitle')}>
          <Input autoComplete="off" list={jobTitleListId} {...fieldProps('jobTitle')} />
          <datalist id={jobTitleListId}>
            {jobTitles.data?.map((title) => <option key={title} value={title} />)}
          </datalist>
        </Field>

        <Field label={FIELD_LABELS.countryCode} htmlFor={fieldId('countryCode')} error={errorFor('countryCode')}>
          <NativeSelect className="w-full" {...fieldProps('countryCode')}>
            <NativeSelectOption value="" disabled>
              Select a country
            </NativeSelectOption>
            {countries.data?.map((country) => (
              <NativeSelectOption key={country.countryCode} value={country.countryCode}>
                {country.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field
          label={FIELD_LABELS.salary}
          htmlFor={fieldId('salary')}
          error={errorFor('salary')}
          hint={currency ? `Annual gross salary in ${currency}` : 'Annual gross salary, in the currency of their country'}
          hintId={salaryHintId}
        >
          <Input type="number" inputMode="numeric" min={1} step={1} className="tabular-nums" {...fieldProps('salary', salaryHintId)} />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center">
        {secondaryAction}
        <div className="flex gap-2 sm:ml-auto">
          <Link to={cancelTo} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'flex-1 sm:flex-none')}>
            Cancel
          </Link>
          <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  hintId?: string
  className?: string
  children: ReactNode
}

function Field({ label, htmlFor, error, hint, hintId, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}
