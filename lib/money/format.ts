import type { Rupiah } from './rupiah'

/**
 * Display only. Intl.NumberFormat covers this; no currency dependency.
 * Amounts are already integers, so no fraction digits are ever shown.
 */
const FORMATTERS = new Map<string, Intl.NumberFormat>()

function formatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}:${JSON.stringify(options)}`
  const existing = FORMATTERS.get(key)
  if (existing) return existing
  const created = new Intl.NumberFormat(locale, options)
  FORMATTERS.set(key, created)
  return created
}

/**
 * "Rp1.234.567".
 *
 * ICU emits a no-break space after the symbol; Indonesian banks do not write
 * one, and the schedule reads as a bank document, so it is removed.
 */
export function formatRupiah(value: Rupiah, locale = 'id-ID'): string {
  return formatter(locale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/^(Rp)[\s ]+/u, '$1')
}

/** "1.234.567" — for table columns where the Rp sits in the header. */
export function formatAmount(value: Rupiah, locale = 'id-ID'): string {
  return formatter(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

/** A decimal rate rendered as a percentage: 0.115 → "11,50%" */
export function formatRate(rate: number, locale = 'id-ID', fractionDigits = 2): string {
  return formatter(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rate)
}
