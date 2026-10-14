/**
 * What the results column shows before there is anything to compute: the
 * outline of the drawing that will appear, what is still needed to draw it,
 * and the worked example for someone without an offer letter yet.
 *
 * The outline carries no numerals and no scale. A figure here, before the
 * user has typed one, is exactly the pre-filled rate the app refuses to show;
 * a dashed silhouette is not something anyone can mistake for data.
 */
export function EmptySheet({
  title,
  note,
  needs,
  progressLabel,
  outline,
  children,
}: {
  title: string
  note: string
  needs: readonly { readonly label: string; readonly done: boolean }[]
  /** "1 dari 3 sudah diisi" — said in words as well as drawn. */
  progressLabel: string
  outline: { readonly known: string; readonly unknown: string }
  /** The worked-example prompt and button. */
  children?: React.ReactNode
}) {
  const done = needs.filter((need) => need.done).length

  return (
    <section className="space-y-6 rounded-xl border border-annotation/25 bg-surface p-6">
      <svg
        viewBox="0 0 720 200"
        className="h-auto w-full rounded-lg border border-dashed border-annotation/30 bg-blueprint/50"
        aria-hidden
      >
        <path
          d="M40 176 L40 116 L190 116 L190 66 L690 66 L690 176 Z"
          fill="none"
          className="stroke-annotation/50"
          strokeDasharray="6 6"
        />
        <path
          d="M40 176 L40 150 L190 150 L190 160 L690 92"
          fill="none"
          className="stroke-annotation/30"
          strokeDasharray="3 5"
        />
        <rect
          x="190"
          y="40"
          width="500"
          height="26"
          fill="none"
          className="stroke-unknown/60"
          strokeDasharray="6 6"
        />
        <line
          x1="190"
          x2="190"
          y1="16"
          y2="176"
          className="stroke-annotation/50"
          strokeDasharray="2 4"
        />
        <line x1="40" x2="690" y1="176" y2="176" className="stroke-annotation/50" />
        <text x="115" y="28" textAnchor="middle" className="fill-annotation font-prose text-[15px]">
          {outline.known}
        </text>
        <text x="440" y="28" textAnchor="middle" className="fill-unknown font-prose text-[15px]">
          {outline.unknown}
        </text>
      </svg>

      <div>
        <h2 className="sheet-title text-title text-print">{title}</h2>
        <p className="measure mt-2 text-muted">{note}</p>
      </div>

      <div className="space-y-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={needs.length}
          aria-valuenow={done}
          aria-label={progressLabel}
          className="h-1 overflow-hidden rounded-full bg-annotation/20"
        >
          <div
            className="h-full bg-annotation"
            style={{ width: `${(done / Math.max(needs.length, 1)) * 100}%` }}
          />
        </div>
        <p className="text-caption text-muted">{progressLabel}</p>
        <ul className="space-y-2">
          {needs.map((need) => (
            <li key={need.label} className="flex items-center gap-3">
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-micro ${
                  need.done
                    ? 'border-annotation bg-annotation text-blueprint'
                    : 'border-annotation/50'
                }`}
              >
                {need.done ? '✓' : ''}
              </span>
              <span className={need.done ? 'text-muted line-through decoration-annotation/40' : 'text-print'}>
                {need.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {children}
    </section>
  )
}
