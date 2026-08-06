/**
 * A numbered step in a form. Fifteen controls in one column is a wall; the same
 * fifteen in three named steps is a sequence someone can work through, and the
 * step title says in ordinary words what is being asked for.
 *
 * `tone` marks a step whose answers are assumptions rather than quotes — the
 * floating-rate step is the whole reason this app exists, and it is amber the
 * moment the user reaches it.
 */
export function FieldGroup({
  step,
  title,
  note,
  tone = 'computed',
  children,
}: {
  step: number
  title: string
  note?: string
  tone?: 'computed' | 'unknown'
  children: React.ReactNode
}) {
  const amber = tone === 'unknown'
  return (
    <fieldset
      className={`border-l-2 pl-4 ${amber ? 'border-unknown' : 'border-annotation/40'}`}
    >
      <legend className="sr-only">{title}</legend>
      <div aria-hidden className="flex items-baseline gap-2">
        <span className={`figure text-xs ${amber ? 'text-unknown' : 'text-annotation'}`}>
          {step}
        </span>
        <span className={`sheet-label text-xs ${amber ? 'text-unknown' : 'text-print'}`}>
          {title}
        </span>
      </div>
      {note && (
        <p className={`mt-1 text-xs ${amber ? 'text-unknown/90' : 'text-print/60'}`}>{note}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  )
}
