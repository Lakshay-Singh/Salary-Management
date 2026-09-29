import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ASHA, COUNTRIES } from '@/test/employeeFixtures'
import { renderRoutes } from '@/test/renderRoutes'
import { getCountries, getPeerPosition, type PeerPosition as PeerPositionData } from './employeesApi'
import { PeerPosition } from './PeerPosition'

vi.mock('./employeesApi', () => ({ getPeerPosition: vi.fn(), getCountries: vi.fn(), getJobTitles: vi.fn() }))

const RUPEE = String.fromCodePoint(0x20b9)

const ABOVE: PeerPositionData = { peerCount: 3, peerAverage: 1_000_000, percentageDiff: 20, label: 'Above average' }

beforeEach(() => {
  vi.mocked(getCountries).mockResolvedValue(COUNTRIES)
  vi.mocked(getPeerPosition).mockResolvedValue(ABOVE)
})

function renderPeerPosition() {
  renderRoutes([{ path: '/employees/:id/edit', element: <PeerPosition employee={ASHA} /> }], {
    url: '/employees/1/edit',
  })
}

const section = () => screen.getByRole('region', { name: 'Peer position' })
// Each figure is a <dt> label with its value in the following <dd>
const figure = (term: string) => within(section()).getByText(term).nextElementSibling?.textContent

describe('PeerPosition', () => {
  it('shows the label, how many peers, their average in the employee\'s currency, and the difference', async () => {
    renderPeerPosition()

    expect(await within(section()).findByText('Above average')).toBeInTheDocument()
    expect(getPeerPosition).toHaveBeenCalledWith('1')
    expect(figure('Peers')).toBe('3')
    expect(figure('Peer average')).toBe(`${RUPEE}10,00,000`)
    expect(figure('Difference')).toBe('+20%')
  })

  it('shows a salary below the peer average as a negative difference', async () => {
    vi.mocked(getPeerPosition).mockResolvedValue({ ...ABOVE, percentageDiff: -15, label: 'Below average' })
    renderPeerPosition()

    expect(await within(section()).findByText('Below average')).toBeInTheDocument()
    expect(figure('Difference')).toBe('-15%')
  })

  it.each([
    ['Above average', 'green'],
    ['At average', 'amber'],
    ['Below average', 'red'],
  ] as const)('shows "%s" in %s', async (label, tone) => {
    vi.mocked(getPeerPosition).mockResolvedValue({ ...ABOVE, label })
    renderPeerPosition()

    expect(await within(section()).findByText(label)).toHaveAttribute('data-tone', tone)
  })

  it('shows a skeleton, and marks the section busy, while loading', () => {
    vi.mocked(getPeerPosition).mockReturnValue(new Promise(() => {}))
    renderPeerPosition()

    expect(section()).toHaveAttribute('aria-busy', 'true')
    expect(within(section()).queryByText('Above average')).not.toBeInTheDocument()
  })

  it('explains "Not enough peers" in muted colour, with no average or difference to show', async () => {
    vi.mocked(getPeerPosition).mockResolvedValue({
      peerCount: 2,
      peerAverage: null,
      percentageDiff: null,
      label: 'Not enough peers',
    })
    renderPeerPosition()

    expect(await within(section()).findByText('Not enough peers')).toHaveAttribute('data-tone', 'muted')
    expect(figure('Peers')).toBe('2')
    expect(within(section()).getByText(/fewer than 3 other employees/i)).toBeInTheDocument()
    expect(within(section()).queryByText('Peer average')).not.toBeInTheDocument()
    expect(within(section()).queryByText('Difference')).not.toBeInTheDocument()
  })

  it('shows an error with a way to retry when the peer position cannot be loaded', async () => {
    vi.mocked(getPeerPosition).mockRejectedValueOnce(new Error('network down'))
    renderPeerPosition()

    expect(await within(section()).findByRole('alert')).toHaveTextContent('Could not load the peer position.')

    await userEvent.click(within(section()).getByRole('button', { name: 'Try again' }))

    expect(await within(section()).findByText('Above average')).toBeInTheDocument()
  })
})
