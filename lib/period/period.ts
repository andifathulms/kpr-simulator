/**
 * A period is two integers. No date library, and the engine never reads the
 * clock — the period is always an explicit argument.
 */
export interface Period {
  readonly year: number
  readonly month: number // 1–12
}

export class PeriodError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PeriodError'
  }
}

export function period(year: number, month: number): Period {
  if (!Number.isSafeInteger(year)) throw new PeriodError(`Tahun harus bilangan bulat: ${year}`)
  if (!Number.isSafeInteger(month) || month < 1 || month > 12) {
    throw new PeriodError(`Bulan harus 1–12, diterima: ${month}`)
  }
  return { year, month }
}

/** Months since year 0, month 1. Total ordering without a Date. */
export function ordinal(p: Period): number {
  return p.year * 12 + (p.month - 1)
}

export function fromOrdinal(value: number): Period {
  const year = Math.floor(value / 12)
  return period(year, (value % 12) + 1)
}

export function addMonths(p: Period, months: number): Period {
  if (!Number.isSafeInteger(months)) {
    throw new PeriodError(`Jumlah bulan harus bilangan bulat: ${months}`)
  }
  return fromOrdinal(ordinal(p) + months)
}

export function monthsBetween(from: Period, to: Period): number {
  return ordinal(to) - ordinal(from)
}

export function comparePeriods(a: Period, b: Period): -1 | 0 | 1 {
  const difference = ordinal(a) - ordinal(b)
  return difference < 0 ? -1 : difference > 0 ? 1 : 0
}

export function periodsEqual(a: Period, b: Period): boolean {
  return comparePeriods(a, b) === 0
}

/** Inclusive of `from`, inclusive of `to`. */
export function withinRange(p: Period, from: Period, to: Period | null): boolean {
  if (comparePeriods(p, from) < 0) return false
  if (to !== null && comparePeriods(p, to) > 0) return false
  return true
}

/** "2025-04" — the only string form, used in rule packs and in the URL hash. */
export function formatPeriod(p: Period): string {
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}`
}

export function parsePeriod(value: string): Period {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match || match[1] === undefined || match[2] === undefined) {
    throw new PeriodError(`Periode harus berformat YYYY-MM, diterima: "${value}"`)
  }
  return period(Number(match[1]), Number(match[2]))
}
