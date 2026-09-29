import { describe, expect, it } from 'vitest'
import { formatSalary } from './formatSalary'

const RUPEE = String.fromCodePoint(0x20b9)
const POUND = String.fromCodePoint(0x00a3)
const NO_BREAK_SPACE = String.fromCodePoint(0x00a0)

describe('formatSalary', () => {
  it('formats US dollars with the dollar sign and thousands separators', () => {
    expect(formatSalary(75_000, 'USD')).toBe('$75,000')
  })

  it('formats Indian rupees with Indian digit grouping (lakhs)', () => {
    expect(formatSalary(1_500_000, 'INR')).toBe(`${RUPEE}15,00,000`)
  })

  it('keeps Western digit grouping for every other currency, even for large amounts', () => {
    expect(formatSalary(125_000, 'USD')).toBe('$125,000')
  })

  it('formats pounds sterling', () => {
    expect(formatSalary(50_000, 'GBP')).toBe(`${POUND}50,000`)
  })

  it('formats zero', () => {
    expect(formatSalary(0, 'USD')).toBe('$0')
  })

  it('shows whole units only, rounding any fraction', () => {
    expect(formatSalary(75_000.6, 'USD')).toBe('$75,001')
  })

  it('shows the code for a well-formed currency it has no symbol for', () => {
    expect(formatSalary(50_000, 'XYZ')).toBe(`XYZ${NO_BREAK_SPACE}50,000`)
  })

  it('does not throw for a malformed currency code, showing the code and the grouped amount instead', () => {
    expect(formatSalary(50_000, 'not-a-currency')).toBe(`not-a-currency${NO_BREAK_SPACE}50,000`)
  })

  it('falls back to the grouped amount alone when the currency code is empty', () => {
    expect(formatSalary(50_000, '')).toBe('50,000')
  })
})
