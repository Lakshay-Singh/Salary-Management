import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Employee } from './employeesApi'
import { EmployeeTable } from './EmployeeTable'

const RUPEE = String.fromCodePoint(0x20b9)

const EMPLOYEES: Employee[] = [
  { id: 1, fullName: 'Asha Rao', jobTitle: 'Software Engineer', countryCode: 'IN', salary: 1_500_000, currencyCode: 'INR' },
  { id: 2, fullName: 'John Smith', jobTitle: 'Engineering Manager', countryCode: 'US', salary: 125_000, currencyCode: 'USD' },
]

function renderTable(props: Partial<ComponentProps<typeof EmployeeTable>> = {}) {
  const onSort = vi.fn()
  render(
    <EmployeeTable employees={EMPLOYEES} isLoading={false} sortBy="id" sortOrder="asc" onSort={onSort} {...props} />,
  )
  return { onSort }
}

const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')
const cellTexts = (row: HTMLElement) => within(row).getAllByRole('cell').map((cell) => cell.textContent)

describe('EmployeeTable', () => {
  it('shows one row per employee with ID, name, job title, country and salary in its own currency', () => {
    renderTable()

    expect(bodyRows().map(cellTexts)).toEqual([
      ['1', 'Asha Rao', 'Software Engineer', 'IN', `${RUPEE}15,00,000`],
      ['2', 'John Smith', 'Engineering Manager', 'US', '$125,000'],
    ])
  })

  it('shows 10 placeholder rows, and marks the table busy, while loading', () => {
    renderTable({ employees: [], isLoading: true })

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(bodyRows()).toHaveLength(10)
    expect(screen.queryByText('No employees found')).not.toBeInTheDocument()
  })

  it('shows "No employees found" when there are no employees', () => {
    renderTable({ employees: [] })

    expect(screen.getByText('No employees found')).toBeInTheDocument()
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy', 'true')
  })

  it('marks the sorted column and its direction for assistive technology', () => {
    renderTable({ sortBy: 'salary', sortOrder: 'desc' })

    expect(screen.getByRole('columnheader', { name: 'Salary' })).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('columnheader', { name: 'Full Name' })).not.toHaveAttribute('aria-sort')
  })

  it.each([
    ['asc', 'desc'],
    ['desc', 'asc'],
  ] as const)('clicking the sorted column (%s) reverses its direction to %s', async (current, reversed) => {
    const { onSort } = renderTable({ sortBy: 'salary', sortOrder: current })

    await userEvent.click(screen.getByRole('button', { name: 'Salary' }))

    expect(onSort).toHaveBeenCalledExactlyOnceWith('salary', reversed)
  })

  it('clicking a different column sorts by it, ascending', async () => {
    const { onSort } = renderTable({ sortBy: 'salary', sortOrder: 'desc' })

    await userEvent.click(screen.getByRole('button', { name: 'Full Name' }))

    expect(onSort).toHaveBeenCalledExactlyOnceWith('fullName', 'asc')
  })
})
