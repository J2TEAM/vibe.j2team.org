import type { PageInfo } from '@/types/page'

export const pageComponents = import.meta.glob<{ default: object }>('@/views/*/index.vue')

export const pages: PageInfo[] = await fetch('/data/pages.json').then(
  (r) => r.json() as Promise<PageInfo[]>,
)

export const featuredPages: PageInfo[] = pages.filter((p) => p.featured)
