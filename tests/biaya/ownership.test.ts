import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { RULES } from '@/lib/rules/registry'
import { computeOwnershipCost } from '@/lib/biaya/ownership'

const at = period(2026, 8)

function query(overrides = {}) {
  return {
    at,
    housePrice: rupiah(800_000_000),
    npoptkpOverride: null,
    bankFees: [{ key: 'provisi', label: 'Provisi', amount: rupiah(8_000_000) }],
    notaris: rupiah(12_000_000),
    ...overrides,
  }
}

describe('total cost of ownership', () => {
  it('computes BPHTB from the cited rate and NPOPTKP floor', () => {
    const outcome = computeOwnershipCost(RULES, query())
    if (outcome.type !== 'computed') throw new Error('expected a report')
    const bphtb = outcome.value.lines.find((line) => line.key === 'bphtb')
    // 5% × (800.000.000 − 80.000.000) = 36.000.000
    expect(bphtb?.amount).toBe(36_000_000)
    expect(bphtb?.kind).toBe('diatur')
    expect(bphtb?.parameter?.sourceUrl).toMatch(/^https:\/\//)
  })

  it('honours a local NPOPTKP override, because the floor is only a floor', () => {
    const outcome = computeOwnershipCost(RULES, query({ npoptkpOverride: rupiah(300_000_000) }))
    if (outcome.type !== 'computed') throw new Error('expected a report')
    expect(outcome.value.lines.find((line) => line.key === 'bphtb')?.amount).toBe(25_000_000)
  })

  it('never charges BPHTB on a negative base', () => {
    const outcome = computeOwnershipCost(
      RULES,
      query({ housePrice: rupiah(50_000_000), bankFees: [], notaris: rupiah(0) }),
    )
    if (outcome.type !== 'computed') throw new Error('expected a report')
    expect(outcome.value.lines.find((line) => line.key === 'bphtb')?.amount).toBe(0)
  })

  it('keeps regulated and discretionary totals apart', () => {
    const outcome = computeOwnershipCost(RULES, query())
    if (outcome.type !== 'computed') throw new Error('expected a report')
    expect(outcome.value.regulatedTotal).toBe(36_000_000)
    expect(outcome.value.discretionaryTotal).toBe(20_000_000)
    expect(outcome.value.total).toBe(56_000_000)
    for (const line of outcome.value.lines) {
      // A citation on every regulated line, and none claimed for the rest.
      if (line.kind === 'diatur') expect(line.parameter).toBeDefined()
      else expect(line.parameter).toBeUndefined()
    }
  })

  it('refuses a period the tax pack does not cover', () => {
    const outcome = computeOwnershipCost(RULES, query({ at: period(2015, 1) }))
    expect(outcome.type).toBe('unsupported')
  })
})
