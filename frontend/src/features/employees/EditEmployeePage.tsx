import { LoaderCircle, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api'
import { EmployeeForm } from './EmployeeForm'
import { EmployeePageHeader } from './EmployeePageHeader'
import type { Employee } from './employeesApi'
import { PeerPosition } from './PeerPosition'
import { useEmployee } from './useEmployee'
import { useDeleteEmployee, useUpdateEmployee } from './useEmployeeMutations'
import { useReturnTo } from './useReturnTo'
import type { EmployeeFormValues } from './validateEmployee'

const toFormValues = (employee: Employee): EmployeeFormValues => ({
  fullName: employee.fullName,
  jobTitle: employee.jobTitle,
  countryCode: employee.countryCode,
  salary: String(employee.salary),
})

export function EditEmployeePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const employee = useEmployee(id)
  const update = useUpdateEmployee(id)

  if (employee.isLoading) return <LoadingEmployee />

  if (!employee.data) {
    const notFound = employee.error instanceof ApiError && employee.error.status === 404
    return (
      <section className="mx-auto max-w-2xl space-y-6">
        <EmployeePageHeader
          backTo={returnTo}
          title={notFound ? 'Employee not found' : 'Could not load this employee'}
          description={
            notFound
              ? `No employee has the ID ${id}. They may have been deleted.`
              : 'Check your connection and try again.'
          }
        />
        {!notFound && (
          <Button variant="outline" onClick={() => employee.refetch()}>
            Try again
          </Button>
        )}
      </section>
    )
  }

  const current = employee.data
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <EmployeePageHeader backTo={returnTo} title="Edit employee" description={`${current.fullName}, employee ID ${current.id}`} />
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent>
          <EmployeeForm
            key={current.id}
            initialValues={toFormValues(current)}
            submitLabel="Save changes"
            submittingLabel="Saving..."
            isSubmitting={update.isPending}
            error={update.error}
            cancelTo={returnTo}
            onSubmit={(input) => update.mutate(input, { onSuccess: () => navigate(returnTo) })}
            secondaryAction={<DeleteEmployeeButton employee={current} onDeleted={() => navigate(returnTo)} />}
          />
        </CardContent>
      </Card>
      <PeerPosition employee={current} />
    </section>
  )
}

function DeleteEmployeeButton({ employee, onDeleted }: { employee: Employee; onDeleted: () => void }) {
  const remove = useDeleteEmployee(String(employee.id))

  return (
    <AlertDialog>
      {/* type="button": this sits inside the form, where a plain button would also submit it */}
      <AlertDialogTrigger render={<Button type="button" variant="destructive" size="lg" />}>
        <Trash2 aria-hidden />
        Delete employee
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete ${employee.fullName}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes {employee.fullName} and their salary from the directory and from every report. It
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.error && (
          <p role="alert" className="text-sm text-destructive">
            Could not delete this employee. Check your connection and try again.
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          {/* Not a closing button: the dialog stays open, showing progress, until the delete has succeeded */}
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate(undefined, { onSuccess: onDeleted })}
          >
            {remove.isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function LoadingEmployee() {
  return (
    <section className="mx-auto max-w-2xl space-y-6" aria-busy="true" aria-label="Loading employee">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-9 sm:col-span-2" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </CardContent>
      </Card>
    </section>
  )
}
