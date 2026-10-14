'use client'

import { useId, useState } from 'react'
import { formatAxisTick, formatRupiah } from '@/lib/money/format'
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
 * Both periods are dimensioned along the top, the way a drawing sheet
 * measures a span: the known one solid, the assumed one dashed amber. The
 * band the user asked to see is hatched, the app's mark for "not
 * determined". Pointing at the drawing reads one month off the schedule.
 *
 * Computes nothing. It is handed a Schedule and, optionally, a Band; the only
 * arithmetic here is geometry — pixels and a round axis scale.
 */

const WIDTH = 1000
const HEIGHT = 400
const PADDING = { top: 52, right: 16, bottom: 40, left: 72 }

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
  const intl = intlLocale(locale)
  const id = locale === 'id'
  const hatchId = `hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [hover, setHover] = useState<number | undefined>(undefined)

  const months = schedule.instalments.length
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  const highest = Math.max(
    ...schedule.instalments.map((instalment) => instalment.payment),
    ...(band?.rows.map((row) => row.high) ?? [0]),
    1,
  )
  const ticks = axisTicks(highest)
  const ceiling = ticks[ticks.length - 1] ?? highest

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
  const boundaryPeriod = boundary !== undefined ? schedule.instalments[boundary]?.period : undefined

  // The payment line in two pieces, so the stretch resting on an assumption
  // is drawn in amber and the known stretch is not.
  const known = schedule.instalments
    .map((instalment, index) => ({ instalment, index }))
    .filter(({ instalment }) => !instalment.assumed)
  const assumed = schedule.instalments
    .map((instalment, index) => ({ instalment, index }))
    .filter(({ instalment, index }) => instalment.assumed || index === (boundary ?? -1) - 1)
  const pointsOf = (rows: typeof known) =>
    rows.map(({ instalment, index }) => `${x(index).toFixed(2)},${y(instalment.payment).toFixed(2)}`).join(' ')

  const focused = hover !== undefined ? schedule.instalments[hover] : undefined
  const focusedBand = hover !== undefined ? band?.rows[hover] : undefined

  const indexAt = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * WIDTH
    const raw = Math.round(((px - PADDING.left) / plotWidth) * (months - 1))
    return Math.min(Math.max(raw, 0), months - 1)
  }

  return (
    <figure className="sheet-panel rounded-xl p-4 sm:p-5">
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-annotation"
          role="img"
          tabIndex={0}
          aria-label={
            id
              ? `Elevasi jadwal angsuran ${months} bulan, pokok dan bunga bertumpuk. Geser atau tekan panah kiri dan kanan untuk membaca satu bulan; tabel angsuran memuat setiap bulan.`
              : `Elevation of a ${months}-month schedule, principal and interest stacked. Point, or press the left and right arrows, to read one month; the amortisation table lists every month.`
          }
          onPointerMove={(event) =>
            setHover(indexAt(event.clientX, event.currentTarget.getBoundingClientRect()))
          }
          onPointerLeave={() => setHover(undefined)}
          onFocus={() => setHover((current) => current ?? boundary ?? 0)}
          onBlur={() => setHover(undefined)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            event.preventDefault()
            const stepBy = event.shiftKey ? 12 : 1
            setHover((current) => {
              const from = current ?? 0
              const next = event.key === 'ArrowRight' ? from + stepBy : from - stepBy
              return Math.min(Math.max(next, 0), months - 1)
            })
          }}
        >
          <defs>
            <pattern
              id={hatchId}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="8" height="8" className="fill-unknown/10" />
              <line x1="0" y1="0" x2="0" y2="8" className="stroke-unknown/60" strokeWidth="2" />
            </pattern>
          </defs>

          {/* Ruled ground at round values, labelled on the left. */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? 'stroke-print/60' : 'stroke-annotation/15'}
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 10}
                y={y(tick) + 4}
                textAnchor="end"
                className="figure fill-muted"
                style={{ fontSize: 16 }}
              >
                {formatAxisTick(rupiah(Math.round(tick)), intl)}
              </text>
            </g>
          ))}

          {/* The band opens beyond the boundary. Hatched, never three curves;
              its edges ease when the spread changes — PRD §8's one motion. */}
          {bandArea && (
            <path
              d={bandArea}
              fill={`url(#${hatchId})`}
              className="stroke-unknown/70"
              strokeWidth={1}
              style={{ transition: 'd 400ms ease-out' }}
            />
          )}

          {/* Payment envelope, then interest beneath it: the space between the
              two is principal, and it is the space that grows. */}
          <path d={paymentArea} className="fill-print/20" />
          <path d={interestArea} className="fill-annotation/45" />

          {known.length > 1 && (
            <polyline points={pointsOf(known)} className="fill-none stroke-print" strokeWidth={2} />
          )}
          {assumed.length > 1 && (
            <polyline points={pointsOf(assumed)} className="fill-none stroke-unknown" strokeWidth={2} />
          )}

          {/* The two spans, measured. */}
          {boundaryX !== undefined && boundary !== undefined ? (
            <>
              <line
                x1={boundaryX}
                x2={boundaryX}
                y1={14}
                y2={y(0)}
                className="stroke-annotation/70"
                strokeWidth={1}
                strokeDasharray="3 4"
              />
              <DimensionLine
                from={x(0)}
                to={boundaryX}
                y={24}
                label={id ? `${boundary} bulan · tetap` : `${boundary} months · fixed`}
              />
              <DimensionLine
                from={boundaryX}
                to={x(months - 1)}
                y={24}
                tone="unknown"
                label={
                  id
                    ? `${months - boundary} bulan · mengambang`
                    : `${months - boundary} months · floating`
                }
              />
            </>
          ) : (
            <DimensionLine
              from={x(0)}
              to={x(months - 1)}
              y={24}
              label={id ? `${months} bulan` : `${months} months`}
            />
          )}

          {/* Period labels under the ground line. */}
          <g className="figure fill-muted" style={{ fontSize: 16 }}>
            {firstPeriod && (
              <text x={x(0)} y={HEIGHT - 12} textAnchor="start">
                {formatPeriod(firstPeriod)}
              </text>
            )}
            {boundaryPeriod && boundaryX !== undefined && (
              <text x={boundaryX} y={HEIGHT - 12} textAnchor="middle" className="fill-annotation">
                {formatPeriod(boundaryPeriod)}
              </text>
            )}
            {lastPeriod && (
              <text x={x(months - 1)} y={HEIGHT - 12} textAnchor="end">
                {formatPeriod(lastPeriod)}
              </text>
            )}
          </g>

          {/* The reading: one month, under the pointer or the arrow keys. */}
          {focused && hover !== undefined && (
            <g aria-hidden>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={34}
                y2={y(0)}
                className="stroke-print/80"
                strokeWidth={1}
              />
              <circle
                cx={x(hover)}
                cy={y(focused.payment)}
                r={5}
                className={`${focused.assumed ? 'fill-unknown' : 'fill-print'} stroke-surface`}
                strokeWidth={2.5}
              />
            </g>
          )}
        </svg>

        {focused && hover !== undefined && (
          <div
            aria-hidden
            className={`pointer-events-none absolute top-[14%] w-56 rounded-lg border bg-blueprint/95 px-3 py-2 text-caption shadow-[0_12px_24px_-12px_rgb(0_0_0/0.8)] ${
              focused.assumed ? 'border-unknown/60' : 'border-annotation/50'
            }`}
            style={
              x(hover) / WIDTH > 0.6
                ? { right: `${100 - (x(hover) / WIDTH) * 100 + 1.5}%` }
                : { left: `${(x(hover) / WIDTH) * 100 + 1.5}%` }
            }
          >
            <p className="figure text-micro text-muted">
              {id ? 'Bulan' : 'Month'} {focused.index} · {formatPeriod(focused.period)}
            </p>
            <Reading
              label={t.table.angsuran}
              value={formatRupiah(focused.payment, intl)}
              amber={focused.assumed}
              strong
            />
            <Reading label={t.table.bunga} value={formatRupiah(focused.interest, intl)} amber={focused.assumed} />
            <Reading label={t.table.pokok} value={formatRupiah(focused.principal, intl)} amber={focused.assumed} />
            <Reading
              label={t.table.saldoAkhir}
              value={formatRupiah(focused.closingBalance, intl)}
              amber={focused.assumed}
            />
            {focusedBand && focusedBand.assumed && (
              <p className="mt-1 border-t border-unknown/30 pt-1 text-micro text-unknown">
                {id ? 'Pita: ' : 'Band: '}
                <span className="figure">
                  {formatRupiah(focusedBand.low, intl)} – {formatRupiah(focusedBand.high, intl)}
                </span>
              </p>
            )}
            {focused.assumed && (
              <p className="mt-1 text-micro text-unknown">{t.floating.short}</p>
            )}
          </div>
        )}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption">
        <Key className="bg-annotation/45" label={t.table.bunga} />
        <Key className="bg-print/20" label={t.table.pokok} />
        {boundary !== undefined && (
          <Key className="border-t-2 border-unknown" label={id ? 'Angsuran, asumsi' : 'Instalment, assumed'} />
        )}
        {band && <Key className="hatch-unknown border border-unknown" label={id ? 'Pita yang Anda pilih' : 'The band you chose'} />}
        <span className="ml-auto hidden text-muted sm:inline">
          {id ? 'Arahkan ke grafik untuk membaca satu bulan.' : 'Point at the drawing to read one month.'}
        </span>
      </figcaption>
    </figure>
  )
}

function Reading({
  label,
  value,
  amber,
  strong = false,
}: {
  label: string
  value: string
  amber: boolean
  strong?: boolean
}) {
  return (
    <p className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`figure ${amber ? 'text-unknown' : 'text-print'} ${strong ? 'text-body' : ''}`}>
        {value}
      </span>
    </p>
  )
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-3 w-6 rounded-sm ${className}`} aria-hidden />
      <span className="text-muted">{label}</span>
    </span>
  )
}

/**
 * Round tick values covering the highest amount: four or five steps of 1, 2,
 * 2.5 or 5 times a power of ten. Geometry for the axis, not money — the
 * ticks are where the ruled lines go, and they are labelled as such.
 */
function axisTicks(highest: number): number[] {
  const rough = highest / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ??
    10 * magnitude
  const count = Math.ceil(highest / step)
  return Array.from({ length: count + 1 }, (_, index) => index * step)
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
