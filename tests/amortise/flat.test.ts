import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { buildFlatSchedule } from '@/lib/amortise/flat'
import { checkConservation } from '@/lib/amortise/conservation'

/** Fixtures for the flat convention only. Never tested through the annuity. */
const START = period(2026, 9)

describe('flat — bunga flat', () => {
  it('charges the same interest every month, on the original plafon', () => {
    const schedule = buildFlatSchedule({
      principal: rupiah(100_000_000),
      start: START,
      termMonths: 12,
      annualRate: 0.05,
      assumed: false,
      rounding: 'pembulatan-terdekat',
    })

    // 100.000.000 × 5% ÷ 12 = 416.666,67 → 416.667
    for (const instalment of schedule.instalments) {
      expect(instalment.interest).toBe(416_667)
    }
    // The interest does not fall as the balance does — that is the whole
    // difference from the effective convention.
    expect(schedule.instalments[0]?.interest).toBe(schedule.instalments[11]?.interest)
    expect(schedule.totalInterest).toBe(416_667 * 12)
    expect(checkConservation(schedule).failures).toEqual([])
  })

  it('repays the plafon in equal principal steps, with the last clearing the remainder', () => {
    const schedule = buildFlatSchedule({
      principal: rupiah(100_000_000),
      start: START,
      termMonths: 12,
      annualRate: 0.05,
      assumed: false,
      rounding: 'pembulatan-terdekat',
    })
    expect(schedule.instalments[0]?.principal).toBe(8_333_333)
    expect(schedule.instalments[11]?.principal).toBe(8_333_337) // absorbs the remainder
    expect(schedule.instalments[11]?.closingBalance).toBe(0)
  })

  it('labels itself flat, so nothing downstream can mistake it', () => {
    const schedule = buildFlatSchedule({
      principal: rupiah(250_000_000),
      start: START,
      termMonths: 60,
      annualRate: 0.07,
      assumed: false,
      rounding: 'pembulatan-terdekat',
    })
    expect(schedule.convention).toBe('flat')
    expect(
      schedule.trace.some((entry) => entry.type === 'input' && entry.value.startsWith('flat')),
    ).toBe(true)
  })

  it('marks an assumed flat rate in the trace', () => {
    const schedule = buildFlatSchedule({
      principal: rupiah(250_000_000),
      start: START,
      termMonths: 60,
      annualRate: 0.07,
      assumed: true,
      rounding: 'pembulatan-terdekat',
    })
    expect(schedule.trace.some((entry) => entry.type === 'assumption')).toBe(true)
  })
})
