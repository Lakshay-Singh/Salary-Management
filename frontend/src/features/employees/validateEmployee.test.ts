import { describe, expect, it } from 'vitest'
import { validateEmployee } from './validateEmployee'

const VALID = { fullName: 'Asha Rao', jobTitle: 'Software Engineer', countryCode: 'IN', salary: '1500000' }

describe('validateEmployee', () => {
  it('turns valid form values into the API input, trimming text and reading the salary as a number', () => {
    expect(validateEmployee({ ...VALID, fullName: '  Asha Rao ', jobTitle: ' Software Engineer ' })).toEqual({
      ok: true,
      input: { fullName: 'Asha Rao', jobTitle: 'Software Engineer', countryCode: 'IN', salary: 1_500_000 },
    })
  })

  it('reports every blank field at once', () => {
    expect(validateEmployee({ fullName: '', jobTitle: '', countryCode: '', salary: '' })).toEqual({
      ok: false,
      errors: {
        fullName: 'Enter a full name',
        jobTitle: 'Enter a job title',
        countryCode: 'Choose a country',
        salary: 'Enter a salary',
      },
    })
  })

  it('treats a name or job title of only spaces as blank', () => {
    expect(validateEmployee({ ...VALID, fullName: '   ', jobTitle: ' ' })).toEqual({
      ok: false,
      errors: { fullName: 'Enter a full name', jobTitle: 'Enter a job title' },
    })
  })

  it.each([
    ['1500000.5', 'Salary must be a whole number'],
    ['0', 'Salary must be greater than 0'],
    ['-100', 'Salary must be greater than 0'],
    ['2147483648', 'Salary must be at most 2,147,483,647'],
    ['abc', 'Enter the salary as a number'],
  ])('rejects the salary %p: "%s"', (salary, message) => {
    expect(validateEmployee({ ...VALID, salary })).toEqual({ ok: false, errors: { salary: message } })
  })

  it('accepts the largest salary the database can store', () => {
    expect(validateEmployee({ ...VALID, salary: '2147483647' })).toMatchObject({
      ok: true,
      input: { salary: 2_147_483_647 },
    })
  })
})
