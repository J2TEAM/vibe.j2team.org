/**
 * Generates public/data/pages.json from all src/views/[slug]/meta.ts files.
 *
 * Called by the Vite plugin in vite.config.ts on buildStart (dev + build).
 * The output is consumed by src/data/pages-loader.ts via fetch.
 */

import { writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import jiti from 'jiti'

const ROOT = resolve(import.meta.dirname, '..')
const VIEWS = join(ROOT, 'src', 'views')
const OUT = join(ROOT, 'public', 'data', 'pages.json')

// Hand-picked featured apps by Juno — pinned to top of homepage
const featuredPaths = [
  '/blow-your-job',
  '/project-42',
  '/co-tuong',
  '/cuoc-song-hang-ngay-cua-ai',
  '/gach-bong',
  '/windows-xp',
  '/what-if',
  '/chicken-shooter',
  '/whack-a-bug',
  '/dev-pocket-tools',
  '/flash-card',
  '/github-portfolio',
  '/typing-speed',
  '/dev-tools',
  '/peer-call',
  '/piano',
  '/resume-builder',
  '/chuyen-doi-luong',
  '/should-i-quit-my-job',
  '/mario-game',
  '/taboo-keyboard',
  '/tank-rescue',
  '/bug-war-room',
  '/hacker-ctf',
  '/peer-drop',
  '/startup-in-5-minutes',
  '/canchi',
]

export async function generatePagesJson() {
  const loadTs = jiti(import.meta.url, { interopDefault: true })
  const featuredIndex = new Map(featuredPaths.map((p, i) => [p, i]))

  const pages = []
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
    const isFeatured = featuredPaths.includes(`/${entry}`)
    pages.push({ ...meta, path: `/${entry}`, ...(isFeatured && { featured: true }) })
  }

  pages.sort((a, b) => {
    const aIdx = featuredIndex.get(a.path) ?? Infinity
    const bIdx = featuredIndex.get(b.path) ?? Infinity
    if (aIdx !== bIdx) return aIdx - bIdx
    return a.name.localeCompare(b.name)
  })

  writeFileSync(OUT, JSON.stringify(pages))
  console.log(`[generate-pages-json] Written ${pages.length} pages to public/data/pages.json`)
}

// Allow direct execution: node scripts/generate-pages-json.mjs
if (process.argv[1] === import.meta.filename) {
  await generatePagesJson()
}
