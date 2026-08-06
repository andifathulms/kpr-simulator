/**
 * A titled section of a sheet. The optional note is the plain-language sentence
 * saying what the section shows and why it is worth looking at — most of this
 * app's content is unfamiliar to the person reading it, and a heading alone
 * does not carry that.
 *
 * Renders only. Nothing here computes anything.
 */
export function Panel({
  title,
  note,
  aside,
  children,
}: {
  title: string
  note?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="sheet-label text-sm text-annotation">{title}</h2>
        {aside}
      </div>
      {note && <p className="measure text-sm text-print/70">{note}</p>}
      {children}
    </section>
  )
}
