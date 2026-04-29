import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import type { PageInfo } from '@/types/page'
import { createPinia, setActivePinia } from 'pinia'

type HandleChunkError = (typeof import('@/router/index'))['handleChunkError']
type Router = (typeof import('@/router/index'))['default']

const testPages: PageInfo[] = vi.hoisted(() => [
  {
    path: '/test-app',
    name: 'Test App',
    author: 'Alice',
    description: 'A test app',
    category: 'game' as const,
  },
  {
    path: '/another-app',
    name: 'Another App',
    author: 'Bob',
    description: 'Another app',
    category: 'game' as const,
    showToolbar: false,
  },
])

vi.mock('@/data/pages-loader', () => ({
  pageComponents: {
    '/src/views/test-app/index.vue': () => Promise.resolve({ default: {} }),
    // /another-app intentionally missing to test fallback
  },
}))

vi.mock('@/stores/usePagesStore', () => {
  return {
    usePagesStore: () => ({
      pages: testPages,
      featuredPages: testPages.filter((p: PageInfo) => p.featured),
      pageByPath: new Map(testPages.map((p: PageInfo) => [p.path, p])),
      isReady: { value: true },
      init: () => Promise.resolve(),
    }),
    getPagesCacheSync: () => testPages,
    fetchRawPages: () => Promise.resolve(testPages),
  }
})

let router: Router
let handleChunkError: HandleChunkError

beforeAll(async () => {
  setActivePinia(createPinia())
  const mod = await import('@/router/index')
  router = mod.default
  handleChunkError = mod.handleChunkError

  // Trigger the beforeEach guard to load dynamic routes
  router.push('/test-app')
  await router.isReady()
})

describe('pageRoutes generation', () => {
  it('creates routes for pages with correct path and meta', () => {
    const route = router.getRoutes().find((r) => r.path === '/test-app')
    expect(route).toBeDefined()
    expect(route!.name).toBe('test-app')
    expect(route!.meta).toMatchObject({
      title: 'Test App - vibe.j2team.org',
      description: 'A test app',
      author: 'Alice',
      showToolbar: true,
      pagePath: '/test-app',
    })
  })

  it('respects showToolbar: false', () => {
    const route = router.getRoutes().find((r) => r.path === '/another-app')
    expect(route!.meta.showToolbar).toBe(false)
  })

  it('meta.title follows "name - vibe.j2team.org" pattern', () => {
    const route = router.getRoutes().find((r) => r.path === '/test-app')
    expect(route!.meta.title).toBe('Test App - vibe.j2team.org')
  })
})

describe('static routes', () => {
  const expectedRoutes = [
    { name: 'home', path: '/' },
    { name: 'leaderboard', path: '/leaderboard' },
    { name: 'bookmarks', path: '/bookmarks' },
    { name: 'author', path: '/author/:slug' },
    { name: 'content-policy', path: '/content-policy' },
    { name: 'not-found', path: '/:pathMatch(.*)*' },
  ]

  it.each(expectedRoutes)('has $name route at $path', ({ name, path }) => {
    const route = router.getRoutes().find((r) => r.name === name)
    expect(route).toBeDefined()
    expect(route!.path).toBe(path)
  })
})

describe('scrollBehavior', () => {
  it('returns element selector when route has hash', () => {
    const scrollBehavior = router.options.scrollBehavior!
    const to = { hash: '#section-1' } as RouteLocationNormalized
    const from = {} as RouteLocationNormalized
    const result = scrollBehavior(to, from, null)
    expect(result).toEqual({ el: '#section-1', behavior: 'smooth' })
  })

  it('returns savedPosition when available', () => {
    const scrollBehavior = router.options.scrollBehavior!
    const to = { hash: '' } as RouteLocationNormalized
    const from = {} as RouteLocationNormalized
    const saved = { left: 0, top: 150 }
    const result = scrollBehavior(to, from, saved)
    expect(result).toEqual({ left: 0, top: 150 })
  })

  it('returns { top: 0 } as default', () => {
    const scrollBehavior = router.options.scrollBehavior!
    const to = { hash: '' } as RouteLocationNormalized
    const from = {} as RouteLocationNormalized
    const result = scrollBehavior(to, from, null)
    expect(result).toEqual({ top: 0 })
  })
})

describe('handleChunkError', () => {
  let savedHref: string

  beforeEach(() => {
    sessionStorage.clear()
    savedHref = window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: savedHref },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: savedHref },
    })
  })

  it('reloads on "Failed to fetch dynamically imported module"', () => {
    const error = new Error('Failed to fetch dynamically imported module: /src/views/app/index.vue')
    handleChunkError(error, { fullPath: '/app' })
    expect(window.location.href).toBe('/app')
  })

  it('reloads on "Importing a module script failed"', () => {
    const error = new Error('Importing a module script failed')
    handleChunkError(error, { fullPath: '/app2' })
    expect(window.location.href).toBe('/app2')
  })

  it('reloads on ChunkLoadError', () => {
    const error = new Error('Loading chunk failed')
    error.name = 'ChunkLoadError'
    handleChunkError(error, { fullPath: '/app3' })
    expect(window.location.href).toBe('/app3')
  })

  it('does NOT reload on unrelated errors', () => {
    const error = new Error('Some random error')
    handleChunkError(error, { fullPath: '/app4' })
    expect(window.location.href).not.toBe('/app4')
  })

  it('does NOT reload if sessionStorage already has the reload key', () => {
    sessionStorage.setItem('chunk-reload:/app5', '1')
    const error = new Error('Failed to fetch dynamically imported module')
    handleChunkError(error, { fullPath: '/app5' })
    expect(window.location.href).not.toBe('/app5')
  })

  it('sets sessionStorage key before reload', () => {
    const error = new Error('Failed to fetch dynamically imported module')
    handleChunkError(error, { fullPath: '/app6' })
    expect(sessionStorage.getItem('chunk-reload:/app6')).toBe('1')
  })
})
