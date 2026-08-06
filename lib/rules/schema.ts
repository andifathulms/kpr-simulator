import { z } from 'zod'

/**
 * The rule-pack schema. Every parameter carries a legal basis, a source URL,
 * an effective period, and a verification date. The build rejects an uncited
 * parameter — that is the whole point of the pack.
 *
 * Identifiers are namespaced and versionless: `flpp.rate`, not `flpp.rate.2025`.
 * The effective period disambiguates, never the key.
 */

const PERIOD_STRING = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Periode harus berformat YYYY-MM')

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus berformat YYYY-MM-DD')

/** Lowercase dot-separated segments. No year and no vN — periods disambiguate. */
const PARAMETER_ID = z
  .string()
  .regex(/^[a-z][a-z0-9]*(\.[a-z0-9]+)+$/, 'Identifier harus huruf kecil dan dipisahkan titik')
  .refine(
    (id) => !id.split('.').some((segment) => /^(\d{4}|v\d+)$/.test(segment)),
    'Identifier tidak boleh memuat tahun atau versi — periode yang membedakan, bukan kunci',
  )

const bilingual = z.object({
  id: z.string().min(1),
  en: z.string().min(1),
})

/**
 * Money is an integer count of rupiah. Rates and ratios are decimals, never
 * percentages, so nothing in the pack needs dividing by 100 at the call site.
 */
export const parameterValueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('money'), amount: z.number().int() }),
  z.object({ kind: z.literal('rate'), decimal: z.number().min(0).max(1) }),
  z.object({ kind: z.literal('ratio'), decimal: z.number().min(0).max(1) }),
  z.object({ kind: z.literal('months'), count: z.number().int().positive() }),
  z.object({ kind: z.literal('area'), squareMetres: z.number().positive() }),
  z.object({ kind: z.literal('text'), value: z.string().min(1) }),
])

export const parameterSchema = z.object({
  id: PARAMETER_ID,
  label: bilingual,
  value: parameterValueSchema,
  effectiveFrom: PERIOD_STRING,
  /** null means still in force. Exactly one open entry per identifier. */
  effectiveTo: PERIOD_STRING.nullable(),
  /** The article, not the press release. "Lampiran Permen PKP 5/2025". */
  basis: z.string().min(4),
  sourceUrl: z.string().url().startsWith('https://', 'Sumber harus https'),
  verifiedAt: ISO_DATE,
  /** Month this figure is expected to be revisited, for annual adjustments. */
  expectedReview: PERIOD_STRING.optional(),
  note: bilingual.optional(),
})

export const rulePackSchema = z.object({
  /** Matches the directory the pack lives in. */
  pack: z.string().regex(/^[a-z][a-z0-9]*$/),
  title: bilingual,
  parameters: z.array(parameterSchema).min(1),
})

export type ParameterValue = z.infer<typeof parameterValueSchema>
export type Parameter = z.infer<typeof parameterSchema>
export type RulePack = z.infer<typeof rulePackSchema>
