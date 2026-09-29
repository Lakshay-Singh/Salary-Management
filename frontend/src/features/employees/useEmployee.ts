import { useQuery } from '@tanstack/react-query'
import { getEmployee } from './employeesApi'
import { employeeKeys } from './useEmployeesList'

/** One employee, by the id in the page URL. */
export function useEmployee(id: string) {
  return useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => getEmployee(id) })
}
