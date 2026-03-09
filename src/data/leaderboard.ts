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

export const multiAppAuthors: AuthorStats[] = (() => {
  const map = new Map<string, Omit<AuthorStats, 'rank'>>()

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
        facebook: page.facebook,
        apps: [page],
        categories: page.category ? [page.category] : [],
      })
    }
  }

  const filtered = Array.from(map.values()).filter((a) => a.apps.length >= 2)

  const sorted = filtered.sort((a, b) => {
    if (b.apps.length !== a.apps.length) return b.apps.length - a.apps.length
    return a.author.localeCompare(b.author)
  })

  let currentRank = 1
  return sorted.map((entry, i) => {
    if (i > 0 && entry.apps.length < sorted[i - 1]!.apps.length) {
      currentRank++
    }
    return { ...entry, rank: currentRank }
  })
})()
