import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { buildSchedule, balanceAfterPhase } from '@/lib/amortise/schedule'
import { checkConservation } from '@/lib/amortise/conservation'
import {
  SEARCH_CEILING,
  ThresholdError,
  affordabilityLimit,
  solveThreshold,
  type ThresholdQuery,
} from '@/lib/rate/threshold'

/**
 * The round trip is the whole assertion: the rate the solver returns, fed
 * back through the amortisation engine, must produce an instalment at exactly
 * the stated limit. A formula asserted against itself would prove nothing.
 */
const START = period(2026, 9)

function query(overrides: Partial<ThresholdQuery> = {}): ThresholdQuery {
  return {
    principal: rupiah(600_000_000),
    start: START,
    termMonths: 240,
    fixedMonths: 36,
    fixedAnnualRate: 0.0325,
    income: rupiah(25_000_000),
    share: 0.3,
    rounding: 'pembulatan-terdekat',
    ...overrides,
  }
}

describe('threshold — round trip through the engine', () => {
  const PRINCIPALS = [250_000_000, 600_000_000, 1_400_000_000].map(rupiah)
  const FIXED = [
    { fixedMonths: 12, fixedAnnualRate: 0.0299 },
    { fixedMonths: 24, fixedAnnualRate: 0.0325 },
    { fixedMonths: 36, fixedAnnualRate: 0.0475 },
    { fixedMonths: 60, fixedAnnualRate: 0.0625 },
  ]
  const INCOMES = [15_000_000, 25_000_000, 40_000_000, 90_000_000].map(rupiah)
  const SHARES = [0.25, 0.3, 0.35, 0.4]

  for (const principal of PRINCIPALS) {
    for (const fixed of FIXED) {
      for (const income of INCOMES) {
        for (const share of SHARES) {
          it(`plafon ${principal}, tetap ${fixed.fixedMonths} bln, penghasilan ${income}, ${share * 100}%`, () => {
            const outcome = solveThreshold(query({ principal, ...fixed, income, share }))
            if (outcome.kind !== 'found') {
              // The other two outcomes are legitimate answers, not failures,
              // and they are asserted in their own tests below.
              expect(['breached-at-zero', 'above-ceiling']).toContain(outcome.kind)
              return
            }

            // Feed the answer back through the engine as a real schedule.
            const schedule = buildSchedule({
              principal,
              start: START,
              termMonths: 240,
              rounding: 'pembulatan-terdekat',
              segments: [
                {
                  months: fixed.fixedMonths,
                  annualRate: fixed.fixedAnnualRate,
                  phase: 'tetap',
                  assumed: false,
                },
                {
                  months: 240 - fixed.fixedMonths,
                  annualRate: outcome.annualRate,
                  phase: 'mengambang',
                  assumed: true,
                },
              ],
            })
            expect(checkConservation(schedule).failures).toEqual([])

            const firstFloating = schedule.instalments[fixed.fixedMonths]
            expect(firstFloating?.phase).toBe('mengambang')
            // Exactly the stated limit, to the rupiah.
            expect(firstFloating?.payment).toBe(outcome.limit)
            expect(outcome.payment).toBe(outcome.limit)
          })
        }
      }
    }
  }
})

describe('threshold — context agrees with the engine', () => {
  it('reads the same boundary balance and fixed instalment the schedule does', () => {
    const outcome = solveThreshold(query())
    const schedule = buildSchedule({
      principal: rupiah(600_000_000),
      start: START,
      termMonths: 240,
      rounding: 'pembulatan-terdekat',
      segments: [
        { months: 36, annualRate: 0.0325, phase: 'tetap', assumed: false },
        { months: 204, annualRate: 0.11, phase: 'mengambang', assumed: true },
      ],
    })
    expect(outcome.balanceAtBoundary).toBe(schedule.instalments[35]?.closingBalance)
    expect(outcome.fixedPayment).toBe(schedule.instalments[0]?.payment)
    expect(outcome.remainingMonths).toBe(204)
  })

  it('balanceAfterPhase agrees with buildSchedule row for row', () => {
    const termMonths = 180
    const annualRate = 0.055
    const principal = rupiah(430_000_000)
    const schedule = buildSchedule({
      principal,
      start: START,
      termMonths,
      rounding: 'pembulatan-terdekat',
      segments: [{ months: termMonths, annualRate, phase: 'tetap', assumed: false }],
    })
    for (const months of [0, 1, 12, 24, 59, 120, 179]) {
      const phase = balanceAfterPhase(principal, annualRate, termMonths, months, 'pembulatan-terdekat')
      const expected =
        months === 0 ? principal : schedule.instalments[months - 1]?.closingBalance
      expect(phase.balance).toBe(expected)
    }
  })
})

describe('threshold — the limit itself', () => {
  it('rounds the limit down, never up', () => {
    expect(affordabilityLimit(rupiah(8_333_333), 0.3)).toBe(2_499_999) // 2.499.999,9
    expect(affordabilityLimit(rupiah(10_000_000), 0.35)).toBe(3_500_000)
  })

  it('refuses a share outside 0–1 rather than clamping it', () => {
    expect(() => affordabilityLimit(rupiah(10_000_000), 0)).toThrow(ThresholdError)
    expect(() => affordabilityLimit(rupiah(10_000_000), 1.5)).toThrow(ThresholdError)
  })
})

describe('threshold — the answers that are not a rate', () => {
  it('states plainly when the limit is already breached at a zero floating rate', () => {
    const outcome = solveThreshold(query({ income: rupiah(4_000_000), share: 0.3 }))
    expect(outcome.kind).toBe('breached-at-zero')
    if (outcome.kind !== 'breached-at-zero') return
    expect(outcome.paymentAtZero).toBeGreaterThan(outcome.limit)
  })

  it('states plainly when the limit still holds at the search ceiling', () => {
    const outcome = solveThreshold(query({ income: rupiah(900_000_000), share: 0.4 }))
    expect(outcome.kind).toBe('above-ceiling')
    if (outcome.kind !== 'above-ceiling') return
    expect(outcome.ceiling).toBe(SEARCH_CEILING)
  })

  it('refuses a loan with no floating period at all', () => {
    expect(() => solveThreshold(query({ fixedMonths: 240 }))).toThrow(ThresholdError)
    expect(() => solveThreshold(query({ fixedMonths: 300 }))).toThrow(ThresholdError)
  })

  it('refuses a non-positive income', () => {
    expect(() => solveThreshold(query({ income: rupiah(0) }))).toThrow(ThresholdError)
  })
})

describe('threshold — the figure moves the way it should', () => {
  it('rises with income and falls with a larger plafon', () => {
    const lower = solveThreshold(query({ income: rupiah(20_000_000) }))
    const higher = solveThreshold(query({ income: rupiah(30_000_000) }))
    expect(lower.kind).toBe('found')
    expect(higher.kind).toBe('found')
    if (lower.kind !== 'found' || higher.kind !== 'found') return
    expect(higher.annualRate).toBeGreaterThan(lower.annualRate)

    const bigger = solveThreshold(query({ principal: rupiah(900_000_000) }))
    if (bigger.kind !== 'found') return
    expect(bigger.annualRate).toBeLessThan(lower.annualRate)
  })
})
