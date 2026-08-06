/**
 * Inputs live in the URL hash, never the query string.
 *
 * A fragment is not sent to the server and never reaches a server log, an
 * access log, or a referrer header. Income and loan figures are exactly the
 * kind of thing that must not leak that way, and a static host offers no way
 * to scrub a log after the fact. There is no analytics on input values and no
 * runtime network request of any kind.
 */

export type HashState = Record<string, string | number | boolean>

export function encodeHash(state: HashState): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(state)) {
    params.set(key, String(value))
  }
  return params.toString()
}

export function decodeHash(hash: string): Record<string, string> {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const state: Record<string, string> = {}
  for (const [key, value] of params.entries()) state[key] = value
  return state
}

export function readNumber(
  state: Record<string, string>,
  key: string,
  fallback: number,
): number {
  const raw = state[key]
  if (raw === undefined) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function readString<T extends string>(
  state: Record<string, string>,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = state[key]
  return raw !== undefined && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
}
