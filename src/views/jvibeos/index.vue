<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import type { CategoryId } from '@/data/categories'
import { processPages, type AppItem } from './composables/useApps'
import JViBeOSHeader from './components/JViBeOSHeader.vue'
import JViBeOSCard from './components/JViBeOSCard.vue'
import meta from './meta'

const route = useRoute()

// Query params
const appParam = computed(() => route.query.app as string | undefined)
const authorParam = computed(() => route.query.author as string | undefined)
const rankingParam = computed(() => route.query.ranking !== undefined)

// Dynamic import sub-components (like mirror)
const ViewPage = defineAsyncComponent(() => import('./view/index.vue'))
const AuthorPage = defineAsyncComponent(() => import('./author/index.vue'))
const RankingPage = defineAsyncComponent(() => import('./ranking/index.vue'))

const pagesData = ref<AppItem[]>([])
const isLoading = ref(true)
const currentPage = ref(1)
const isMobile = ref(false)

// 18+ Popup state
const showAgePopup = ref(false)

const verifyAge = (isAdult: boolean) => {
  if (isAdult) {
    localStorage.setItem('jvibeos_age_verified', 'true')
    showAgePopup.value = false
  } else {
    window.location.href = '/'
  }
}

onMounted(() => {
  // Check if user has verified age before
  const hasVerified = localStorage.getItem('jvibeos_age_verified')
  if (!hasVerified) {
    showAgePopup.value = true
  }
})

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const ITEMS_PER_PAGE = computed(() => (isMobile.value ? 10 : 15))

// Fetch pages data
onMounted(async () => {
  const pagesResponse = await fetch('/data/pages.json')
  const rawPages = (await pagesResponse.json()) as {
    name: string
    description: string
    author: string
    path: string
    category: CategoryId
  }[]
  pagesData.value = processPages(rawPages)
  isLoading.value = false
})

const searchQuery = ref('')
const activeCategory = ref<CategoryId | 'all'>('all')

const filteredApps = computed(() => {
  if (!pagesData.value) return []

  let apps: AppItem[] = pagesData.value

  // Filter by category
  if (activeCategory.value !== 'all') {
    apps = apps.filter((app) => app.category === activeCategory.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    apps = apps.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.author.toLowerCase().includes(query),
    )
  }

  return apps
})

// Reset to page 1 when filters change
watch([searchQuery, activeCategory], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredApps.value.length / ITEMS_PER_PAGE.value))

const paginatedApps = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE.value
  return filteredApps.value.slice(start, start + ITEMS_PER_PAGE.value)
})

const handleSearch = (value: string) => {
  searchQuery.value = value
}

const handleCategoryChange = (value: CategoryId | 'all') => {
  activeCategory.value = value
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Generate pagination with ellipsis
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: (number | '...')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) pages.push(i)

    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})
</script>

<template>
  <div class="jvibeos-page">
    <!-- 18+ Age Verification Popup -->
    <Teleport to="body">
      <div v-if="showAgePopup" class="age-popup-overlay">
        <div class="age-popup">
          <h2>Cảnh báo nội dung</h2>
          <p>Trang web này chỉ dành cho người từ 18 tuổi trở lên.</p>
          <p>Bạn có muốn tiếp tục không?</p>
          <div class="age-buttons">
            <button class="age-btn no" @click="verifyAge(false)">Không, tôi chưa 18</button>
            <button class="age-btn yes" @click="verifyAge(true)">Có, tôi đã 18+</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Show sub-pages if query params exist -->
    <template v-if="appParam">
      <ViewPage />
    </template>
    <template v-else-if="authorParam">
      <AuthorPage />
    </template>
    <template v-else-if="rankingParam">
      <RankingPage />
    </template>

    <!-- Home page -->
    <template v-else>
      <JViBeOSHeader
        :model-value="searchQuery"
        :active-category="activeCategory"
        @update:model-value="handleSearch"
        @update:active-category="handleCategoryChange"
      />

      <main class="main-content">
        <div class="content-header">
          <h1 class="page-title">
            {{ activeCategory === 'all' ? 'Tất cả ứng dụng' : activeCategory }}
            <span class="count">({{ filteredApps.length }})</span>
          </h1>
        </div>

        <div v-if="filteredApps.length > 0" class="video-grid">
          <JViBeOSCard v-for="app in paginatedApps" :key="app.path" :app="app" class="fade-in" />
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2>Không tìm thấy kết quả</h2>
          <p>Thử từ khóa khác hoặc chọn danh mục khác</p>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="page-btn prev"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            « Prev
          </button>

          <template v-for="page in visiblePages" :key="page">
            <span v-if="page === '...'" class="page-ellipsis">...</span>
            <button
              v-else
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>

          <button
            class="page-btn next"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next »
          </button>
        </div>
      </main>

      <footer class="jvibeos-footer">
        <a href="/" class="home-btn">Về trang chủ</a>
        <span class="footer-text"
          ><span
            >Parody version of
            <a href="https://vibe.j2team.com" target="_blank" rel="noopener noreferrer"
              >vibe.j2team.com</a
            ></span
          ><span
            >Vibe by
            <a :href="meta.facebook" target="_blank" rel="noopener noreferrer">hidang</a></span
          ></span
        >
      </footer>
    </template>
  </div>
</template>

<style scoped>
.jvibeos-page {
  min-height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.jvibeos-page > main {
  flex: 1;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.content-header {
  margin-bottom: 20px;
}

.page-title {
  font-family: var(--font-display, sans-serif);
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  text-transform: capitalize;
}

.count {
  font-size: 16px;
  color: #666;
  font-weight: 400;
  margin-left: 8px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.video-grid > :deep(.video-card) {
  min-width: 0;
  height: 100%;
  min-height: 150px;
}

.fade-in {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h2 {
  color: #fff;
  margin: 0 0 8px;
  font-size: 20px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.jvibeos-footer {
  padding: 30px 20px;
  border-top: 1px solid #222;
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home-btn {
  display: inline-block;
  padding: 8px 16px;
  background: #ff0000;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  flex-shrink: 0;
}

.home-btn:hover {
  background: #222;
  color: #fff;
}

.footer-text {
  flex: 1;
  text-align: center;
  color: #555;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-text a {
  color: #888;
  text-decoration: none;
}

.footer-text a:hover {
  color: #ff0000;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.page-btn {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  min-width: 42px;
}

.page-btn:hover:not(:disabled) {
  background: #333;
  border-color: #555;
}

.page-btn.active {
  background: #ff0000;
  border-color: #ff0000;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.prev,
.page-btn.next {
  background: #222;
}

.page-ellipsis {
  color: #666;
  padding: 8px 4px;
  font-size: 13px;
}

/* Responsive */
@media (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .video-grid > :deep(.video-card) {
    min-height: 120px;
  }

  .main-content {
    padding: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .jvibeos-footer {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .footer-text {
    text-align: center;
    white-space: normal;
  }
}

/* 18+ Age Popup */
.age-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.age-popup {
  background: #1a1a1a;
  border: 2px solid #ff0000;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
}

.age-popup h2 {
  color: #ff0000;
  font-size: 24px;
  margin: 0 0 16px;
}

.age-popup p {
  color: #aaa;
  margin: 8px 0;
}

.age-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.age-btn {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.age-btn.no {
  background: #333;
  color: #fff;
}

.age-btn.no:hover {
  background: #444;
}

.age-btn.yes {
  background: #ff0000;
  color: #fff;
}

.age-btn.yes:hover {
  background: #cc0000;
}
</style>
