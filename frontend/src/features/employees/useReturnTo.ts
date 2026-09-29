import { useLocation } from 'react-router'

const DIRECTORY = '/employees'

/** Link state that brings the user back to this exact directory view, with its filters, sort and page. */
export const returnToState = (location: { pathname: string; search: string }) => ({
  returnTo: location.pathname + location.search,
})

/**
 * Where to go when the form is done: the directory view the user came from, or the plain directory.
 * Only directory URLs are honoured, so state from anywhere else can never send the user off to another page.
 */
export function useReturnTo(): string {
  const { state } = useLocation()
  const returnTo: unknown = typeof state === 'object' && state !== null && 'returnTo' in state ? state.returnTo : undefined
  return typeof returnTo === 'string' && (returnTo === DIRECTORY || returnTo.startsWith(`${DIRECTORY}?`))
    ? returnTo
    : DIRECTORY
}
