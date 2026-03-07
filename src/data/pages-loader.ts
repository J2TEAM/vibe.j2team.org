import type { PageMeta, PageInfo } from '@/types/page'

const metaModules = import.meta.glob<{ default: PageMeta }>('@/views/*/meta.ts', { eager: true })

export const pageComponents = import.meta.glob<{ default: object }>('@/views/*/index.vue')

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
    return a.name.localeCompare(b.name)
  })
