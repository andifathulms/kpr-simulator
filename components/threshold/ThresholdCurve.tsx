import { formatAxisTick, formatRate, formatRupiah } from '@/lib/money/format'
import { rupiah, type Rupiah } from '@/lib/money/rupiah'
import type { CurvePoint } from '@/lib/rate/curve'
import { intlLocale } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'

/**
 * The threshold, drawn as the point where two lines cross: the instalment
 * after the fixed period as the floating rate rises, and the limit the user
 * set. The solver's answer is where they meet.
 *
 * The curve is amber because every rate along it is hypothetical — the
 * consequence is computed, the rate is not known. The limit and its crossing
 * are threshold red, and nothing else here is. No zone is marked safe.
 *
 * Renders only. The points come from lib/rate/curve; the crossing from the
 * solver. The one motion PRD §8 allows lives here: when the limit moves, the
 * marker slides along the curve to the new crossing.
 */

const WIDTH = 1000
const HEIGHT = 380
const PADDING = { top: 24, right: 20, bottom: 50, left: 72 }

export function ThresholdCurve({
  points,
  limit,
  thresholdRate,
  fixedRate,
  locale,
}: {
  points: readonly CurvePoint[]
  limit: Rupiah
  thresholdRate: number
  fixedRate: number
  locale: Locale
}) {
  const intl = intlLocale(locale)
  const id = locale === 'id'
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return null

  const maxRate = last.annualRate
  const ticks = axisTicks(Math.max(last.payment, limit))
  const ceiling = ticks[ticks.length - 1] ?? last.payment
  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  const x = (rate: number) => PADDING.left + (rate / maxRate) * plotWidth
  const y = (amount: number) => PADDING.top + plotHeight - (amount / ceiling) * plotHeight

  const rateTicks = rateAxisTicks(maxRate)
  const tx = x(thresholdRate)
  const ty = y(limit)
  const line = points.map((point) => `${x(point.annualRate).toFixed(2)},${y(point.payment).toFixed(2)}`).join(' ')

  return (
    <figure className="sheet-panel rounded-xl p-4 sm:p-5">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          id
            ? `Angsuran setelah masa tetap naik seiring bunga mengambang dan melewati batas ${formatRupiah(limit, intl)} pada ${formatRate(thresholdRate, intl)}.`
            : `The instalment after the fixed period rises with the floating rate and passes the limit of ${formatRupiah(limit, intl)} at ${formatRate(thresholdRate, intl)}.`
        }
      >
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

        {rateTicks.map((rate) => (
          <text
            key={rate}
            x={x(rate)}
            y={HEIGHT - 18}
            textAnchor={rate === 0 ? 'start' : rate === maxRate ? 'end' : 'middle'}
            className="figure fill-muted"
            style={{ fontSize: 16 }}
          >
            {formatRate(rate, intl, 0)}
          </text>
        ))}

        {/* Past the limit: tinted, and labelled in words. */}
        <rect
          x={tx}
          y={PADDING.top}
          width={Math.max(WIDTH - PADDING.right - tx, 0)}
          height={Math.max(ty - PADDING.top, 0)}
          className="fill-threshold/[0.07]"
          style={{ transition: 'x 400ms ease-out, y 400ms ease-out, width 400ms ease-out, height 400ms ease-out' }}
        />
        <text
          x={WIDTH - PADDING.right - 8}
          y={PADDING.top + 16}
          textAnchor="end"
          className="fill-threshold font-prose"
          style={{ fontSize: 16 }}
        >
          {id ? 'melewati batas Anda' : 'past your limit'}
        </text>

        {/* The fixed rate the bank quoted, as a reference tick on the axis. */}
        <line x1={x(fixedRate)} x2={x(fixedRate)} y1={y(0) - 8} y2={y(0) + 8} className="stroke-print" strokeWidth={1.5} />
        <text x={x(fixedRate)} y={y(0) - 14} textAnchor="middle" className="fill-muted font-prose" style={{ fontSize: 16 }}>
          {id ? `bunga tetap ${formatRate(fixedRate, intl)}` : `fixed rate ${formatRate(fixedRate, intl)}`}
        </text>

        <polyline points={line} className="fill-none stroke-unknown" strokeWidth={2.5} strokeLinejoin="round" />

        {/* The limit — moved as a group, so it slides with the marker. */}
        <g style={{ transform: `translate(0px, ${ty}px)`, transition: 'transform 400ms ease-out' }}>
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={0}
            y2={0}
            className="stroke-threshold"
            strokeWidth={1.5}
            strokeDasharray="7 5"
          />
          <text
            x={PADDING.left + 8}
            y={-8}
            paintOrder="stroke"
            strokeWidth={6}
            className="figure fill-threshold stroke-surface"
            style={{ fontSize: 16 }}
          >
            {id ? 'batas ' : 'limit '}
            {formatRupiah(limit, intl)}
          </text>
        </g>

        {/* The crossing. It slides when the limit or the loan changes. */}
        <g style={{ transform: `translate(${tx}px, ${ty}px)`, transition: 'transform 400ms ease-out' }}>
          <line x1={0} x2={0} y1={0} y2={y(0) - ty} className="stroke-threshold" strokeWidth={1.5} />
          <circle r={7} className="fill-threshold stroke-surface" strokeWidth={3} />
        </g>
        <g style={{ transform: `translate(${tx}px, ${y(0) + 4}px)`, transition: 'transform 400ms ease-out' }}>
          <rect x={-48} y={0} width={96} height={26} rx={4} className="fill-threshold" />
          <text y={19} textAnchor="middle" className="figure fill-blueprint" style={{ fontSize: 16 }}>
            {formatRate(thresholdRate, intl)}
          </text>
        </g>
      </svg>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-0 w-6 border-t-2 border-unknown" />
          {id ? 'Angsuran setelah masa tetap, pada bunga di sumbu bawah' : 'Instalment after the fixed period, at the rate below'}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-0 w-6 border-t-2 border-dashed border-threshold" />
          {id ? 'Batas yang Anda tetapkan' : 'The limit you set'}
        </span>
      </figcaption>
    </figure>
  )
}

/** Round amount ticks — axis geometry, as on the elevation. */
function axisTicks(highest: number): number[] {
  const rough = highest / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ??
    10 * magnitude
  const count = Math.ceil(highest / step)
  return Array.from({ length: count + 1 }, (_, index) => index * step)
}

/** Every 5 points of rate up to the end of the sampled range. */
function rateAxisTicks(maxRate: number): number[] {
  const steps = Math.round(maxRate / 0.05)
  return Array.from({ length: steps + 1 }, (_, index) => Number((index * 0.05).toFixed(4)))
}
