import type { CategoryId } from '@/data/categories'
import type { PageInfo } from '@/types/page'
import { getPagesCacheSync } from '@/stores/usePagesStore'

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

// Lazy initialization — computed on first access, not at boot
let _allAuthors: Map<string, AuthorPageData> | null = null
let _multiAppAuthors: AuthorStats[] | null = null
let _slugIndex: Map<string, AuthorPageData> | null = null

function buildAllAuthors(): Map<string, AuthorPageData> {
  if (_allAuthors) return _allAuthors

  const map = new Map<string, AuthorPageData>()

  for (const page of getPagesCacheSync()) {
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

  _allAuthors = map
  return map
}

function buildMultiAppAuthors(): AuthorStats[] {
  if (_multiAppAuthors) return _multiAppAuthors

  const allAuthors = buildAllAuthors()
  const filtered = Array.from(allAuthors.values()).filter((a) => a.apps.length >= 2)

  const sorted = filtered.sort((a, b) => {
    if (b.apps.length !== a.apps.length) return b.apps.length - a.apps.length
    return a.author.localeCompare(b.author)
  })

  let currentRank = 1
  _multiAppAuthors = sorted.map((entry, i) => {
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

  return _multiAppAuthors
}

function buildSlugIndex(): Map<string, AuthorPageData> {
  if (_slugIndex) return _slugIndex

  const allAuthors = buildAllAuthors()
  _slugIndex = new Map<string, AuthorPageData>()
  for (const data of allAuthors.values()) {
    _slugIndex.set(data.slug, data)
  }

  return _slugIndex
}

// Public API — same signatures, now lazy
export function getAllAuthors(): Map<string, AuthorPageData> {
  return buildAllAuthors()
}

export function getMultiAppAuthors(): AuthorStats[] {
  return buildMultiAppAuthors()
}

export function getAuthorBySlug(slug: string): AuthorPageData | undefined {
  // Ensure ranks are computed before slug lookup
  buildMultiAppAuthors()
  return buildSlugIndex().get(slug)
}
