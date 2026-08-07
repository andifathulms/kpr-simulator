import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n/locales'
import { routeUrl, type PageKey } from '@/lib/metadata'

/**
 * All fourteen pages, both locales, each declaring the other as its
 * translation. Generated from the same route list the metadata uses, so a page
 * cannot exist without appearing here or appear here without existing.
 *
 * A sitemap in a subdirectory is valid and covers everything at or below its
 * own path, which is exactly this site's shape under /kpr-simulator/.
 *
 * No lastModified: it would have to come from the build clock, and a date that
 * changes on every deploy whether or not the page changed is noise that
 * teaches a crawler to ignore the field.
 */
const PAGES: readonly PageKey[] = [
  'home',
  'hitung',
  'ambang',
  'subsidi',
  'banding',
  'biaya',
  'parameter',
]

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PAGES.map((page) => ({
      url: routeUrl(locale, page),
      changeFrequency: 'monthly' as const,
      priority: page === 'home' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((other) => [other, routeUrl(other, page)]),
        ),
      },
    })),
  )
}
