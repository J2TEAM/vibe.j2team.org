import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { pages, pageComponents } from '@/data/pages-loader'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
  }
}

const HomePage = () => import('@/views/HomePage.vue')
const ContentPolicy = () => import('@/views/ContentPolicy.vue')
const LeaderboardPage = () => import('@/views/LeaderboardPage.vue')
const BookmarksPage = () => import('@/views/BookmarksPage.vue')
const NotFound = () => import('@/views/NotFound.vue')

const pageRoutes: RouteRecordRaw[] = pages.map((page) => {
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
    },
  }
})

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
    ...pageRoutes,
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
      path: '/content-policy',
      name: 'content-policy',
      component: ContentPolicy,
      meta: {
        title: 'Chính sách nội dung - vibe.j2team.org',
        description: 'Chính sách nội dung cho các trang con trên vibe.j2team.org.',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: {
        title: '404 - Không tìm thấy trang | vibe.j2team.org',
        description: 'Trang bạn tìm không tồn tại.',
      },
    },
  ],
})

router.onError((error, to) => {
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
})

export default router
