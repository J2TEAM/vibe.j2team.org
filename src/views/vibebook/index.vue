<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { usePagesStore } from '@/stores/usePagesStore'
import { categories, type CategoryId } from '@/data/categories'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useRecentlyViewedStore } from '@/stores/useRecentlyViewedStore'
import PostCard from './components/PostCard.vue'
import PostSkeleton from './components/PostSkeleton.vue'
import GiscusComments from './components/GiscusComments.vue'

const router = useRouter()
const PAGE_SIZE = 10

// ============ Favorites ============
const favoritesStore = useFavoritesStore()
const { favoritePaths } = storeToRefs(favoritesStore)
const { toggleFavorite, isFavorite } = favoritesStore

// ============ Recently Viewed ============
const recentlyViewedStore = useRecentlyViewedStore()
const { recentEntries } = storeToRefs(recentlyViewedStore)
const { addVisit } = recentlyViewedStore

// ============ Tabs ============
type TabId = 'all' | 'recent' | 'favorites'
const activeTab = ref<TabId>('all')

const recentPaths = computed(() => new Set(recentEntries.value.map((e) => e.path)))

// Filter state
const searchQuery = ref('')
const selectedCategory = ref<CategoryId | ''>('')

// Get all pages (no hidden)
const pagesStore = usePagesStore()

const allPages = computed(() => pagesStore.pages.filter((p) => !p.hidden))

// Filtered pages
const filteredPages = computed(() => {
  let result = allPages.value

  // Filter by tab
  if (activeTab.value === 'recent') {
    result = result.filter((p) => recentPaths.value.has(p.path))
  } else if (activeTab.value === 'favorites') {
    result = result.filter((p) => favoritePaths.value.includes(p.path))
  }

  // Filter by category
  if (selectedCategory.value) {
    result = result.filter((p) => p.category === selectedCategory.value)
  }

  // Filter by search (name, description, author)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.author.toLowerCase().includes(query),
    )
  }

  return result
})

// Pagination
const visibleCount = ref(PAGE_SIZE)
const visiblePosts = computed(() => filteredPages.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filteredPages.value.length)

// Infinite scroll
const loadMoreTrigger = ref<HTMLElement | null>(null)
const isLoading = ref(false)

useIntersectionObserver(
  loadMoreTrigger,
  ([entry]) => {
    if (entry?.isIntersecting && hasMore.value && !isLoading.value) {
      loadMore()
    }
  },
  { rootMargin: '200px' },
)

function loadMore() {
  isLoading.value = true
  setTimeout(() => {
    visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, filteredPages.value.length)
    isLoading.value = false
  }, 300)
}

// Reset pagination when filters change
function handleFilterChange() {
  visibleCount.value = PAGE_SIZE
}

// Reset when tab changes
function handleTabChange() {
  visibleCount.value = PAGE_SIZE
}

function goHome() {
  router.push('/')
}

// Giscus modal
const showComments = ref(false)
const selectedPath = ref('')

function openComments(path: string) {
  selectedPath.value = path
  showComments.value = true
}

function closeComments() {
  showComments.value = false
}

function handleToggleFavorite(path: string) {
  toggleFavorite(path)
}

function handleViewPost(path: string) {
  addVisit(path)
}

function handleRemoveFromHistory(path: string) {
  recentEntries.value = recentEntries.value.filter((e) => e.path !== path)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep">
    <!-- Header -->
    <header class="bg-bg-surface border-b border-border-default sticky top-0 z-30">
      <div class="max-w-xl mx-auto px-4 py-3 space-y-3">
        <!-- Top row: Home + Title -->
        <div class="flex items-center justify-between">
          <h1 class="font-display font-bold text-xl text-text-primary flex items-center gap-2">
            <Icon icon="lucide:book-open" class="w-6 h-6 text-accent-coral shrink-0" />
            <span class="translate-y-px">VibeBook</span>
          </h1>
          <button
            class="flex items-center justify-center w-9 h-9 rounded border border-border-default hover:bg-bg-deep hover:border-accent-coral transition-colors"
            title="Về trang chủ"
            @click="goHome"
          >
            <Icon icon="lucide:home" class="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-bg-deep p-1">
          <button
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-sm font-medium transition-colors"
            :class="
              activeTab === 'all'
                ? 'bg-bg-surface text-text-primary shadow'
                : 'text-text-secondary hover:text-text-primary'
            "
            @click="((activeTab = 'all'), handleTabChange())"
          >
            <Icon icon="lucide:layout-grid" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">Tất cả</span>
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-sm font-medium transition-colors"
            :class="
              activeTab === 'recent'
                ? 'bg-bg-surface text-text-primary shadow'
                : 'text-text-secondary hover:text-text-primary'
            "
            @click="((activeTab = 'recent'), handleTabChange())"
          >
            <Icon icon="lucide:clock" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">Đã xem</span>
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-sm font-medium transition-colors"
            :class="
              activeTab === 'favorites'
                ? 'bg-bg-surface text-text-primary shadow'
                : 'text-text-secondary hover:text-text-primary'
            "
            @click="((activeTab = 'favorites'), handleTabChange())"
          >
            <Icon icon="lucide:heart" class="w-4 h-4 shrink-0" />
            <span class="translate-y-px">Đã lưu</span>
          </button>
        </div>

        <!-- Filter row: Search + Category -->
        <div class="flex gap-2">
          <!-- Search -->
          <div class="flex-1 relative min-w-0">
            <Icon
              icon="lucide:search"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm..."
              class="w-full pl-9 pr-3 py-2 bg-bg-deep border border-border-default text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-accent-coral"
              @input="handleFilterChange"
            />
          </div>

          <!-- Category filter -->
          <div class="relative flex-shrink-0">
            <select
              v-model="selectedCategory"
              class="w-full px-3 py-2 pr-8 bg-bg-deep border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-coral cursor-pointer appearance-none"
              @change="handleFilterChange"
            >
              <option value="">Tất cả</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.label }}
              </option>
            </select>
            <Icon
              icon="lucide:chevron-down"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Feed -->
    <main class="max-w-xl mx-auto px-4 py-6 space-y-4">
      <!-- No results -->
      <div v-if="filteredPages.length === 0" class="text-center py-12 text-text-dim">
        <Icon icon="lucide:search-x" class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Không tìm thấy kết quả nào</p>
      </div>

      <template v-else>
        <PostCard
          v-for="page in visiblePosts"
          :key="page.path"
          :page="page"
          :is-favorite="isFavorite(page.path)"
          :is-in-recent-tab="activeTab === 'recent'"
          @open-comments="openComments(page.path)"
          @view="handleViewPost(page.path)"
          @toggle-favorite="handleToggleFavorite(page.path)"
          @remove-from-history="handleRemoveFromHistory(page.path)"
        />

        <!-- Loading skeleton -->
        <template v-if="isLoading">
          <PostSkeleton />
          <PostSkeleton />
        </template>

        <!-- Load more trigger -->
        <div v-if="hasMore" ref="loadMoreTrigger" class="h-10 flex items-center justify-center">
          <div v-if="isLoading" class="flex items-center gap-2 text-text-dim">
            <Icon icon="lucide:loader-2" class="w-5 h-5 animate-spin" />
            <span class="text-sm">Đang tải thêm...</span>
          </div>
        </div>

        <!-- End of feed -->
        <div v-if="!hasMore && visiblePosts.length > 0" class="text-center py-8 text-text-dim">
          <Icon icon="lucide:check-circle" class="w-8 h-8 mx-auto mb-2" />
          <p>Đã xem hết tất cả!</p>
        </div>
      </template>
    </main>

    <!-- Giscus Comments Modal -->
    <GiscusComments :show="showComments" :page-path="selectedPath" @close="closeComments" />
  </div>
</template>
