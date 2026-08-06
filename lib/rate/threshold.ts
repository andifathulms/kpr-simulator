import { applyRate, type RoundingConvention, type Rupiah } from '@/lib/money/rupiah'
import type { Period } from '@/lib/period/period'
import { annuityPaymentExact } from '@/lib/amortise/annuity'
import { balanceAfterPhase } from '@/lib/amortise/schedule'

/**
 * The ambang — the floating rate at which the instalment crosses a stated
 * share of income.
 *
 * This reframes the exercise. Not "can I afford Rp3,2 juta" but "my loan
 * breaks at 13,4%, and my bank's margin over SBDK is unpublished — what is
 * it?" That is a question worth walking into a bank with.
 *
 * The solver states a limit. It does not say whether the limit is wise, what
 * share of income is sensible, or whether to take the loan.
 */

export class ThresholdError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ThresholdError'
  }
}

export interface ThresholdQuery {
  readonly principal: Rupiah
  readonly start: Period
  readonly termMonths: number
  /** Length of the quoted fixed period, in months. */
  readonly fixedMonths: number
  readonly fixedAnnualRate: number
  /** Monthly household income, as the user stated it. */
  readonly income: Rupiah
  /** Share of income the user chose as their limit. 0.30 is thirty percent. */
  readonly share: number
  readonly rounding: RoundingConvention
}

export interface ThresholdContext {
  /** Balance still outstanding when the fixed period ends. */
  readonly balanceAtBoundary: Rupiah
  readonly remainingMonths: number
  readonly fixedPayment: Rupiah
  /** income × share, rounded down — a limit is not rounded up. */
  readonly limit: Rupiah
}

export type ThresholdOutcome =
  /** The rate at which the instalment reaches exactly the limit. */
  | ({ readonly kind: 'found'; readonly annualRate: number; readonly payment: Rupiah } & ThresholdContext)
  /**
   * The limit is already below what the loan costs at a zero floating rate,
   * so there is no rate at which it holds. Stated, not softened.
   */
  | ({ readonly kind: 'breached-at-zero'; readonly paymentAtZero: Rupiah } & ThresholdContext)
  /** The limit still holds at the ceiling searched. */
  | ({ readonly kind: 'above-ceiling'; readonly ceiling: number; readonly paymentAtCeiling: Rupiah } & ThresholdContext)

/** Rates above this are not searched; nothing in the market approaches it. */
export const SEARCH_CEILING = 1.0

const MAX_ITERATIONS = 200
const TOLERANCE = 1e-12

/**
 * A limit always rounds down, whatever convention the schedule uses. Rounding
 * a limit up would hand the user headroom the app has no business inventing.
 */
export function affordabilityLimit(income: Rupiah, share: number): Rupiah {
  if (!Number.isFinite(share) || share <= 0 || share > 1) {
    throw new ThresholdError(`Porsi penghasilan harus di antara 0 dan 1, diterima: ${share}`)
  }
  return applyRate(income, share, 'pembulatan-ke-bawah').value
}

export function solveThreshold(query: ThresholdQuery): ThresholdOutcome {
  if (query.fixedMonths < 0 || query.fixedMonths >= query.termMonths) {
    throw new ThresholdError(
      `Masa tetap ${query.fixedMonths} bulan harus lebih pendek dari tenor ${query.termMonths} bulan. ` +
        'Tanpa periode mengambang tidak ada ambang untuk dicari.',
    )
  }
  if (query.income <= 0) {
    throw new ThresholdError(`Penghasilan harus positif, diterima: ${query.income}`)
  }

  const phase = balanceAfterPhase(
    query.principal,
    query.fixedAnnualRate,
    query.termMonths,
    query.fixedMonths,
    query.rounding,
  )
  const remainingMonths = query.termMonths - query.fixedMonths
  const limit = affordabilityLimit(query.income, query.share)

  const context: ThresholdContext = {
    balanceAtBoundary: phase.balance,
    remainingMonths,
    fixedPayment: phase.payment,
    limit,
  }

  const paymentAt = (annualRate: number): number =>
    annuityPaymentExact(context.balanceAtBoundary, annualRate, remainingMonths)

  const atZero = paymentAt(0)
  if (atZero >= limit) {
    return {
      kind: 'breached-at-zero',
      paymentAtZero: applyRate(context.balanceAtBoundary, 1 / remainingMonths, query.rounding).value,
      ...context,
    }
  }

  const atCeiling = paymentAt(SEARCH_CEILING)
  if (atCeiling <= limit) {
    return {
      kind: 'above-ceiling',
      ceiling: SEARCH_CEILING,
      paymentAtCeiling: applyRate(
        context.balanceAtBoundary,
        atCeiling / context.balanceAtBoundary,
        query.rounding,
      ).value,
      ...context,
    }
  }

  // The instalment is strictly increasing in the rate over [0, ceiling], so
  // bisection converges on the single crossing.
  let low = 0
  let high = SEARCH_CEILING
  let iterations = 0
  while (iterations < MAX_ITERATIONS && high - low > TOLERANCE) {
    const mid = (low + high) / 2
    if (paymentAt(mid) < limit) low = mid
    else high = mid
    iterations += 1
  }

  const annualRate = (low + high) / 2
  return { kind: 'found', annualRate, payment: limit, ...context }
}
