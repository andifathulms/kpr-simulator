import { add, applyRate, fromExact, subtract, sum, type Rupiah } from '@/lib/money/rupiah'
import { addMonths, formatPeriod } from '@/lib/period/period'
import { assertConservation, conservationStep } from './conservation'
import type { Instalment, LoanTerms, Schedule, TraceStep } from './types'
import { ScheduleError } from './schedule'

/**
 * Bunga flat — interest charged on the *original* principal for every month
 * of the term, regardless of how much has been repaid.
 *
 * This is a different product convention, not a different way of expressing
 * the same one. A flat 5% is roughly a 9% effective rate, and conflating the
 * two is the most widespread confusion in Indonesian consumer credit.
 * Nothing here is derived from lib/amortise/annuity.ts, and nothing there is
 * derived from here. See lib/rate/effective.ts for the comparison.
 */

export interface FlatTerms extends Omit<LoanTerms, 'segments'> {
  /** A flat quote is a single rate for the whole term by construction. */
  readonly annualRate: number
  readonly assumed: boolean
}

export function buildFlatSchedule(terms: FlatTerms): Schedule {
  if (terms.principal <= 0) {
    throw new ScheduleError(`Plafon harus positif, diterima: ${terms.principal}`)
  }
  if (!Number.isSafeInteger(terms.termMonths) || terms.termMonths <= 0) {
    throw new ScheduleError(`Tenor harus bilangan bulat positif, diterima: ${terms.termMonths}`)
  }
  if (!Number.isFinite(terms.annualRate) || terms.annualRate < 0) {
    throw new ScheduleError(`Suku bunga tahunan harus ≥ 0, diterima: ${terms.annualRate}`)
  }

  const trace: TraceStep[] = [
    { type: 'input', label: 'Plafon', value: String(terms.principal) },
    { type: 'input', label: 'Tenor (bulan)', value: String(terms.termMonths) },
    { type: 'input', label: 'Angsuran pertama', value: formatPeriod(terms.start) },
    {
      type: 'input',
      label: 'Konvensi bunga',
      value: 'flat — bunga dihitung atas plafon awal sepanjang tenor',
    },
  ]

  if (terms.assumed) {
    trace.push({
      type: 'assumption',
      label: 'Suku bunga flat',
      detail: `${(terms.annualRate * 100).toFixed(2)}% per tahun adalah asumsi Anda, bukan data.`,
    })
  }

  // Interest is on the original principal, every month, and never changes.
  const monthlyInterest = applyRate(terms.principal, terms.annualRate / 12, terms.rounding)
  trace.push({
    type: 'formula',
    label: 'Bunga per bulan (tetap sepanjang tenor)',
    expression: `${terms.principal} × ${terms.annualRate} ÷ 12`,
    exact: monthlyInterest.exact,
  })
  trace.push({
    type: 'rounding',
    label: 'Pembulatan bunga bulanan',
    exact: monthlyInterest.exact,
    rounded: monthlyInterest.value,
    convention: monthlyInterest.convention,
  })

  const monthlyPrincipal = fromExact(terms.principal / terms.termMonths, terms.rounding)
  trace.push({
    type: 'formula',
    label: 'Pokok per bulan',
    expression: `${terms.principal} ÷ ${terms.termMonths}`,
    exact: monthlyPrincipal.exact,
  })
  trace.push({
    type: 'rounding',
    label: 'Pembulatan pokok bulanan',
    exact: monthlyPrincipal.exact,
    rounded: monthlyPrincipal.value,
    convention: monthlyPrincipal.convention,
  })

  const instalments: Instalment[] = []
  let balance: Rupiah = terms.principal

  for (let month = 0; month < terms.termMonths; month += 1) {
    const openingBalance = balance
    const isFinal = month === terms.termMonths - 1
    // The final instalment clears whatever the per-month rounding left over.
    const principalPortion = isFinal ? openingBalance : monthlyPrincipal.value
    const closingBalance = subtract(openingBalance, principalPortion)

    instalments.push({
      index: month + 1,
      period: addMonths(terms.start, month),
      openingBalance,
      payment: add(monthlyInterest.value, principalPortion),
      interest: monthlyInterest.value,
      principal: principalPortion,
      closingBalance,
      annualRate: terms.annualRate,
      phase: 'tetap',
      assumed: terms.assumed,
    })

    balance = closingBalance
  }

  const totalInterest = sum(instalments.map((instalment) => instalment.interest))
  const schedule: Schedule = {
    principal: terms.principal,
    start: terms.start,
    termMonths: terms.termMonths,
    convention: 'flat',
    instalments,
    totalInterest,
    totalPaid: add(terms.principal, totalInterest),
    trace,
  }

  trace.push(conservationStep(assertConservation(schedule)))
  return schedule
}
