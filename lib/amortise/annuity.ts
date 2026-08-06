import { fromExact, type RoundingConvention, type Rupiah } from '@/lib/money/rupiah'

/**
 * Bunga efektif — interest charged on the outstanding balance, with a level
 * instalment. This is the annuity formula and nothing else; the flat
 * convention lives in its own file and is never derived from this one.
 *
 *   angsuran = P · i / (1 − (1 + i)^−n)
 *
 * where i is the monthly rate and n the number of instalments remaining.
 */

export function monthlyRate(annualRate: number): number {
  return annualRate / 12
}

/** Exact, unrounded. The caller rounds and records the rounding in the trace. */
export function annuityPaymentExact(
  balance: Rupiah,
  annualRate: number,
  months: number,
): number {
  if (months <= 0) throw new RangeError(`Tenor harus positif, diterima: ${months}`)
  const i = monthlyRate(annualRate)
  // A zero-rate loan is not a rounding edge case to be papered over: the
  // instalment is simply the balance spread evenly.
  if (i === 0) return balance / months
  return (balance * i) / (1 - Math.pow(1 + i, -months))
}

export interface AnnuityPayment {
  readonly value: Rupiah
  readonly exact: number
  readonly convention: RoundingConvention
  readonly expression: string
}

export function annuityPayment(
  balance: Rupiah,
  annualRate: number,
  months: number,
  convention: RoundingConvention,
): AnnuityPayment {
  const exact = annuityPaymentExact(balance, annualRate, months)
  const rounded = fromExact(exact, convention)
  return {
    value: rounded.value,
    exact,
    convention,
    expression: `${balance} × (${annualRate}/12) ÷ (1 − (1 + ${annualRate}/12)^−${months})`,
  }
}
