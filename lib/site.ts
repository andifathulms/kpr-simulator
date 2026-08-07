/**
 * Where the site lives, and how to build a path to a file it serves.
 *
 * Every asset in `public/` is served under the production basePath, so a bare
 * "/favicon.svg" is a 404 in production and works fine in `pnpm dev` — exactly
 * the kind of difference that survives review and breaks the deployed site.
 * One helper, used everywhere, removes the chance to get it wrong.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/kpr-simulator'

/** The deployed origin. Used only for absolute URLs in link-preview metadata. */
export const SITE_ORIGIN = 'https://andifathulms.github.io'

export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}/`

/**
 * Mirrors `colors.blueprint` in tailwind.config.ts. Browser chrome and the
 * manifest are set through meta tags and static JSON, neither of which can
 * read a Tailwind token, so this is the one place the ground colour is written
 * as a literal. `public/manifest.webmanifest` carries the same value.
 */
export const THEME_COLOR = '#1B3A5C'

/** `asset('/og.png')` → `/kpr-simulator/og.png` */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`
}
