/**
 * Two things the export needs before GitHub Pages will serve it correctly:
 *
 *   .nojekyll   — or Pages drops the _next directory, whose name starts with
 *                 an underscore, and the site loads with no JS or CSS at all.
 *   index.html  — a redirect from the basePath root to the default locale.
 *                 The locale is a root-level route segment so that every page
 *                 carries the right `lang` in its prerendered HTML, which
 *                 leaves nothing to render at `/` itself.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = new URL('../out/', import.meta.url).pathname
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/kpr-simulator'
const DEFAULT_LOCALE = 'id'
const target = `${BASE_PATH}/${DEFAULT_LOCALE}/`

await writeFile(join(OUT, '.nojekyll'), '')

// A meta refresh rather than a script, so it works with JavaScript disabled,
// and a real link beneath it so it works if the refresh is blocked too.
await writeFile(
  join(OUT, 'index.html'),
  `<!doctype html>
<html lang="${DEFAULT_LOCALE}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=${target}">
    <link rel="canonical" href="${target}">
    <title>KPR Simulator</title>
  </head>
  <body>
    <p><a href="${target}">KPR Simulator</a></p>
  </body>
</html>
`,
)

console.log(`finalise-export — .nojekyll ditulis, / diarahkan ke ${target}`)
