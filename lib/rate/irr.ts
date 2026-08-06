import type { Schedule } from '@/lib/amortise/types'

/**
 * An independent internal-rate-of-return solver.
 *
 * This file shares no code with lib/rate/effective.ts — no import, no helper,
 * no formula in common. Effective works forward from the annuity identity;
 * this works backward from the cash flows alone, discounting them until the
 * present value is zero. Two routes to one number. If they agreed because
 * they shared a helper, they would only be validating each other's bugs.
 *
 * It is used in the tests *and* on screen: the rate a schedule actually costs
 * is worth stating, not just asserting.
 */

export class IrrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IrrError'
  }
}

/** Cash flows from the borrower's side: t=0 positive (received), then negative. */
export function scheduleCashFlows(schedule: Schedule): number[] {
  return [schedule.principal, ...schedule.instalments.map((instalment) => -instalment.payment)]
}

function presentValue(cashFlows: readonly number[], monthlyRate: number): number {
  let value = 0
  for (let t = 0; t < cashFlows.length; t += 1) {
    const flow = cashFlows[t]
    if (flow === undefined) continue
    value += flow / Math.pow(1 + monthlyRate, t)
  }
  return value
}

export interface IrrResult {
  readonly monthlyRate: number
  /** Nominal annual, i × 12 — comparable with a quoted bank rate. */
  readonly annualRate: number
  /** Compounded annual equivalent. */
  readonly annualEquivalentRate: number
  readonly iterations: number
  readonly residual: number
}

const MAX_ITERATIONS = 400
const TOLERANCE = 1e-14

/**
 * Bisection on the present value. Monotone over the bracket, so it converges
 * or it reports that it could not — it never returns a number it did not find.
 */
export function solveMonthlyIrr(cashFlows: readonly number[]): IrrResult {
  if (cashFlows.length < 2) {
    throw new IrrError('IRR memerlukan sekurang-kurangnya dua arus kas.')
  }

  let low = -0.9999
  let high = 1
  let valueLow = presentValue(cashFlows, low)
  let valueHigh = presentValue(cashFlows, high)

  let expansions = 0
  while (Math.sign(valueLow) === Math.sign(valueHigh)) {
    high *= 2
    valueHigh = presentValue(cashFlows, high)
    expansions += 1
    if (expansions > 64) {
      throw new IrrError('Tidak menemukan rentang yang memuat IRR untuk arus kas ini.')
    }
  }

  let iterations = 0
  let mid = (low + high) / 2
  while (iterations < MAX_ITERATIONS && high - low > TOLERANCE) {
    mid = (low + high) / 2
    const value = presentValue(cashFlows, mid)
    if (Math.sign(value) === Math.sign(valueLow)) {
      low = mid
      valueLow = value
    } else {
      high = mid
      valueHigh = value
    }
    iterations += 1
  }

  const monthlyRate = (low + high) / 2
  return {
    monthlyRate,
    annualRate: monthlyRate * 12,
    annualEquivalentRate: Math.pow(1 + monthlyRate, 12) - 1,
    iterations,
    residual: presentValue(cashFlows, monthlyRate),
  }
}

/** The rate a schedule actually costs, derived from its own cash flows. */
export function scheduleIrr(schedule: Schedule): IrrResult {
  return solveMonthlyIrr(scheduleCashFlows(schedule))
}
