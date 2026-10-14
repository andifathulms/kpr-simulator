/**
 * A numbered step in a form. Fifteen controls in one column is a wall; the same
 * fifteen in three named steps is a sequence someone can work through, and the
 * step title says in ordinary words what is being asked for.
 *
 * `tone` marks a step whose answers are assumptions rather than quotes — the
 * floating-rate step is the whole reason this app exists, and it is amber the
 * moment the user reaches it.
 *
 * `done` ticks the step once its required fields hold a value, so someone
 * working down the form can see what is still missing without reading it
 * again. The container decides what "done" means; this only draws it.
 */
export function FieldGroup({
  step,
  title,
  note,
  tone = 'computed',
  done = false,
  tag,
  children,
}: {
  step: number
  title: string
  note?: string
  tone?: 'computed' | 'unknown'
  done?: boolean
  /** The word for what an amber step holds — `t.common.assumption`. */
  tag?: string
  children: React.ReactNode
}) {
  const amber = tone === 'unknown'
  return (
    <fieldset
      className={`rounded-xl border p-4 ${
        amber ? 'border-unknown/45 bg-unknown/[0.06]' : 'border-annotation/25 bg-surface'
      }`}
    >
      <legend className="sr-only">{title}</legend>
      <div aria-hidden className="flex items-center gap-3">
        <span
          className={`figure flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-micro ${
            amber
              ? 'border-unknown text-unknown'
              : done
                ? 'border-annotation bg-annotation text-blueprint'
                : 'border-annotation text-annotation'
          }`}
        >
          {done && !amber ? '✓' : step}
        </span>
        <span className={`sheet-title text-lead ${amber ? 'text-unknown' : 'text-print'}`}>
          {title}
        </span>
        {amber && tag && (
          <span className="sheet-label ml-auto rounded-full border border-unknown/60 px-2 py-px text-micro leading-tight text-unknown">
            {tag}
          </span>
        )}
      </div>
      {note && (
        <p className={`mt-2 text-caption ${amber ? 'text-unknown' : 'text-muted'}`}>{note}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  )
}
