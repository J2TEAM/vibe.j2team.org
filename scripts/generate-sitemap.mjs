// Post-build script: generates sitemap index + sub-sitemaps in dist/

import { writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import jiti from 'jiti'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const VIEWS = join(ROOT, 'src', 'views')
const SITEMAPS_DIR = join(DIST, 'sitemaps')

const SITE_URL = 'https://vibe.j2team.org'
const TODAY = new Date().toISOString().split('T')[0]

function collectPages() {
  const loadTs = jiti(import.meta.url, { interopDefault: true })
  const apps = []
  const authors = new Set()

  for (const entry of readdirSync(VIEWS)) {
    const metaPath = join(VIEWS, entry, 'meta.ts')
    try {
      statSync(metaPath)
    } catch {
      continue
    }

    const raw = loadTs(metaPath)
    const meta = raw?.default ?? raw
    if (!meta?.name || meta.hidden) continue

    apps.push(`/${entry}`)
    if (meta.author) authors.add(meta.author)
  }

  return { apps, authors: [...authors] }
}

function toAuthorSlug(author) {
  return author.toLowerCase().replace(/\s+/g, '-')
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildUrlset(urls) {
  const entries = urls
    .map(
      ({ loc, changefreq, priority }) =>
        `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`
}

function buildSitemapIndex(sitemaps) {
  const entries = sitemaps
    .map(
      (name) =>
        `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/${name}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`
}

// --- Main ---

const CATEGORIES = [
  'game', 'fun', 'tool', 'learn', 'spiritual',
  'creative', 'connect', 'health', 'finance', 'other',
]

const { apps, authors } = collectPages()
mkdirSync(SITEMAPS_DIR, { recursive: true })

const sitemaps = [
  {
    name: 'main.xml',
    urls: [
      { loc: SITE_URL, changefreq: 'daily', priority: '1.0' },
      { loc: `${SITE_URL}/leaderboard`, changefreq: 'weekly', priority: '0.5' },
      { loc: `${SITE_URL}/bookmarks`, changefreq: 'monthly', priority: '0.3' },
      { loc: `${SITE_URL}/content-policy`, changefreq: 'monthly', priority: '0.3' },
      { loc: `${SITE_URL}/members`, changefreq: 'weekly', priority: '0.5' },
      { loc: `${SITE_URL}/contributors`, changefreq: 'weekly', priority: '0.5' },
      ...CATEGORIES.map((id) => ({
        loc: `${SITE_URL}/category/${id}`,
        changefreq: 'weekly',
        priority: '0.6',
      })),
      { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.3' },
      { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.3' },
    ],
  },
  {
    name: 'apps.xml',
    urls: apps.map((path) => ({
      loc: `${SITE_URL}${path}`,
      changefreq: 'weekly',
      priority: '0.8',
    })),
  },
  {
    name: 'authors.xml',
    urls: authors.map((name) => ({
      loc: `${SITE_URL}/author/${encodeURIComponent(toAuthorSlug(name))}`,
      changefreq: 'weekly',
      priority: '0.6',
    })),
  },
]

for (const { name, urls } of sitemaps) {
  writeFileSync(join(SITEMAPS_DIR, name), buildUrlset(urls))
  console.log(`[generate-sitemap] ${name}: ${urls.length} URLs`)
}

const totalUrls = sitemaps.reduce((sum, s) => sum + s.urls.length, 0)
writeFileSync(join(DIST, 'sitemap.xml'), buildSitemapIndex(sitemaps.map((s) => s.name)))
console.log(`[generate-sitemap] sitemap.xml index → ${sitemaps.length} sitemaps, ${totalUrls} URLs total`)
