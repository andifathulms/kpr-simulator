import type { Locale } from '@/lib/i18n/locales'

/**
 * The thesis, drawn: a level instalment through the fixed period, the boundary
 * where the quote runs out, and everything after it opening into a fan.
 *
 * It carries no numerals at all — no rupiah figure, no rate, no year. That is
 * deliberate and it is what makes the diagram safe on the landing page: there
 * is nothing here a visitor could mistake for their own numbers or for data
 * about a bank. It is a shape, and the shape is the argument.
 *
 * The real thing, computed from a user's own figures, is the schedule
 * elevation on `hitung`. This is its silhouette.
 */
export function FixedFloatingDiagram({ locale }: { locale: Locale }) {
  const id = locale === 'id'

  return (
    <figure className="sheet-panel px-5 py-4">
      <svg
        viewBox="0 0 400 210"
        className="h-auto w-full"
        role="img"
        aria-label={
          id
            ? 'Diagram: angsuran mendatar selama masa bunga tetap, lalu melebar menjadi banyak kemungkinan setelah masa itu berakhir.'
            : 'Diagram: the instalment runs level through the fixed period, then opens into a spread of possibilities once that period ends.'
        }
      >
        {/* Ruled ground, in the register of a drawing sheet. */}
        {[60, 100, 140].map((y) => (
          <line key={y} x1="24" x2="392" y1={y} y2={y} className="stroke-annotation/20" />
        ))}
        <line x1="24" x2="392" y1="176" y2="176" className="stroke-print/50" />

        {/* The fan of outcomes, shaded rather than drawn as three curves:
            three crisp lines would claim to know three specific futures. */}
        <path d="M186 140 L392 44 L392 150 Z" className="fill-unknown/20" />
        <path
          d="M186 140 L392 44"
          className="stroke-unknown"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M186 140 L392 104"
          className="stroke-unknown/70"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinecap="round"
        />
        <path
          d="M186 140 L392 150"
          className="stroke-unknown/70"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeLinecap="round"
        />

        {/* The known part: level, quoted, and short. */}
        <line
          x1="24"
          x2="186"
          y1="140"
          y2="140"
          className="stroke-annotation"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* The boundary the whole app is about. */}
        <line
          x1="186"
          x2="186"
          y1="30"
          y2="176"
          className="stroke-print/70"
          strokeWidth="2"
          strokeDasharray="3 7"
        />

        <text x="24" y="164" className="fill-annotation font-sheet text-[13px] uppercase tracking-[0.14em]">
          {id ? 'Bunga tetap' : 'Fixed rate'}
        </text>
        <text x="24" y="130" className="fill-print font-prose text-[13px]">
          {id ? '2–3 tahun' : '2–3 years'}
        </text>
        <text x="200" y="34" className="fill-unknown font-sheet text-[13px] uppercase tracking-[0.14em]">
          {id ? 'Setelah itu — ?' : 'After that — ?'}
        </text>
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 text-caption">
        <span className="text-muted">
          {id ? 'Angsuran per bulan, sepanjang tenor' : 'Monthly instalment, across the term'}
        </span>
        <span className="text-unknown">
          {id ? 'Kuning = tidak diketahui' : 'Amber = not known'}
        </span>
      </figcaption>
    </figure>
  )
}
