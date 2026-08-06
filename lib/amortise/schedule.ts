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
import type { Instalment, LoanTerms, Schedule, TraceStep } from './types'

/**
 * The effective-interest schedule, segment by segment.
 *
 * At the start of each rate segment the instalment is recomputed on the
 * balance then outstanding over the term then remaining, which is what a bank
 * does when a fixed period ends. That recomputation is the step the whole
 * project exists to make visible.
 */

export class ScheduleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScheduleError'
  }
}

function validateTerms(terms: LoanTerms): void {
  if (terms.principal <= 0) {
    throw new ScheduleError(`Plafon harus positif, diterima: ${terms.principal}`)
  }
  if (!Number.isSafeInteger(terms.termMonths) || terms.termMonths <= 0) {
    throw new ScheduleError(`Tenor harus bilangan bulat positif, diterima: ${terms.termMonths}`)
  }
  if (terms.segments.length === 0) {
    throw new ScheduleError('Jadwal memerlukan sekurang-kurangnya satu segmen bunga')
  }
  const covered = terms.segments.reduce((total, segment) => total + segment.months, 0)
  if (covered !== terms.termMonths) {
    throw new ScheduleError(
      `Segmen bunga menutup ${covered} bulan, sedangkan tenor ${terms.termMonths} bulan. ` +
        'Segmen harus menutup tenor tepat — tanpa celah dan tanpa tumpang tindih.',
    )
  }
  for (const segment of terms.segments) {
    if (!Number.isSafeInteger(segment.months) || segment.months <= 0) {
      throw new ScheduleError(`Panjang segmen harus bilangan bulat positif: ${segment.months}`)
    }
    if (!Number.isFinite(segment.annualRate) || segment.annualRate < 0) {
      throw new ScheduleError(`Suku bunga tahunan harus ≥ 0, diterima: ${segment.annualRate}`)
    }
  }
}

export function buildSchedule(terms: LoanTerms): Schedule {
  validateTerms(terms)

  const trace: TraceStep[] = [
    { type: 'input', label: 'Plafon', value: String(terms.principal) },
    { type: 'input', label: 'Tenor (bulan)', value: String(terms.termMonths) },
    { type: 'input', label: 'Angsuran pertama', value: formatPeriod(terms.start) },
    {
      type: 'input',
      label: 'Konvensi bunga',
      value: 'efektif — bunga dihitung atas saldo terutang',
    },
  ]

  const instalments: Instalment[] = []
  let balance: Rupiah = terms.principal
  let month = 0

  for (const [segmentIndex, segment] of terms.segments.entries()) {
    const remainingTerm = terms.termMonths - month

    if (segment.assumed) {
      trace.push({
        type: 'assumption',
        label: segment.label ?? `Segmen ${segmentIndex + 1} — bunga mengambang`,
        detail:
          `Suku bunga ${(segment.annualRate * 100).toFixed(2)}% per tahun adalah asumsi Anda, bukan data. ` +
          'Bunga setelah masa tetap tidak dipublikasikan bank.',
      })
    }

    const payment = annuityPayment(balance, segment.annualRate, remainingTerm, terms.rounding)
    trace.push({
      type: 'formula',
      label:
        segmentIndex === 0
          ? 'Angsuran bulanan'
          : `Angsuran dihitung ulang pada bulan ke-${month + 1} (${segment.phase})`,
      expression: payment.expression,
      exact: payment.exact,
    })
    trace.push({
      type: 'rounding',
      label: 'Pembulatan angsuran',
      exact: payment.exact,
      rounded: payment.value,
      convention: payment.convention,
    })

    const isFinalSegment = segmentIndex === terms.segments.length - 1

    for (let step = 0; step < segment.months; step += 1) {
      const openingBalance = balance
      const interest = applyRate(openingBalance, monthlyRate(segment.annualRate), terms.rounding)

      const isFinalInstalment = isFinalSegment && step === segment.months - 1
      // The last instalment settles the balance exactly. Every schedule of
      // rounded instalments leaves a few rupiah somewhere; a bank clears them
      // in the final payment rather than leaving a balance behind, and so
      // does this. The divergence is visible in the table, not hidden.
      const principalPortion = isFinalInstalment
        ? openingBalance
        : clampPrincipal(subtract(payment.value, interest.value), openingBalance)

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
      month += 1
    }
  }

  const totalInterest = sum(instalments.map((instalment) => instalment.interest))
  const schedule: Schedule = {
    principal: terms.principal,
    start: terms.start,
    termMonths: terms.termMonths,
    convention: 'efektif',
    instalments,
    totalInterest,
    totalPaid: add(terms.principal, totalInterest),
    trace,
  }

  trace.push(conservationStep(assertConservation(schedule)))
  return schedule
}

/**
 * A negative principal portion means the instalment does not even cover the
 * month's interest, so the loan would never amortise. That is a real
 * condition, not a rounding artefact, and it must not be silently absorbed.
 */
function clampPrincipal(portion: Rupiah, openingBalance: Rupiah): Rupiah {
  if (portion < 0) {
    throw new ScheduleError(
      'Angsuran tidak menutup bunga bulan ini, sehingga pokok tidak pernah berkurang. ' +
        'Periksa suku bunga dan tenor.',
    )
  }
  return portion > openingBalance ? openingBalance : portion === 0 ? ZERO : portion
}
