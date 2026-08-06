/**
 * Integer rupiah. No floating point in money, anywhere.
 *
 * Rates and ratios may be floats; amounts may not. The boundary between the
 * two is crossed in exactly one place — `applyRate` — and every crossing names
 * the rounding convention it used so the trace can show it.
 */

declare const RUPIAH: unique symbol

/** An amount in whole rupiah. Constructed only through `rupiah`. */
export type Rupiah = number & { readonly [RUPIAH]: 'rupiah' }

/**
 * Rounding conventions, named in Indonesian because that is how a bank's own
 * documentation names them. Every rounding in a schedule cites one of these.
 */
export type RoundingConvention =
  /** Round half away from zero. The usual convention for an angsuran. */
  | 'pembulatan-terdekat'
  /** Truncate towards zero. */
  | 'pembulatan-ke-bawah'
  /** Round away from zero. */
  | 'pembulatan-ke-atas'

export class MoneyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MoneyError'
  }
}

/** The only constructor. Rejects anything that is not a whole, finite number. */
export function rupiah(value: number): Rupiah {
  if (!Number.isFinite(value)) {
    throw new MoneyError(`Nilai rupiah harus berupa angka berhingga, diterima: ${value}`)
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(
      `Nilai rupiah harus bilangan bulat aman, diterima: ${value}. ` +
        'Gunakan applyRate untuk menyeberang dari rasio ke rupiah.',
    )
  }
  return value as Rupiah
}

export const ZERO: Rupiah = rupiah(0)

export function add(a: Rupiah, b: Rupiah): Rupiah {
  return rupiah(a + b)
}

export function subtract(a: Rupiah, b: Rupiah): Rupiah {
  return rupiah(a - b)
}

export function sum(values: readonly Rupiah[]): Rupiah {
  return values.reduce<Rupiah>((total, value) => add(total, value), ZERO)
}

export function negate(a: Rupiah): Rupiah {
  return rupiah(-a)
}

export function multiplyByInteger(a: Rupiah, factor: number): Rupiah {
  if (!Number.isSafeInteger(factor)) {
    throw new MoneyError(`Faktor harus bilangan bulat, diterima: ${factor}`)
  }
  return rupiah(a * factor)
}

export function compare(a: Rupiah, b: Rupiah): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0
}

export function isZero(a: Rupiah): boolean {
  return a === 0
}

export function max(a: Rupiah, b: Rupiah): Rupiah {
  return a >= b ? a : b
}

export function min(a: Rupiah, b: Rupiah): Rupiah {
  return a <= b ? a : b
}

function round(value: number, convention: RoundingConvention): number {
  switch (convention) {
    case 'pembulatan-terdekat':
      // Half away from zero — not Math.round, which is half towards +Infinity
      // and therefore asymmetric for negative amounts.
      return Math.sign(value) * Math.round(Math.abs(value))
    case 'pembulatan-ke-bawah':
      return Math.trunc(value)
    case 'pembulatan-ke-atas':
      return Math.sign(value) * Math.ceil(Math.abs(value))
    default: {
      const exhaustive: never = convention
      throw new MoneyError(`Konvensi pembulatan tidak dikenal: ${String(exhaustive)}`)
    }
  }
}

/**
 * The single, deliberate crossing from the float world (rates, ratios) into
 * the integer world (amounts). The caller must name the convention; there is
 * no default, because a silent default is how a calculator drifts from a bank
 * statement without anyone noticing.
 */
export function applyRate(
  amount: Rupiah,
  rate: number,
  convention: RoundingConvention,
): { readonly value: Rupiah; readonly exact: number; readonly convention: RoundingConvention } {
  if (!Number.isFinite(rate)) {
    throw new MoneyError(`Rasio harus berupa angka berhingga, diterima: ${rate}`)
  }
  const exact = amount * rate
  return { value: rupiah(round(exact, convention)), exact, convention }
}

/**
 * Rounds an already-computed exact amount. Used where the exact figure came
 * from an annuity formula rather than from a single rate multiplication.
 */
export function fromExact(
  exact: number,
  convention: RoundingConvention,
): { readonly value: Rupiah; readonly exact: number; readonly convention: RoundingConvention } {
  if (!Number.isFinite(exact)) {
    throw new MoneyError(`Nilai eksak harus berhingga, diterima: ${exact}`)
  }
  return { value: rupiah(round(exact, convention)), exact, convention }
}
