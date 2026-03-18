import type { PageInfo } from '@/types/page'

export const pageComponents = import.meta.glob<{ default: object }>('@/views/*/index.vue')

const pagesDataCandidates = [
  `${(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')}data/pages.json`,
  '/data/pages.json',
]

async function loadPages(): Promise<PageInfo[]> {
  for (const url of pagesDataCandidates) {
    const response = await fetch(url)
    if (!response.ok) continue

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) continue

    return (await response.json()) as PageInfo[]
  }

  throw new Error('Cannot load pages data from public/data/pages.json')
}

export const pages: PageInfo[] = await loadPages()

export const featuredPages: PageInfo[] = pages.filter((p) => p.featured)
