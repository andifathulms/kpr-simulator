/**
 * Static export for GitHub Pages.
 *
 * basePath must match the repository name (kpr-simulator). `pnpm preview`
 * serves ./out under this same prefix so the production paths are exercised
 * before pushing.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/kpr-simulator'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

module.exports = nextConfig
