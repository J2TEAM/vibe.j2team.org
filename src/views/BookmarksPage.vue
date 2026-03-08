<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { pages } from '@/data/pages-loader'
import { useFavorites } from '@/composables/useFavorites'
import FavoriteButton from '@/components/FavoriteButton.vue'

const { favoritePaths } = useFavorites()

const pageByPath = new Map(pages.map((p) => [p.path, p]))

const bookmarkedPages = computed(() => {
  return favoritePaths.value.flatMap((path) => {
    const p = pageByPath.get(path)
    return p ? [p] : []
  })
})
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
      <div v-if="bookmarkedPages.length > 0" class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="page in bookmarkedPages"
          :key="page.path"
          :to="page.path"
          class="group relative flex flex-col border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
        >
          <FavoriteButton :path="page.path" class="top-3 right-4" always-visible />

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
      </div>

      <!-- Empty state -->
      <div v-else class="mt-12 flex flex-col items-center justify-center py-16 text-center">
        <svg
          class="w-16 h-16 text-text-dim mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <p class="text-text-secondary text-lg font-display">Chưa có ứng dụng yêu thích</p>
        <p class="mt-2 text-text-dim text-sm">
          Nhấn vào biểu tượng
          <svg
            class="inline w-4 h-4 text-text-dim -mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          trên mỗi ứng dụng ở trang chủ để thêm vào đây.
        </p>
        <RouterLink
          to="/"
          class="mt-8 inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm font-display text-accent-coral tracking-wide transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
        >
          Khám phá ứng dụng
        </RouterLink>
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
