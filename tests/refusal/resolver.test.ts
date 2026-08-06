import { describe, expect, it } from 'vitest'
import { period } from '@/lib/period/period'
import { rupiah } from '@/lib/money/rupiah'
import { RULES, COVERAGE_GAPS, PACKS } from '@/lib/rules/registry'
import { resolveMoney, resolveRate, resolveArea, resolveMonths } from '@/lib/rules/resolver'
import { checkEligibility } from '@/lib/rules/flpp'

/**
 * Refusals asserted in both directions: an in-range period computes, an
 * out-of-range one refuses and names the gap. Never extrapolates, never falls
 * back to the nearest year, never clamps.
 */

describe('resolver — in range computes', () => {
  it('resolves the Zone 1 married income ceiling for a period after Permen PKP 5/2025', () => {
    const found = resolveMoney(RULES, 'flpp.penghasilan.ceiling.zona.satu.kawin', period(2026, 8))
    expect(found.type).toBe('computed')
    if (found.type !== 'computed') return
    expect(found.value.value).toBe(10_000_000)
    expect(found.value.parameter.basis).toMatch(/Permen PKP 5\/2025/)
    expect(found.value.parameter.sourceUrl).toMatch(/^https:\/\//)
  })

  it('resolves the 2023 price ceiling for a 2023 period and the 2024 one for later', () => {
    const inTwentyThree = resolveMoney(RULES, 'flpp.harga.ceiling.jawa.sumatera', period(2023, 8))
    const inTwentySix = resolveMoney(RULES, 'flpp.harga.ceiling.jawa.sumatera', period(2026, 8))
    expect(inTwentyThree.type === 'computed' && inTwentyThree.value.value).toBe(162_000_000)
    expect(inTwentySix.type === 'computed' && inTwentySix.value.value).toBe(166_000_000)
  })

  it('resolves the FLPP rate as 5% effective', () => {
    const found = resolveRate(RULES, 'flpp.rate', period(2026, 8))
    expect(found.type === 'computed' && found.value.value).toBe(0.05)
  })

  it('resolves the statutory BPHTB ceiling and NPOPTKP floor', () => {
    expect(
      resolveRate(RULES, 'pajak.bphtb.rate.max', period(2026, 8)).type === 'computed',
    ).toBe(true)
    const npoptkp = resolveMoney(RULES, 'pajak.bphtb.npoptkp.min', period(2026, 8))
    expect(npoptkp.type === 'computed' && npoptkp.value.value).toBe(80_000_000)
  })
})

describe('resolver — out of range refuses, naming the gap', () => {
  it('refuses a period before the parameter existed rather than reaching back', () => {
    const found = resolveMoney(RULES, 'flpp.penghasilan.ceiling.zona.satu.kawin', period(2025, 3))
    expect(found.type).toBe('unsupported')
    if (found.type !== 'unsupported') return
    expect(found.gaps[0]?.reference).toBe('flpp.penghasilan.ceiling.zona.satu.kawin')
    expect(found.gaps[0]?.period).toBe('2025-03')
    expect(found.gaps[0]?.detail.id).toMatch(/tidak diperpanjang ke periode terdekat/)
  })

  it('refuses a zone the price table does not cover for that period', () => {
    // Only the 2024 table was verified for this zone, so 2023 has no value.
    const found = resolveMoney(
      RULES,
      'flpp.harga.ceiling.maluku.balinusra.jabodetabek',
      period(2023, 8),
    )
    expect(found.type).toBe('unsupported')
  })

  it('refuses a parameter that no pack carries at all', () => {
    for (const id of ['ltv.rumah.tapak.kedua', 'flpp.tenor.max', 'flpp.uang.muka.min', 'flpp.sbum']) {
      const found = resolveMoney(RULES, id, period(2026, 8))
      expect(found.type).toBe('unsupported')
      if (found.type !== 'unsupported') continue
      expect(found.gaps[0]?.detail.id).toMatch(/tidak ada dalam paket aturan/)
    }
  })

  it('refuses a type mismatch rather than coercing it', () => {
    expect(resolveMoney(RULES, 'flpp.rate', period(2026, 8)).type).toBe('unsupported')
    expect(resolveArea(RULES, 'flpp.rate', period(2026, 8)).type).toBe('unsupported')
    expect(resolveMonths(RULES, 'flpp.rate', period(2026, 8)).type).toBe('unsupported')
  })
})

describe('FLPP eligibility — states which criterion fails, never a verdict', () => {
  const base = {
    at: period(2026, 8),
    zona: 'satu' as const,
    status: 'kawin' as const,
    wilayah: 'jawa.sumatera' as const,
    monthlyIncome: rupiah(9_500_000),
    housePrice: rupiah(160_000_000),
    floorArea: 36,
  }

  it('meets every criterion when each stated figure is within its cited ceiling', () => {
    const outcome = checkEligibility(RULES, base)
    expect(outcome.type).toBe('computed')
    if (outcome.type !== 'computed') return
    expect(outcome.value.allMet).toBe(true)
    expect(outcome.value.criteria).toHaveLength(3)
    for (const criterion of outcome.value.criteria) {
      expect(criterion.parameter.sourceUrl).toMatch(/^https:\/\//)
      expect(criterion.parameter.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('names the failing criterion, and only that one', () => {
    const outcome = checkEligibility(RULES, { ...base, monthlyIncome: rupiah(12_000_000) })
    if (outcome.type !== 'computed') throw new Error('expected a report')
    expect(outcome.value.allMet).toBe(false)
    expect(outcome.value.criteria.filter((criterion) => !criterion.met).map((c) => c.key)).toEqual([
      'penghasilan',
    ])
  })

  it('accepts the same income in Zone 4, where the cited ceiling is higher', () => {
    const outcome = checkEligibility(RULES, {
      ...base,
      zona: 'empat',
      wilayah: 'maluku.balinusra.jabodetabek',
      monthlyIncome: rupiah(12_000_000),
      housePrice: rupiah(180_000_000),
    })
    if (outcome.type !== 'computed') throw new Error('expected a report')
    expect(outcome.value.allMet).toBe(true)
  })

  it('refuses the whole check for a period the packs do not cover', () => {
    const outcome = checkEligibility(RULES, { ...base, at: period(2020, 1) })
    expect(outcome.type).toBe('unsupported')
    if (outcome.type !== 'unsupported') return
    // Every missing parameter is named, not just the first.
    expect(outcome.gaps.length).toBeGreaterThan(1)
  })
})

describe('the packs and the gaps are both first-class', () => {
  it('parses every pack the app bundles', () => {
    expect(PACKS.length).toBeGreaterThan(0)
    for (const pack of PACKS) {
      for (const parameter of pack.parameters) {
        expect(parameter.basis.length).toBeGreaterThan(3)
        expect(parameter.sourceUrl).toMatch(/^https:\/\//)
      }
    }
  })

  it('states what it does not know, in both languages', () => {
    expect(COVERAGE_GAPS.length).toBeGreaterThan(0)
    for (const gap of COVERAGE_GAPS) {
      expect(gap.detail.id.length).toBeGreaterThan(60)
      expect(gap.detail.en.length).toBeGreaterThan(60)
    }
    // The ones that would otherwise be silently assumed.
    const references = COVERAGE_GAPS.map((gap) => gap.reference)
    expect(references).toContain('ltv.*')
    expect(references).toContain('biaya.bank.*')
    expect(references).toContain('sbdk')
  })
})
