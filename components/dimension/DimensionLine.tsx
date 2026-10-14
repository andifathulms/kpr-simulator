/**
 * A horizontal dimension, drawn the way a drawing sheet measures a span:
 * short extension ticks at both ends, arrowheads, and the measurement written
 * on the line with the ground knocked out behind it.
 *
 * A mortgage schedule is a structure built over time, and its two periods are
 * its two spans. The known one is drawn solid in annotation cyan; the assumed
 * one dashed in amber, because its length is known but nothing inside it is.
 */
export function DimensionLine({
  from,
  to,
  y,
  label,
  tone = 'computed',
}: {
  from: number
  to: number
  y: number
  label: string
  tone?: 'computed' | 'unknown'
}) {
  const arrow = 5
  const amber = tone === 'unknown'
  const stroke = amber ? 'stroke-unknown' : 'stroke-annotation'
  const fill = amber ? 'fill-unknown' : 'fill-annotation'
  // Too short to carry arrowheads and a label: draw the ticks only, and let
  // the label sit beside the span instead of on it.
  const roomy = to - from > 120

  return (
    <g>
      <line x1={from} x2={from} y1={y - 7} y2={y + 7} className={stroke} strokeWidth={1} />
      <line x1={to} x2={to} y1={y - 7} y2={y + 7} className={stroke} strokeWidth={1} />
      <line
        x1={from + 1}
        x2={to - 1}
        y1={y}
        y2={y}
        className={stroke}
        strokeWidth={1}
        strokeDasharray={amber ? '6 4' : undefined}
      />
      {roomy && (
        <>
          <polygon
            points={`${from + 1},${y} ${from + 1 + arrow * 2},${y - arrow} ${from + 1 + arrow * 2},${y + arrow}`}
            className={fill}
          />
          <polygon
            points={`${to - 1},${y} ${to - 1 - arrow * 2},${y - arrow} ${to - 1 - arrow * 2},${y + arrow}`}
            className={fill}
          />
        </>
      )}
      {/* The stroke in the card's own colour knocks the line out behind the
          lettering, so the measurement reads on the line itself. */}
      <text
        x={roomy ? (from + to) / 2 : to + 8}
        y={y + 5}
        textAnchor={roomy ? 'middle' : 'start'}
        paintOrder="stroke"
        strokeWidth={8}
        strokeLinejoin="round"
        className={`${fill} stroke-surface font-sheet font-medium`}
        style={{ fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        {label}
      </text>
    </g>
  )
}
