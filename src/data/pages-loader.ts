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
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) {
      return orderA - orderB
    }

    return a.name.localeCompare(b.name)
  })
