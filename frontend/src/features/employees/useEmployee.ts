import { useQuery } from '@tanstack/react-query'
import { getEmployee, getPeerPosition } from './employeesApi'
import { employeeKeys } from './useEmployeesList'

/** One employee, by the id in the page URL. */
export function useEmployee(id: string) {
  return useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => getEmployee(id) })
}

/** How one employee's salary compares with peers in the same country and job title. */
export function usePeerPosition(id: string) {
  return useQuery({ queryKey: employeeKeys.peerPosition(id), queryFn: () => getPeerPosition(id) })
}
