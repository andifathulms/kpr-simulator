import type { Rupiah, RoundingConvention } from '@/lib/money/rupiah'
import type { Period } from '@/lib/period/period'

/**
 * A KPR is two loans stitched together: a known one and an unknown one.
 * The schedule models that literally — the term is a list of rate segments,
 * each of which knows whether its rate is something the bank stated or
 * something the user assumed.
 */
export type Phase = 'tetap' | 'mengambang'

/**
 * Flat and effective are never conflated: separate functions, separate labels,
 * separate fixtures. A schedule states which convention produced it.
 */
export type InterestConvention = 'efektif' | 'flat'

export interface RateSegment {
  readonly months: number
  /** Nominal annual rate as a decimal. 0.115 is 11,5% per year. */
  readonly annualRate: number
  readonly phase: Phase
  /**
   * True when this rate is the user's assumption rather than a quoted figure.
   * The interface renders every assumed segment in amber. The floating period
   * is always assumed: banks do not publish the margin over SBDK.
   */
  readonly assumed: boolean
  readonly label?: string
}

export interface LoanTerms {
  /** Plafon — the amount financed, after any down payment. */
  readonly principal: Rupiah
  /** First instalment period. Explicit; the engine never reads the clock. */
  readonly start: Period
  readonly termMonths: number
  readonly segments: readonly RateSegment[]
  readonly rounding: RoundingConvention
}

export interface Instalment {
  /** 1-based month of the term. */
  readonly index: number
  readonly period: Period
  readonly openingBalance: Rupiah
  /** Angsuran — interest plus principal, to the rupiah. */
  readonly payment: Rupiah
  /** Bunga. */
  readonly interest: Rupiah
  /** Pokok. */
  readonly principal: Rupiah
  readonly closingBalance: Rupiah
  readonly annualRate: number
  readonly phase: Phase
  readonly assumed: boolean
}

export interface Schedule {
  readonly principal: Rupiah
  readonly start: Period
  readonly termMonths: number
  readonly convention: InterestConvention
  readonly instalments: readonly Instalment[]
  readonly totalInterest: Rupiah
  readonly totalPaid: Rupiah
  readonly trace: ComputationTrace
}

/**
 * The derivation, not the answer. Every rounding appears here as its own step
 * naming the convention it followed, because the few-rupiah divergence between
 * a calculator and a bank statement is exactly where trust is lost, and being
 * able to point at the step is the feature.
 */
export type TraceStep =
  | { readonly type: 'input'; readonly label: string; readonly value: string }
  | {
      readonly type: 'parameter'
      readonly label: string
      readonly parameterId: string
      readonly basis: string
      readonly sourceUrl: string
      readonly value: string
    }
  | {
      readonly type: 'formula'
      readonly label: string
      readonly expression: string
      readonly exact: number
    }
  | {
      readonly type: 'rounding'
      readonly label: string
      readonly exact: number
      readonly rounded: Rupiah
      readonly convention: RoundingConvention
    }
  /** Rendered in amber. Anything the app does not know. */
  | { readonly type: 'assumption'; readonly label: string; readonly detail: string }
  | { readonly type: 'conservation'; readonly label: string; readonly checks: readonly string[] }

export type ComputationTrace = readonly TraceStep[]
