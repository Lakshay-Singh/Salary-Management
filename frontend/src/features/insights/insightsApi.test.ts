import { describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/apiClient'
import { getCountryStats, getJobTitleStats } from './insightsApi'

vi.mock('@/lib/apiClient', () => ({ api: { get: vi.fn() } }))
const get = vi.mocked(api.get)

describe('getCountryStats', () => {
  it('requests pay statistics for every country and returns them', async () => {
    const stats = [{ countryCode: 'IN', currencyCode: 'INR', headcount: 3, min: 1, max: 3, average: 2, median: 2 }]
    get.mockResolvedValueOnce(stats)

    expect(await getCountryStats()).toEqual(stats)
    expect(get).toHaveBeenCalledWith('/api/analytics/countries')
  })
})

describe('getJobTitleStats', () => {
  it("requests one country's pay statistics by job title", async () => {
    get.mockResolvedValueOnce([])

    await getJobTitleStats('IN')

    expect(get).toHaveBeenCalledWith('/api/analytics/countries/IN/job-titles')
  })

  it('encodes the country code, which comes straight from the page URL', async () => {
    get.mockResolvedValueOnce([])

    await getJobTitleStats('I/N')

    expect(get).toHaveBeenCalledWith('/api/analytics/countries/I%2FN/job-titles')
  })
})
