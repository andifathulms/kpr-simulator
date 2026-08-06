import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { checkConservation } from '@/lib/amortise/conservation'
import { compare } from '@/lib/banding/compare'

const START = period(2026, 9)
const PLAFON = rupiah(160_000_000)
const TERM = 240

const subsidi = buildSchedule({
  principal: PLAFON,
  start: START,
  termMonths: TERM,
  rounding: 'pembulatan-terdekat',
  segments: [{ months: TERM, annualRate: 0.05, phase: 'tetap', assumed: false }],
})

const komersial = buildSchedule({
  principal: PLAFON,
  start: START,
  termMonths: TERM,
  rounding: 'pembulatan-terdekat',
  segments: [
    { months: 36, annualRate: 0.0325, phase: 'tetap', assumed: false },
    { months: TERM - 36, annualRate: 0.12, phase: 'mengambang', assumed: true },
  ],
})

describe('subsidised beside commercial', () => {
  it('conserves on both sides', () => {
    expect(checkConservation(subsidi).failures).toEqual([])
    expect(checkConservation(komersial).failures).toEqual([])
  })

  it('marks the subsidised side certain and the commercial side contingent', () => {
    const result = compare(subsidi, komersial, 36)
    // FLPP is fixed to the end of the term: nothing in it is assumed.
    expect(result.subsidi.contingent).toBe(false)
    expect(result.komersial.contingent).toBe(true)
  })

  it('carries the contingency along with the difference, not separately', () => {
    const result = compare(subsidi, komersial, 36)
    expect(result.differenceIsContingent).toBe(true)
    expect(result.totalPaidDifference).toBe(
      result.komersial.totalPaid - result.subsidi.totalPaid,
    )
  })

  it('reports the instalment past the boundary only where there is one', () => {
    const result = compare(subsidi, komersial, 36)
    expect(result.subsidi.paymentAfterBoundary).toBeNull()
    expect(result.komersial.paymentAfterBoundary).toBe(komersial.instalments[36]?.payment)
  })

  it('changes sign with the assumed rate, which is why it is not a verdict', () => {
    const gentle = buildSchedule({
      principal: PLAFON,
      start: START,
      termMonths: TERM,
      rounding: 'pembulatan-terdekat',
      segments: [
        { months: 36, annualRate: 0.0325, phase: 'tetap', assumed: false },
        { months: TERM - 36, annualRate: 0.04, phase: 'mengambang', assumed: true },
      ],
    })
    expect(compare(subsidi, komersial, 36).totalPaidDifference).toBeGreaterThan(0)
    expect(compare(subsidi, gentle, 36).totalPaidDifference).toBeLessThan(0)
  })
})
