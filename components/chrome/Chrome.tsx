import Link from 'next/link'
import { dictionary } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'

const ROUTES = ['hitung', 'ambang', 'subsidi', 'banding', 'biaya', 'parameter'] as const

export function Chrome({
  locale,
  active,
  children,
}: {
  locale: Locale
  active?: (typeof ROUTES)[number]
  children: React.ReactNode
}) {
  const t = dictionary(locale)
  const other: Locale = locale === 'id' ? 'en' : 'id'

  return (
    <div className="min-h-screen bg-blueprint text-print">
      <header className="print-hidden border-b border-annotation/25">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-6 gap-y-3 px-6 py-5">
          <Link href={`/${locale}`} className="sheet-label text-lg text-print">
            {t.common.appName}
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {ROUTES.map((route) => (
              <Link
                key={route}
                href={`/${locale}/${route}`}
                aria-current={active === route ? 'page' : undefined}
                className={
                  active === route
                    ? 'sheet-label text-xs text-print underline decoration-annotation underline-offset-8'
                    : 'sheet-label text-xs text-annotation hover:text-print'
                }
              >
                {t.nav[route]}
              </Link>
            ))}
          </nav>
          <Link
            href={`/${other}`}
            className="sheet-label ml-auto text-xs text-annotation hover:text-print"
          >
            {t.common.switchLocale}
          </Link>
        </div>
      </header>

      <main id="isi" className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>

      <Framing locale={locale} />
    </div>
  )
}

/**
 * First-class statements, not footer text. PRD §9: the app says plainly what
 * it is, what it does not know, and that the figures are to be confirmed.
 */
export function Framing({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  return (
    <footer className="mt-16 border-t border-annotation/25 bg-recess print:mt-8 print:border-t print:pt-4">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2">
        <div className="space-y-2 text-sm text-print/85">
          <p className="sheet-label text-xs text-annotation">{t.common.appName}</p>
          <p>{t.common.personalProject}</p>
          <p>{t.common.notAdvice}</p>
          <p>{t.common.confirmWithBank}</p>
          <p>{t.common.approvalNotModelled}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-unknown">{t.common.unknownLegend}</p>
          <p className="text-threshold">{t.common.thresholdLegend}</p>
          <p className="text-print/70">{t.floating.short}</p>
        </div>
      </div>
    </footer>
  )
}
