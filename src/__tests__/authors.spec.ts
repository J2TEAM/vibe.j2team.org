import { describe, it, expect, vi, beforeAll } from 'vitest'
import type { AuthorPageData, AuthorStats } from '@/data/authors'
import { makePageInfo } from './fixtures/page-fixtures'

type GetAuthorBySlug = (typeof import('@/data/authors'))['getAuthorBySlug']

// Helper to import authors module with custom pages mock
async function importAuthorsWithPages(pages: ReturnType<typeof makePageInfo>[]) {
  vi.resetModules()
  vi.doMock('@/stores/usePagesStore', () => ({
    getPagesCacheSync: () => pages,
    fetchRawPages: () => Promise.resolve(pages),
    usePagesStore: () => ({
      pages: { value: pages },
      featuredPages: { value: pages.filter((p) => p.featured) },
      pageByPath: { value: new Map(pages.map((p) => [p.path, p])) },
      isReady: { value: true },
      init: () => Promise.resolve(),
    }),
  }))
  return import('@/data/authors')
}

describe('allAuthors — single author, single page', () => {
  let allAuthors: Map<string, AuthorPageData>
  let toAuthorSlug: (typeof import('@/data/authors'))['toAuthorSlug']

  beforeAll(async () => {
    const mod = await importAuthorsWithPages([
      makePageInfo({
        path: '/app-1',
        name: 'App 1',
        author: 'Alice',
        category: 'game',
        facebook: 'alice.fb',
      }),
    ])
    allAuthors = mod.getAllAuthors()
    toAuthorSlug = mod.toAuthorSlug
  })

  it('creates one entry with correct fields', () => {
    expect(allAuthors.size).toBe(1)
    const alice = allAuthors.get('Alice')
    expect(alice).toBeDefined()
    expect(alice!.slug).toBe('alice')
    expect(alice!.apps).toHaveLength(1)
    expect(alice!.categories).toEqual(['game'])
    expect(alice!.facebook).toBe('alice.fb')
  })

  describe('toAuthorSlug', () => {
    it('lowercases and replaces spaces with hyphens', () => {
      expect(toAuthorSlug('Nguyen Van A')).toBe('nguyen-van-a')
    })

    it('collapses multiple consecutive spaces into single hyphens', () => {
      expect(toAuthorSlug('Foo  Bar   Baz')).toBe('foo-bar-baz')
    })

    it('handles single-word lowercase name', () => {
      expect(toAuthorSlug('alice')).toBe('alice')
    })
  })
})

describe('allAuthors — same author, multiple pages', () => {
  let allAuthors: Map<string, AuthorPageData>

  beforeAll(async () => {
    const mod = await importAuthorsWithPages([
      makePageInfo({ path: '/a1', name: 'A1', author: 'Bob', category: 'game' }),
      makePageInfo({
        path: '/a2',
        name: 'A2',
        author: 'Bob',
        category: 'tool',
        facebook: 'bob.fb',
      }),
      makePageInfo({ path: '/a3', name: 'A3', author: 'Bob', category: 'game' }),
    ])
    allAuthors = mod.getAllAuthors()
  })

  it('aggregates apps under one author', () => {
    const bob = allAuthors.get('Bob')
    expect(bob!.apps).toHaveLength(3)
  })

  it('deduplicates categories', () => {
    const bob = allAuthors.get('Bob')
    expect(bob!.categories).toEqual(['game', 'tool'])
  })

  it('picks up facebook from first page that has it', () => {
    const bob = allAuthors.get('Bob')
    expect(bob!.facebook).toBe('bob.fb')
  })
})

describe('allAuthors — multiple authors', () => {
  let allAuthors: Map<string, AuthorPageData>

  beforeAll(async () => {
    const mod = await importAuthorsWithPages([
      makePageInfo({ path: '/x1', name: 'X1', author: 'Alice' }),
      makePageInfo({ path: '/x2', name: 'X2', author: 'Bob' }),
    ])
    allAuthors = mod.getAllAuthors()
  })

  it('creates separate entries per author', () => {
    expect(allAuthors.size).toBe(2)
    expect(allAuthors.has('Alice')).toBe(true)
    expect(allAuthors.has('Bob')).toBe(true)
  })
})

describe('multiAppAuthors ranking', () => {
  let multiAppAuthors: AuthorStats[]

  beforeAll(async () => {
    const mod = await importAuthorsWithPages([
      // Charlie: 3 apps
      makePageInfo({ path: '/c1', name: 'C1', author: 'Charlie' }),
      makePageInfo({ path: '/c2', name: 'C2', author: 'Charlie' }),
      makePageInfo({ path: '/c3', name: 'C3', author: 'Charlie' }),
      // Alice: 2 apps
      makePageInfo({ path: '/a1', name: 'A1', author: 'Alice' }),
      makePageInfo({ path: '/a2', name: 'A2', author: 'Alice' }),
      // Bob: 2 apps (tied with Alice)
      makePageInfo({ path: '/b1', name: 'B1', author: 'Bob' }),
      makePageInfo({ path: '/b2', name: 'B2', author: 'Bob' }),
      // Dave: 1 app (should be filtered out)
      makePageInfo({ path: '/d1', name: 'D1', author: 'Dave' }),
    ])
    multiAppAuthors = mod.getMultiAppAuthors()
  })

  it('filters out authors with fewer than 2 apps', () => {
    const names = multiAppAuthors.map((a) => a.author)
    expect(names).not.toContain('Dave')
    expect(multiAppAuthors).toHaveLength(3)
  })

  it('sorts by app count desc, then name alphabetically', () => {
    const names = multiAppAuthors.map((a) => a.author)
    expect(names).toEqual(['Charlie', 'Alice', 'Bob'])
  })

  it('assigns tied ranks correctly', () => {
    const ranks = multiAppAuthors.map((a) => ({ author: a.author, rank: a.rank }))
    expect(ranks).toEqual([
      { author: 'Charlie', rank: 1 },
      { author: 'Alice', rank: 2 },
      { author: 'Bob', rank: 2 },
    ])
  })
})

describe('getAuthorBySlug', () => {
  let getAuthorBySlug: GetAuthorBySlug

  beforeAll(async () => {
    const mod = await importAuthorsWithPages([
      makePageInfo({ path: '/x1', name: 'X1', author: 'Tran Van C' }),
    ])
    getAuthorBySlug = mod.getAuthorBySlug
  })

  it('returns author data for valid slug', () => {
    const author = getAuthorBySlug('tran-van-c')
    expect(author).toBeDefined()
    expect(author!.author).toBe('Tran Van C')
  })

  it('returns undefined for unknown slug', () => {
    expect(getAuthorBySlug('nonexistent')).toBeUndefined()
  })
})
