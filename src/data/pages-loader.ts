import type { PageMeta, PageInfo } from '@/types/page'

const metaModules = import.meta.glob<{ default: PageMeta }>('@/views/*/meta.ts', { eager: true })

export const pageComponents = import.meta.glob<{ default: object }>('@/views/*/index.vue')

// Hand-picked featured apps by Juno — these are pinned to the top of the homepage
const featuredPaths = [
  '/blow-your-job',
  '/chicken-shooter',
  '/chuyen-doi-luong',
  '/whack-a-bug',
  '/dev-pocket-tools',
  '/flash-card',
  '/github-portfolio',
  '/typing-speed',
  '/dev-tools',
  '/peer-call',
  '/piano',
  '/resume-builder',
  '/should-i-quit-my-job',
  '/mario-game',
  '/taboo-keyboard',
  '/tank-rescue',
  '/what-if',
]

function extractPath(globKey: string): string {
  const match = globKey.match(/\/views\/([^/]+)\/meta\.ts$/)
  return match ? `/${match[1]}` : ''
}

export const pages: PageInfo[] = Object.entries(metaModules)
  .map(([key, module]) => ({
    ...module.default,
    path: extractPath(key),
  }))
  .filter((p) => p.path !== '')
  .sort((a, b) => {
    if (a.path === '/hello-world') return 1
    if (b.path === '/hello-world') return -1

    const aFeatured = featuredPaths.indexOf(a.path)
    const bFeatured = featuredPaths.indexOf(b.path)

    if (aFeatured !== -1 && bFeatured !== -1) return aFeatured - bFeatured
    if (aFeatured !== -1) return -1
    if (bFeatured !== -1) return 1

    return a.name.localeCompare(b.name)
  })