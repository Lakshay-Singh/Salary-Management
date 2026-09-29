import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { type EmployeeListParams, listEmployees } from './employeesApi'

/** Cache keys for employee data; mutations invalidate employeeKeys.all to refresh every page. */
export const employeeKeys = {
  all: ['employees'] as const,
  list: (params: EmployeeListParams) => [...employeeKeys.all, 'list', params] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
  peerPosition: (id: string) => [...employeeKeys.all, 'peer-position', id] as const,
}

/** One page of the directory. The previous page stays on screen while the next one loads. */
export function useEmployeesList(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployees(params),
    placeholderData: keepPreviousData,
  })
}
