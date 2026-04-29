<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { getMultiAppAuthors, toAuthorSlug } from '@/data/authors'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { getCategoryLabel } from '@/data/categories'
import AuthorAvatar from '@/components/AuthorAvatar.vue'

const MAX_VISIBLE_APPS = 5

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

const styledAuthors = getMultiAppAuthors().map((stat) => ({
  stat,
  style: rankStyles[stat.rank] ?? defaultStyle,
}))
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
      <AppBreadcrumb :items="[{ label: 'Bảng xếp hạng tác giả' }]" />

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
          <RouterLink
            :to="`/author/${toAuthorSlug(stat.author)}`"
            class="mt-2 flex items-center gap-3 transition-colors"
            :class="style.hover"
          >
            <AuthorAvatar :author="stat.author" size="md" />
            <h2 class="font-display text-xl font-bold">{{ stat.author }}</h2>
          </RouterLink>

          <p class="mt-1 text-sm text-text-secondary">
            <span class="font-display font-bold text-lg" :class="style.text">
              {{ stat.apps.length }}
            </span>
            ứng dụng
          </p>

          <!-- Apps -->
          <div class="mt-4 space-y-2">
            <RouterLink
              v-for="app in stat.apps.slice(0, MAX_VISIBLE_APPS)"
              :key="app.path"
              :to="app.path"
              class="flex items-center gap-2 text-sm text-text-secondary transition-colors"
              :class="style.hover"
            >
              <span class="text-text-dim">&rarr;</span>
              {{ app.name }}
            </RouterLink>
            <RouterLink
              v-if="stat.apps.length > MAX_VISIBLE_APPS"
              :to="`/author/${toAuthorSlug(stat.author)}`"
              class="flex items-center gap-2 text-sm transition-colors"
              :class="style.text"
            >
              <span class="text-text-dim">&rarr;</span>
              Xem thêm {{ stat.apps.length - MAX_VISIBLE_APPS }} ứng dụng...
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
    </div>
  </div>
</template>
