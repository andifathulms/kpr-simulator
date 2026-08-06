/**
 * Every engine entry point returns one of these. There is no third branch and
 * no exception path for a missing rule: the app refuses rather than guesses,
 * and the refusal names exactly what is missing so the interface can say so.
 */

export interface Gap {
  readonly kind: 'parameter' | 'rule-pack' | 'input'
  /** The parameter identifier, pack name, or input name that is absent. */
  readonly reference: string
  /** The period asked for, when the gap is a period the packs do not cover. */
  readonly period?: string
  readonly detail: { readonly id: string; readonly en: string }
}

export interface Computed<T> {
  readonly type: 'computed'
  readonly value: T
}

export interface Unsupported {
  readonly type: 'unsupported'
  readonly gaps: readonly Gap[]
}

export type Outcome<T> = Computed<T> | Unsupported

export function computed<T>(value: T): Computed<T> {
  return { type: 'computed', value }
}

export function unsupported(...gaps: Gap[]): Unsupported {
  return { type: 'unsupported', gaps }
}

/** Collapses several outcomes, keeping every gap rather than the first. */
export function allComputed<T extends readonly unknown[]>(
  outcomes: { [K in keyof T]: Outcome<T[K]> },
): Outcome<T> {
  const gaps = outcomes.flatMap((outcome) =>
    outcome.type === 'unsupported' ? [...outcome.gaps] : [],
  )
  if (gaps.length > 0) return { type: 'unsupported', gaps }
  return computed(outcomes.map((outcome) => (outcome as Computed<unknown>).value) as unknown as T)
}
