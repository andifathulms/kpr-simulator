import { subtract, type Rupiah } from '@/lib/money/rupiah'
import type { Schedule } from '@/lib/amortise/types'

/**
 * Subsidised beside commercial, for one profile.
 *
 * The comparison is between two *products*, not between two banks, and it
 * ranks neither. It states each side's figures and — the part that matters —
 * how much of each side is actually known.
 *
 * FLPP is fixed to the end of the term, so its total is a number. A
 * commercial loan's total depends on a rate nobody outside the bank has, so
 * its total is contingent on an assumption the user supplied. A difference
 * computed between the two is therefore contingent as well, and this module
 * refuses to hand back a bare delta without saying so: `contingent` travels
 * with the figure rather than being left for the interface to remember.
 */

export interface ComparisonSide {
  readonly key: 'subsidi' | 'komersial'
  readonly schedule: Schedule
  readonly firstPayment: Rupiah
  /** Present only where the term contains a floating phase. */
  readonly paymentAfterBoundary: Rupiah | null
  readonly totalPaid: Rupiah
  readonly totalInterest: Rupiah
  /** True when any instalment in the term rests on an assumed rate. */
  readonly contingent: boolean
}

export interface Comparison {
  readonly subsidi: ComparisonSide
  readonly komersial: ComparisonSide
  /**
   * komersial − subsidi. Positive means the commercial path totals more under
   * the assumption the user stated. It is not a prediction and it is not a
   * recommendation; it is arithmetic on one assumed rate.
   */
  readonly totalPaidDifference: Rupiah
  readonly firstPaymentDifference: Rupiah
  /** True whenever either side is contingent, which in practice is always. */
  readonly differenceIsContingent: boolean
}

function side(
  key: ComparisonSide['key'],
  schedule: Schedule,
  boundaryMonth: number | null,
): ComparisonSide {
  const afterBoundary =
    boundaryMonth === null ? null : (schedule.instalments[boundaryMonth]?.payment ?? null)
  return {
    key,
    schedule,
    firstPayment: schedule.instalments[0]?.payment ?? (0 as Rupiah),
    paymentAfterBoundary: afterBoundary,
    totalPaid: schedule.totalPaid,
    totalInterest: schedule.totalInterest,
    contingent: schedule.instalments.some((instalment) => instalment.assumed),
  }
}

export function compare(
  subsidiSchedule: Schedule,
  komersialSchedule: Schedule,
  komersialBoundaryMonth: number | null,
): Comparison {
  const subsidi = side('subsidi', subsidiSchedule, null)
  const komersial = side('komersial', komersialSchedule, komersialBoundaryMonth)

  return {
    subsidi,
    komersial,
    totalPaidDifference: subtract(komersial.totalPaid, subsidi.totalPaid),
    firstPaymentDifference: subtract(komersial.firstPayment, subsidi.firstPayment),
    differenceIsContingent: subsidi.contingent || komersial.contingent,
  }
}
