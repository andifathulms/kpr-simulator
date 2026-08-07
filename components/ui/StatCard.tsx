/**
 * A single figure with its label — the headline numbers on every view. One
 * component so that a rupiah figure looks identical wherever it appears, and
 * so the two reserved colours are applied in exactly one place.
 *
 * `tone` carries meaning, never decoration:
 *   unknown   — the value rests on an assumption the user supplied.
 *   threshold — the value is the affordability limit or its breach.
 *
 * Colour never carries the distinction alone: a toned card also states in
 * words what it is, which is what keeps a greyscale print honest.
 */
export type Tone = 'computed' | 'unknown' | 'threshold'

const TONES: Record<Tone, { readonly box: string; readonly label: string; readonly value: string }> =
  {
    computed: {
      box: 'border-annotation/25 bg-recess',
      label: 'text-annotation',
      value: 'text-print',
    },
    unknown: {
      box: 'border-unknown/60 bg-unknown/[0.08]',
      label: 'text-unknown',
      value: 'text-unknown',
    },
    threshold: {
      box: 'border-threshold/60 bg-threshold/[0.08]',
      label: 'text-threshold',
      value: 'text-threshold',
    },
  }

export function StatCard({
  label,
  value,
  note,
  tag,
  tone = 'computed',
  size = 'md',
}: {
  label: string
  value: string
  note?: string
  /** The word that says what the figure is — Computed, Assumption, a limit. */
  tag?: string
  tone?: Tone
  size?: 'md' | 'lg'
}) {
  const palette = TONES[tone]
  return (
    <div className={`flex flex-col justify-between border px-4 py-3 ${palette.box}`}>
      <p className={`sheet-label text-caption ${palette.label}`}>{label}</p>
      <p
        className={`figure mt-2 ${size === 'lg' ? 'text-title' : 'text-subhead'} ${palette.value}`}
      >
        {value}
      </p>
      {(note || tag) && (
        <p className={`mt-2 text-caption ${tone === 'computed' ? 'text-muted' : palette.label}`}>
          {tag && <span className="sheet-label mr-2">{tag}</span>}
          {note}
        </p>
      )}
    </div>
  )
}
