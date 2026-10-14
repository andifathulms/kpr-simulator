import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { checkConservation } from '@/lib/amortise/conservation'
import { solveThreshold } from '@/lib/rate/threshold'
import { CurveError, floatingPaymentCurve, type CurveTerms } from '@/lib/rate/curve'

/**
 * The curve behind ambang's crossing chart: the first instalment after the
 * fixed period, sampled across floating rates. It is drawn next to the
 * solver's answer, so it is checked against the solver — an independent
 * bisection — rather than against itself.
 */
const TERMS: CurveTerms = {
  principal: rupiah(640_000_000),
  start: period(2026, 9),
  termMonths: 180,
  fixedMonths: 36,
  fixedAnnualRate: 0.06,
  rounding: 'pembulatan-terdekat',
}

const RATES = Array.from({ length: 41 }, (_, index) => index * 0.005)

describe('floating payment curve', () => {
  it('rises strictly with the rate', () => {
    const curve = floatingPaymentCurve(TERMS, RATES)
    expect(curve).toHaveLength(RATES.length)
    for (let index = 1; index < curve.length; index += 1) {
      const previous = curve[index - 1]
      const current = curve[index]
      if (!previous || !current) throw new Error('missing point')
      expect(current.payment).toBeGreaterThan(previous.payment)
    }
  })

  it('is in integer rupiah', () => {
    for (const point of floatingPaymentCurve(TERMS, RATES)) {
      expect(Number.isInteger(point.payment)).toBe(true)
    }
  })

  it('brackets the threshold the solver finds', () => {
    for (const share of [0.25, 0.3, 0.35, 0.4]) {
      const outcome = solveThreshold({ ...TERMS, income: rupiah(25_000_000), share })
      if (outcome.kind !== 'found') throw new Error(`expected a threshold at ${share}`)
      const [below, above] = floatingPaymentCurve(TERMS, [
        outcome.annualRate - 0.0001,
        outcome.annualRate + 0.0001,
      ])
      if (!below || !above) throw new Error('missing point')
      expect(below.payment).toBeLessThanOrEqual(outcome.limit)
      expect(above.payment).toBeGreaterThanOrEqual(outcome.limit)
    }
  })

  it('reads the same instalment a full schedule shows, and that schedule conserves', () => {
    for (const annualRate of [0.04, 0.1, 0.1268, 0.18]) {
      const [point] = floatingPaymentCurve(TERMS, [annualRate])
      const schedule = buildSchedule({
        principal: TERMS.principal,
        start: TERMS.start,
        termMonths: TERMS.termMonths,
        rounding: TERMS.rounding,
        segments: [
          { months: 36, annualRate: 0.06, phase: 'tetap', assumed: false },
          { months: 144, annualRate, phase: 'mengambang', assumed: true },
        ],
      })
      expect(checkConservation(schedule).failures).toEqual([])
      expect(point?.payment).toBe(schedule.instalments[36]?.payment)
    }
  })
})

describe('floating payment curve — refusals', () => {
  it('refuses a term with no floating period, in both directions', () => {
    expect(() => floatingPaymentCurve({ ...TERMS, fixedMonths: 180 }, RATES)).toThrow(CurveError)
    expect(() => floatingPaymentCurve({ ...TERMS, fixedMonths: 0 }, RATES)).toThrow(CurveError)
    expect(() => floatingPaymentCurve({ ...TERMS, fixedMonths: 179 }, RATES)).not.toThrow()
  })

  it('refuses a negative or non-finite rate rather than clamping it', () => {
    expect(() => floatingPaymentCurve(TERMS, [-0.01])).toThrow(CurveError)
    expect(() => floatingPaymentCurve(TERMS, [Number.NaN])).toThrow(CurveError)
    expect(() => floatingPaymentCurve(TERMS, [0])).not.toThrow()
  })
})
