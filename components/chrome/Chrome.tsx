import Link from 'next/link'
import { dictionary } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { Legend } from '@/components/ui/Legend'
import { MakerSignature } from '@/components/ui/MakerSignature'

const ROUTES = ['hitung', 'ambang', 'subsidi', 'banding', 'biaya', 'parameter'] as const

/**
 * The header states what the app is on every page, not only on the home page.
 * Most visitors arrive on a calculator from a shared link rather than at the
 * front door, and a page of rupiah figures with no sentence saying what they
 * are is exactly the failure this project exists to avoid.
 */
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
  const id = locale === 'id'

  return (
    <div className="flex min-h-screen flex-col bg-blueprint text-print">
      <header className="print-hidden sticky top-0 z-40 border-b border-annotation/25 bg-blueprint/95 backdrop-blur supports-[backdrop-filter]:bg-blueprint/80">
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}`} className="shrink-0">
              <span className="sheet-label block text-lg leading-none text-print">
                {t.common.appName}
              </span>
              <span className="mt-1 hidden text-xs text-annotation sm:block">
                {id
                  ? 'Setelah bunga tetap berakhir, berapa angsurannya?'
                  : 'After the fixed rate ends, what does the instalment become?'}
              </span>
            </Link>

            <Link
              href={`/${other}`}
              className="sheet-label ml-auto shrink-0 border border-annotation/40 px-3 py-1.5 text-xs text-annotation hover:border-annotation hover:text-print"
            >
              {t.common.switchLocale}
            </Link>
          </div>

          <nav
            aria-label={id ? 'Halaman' : 'Pages'}
            className="-mx-6 mt-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex items-center gap-x-1">
              {ROUTES.map((route) => (
                <li key={route}>
                  <Link
                    href={`/${locale}/${route}`}
                    aria-current={active === route ? 'page' : undefined}
                    className={`sheet-label block whitespace-nowrap border-b-2 px-3 py-2 text-xs transition-colors ${
                      active === route
                        ? 'border-annotation text-print'
                        : 'border-transparent text-annotation hover:border-annotation/40 hover:text-print'
                    }`}
                  >
                    {t.nav[route]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="isi" className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-12">
        {children}
      </main>

      <Framing locale={locale} />
    </div>
  )
}

/**
 * First-class statements, not footer text. PRD §9: the app says plainly what
 * it is, what it does not know, and that the figures are to be confirmed. The
 * key to the two meaningful colours sits here too, so it is present on every
 * page rather than only on the one someone happened to enter through.
 */
export function Framing({ locale }: { locale: Locale }) {
  const t = dictionary(locale)
  return (
    <footer className="mt-20 border-t border-annotation/25 bg-recess print:mt-8 print:border-t print:pt-4">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <Legend locale={locale} />

        {/*
         * One seam, two unrelated things either side of it. Left: what the app
         * says about its own limits. Right: who built it. They share a row and
         * nothing else — a name folded into the framing statements would read
         * as an endorsement of the figures rather than as authorship.
         */}
        <div className="grid gap-x-10 gap-y-8 border-t border-annotation/15 pt-8 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1 text-sm text-print/85">
              <p className="sheet-label text-xs text-annotation">{t.common.appName}</p>
              <p>{t.common.personalProject}</p>
              <p>{t.common.notAdvice}</p>
            </div>
            <div className="space-y-1 text-sm text-print/85">
              <p>{t.common.confirmWithBank}</p>
              <p>{t.common.approvalNotModelled}</p>
              <p className="text-print/70">{t.floating.short}</p>
            </div>
          </div>

          <MakerSignature />
        </div>
      </div>
    </footer>
  )
}
