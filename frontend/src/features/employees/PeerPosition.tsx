import { CircleAlert } from 'lucide-react'
import { type ReactNode, useId } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSalary } from '@/lib/formatSalary'
import { cn } from '@/lib/utils'
import type { Employee, PeerLabel } from './employeesApi'
import { usePeerPosition } from './useEmployee'
import { useCountries } from './useReferenceData'

// Each pair measured at WCAG AA (4.5:1 or better) for small text; the label text always says the same as the colour
const TONES: Record<PeerLabel, { tone: 'green' | 'amber' | 'red' | 'muted'; className: string }> = {
  'Above average': { tone: 'green', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  'At average': { tone: 'amber', className: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  'Below average': { tone: 'red', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  'Not enough peers': { tone: 'muted', className: 'bg-muted text-muted-foreground ring-border' },
}

const percentFormat = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})
// The API sends a percentage (19.6); Intl's percent style expects a fraction (0.196)
const formatDifference = (percentage: number) => percentFormat.format(percentage / 100)

/** How the employee's salary compares with others in the same country and job title. Loads on its own. */
export function PeerPosition({ employee }: { employee: Employee }) {
  const peerPosition = usePeerPosition(String(employee.id))
  const countries = useCountries()
  const headingId = useId()

  const countryName =
    countries.data?.find((country) => country.countryCode === employee.countryCode)?.name ?? employee.countryCode

  const renderBody = () => {
    if (peerPosition.isLoading) {
      return (
        <div className="space-y-5">
          <Skeleton className="h-6 w-32 rounded-full" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </div>
      )
    }

    if (!peerPosition.data) {
      return (
        <div role="alert" className="flex flex-col items-start gap-3 text-sm">
          <p className="flex items-center gap-2">
            <CircleAlert className="size-4 text-destructive" aria-hidden />
            Could not load the peer position.
          </p>
          <Button variant="outline" size="sm" onClick={() => peerPosition.refetch()}>
            Try again
          </Button>
        </div>
      )
    }

    const { peerCount, peerAverage, percentageDiff, label } = peerPosition.data
    const { tone, className } = TONES[label]
    return (
      <div className="space-y-5">
        <span
          data-tone={tone}
          className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset', className)}
        >
          {label}
        </span>
        {peerAverage === null || percentageDiff === null ? (
          <div className="space-y-3">
            <dl>
              <Figure term="Peers" value={peerCount.toLocaleString('en-US')} />
            </dl>
            <p className="text-sm text-muted-foreground">
              Fewer than 3 other employees share this job title and country, so there is no fair comparison yet.
            </p>
          </div>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-3">
            <Figure term="Peers" value={peerCount.toLocaleString('en-US')} />
            <Figure term="Peer average" value={formatSalary(peerAverage, employee.currencyCode)} />
            <Figure term="Difference" value={formatDifference(percentageDiff)} />
          </dl>
        )}
      </div>
    )
  }

  return (
    <section aria-labelledby={headingId} aria-busy={peerPosition.isLoading || undefined} className="space-y-3">
      <div className="space-y-1">
        <h2 id={headingId}>Peer position</h2>
        <p className="text-sm text-muted-foreground">
          Compared with other employees in {countryName} who have the job title {employee.jobTitle}.
        </p>
      </div>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent>{renderBody()}</CardContent>
      </Card>
    </section>
  )
}

function Figure({ term, value }: { term: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{term}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
