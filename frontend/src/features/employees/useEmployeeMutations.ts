import { useMutation, useQueryClient } from '@tanstack/react-query'
import { insightsKeys } from '@/features/insights/insightsKeys'
import { createEmployee, deleteEmployee, type EmployeeInput, updateEmployee } from './employeesApi'
import { employeeKeys } from './useEmployeesList'
import { referenceKeys } from './useReferenceData'

/**
 * After any change, every employee list, employee, job-title list and pay statistic is out of date.
 * They are only marked stale, not refetched now: the directory refetches as it opens, and the page being left
 * (after a delete, an employee that no longer exists) is never requested again.
 */
function useMarkEmployeeDataStale() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: employeeKeys.all, refetchType: 'none' }),
      queryClient.invalidateQueries({ queryKey: referenceKeys.allJobTitles, refetchType: 'none' }),
      queryClient.invalidateQueries({ queryKey: insightsKeys.all, refetchType: 'none' }),
    ])
}

export function useCreateEmployee() {
  const markStale = useMarkEmployeeDataStale()
  // Wrapped: React Query passes its own context as a second argument, which is not part of the API call
  return useMutation({ mutationFn: (input: EmployeeInput) => createEmployee(input), onSuccess: markStale })
}

export function useUpdateEmployee(id: string) {
  const markStale = useMarkEmployeeDataStale()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EmployeeInput) => updateEmployee(id, input),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(employeeKeys.detail(id), updatedEmployee)
      markStale()
    },
  })
}

export function useDeleteEmployee(id: string) {
  const markStale = useMarkEmployeeDataStale()
  return useMutation({ mutationFn: () => deleteEmployee(id), onSuccess: markStale })
}
