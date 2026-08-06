/**
 * Serves ./out under the production basePath so the exported site is verified
 * at the same paths GitHub Pages will use.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/kpr-simulator'
const ROOT = new URL('../out/', import.meta.url).pathname
const PORT = Number(process.env.PORT ?? 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

async function resolve(pathname) {
  const candidates = [pathname, join(pathname, 'index.html'), `${pathname}.html`]
  for (const candidate of candidates) {
    const file = join(ROOT, normalize(candidate))
    if (!file.startsWith(ROOT)) continue
    try {
      const info = await stat(file)
      if (info.isFile()) return file
    } catch {
      /* try the next candidate */
    }
  }
  return null
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (url.pathname === '/' || url.pathname === BASE_PATH) {
    res.writeHead(302, { Location: `${BASE_PATH}/` })
    return res.end()
  }
  if (!url.pathname.startsWith(BASE_PATH)) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    return res.end(`Not under basePath ${BASE_PATH}`)
  }
  const file = await resolve(url.pathname.slice(BASE_PATH.length) || '/')
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    return res.end('404')
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(await readFile(file))
}).listen(PORT, () => {
  console.log(`preview: http://localhost:${PORT}${BASE_PATH}/`)
})
