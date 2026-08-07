import type { Metadata } from 'next'
import { dictionary } from '@/lib/i18n/dict'
import { LOCALES, type Locale } from '@/lib/i18n/locales'
import { SITE_ORIGIN, SITE_URL, asset } from '@/lib/site'

/**
 * Per-route metadata, generated from the page's own words.
 *
 * Every page used to emit the same title and the same description, because the
 * only generateMetadata was in the root layout — `hitung`, `ambang` and
 * `parameter` were indistinguishable in a search result and in a shared link.
 *
 * The title and description are read from `dictionary().pages`, which is also
 * what PageHeader renders. There is one copy of each sentence, so a search
 * result cannot describe a page differently from the page itself. Nothing here
 * is hand-written a second time.
 */
export type PageKey = keyof ReturnType<typeof dictionary>['pages']

/** The path segment for a route, or '' for the locale home. */
const SEGMENT: Record<PageKey, string> = {
  home: '',
  hitung: 'hitung',
  ambang: 'ambang',
  subsidi: 'subsidi',
  banding: 'banding',
  biaya: 'biaya',
  parameter: 'parameter',
}

export function routeUrl(locale: Locale, page: PageKey): string {
  const segment = SEGMENT[page]
  return `${SITE_URL}${locale}/${segment ? `${segment}/` : ''}`
}

/**
 * A meta description wants roughly 155 characters. The ledes are written for
 * the page and some run longer, so this takes whole sentences up to the limit
 * rather than cutting mid-word — still the page's own words, never a separate
 * sentence written for robots that could drift from what is on screen.
 */
function describe(lede: string, limit = 155): string {
  if (lede.length <= limit) return lede
  let out = ''
  for (const sentence of lede.split(/(?<=\.)\s+/)) {
    if (out && `${out} ${sentence}`.length > limit) break
    out = out ? `${out} ${sentence}` : sentence
  }
  return out || lede.slice(0, limit).trimEnd()
}

export function pageMetadata(locale: Locale, page: PageKey): Metadata {
  const t = dictionary(locale)
  const copy = t.pages[page]
  const url = routeUrl(locale, page)
  const description = describe(copy.lede)
  const image = `${SITE_ORIGIN}${asset('/og.png')}`

  return {
    // The site name carries the app; the page carries its own question.
    title: page === 'home' ? t.common.appName : `${copy.title} · ${t.common.appName}`,
    description,
    applicationName: t.common.appName,
    alternates: {
      canonical: url,
      // Two full translations of every page, and nothing linked them. Without
      // this the locales compete in search instead of complementing.
      languages: {
        ...Object.fromEntries(LOCALES.map((other) => [other, routeUrl(other, page)])),
        'x-default': routeUrl('id', page),
      },
    },
    openGraph: {
      type: 'website',
      siteName: t.common.appName,
      locale: locale === 'id' ? 'id_ID' : 'en_GB',
      title: copy.title,
      description,
      // Was the locale home on every page, so sharing a calculator told every
      // scraper the canonical location was somewhere else.
      url,
      images: [{ url: image, width: 1200, height: 630, alt: t.common.tagline }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  }
}
