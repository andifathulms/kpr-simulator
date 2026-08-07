import { describe, expect, it } from 'vitest'
import { rupiah, type RoundingConvention } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { checkConservation } from '@/lib/amortise/conservation'
import { labelReviews, reviewCount, reviewPoints } from '@/lib/scenario/repricing'
import type { RateSegment } from '@/lib/amortise/types'

/**
 * A floating rate is repriced on a cadence — every 3, 6 or 12 months — rather
 * than once at the boundary. The app shows those review points and must not
 * move a single rupiah doing it: these are the figures a user prints and takes
 * to a bank.
 *
 * The last test records why the obvious implementation was rejected, so the
 * decision cannot be quietly reversed later.
 */
const START = period(2026, 9)
const ROUNDINGS: readonly RoundingConvention[] = [
  'pembulatan-terdekat',
  'pembulatan-ke-bawah',
  'pembulatan-ke-atas',
]

function whole(fixedMonths: number, termMonths: number): RateSegment[] {
  return [
    { months: fixedMonths, annualRate: 0.06, phase: 'tetap', assumed: false },
    {
      months: termMonths - fixedMonths,
      annualRate: 0.12,
      phase: 'mengambang',
      assumed: true,
    },
  ]
}

function build(segments: readonly RateSegment[], termMonths: number, rounding: RoundingConvention) {
  return buildSchedule({
    principal: rupiah(640_000_000),
    start: START,
    termMonths,
    rounding,
    segments,
  })
}

describe('repricing cadence', () => {
  it('puts the first reset at the end of the fixed period', () => {
    // Fixed for 36 months, so month 37 is the first instalment that can move.
    expect(reviewPoints(36, 180, 6)[0]).toBe(37)
  })

  it('counts every reset before the loan is repaid', () => {
    // 144 floating months, reviewed twice a year.
    expect(reviewCount(36, 180, 6)).toBe(24)
    expect(reviewCount(36, 180, 12)).toBe(12)
    expect(reviewCount(36, 180, 3)).toBe(48)
  })

  it('never places a review after the final instalment', () => {
    for (const reviewMonths of [3, 6, 12]) {
      const points = reviewPoints(36, 180, reviewMonths)
      expect(Math.max(...points)).toBeLessThanOrEqual(180)
      expect(points.every((month) => month > 36)).toBe(true)
    }
  })

  it('reports nothing when there is no floating period or no stated cadence', () => {
    expect(reviewPoints(0, 180, 6)).toEqual([])
    expect(reviewPoints(180, 180, 6)).toEqual([])
    expect(reviewPoints(36, 180, 0)).toEqual([])
    expect(reviewCount(36, 180, 0)).toBe(0)
  })

  it('labels only what floats, and changes nothing else about a segment', () => {
    const labelled = labelReviews(whole(36, 180), 6)
    expect(labelled[0]?.label).toBeUndefined()
    expect(labelled[1]?.label).toContain('6')
    expect(labelled[1]?.annualRate).toBe(0.12)
    expect(labelled[1]?.months).toBe(144)
    expect(labelled[1]?.assumed).toBe(true)
  })

  it('leaves every figure in the schedule untouched, at every rounding convention', () => {
    for (const rounding of ROUNDINGS) {
      const plain = build(whole(36, 180), 180, rounding)
      const labelled = build(labelReviews(whole(36, 180), 6), 180, rounding)

      expect(labelled.totalPaid).toBe(plain.totalPaid)
      expect(labelled.totalInterest).toBe(plain.totalInterest)
      for (const [index, instalment] of labelled.instalments.entries()) {
        expect(instalment.payment).toBe(plain.instalments[index]?.payment)
        expect(instalment.closingBalance).toBe(plain.instalments[index]?.closingBalance)
      }

      // Conservation is asserted on every schedule this suite produces.
      expect(checkConservation(labelled).failures).toEqual([])
      expect(checkConservation(plain).failures).toEqual([])
    }
  })

  /**
   * Why the app does not split the floating period into one segment per
   * review, even though a bank that recomputes at each review would.
   *
   * Re-rounding the annuity at each boundary perturbs the schedule. It is a
   * rounding artefact, not a rate effect — small, but it lands on figures the
   * user prints. This test pins the behaviour so the choice is deliberate and
   * visible rather than rediscovered by someone in a year.
   */
  it('records that splitting at reviews would perturb the schedule', () => {
    const split: RateSegment[] = [
      { months: 36, annualRate: 0.06, phase: 'tetap', assumed: false },
      ...Array.from({ length: 24 }, () => ({
        months: 6,
        annualRate: 0.12,
        phase: 'mengambang' as const,
        assumed: true,
      })),
    ]
    const plain = build(whole(36, 180), 180, 'pembulatan-terdekat')
    const perSegment = build(split, 180, 'pembulatan-terdekat')

    expect(perSegment.totalPaid).not.toBe(plain.totalPaid)
    // Rupiah, not thousands: an artefact of re-rounding, on a total above a
    // billion. Both schedules are internally exact.
    expect(Math.abs(perSegment.totalPaid - plain.totalPaid)).toBeLessThan(1_000)
    expect(checkConservation(perSegment).failures).toEqual([])
  })
})
