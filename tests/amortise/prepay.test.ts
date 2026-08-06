import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { checkConservation } from '@/lib/amortise/conservation'
import { simulatePrepayment, type PrepayTerms } from '@/lib/amortise/prepay'
import { ScheduleError } from '@/lib/amortise/schedule'

const START = period(2026, 9)

function terms(overrides: Partial<PrepayTerms> = {}): PrepayTerms {
  return {
    principal: rupiah(600_000_000),
    start: START,
    termMonths: 240,
    rounding: 'pembulatan-terdekat',
    segments: [
      { months: 36, annualRate: 0.0325, phase: 'tetap', assumed: false },
      { months: 204, annualRate: 0.115, phase: 'mengambang', assumed: true },
    ],
    prepayments: [{ atMonth: 48, amount: rupiah(100_000_000) }],
    mode: 'perpendek-tenor',
    penaltyRate: 0.01,
    ...overrides,
  }
}

describe('pelunasan sebagian', () => {
  it('conserves, in both modes', () => {
    for (const mode of ['perpendek-tenor', 'perkecil-angsuran'] as const) {
      const result = simulatePrepayment(terms({ mode }))
      expect(checkConservation(result.withPrepayment).failures).toEqual([])
      expect(checkConservation(result.baseline).failures).toEqual([])
    }
  })

  it('shortens the tenor when asked to, keeping the instalment', () => {
    const result = simulatePrepayment(terms({ mode: 'perpendek-tenor' }))
    expect(result.monthsSaved).toBeGreaterThan(0)
    expect(result.withPrepayment.termMonths).toBeLessThan(240)
    // The instalment either side of the prepayment is unchanged.
    const before = result.withPrepayment.instalments[46]?.payment
    const after = result.withPrepayment.instalments[48]?.payment
    expect(after).toBe(before)
  })

  it('reduces the instalment when asked to, keeping the tenor', () => {
    const result = simulatePrepayment(terms({ mode: 'perkecil-angsuran' }))
    expect(result.monthsSaved).toBe(0)
    expect(result.withPrepayment.termMonths).toBe(240)
    const before = result.withPrepayment.instalments[46]?.payment ?? 0
    const after = result.withPrepayment.instalments[48]?.payment ?? 0
    expect(after).toBeLessThan(before)
  })

  it('saves interest in both modes, and more by shortening the tenor', () => {
    const shorten = simulatePrepayment(terms({ mode: 'perpendek-tenor' }))
    const reduce = simulatePrepayment(terms({ mode: 'perkecil-angsuran' }))
    expect(shorten.interestSaved).toBeGreaterThan(0)
    expect(reduce.interestSaved).toBeGreaterThan(0)
    expect(shorten.interestSaved).toBeGreaterThan(reduce.interestSaved)
  })

  it('charges the penalty on the amount prepaid and nets it off the saving', () => {
    const result = simulatePrepayment(terms({ penaltyRate: 0.01 }))
    expect(result.totalPrepaid).toBe(100_000_000)
    expect(result.penalty).toBe(1_000_000)
    expect(result.netSaving).toBe(result.interestSaved - result.penalty)
  })

  it('reports a net loss as a net loss rather than hiding it', () => {
    // A late, small prepayment against a punitive penalty.
    const result = simulatePrepayment(
      terms({
        prepayments: [{ atMonth: 236, amount: rupiah(5_000_000) }],
        penaltyRate: 0.5,
        mode: 'perkecil-angsuran',
      }),
    )
    expect(result.netSaving).toBeLessThan(0)
  })

  it('records the penalty as an assumption, because banks set it themselves', () => {
    const result = simulatePrepayment(terms())
    expect(
      result.withPrepayment.trace.some(
        (entry) => entry.type === 'assumption' && entry.label.includes('Penalti'),
      ),
    ).toBe(true)
  })

  it('never overpays: a lump sum larger than the balance settles it exactly', () => {
    const result = simulatePrepayment(
      terms({ prepayments: [{ atMonth: 12, amount: rupiah(900_000_000) }] }),
    )
    expect(checkConservation(result.withPrepayment).failures).toEqual([])
    expect(result.withPrepayment.termMonths).toBe(12)
    expect(result.withPrepayment.instalments[11]?.closingBalance).toBe(0)
    expect(result.totalPrepaid).toBeLessThan(900_000_000)
  })

  it('refuses a prepayment outside the tenor or of a non-positive amount', () => {
    expect(() => simulatePrepayment(terms({ prepayments: [{ atMonth: 0, amount: rupiah(1) }] }))).toThrow(
      ScheduleError,
    )
    expect(() =>
      simulatePrepayment(terms({ prepayments: [{ atMonth: 241, amount: rupiah(1) }] })),
    ).toThrow(ScheduleError)
    expect(() =>
      simulatePrepayment(terms({ prepayments: [{ atMonth: 12, amount: rupiah(0) }] })),
    ).toThrow(ScheduleError)
    expect(() => simulatePrepayment(terms({ penaltyRate: -0.01 }))).toThrow(ScheduleError)
  })
})
