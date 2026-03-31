<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { Icon } from '@iconify/vue'
import { getAuthorBySlug } from '@/data/authors'
import { getCategoryLabel } from '@/data/categories'
import { getAuthorBadges, getCategoryBreakdown } from '@/data/badges'
import { isLikelyGitHubUsername, isGitHubUrl } from '@/composables/useGithubAvatar'
import AuthorAvatar from '@/components/AuthorAvatar.vue'
import PageCard from '@/components/PageCard.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const author = computed(() => getAuthorBySlug(slug.value))

const isGitHub = computed(() => !!author.value && isLikelyGitHubUsername(author.value.author))

// Some authors put their GitHub URL in the `facebook` field of meta.ts.
// Detect this so we show a single GitHub button instead of a misleading Facebook button.
const hasGitHubInFacebookField = computed(
  () => !!author.value?.facebook && isGitHubUrl(author.value.facebook),
)
const facebookUrl = computed(() =>
  !hasGitHubInFacebookField.value ? author.value?.facebook : undefined,
)
const githubUrl = computed(() => {
  if (hasGitHubInFacebookField.value) return author.value!.facebook!
  if (isGitHub.value) return `https://github.com/${author.value!.author}`
  return undefined
})

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

const badges = computed(() => (author.value ? getAuthorBadges(author.value) : []))
const categoryBreakdown = computed(() => (author.value ? getCategoryBreakdown(author.value) : []))
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
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
        <AppBreadcrumb
          :items="[{ label: 'Thành viên', to: '/members' }, { label: author.author }]"
        />

        <!-- Header -->
        <div class="mt-8 flex flex-wrap items-start gap-4">
          <AuthorAvatar :author="author.author" size="lg" />

          <div class="flex-1 min-w-0">
            <p class="text-text-dim font-display text-xs tracking-widest mb-2">// tác giả</p>
            <h1
              class="font-display text-3xl sm:text-4xl font-bold text-text-primary flex flex-wrap items-center gap-3"
            >
              <a
                v-if="facebookUrl || githubUrl"
                :href="facebookUrl || githubUrl"
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

          <div class="flex gap-2 shrink-0">
            <a
              v-if="facebookUrl"
              :href="facebookUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            >
              <Icon icon="lucide:facebook" class="w-4 h-4 shrink-0" />
              <span class="translate-y-px">Facebook</span>
            </a>
            <a
              v-if="githubUrl"
              :href="githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            >
              <Icon icon="lucide:github" class="w-4 h-4 shrink-0" />
              <span class="translate-y-px">GitHub</span>
            </a>
          </div>
        </div>

        <!-- Badges -->
        <div v-if="badges.length" class="mt-6 flex flex-wrap gap-2">
          <span
            v-for="badge in badges"
            :key="badge.id"
            :title="badge.description"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-elevated border border-border-default text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
          >
            <Icon :icon="badge.icon" class="w-3.5 h-3.5" />
            {{ badge.label }}
          </span>
        </div>

        <!-- Project Contribution Stats -->
        <div
          class="mt-6 grid gap-px bg-border-default border border-border-default"
          :class="author.rank ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <div class="bg-bg-surface p-4 text-center">
            <p class="font-display text-2xl font-bold text-accent-coral">
              {{ author.apps.length }}
            </p>
            <p class="text-[10px] text-text-dim font-display tracking-widest mt-1">ỨNG DỤNG</p>
          </div>
          <div class="bg-bg-surface p-4 text-center">
            <p class="font-display text-2xl font-bold text-accent-amber">
              {{ categoryBreakdown.length }}
            </p>
            <p class="text-[10px] text-text-dim font-display tracking-widest mt-1">THỂ LOẠI</p>
          </div>
          <div v-if="author.rank" class="bg-bg-surface p-4 text-center">
            <p class="font-display text-2xl font-bold text-accent-sky">#{{ author.rank }}</p>
            <p class="text-[10px] text-text-dim font-display tracking-widest mt-1">XẾP HẠNG</p>
          </div>
        </div>

        <!-- Category breakdown -->
        <div v-if="categoryBreakdown.length" class="mt-6 space-y-2.5">
          <div
            v-for="cat in categoryBreakdown"
            :key="cat.id"
            class="flex items-center gap-3 text-sm"
          >
            <Icon :icon="cat.icon" class="w-4 h-4 text-text-dim shrink-0" />
            <span
              class="w-28 sm:w-36 truncate text-text-secondary font-display text-xs tracking-wide"
            >
              {{ cat.label }}
            </span>
            <div class="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                class="h-full bg-accent-coral/70 rounded-full transition-all duration-500"
                :style="{ width: `${(cat.count / author.apps.length) * 100}%` }"
              />
            </div>
            <span class="text-text-dim font-display text-xs w-6 text-right">{{ cat.count }}</span>
          </div>
        </div>

        <!-- Apps grid -->
        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PageCard v-for="app in author.apps" :key="app.path" :page="app">
            <template #footer>
              <p
                class="mt-auto pt-4 text-[10px] text-text-dim font-display tracking-wide uppercase"
              >
                {{ getCategoryLabel(app.category) }}
              </p>
            </template>
          </PageCard>
        </div>
      </template>
    </div>
  </div>
</template>
