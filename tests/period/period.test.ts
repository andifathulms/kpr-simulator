import { describe, expect, it } from 'vitest'
import {
  PeriodError,
  addMonths,
  comparePeriods,
  formatPeriod,
  monthsBetween,
  parsePeriod,
  period,
  withinRange,
} from '@/lib/period/period'

describe('period', () => {
  it('rejects an impossible month', () => {
    expect(() => period(2025, 0)).toThrow(PeriodError)
    expect(() => period(2025, 13)).toThrow(PeriodError)
    expect(() => period(2025.5, 4)).toThrow(PeriodError)
  })

  it('crosses year boundaries in both directions', () => {
    expect(addMonths(period(2025, 12), 1)).toEqual(period(2026, 1))
    expect(addMonths(period(2025, 1), -1)).toEqual(period(2024, 12))
    expect(addMonths(period(2025, 4), 240)).toEqual(period(2045, 4))
  })

  it('measures a 20-year tenor as 240 months', () => {
    expect(monthsBetween(period(2025, 4), period(2045, 4))).toBe(240)
    expect(monthsBetween(period(2045, 4), period(2025, 4))).toBe(-240)
  })

  it('orders periods', () => {
    expect(comparePeriods(period(2025, 4), period(2025, 5))).toBe(-1)
    expect(comparePeriods(period(2025, 4), period(2025, 4))).toBe(0)
    expect(comparePeriods(period(2026, 1), period(2025, 12))).toBe(1)
  })

  it('treats an open-ended range as unbounded above', () => {
    const from = period(2025, 4)
    expect(withinRange(period(2025, 3), from, null)).toBe(false)
    expect(withinRange(period(2025, 4), from, null)).toBe(true)
    expect(withinRange(period(2099, 12), from, null)).toBe(true)
    expect(withinRange(period(2026, 1), from, period(2025, 12))).toBe(false)
  })

  it('round-trips through its string form', () => {
    expect(formatPeriod(period(2025, 4))).toBe('2025-04')
    expect(parsePeriod('2025-04')).toEqual(period(2025, 4))
    expect(() => parsePeriod('2025-4')).toThrow(PeriodError)
    expect(() => parsePeriod('April 2025')).toThrow(PeriodError)
  })
})
