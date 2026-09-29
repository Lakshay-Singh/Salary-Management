import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface StatsColumn<Row> {
  header: string
  cell: (row: Row) => ReactNode
  /** Right-aligned with tabular figures, so digits line up down the column. */
  numeric?: boolean
}

interface StatsTableProps<Row> {
  /** Id of the heading that names this table. */
  labelledBy: string
  columns: readonly StatsColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
  isLoading: boolean
  /** Shown instead of the rows when set; with onRetry, alongside a Try again button. */
  errorMessage?: string
  onRetry?: () => void
  emptyMessage: string
}

const SKELETON_ROWS = 4

export function StatsTable<Row>({
  labelledBy,
  columns,
  rows,
  rowKey,
  isLoading,
  errorMessage,
  onRetry,
  emptyMessage,
}: StatsTableProps<Row>) {
  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: SKELETON_ROWS }, (_, row) => (
        <TableRow key={row} className="hover:bg-transparent">
          {columns.map((column) => (
            <TableCell key={column.header}>
              <Skeleton className={cn('h-4 w-16', column.numeric && 'ml-auto')} />
            </TableCell>
          ))}
        </TableRow>
      ))
    }
    if (errorMessage) {
      return (
        <MessageRow columnCount={columns.length}>
          <div role="alert" className="flex flex-col items-center gap-3">
            <CircleAlert className="size-5 text-destructive" aria-hidden />
            <span className="text-foreground">{errorMessage}</span>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        </MessageRow>
      )
    }
    if (rows.length === 0) {
      return <MessageRow columnCount={columns.length}>{emptyMessage}</MessageRow>
    }
    return rows.map((row) => (
      <TableRow key={rowKey(row)}>
        {columns.map((column) => (
          <TableCell key={column.header} className={cn(column.numeric && 'text-right tabular-nums')}>
            {column.cell(row)}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <Table
        aria-labelledby={labelledBy}
        aria-busy={isLoading || undefined}
        className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4"
      >
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.header}
                className={cn('font-medium text-muted-foreground', column.numeric && 'text-right')}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{renderBody()}</TableBody>
      </Table>
    </div>
  )
}

function MessageRow({ columnCount, children }: { columnCount: number; children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columnCount} className="h-28 text-center text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  )
}
