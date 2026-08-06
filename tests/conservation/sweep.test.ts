import { describe, expect, it } from 'vitest'
import { rupiah } from '@/lib/money/rupiah'
import { period } from '@/lib/period/period'
import { buildSchedule } from '@/lib/amortise/schedule'
import { buildFlatSchedule } from '@/lib/amortise/flat'
import { checkConservation } from '@/lib/amortise/conservation'
import type { Schedule } from '@/lib/amortise/types'

/**
 * Conservation across the corpus — every tenor, rate, and principal the app
 * can realistically be handed, in both conventions, including the fixed-plus-
 * floating shape the project exists for.
 */

const PRINCIPALS = [
  1_000_000, 99_999_999, 150_000_000, 164_340_000, 300_000_000, 1_500_000_000, 9_999_999_999,
].map(rupiah)

const RATES = [0, 0.0275, 0.05, 0.0725, 0.095, 0.115, 0.1337, 0.21]

const TERMS = [1, 2, 12, 13, 60, 120, 180, 240, 300, 360]

const START = period(2026, 9)

function expectConserved(schedule: Schedule): void {
  const report = checkConservation(schedule)
  expect(report.failures).toEqual([])
}

describe('conservation — bunga efektif', () => {
  for (const principal of PRINCIPALS) {
    for (const annualRate of RATES) {
      for (const termMonths of TERMS) {
        it(`plafon ${principal}, ${annualRate * 100}%, ${termMonths} bulan`, () => {
          const schedule = buildSchedule({
            principal,
            start: START,
            termMonths,
            rounding: 'pembulatan-terdekat',
            segments: [{ months: termMonths, annualRate, phase: 'tetap', assumed: false }],
          })
          expectConserved(schedule)
        })
      }
    }
  }
})

describe('conservation — bunga flat', () => {
  for (const principal of PRINCIPALS) {
    for (const annualRate of RATES) {
      for (const termMonths of TERMS) {
        it(`plafon ${principal}, flat ${annualRate * 100}%, ${termMonths} bulan`, () => {
          expectConserved(
            buildFlatSchedule({
              principal,
              start: START,
              termMonths,
              annualRate,
              assumed: false,
              rounding: 'pembulatan-terdekat',
            }),
          )
        })
      }
    }
  }
})

describe('conservation — masa tetap lalu mengambang', () => {
  const FIXED_YEARS = [1, 2, 3, 5]
  const FLOATING_RATES = [0.05, 0.09, 0.115, 0.145, 0.18]

  for (const fixedYears of FIXED_YEARS) {
    for (const floatingRate of FLOATING_RATES) {
      for (const termMonths of [120, 180, 240]) {
        it(`tetap ${fixedYears} tahun lalu ${floatingRate * 100}%, ${termMonths} bulan`, () => {
          const fixedMonths = fixedYears * 12
          const schedule = buildSchedule({
            principal: rupiah(750_000_000),
            start: START,
            termMonths,
            rounding: 'pembulatan-terdekat',
            segments: [
              { months: fixedMonths, annualRate: 0.0325, phase: 'tetap', assumed: false },
              {
                months: termMonths - fixedMonths,
                annualRate: floatingRate,
                phase: 'mengambang',
                assumed: true,
              },
            ],
          })
          expectConserved(schedule)

          // The recomputation at the boundary is the point of the project:
          // the instalment must actually change when the rate does.
          const beforeBoundary = schedule.instalments[fixedMonths - 1]
          const afterBoundary = schedule.instalments[fixedMonths]
          expect(beforeBoundary?.phase).toBe('tetap')
          expect(afterBoundary?.phase).toBe('mengambang')
          expect(afterBoundary?.assumed).toBe(true)
          expect(afterBoundary?.payment).not.toBe(beforeBoundary?.payment)
        })
      }
    }
  }
})

describe('conservation — every rounding convention', () => {
  for (const rounding of ['pembulatan-terdekat', 'pembulatan-ke-bawah', 'pembulatan-ke-atas'] as const) {
    it(`efektif dengan ${rounding}`, () => {
      expectConserved(
        buildSchedule({
          principal: rupiah(164_340_000),
          start: START,
          termMonths: 240,
          rounding,
          segments: [{ months: 240, annualRate: 0.05, phase: 'tetap', assumed: false }],
        }),
      )
    })

    it(`flat dengan ${rounding}`, () => {
      expectConserved(
        buildFlatSchedule({
          principal: rupiah(164_340_000),
          start: START,
          termMonths: 240,
          annualRate: 0.05,
          assumed: false,
          rounding,
        }),
      )
    })
  }
})
