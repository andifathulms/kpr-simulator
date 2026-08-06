/**
 * Every page opens the same way: what this page is, in a label; the question it
 * answers, as a title; and one paragraph in plain words for someone who has
 * never taken a loan. The consistency is the point — a visitor should be able
 * to tell within one line whether they are on the page they wanted.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string
  title: string
  lede: string
  children?: React.ReactNode
}) {
  return (
    <header className="border-b border-annotation/25 pb-6">
      <p className="sheet-label text-xs text-annotation">{eyebrow}</p>
      <h1 className="sheet-title mt-2 max-w-3xl text-title">{title}</h1>
      <p className="measure mt-3 text-print/80">{lede}</p>
      {children}
    </header>
  )
}
