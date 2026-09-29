type QueryValue = string | number | undefined

/**
 * Appends the given parameters, in the order given, as an encoded query string.
 * Strings are trimmed, and empty values are left out: a cleared filter means no filter, not "match the empty string".
 */
export function withQuery(path: string, parameters: ReadonlyArray<readonly [name: string, value: QueryValue]>): string {
  const query = new URLSearchParams()
  for (const [name, value] of parameters) {
    const text = typeof value === 'string' ? value.trim() : value?.toString()
    if (text) query.set(name, text)
  }
  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}
