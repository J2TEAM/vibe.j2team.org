<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useFileDialog, useTimeoutFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { usePagesStore } from '@/stores/usePagesStore'
import { useSearchShortcut } from '@/composables/useSearchShortcut'
import { useFilteredList } from '@/composables/useFilteredList'
import { useFavoritesStore } from '@/stores/useFavoritesStore'
import { useRecentlyViewedStore } from '@/stores/useRecentlyViewedStore'
import { useDraggable } from '@/composables/useDraggable'
import PageCard from '@/components/PageCard.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

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

const pagesStore = usePagesStore()

const bookmarkedPages = computed(() => {
  return favoritePaths.value.flatMap((path) => {
    const p = pagesStore.pageByPath.get(path)
    return p ? [p] : []
  })
})

// --- Search & Category Filter ---

const {
  searchQuery,
  activeCategory,
  isFiltering,
  filteredList: filteredBookmarks,
  categoryCounts: bookmarkCategoryCounts,
} = useFilteredList({
  items: bookmarkedPages,
  searchFields: ['name', 'description', 'author'],
  categoryField: 'category',
})

const categoryFilterRef = ref<InstanceType<typeof CategoryFilter> | null>(null)
const searchInputRef = computed(() => categoryFilterRef.value?.searchInputRef ?? null)

useSearchShortcut(searchInputRef)

// --- Export / Import ---

const importStatus = ref('')
const { start: clearStatus } = useTimeoutFn(
  () => {
    importStatus.value = ''
  },
  3000,
  { immediate: false },
)

const { open: openFileDialog, onChange: onFileChange } = useFileDialog({
  accept: '.json',
  multiple: false,
  reset: true,
})

onFileChange(async (files) => {
  const file = files?.[0]
  if (!file) return

  const result = await favoritesStore.importFavorites(file)
  if ('error' in result) {
    importStatus.value = result.error
  } else if (result.added === 0) {
    importStatus.value = 'Tất cả đã có trong danh sách'
  } else {
    importStatus.value = `Đã thêm ${result.added} mục`
  }
  clearStatus()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <AppBreadcrumb :items="[{ label: 'Yêu thích' }]" />

      <!-- Header -->
      <h1
        class="mt-8 font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
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
          <div class="flex items-center gap-3">
            <p
              v-if="isReordering"
              class="text-xs text-text-dim font-display tracking-wide animate-fade-up"
            >
              <Icon icon="lucide:grip-vertical" class="inline w-3.5 h-3.5 -mt-0.5 mr-1" />
              Kéo thả để sắp xếp lại thứ tự
            </p>
            <template v-else-if="!isFiltering">
              <button
                class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-display tracking-wide border border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral transition-colors duration-200"
                @click="favoritesStore.exportFavorites()"
              >
                <Icon icon="lucide:download" class="w-3.5 h-3.5" />
                Xuất
              </button>
              <button
                class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-display tracking-wide border border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky transition-colors duration-200"
                @click="openFileDialog()"
              >
                <Icon icon="lucide:upload" class="w-3.5 h-3.5" />
                Nhập
              </button>
              <span
                v-if="importStatus"
                class="text-xs text-accent-amber font-display tracking-wide animate-fade-up"
              >
                {{ importStatus }}
              </span>
            </template>
          </div>

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
        <div class="mt-8 flex items-center gap-4">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm font-display text-accent-coral tracking-wide transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
          >
            Khám phá ứng dụng
          </RouterLink>
          <button
            class="inline-flex items-center gap-2 border border-accent-sky bg-accent-sky/10 px-5 py-2.5 text-sm font-display text-accent-sky tracking-wide transition-all duration-300 hover:bg-accent-sky hover:text-bg-deep"
            @click="openFileDialog()"
          >
            <Icon icon="lucide:upload" class="w-4 h-4" />
            Nhập từ file
          </button>
        </div>
        <p
          v-if="importStatus"
          class="mt-4 text-xs text-accent-amber font-display tracking-wide animate-fade-up"
        >
          {{ importStatus }}
        </p>
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
    </div>
  </div>
</template>
