<script setup lang="ts">
import { ref, computed, type Directive } from 'vue'
import { useEventListener, useIntersectionObserver, refDebounced } from '@vueuse/core'
import { RouterLink, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { pages, featuredPages } from '@/data/pages-loader'
import type { PageInfo } from '@/types/page'
import { padIndex } from '@/data/homepage'
import { categories, type CategoryId } from '@/data/categories'
import FavoriteButton from '@/components/FavoriteButton.vue'

const vAnimate: Directive<HTMLElement & { __stopObserve?: () => void }, string | undefined> = {
  mounted(el, binding) {
    if (binding.value) el.style.animationDelay = binding.value
    el.style.opacity = '0'

    const { stop } = useIntersectionObserver(
      el,
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add('animate-fade-up')
          stop()
        }
      },
      { threshold: 0.1 },
    )
    el.__stopObserve = stop
  },
  unmounted(el) {
    el.__stopObserve?.()
  },
}

function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

function normalize(str: string): string {
  return removeAccents(str).toLowerCase()
}

const searchQuery = ref('')
const debouncedQuery = refDebounced(searchQuery, 300)
const activeCategory = ref<CategoryId | null>(null)

const showAll = ref(false)

const isFiltering = computed(() => {
  return searchQuery.value.trim() !== '' || activeCategory.value !== null
})

const hiddenCount = computed(() => pages.length - featuredPages.length)

// Pre-normalize once at module load — avoids re-running NFD + regex on every search/filter change
type NormalizedPage = PageInfo & { _name: string; _desc: string; _author: string }

function toNormalized(p: PageInfo): NormalizedPage {
  return {
    ...p,
    _name: normalize(p.name),
    _desc: normalize(p.description),
    _author: normalize(p.author),
  }
}

const normalizedPages: NormalizedPage[] = pages.map(toNormalized)
const normalizedFeaturedPages: NormalizedPage[] = featuredPages.map(toNormalized)

// Computed only does a cheap pool swap — no normalization work
const searchablePages = computed<NormalizedPage[]>(() =>
  isFiltering.value || showAll.value ? normalizedPages : normalizedFeaturedPages,
)

const filteredPages = computed(() => {
  const query = normalize(debouncedQuery.value.trim())
  const category = activeCategory.value

  return searchablePages.value.filter((page) => {
    if (category) {
      if (page.category !== category) return false
    }

    if (query) {
      return (
        page._name.includes(query) || page._desc.includes(query) || page._author.includes(query)
      )
    }

    return true
  })
})

function toggleCategory(id: CategoryId) {
  activeCategory.value = activeCategory.value === id ? null : id
}

function clearFilters() {
  searchQuery.value = ''
  activeCategory.value = null
}

// pages is a static array — no reactivity needed, compute once
const categoryCounts: Partial<Record<CategoryId, number>> = {}
for (const page of pages) {
  if (page.category) {
    categoryCounts[page.category] = (categoryCounts[page.category] || 0) + 1
  }
}

const activeCategoryObj = computed(
  () => categories.find((c) => c.id === activeCategory.value) ?? null,
)

const isEmptyCategory = computed(
  () => activeCategory.value !== null && !categoryCounts[activeCategory.value],
)

const router = useRouter()

function goToRandom() {
  const list = filteredPages.value
  if (list.length === 0) return
  const randomPage = list[Math.floor(Math.random() * list.length)]
  if (randomPage) router.push(randomPage.path)
}

const searchInputRef = ref<HTMLInputElement | null>(null)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === '/') {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if ((e.target as HTMLElement)?.isContentEditable) return
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

useEventListener(document, 'keydown', handleKeydown)
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 sm:px-6 pb-16 scroll-reveal">
    <h2
      v-animate
      class="font-display text-xl sm:text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3"
    >
      <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
      Các trang đã tạo
      <span
        class="ml-2 inline-flex items-center justify-center rounded-full bg-accent-coral/10 px-3 py-0.5 text-sm font-medium text-accent-coral"
      >
        {{ pages.length }}
      </span>
    </h2>

    <!-- Search & Filter -->
    <div v-animate="'100ms'" class="mb-6 space-y-4">
      <!-- Search input + Random button -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Icon
            icon="lucide:search"
            aria-hidden="true"
            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none"
          />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            placeholder="Tìm theo tên, mô tả hoặc tác giả..."
            class="w-full bg-bg-surface border border-border-default pl-11 pr-12 py-3 text-sm text-text-primary placeholder-text-dim font-body transition-colors duration-200 focus:outline-none focus:border-accent-coral"
          />
          <kbd
            class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-text-dim border border-border-default rounded bg-bg-elevated"
          >
            /
          </kbd>
        </div>
        <button
          :disabled="filteredPages.length === 0"
          class="flex items-center justify-center gap-2 px-4 py-3 text-sm font-display tracking-wide border border-accent-coral text-accent-coral bg-accent-coral/10 transition-colors duration-200 hover:bg-accent-coral hover:text-bg-deep disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          @click="goToRandom"
        >
          <Icon icon="lucide:shuffle" aria-hidden="true" class="w-4 h-4" />
          Ngẫu nhiên
        </button>
        <RouterLink
          to="/bookmarks"
          class="flex items-center justify-center gap-2 px-4 py-3 text-sm font-display tracking-wide border border-accent-coral text-accent-coral bg-accent-coral/10 transition-colors duration-200 hover:bg-accent-coral hover:text-bg-deep whitespace-nowrap"
        >
          <Icon icon="lucide:heart" class="w-4 h-4 icon-filled" />
          Yêu thích
        </RouterLink>
      </div>

      <!-- Category tags -->
      <div class="flex flex-wrap gap-2">
        <button
          class="px-3 py-1.5 text-xs font-display tracking-wide border transition-colors duration-200"
          :class="
            activeCategory === null
              ? 'bg-accent-coral text-bg-deep border-accent-coral'
              : 'bg-bg-elevated text-text-secondary border-border-default hover:border-accent-coral hover:text-text-primary'
          "
          @click="activeCategory = null"
        >
          Tất cả ({{ pages.length }})
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :title="cat.description"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display tracking-wide border transition-colors duration-200"
          :class="
            activeCategory === cat.id
              ? 'bg-accent-coral text-bg-deep border-accent-coral'
              : categoryCounts[cat.id]
                ? 'bg-bg-elevated text-text-secondary border-border-default hover:border-accent-coral hover:text-text-primary'
                : 'bg-bg-surface text-text-dim border-border-default border-dashed hover:border-accent-coral/50 hover:text-text-secondary'
          "
          @click="toggleCategory(cat.id)"
        >
          <Icon :icon="cat.icon" aria-hidden="true" class="w-3.5 h-3.5" />
          {{ cat.label }}
          <span v-if="categoryCounts[cat.id]">({{ categoryCounts[cat.id] }})</span>
          <span v-else class="text-accent-coral/70">✦</span>
        </button>
      </div>

      <!-- Result count when filtering -->
      <div
        v-if="isFiltering && !isEmptyCategory"
        class="flex items-center gap-3 text-sm text-text-secondary"
      >
        <span>
          {{ filteredPages.length }} kết quả
          <span v-if="filteredPages.length === 0">— </span>
        </span>
        <button
          v-if="filteredPages.length === 0"
          class="text-accent-coral hover:underline text-sm"
          @click="clearFilters"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>

    <!-- Empty category state -->
    <div
      v-if="isEmptyCategory && activeCategoryObj"
      class="flex flex-col items-center justify-center gap-6 py-20 text-center border border-dashed border-border-default bg-bg-surface"
    >
      <Icon
        :icon="activeCategoryObj.icon"
        class="w-12 h-12 text-accent-coral/40"
        aria-hidden="true"
      />
      <div class="space-y-2">
        <p class="font-display text-lg font-semibold text-text-primary">
          Chưa có app nào trong <span class="text-accent-coral">{{ activeCategoryObj.label }}</span>
        </p>
      </div>
      <a
        href="#cach-tham-gia"
        class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-display tracking-wide border border-accent-coral text-accent-coral bg-accent-coral/10 transition-colors duration-200 hover:bg-accent-coral hover:text-bg-deep"
        @click="clearFilters"
      >
        <Icon icon="lucide:plus" class="w-4 h-4" aria-hidden="true" />
        Hãy là người đầu tiên!
      </a>
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="(page, index) in filteredPages"
        :key="page.path"
        :to="page.path"
        v-animate="`${(index % 6) * 50}ms`"
        class="group relative flex flex-col border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
      >
        <FavoriteButton :path="page.path" class="top-2 right-3" />

        <!-- Background number -->
        <span
          class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
        >
          {{ padIndex(index) }}
        </span>

        <h3
          class="font-display text-lg font-semibold text-text-primary group-hover:text-accent-coral transition-colors"
        >
          {{ page.name }}
        </h3>
        <p class="mt-2 text-sm text-text-secondary line-clamp-2" :title="page.description">
          {{ page.description }}
        </p>
        <p class="mt-auto pt-4 text-xs text-text-dim font-display tracking-wide">
          bởi
          <a
            v-if="page.facebook"
            :href="page.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:underline"
            @click.stop
          >
            {{ page.author }}
          </a>
          <span v-else>{{ page.author }}</span>
        </p>
      </RouterLink>

      <!-- Placeholder card -->
      <a
        v-if="!isFiltering && (showAll || hiddenCount <= 0)"
        href="#cach-tham-gia"
        class="flex items-center justify-center border border-dashed border-border-default p-6 text-text-dim animate-pulse-border transition-colors duration-300 hover:border-accent-coral hover:text-accent-coral"
      >
        <span class="text-sm font-display tracking-wide">Trang của bạn sẽ ở đây...</span>
      </a>
    </div>

    <!-- Show more button (only when not filtering and not all shown) -->
    <div v-if="!isFiltering && !showAll && hiddenCount > 0" class="mt-8 flex justify-center">
      <button
        class="flex items-center gap-2 px-6 py-3 text-sm font-display tracking-wide border border-border-default text-text-secondary bg-bg-surface transition-colors duration-200 hover:border-accent-coral hover:text-accent-coral cursor-pointer"
        @click="showAll = true"
      >
        <Icon icon="lucide:chevrons-down" aria-hidden="true" class="w-4 h-4" />
        Xem thêm {{ hiddenCount }} apps
      </button>
    </div>
  </main>
</template>

<style scoped>
.icon-filled :deep(path) {
  fill: currentColor;
}
</style>
