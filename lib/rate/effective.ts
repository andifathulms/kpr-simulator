import { annuityPaymentExact } from '@/lib/amortise/annuity'
import type { Rupiah } from '@/lib/money/rupiah'

/**
 * Flat → effective.
 *
 * A flat quote charges interest on the original plafon for the whole term, so
 * the borrower pays for money they have already repaid. The effective rate is
 * the rate that, charged on the outstanding balance, produces the same level
 * instalment. It is roughly 1,8× the flat figure for a long tenor — which is
 * why a "flat 5%" and a "5% efektif" are not the same product.
 *
 * lib/rate/irr.ts derives the same number by a completely different route and
 * shares no code with this file. If they shared a helper they would validate
 * each other's bugs.
 */

export class EffectiveRateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EffectiveRateError'
  }
}

export interface FlatQuote {
  readonly principal: Rupiah
  /** Nominal annual flat rate as a decimal. */
  readonly flatAnnualRate: number
  readonly termMonths: number
}

export interface EffectiveDerivation {
  /** The level instalment a flat quote produces, exact and unrounded. */
  readonly levelPayment: number
  /** Nominal annual rate on the outstanding balance, i × 12. */
  readonly effectiveAnnualRate: number
  readonly monthlyRate: number
  /** Compounded, for readers who want the annual-equivalent figure. */
  readonly annualEquivalentRate: number
  readonly iterations: number
}

/** The flat instalment: plafon spread evenly, plus flat interest on the plafon. */
export function flatLevelPayment(quote: FlatQuote): number {
  if (quote.termMonths <= 0) {
    throw new EffectiveRateError(`Tenor harus positif, diterima: ${quote.termMonths}`)
  }
  return quote.principal / quote.termMonths + (quote.principal * quote.flatAnnualRate) / 12
}

const MAX_ITERATIONS = 200
const TOLERANCE = 1e-12

/**
 * Solves for the monthly effective rate by bisection on the annuity instalment.
 *
 * Bisection rather than Newton: the instalment is monotonically increasing in
 * the rate over the whole bracket, so bisection cannot diverge, and a
 * derivation someone may act on is not the place for a faster method that can.
 */
export function effectiveFromFlat(quote: FlatQuote): EffectiveDerivation {
  if (quote.flatAnnualRate < 0) {
    throw new EffectiveRateError(`Suku bunga flat harus ≥ 0, diterima: ${quote.flatAnnualRate}`)
  }
  const target = flatLevelPayment(quote)

  if (quote.flatAnnualRate === 0) {
    return {
      levelPayment: target,
      effectiveAnnualRate: 0,
      monthlyRate: 0,
      annualEquivalentRate: 0,
      iterations: 0,
    }
  }

  let low = 0
  // Flat can never exceed the effective rate by more than a factor of ~2, but
  // the bracket is widened until it provably contains the root rather than
  // assumed to.
  let high = Math.max(quote.flatAnnualRate * 4, 0.01)
  let expansions = 0
  while (annuityPaymentExact(quote.principal, high, quote.termMonths) < target) {
    high *= 2
    expansions += 1
    if (expansions > 64) {
      throw new EffectiveRateError(
        'Tidak menemukan rentang yang memuat suku bunga efektif untuk kutipan flat ini.',
      )
    }
  }

  let iterations = 0
  let mid = (low + high) / 2
  while (iterations < MAX_ITERATIONS && high - low > TOLERANCE) {
    mid = (low + high) / 2
    const payment = annuityPaymentExact(quote.principal, mid, quote.termMonths)
    if (payment < target) low = mid
    else high = mid
    iterations += 1
  }

  const effectiveAnnualRate = (low + high) / 2
  const monthlyRate = effectiveAnnualRate / 12
  return {
    levelPayment: target,
    effectiveAnnualRate,
    monthlyRate,
    annualEquivalentRate: Math.pow(1 + monthlyRate, 12) - 1,
    iterations,
  }
}
