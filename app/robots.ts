import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Nothing is disallowed. There is no private area, no user content and no
 * server — every page is a static calculator.
 *
 * Worth knowing where this actually lands: a crawler reads robots.txt from the
 * domain root, and this site is a project page, so the file that governs it is
 * andifathulms.github.io/robots.txt — a different repository. This one, served
 * at /kpr-simulator/robots.txt, will not be read at the current URL. It is here
 * so the sitemap reference travels with the site if it ever moves to its own
 * domain, and because it costs 120 bytes. The sitemap does not depend on it:
 * a sitemap can be submitted directly, and every page links its alternates.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}sitemap.xml`,
  }
}
