<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useTimeAgo } from '@vueuse/core'

interface NewsItem {
  id: string
  title: string
  link: string
  pubDate: Date
  thumbnail: string
  description: string
  source: string
  sourceColor: string
}

const SOURCES = [
  {
    name: 'VnExpress',
    url: 'https://vnexpress.net/rss/so-hoa.rss',
    color: 'text-accent-coral',
  },
  {
    name: 'Dân Trí',
    url: 'https://dantri.com.vn/rss/suc-manh-so.rss',
    color: 'text-emerald-400',
  },
  {
    name: 'Tuổi Trẻ',
    url: 'https://tuoitre.vn/rss/nhip-song-so.rss',
    color: 'text-accent-sky',
  },
]

const isLoading = ref(true)
const newsItems = ref<NewsItem[]>([])
const errorMsg = ref('')
const failedImages = ref<Set<string>>(new Set())

interface RssItem {
  guid?: string
  link: string
  title: string
  pubDate: string
  thumbnail?: string
  media_thumbnail?: { url: string }[]
  image?: { url: string }
  media_content?: { url: string; medium: string }[]
  'media:thumbnail'?: { url: string }[]
  'media:content'?: { url: string; medium: string }[]
  enclosure?: { link?: string; url?: string }[] | { link?: string; url?: string }
  description?: string
  content?: string
  'content:encoded'?: string
  [key: string]: unknown
}

function extractThumbnail(item: RssItem): string {
  // Try standard thumbnail field
  if (item.thumbnail) return item.thumbnail

  // Try media:thumbnail (Media RSS extension) - both formats
  if (item.media_thumbnail?.length) return item.media_thumbnail[0]?.url ?? ''
  if (item['media:thumbnail']?.length) return item['media:thumbnail'][0]?.url ?? ''

  // Try image object
  if (item.image?.url) return item.image.url

  // Try media:content
  if (item.media_content?.length) {
    const imageContent = item.media_content.find((m) => m.medium === 'image')
    if (imageContent?.url) return imageContent.url
  }
  if (item['media:content']?.length) {
    const imageContent = item['media:content'].find((m) => m.medium === 'image')
    if (imageContent?.url) return imageContent.url
  }

  // Try enclosure (can be array or single object)
  if (Array.isArray(item.enclosure) && item.enclosure.length > 0) {
    const imgEnclosure = item.enclosure.find(
      (e) =>
        typeof e.url === 'string' &&
        (e.url.includes('.jpg') || e.url.includes('.png') || e.url.includes('.webp')),
    )
    if (imgEnclosure?.url) return imgEnclosure.url
  } else if (item.enclosure && !Array.isArray(item.enclosure) && item.enclosure.link) {
    return item.enclosure.link
  }

  // Try to extract from content:encoded or content
  const contentHtml = item['content:encoded'] || item.content || item.description || ''
  const imgMatch = contentHtml.match(/<img[^>]+src="([^">]+)"/i)
  if (imgMatch?.[1]) return imgMatch[1]

  // Last resort: look for any URL-like pattern that looks like an image
  const allContent = JSON.stringify(item)
  const urlRegex = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp))/i
  const urlMatch = allContent.match(urlRegex)
  if (urlMatch?.[1]) return urlMatch[1]

  return ''
}

function cleanDescription(html?: string): string {
  if (!html) return ''
  // Strip all HTML tags
  let text = html.replace(/<[^>]*>?/gm, '').trim()
  // Replace HTML entities loosely
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  return text
}

function handleImageError(imageId: string) {
  failedImages.value.add(imageId)
}

async function fetchNews() {
  isLoading.value = true
  errorMsg.value = ''

  try {
    const promises = SOURCES.map(async (source) => {
      try {
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`,
        )
        if (!res.ok) return []

        const json = await res.json()
        if (json.status !== 'ok') return []

        return json.items.map((item: RssItem) => {
          // rss2json returns pubDate in format 'YYYY-MM-DD HH:mm:ss', standard JS parse works
          const pubDate = new Date((item.pubDate || '').replace(' ', 'T') + 'Z') // assumption: RSS pubDate is GMT. Adjust if needed.

          return {
            id: item.guid || item.link,
            title: item.title,
            link: item.link,
            pubDate: pubDate,
            thumbnail: extractThumbnail(item),
            description: cleanDescription(item.description),
            source: source.name,
            sourceColor: source.color,
          } as NewsItem
        })
      } catch (e) {
        console.warn(`Failed to fetch ${source.name}:`, e)
        return []
      }
    })

    const results = await Promise.all(promises)

    // Flatten and sort by pubDate descending
    const allNews = results.flat().sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())

    newsItems.value = allNews
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Lỗi mạng không xác định'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep p-6 text-text-primary font-body">
    <div class="mx-auto max-w-7xl space-y-8 animate-fade-up">
      <!-- Navigation -->
      <nav class="flex items-center">
        <RouterLink
          to="/"
          class="group flex w-fit items-center gap-2 rounded-xl bg-bg-surface px-4 py-2 text-sm font-medium text-text-secondary ring-1 ring-border-default transition-all hover:bg-bg-elevated hover:text-white"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 transition-transform group-hover:-translate-x-1"
          />
          <span>Về trang chủ</span>
        </RouterLink>
      </nav>

      <!-- Header -->
      <header class="flex flex-col gap-4">
        <div class="flex items-center gap-4">
          <div
            class="flex size-14 items-center justify-center rounded-2xl bg-bg-surface shadow-[0_4px_16px_rgba(56,189,248,0.15)] ring-1 ring-border-default/50"
          >
            <Icon icon="lucide:newspaper" class="size-7 text-accent-sky" />
          </div>
          <div>
            <h1
              class="font-display text-3xl font-bold tracking-tight text-white md:text-4xl drop-shadow-sm"
            >
              J2TEAM NEWS
            </h1>
            <p class="text-text-secondary mt-1 max-w-xl">
              Tổng hợp tin tức công nghệ mới nhất từ các trang báo uy tín.
            </p>
          </div>
        </div>
      </header>

      <!-- Error State -->
      <div
        v-if="!isLoading && errorMsg"
        class="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-red-400"
      >
        <p>Lỗi kết nối: {{ errorMsg }}</p>
        <button
          @click="fetchNews"
          class="mt-4 rounded-xl bg-red-500/20 px-6 py-2 hover:bg-red-500/30 transition-colors"
        >
          Thử lại
        </button>
      </div>

      <!-- Loading State -->
      <div
        v-else-if="isLoading"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="rounded-2xl bg-bg-surface border border-border-default/50 overflow-hidden animate-pulse flex flex-col h-full"
        >
          <div class="h-48 bg-border-default/30 w-full object-cover shrink-0"></div>
          <div class="p-5 flex-1 flex flex-col gap-3">
            <div class="h-3 bg-border-default/40 rounded w-1/4"></div>
            <div class="h-5 bg-border-default/50 rounded w-full mb-1"></div>
            <div class="h-5 bg-border-default/50 rounded w-5/6"></div>
            <div class="mt-auto pt-4 space-y-2">
              <div class="h-3 bg-border-default/30 rounded w-full"></div>
              <div class="h-3 bg-border-default/30 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Articles Grid -->
      <main
        v-else-if="newsItems.length > 0"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch align-start"
      >
        <a
          v-for="(item, index) in newsItems"
          :key="item.id"
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="group block relative rounded-2xl bg-bg-surface border border-border-default shadow-sm ring-1 ring-border-default/50 hover:ring-border-default hover:bg-bg-elevated hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
          :style="`animation-delay: ${index * 50}ms`"
        >
          <!-- Thumbnail -->
          <div class="h-48 shrink-0 overflow-hidden relative bg-black">
            <img
              v-if="item.thumbnail && !failedImages.has(item.id)"
              :src="item.thumbnail"
              :alt="item.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              @error="handleImageError(item.id)"
              crossorigin="anonymous"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-surface to-bg-deep border-b border-border-default/50"
            >
              <Icon icon="lucide:image" class="size-10 text-text-secondary/30" />
            </div>
          </div>

          <!-- Content -->
          <div class="p-5 flex-1 flex flex-col">
            <div
              class="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider"
            >
              <span :class="item.sourceColor">{{ item.source }}</span>
              <span class="text-text-secondary font-medium normal-case flex items-center gap-1">
                <Icon icon="lucide:clock" class="size-3" />
                {{ useTimeAgo(item.pubDate).value }}
              </span>
            </div>

            <h2
              class="font-display text-lg font-bold text-white line-clamp-3 mb-2 leading-snug group-hover:text-accent-sky transition-colors"
            >
              {{ item.title }}
            </h2>

            <p
              v-if="item.description"
              class="text-sm text-text-secondary line-clamp-3 mt-auto leading-relaxed"
            >
              {{ item.description }}
            </p>
          </div>
        </a>
      </main>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="lucide:inbox" class="size-16 text-text-secondary/50 mb-4" />
        <p class="text-text-secondary text-lg">Không thể tải tin tức lúc này.</p>
        <button
          @click="fetchNews"
          class="mt-6 rounded-xl bg-bg-surface px-6 py-2 border border-border-default hover:bg-bg-elevated transition-colors"
        >
          Thử lại
        </button>
      </div>

      <!-- Footer -->
      <footer
        class="mt-12 text-center text-sm text-text-secondary pb-8 border-t border-border-default/50 pt-8 max-w-md mx-auto"
      >
        <p>Designed by mtdes23</p>
        <a
          href="https://www.mtdes23.id.vn"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent-amber focus:outline-none transition-colors"
          >www.mtdes23.id.vn</a
        >
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Optional styling */
</style>
