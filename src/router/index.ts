import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { pageComponents } from '@/data/pages-loader'
import { usePagesStore } from '@/stores/usePagesStore'
import { useRecentlyViewedStore } from '@/stores/useRecentlyViewedStore'
import type { PageInfo } from '@/types/page'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    author?: string
    showToolbar?: boolean
    pagePath?: string
  }
}

const HomePage = () => import('@/views/HomePage.vue')
const ContentPolicy = () => import('@/views/ContentPolicy.vue')
const TermsOfService = () => import('@/views/TermsOfService.vue')
const PrivacyPolicy = () => import('@/views/PrivacyPolicy.vue')
const LeaderboardPage = () => import('@/views/LeaderboardPage.vue')
const BookmarksPage = () => import('@/views/BookmarksPage.vue')
const AuthorPage = () => import('@/views/AuthorPage.vue')
const MembersPage = () => import('@/views/MembersPage.vue')
const ContributorsPage = () => import('@/views/ContributorsPage.vue')
const CategoryPage = () => import('@/views/CategoryPage.vue')
const NotFound = () => import('@/views/NotFound.vue')

function buildPageRoutes(pages: PageInfo[]): RouteRecordRaw[] {
  return pages.map((page) => {
    const componentPath = `/src/views${page.path}/index.vue`
    const loader = pageComponents[componentPath]
    if (!loader) {
      console.warn(`[router] No component found for page "${page.name}" at ${componentPath}`)
    }
    return {
      path: page.path,
      name: page.path.slice(1),
      component: loader ? () => loader() : NotFound,
      meta: {
        title: `${page.name} - vibe.j2team.org`,
        description: page.description,
        author: page.author,
        showToolbar: page.showToolbar !== false,
        pagePath: page.path,
      },
    }
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (_to, _from, savedPosition) => {
    if (_to.hash) {
      return { el: _to.hash, behavior: 'smooth' }
    }
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        title: 'vibe.j2team.org - J2TEAM Community Vibe Coding',
        description:
          'Cả nhóm J2TEAM Community vibe code cùng nhau! Mỗi thành viên tạo một trang con, vibe code thoải mái.',
      },
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: LeaderboardPage,
      meta: {
        title: 'Bảng xếp hạng tác giả - vibe.j2team.org',
        description: 'Bảng xếp hạng các tác giả đóng góp nhiều ứng dụng nhất trên vibe.j2team.org.',
      },
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: BookmarksPage,
      meta: {
        title: 'Yêu thích - vibe.j2team.org',
        description: 'Danh sách các ứng dụng yêu thích của bạn.',
      },
    },
    {
      path: '/members',
      name: 'members',
      component: MembersPage,
      meta: {
        title: 'Thành viên - vibe.j2team.org',
        description: 'Danh sách tất cả thành viên đóng góp trên vibe.j2team.org.',
      },
    },
    {
      path: '/contributors',
      name: 'contributors',
      component: ContributorsPage,
      meta: {
        title: 'Cộng đồng đóng góp - vibe.j2team.org',
        description:
          'Khám phá cộng đồng những người đóng góp trên vibe.j2team.org qua không gian 3D.',
      },
    },
    {
      path: '/category/:id',
      name: 'category',
      component: CategoryPage,
      meta: {
        title: 'Danh mục - vibe.j2team.org',
        description: 'Khám phá các ứng dụng theo danh mục trên vibe.j2team.org.',
      },
    },
    {
      path: '/author/:slug',
      name: 'author',
      component: AuthorPage,
      meta: {
        title: 'Tác giả - vibe.j2team.org',
        description: 'Trang cá nhân tác giả trên vibe.j2team.org.',
      },
    },
    {
      path: '/content-policy',
      name: 'content-policy',
      component: ContentPolicy,
      meta: {
        title: 'Chính sách nội dung - vibe.j2team.org',
        description: 'Chính sách nội dung cho các trang con trên vibe.j2team.org.',
      },
    },
    {
      path: '/terms',
      name: 'terms',
      component: TermsOfService,
      meta: {
        title: 'Điều khoản sử dụng - vibe.j2team.org',
        description: 'Điều khoản sử dụng trang web vibe.j2team.org.',
      },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: PrivacyPolicy,
      meta: {
        title: 'Chính sách bảo mật - vibe.j2team.org',
        description: 'Chính sách bảo mật và quyền riêng tư trên vibe.j2team.org.',
      },
    },
    // 404 catch-all is added AFTER dynamic page routes in the beforeEach guard
  ],
})

// One-time guard: fetch pages, add dynamic routes, then let navigation proceed
let pagesInitialized = false

router.beforeEach(async (to) => {
  if (!pagesInitialized) {
    const store = usePagesStore()
    await store.init()

    for (const route of buildPageRoutes(store.pages)) {
      router.addRoute(route)
    }

    // Add 404 catch-all LAST so it doesn't swallow page routes
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: {
        title: '404 - Không tìm thấy trang | vibe.j2team.org',
        description: 'Trang bạn tìm không tồn tại.',
      },
    })

    pagesInitialized = true

    // Only redirect if this URL didn't match any static route (needs re-evaluation)
    if (to.matched.length === 0) {
      return to.fullPath
    }
  }
})

export function handleChunkError(error: Error, to: { fullPath: string }) {
  const isChunkError =
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed') ||
    error.name === 'ChunkLoadError'

  if (!isChunkError) return

  // Prevent infinite reload loop: only retry once per path
  const reloadKey = `chunk-reload:${to.fullPath}`
  if (sessionStorage.getItem(reloadKey)) return
  sessionStorage.setItem(reloadKey, '1')

  // Full page reload to get fresh assets after new deployment
  window.location.href = to.fullPath
}

router.afterEach((to) => {
  const pagePath = to.meta.pagePath
  if (typeof pagePath !== 'string') return
  useRecentlyViewedStore().addVisit(pagePath)
})

router.onError((error, to) => {
  if (!to) return
  handleChunkError(error, to)
})

export default router
