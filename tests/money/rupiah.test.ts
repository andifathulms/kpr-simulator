import { describe, expect, it } from 'vitest'
import {
  MoneyError,
  ZERO,
  add,
  applyRate,
  compare,
  fromExact,
  multiplyByInteger,
  rupiah,
  subtract,
  sum,
} from '@/lib/money/rupiah'
import { formatAmount, formatRate, formatRupiah } from '@/lib/money/format'

describe('rupiah', () => {
  it('refuses a fractional amount rather than silently rounding it', () => {
    expect(() => rupiah(1_000.5)).toThrow(MoneyError)
    expect(() => rupiah(Number.NaN)).toThrow(MoneyError)
    expect(() => rupiah(Number.POSITIVE_INFINITY)).toThrow(MoneyError)
  })

  it('adds and subtracts exactly', () => {
    expect(add(rupiah(166_000_000), rupiah(1))).toBe(166_000_001)
    expect(subtract(rupiah(166_000_000), rupiah(166_000_000))).toBe(ZERO)
    expect(sum([rupiah(1), rupiah(2), rupiah(3)])).toBe(6)
    expect(sum([])).toBe(ZERO)
  })

  it('orders amounts', () => {
    expect(compare(rupiah(1), rupiah(2))).toBe(-1)
    expect(compare(rupiah(2), rupiah(2))).toBe(0)
    expect(compare(rupiah(3), rupiah(2))).toBe(1)
  })

  it('refuses a fractional integer factor', () => {
    expect(multiplyByInteger(rupiah(1_000), 240)).toBe(240_000)
    expect(() => multiplyByInteger(rupiah(1_000), 1.5)).toThrow(MoneyError)
  })
})

describe('applyRate — the one crossing from float to integer', () => {
  it('reports the exact figure alongside the rounded one', () => {
    const result = applyRate(rupiah(150_000_000), 0.05 / 12, 'pembulatan-terdekat')
    expect(result.exact).toBeCloseTo(625_000, 6)
    expect(result.value).toBe(625_000)
    expect(result.convention).toBe('pembulatan-terdekat')
  })

  it('honours each named convention', () => {
    const amount = rupiah(1_000)
    expect(applyRate(amount, 0.1234, 'pembulatan-terdekat').value).toBe(123)
    expect(applyRate(amount, 0.1234, 'pembulatan-ke-bawah').value).toBe(123)
    expect(applyRate(amount, 0.1234, 'pembulatan-ke-atas').value).toBe(124)
    expect(applyRate(amount, 0.1256, 'pembulatan-terdekat').value).toBe(126)
  })

  it('rounds half away from zero, symmetrically for negatives', () => {
    expect(fromExact(2.5, 'pembulatan-terdekat').value).toBe(3)
    expect(fromExact(-2.5, 'pembulatan-terdekat').value).toBe(-3)
    expect(fromExact(-2.4, 'pembulatan-ke-atas').value).toBe(-3)
    expect(fromExact(-2.6, 'pembulatan-ke-bawah').value).toBe(-2)
  })
})

describe('display', () => {
  it('formats without fraction digits', () => {
    expect(formatRupiah(rupiah(1_234_567))).toBe('Rp1.234.567')
    expect(formatRupiah(rupiah(0))).toBe('Rp0')
    expect(formatAmount(rupiah(1_234_567))).toBe('1.234.567')
    expect(formatRate(0.115)).toBe('11,50%')
  })
})
