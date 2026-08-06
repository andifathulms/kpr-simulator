import type { Rupiah } from '@/lib/money/rupiah'
import { formatPeriod, type Period } from '@/lib/period/period'
import { computed, unsupported, type Outcome } from './result'
import { resolveArea, resolveMoney, type Registry } from './resolver'
import type { Parameter } from './schema'

/**
 * FLPP eligibility.
 *
 * States which criterion fails, and by how much, rather than returning a
 * verdict. "Tidak memenuhi" is a fact about a stated ceiling; "you should
 * not apply" would be advice, and the app does not give any.
 *
 * Quota is noted as a real constraint on the subsidised page: meeting every
 * criterion here does not mean a place is available.
 */

export type Zona = 'satu' | 'dua' | 'tiga' | 'empat'

export type Status = 'tidak.kawin' | 'kawin' | 'tapera'

export type HargaWilayah =
  | 'jawa.sumatera'
  | 'kalimantan'
  | 'sulawesi.kepulauan'
  | 'maluku.balinusra.jabodetabek'
  | 'papua'

export interface EligibilityQuery {
  readonly at: Period
  readonly zona: Zona
  readonly status: Status
  readonly wilayah: HargaWilayah
  readonly monthlyIncome: Rupiah
  readonly housePrice: Rupiah
  /** Floor area of the unit, in square metres. */
  readonly floorArea: number
}

export interface Criterion {
  readonly key: 'penghasilan' | 'harga' | 'luas.lantai'
  readonly label: { readonly id: string; readonly en: string }
  readonly met: boolean
  readonly stated: string
  readonly ceiling: string
  readonly parameter: Parameter
}

export interface EligibilityReport {
  readonly at: Period
  readonly criteria: readonly Criterion[]
  /** Every criterion carried a cited ceiling and the stated figure is within it. */
  readonly allMet: boolean
}

const AMOUNT = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function checkEligibility(
  rules: Registry,
  query: EligibilityQuery,
): Outcome<EligibilityReport> {
  const incomeCeiling = resolveMoney(
    rules,
    `flpp.penghasilan.ceiling.zona.${query.zona}.${query.status}`,
    query.at,
  )
  const priceCeiling = resolveMoney(rules, `flpp.harga.ceiling.${query.wilayah}`, query.at)
  const areaCeiling = resolveArea(rules, 'flpp.luas.lantai.max.rumah.umum', query.at)

  const gaps = [incomeCeiling, priceCeiling, areaCeiling].flatMap((outcome) =>
    outcome.type === 'unsupported' ? [...outcome.gaps] : [],
  )
  if (gaps.length > 0) return unsupported(...gaps)
  if (
    incomeCeiling.type !== 'computed' ||
    priceCeiling.type !== 'computed' ||
    areaCeiling.type !== 'computed'
  ) {
    return unsupported({
      kind: 'rule-pack',
      reference: 'flpp',
      period: formatPeriod(query.at),
      detail: {
        id: 'Paket aturan FLPP tidak lengkap untuk periode ini.',
        en: 'The FLPP rule pack is incomplete for this period.',
      },
    })
  }

  const criteria: Criterion[] = [
    {
      key: 'penghasilan',
      label: { id: 'Penghasilan per bulan', en: 'Monthly income' },
      met: query.monthlyIncome <= incomeCeiling.value.value,
      stated: `Rp${AMOUNT.format(query.monthlyIncome)}`,
      ceiling: `Rp${AMOUNT.format(incomeCeiling.value.value)}`,
      parameter: incomeCeiling.value.parameter,
    },
    {
      key: 'harga',
      label: { id: 'Harga jual rumah', en: 'House sale price' },
      met: query.housePrice <= priceCeiling.value.value,
      stated: `Rp${AMOUNT.format(query.housePrice)}`,
      ceiling: `Rp${AMOUNT.format(priceCeiling.value.value)}`,
      parameter: priceCeiling.value.parameter,
    },
    {
      key: 'luas.lantai',
      label: { id: 'Luas lantai', en: 'Floor area' },
      met: query.floorArea <= areaCeiling.value.value,
      stated: `${query.floorArea} m²`,
      ceiling: `${areaCeiling.value.value} m²`,
      parameter: areaCeiling.value.parameter,
    },
  ]

  return computed({
    at: query.at,
    criteria,
    allMet: criteria.every((criterion) => criterion.met),
  })
}
