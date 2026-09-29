import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'

interface EmployeePageHeaderProps {
  backTo: string
  title: string
  description: string
}

export function EmployeePageHeader({ backTo, title, description }: EmployeePageHeaderProps) {
  return (
    <div className="space-y-3">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to employees
      </Link>
      <div className="space-y-1">
        <h1>{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
