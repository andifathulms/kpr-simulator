import { addMonths, comparePeriods, formatPeriod, parsePeriod } from '@/lib/period/period'
import { rulePackSchema, type Parameter, type RulePack } from './schema'

/**
 * Integrity rules that a per-object schema cannot express: the shape of a
 * parameter's history across packs. Run by `pnpm rules:validate`, which gates
 * the build and CI.
 */

export interface Violation {
  readonly pack: string
  readonly parameterId: string | null
  readonly message: string
}

export interface ValidationInput {
  readonly pack: string
  /** Directory the pack was loaded from, used to check pack/directory agreement. */
  readonly directory: string
  readonly raw: unknown
}

export interface ValidationResult {
  readonly packs: readonly RulePack[]
  readonly violations: readonly Violation[]
}

/** Parses every pack, then checks the cross-pack history of each identifier. */
export function validateRulePacks(
  inputs: readonly ValidationInput[],
  /** Explicit, because nothing in lib/ reads the clock — the script passes it. */
  today: string,
): ValidationResult {
  const violations: Violation[] = []
  const packs: RulePack[] = []

  for (const input of inputs) {
    const parsed = rulePackSchema.safeParse(input.raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        violations.push({
          pack: input.pack,
          parameterId: null,
          message: `${issue.path.join('.') || '(akar)'}: ${issue.message}`,
        })
      }
      continue
    }
    if (parsed.data.pack !== input.directory) {
      violations.push({
        pack: input.pack,
        parameterId: null,
        message: `pack "${parsed.data.pack}" tidak cocok dengan direktori "${input.directory}"`,
      })
    }
    packs.push(parsed.data)
  }

  violations.push(...checkNamespacing(packs))
  violations.push(...checkVerification(packs, today))
  violations.push(...checkHistories(packs))

  return { packs, violations }
}

/** `flpp.rate` belongs in the flpp pack and nowhere else. */
function checkNamespacing(packs: readonly RulePack[]): Violation[] {
  const violations: Violation[] = []
  for (const pack of packs) {
    for (const parameter of pack.parameters) {
      if (!parameter.id.startsWith(`${pack.pack}.`)) {
        violations.push({
          pack: pack.pack,
          parameterId: parameter.id,
          message: `identifier harus diawali "${pack.pack}."`,
        })
      }
    }
  }
  return violations
}

function checkVerification(packs: readonly RulePack[], today: string): Violation[] {
  const violations: Violation[] = []
  for (const pack of packs) {
    for (const parameter of pack.parameters) {
      if (Number.isNaN(Date.parse(parameter.verifiedAt))) {
        violations.push({
          pack: pack.pack,
          parameterId: parameter.id,
          message: `verifiedAt bukan tanggal yang sah: "${parameter.verifiedAt}"`,
        })
        continue
      }
      if (parameter.verifiedAt > today) {
        violations.push({
          pack: pack.pack,
          parameterId: parameter.id,
          message: `verifiedAt "${parameter.verifiedAt}" berada di masa depan`,
        })
      }
    }
  }
  return violations
}

/**
 * Per identifier: entries must not overlap, must not leave a gap, and at most
 * one may be open-ended — and if one is, it must be the latest.
 *
 * A gap matters because the resolver refuses rather than falling back to the
 * nearest year. A gap is therefore a silent refusal waiting to happen, and it
 * should fail the build instead of the user's calculation.
 */
function checkHistories(packs: readonly RulePack[]): Violation[] {
  const violations: Violation[] = []
  const byId = new Map<string, { pack: string; parameter: Parameter }[]>()

  for (const pack of packs) {
    for (const parameter of pack.parameters) {
      const entries = byId.get(parameter.id) ?? []
      entries.push({ pack: pack.pack, parameter })
      byId.set(parameter.id, entries)
    }
  }

  for (const [id, entries] of byId) {
    const packName = entries[0]?.pack ?? '(unknown)'

    for (const { parameter } of entries) {
      if (parameter.effectiveTo === null) continue
      if (comparePeriods(parsePeriod(parameter.effectiveTo), parsePeriod(parameter.effectiveFrom)) < 0) {
        violations.push({
          pack: packName,
          parameterId: id,
          message: `effectiveTo "${parameter.effectiveTo}" mendahului effectiveFrom "${parameter.effectiveFrom}"`,
        })
      }
    }

    const sorted = [...entries].sort((a, b) =>
      comparePeriods(parsePeriod(a.parameter.effectiveFrom), parsePeriod(b.parameter.effectiveFrom)),
    )

    const openEnded = sorted.filter((entry) => entry.parameter.effectiveTo === null)
    if (openEnded.length > 1) {
      violations.push({
        pack: packName,
        parameterId: id,
        message: `${openEnded.length} entri tanpa effectiveTo — hanya satu yang boleh terbuka`,
      })
    }

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1]
      const current = sorted[index]
      if (!previous || !current) continue

      if (previous.parameter.effectiveTo === null) {
        violations.push({
          pack: packName,
          parameterId: id,
          message:
            `entri berlaku sejak "${previous.parameter.effectiveFrom}" terbuka, ` +
            `tetapi ada entri berikutnya sejak "${current.parameter.effectiveFrom}"`,
        })
        continue
      }

      const expected = addMonths(parsePeriod(previous.parameter.effectiveTo), 1)
      const actual = parsePeriod(current.parameter.effectiveFrom)
      const order = comparePeriods(actual, expected)
      if (order < 0) {
        violations.push({
          pack: packName,
          parameterId: id,
          message: `periode tumpang tindih di "${current.parameter.effectiveFrom}"`,
        })
      } else if (order > 0) {
        violations.push({
          pack: packName,
          parameterId: id,
          message:
            `celah periode: tidak ada nilai untuk "${formatPeriod(expected)}" ` +
            `sampai sebelum "${current.parameter.effectiveFrom}"`,
        })
      }
    }
  }

  return violations
}
