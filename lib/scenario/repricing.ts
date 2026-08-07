import type { RateSegment } from '@/lib/amortise/types'

/**
 * The floating rate is repriced on a cadence, not once.
 *
 * A credit agreement reviews the rate every 3, 6 or 12 months, so a borrower
 * is not exposed to one unknown number — they are exposed to a sequence of
 * them, one per review, for the rest of the term. The app modelled a single
 * step at the boundary and a flat line after it, which is the same flattening
 * it exists to criticise, one level up.
 *
 * This is deliberately display-only: it reports *when* the rate may be reset
 * and never touches the schedule.
 *
 * The alternative was tried and rejected on measurement. Splitting the
 * floating period into one segment per review — same rate throughout — is not
 * arithmetically free: the annuity is re-rounded at each boundary, which moved
 * the total by 39 rupiah and changed 55 of 180 instalments by a rupiah each on
 * a 15-year fixture. Those are the user's figures, the ones they print and
 * take to a bank, and moving them to make a teaching point is the wrong trade.
 * (A bank that genuinely recomputes at each review would land closer to the
 * split figure — but which convention a given bank uses is not something this
 * app knows, and guessing it is exactly what it refuses to do.)
 *
 * Inventing a *different* rate per review would be worse still: that is a
 * volatility, which is a forecast. The app does not have one.
 */

/** 1-based months at which the rate may be reset, in order. */
export function reviewPoints(
  fixedMonths: number,
  termMonths: number,
  reviewMonths: number,
): readonly number[] {
  if (!Number.isInteger(reviewMonths) || reviewMonths <= 0) return []
  if (fixedMonths <= 0 || fixedMonths >= termMonths) return []

  const points: number[] = []
  // The first reset is the boundary itself: the end of the fixed period is
  // the first time the rate is allowed to move.
  for (let month = fixedMonths; month < termMonths; month += reviewMonths) {
    points.push(month + 1)
  }
  return points
}

/** How many times the rate may be reset before the loan is repaid. */
export function reviewCount(
  fixedMonths: number,
  termMonths: number,
  reviewMonths: number,
): number {
  return reviewPoints(fixedMonths, termMonths, reviewMonths).length
}

/** The floating segments, labelled with the review each one opens. */
export function labelReviews(
  segments: readonly RateSegment[],
  reviewMonths: number,
): readonly RateSegment[] {
  if (!Number.isInteger(reviewMonths) || reviewMonths <= 0) return segments
  return segments.map((segment) =>
    segment.phase === 'mengambang'
      ? { ...segment, label: `Bunga mengambang — ditinjau tiap ${reviewMonths} bulan` }
      : segment,
  )
}
