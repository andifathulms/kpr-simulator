/**
 * The fixed-period boundary, drawn as a proper dimension line: extension
 * lines, arrowheads, and the measurement labelled. A mortgage schedule is a
 * structure built over time, and the moment its terms change deserves to be
 * drawn the way a drawing sheet marks a change in section.
 */
export function DimensionLine({
  x,
  top,
  bottom,
  label,
  extendTo,
}: {
  x: number
  top: number
  bottom: number
  label: string
  /** Right-hand extent of the horizontal measure, if one is drawn. */
  extendTo?: number
}) {
  const arrow = 5
  return (
    <g>
      {/* Extension line through the full height of the elevation. */}
      <line
        x1={x}
        x2={x}
        y1={top}
        y2={bottom}
        className="stroke-unknown"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {extendTo !== undefined && (
        <>
          <line x1={x} x2={extendTo} y1={top} y2={top} className="stroke-unknown" strokeWidth={1} />
          <polygon
            points={`${x},${top} ${x + arrow * 2},${top - arrow} ${x + arrow * 2},${top + arrow}`}
            className="fill-unknown"
          />
          <polygon
            points={`${extendTo},${top} ${extendTo - arrow * 2},${top - arrow} ${extendTo - arrow * 2},${top + arrow}`}
            className="fill-unknown"
          />
        </>
      )}

      <text
        x={x + 8}
        y={top + 16}
        className="fill-unknown"
        style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        {label}
      </text>
    </g>
  )
}
