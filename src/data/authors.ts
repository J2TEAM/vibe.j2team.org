import type { CategoryId } from '@/data/categories'
import type { PageInfo } from '@/types/page'
import { pages } from '@/data/pages-loader'

export interface AuthorStats {
  author: string
  facebook: string | undefined
  apps: PageInfo[]
  categories: CategoryId[]
  rank: number
}

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

// Single aggregation loop — builds all authors
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
        rank: undefined,
      })
    }
  }

  return map
})()

// Derived from allAuthors — filter, sort, rank
export const multiAppAuthors: AuthorStats[] = (() => {
  const filtered = Array.from(allAuthors.values()).filter((a) => a.apps.length >= 2)

  const sorted = filtered.sort((a, b) => {
    if (b.apps.length !== a.apps.length) return b.apps.length - a.apps.length
    return a.author.localeCompare(b.author)
  })

  let currentRank = 1
  return sorted.map((entry, i) => {
    if (i > 0 && entry.apps.length < sorted[i - 1]!.apps.length) {
      currentRank++
    }
    // Back-fill rank into allAuthors
    entry.rank = currentRank
    return {
      author: entry.author,
      facebook: entry.facebook,
      apps: entry.apps,
      categories: entry.categories,
      rank: currentRank,
    }
  })
})()

const slugIndex = new Map<string, AuthorPageData>()
for (const data of allAuthors.values()) {
  slugIndex.set(data.slug, data)
}

export function getAuthorBySlug(slug: string): AuthorPageData | undefined {
  return slugIndex.get(slug)
}
