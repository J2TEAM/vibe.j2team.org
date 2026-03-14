<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { getAuthorBySlug } from '@/data/authors'
import { getCategoryLabel } from '@/data/categories'
import FavoriteButton from '@/components/FavoriteButton.vue'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const author = computed(() => getAuthorBySlug(slug.value))

const pageTitle = computed(() =>
  author.value
    ? `${author.value.author} - vibe.j2team.org`
    : 'Không tìm thấy tác giả - vibe.j2team.org',
)

const pageDescription = computed(() =>
  author.value
    ? `Trang cá nhân của ${author.value.author} — ${author.value.apps.length} ứng dụng trên vibe.j2team.org.`
    : 'Tác giả này không tồn tại.',
)

useHead({ title: pageTitle })
useSeoMeta({ description: pageDescription, ogTitle: pageTitle, ogDescription: pageDescription })

const rankStyles: Record<number, { badge: string; text: string }> = {
  1: { badge: 'bg-accent-coral text-bg-deep', text: 'text-accent-coral' },
  2: { badge: 'bg-accent-amber text-bg-deep', text: 'text-accent-amber' },
  3: { badge: 'bg-accent-sky text-bg-deep', text: 'text-accent-sky' },
}

const defaultRankStyle = {
  badge: 'bg-bg-elevated text-text-secondary',
  text: 'text-text-secondary',
}

const rankStyle = computed(() => {
  if (!author.value?.rank) return defaultRankStyle
  return rankStyles[author.value.rank] ?? defaultRankStyle
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <!-- Not found -->
      <template v-if="!author">
        <div class="flex flex-col items-center justify-center py-24 text-center">
          <Icon icon="lucide:user-x" class="w-16 h-16 text-text-dim mb-6" />
          <h1 class="font-display text-2xl font-bold text-text-primary">Không tìm thấy tác giả</h1>
          <p class="mt-2 text-text-secondary">
            Tác giả <span class="text-accent-coral">{{ slug }}</span> không tồn tại.
          </p>
          <RouterLink
            to="/"
            class="mt-8 inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm font-display text-accent-coral tracking-wide transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
          >
            Về trang chủ
          </RouterLink>
        </div>
      </template>

      <!-- Author profile -->
      <template v-else>
        <!-- Header -->
        <div class="flex flex-wrap items-start gap-4">
          <div class="flex-1 min-w-0">
            <p class="text-text-dim font-display text-xs tracking-widest mb-2">// tác giả</p>
            <h1
              class="font-display text-3xl sm:text-4xl font-bold text-text-primary flex flex-wrap items-center gap-3"
            >
              <a
                v-if="author.facebook"
                :href="author.facebook"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-accent-coral transition-colors"
              >
                {{ author.author }}
              </a>
              <span v-else>{{ author.author }}</span>

              <RouterLink
                v-if="author.rank"
                to="/leaderboard"
                class="inline-flex items-center px-3 py-0.5 font-display text-sm font-bold transition-opacity hover:opacity-80"
                :class="rankStyle.badge"
              >
                #{{ author.rank }} leaderboard
              </RouterLink>
            </h1>
          </div>

          <a
            v-if="author.facebook"
            :href="author.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary shrink-0"
          >
            <Icon icon="lucide:facebook" class="w-4 h-4" />
            Facebook
          </a>
        </div>

        <!-- Stats bar -->
        <div class="mt-8 flex flex-wrap gap-6 text-sm border-t border-border-default pt-6">
          <div>
            <span
              class="font-display text-2xl font-bold"
              :class="author.rank ? rankStyle.text : 'text-accent-coral'"
            >
              {{ author.apps.length }}
            </span>
            <span class="ml-1.5 text-text-secondary">ứng dụng</span>
          </div>
          <div v-if="author.categories.length" class="flex flex-wrap items-center gap-1.5">
            <span
              v-for="cat in author.categories"
              :key="cat"
              class="text-[10px] px-1.5 py-0.5 bg-bg-elevated text-text-dim font-display tracking-wide"
            >
              {{ getCategoryLabel(cat) }}
            </span>
          </div>
        </div>

        <!-- Apps grid -->
        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="app in author.apps"
            :key="app.path"
            :to="app.path"
            class="group relative flex flex-col border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <FavoriteButton :path="app.path" class="top-2 right-3" />

            <h3
              class="font-display text-lg font-semibold text-text-primary group-hover:text-accent-coral transition-colors"
            >
              {{ app.name }}
            </h3>
            <p class="mt-2 text-sm text-text-secondary line-clamp-2" :title="app.description">
              {{ app.description }}
            </p>
            <p class="mt-auto pt-4 text-[10px] text-text-dim font-display tracking-wide uppercase">
              {{ getCategoryLabel(app.category) }}
            </p>
          </RouterLink>
        </div>

        <!-- Footer links -->
        <div class="mt-16 flex flex-wrap gap-3">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            &larr; Về trang chủ
          </RouterLink>
          <RouterLink
            to="/leaderboard"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            Bảng xếp hạng
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>
