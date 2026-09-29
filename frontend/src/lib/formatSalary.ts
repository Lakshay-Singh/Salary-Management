// Each currency is written the way its home market reads it: rupees grouped in lakhs, every other currency in thousands.
// One locale for all would be wrong somewhere: en-IN writes a US salary as $1,25,000, en-US writes rupees as 1,500,000.
const LOCALE_BY_CURRENCY: Partial<Record<string, string>> = { INR: 'en-IN' }
const DEFAULT_LOCALE = 'en-US'
const NO_BREAK_SPACE = String.fromCodePoint(0x00a0)

// Creating an Intl.NumberFormat costs far more than using one, and a directory page formats many salaries
const formatters = new Map<string, Intl.NumberFormat>()

function formatterFor(currencyCode: string): Intl.NumberFormat {
  const code = currencyCode.toUpperCase()
  let formatter = formatters.get(code)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE_BY_CURRENCY[code] ?? DEFAULT_LOCALE, {
      style: 'currency',
      currency: code,
      // Older engines throw when the maximum is below a currency's default minimum (2 for USD), so set both
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    formatters.set(code, formatter)
  }
  return formatter
}

const groupedAmount = new Intl.NumberFormat(DEFAULT_LOCALE, { maximumFractionDigits: 0 })

/** A salary in whole units of its currency, such as "$75,000". Never throws, whatever the currency code. */
export function formatSalary(amount: number, currencyCode: string): string {
  try {
    return formatterFor(currencyCode).format(amount)
  } catch {
    // Intl rejects malformed codes; show the code beside the amount, as Intl itself does for codes it has no symbol for
    const amountText = groupedAmount.format(amount)
    return currencyCode ? `${currencyCode}${NO_BREAK_SPACE}${amountText}` : amountText
  }
}
