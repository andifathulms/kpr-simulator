import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { buildFlatSchedule } from '@/lib/amortise/flat'
import { checkConservation } from '@/lib/amortise/conservation'
import { effectiveFromFlat, flatLevelPayment } from '@/lib/rate/effective'
import { scheduleIrr, solveMonthlyIrr } from '@/lib/rate/irr'

/**
 * Two routes to one number. effectiveFromFlat works forward from the annuity
 * identity; solveMonthlyIrr works backward from the cash flows alone. They
 * share no code, so agreement is evidence rather than tautology.
 */
const START = period(2026, 9)

const PRINCIPALS = [50_000_000, 164_340_000, 500_000_000, 1_250_000_000].map(rupiah)
const FLAT_RATES = [0.03, 0.05, 0.0675, 0.09, 0.12]
const TERMS = [12, 36, 60, 120, 180, 240]

describe('effective rate agrees with an independently solved IRR', () => {
  for (const principal of PRINCIPALS) {
    for (const flatAnnualRate of FLAT_RATES) {
      for (const termMonths of TERMS) {
        it(`flat ${flatAnnualRate * 100}% atas ${principal} selama ${termMonths} bulan`, () => {
          const derivation = effectiveFromFlat({ principal, flatAnnualRate, termMonths })

          // Route two: discount the *exact* level cash flows of the flat quote
          // until their present value is zero. Nothing from effective.ts is
          // involved beyond the instalment figure being explained.
          const payment = flatLevelPayment({ principal, flatAnnualRate, termMonths })
          const cashFlows = [principal, ...Array.from({ length: termMonths }, () => -payment)]
          const irr = solveMonthlyIrr(cashFlows)

          expect(irr.annualRate).toBeCloseTo(derivation.effectiveAnnualRate, 9)
          expect(irr.annualEquivalentRate).toBeCloseTo(derivation.annualEquivalentRate, 9)
          expect(Math.abs(irr.residual)).toBeLessThan(1e-3)
        })
      }
    }
  }

  it('reproduces the claim that a flat 5% is roughly a 9% effective rate', () => {
    const principal = rupiah(200_000_000)
    const rate = (termMonths: number) =>
      effectiveFromFlat({ principal, flatAnnualRate: 0.05, termMonths }).effectiveAnnualRate

    // The familiar "flat ≈ half of effective" holds over the consumer-credit
    // tenors the comparison is usually quoted for: 1 to 5 years.
    for (const termMonths of [12, 24, 36, 60]) {
      expect(rate(termMonths)).toBeGreaterThan(0.09)
      expect(rate(termMonths)).toBeLessThan(0.095)
    }

    // Over a KPR tenor the multiple falls away — the exact figure is ~7,95%
    // at 20 years, not the ~10% a doubling would suggest. The app states the
    // computed number, not the rule of thumb.
    expect(rate(240)).toBeGreaterThan(0.079)
    expect(rate(240)).toBeLessThan(0.080)
    expect(rate(240)).toBeLessThan(rate(60))
  })

  it('leaves a zero-rate quote at zero rather than iterating into noise', () => {
    const derivation = effectiveFromFlat({
      principal: rupiah(120_000_000),
      flatAnnualRate: 0,
      termMonths: 12,
    })
    expect(derivation.effectiveAnnualRate).toBe(0)
  })
})

describe('IRR of a built schedule', () => {
  for (const annualRate of [0.0325, 0.05, 0.0875, 0.115, 0.1425]) {
    for (const termMonths of [60, 120, 240]) {
      it(`efektif ${annualRate * 100}% selama ${termMonths} bulan returns its own rate`, () => {
        const schedule = buildSchedule({
          principal: rupiah(500_000_000),
          start: START,
          termMonths,
          rounding: 'pembulatan-terdekat',
          segments: [{ months: termMonths, annualRate, phase: 'tetap', assumed: false }],
        })
        expect(checkConservation(schedule).failures).toEqual([])
        // Rounding to whole rupiah moves the realised rate by a hair; a
        // schedule of 240 rounded instalments is not the same object as the
        // exact annuity, and pretending otherwise would hide the divergence.
        expect(scheduleIrr(schedule).annualRate).toBeCloseTo(annualRate, 5)
      })
    }
  }

  it('prices a flat schedule at its effective rate, not its quoted one', () => {
    const principal = rupiah(200_000_000)
    const termMonths = 240
    const flatAnnualRate = 0.05

    const schedule = buildFlatSchedule({
      principal,
      start: START,
      termMonths,
      annualRate: flatAnnualRate,
      assumed: false,
      rounding: 'pembulatan-terdekat',
    })
    expect(checkConservation(schedule).failures).toEqual([])

    const realised = scheduleIrr(schedule).annualRate
    const derived = effectiveFromFlat({ principal, flatAnnualRate, termMonths }).effectiveAnnualRate

    expect(realised).toBeCloseTo(derived, 4)
    expect(realised).toBeGreaterThan(flatAnnualRate * 1.5)
  })

  it('prices a fixed-then-floating schedule between its two rates', () => {
    const schedule = buildSchedule({
      principal: rupiah(600_000_000),
      start: START,
      termMonths: 240,
      rounding: 'pembulatan-terdekat',
      segments: [
        { months: 36, annualRate: 0.0325, phase: 'tetap', assumed: false },
        { months: 204, annualRate: 0.125, phase: 'mengambang', assumed: true },
      ],
    })
    const realised = scheduleIrr(schedule).annualRate
    expect(realised).toBeGreaterThan(0.0325)
    expect(realised).toBeLessThan(0.125)
  })

  it('refuses cash flows it cannot bracket rather than returning a guess', () => {
    expect(() => solveMonthlyIrr([100])).toThrow(/dua arus kas/)
  })
})
