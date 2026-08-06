import { formatPeriod, parsePeriod, withinRange, type Period } from '@/lib/period/period'
import { rupiah, type Rupiah } from '@/lib/money/rupiah'
import { computed, unsupported, type Outcome } from './result'
import type { Parameter, RulePack } from './schema'

/**
 * Resolves a parameter for a period. Never extrapolates, never falls back to
 * the nearest year, never clamps: if no entry covers the period the answer is
 * a refusal naming the identifier and the period asked for.
 */

export interface Registry {
  readonly packs: readonly RulePack[]
}

export function registry(...packs: RulePack[]): Registry {
  return { packs }
}

export function allParameters(source: Registry): readonly Parameter[] {
  return source.packs.flatMap((pack) => pack.parameters)
}

export function resolve(source: Registry, id: string, at: Period): Outcome<Parameter> {
  const candidates = allParameters(source).filter((parameter) => parameter.id === id)

  if (candidates.length === 0) {
    return unsupported({
      kind: 'parameter',
      reference: id,
      detail: {
        id: `Parameter "${id}" tidak ada dalam paket aturan mana pun.`,
        en: `Parameter "${id}" is not present in any rule pack.`,
      },
    })
  }

  const applicable = candidates.find((parameter) =>
    withinRange(
      at,
      parsePeriod(parameter.effectiveFrom),
      parameter.effectiveTo === null ? null : parsePeriod(parameter.effectiveTo),
    ),
  )

  if (!applicable) {
    return unsupported({
      kind: 'parameter',
      reference: id,
      period: formatPeriod(at),
      detail: {
        id: `Tidak ada nilai "${id}" yang berlaku untuk periode ${formatPeriod(at)}. Aturan tidak diperpanjang ke periode terdekat.`,
        en: `No value of "${id}" is in force for ${formatPeriod(at)}. Rules are not extended to the nearest period.`,
      },
    })
  }

  return computed(applicable)
}

function typeMismatch(id: string, at: Period, expected: string, actual: string): Outcome<never> {
  return unsupported({
    kind: 'parameter',
    reference: id,
    period: formatPeriod(at),
    detail: {
      id: `Parameter "${id}" bertipe "${actual}", bukan "${expected}".`,
      en: `Parameter "${id}" is of kind "${actual}", not "${expected}".`,
    },
  })
}

export interface Cited<T> {
  readonly value: T
  readonly parameter: Parameter
}

export function resolveMoney(source: Registry, id: string, at: Period): Outcome<Cited<Rupiah>> {
  const found = resolve(source, id, at)
  if (found.type === 'unsupported') return found
  const { value } = found.value
  if (value.kind !== 'money') return typeMismatch(id, at, 'money', value.kind)
  return computed({ value: rupiah(value.amount), parameter: found.value })
}

export function resolveRate(source: Registry, id: string, at: Period): Outcome<Cited<number>> {
  const found = resolve(source, id, at)
  if (found.type === 'unsupported') return found
  const { value } = found.value
  if (value.kind !== 'rate' && value.kind !== 'ratio') {
    return typeMismatch(id, at, 'rate', value.kind)
  }
  return computed({ value: value.decimal, parameter: found.value })
}

export function resolveMonths(source: Registry, id: string, at: Period): Outcome<Cited<number>> {
  const found = resolve(source, id, at)
  if (found.type === 'unsupported') return found
  const { value } = found.value
  if (value.kind !== 'months') return typeMismatch(id, at, 'months', value.kind)
  return computed({ value: value.count, parameter: found.value })
}

export function resolveArea(source: Registry, id: string, at: Period): Outcome<Cited<number>> {
  const found = resolve(source, id, at)
  if (found.type === 'unsupported') return found
  const { value } = found.value
  if (value.kind !== 'area') return typeMismatch(id, at, 'area', value.kind)
  return computed({ value: value.squareMetres, parameter: found.value })
}
