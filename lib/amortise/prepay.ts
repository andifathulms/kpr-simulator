import {
  ZERO,
  add,
  applyRate,
  subtract,
  sum,
  type Rupiah,
} from '@/lib/money/rupiah'
import { addMonths, formatPeriod } from '@/lib/period/period'
import { annuityPayment, monthlyRate } from './annuity'
import { assertConservation, conservationStep } from './conservation'
import { ScheduleError, buildSchedule } from './schedule'
import type { Instalment, LoanTerms, Schedule, TraceStep } from './types'

/**
 * What an extra payment actually saves.
 *
 * Both modes a bank offers are modelled, because they are different products
 * of the same money: keep the instalment and finish sooner, or keep the term
 * and pay less each month. The early-settlement penalty is included as an
 * input because it materially changes the answer — and because it is
 * bank-discretionary, it is always the user's figure, never one the app
 * supplies.
 */

export type PrepayMode =
  /** Keep the instalment; the term shortens. */
  | 'perpendek-tenor'
  /** Keep the term; the instalment falls. */
  | 'perkecil-angsuran'

export interface Prepayment {
  /** 1-based month the extra payment is made, alongside that instalment. */
  readonly atMonth: number
  readonly amount: Rupiah
}

export interface PrepayTerms extends LoanTerms {
  readonly prepayments: readonly Prepayment[]
  readonly mode: PrepayMode
  /**
   * Penalti pelunasan dipercepat, as a decimal share of the amount prepaid.
   * Bank-discretionary: it is whatever the user's contract says.
   */
  readonly penaltyRate: number
}

export interface PrepayResult {
  readonly baseline: Schedule
  readonly withPrepayment: Schedule
  readonly mode: PrepayMode
  readonly monthsSaved: number
  readonly interestSaved: Rupiah
  /** Charged on the amount prepaid, outside the schedule — it is a fee. */
  readonly penalty: Rupiah
  /** Interest saved less the penalty. May be negative; stated either way. */
  readonly netSaving: Rupiah
  readonly totalPrepaid: Rupiah
}

function segmentAtMonth(terms: LoanTerms, month: number) {
  let cursor = 0
  for (const segment of terms.segments) {
    if (month < cursor + segment.months) return segment
    cursor += segment.months
  }
  return terms.segments[terms.segments.length - 1]
}

/** Month index (0-based) at which each rate segment begins. */
function segmentStarts(terms: LoanTerms): number[] {
  const starts: number[] = []
  let cursor = 0
  for (const segment of terms.segments) {
    starts.push(cursor)
    cursor += segment.months
  }
  return starts
}

export function simulatePrepayment(terms: PrepayTerms): PrepayResult {
  const baseline = buildSchedule(terms)

  for (const prepayment of terms.prepayments) {
    if (prepayment.atMonth < 1 || prepayment.atMonth > terms.termMonths) {
      throw new ScheduleError(
        `Pelunasan sebagian pada bulan ke-${prepayment.atMonth} berada di luar tenor ${terms.termMonths} bulan.`,
      )
    }
    if (prepayment.amount <= 0) {
      throw new ScheduleError('Jumlah pelunasan sebagian harus positif.')
    }
  }
  if (!Number.isFinite(terms.penaltyRate) || terms.penaltyRate < 0) {
    throw new ScheduleError(`Penalti harus ≥ 0, diterima: ${terms.penaltyRate}`)
  }

  const byMonth = new Map<number, Rupiah>()
  for (const prepayment of terms.prepayments) {
    byMonth.set(prepayment.atMonth, add(byMonth.get(prepayment.atMonth) ?? ZERO, prepayment.amount))
  }

  const trace: TraceStep[] = [
    { type: 'input', label: 'Plafon', value: String(terms.principal) },
    { type: 'input', label: 'Angsuran pertama', value: formatPeriod(terms.start) },
    {
      type: 'input',
      label: 'Mode pelunasan sebagian',
      value:
        terms.mode === 'perpendek-tenor'
          ? 'perpendek tenor — angsuran tetap, tenor memendek'
          : 'perkecil angsuran — tenor tetap, angsuran mengecil',
    },
    {
      type: 'assumption',
      label: 'Penalti pelunasan dipercepat',
      detail:
        `${(terms.penaltyRate * 100).toFixed(2)}% dari jumlah yang dilunasi lebih awal adalah angka Anda, ` +
        'bukan data. Besaran penalti ditentukan masing-masing bank dan tertulis di perjanjian kredit.',
    },
  ]

  const starts = new Set(segmentStarts(terms))
  const instalments: Instalment[] = []
  let balance: Rupiah = terms.principal
  let payment = annuityPayment(
    terms.principal,
    segmentAtMonth(terms, 0)?.annualRate ?? 0,
    terms.termMonths,
    terms.rounding,
  ).value
  let totalPrepaid: Rupiah = ZERO

  for (let month = 0; month < terms.termMonths && balance > 0; month += 1) {
    const segment = segmentAtMonth(terms, month)
    if (!segment) throw new ScheduleError('Segmen bunga tidak ditemukan.')

    // The instalment is recomputed when a rate segment begins — as in the
    // ordinary schedule — and, in reduce-instalment mode, after a prepayment.
    if (starts.has(month) && month > 0) {
      payment = annuityPayment(
        balance,
        segment.annualRate,
        terms.termMonths - month,
        terms.rounding,
      ).value
    }

    const openingBalance = balance
    const interest = applyRate(openingBalance, monthlyRate(segment.annualRate), terms.rounding)

    const extra = byMonth.get(month + 1) ?? ZERO
    const scheduled = subtract(payment, interest.value)
    // The final instalment of the term settles the balance exactly, as in the
    // ordinary schedule — otherwise the per-month rounding leaves a few rupiah
    // outstanding after the last payment.
    const isFinalMonth = month === terms.termMonths - 1
    const regularPrincipal =
      isFinalMonth || scheduled >= openingBalance ? openingBalance : scheduled
    const cappedExtra = subtract(openingBalance, regularPrincipal) < extra
      ? subtract(openingBalance, regularPrincipal)
      : extra
    const principalPortion = add(regularPrincipal, cappedExtra)
    totalPrepaid = add(totalPrepaid, cappedExtra)

    if (principalPortion < 0) {
      throw new ScheduleError(
        'Angsuran tidak menutup bunga bulan ini, sehingga pokok tidak pernah berkurang.',
      )
    }

    const closingBalance = subtract(openingBalance, principalPortion)
    instalments.push({
      index: month + 1,
      period: addMonths(terms.start, month),
      openingBalance,
      payment: add(interest.value, principalPortion),
      interest: interest.value,
      principal: principalPortion,
      closingBalance,
      annualRate: segment.annualRate,
      phase: segment.phase,
      assumed: segment.assumed,
    })

    balance = closingBalance

    if (cappedExtra > 0 && terms.mode === 'perkecil-angsuran' && balance > 0) {
      const remaining = terms.termMonths - (month + 1)
      if (remaining > 0) {
        const recomputed = annuityPayment(balance, segment.annualRate, remaining, terms.rounding)
        payment = recomputed.value
        trace.push({
          type: 'formula',
          label: `Angsuran dihitung ulang setelah pelunasan sebagian pada bulan ke-${month + 1}`,
          expression: recomputed.expression,
          exact: recomputed.exact,
        })
        trace.push({
          type: 'rounding',
          label: 'Pembulatan angsuran baru',
          exact: recomputed.exact,
          rounded: recomputed.value,
          convention: recomputed.convention,
        })
      }
    }
  }

  const totalInterest = sum(instalments.map((instalment) => instalment.interest))
  const withPrepayment: Schedule = {
    principal: terms.principal,
    start: terms.start,
    // Descriptive: in shorten-tenor mode the loan genuinely ends earlier.
    termMonths: instalments.length,
    convention: 'efektif',
    instalments,
    totalInterest,
    totalPaid: add(terms.principal, totalInterest),
    trace,
  }
  trace.push(conservationStep(assertConservation(withPrepayment)))

  const penalty = applyRate(totalPrepaid, terms.penaltyRate, 'pembulatan-ke-atas').value
  const interestSaved = subtract(baseline.totalInterest, totalInterest)

  return {
    baseline,
    withPrepayment,
    mode: terms.mode,
    monthsSaved: baseline.termMonths - instalments.length,
    interestSaved,
    penalty,
    netSaving: subtract(interestSaved, penalty),
    totalPrepaid,
  }
}
