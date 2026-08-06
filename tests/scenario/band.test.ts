import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { checkConservation } from '@/lib/amortise/conservation'
import { BandError, buildBand, scenarioRate, type BandTerms } from '@/lib/scenario/band'
import { sbdkFileSchema, snapshotsFor } from '@/lib/scenario/sbdk'
import snapshots from '@/data/sbdk/snapshots.json'

const START = period(2026, 9)

function terms(overrides: Partial<BandTerms> = {}): BandTerms {
  return {
    principal: rupiah(600_000_000),
    start: START,
    termMonths: 240,
    fixedMonths: 36,
    fixedAnnualRate: 0.0325,
    rounding: 'pembulatan-terdekat',
    scenarios: [
      { key: 'optimis', baseRate: 0.07, margin: 0.015 },
      { key: 'dasar', baseRate: 0.07, margin: 0.03 },
      { key: 'tekanan', baseRate: 0.07, margin: 0.055 },
    ],
    ...overrides,
  }
}

describe('scenario band', () => {
  it('computes each scenario exactly and conserves in every one', () => {
    const band = buildBand(terms())
    expect(band.scenarios).toHaveLength(3)
    for (const scenario of band.scenarios) {
      expect(checkConservation(scenario.schedule).failures).toEqual([])
    }
    expect(band.scenarios.map((scenario) => scenario.annualRate)).toEqual([0.085, 0.1, 0.125])
  })

  it('is a rate plus a margin, never a rate the app supplied', () => {
    expect(scenarioRate({ key: 'dasar', baseRate: 0.0701, margin: 0.025 })).toBeCloseTo(0.0951, 10)
  })

  it('is closed before the boundary and open after it', () => {
    const band = buildBand(terms())
    const beforeBoundary = band.rows[34]
    const atBoundary = band.rows[36]

    expect(beforeBoundary?.assumed).toBe(false)
    expect(beforeBoundary?.low).toBe(beforeBoundary?.high) // one known rate

    expect(atBoundary?.assumed).toBe(true)
    expect(atBoundary?.high).toBeGreaterThan(atBoundary?.low ?? 0)
  })

  it('opens at exactly the month the fixed period ends', () => {
    const band = buildBand(terms({ fixedMonths: 24 }))
    expect(band.boundaryMonth).toBe(24)
    expect(band.rows[23]?.assumed).toBe(false)
    expect(band.rows[24]?.assumed).toBe(true)
  })

  it('widens as the margin spread widens', () => {
    const narrow = buildBand(terms())
    const wide = buildBand(
      terms({
        scenarios: [
          { key: 'optimis', baseRate: 0.07, margin: 0.005 },
          { key: 'dasar', baseRate: 0.07, margin: 0.03 },
          { key: 'tekanan', baseRate: 0.07, margin: 0.09 },
        ],
      }),
    )
    const narrowSpan = (narrow.rows[100]?.high ?? 0) - (narrow.rows[100]?.low ?? 0)
    const wideSpan = (wide.rows[100]?.high ?? 0) - (wide.rows[100]?.low ?? 0)
    expect(wideSpan).toBeGreaterThan(narrowSpan)
  })

  it('marks every floating segment as assumed, regardless of scenario', () => {
    const band = buildBand(terms())
    for (const scenario of band.scenarios) {
      const floating = scenario.schedule.instalments.slice(36)
      expect(floating.every((instalment) => instalment.assumed)).toBe(true)
      expect(scenario.schedule.instalments.slice(0, 36).every((i) => !i.assumed)).toBe(true)
    }
  })

  it('refuses a loan with no floating period', () => {
    expect(() => buildBand(terms({ fixedMonths: 240 }))).toThrow(BandError)
    expect(() => buildBand(terms({ fixedMonths: 0 }))).toThrow(BandError)
    expect(() => buildBand(terms({ scenarios: [] }))).toThrow(BandError)
  })
})

describe('SBDK snapshots', () => {
  it('parses, and states its coverage whether or not it holds any figure', () => {
    const parsed = sbdkFileSchema.parse(snapshots)
    expect(parsed.coverageNote.id.length).toBeGreaterThan(40)
    expect(parsed.coverageNote.en.length).toBeGreaterThan(40)
  })

  it('ships no fabricated reference rate', () => {
    const parsed = sbdkFileSchema.parse(snapshots)
    for (const snapshot of parsed.snapshots) {
      expect(snapshot.sourceUrl).toMatch(/^https:\/\//)
      expect(snapshot.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    expect(snapshotsFor(parsed, 'kpr')).toEqual(
      parsed.snapshots.filter((snapshot) => snapshot.segment === 'kpr'),
    )
  })
})
