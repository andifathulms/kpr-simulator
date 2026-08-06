import { rupiah, type RoundingConvention, type Rupiah } from '@/lib/money/rupiah'
import type { Period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import type { Instalment, Schedule } from '@/lib/amortise/types'

/**
 * The floating period, drawn as a band rather than a line.
 *
 * Three crisp curves would misrepresent what is actually known. The rate a
 * bank will charge after the fixed period is not a forecast the app is making
 * — it is a quantity nobody outside the bank has. So the app takes the user's
 * own assumptions, computes each one exactly, and shades the space between
 * them. Everything past the boundary is amber.
 */

export type ScenarioKey = 'optimis' | 'dasar' | 'tekanan'

export interface ScenarioInput {
  readonly key: ScenarioKey
  /**
   * The reference rate the user is anchoring on — an SBDK snapshot they read,
   * or a figure they were quoted. Never supplied by the app.
   */
  readonly baseRate: number
  /** The bank's margin over that base. Bank-internal and unpublished. */
  readonly margin: number
}

export interface ScenarioResult {
  readonly key: ScenarioKey
  readonly annualRate: number
  readonly schedule: Schedule
  /** First instalment after the fixed period ends. */
  readonly paymentAfterBoundary: Rupiah
  readonly totalPaid: Rupiah
}

export interface BandRow {
  readonly index: number
  readonly period: Period
  readonly low: Rupiah
  readonly base: Rupiah
  readonly high: Rupiah
  /** True for every month past the fixed-period boundary. */
  readonly assumed: boolean
}

export interface Band {
  /** 1-based month at which the fixed period ends and the band opens. */
  readonly boundaryMonth: number
  readonly scenarios: readonly ScenarioResult[]
  readonly rows: readonly BandRow[]
}

export interface BandTerms {
  readonly principal: Rupiah
  readonly start: Period
  readonly termMonths: number
  readonly fixedMonths: number
  /** The rate the bank actually quoted for the fixed period. */
  readonly fixedAnnualRate: number
  readonly rounding: RoundingConvention
  readonly scenarios: readonly ScenarioInput[]
}

export class BandError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BandError'
  }
}

export function scenarioRate(scenario: ScenarioInput): number {
  return scenario.baseRate + scenario.margin
}

export function buildBand(terms: BandTerms): Band {
  if (terms.fixedMonths <= 0 || terms.fixedMonths >= terms.termMonths) {
    throw new BandError(
      `Masa tetap ${terms.fixedMonths} bulan harus di antara 1 dan ${terms.termMonths - 1}. ` +
        'Tanpa periode mengambang tidak ada pita untuk digambar.',
    )
  }
  if (terms.scenarios.length === 0) {
    throw new BandError('Pita memerlukan sekurang-kurangnya satu skenario.')
  }

  const scenarios: ScenarioResult[] = terms.scenarios.map((scenario) => {
    const annualRate = scenarioRate(scenario)
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
          // Always. The floating rate is never data.
          assumed: true,
          label: `Skenario ${scenario.key}`,
        },
      ],
    })
    const afterBoundary = schedule.instalments[terms.fixedMonths]
    return {
      key: scenario.key,
      annualRate,
      schedule,
      paymentAfterBoundary: afterBoundary?.payment ?? rupiah(0),
      totalPaid: schedule.totalPaid,
    }
  })

  const base =
    scenarios.find((scenario) => scenario.key === 'dasar') ??
    scenarios[Math.floor(scenarios.length / 2)]
  if (!base) throw new BandError('Skenario dasar tidak ditemukan.')

  const rows: BandRow[] = []
  for (let month = 0; month < terms.termMonths; month += 1) {
    const payments = scenarios
      .map((scenario) => scenario.schedule.instalments[month])
      .filter((instalment): instalment is Instalment => instalment !== undefined)
      .map((instalment) => instalment.payment)
    const reference = base.schedule.instalments[month]
    if (payments.length === 0 || !reference) continue

    rows.push({
      index: month + 1,
      period: reference.period,
      low: rupiah(Math.min(...payments)),
      base: reference.payment,
      high: rupiah(Math.max(...payments)),
      assumed: month >= terms.fixedMonths,
    })
  }

  return { boundaryMonth: terms.fixedMonths, scenarios, rows }
}
