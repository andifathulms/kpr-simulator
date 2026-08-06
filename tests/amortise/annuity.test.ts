import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { annuityPaymentExact } from '@/lib/amortise/annuity'
import { ScheduleError, buildSchedule } from '@/lib/amortise/schedule'
import { checkConservation } from '@/lib/amortise/conservation'

/**
 * Fixtures for the effective convention only. Flat has its own file and is
 * never tested through this one.
 */
const START = period(2026, 9)

describe('annuity — bunga efektif', () => {
  it('matches a hand-checked instalment', () => {
    // Rp100.000.000 at 10% per year over 12 months.
    // i = 0,10/12; angsuran = P·i / (1 − (1+i)^−12) = 8.791.588,7…
    const exact = annuityPaymentExact(rupiah(100_000_000), 0.1, 12)
    expect(exact).toBeCloseTo(8_791_588.72, 2)
  })

  it('spreads a zero-rate loan evenly rather than dividing by zero', () => {
    expect(annuityPaymentExact(rupiah(120_000_000), 0, 12)).toBe(10_000_000)
    const schedule = buildSchedule({
      principal: rupiah(120_000_000),
      start: START,
      termMonths: 12,
      rounding: 'pembulatan-terdekat',
      segments: [{ months: 12, annualRate: 0, phase: 'tetap', assumed: false }],
    })
    expect(schedule.totalInterest).toBe(0)
    expect(schedule.instalments[0]?.payment).toBe(10_000_000)
    expect(checkConservation(schedule).failures).toEqual([])
  })

  it('charges interest on the outstanding balance, so early payments are mostly interest', () => {
    const schedule = buildSchedule({
      principal: rupiah(500_000_000),
      start: START,
      termMonths: 240,
      rounding: 'pembulatan-terdekat',
      segments: [{ months: 240, annualRate: 0.115, phase: 'tetap', assumed: false }],
    })
    const first = schedule.instalments[0]
    const last = schedule.instalments[239]
    expect(first?.interest).toBe(4_791_667) // 500.000.000 × 0,115 ÷ 12
    expect(first?.interest).toBeGreaterThan(first?.principal ?? 0)
    expect(last?.principal).toBeGreaterThan(last?.interest ?? 0)
    expect(last?.closingBalance).toBe(0)
    expect(checkConservation(schedule).failures).toEqual([])
  })

  it('recomputes the instalment on the remaining balance and remaining term', () => {
    const schedule = buildSchedule({
      principal: rupiah(500_000_000),
      start: START,
      termMonths: 240,
      rounding: 'pembulatan-terdekat',
      segments: [
        { months: 36, annualRate: 0.0325, phase: 'tetap', assumed: false },
        { months: 204, annualRate: 0.125, phase: 'mengambang', assumed: true },
      ],
    })

    const lastFixed = schedule.instalments[35]
    const firstFloating = schedule.instalments[36]
    expect(lastFixed?.payment).toBeDefined()
    expect(firstFloating?.payment).toBeGreaterThan(lastFixed?.payment ?? 0)

    // The step at the boundary is the number a family discovers in year four.
    const step = (firstFloating?.payment ?? 0) - (lastFixed?.payment ?? 0)
    expect(step).toBeGreaterThan(1_000_000)

    // And the assumption is recorded in the trace, for the interface to
    // render in amber.
    expect(schedule.trace.some((entry) => entry.type === 'assumption')).toBe(true)
  })

  it('records every rounding as its own step naming the convention', () => {
    const schedule = buildSchedule({
      principal: rupiah(300_000_000),
      start: START,
      termMonths: 120,
      rounding: 'pembulatan-ke-atas',
      segments: [{ months: 120, annualRate: 0.09, phase: 'tetap', assumed: false }],
    })
    const roundings = schedule.trace.filter((entry) => entry.type === 'rounding')
    expect(roundings.length).toBeGreaterThan(0)
    for (const entry of roundings) {
      if (entry.type !== 'rounding') continue
      expect(entry.convention).toBe('pembulatan-ke-atas')
    }
  })

  it('is deterministic — the same inputs produce a byte-identical trace', () => {
    const terms = {
      principal: rupiah(425_000_000),
      start: START,
      termMonths: 180,
      rounding: 'pembulatan-terdekat' as const,
      segments: [
        { months: 24, annualRate: 0.0399, phase: 'tetap' as const, assumed: false },
        { months: 156, annualRate: 0.1275, phase: 'mengambang' as const, assumed: true },
      ],
    }
    expect(JSON.stringify(buildSchedule(terms))).toBe(JSON.stringify(buildSchedule(terms)))
  })

  it('refuses segments that do not cover the tenor exactly', () => {
    expect(() =>
      buildSchedule({
        principal: rupiah(100_000_000),
        start: START,
        termMonths: 240,
        rounding: 'pembulatan-terdekat',
        segments: [{ months: 36, annualRate: 0.05, phase: 'tetap', assumed: false }],
      }),
    ).toThrow(ScheduleError)
  })

  it('refuses a plafon that is not positive', () => {
    expect(() =>
      buildSchedule({
        principal: rupiah(-1),
        start: START,
        termMonths: 12,
        rounding: 'pembulatan-terdekat',
        segments: [{ months: 12, annualRate: 0.05, phase: 'tetap', assumed: false }],
      }),
    ).toThrow(ScheduleError)
  })
})
