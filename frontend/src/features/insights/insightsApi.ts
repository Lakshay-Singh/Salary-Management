import { api } from '@/lib/apiClient'

// These mirror the API's responses (backend/src/repositories/analytics.repository.ts).
// Every salary figure is in whole units of the country's own currency; average and median are rounded.

export interface CountryStats {
  countryCode: string
  currencyCode: string
  headcount: number
  min: number
  max: number
  average: number
  median: number
}

export interface JobTitleStats {
  jobTitle: string
  headcount: number
  min: number
  average: number
  max: number
}

/** One entry per country that has at least one employee. */
export const getCountryStats = () => api.get<CountryStats[]>('/api/analytics/countries')

// The country code comes from the page URL, so it is encoded rather than trusted
export const getJobTitleStats = (countryCode: string) =>
  api.get<JobTitleStats[]>(`/api/analytics/countries/${encodeURIComponent(countryCode)}/job-titles`)
