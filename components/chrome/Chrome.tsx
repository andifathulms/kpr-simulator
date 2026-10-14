import Link from 'next/link'
import { dictionary } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import { Legend } from '@/components/ui/Legend'
import { MakerSignature } from '@/components/ui/MakerSignature'
import { Mark } from '@/components/ui/Mark'

export const ROUTES = ['hitung', 'ambang', 'subsidi', 'banding', 'biaya', 'parameter'] as const
export type Route = (typeof ROUTES)[number]

/**
 * The pages grouped by what the visitor is doing, in the order a buyer usually
 * works: calculate, choose a path, prepare. The numbers state that order; they
 * are not a ranking, and every page still opens on its own from a shared link.
 * `parameter` sits outside the groups — it is reference, not a step.
 */
export const GROUPS: readonly {
  readonly key: string
  readonly label: { readonly id: string; readonly en: string }
  readonly routes: readonly Route[]
}[] = [
  { key: 'hitung', label: { id: 'Hitung', en: 'Calculate' }, routes: ['hitung', 'ambang'] },
  { key: 'jalur', label: { id: 'Pilih jalur', en: 'Choose a path' }, routes: ['subsidi', 'banding'] },
  { key: 'siapkan', label: { id: 'Siapkan', en: 'Prepare' }, routes: ['biaya'] },
]

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
  active?: Route
  children: React.ReactNode
}) {
  const t = dictionary(locale)
  const other: Locale = locale === 'id' ? 'en' : 'id'
  const id = locale === 'id'

  return (
    <div className="flex min-h-screen flex-col text-print">
      <header className="print-hidden z-40 border-b md:sticky md:top-0 border-annotation/20 bg-blueprint/95 backdrop-blur supports-[backdrop-filter]:bg-blueprint/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/*
           * Sticky from md up. On a phone the header is two rows of links
           * and would hold a fifth of the screen; there it scrolls away, and
           * the readout dock keeps the answer in reach instead.
           *
           * Wraps rather than overflows (WCAG 1.4.10 Reflow): the brand may
           * shrink and the row may wrap, so at 320px the utilities drop to
           * their own line instead of widening the page.
           */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3">
            <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3">
              <Mark size={32} />
              <span className="min-w-0">
                <span className="sheet-label block text-body leading-none text-print">
                  {t.common.appName}
                </span>
                <span className="mt-1 hidden text-caption text-annotation sm:block">
                  {id
                    ? 'Setelah bunga tetap berakhir, berapa angsurannya?'
                    : 'After the fixed rate ends, what does the instalment become?'}
                </span>
              </span>
            </Link>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Link
                href={`/${locale}/parameter`}
                aria-current={active === 'parameter' ? 'page' : undefined}
                className={`hidden rounded-md px-3 py-1.5 text-caption transition-colors md:block ${
                  active === 'parameter'
                    ? 'bg-raised text-print'
                    : 'text-muted hover:bg-surface hover:text-print'
                }`}
              >
                {t.nav.parameter}
              </Link>
              {/* The label is written in the language it switches to, so it is
                  marked as such — otherwise an Indonesian synthesiser reads
                  "English" with Indonesian phonetics (WCAG 3.1.2). */}
              <Link
                href={`/${other}`}
                lang={other}
                className="rounded-full border border-annotation/40 px-3 py-1 text-caption text-annotation transition-colors hover:border-annotation hover:text-print"
              >
                {t.common.switchLocale}
              </Link>
            </div>
          </div>

          <nav aria-label={id ? 'Halaman' : 'Pages'} className="pb-2 pt-3">
            {/* Phones: every page visible at once, in a grid. A sideways
                scroll hid half the pages off the edge of a 390px screen. */}
            <ul className="grid grid-cols-3 gap-1 md:hidden">
              {ROUTES.map((route) => (
                <li key={route}>
                  <NavLink locale={locale} route={route} active={active} label={t.nav[route]} block />
                </li>
              ))}
            </ul>

            {/* Wider: the same pages in their three groups. */}
            <ol className="hidden items-stretch md:flex">
              {GROUPS.map((group, index) => (
                <li
                  key={group.key}
                  className={`flex flex-col gap-0.5 pr-4 ${index > 0 ? 'border-l border-annotation/20 pl-4' : ''}`}
                >
                  <span className="figure px-3 text-micro text-muted">
                    {index + 1} · {id ? group.label.id : group.label.en}
                  </span>
                  <ul className="flex gap-1">
                    {group.routes.map((route) => (
                      <li key={route}>
                        <NavLink locale={locale} route={route} active={active} label={t.nav[route]} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <main id="isi" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        {children}
      </main>

      <Framing locale={locale} />
    </div>
  )
}

function NavLink({
  locale,
  route,
  active,
  label,
  block = false,
}: {
  locale: Locale
  route: Route
  active?: Route
  label: string
  block?: boolean
}) {
  const current = active === route
  return (
    <Link
      href={`/${locale}/${route}`}
      aria-current={current ? 'page' : undefined}
      className={`block rounded-md py-1.5 text-caption font-medium leading-tight transition-colors ${
        block ? 'flex min-h-[2.5rem] items-center justify-center px-1.5 text-center' : 'whitespace-nowrap px-3'
      } ${
        current
          ? 'bg-raised text-print shadow-[inset_0_-2px_0_rgb(var(--c-annotation))]'
          : 'text-muted hover:bg-surface hover:text-print'
      }`}
    >
      {label}
    </Link>
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
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <Legend locale={locale} />

        {/*
         * One seam, two unrelated things either side of it. Left: what the app
         * says about its own limits. Right: who built it. They share a row and
         * nothing else — a name folded into the framing statements would read
         * as an endorsement of the figures rather than as authorship.
         */}
        <div className="grid gap-x-10 gap-y-8 border-t border-annotation/15 pt-8 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1 text-caption text-muted">
              <p className="sheet-label text-caption text-annotation">{t.common.appName}</p>
              <p>{t.common.personalProject}</p>
              <p>{t.common.notAdvice}</p>
            </div>
            <div className="space-y-1 text-caption text-muted">
              <p>{t.common.confirmWithBank}</p>
              <p>{t.common.approvalNotModelled}</p>
              <p className="text-muted">{t.floating.short}</p>
            </div>
          </div>

          <MakerSignature />
        </div>
      </div>
    </footer>
  )
}
