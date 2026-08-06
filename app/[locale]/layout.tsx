import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Barlow, Barlow_Condensed, Roboto_Mono } from 'next/font/google'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/locales'
import { dictionary } from '@/lib/i18n/dict'
import '../globals.css'

/**
 * This is the root layout, and the locale is a root-level segment, so the
 * prerendered HTML of every page carries the right `lang` — an English page
 * served as lang="id" is read aloud with Indonesian phonetics.
 *
 * `/` is handled by a static redirect written into the export at build time
 * rather than by a page here, so nothing sits outside a locale.
 */

/**
 * Self-hosted at build time. There is no runtime network request: the woff2
 * files are emitted into the export and served from the same origin, which is
 * what lets the site work fully offline after first load.
 */
const sheet = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sheet',
  display: 'swap',
})

const prose = Barlow({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-prose',
  display: 'swap',
})

/** Tabular figures for every rupiah amount, rate, and period. */
const figure = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-figure',
  display: 'swap',
})

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id'
  const t = dictionary(locale)
  return {
    title: t.common.appName,
    description: `${t.common.tagline} ${t.common.personalProject} ${t.common.notAdvice}`,
  }
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const t = dictionary(params.locale)

  return (
    <html lang={params.locale} className={`${sheet.variable} ${prose.variable} ${figure.variable}`}>
      <body>
        <a
          href="#isi"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-print focus:px-4 focus:py-2 focus:text-blueprint"
        >
          {params.locale === 'id' ? 'Lewati ke isi' : 'Skip to content'}
        </a>
        <div className="min-h-screen bg-blueprint">{children}</div>
        <span className="sr-only">{t.common.notAdvice}</span>
      </body>
    </html>
  )
}
