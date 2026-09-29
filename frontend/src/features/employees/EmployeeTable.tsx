import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatSalary } from '@/lib/formatSalary'
import { cn } from '@/lib/utils'
import type { Employee, EmployeeSortField, SortOrder } from './employeesApi'

interface Column {
  field: EmployeeSortField
  label: string
  numeric?: boolean
  skeletonWidth: string
}

const COLUMNS: readonly Column[] = [
  { field: 'id', label: 'ID', skeletonWidth: 'w-8' },
  { field: 'fullName', label: 'Full Name', skeletonWidth: 'w-36' },
  { field: 'jobTitle', label: 'Job Title', skeletonWidth: 'w-44' },
  { field: 'countryCode', label: 'Country', skeletonWidth: 'w-8' },
  { field: 'salary', label: 'Salary', numeric: true, skeletonWidth: 'w-24' },
]

const SKELETON_ROWS = 10

interface EmployeeTableProps {
  employees: Employee[]
  /** Country names by country code; a code with no name is shown as the code. */
  countryNames?: Partial<Record<string, string>>
  isLoading: boolean
  sortBy: EmployeeSortField
  sortOrder: SortOrder
  /** Called with the column to sort by and its direction: the sorted column reverses, any other starts ascending. */
  onSort: (sortBy: EmployeeSortField, sortOrder: SortOrder) => void
}

export function EmployeeTable({ employees, countryNames = {}, isLoading, sortBy, sortOrder, onSort }: EmployeeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <Table
        aria-busy={isLoading || undefined}
        className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4"
      >
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => (
              <SortableHeader key={column.field} column={column} sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : employees.length === 0 ? (
            <EmptyRow />
          ) : (
            employees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                countryName={countryNames[employee.countryCode] ?? employee.countryCode}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

interface SortableHeaderProps extends Pick<EmployeeTableProps, 'sortBy' | 'sortOrder' | 'onSort'> {
  column: Column
}

function SortableHeader({ column, sortBy, sortOrder, onSort }: SortableHeaderProps) {
  const isSorted = column.field === sortBy
  const Arrow = !isSorted ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead
      aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(column.numeric && 'text-right')}
    >
      <button
        type="button"
        onClick={() => onSort(column.field, isSorted && sortOrder === 'asc' ? 'desc' : 'asc')}
        className={cn(
          '-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25',
          isSorted ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {column.label}
        <Arrow className={cn('size-3.5', !isSorted && 'opacity-50')} aria-hidden />
      </button>
    </TableHead>
  )
}

function EmployeeRow({ employee, countryName }: { employee: Employee; countryName: string }) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground tabular-nums">{employee.id}</TableCell>
      <TableCell className="font-medium">{employee.fullName}</TableCell>
      <TableCell>{employee.jobTitle}</TableCell>
      <TableCell>{countryName}</TableCell>
      <TableCell className="text-right tabular-nums">{formatSalary(employee.salary, employee.currencyCode)}</TableCell>
    </TableRow>
  )
}

function SkeletonRows() {
  return Array.from({ length: SKELETON_ROWS }, (_, row) => (
    <TableRow key={row} className="hover:bg-transparent">
      {COLUMNS.map((column) => (
        <TableCell key={column.field} className={cn(column.numeric && 'text-right')}>
          <Skeleton className={cn('h-4', column.skeletonWidth, column.numeric && 'ml-auto')} />
        </TableCell>
      ))}
    </TableRow>
  ))
}

function EmptyRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={COLUMNS.length} className="h-32 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <SearchX className="size-5" aria-hidden />
          <span>No employees found</span>
        </div>
      </TableCell>
    </TableRow>
  )
}
