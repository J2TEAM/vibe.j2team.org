/**
 * Post-build script: generates per-route HTML files with correct OG meta tags.
 *
 * Social crawlers (Facebook, Twitter, etc.) don't execute JavaScript,
 * so they only see the static index.html. This script creates a copy of
 * index.html for each route with the proper <title>, <meta description>,
 * and Open Graph / Twitter Card tags injected into <head>.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import jiti from 'jiti'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const VIEWS = join(ROOT, 'src', 'views')

const SITE_NAME = 'vibe.j2team.org'
const SITE_URL = 'https://vibe.j2team.org'
const DEFAULT_TITLE = `${SITE_NAME} - J2TEAM Community Vibe Coding`
const DEFAULT_DESCRIPTION =
  'Cả nhóm J2TEAM Community vibe code cùng nhau! Mỗi thành viên tạo một trang con, vibe code thoải mái.'

// Static routes not in src/views
const staticRoutes = [
  {
    path: '/leaderboard',
    title: 'Bảng xếp hạng tác giả - vibe.j2team.org',
    description: 'Bảng xếp hạng các tác giả đóng góp nhiều ứng dụng nhất trên vibe.j2team.org.',
  },
  {
    path: '/bookmarks',
    title: 'Yêu thích - vibe.j2team.org',
    description: 'Danh sách các ứng dụng yêu thích của bạn.',
  },
  {
    path: '/content-policy',
    title: 'Chính sách nội dung - vibe.j2team.org',
    description: 'Chính sách nội dung cho các trang con trên vibe.j2team.org.',
  },
  {
    path: '/contributors',
    title: 'Cộng đồng đóng góp - vibe.j2team.org',
    description: 'Khám phá cộng đồng những người đóng góp trên vibe.j2team.org qua không gian 3D.',
  },
]

/**
 * Collect page metadata from src/views/x/meta.ts via jiti (TS import).
 */
function collectPageMeta() {
  const loadTs = jiti(import.meta.url, { interopDefault: true })
  const pages = []

  for (const entry of readdirSync(VIEWS)) {
    const metaPath = join(VIEWS, entry, 'meta.ts')
    try {
      statSync(metaPath)
    } catch {
      continue
    }

    const meta = loadTs(metaPath)
    pages.push({
      path: `/${entry}`,
      title: `${meta.name} - ${SITE_NAME}`,
      description: meta.description,
    })
  }

  return pages
}

/**
 * Build OG meta tag string for a given route.
 */
function buildMetaTags({ title, description, path }) {
  const url = `${SITE_URL}${path}`
  return [
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
  ].join('\n    ')
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Inject OG tags into the index.html template.
 */
function injectMeta(template, route) {
  let html = template

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(route.title)}</title>`)

  // Replace <meta name="description">
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeAttr(route.description)}">`,
  )

  // Inject OG tags before </head>
  const ogTags = buildMetaTags(route)
  html = html.replace('</head>', `    ${ogTags}\n  </head>`)

  return html
}

// --- Main ---

const template = readFileSync(join(DIST, 'index.html'), 'utf-8')
const dynamicPages = collectPageMeta()
const allRoutes = [...dynamicPages, ...staticRoutes]

// Also inject OG tags into the root index.html for the homepage
const homepageRoute = { path: '/', title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }
writeFileSync(join(DIST, 'index.html'), injectMeta(template, homepageRoute))

let count = 0
for (const route of allRoutes) {
  const dir = join(DIST, route.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), injectMeta(template, route))
  count++
}

console.log(`[generate-og-pages] Generated OG tags for ${count} routes + homepage`)
