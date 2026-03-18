<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { getCategoryLabel } from '@/data/categories'
import type { PageInfo } from '@/types/page'

const props = defineProps<{
  page: PageInfo
  isFavorite: boolean
  isInRecentTab?: boolean
}>()

const emit = defineEmits<{
  openComments: []
  view: []
  toggleFavorite: []
  removeFromHistory: []
}>()

const router = useRouter()

// ============ Rate Limit Handler ============
const RATE_LIMIT_KEY = 'vibebook-rate-limit'

function getRateLimitInfo(): { until: number } {
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY)
    return data ? JSON.parse(data) : { until: 0 }
  } catch {
    return { until: 0 }
  }
}

function setRateLimit(until: number) {
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ until }))
}

function isRateLimited(): boolean {
  const { until } = getRateLimitInfo()
  return Date.now() < until
}

// ============ Avatar with caching (permanent) ============
const avatarUrl = ref<string | null>(null)

const AVATAR_CACHE_KEY = 'vibebook-github-avatars'

function getAvatarCache(): Record<string, string> {
  try {
    const cached = localStorage.getItem(AVATAR_CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

function setAvatarCache(cache: Record<string, string>) {
  localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache))
}

const avatarColor = computed(() => {
  const colors = [
    '#f87171',
    '#fb923c',
    '#fbbf24',
    '#a3e635',
    '#34d399',
    '#22d3ee',
    '#60a5fa',
    '#818cf8',
    '#c084fc',
    '#f472b6',
  ]
  let hash = 0
  for (let i = 0; i < props.page.author.length; i++) {
    hash = props.page.author.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

const initial = computed(() => props.page.author.charAt(0).toUpperCase())

// Fetch avatar on mount with caching and rate limit check
onMounted(async () => {
  const cache = getAvatarCache()

  // Check cache first (permanent cache)
  const cachedUrl = cache[props.page.author]
  if (cachedUrl) {
    avatarUrl.value = cachedUrl
    return
  }

  // Check rate limit - skip API call if rate limited
  if (isRateLimited()) {
    return // Use fallback avatar
  }

  const isLikelyGitHubUsername = /^[a-zA-Z0-9-]+$/.test(props.page.author)
  if (!isLikelyGitHubUsername) return

  try {
    const res = await fetch(`https://api.github.com/users/${props.page.author}`)

    // Handle rate limit (403/429)
    if (res.status === 403 || res.status === 429) {
      const resetTime = res.headers.get('X-RateLimit-Reset')
      const until = resetTime ? parseInt(resetTime) * 1000 : Date.now() + 60 * 60 * 1000
      setRateLimit(until)
      return
    }

    if (res.ok) {
      const data = await res.json()
      avatarUrl.value = data.avatar_url
      cache[props.page.author] = data.avatar_url
      setAvatarCache(cache)
    }
  } catch {
    // Silent fail
  }
})

const categoryLabel = computed(() => getCategoryLabel(props.page.category))

// Actions
function goToAuthor() {
  router.push(`/author/${encodeURIComponent(props.page.author)}`)
}

function sharePost() {
  const url = `${window.location.origin}${props.page.path}`
  if (navigator.share) {
    navigator.share({ title: props.page.name, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url)
  }
}

// Actions menu (more button)
const showActionsMenu = ref(false)

function toggleActionsMenu() {
  showActionsMenu.value = !showActionsMenu.value
}

function handleToggleFavorite() {
  emit('toggleFavorite')
  showActionsMenu.value = false
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.actions-menu-container')) {
    showActionsMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <article
    class="bg-bg-surface border border-border-default hover:border-accent-coral/50 transition-colors"
  >
    <!-- Header -->
    <div class="flex items-start gap-3 p-4 pb-2">
      <!-- Avatar (clickable) -->
      <button class="flex-shrink-0 cursor-pointer" @click="goToAuthor" :title="page.author">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="page.author"
          class="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-accent-coral"
          loading="lazy"
        />
        <div
          v-else
          class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg hover:ring-2 hover:ring-accent-coral"
          :style="{ backgroundColor: avatarColor }"
        >
          {{ initial }}
        </div>
      </button>

      <!-- Author Info (clickable) -->
      <div class="flex-1 min-w-0">
        <button
          class="text-left cursor-pointer hover:text-accent-coral transition-colors"
          @click="goToAuthor"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-text-primary">{{ page.author }}</span>
          </div>
          <span class="text-xs text-text-dim bg-bg-deep px-2 py-0.5 rounded">
            {{ categoryLabel }}
          </span>
        </button>
      </div>

      <!-- More actions (vertical dots) -->
      <div class="relative actions-menu-container">
        <button
          class="p-1 rounded hover:bg-bg-deep text-text-secondary hover:text-text-primary transition-colors"
          @click.stop="toggleActionsMenu"
        >
          <Icon icon="lucide:more-vertical" class="w-5 h-5" />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showActionsMenu"
          class="absolute right-0 top-full mt-1 w-40 bg-bg-surface border border-border-default rounded shadow-lg z-10"
        >
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-deep transition-colors"
            @click="handleToggleFavorite"
          >
            <Icon
              :icon="props.isFavorite ? 'lucide:heart' : 'lucide:heart'"
              :class="props.isFavorite ? 'text-red-500' : ''"
              class="w-4 h-4"
            />
            {{ props.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích' }}
          </button>
          <button
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-deep transition-colors"
            @click="sharePost"
          >
            <Icon icon="lucide:share-2" class="w-4 h-4" />
            Chia sẻ
          </button>
          <button
            v-if="props.isInRecentTab"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-deep transition-colors"
            @click="emit('removeFromHistory')"
          >
            <Icon icon="lucide:trash-2" class="w-4 h-4" />
            Xoá khỏi lịch sử
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 pb-2">
      <h3 class="font-display font-bold text-lg text-text-primary mb-1">
        <RouterLink
          :to="page.path"
          class="hover:text-accent-coral transition-colors"
          @click="emit('view')"
        >
          {{ page.name }}
        </RouterLink>
      </h3>
      <p class="text-sm text-text-secondary line-clamp-3">
        {{ page.description }}
      </p>
    </div>

    <!-- Actions (space-between) -->
    <div class="flex items-center justify-between px-4 py-3 border-t border-border-default">
      <!-- Like -->
      <button
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-text-secondary hover:text-accent-coral hover:bg-bg-deep transition-colors whitespace-nowrap"
        @click="(emit('view'), emit('openComments'))"
      >
        <Icon icon="lucide:thumbs-up" class="w-4 h-4" />
        <span class="text-sm font-medium">Thích</span>
      </button>

      <!-- Comment -->
      <button
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-deep transition-colors whitespace-nowrap"
        @click="(emit('view'), emit('openComments'))"
      >
        <Icon icon="lucide:message-square" class="w-4 h-4" />
        <span class="text-sm font-medium">Bình luận</span>
      </button>

      <!-- Share -->
      <button
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-deep transition-colors whitespace-nowrap"
        @click="sharePost"
      >
        <Icon icon="lucide:share-2" class="w-4 h-4" />
        <span class="text-sm font-medium">Chia sẻ</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
