import type { CategoryId } from '@/data/categories'

/** What each page's meta.ts exports (path derived from folder name) */
export interface PageMeta {
  name: string
  description: string
  author: string
  facebook?: string
  category: CategoryId
  /** Set to false to hide the edge toolbar on this page. Default: true */
  showToolbar?: boolean
}

/** Full page info with computed path (used by router and PagesGrid) */
export interface PageInfo extends PageMeta {
  path: string
}
