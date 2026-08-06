import { formatRupiah } from '@/lib/money/format'
import { rupiah } from '@/lib/money/rupiah'
import { formatPeriod } from '@/lib/period/period'
import type { Schedule } from '@/lib/amortise/types'
import type { Band } from '@/lib/scenario/band'
import { dictionary, intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { DimensionLine } from '@/components/dimension/DimensionLine'

/**
 * The schedule as an elevation: principal and interest stacked, month by
 * month, across the full term. Two things become visible that most borrowers
 * have never seen — how overwhelmingly early payments are interest, and the
 * step where the fixed period ends.
 *
 * Computes nothing. It is handed a Schedule and, optionally, a Band.
 */

const WIDTH = 1000
const HEIGHT = 320
const PADDING = { top: 28, right: 16, bottom: 34, left: 16 }

export function ScheduleElevation({
  schedule,
  band,
  locale,
  boundaryMonth,
}: {
  schedule: Schedule
  band?: Band
  locale: Locale
  boundaryMonth?: number
}) {
  const t = dictionary(locale)
  const months = schedule.instalments.length
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  const ceiling = Math.max(
    ...schedule.instalments.map((instalment) => instalment.payment),
    ...(band?.rows.map((row) => row.high) ?? [0]),
  )

  const x = (index: number) => PADDING.left + (index / Math.max(months - 1, 1)) * plotWidth
  const y = (amount: number) => PADDING.top + plotHeight - (amount / ceiling) * plotHeight

  const interestArea = areaPath(
    schedule.instalments.map((instalment, index) => [x(index), y(instalment.interest)] as const),
    y(0),
  )
  const paymentArea = areaPath(
    schedule.instalments.map((instalment, index) => [x(index), y(instalment.payment)] as const),
    y(0),
  )

  const bandArea =
    band &&
    envelopePath(
      band.rows.map((row, index) => [x(index), y(row.high)] as const),
      band.rows.map((row, index) => [x(index), y(row.low)] as const),
    )

  const boundary = boundaryMonth ?? band?.boundaryMonth
  const boundaryX = boundary !== undefined ? x(boundary) : undefined
  const firstPeriod = schedule.instalments[0]?.period
  const lastPeriod = schedule.instalments[months - 1]?.period

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          locale === 'id'
            ? `Elevasi jadwal angsuran ${months} bulan, pokok dan bunga bertumpuk.`
            : `Elevation of a ${months}-month schedule, principal and interest stacked.`
        }
      >
        {/* Ruled ground, in the register of a drawing sheet. */}
        {[0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={y(ceiling * fraction)}
            y2={y(ceiling * fraction)}
            className="stroke-annotation/20"
            strokeWidth={1}
          />
        ))}

        {/* The band opens beyond the boundary. Shaded, never three curves. */}
        {bandArea && <path d={bandArea} className="fill-unknown/25" />}

        {/* Payment envelope, then interest beneath it: the space between the
            two is principal, and it is the space that grows. */}
        <path d={paymentArea} className="fill-print/15" />
        <path d={interestArea} className="fill-annotation/45" />

        <polyline
          points={schedule.instalments
            .map((instalment, index) => `${x(index)},${y(instalment.payment)}`)
            .join(' ')}
          className="fill-none stroke-print"
          strokeWidth={1.5}
        />

        {boundaryX !== undefined && (
          <DimensionLine
            x={boundaryX}
            top={PADDING.top - 14}
            bottom={HEIGHT - PADDING.bottom}
            label={
              locale === 'id'
                ? `Masa tetap berakhir — bulan ke-${boundary}`
                : `Fixed period ends — month ${boundary}`
            }
            extendTo={WIDTH - PADDING.right}
          />
        )}

        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={y(0)}
          y2={y(0)}
          className="stroke-print/60"
          strokeWidth={1}
        />
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs">
        <span className="figure text-annotation">
          {firstPeriod ? formatPeriod(firstPeriod) : ''} — {lastPeriod ? formatPeriod(lastPeriod) : ''}
        </span>
        <span className="flex flex-wrap items-center gap-4">
          <Key className="bg-annotation/45" label={t.table.bunga} />
          <Key className="bg-print/15" label={t.table.pokok} />
          {band && <Key className="bg-unknown/40" label={t.floating.short} />}
        </span>
        <span className="figure text-print/70">
          {t.table.angsuran} ≤ {formatRupiah(asRupiah(ceiling), intlLocale(locale))}
        </span>
      </figcaption>
    </figure>
  )
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-2 w-6 ${className}`} aria-hidden />
      <span className="text-print/75">{label}</span>
    </span>
  )
}

function areaPath(points: readonly (readonly [number, number])[], baseline: number): string {
  if (points.length === 0) return ''
  const [first] = points
  const last = points[points.length - 1]
  if (!first || !last) return ''
  const line = points.map(([px, py]) => `L${px.toFixed(2)},${py.toFixed(2)}`).join(' ')
  return `M${first[0].toFixed(2)},${baseline.toFixed(2)} ${line} L${last[0].toFixed(2)},${baseline.toFixed(2)} Z`
}

function envelopePath(
  upper: readonly (readonly [number, number])[],
  lower: readonly (readonly [number, number])[],
): string {
  if (upper.length === 0 || lower.length === 0) return ''
  const top = upper.map(([px, py], index) =>
    `${index === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`,
  )
  const bottom = [...lower]
    .reverse()
    .map(([px, py]) => `L${px.toFixed(2)},${py.toFixed(2)}`)
  return `${top.join(' ')} ${bottom.join(' ')} Z`
}

/**
 * Chart geometry works in plain numbers — pixels are not money. The axis
 * label crosses back into the money type explicitly, in one place.
 */
function asRupiah(value: number) {
  return rupiah(Math.round(value))
}
