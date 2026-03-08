<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { pages } from '@/data/pages-loader'
import { padIndex } from '@/data/homepage'
import { categories } from '@/data/categories'

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
const activeCategory = ref<string | null>(null)

const filteredPages = computed(() => {
  const query = normalize(searchQuery.value.trim())
  const category = activeCategory.value

  return pages.filter((page) => {
    if (category) {
      if (page.category !== category) return false
    }

    if (query) {
      const name = normalize(page.name)
      const description = normalize(page.description)
      const author = normalize(page.author)
      return name.includes(query) || description.includes(query) || author.includes(query)
    }

    return true
  })
})

const isFiltering = computed(() => {
  return searchQuery.value.trim() !== '' || activeCategory.value !== null
})

function toggleCategory(id: string) {
  activeCategory.value = activeCategory.value === id ? null : id
}

function clearFilters() {
  searchQuery.value = ''
  activeCategory.value = null
}

const router = useRouter()

function goToRandom() {
  const list = filteredPages.value
  if (list.length === 0) return
  const randomPage = list[Math.floor(Math.random() * list.length)]
  if (randomPage) router.push(randomPage.path)
}
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 sm:px-6 pb-16 scroll-reveal">
    <h2
      class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3 animate-fade-up"
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
    <div class="mb-6 space-y-4 animate-fade-up" style="animation-delay: 100ms">
      <!-- Search input + Random button -->
      <div class="flex gap-3">
        <div class="relative flex-1">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Tìm theo tên, mô tả hoặc tác giả..."
            class="w-full bg-bg-surface border border-border-default pl-11 pr-4 py-3 text-sm text-text-primary placeholder-text-dim font-body transition-colors duration-200 focus:outline-none focus:border-accent-coral"
          />
        </div>
        <button
          :disabled="filteredPages.length === 0"
          class="flex items-center gap-2 px-4 py-3 text-sm font-display tracking-wide border border-accent-coral text-accent-coral bg-accent-coral/10 transition-colors duration-200 hover:bg-accent-coral hover:text-bg-deep disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          @click="goToRandom"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
            />
          </svg>
          Ngẫu nhiên
        </button>
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
          Tất cả
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="px-3 py-1.5 text-xs font-display tracking-wide border transition-colors duration-200"
          :class="
            activeCategory === cat.id
              ? 'bg-accent-coral text-bg-deep border-accent-coral'
              : 'bg-bg-elevated text-text-secondary border-border-default hover:border-accent-coral hover:text-text-primary'
          "
          @click="toggleCategory(cat.id)"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Result count when filtering -->
      <div v-if="isFiltering" class="flex items-center gap-3 text-sm text-text-secondary">
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

    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="(page, index) in filteredPages"
        :key="page.path"
        :to="page.path"
        class="group relative flex flex-col border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 animate-fade-up"
        :style="{ animationDelay: `${400 + index * 100}ms` }"
      >
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
      <div
        v-if="!isFiltering"
        class="flex items-center justify-center border border-dashed border-border-default p-6 text-text-dim animate-pulse-border animate-fade-up animate-delay-6"
      >
        <span class="text-sm font-display tracking-wide">Trang của bạn sẽ ở đây...</span>
      </div>
    </div>
  </main>
</template>
