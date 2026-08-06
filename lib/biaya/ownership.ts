import { ZERO, add, applyRate, max, subtract, sum, type Rupiah } from '@/lib/money/rupiah'
import type { Period } from '@/lib/period/period'
import { computed, unsupported, type Outcome } from '@/lib/rules/result'
import { resolveMoney, resolveRate, type Registry } from '@/lib/rules/resolver'
import type { Parameter } from '@/lib/rules/schema'

/**
 * Total cost of ownership, beyond the loan.
 *
 * Two kinds of line sit side by side and must never be confused: items fixed
 * by regulation, which carry a citation, and items a bank or notary sets at
 * its own discretion, which are the user's figures and are labelled as such.
 * Where a typical range is offered it is marked *typical*, never authoritative.
 */

export type LineKind = 'diatur' | 'diskresi'

export interface CostLine {
  readonly key: string
  readonly label: { readonly id: string; readonly en: string }
  readonly amount: Rupiah
  readonly kind: LineKind
  /** Present only for regulated lines. */
  readonly parameter?: Parameter
  readonly derivation?: string
}

export interface CostQuery {
  readonly at: Period
  readonly housePrice: Rupiah
  /** NPOPTKP actually applied by the kabupaten/kota, if the user knows it. */
  readonly npoptkpOverride: Rupiah | null
  /** Provisi, administrasi, appraisal, insurance — all user figures. */
  readonly bankFees: readonly { key: string; label: string; amount: Rupiah }[]
  /** Notary and AJB costs, a negotiated figure. */
  readonly notaris: Rupiah
}

export interface CostReport {
  readonly lines: readonly CostLine[]
  readonly regulatedTotal: Rupiah
  readonly discretionaryTotal: Rupiah
  readonly total: Rupiah
}

export function computeOwnershipCost(rules: Registry, query: CostQuery): Outcome<CostReport> {
  const bphtbRate = resolveRate(rules, 'pajak.bphtb.rate.max', query.at)
  const npoptkpFloor = resolveMoney(rules, 'pajak.bphtb.npoptkp.min', query.at)

  const gaps = [bphtbRate, npoptkpFloor].flatMap((outcome) =>
    outcome.type === 'unsupported' ? [...outcome.gaps] : [],
  )
  if (gaps.length > 0) return unsupported(...gaps)
  if (bphtbRate.type !== 'computed' || npoptkpFloor.type !== 'computed') {
    return unsupported({
      kind: 'rule-pack',
      reference: 'pajak',
      detail: {
        id: 'Paket aturan pajak tidak lengkap untuk periode ini.',
        en: 'The tax rule pack is incomplete for this period.',
      },
    })
  }

  const npoptkp = query.npoptkpOverride ?? npoptkpFloor.value.value
  // BPHTB = tarif × (NPOP − NPOPTKP), and the base cannot go below zero.
  const base = max(subtract(query.housePrice, npoptkp), ZERO)
  const bphtb = applyRate(base, bphtbRate.value.value, 'pembulatan-terdekat')

  const lines: CostLine[] = [
    {
      key: 'bphtb',
      label: { id: 'BPHTB', en: 'BPHTB (acquisition duty)' },
      amount: bphtb.value,
      kind: 'diatur',
      parameter: bphtbRate.value.parameter,
      derivation: `${bphtbRate.value.value} × (${query.housePrice} − ${npoptkp}) = ${bphtb.exact.toFixed(2)}`,
    },
    ...query.bankFees.map((fee) => ({
      key: fee.key,
      label: { id: fee.label, en: fee.label },
      amount: fee.amount,
      kind: 'diskresi' as const,
    })),
    {
      key: 'notaris',
      label: { id: 'Notaris dan AJB', en: 'Notary and deed of sale' },
      amount: query.notaris,
      kind: 'diskresi',
    },
  ]

  const regulatedTotal = sum(
    lines.filter((line) => line.kind === 'diatur').map((line) => line.amount),
  )
  const discretionaryTotal = sum(
    lines.filter((line) => line.kind === 'diskresi').map((line) => line.amount),
  )

  return computed({
    lines,
    regulatedTotal,
    discretionaryTotal,
    total: add(regulatedTotal, discretionaryTotal),
  })
}
