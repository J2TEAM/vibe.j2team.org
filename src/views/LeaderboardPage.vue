<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { multiAppAuthors, toAuthorSlug } from '@/data/authors'
import { getCategoryLabel } from '@/data/categories'

interface RankStyle {
  card: string
  badge: string
  text: string
  hover: string
}

const rankStyles: Record<number, RankStyle> = {
  1: {
    card: 'border-accent-coral/30 hover:shadow-accent-coral/10 hover:border-accent-coral',
    badge: 'bg-accent-coral',
    text: 'text-accent-coral',
    hover: 'hover:text-accent-coral',
  },
  2: {
    card: 'border-accent-amber/30 hover:shadow-accent-amber/10 hover:border-accent-amber',
    badge: 'bg-accent-amber',
    text: 'text-accent-amber',
    hover: 'hover:text-accent-amber',
  },
  3: {
    card: 'border-accent-sky/30 hover:shadow-accent-sky/10 hover:border-accent-sky',
    badge: 'bg-accent-sky',
    text: 'text-accent-sky',
    hover: 'hover:text-accent-sky',
  },
}

const defaultStyle: RankStyle = {
  card: 'border-border-default hover:border-border-hover',
  badge: 'bg-text-dim',
  text: 'text-text-primary',
  hover: 'hover:text-accent-coral',
}

const styledAuthors = multiAppAuthors.map((stat) => ({
  stat,
  style: rankStyles[stat.rank] ?? defaultStyle,
}))
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
      >
        &larr; Về trang chủ
      </RouterLink>

      <!-- Header -->
      <h1
        class="mt-8 font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Bảng xếp hạng tác giả
      </h1>
      <p class="mt-4 text-text-secondary">Những tác giả đã đóng góp từ 2 ứng dụng trở lên</p>

      <!-- Leaderboard -->
      <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="{ stat, style } in styledAuthors"
          :key="stat.author"
          class="relative border bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-bg-elevated hover:shadow-lg"
          :class="style.card"
        >
          <!-- Rank badge -->
          <div
            class="absolute -top-3 left-6 px-3 py-0.5 font-display text-sm font-bold text-bg-deep"
            :class="style.badge"
          >
            #{{ stat.rank }}
          </div>

          <!-- Author -->
          <h2 class="mt-2 font-display text-xl font-bold">
            <RouterLink
              :to="`/author/${toAuthorSlug(stat.author)}`"
              class="transition-colors"
              :class="style.hover"
            >
              {{ stat.author }}
            </RouterLink>
          </h2>

          <p class="mt-1 text-sm text-text-secondary">
            <span class="font-display font-bold text-lg" :class="style.text">
              {{ stat.apps.length }}
            </span>
            ứng dụng
          </p>

          <!-- Apps -->
          <div class="mt-4 space-y-2">
            <RouterLink
              v-for="app in stat.apps"
              :key="app.path"
              :to="app.path"
              class="flex items-center gap-2 text-sm text-text-secondary transition-colors"
              :class="style.hover"
            >
              <span class="text-text-dim">&rarr;</span>
              {{ app.name }}
            </RouterLink>
          </div>

          <!-- Categories -->
          <div v-if="stat.categories.length" class="mt-4 flex flex-wrap gap-1.5">
            <span
              v-for="cat in stat.categories"
              :key="cat"
              class="text-[10px] px-1.5 py-0.5 bg-bg-elevated text-text-dim font-display tracking-wide border border-border-default"
            >
              {{ getCategoryLabel(cat) }}
            </span>
          </div>
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
