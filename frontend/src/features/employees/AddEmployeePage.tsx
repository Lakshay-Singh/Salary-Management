import { useNavigate } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { EmployeeForm } from './EmployeeForm'
import { EmployeePageHeader } from './EmployeePageHeader'
import { useCreateEmployee } from './useEmployeeMutations'
import { useReturnTo } from './useReturnTo'

export function AddEmployeePage() {
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const create = useCreateEmployee()

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <EmployeePageHeader
        backTo={returnTo}
        title="Add employee"
        description="They appear in the directory and in every report as soon as they are saved."
      />
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent>
          <EmployeeForm
            submitLabel="Add employee"
            submittingLabel="Adding..."
            isSubmitting={create.isPending}
            error={create.error}
            cancelTo={returnTo}
            onSubmit={(input) => create.mutate(input, { onSuccess: () => navigate(returnTo) })}
          />
        </CardContent>
      </Card>
    </section>
  )
}
