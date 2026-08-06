import type { Unsupported } from '@/lib/rules/result'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Amber is reserved for the unknown; threshold red for the affordability
 * limit and its breach. Nothing else uses either colour.
 */

export function UnknownNotice({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <aside className="border-l-2 border-unknown bg-unknown/10 px-4 py-3">
      <p className="sheet-label text-xs text-unknown">{title}</p>
      <div className="mt-1 text-sm text-print/90">{children}</div>
    </aside>
  )
}

export function ThresholdNotice({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <aside className="border-l-2 border-threshold bg-threshold/10 px-4 py-3">
      <p className="sheet-label text-xs text-threshold">{title}</p>
      <div className="mt-1 text-sm text-print/90">{children}</div>
    </aside>
  )
}

/**
 * A refusal, rendered as a refusal: it names what is missing rather than
 * showing an approximate figure. Never a fallback, never a nearest year.
 */
export function RefusalNotice({
  outcome,
  locale,
}: {
  outcome: Unsupported
  locale: Locale
}) {
  return (
    <aside className="border-l-2 border-unknown bg-unknown/10 px-4 py-3">
      <p className="sheet-label text-xs text-unknown">
        {locale === 'id' ? 'Tidak dapat dihitung' : 'Cannot be computed'}
      </p>
      <p className="mt-1 text-sm text-print/90">
        {locale === 'id'
          ? 'Aplikasi menolak menghitung karena ada yang tidak diketahui. Nilai tidak diperkirakan dan tidak diambil dari periode terdekat.'
          : 'The app refuses to compute because something is missing. Nothing is estimated and nothing is taken from a nearby period.'}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-unknown">
        {outcome.gaps.map((gap, index) => (
          <li key={`${gap.reference}-${index}`}>
            <span className="figure">{gap.reference}</span>
            {gap.period && <span className="figure"> · {gap.period}</span>}
            <span className="block text-print/80">
              {locale === 'id' ? gap.detail.id : gap.detail.en}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
