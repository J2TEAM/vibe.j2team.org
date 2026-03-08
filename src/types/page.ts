/** What each page's meta.ts exports (path derived from folder name) */
export interface PageMeta {
  name: string
  description: string
  author: string
  facebook?: string
  category?: string
}

/** Full page info with computed path (used by router and PagesGrid) */
export interface PageInfo extends PageMeta {
  path: string
}
