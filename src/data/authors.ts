import type { CategoryId } from '@/data/categories'
import type { PageInfo } from '@/types/page'
import { pages } from '@/data/pages-loader'
import { multiAppAuthors } from '@/data/leaderboard'

export interface AuthorPageData {
  author: string
  slug: string
  facebook: string | undefined
  apps: PageInfo[]
  categories: CategoryId[]
  rank: number | undefined
}

export function toAuthorSlug(author: string): string {
  return author.toLowerCase().replace(/\s+/g, '-')
}

const rankByAuthor = new Map(multiAppAuthors.map((a) => [a.author, a.rank]))

export const allAuthors: Map<string, AuthorPageData> = (() => {
  const map = new Map<string, AuthorPageData>()

  for (const page of pages) {
    const existing = map.get(page.author)
    if (existing) {
      existing.apps.push(page)
      if (!existing.facebook && page.facebook) {
        existing.facebook = page.facebook
      }
      if (page.category && !existing.categories.includes(page.category)) {
        existing.categories.push(page.category)
      }
    } else {
      map.set(page.author, {
        author: page.author,
        slug: toAuthorSlug(page.author),
        facebook: page.facebook,
        apps: [page],
        categories: page.category ? [page.category] : [],
        rank: rankByAuthor.get(page.author),
      })
    }
  }

  return map
})()

const slugIndex = new Map<string, AuthorPageData>()
for (const data of allAuthors.values()) {
  slugIndex.set(data.slug, data)
}

export function getAuthorBySlug(slug: string): AuthorPageData | undefined {
  return slugIndex.get(slug)
}
