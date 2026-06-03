/**
 * Money formatting — EUR, matching the prototype's behaviour exactly.
 * Uses en-IE locale: €1,234 or €1,234.56
 */

const fmtWhole = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fmtCents = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export interface MoneyOptions {
  /** Always show 2 decimal places */
  cents?: boolean
  /** Show cents only when the value is not a whole number */
  auto?: boolean
  /** Prefix with + or − instead of relying on the sign in the value */
  sign?: boolean
}

/**
 * Format a number as EUR currency.
 *
 * @example
 * money(1234)             // "€1,234"
 * money(55.5, { cents })  // "€55.50"
 * money(-300, { sign })   // "−€300"
 * money(100,  { sign })   // "+€100"
 */
export function money(n: number, opts: MoneyOptions = {}): string {
  if (isNaN(n)) return '€0'

  if (opts.sign) {
    const abs = Math.abs(n)
    const prefix = n < 0 ? '−' : '+'
    const formatted = fmt(abs, opts)
    return prefix + formatted
  }

  return fmt(n, opts)
}

function fmt(n: number, opts: MoneyOptions): string {
  const isWhole = Math.abs(n % 1) < 0.005
  if (opts.cents) return fmtCents.format(n)
  if (opts.auto) return isWhole ? fmtWhole.format(n) : fmtCents.format(n)
  return fmtWhole.format(Math.round(n))
}
