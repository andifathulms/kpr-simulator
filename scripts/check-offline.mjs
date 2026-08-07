/**
 * Guards invariant 13: no runtime network requests, no analytics.
 *
 * The site must work fully offline after first load, and — more importantly —
 * income and loan figures must never leave the machine. That is easy to state
 * and easy to break later with one innocuous `<script src>` or a font link,
 * so it is checked against the built export rather than trusted.
 *
 * External URLs are legitimate in exactly one place: the href of an anchor
 * pointing at a regulation, which the user chooses to follow. Anywhere the
 * browser would fetch something on its own — script src, link href, img src,
 * preconnect — must be same-origin.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

const OUT = new URL('../out/', import.meta.url).pathname

const ANALYTICS = [
  'google-analytics.com',
  'googletagmanager.com',
  'analytics.',
  'segment.io',
  'mixpanel.com',
  'plausible.io',
  'sentry.io',
  'hotjar.com',
  'facebook.net',
  'doubleclick.net',
  'vercel-insights.com',
]

/** Attributes the browser acts on without the user doing anything. */
const FETCHING_ATTRIBUTES = /(?:src|href)\s*=\s*"(https?:\/\/[^"]+)"/gi

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

const failures = []
let htmlChecked = 0

for await (const path of walk(OUT)) {
  const extension = extname(path)
  if (extension !== '.html' && extension !== '.css') continue
  const contents = await readFile(path, 'utf8')
  const relative = path.slice(OUT.length)

  if (extension === '.html') {
    htmlChecked += 1
    // Strip anchors before looking for fetching attributes: a citation link
    // is the one external URL this project exists to show.
    //
    // Canonical and alternate links go the same way, and for the same reason:
    // they state where this page lives and where its translation lives. No
    // browser ever requests them — they are read by crawlers, out of band.
    // This is narrowed deliberately to those two rel values. A stylesheet, a
    // preload, a script, an icon, a manifest and any other rel are still
    // checked, because those the browser does fetch on its own.
    const withoutDeclarations = contents
      .replace(/<a\b[^>]*>/gi, '<a>')
      .replace(/<link\b[^>]*\brel="(?:canonical|alternate)"[^>]*>/gi, '<link>')
    for (const match of withoutDeclarations.matchAll(FETCHING_ATTRIBUTES)) {
      const url = match[1]
      if (url === undefined) continue
      // Namespaces are declarations, not requests.
      if (url.startsWith('http://www.w3.org/')) continue
      failures.push(`${relative}: fetches ${url}`)
    }
  }

  if (extension === '.css') {
    for (const match of contents.matchAll(/url\((['"]?)(https?:\/\/[^)'"]+)\1\)/gi)) {
      failures.push(`${relative}: stylesheet fetches ${match[2]}`)
    }
  }

  for (const domain of ANALYTICS) {
    if (contents.includes(domain)) failures.push(`${relative}: references ${domain}`)
  }
}

if (htmlChecked === 0) {
  console.error('check-offline — tidak ada HTML yang diperiksa. Jalankan build lebih dulu.')
  process.exit(1)
}

if (failures.length > 0) {
  console.error(`\ncheck-offline — ${failures.length} pelanggaran\n`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  console.error(
    '\nSitus ini tidak boleh meminta apa pun dari luar saat dijalankan, dan angka\n' +
      'penghasilan tidak boleh meninggalkan perangkat pengguna.\n',
  )
  process.exit(1)
}

console.log(
  `check-offline — ${htmlChecked} halaman, tidak ada permintaan jaringan eksternal, tidak ada analitik. ✓`,
)
