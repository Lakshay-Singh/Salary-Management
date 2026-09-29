import { useQuery } from '@tanstack/react-query'
import { getCountryStats, getJobTitleStats } from './insightsApi'
import { insightsKeys } from './insightsKeys'

export function useCountryStats() {
  return useQuery({ queryKey: insightsKeys.countries, queryFn: getCountryStats })
}

/** Pay by job title in one country; nothing is requested until a country is chosen. */
export function useJobTitleStats(countryCode: string) {
  return useQuery({
    queryKey: insightsKeys.jobTitles(countryCode),
    queryFn: () => getJobTitleStats(countryCode),
    enabled: countryCode !== '',
  })
}
