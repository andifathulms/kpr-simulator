import flppPenghasilan from '@/data/rules/flpp/penghasilan.json'
import flppHarga from '@/data/rules/flpp/harga.json'
import flppPembiayaan from '@/data/rules/flpp/pembiayaan.json'
import pajakTransaksi from '@/data/rules/pajak/transaksi.json'
import gapsFile from '@/data/gaps.json'
import { z } from 'zod'
import { rulePackSchema, type RulePack } from './schema'
import { registry as makeRegistry, type Registry } from './resolver'

/**
 * The packs, bundled into the static export. There is no filesystem and no
 * fetch at runtime; `pnpm rules:validate` has already rejected anything
 * uncited before this module is ever imported, and the parse here is the
 * belt to that braces.
 */
const PACK_FILES: unknown[] = [flppPenghasilan, flppHarga, flppPembiayaan, pajakTransaksi]

export const PACKS: readonly RulePack[] = PACK_FILES.map((file) => rulePackSchema.parse(file))

export const RULES: Registry = makeRegistry(...PACKS)

const bilingual = z.object({ id: z.string().min(1), en: z.string().min(1) })

/**
 * What the app knows it does not know, stated as data rather than as prose
 * buried in a component. Rendered on the parameter page and wherever the
 * missing value would otherwise have been quietly assumed.
 */
export const gapsSchema = z.object({
  gaps: z.array(
    z.object({
      reference: z.string().min(1),
      title: bilingual,
      detail: bilingual,
    }),
  ),
})

export type CoverageGap = z.infer<typeof gapsSchema>['gaps'][number]

export const COVERAGE_GAPS: readonly CoverageGap[] = gapsSchema.parse(gapsFile).gaps
