/**
 * The mark — "Tebing". A flat line running along the fixed-rate period, then
 * the step where it ends and the rate goes wherever it goes. It is the thesis
 * of the whole app drawn in five segments, which is why it is worth putting
 * beside the name rather than a house or a rupiah sign.
 *
 * Drawn rather than loaded: no request, sharp at any size, and it takes the
 * app's colour tokens instead of the kit's hexes. Those tokens carry the same
 * rule the kit does — annotation blue for the known fixed period, `unknown`
 * amber for the floating period after it, and amber for nothing else.
 *
 * The dashed boundary marker is dropped below 96px in the kit; here the mark
 * only ever renders small, so `detailed` keeps that choice explicit.
 *
 * Always decorative: every place it appears, the words "KPR Simulator" are
 * next to it, and announcing the name twice helps nobody.
 */
export function Mark({
  size = 28,
  detailed = false,
  className = '',
}: {
  size?: number
  detailed?: boolean
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="97"
        rx="21"
        className="fill-recess stroke-annotation/30"
        strokeWidth="3"
      />
      {/* The fixed period: level, known, quoted by the bank. */}
      <line
        x1="14"
        y1="62"
        x2="52"
        y2="62"
        className="stroke-annotation"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Past the boundary: amber, because nobody publishes this. */}
      <path
        d="M52 62 L62 62 L70 34 L78 46 L86 22"
        fill="none"
        className="stroke-unknown"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {detailed && (
        <line
          x1="62"
          y1="20"
          x2="62"
          y2="74"
          className="stroke-print/70"
          strokeWidth="4"
          strokeDasharray="3 8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
