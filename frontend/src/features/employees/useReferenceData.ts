import { useQuery } from '@tanstack/react-query'
import { getCountries, getJobTitles } from './employeesApi'

export const referenceKeys = {
  countries: ['countries'] as const,
  // A blank country means all countries, the same as the API request it makes
  jobTitles: (countryCode?: string) => ['job-titles', countryCode || 'all'] as const,
}

/** The fixed list of supported countries: it cannot change while the app is open, so it is fetched once. */
export function useCountries() {
  return useQuery({ queryKey: referenceKeys.countries, queryFn: getCountries, staleTime: Infinity })
}

/** Job titles held by at least one employee, optionally in one country. Changes as employees are edited. */
export function useJobTitles(countryCode?: string) {
  return useQuery({
    queryKey: referenceKeys.jobTitles(countryCode),
    queryFn: () => getJobTitles(countryCode),
  })
}
