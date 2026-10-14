import type { RoundingConvention, Rupiah } from '@/lib/money/rupiah'
import type { Period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'

/**
 * The instalment after the fixed period, sampled across floating rates — the
 * line on ambang's crossing chart. The solver gives one rate; this draws the
 * whole relationship it was found on, so the answer can be seen as the point
 * where the instalment meets the limit rather than taken on trust.
 *
 * Each point is a full schedule built by the engine, which asserts
 * conservation as it builds, and the first floating instalment read off it.
 * Nothing is interpolated. Rates are the caller's; none is proposed here.
 */

export class CurveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CurveError'
  }
}

export interface CurveTerms {
  readonly principal: Rupiah
  readonly start: Period
  readonly termMonths: number
  /** Length of the quoted fixed period, in months. */
  readonly fixedMonths: number
  readonly fixedAnnualRate: number
  readonly rounding: RoundingConvention
}

export interface CurvePoint {
  readonly annualRate: number
  /** The first instalment after the fixed period, at that rate. */
  readonly payment: Rupiah
}

export function floatingPaymentCurve(
  terms: CurveTerms,
  rates: readonly number[],
): CurvePoint[] {
  if (terms.fixedMonths <= 0 || terms.fixedMonths >= terms.termMonths) {
    throw new CurveError(
      `Masa tetap ${terms.fixedMonths} bulan harus di antara 1 dan ${terms.termMonths - 1} bulan. ` +
        'Tanpa periode mengambang tidak ada kurva untuk digambar.',
    )
  }

  return rates.map((annualRate) => {
    if (!Number.isFinite(annualRate) || annualRate < 0) {
      throw new CurveError(`Bunga mengambang harus angka tidak negatif, diterima: ${annualRate}`)
    }
    const schedule = buildSchedule({
      principal: terms.principal,
      start: terms.start,
      termMonths: terms.termMonths,
      rounding: terms.rounding,
      segments: [
        {
          months: terms.fixedMonths,
          annualRate: terms.fixedAnnualRate,
          phase: 'tetap',
          assumed: false,
        },
        {
          months: terms.termMonths - terms.fixedMonths,
          annualRate,
          phase: 'mengambang',
          assumed: true,
        },
      ],
    })
    const first = schedule.instalments[terms.fixedMonths]
    if (!first) {
      throw new CurveError(`Jadwal tidak memuat bulan ke-${terms.fixedMonths + 1}.`)
    }
    return { annualRate, payment: first.payment }
  })
}
