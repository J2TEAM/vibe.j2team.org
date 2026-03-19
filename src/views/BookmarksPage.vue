<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { refDebounced } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { pageByPath } from '@/data/pages-loader'
import type { CategoryId } from '@/data/categories'
import { normalize } from '@/utils/text'
import { useSearchShortcut } from '@/composables/useSearchShortcut'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useRecentlyViewedStore } from '@/stores/useRecentlyViewedStore'
import { useDraggable } from '@/composables/useDraggable'
import PageCard from '@/components/PageCard.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'

const favoritesStore = useFavoritesStore()
const { favoritePaths } = storeToRefs(favoritesStore)
const recentlyViewedStore = useRecentlyViewedStore()
const { recentPages } = storeToRefs(recentlyViewedStore)
const { clearHistory } = recentlyViewedStore
const { dragIndex, overIndex, onDragStart, onDragOver, onDrop, onDragEnd } =
  useDraggable(favoritePaths)

const isReordering = ref(false)

function toggleReorder() {
  isReordering.value = !isReordering.value
}

const bookmarkedPages = computed(() => {
  return favoritePaths.value.flatMap((path) => {
    const p = pageByPath.get(path)
    return p ? [p] : []
  })
})

// --- Search & Category Filter ---

const searchQuery = ref('')
const debouncedQuery = refDebounced(searchQuery, 300)
const activeCategory = ref<CategoryId | null>(null)
const categoryFilterRef = ref<InstanceType<typeof CategoryFilter> | null>(null)

const isFiltering = computed(() => {
  return searchQuery.value.trim() !== '' || activeCategory.value !== null
})

const bookmarkCategoryCounts = computed(() => {
  const counts: Partial<Record<CategoryId, number>> = {}
  for (const page of bookmarkedPages.value) {
    if (page.category) {
      counts[page.category] = (counts[page.category] || 0) + 1
    }
  }
  return counts
})

const filteredBookmarks = computed(() => {
  const query = normalize(debouncedQuery.value.trim())
  const category = activeCategory.value

  return bookmarkedPages.value.filter((page) => {
    if (category && page.category !== category) return false
    if (query) {
      return (
        normalize(page.name).includes(query) ||
        normalize(page.description).includes(query) ||
        normalize(page.author).includes(query)
      )
    }
    return true
  })
})

const searchInputRef = computed(() => categoryFilterRef.value?.searchInputRef ?? null)

useSearchShortcut(searchInputRef)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <!-- Header -->
      <h1
        class="font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Yêu thích
        <span
          v-if="bookmarkedPages.length > 0"
          class="ml-1 inline-flex items-center justify-center rounded-full bg-accent-coral/10 px-3 py-0.5 text-sm font-medium text-accent-coral"
        >
          {{ bookmarkedPages.length }}
        </span>
      </h1>
      <p class="mt-4 text-text-secondary">
        Các ứng dụng bạn đã đánh dấu yêu thích, lưu ngay trên trình duyệt.
      </p>

      <!-- Bookmarked apps grid -->
      <div v-if="bookmarkedPages.length > 0">
        <!-- Search & Filter (hidden during reorder) -->
        <CategoryFilter
          v-if="!isReordering"
          ref="categoryFilterRef"
          v-model:search="searchQuery"
          v-model:category="activeCategory"
          :total-count="bookmarkedPages.length"
          :category-counts="bookmarkCategoryCounts"
          :result-count="filteredBookmarks.length"
          class="mt-12"
        />

        <!-- Toolbar -->
        <div class="mt-5 mb-5 flex items-center justify-between gap-4 min-h-[1.75rem]">
          <p
            v-if="isReordering"
            class="text-xs text-text-dim font-display tracking-wide animate-fade-up"
          >
            <Icon icon="lucide:grip-vertical" class="inline w-3.5 h-3.5 -mt-0.5 mr-1" />
            Kéo thả để sắp xếp lại thứ tự
          </p>
          <span v-else />

          <!-- Toggle (hidden when filtering) -->
          <button
            v-if="!isFiltering"
            @click="toggleReorder"
            role="switch"
            :aria-checked="isReordering"
            class="flex items-center gap-2 text-xs font-display tracking-wide transition-colors duration-200 select-none"
            :class="isReordering ? 'text-accent-coral' : 'text-text-dim hover:text-text-secondary'"
          >
            Sắp xếp
            <span
              class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200"
              :class="
                isReordering
                  ? 'border-accent-coral bg-accent-coral/20'
                  : 'border-border-default bg-bg-surface'
              "
            >
              <span
                class="inline-block h-3 w-3 rounded-full transition-all duration-200"
                :class="
                  isReordering ? 'translate-x-[18px] bg-accent-coral' : 'translate-x-1 bg-text-dim'
                "
              />
            </span>
          </button>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(page, index) in isReordering ? bookmarkedPages : filteredBookmarks"
            :key="page.path"
            :draggable="isReordering"
            @dragstart="isReordering && onDragStart($event, index)"
            @dragover="isReordering && onDragOver($event, index)"
            @drop="isReordering && onDrop($event, index)"
            @dragend="isReordering && onDragEnd()"
            class="group relative transition-all duration-150"
            :class="{
              'cursor-grab active:cursor-grabbing': isReordering,
              'opacity-40 scale-95': isReordering && dragIndex === index,
              'ring-2 ring-accent-coral':
                isReordering && overIndex === index && dragIndex !== index,
            }"
          >
            <Icon
              v-if="isReordering"
              icon="lucide:grip-vertical"
              class="absolute top-3 left-3 z-10 w-4 h-4 text-text-dim opacity-50 pointer-events-none"
            />

            <PageCard
              :page="page"
              :disabled="isReordering"
              always-visible-favorite
              class="h-full"
            />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="mt-12 flex flex-col items-center justify-center py-16 text-center">
        <Icon icon="lucide:heart" class="w-16 h-16 text-text-dim mb-6" />
        <p class="text-text-secondary text-lg font-display">Chưa có ứng dụng yêu thích</p>
        <p class="mt-2 text-text-dim text-sm">
          Nhấn vào biểu tượng
          <Icon icon="lucide:heart" class="inline w-4 h-4 text-text-dim -mt-0.5" />
          trên mỗi ứng dụng ở trang chủ để thêm vào đây.
        </p>
        <RouterLink
          to="/"
          class="mt-8 inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm font-display text-accent-coral tracking-wide transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
        >
          Khám phá ứng dụng
        </RouterLink>
      </div>

      <!-- Recently viewed -->
      <div v-if="recentPages.length > 0" class="mt-16">
        <div class="flex items-center justify-between mb-5">
          <h2
            class="font-display text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Xem gần đây
            <span
              class="ml-1 inline-flex items-center justify-center rounded-full bg-accent-coral/10 px-3 py-0.5 text-sm font-medium text-accent-coral"
            >
              {{ recentPages.length }}
            </span>
          </h2>
          <button
            class="flex items-center gap-1.5 text-xs font-display tracking-wide text-text-dim hover:text-accent-coral transition-colors duration-200"
            @click="clearHistory"
          >
            <Icon icon="lucide:trash-2" class="w-3.5 h-3.5" />
            Xóa lịch sử
          </button>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PageCard
            v-for="page in recentPages"
            :key="page.path"
            :page="page"
            always-visible-favorite
          />
        </div>
      </div>

      <!-- Back to home -->
      <RouterLink
        to="/"
        class="mt-16 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
    </div>
  </div>
</template>
