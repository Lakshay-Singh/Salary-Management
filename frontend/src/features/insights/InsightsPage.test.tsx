import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCountries } from '@/features/employees/employeesApi'
import { ApiError } from '@/lib/api'
import { COUNTRIES } from '@/test/employeeFixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { getCountryStats, getJobTitleStats } from './insightsApi'
import { InsightsPage } from './InsightsPage'

vi.mock('./insightsApi', () => ({ getCountryStats: vi.fn(), getJobTitleStats: vi.fn() }))
vi.mock('@/features/employees/employeesApi', () => ({ getCountries: vi.fn(), getJobTitles: vi.fn() }))

const RUPEE = String.fromCodePoint(0x20b9)

const WITH_UNSTAFFED_COUNTRY = [...COUNTRIES, { countryCode: 'GB', name: 'United Kingdom', currencyCode: 'GBP' }]

const COUNTRY_STATS = [
  { countryCode: 'US', currencyCode: 'USD', headcount: 4, min: 90_000, max: 400_000, average: 177_500, median: 110_000 },
  {
    countryCode: 'IN',
    currencyCode: 'INR',
    headcount: 3_399,
    min: 1_000_000,
    max: 2_000_000,
    average: 1_366_667,
    median: 1_100_000,
  },
]

const INDIA_JOB_TITLE_STATS = [
  { jobTitle: 'Engineering Manager', headcount: 1, min: 2_000_000, average: 2_000_000, max: 2_000_000 },
  { jobTitle: 'Software Engineer', headcount: 2, min: 1_000_000, average: 1_050_000, max: 1_100_000 },
]

beforeEach(() => {
  vi.mocked(getCountries).mockResolvedValue(WITH_UNSTAFFED_COUNTRY)
  vi.mocked(getCountryStats).mockResolvedValue(COUNTRY_STATS)
  vi.mocked(getJobTitleStats).mockResolvedValue(INDIA_JOB_TITLE_STATS)
})

function renderInsights(url = '/insights') {
  return renderRoutes([{ path: '/insights', element: <InsightsPage /> }], { url })
}

const tableNamed = (name: string) => screen.getByRole('table', { name })
const bodyRowTexts = (table: HTMLElement) =>
  within(within(table).getAllByRole('rowgroup')[1])
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))

describe('InsightsPage', () => {
  it('shows pay for every country by name, sorted by name, with salaries in each local currency', async () => {
    renderInsights()

    await screen.findByRole('cell', { name: 'United States' })

    expect(bodyRowTexts(tableNamed('Pay by country'))).toEqual([
      ['India', 'INR', '3,399', `${RUPEE}10,00,000`, `${RUPEE}13,66,667`, `${RUPEE}11,00,000`, `${RUPEE}20,00,000`],
      ['United States', 'USD', '4', '$90,000', '$177,500', '$110,000', '$400,000'],
    ])
  })

  it('marks the country table busy while it loads', () => {
    vi.mocked(getCountryStats).mockReturnValue(new Promise(() => {}))
    renderInsights()

    expect(tableNamed('Pay by country')).toHaveAttribute('aria-busy', 'true')
  })

  it('does not request pay by role until a country is chosen', async () => {
    renderInsights()
    await screen.findByRole('cell', { name: 'India' })

    expect(screen.getByText('Choose a country to see pay by role.')).toBeInTheDocument()
    expect(getJobTitleStats).not.toHaveBeenCalled()
  })

  it("picking a country loads its pay by role, in its currency, and puts the country in the URL", async () => {
    const { router } = renderInsights()
    await screen.findByRole('option', { name: 'India' })

    await userEvent.selectOptions(screen.getByLabelText('Country'), 'IN')

    await screen.findByRole('cell', { name: 'Software Engineer' })
    expect(getJobTitleStats).toHaveBeenCalledWith('IN')
    expect(new URLSearchParams(router.state.location.search).get('country')).toBe('IN')
    expect(bodyRowTexts(tableNamed('Pay by role'))).toEqual([
      ['Engineering Manager', '1', `${RUPEE}20,00,000`, `${RUPEE}20,00,000`, `${RUPEE}20,00,000`],
      ['Software Engineer', '2', `${RUPEE}10,00,000`, `${RUPEE}10,50,000`, `${RUPEE}11,00,000`],
    ])
  })

  it('opens with the country from the URL already chosen, so the view survives a reload or a shared link', async () => {
    renderInsights('/insights?country=IN')

    await screen.findByRole('cell', { name: 'Software Engineer' })
    expect(getJobTitleStats).toHaveBeenCalledWith('IN')
    expect(screen.getByLabelText('Country')).toHaveValue('IN')
  })

  it('clicking a country in the overview shows its pay by role', async () => {
    const { router } = renderInsights()

    await userEvent.click(await screen.findByRole('link', { name: 'India' }))

    expect(await screen.findByRole('cell', { name: 'Software Engineer' })).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).get('country')).toBe('IN')
  })

  it('says so when the chosen country has no employees yet', async () => {
    vi.mocked(getJobTitleStats).mockResolvedValue([])
    renderInsights('/insights?country=GB')

    expect(await screen.findByText('No employees in United Kingdom yet.')).toBeInTheDocument()
  })

  it('says so when the country in the URL is not a supported country', async () => {
    vi.mocked(getJobTitleStats).mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Country XX not found'))
    renderInsights('/insights?country=XX')

    expect(await screen.findByRole('alert')).toHaveTextContent('XX is not a supported country.')
  })

  it('shows an error with a way to retry when pay by country cannot be loaded', async () => {
    vi.mocked(getCountryStats).mockRejectedValueOnce(new Error('network down'))
    renderInsights()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load pay by country.')

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('cell', { name: 'India' })).toBeInTheDocument()
  })
})
