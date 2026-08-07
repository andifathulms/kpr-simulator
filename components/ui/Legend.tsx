import { dictionary } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'

/**
 * The key to the sheet. Two colours carry meaning in this app and nothing else
 * uses them, so saying so once, plainly, replaces a paragraph of caveats on
 * every page. A first-time visitor reads this before any figure means anything.
 */
export function Legend({ locale, className = '' }: { locale: Locale; className?: string }) {
  const t = dictionary(locale)
  const id = locale === 'id'
  return (
    <dl className={`grid gap-x-6 gap-y-3 sm:grid-cols-3 ${className}`}>
      <Entry
        swatch="bg-print/70"
        term={t.common.computed}
        detail={
          id
            ? 'Aritmetika, atau aturan yang dikutip sumbernya.'
            : 'Arithmetic, or a rule cited to its source.'
        }
      />
      <Entry swatch="bg-unknown" term={t.common.assumption} detail={t.common.unknownLegend} />
      <Entry
        swatch="bg-threshold"
        term={id ? 'Batas' : 'Limit'}
        detail={t.common.thresholdLegend}
      />
    </dl>
  )
}

function Entry({ swatch, term, detail }: { swatch: string; term: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-1.5 h-2.5 w-6 shrink-0 ${swatch}`} aria-hidden />
      <div>
        <dt className="sheet-label text-caption text-print">{term}</dt>
        <dd className="text-caption text-muted">{detail}</dd>
      </div>
    </div>
  )
}
