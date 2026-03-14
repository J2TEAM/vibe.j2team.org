<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { useOTruyen } from './composables/useOTruyen'
import { useComicHistory } from './composables/useComicHistory'
import ComicList from './components/ComicList.vue'
import AppPagination from './components/AppPagination.vue'
import ComicDetail from './components/ComicDetail.vue'
import ComicReader from './components/ComicReader.vue'
import type { ComicItem, OTruyenResponse } from './types'

// Setup
const {
  isLoading,
  error,
  IMAGE_URL_BASE,
  getRecentComics,
  getComingSoonComics,
  searchComics,
  getComicsByCategory,
} = useOTruyen()
const { watchHistory, bookmarks, addToHistory } = useComicHistory()

// History Pagination & Format
const historyPage = ref(1)
const historyPerPage = 10
const paginatedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPerPage
  return watchHistory.value.slice(start, start + historyPerPage)
})
const historyTotalPages = computed(() => Math.ceil(watchHistory.value.length / historyPerPage))

// Bookmarks Pagination
const bookmarkPage = ref(1)
const bookmarkPerPage = 10
const paginatedBookmarks = computed(() => {
  const start = (bookmarkPage.value - 1) * bookmarkPerPage
  return bookmarks.value.slice(start, start + bookmarkPerPage)
})
const bookmarkTotalPages = computed(() => Math.ceil(bookmarks.value.length / bookmarkPerPage))

const formatTimeAgo = (timestamp: number) => {
  if (!timestamp) return ''
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  if (weeks < 4) return `${weeks} tuần trước`
  if (months < 12) return `${months} tháng trước`
  return `${years} năm trước`
}

// State synced with URL
const params = useUrlSearchParams('history')

const activeTab = ref(params.tab ? String(params.tab) : 'home')

const selectedComic = ref<{ slug: string; name: string; thumb_url: string } | null>(
  params.comic
    ? {
        slug: String(params.comic),
        name: params.cname ? String(params.cname) : '',
        thumb_url: params.clogo ? String(params.clogo) : '',
      }
    : null,
)

const readingChapter = ref<{ api_data: string; name: string } | null>(
  params.chap_api
    ? {
        api_data: String(params.chap_api),
        name: params.chap_name ? String(params.chap_name) : '',
      }
    : null,
)

const currentComicChapters = ref<{ name: string; api_data: string }[]>([])

const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const comics = ref<ComicItem[]>([]) // For list lists (genres, history, etc.)
const searchQuery = ref('')
const searchInput = ref('')

// URL Sync Watchers
watch(activeTab, (val) => {
  if (val === 'home') {
    delete params.tab
  } else {
    params.tab = val
  }
})

watch(selectedComic, (val) => {
  if (val) {
    params.comic = val.slug
    params.cname = val.name
    params.clogo = val.thumb_url
  } else {
    delete params.comic
    delete params.cname
    delete params.clogo
  }
})

watch(readingChapter, (val) => {
  if (val) {
    params.chap_api = val.api_data
    params.chap_name = val.name
  } else {
    delete params.chap_api
    delete params.chap_name
  }
})

// Dashboard refs
const homeMoiCapNhat = ref<ComicItem[]>([])
const homeDeXuat = ref<ComicItem[]>([])
const homeSapRaMat = ref<ComicItem[]>([])

const genresList = [
  { slug: 'action', name: 'Action' },
  { slug: 'adventure', name: 'Adventure' },
  { slug: 'anime', name: 'Anime' },
  { slug: 'chuyen-sinh', name: 'Chuyển Sinh' },
  { slug: 'comedy', name: 'Comedy' },
  { slug: 'comic', name: 'Comic' },
  { slug: 'demons', name: 'Demons' },
  { slug: 'detective', name: 'Detective' },
  { slug: 'doujinshi', name: 'Doujinshi' },
  { slug: 'drama', name: 'Drama' },
  { slug: 'fantasy', name: 'Fantasy' },
  { slug: 'gender-bender', name: 'Gender Bender' },
  { slug: 'harem', name: 'Harem' },
  { slug: 'historical', name: 'Historical' },
  { slug: 'horror', name: 'Horror' },
  { slug: 'isekai', name: 'Isekai' },
  { slug: 'josei', name: 'Josei' },
  { slug: 'mafia', name: 'Mafia' },
  { slug: 'magic', name: 'Magic' },
  { slug: 'manhua', name: 'Manhua' },
  { slug: 'manhwa', name: 'Manhwa' },
  { slug: 'martial-arts', name: 'Martial Arts' },
  { slug: 'mystery', name: 'Mystery' },
  { slug: 'ngon-tinh', name: 'Ngôn Tình' },
  { slug: 'one-shot', name: 'One shot' },
  { slug: 'psychological', name: 'Psychological' },
  { slug: 'romance', name: 'Romance' },
  { slug: 'school-life', name: 'School Life' },
  { slug: 'sci-fi', name: 'Sci-fi' },
  { slug: 'shoujo', name: 'Shoujo' },
  { slug: 'shoujo-ai', name: 'Shoujo Ai' },
  { slug: 'shounen', name: 'Shounen' },
  { slug: 'shounen-ai', name: 'Shounen Ai' },
  { slug: 'slice-of-life', name: 'Slice of Life' },
  { slug: 'smut', name: 'Smut' },
  { slug: 'sports', name: 'Sports' },
  { slug: 'super-power', name: 'Super Power' },
  { slug: 'supernatural', name: 'Supernatural' },
  { slug: 'thi-pham', name: 'Thi Phạm' },
  { slug: 'thieu-nhi', name: 'Thiếu Nhi' },
  { slug: 'tragedy', name: 'Tragedy' },
  { slug: 'truyen-tranh-18', name: 'Truyện Tranh 18+' },
  { slug: 'webo-comic', name: 'Webo Comic' },
  { slug: 'webtoon', name: 'Webtoon' },
  { slug: 'xuyen-khong', name: 'Xuyên Không' },
]

const activeGenre = ref('action')

// Tabs
const tabs = [
  { id: 'home', name: 'Trang Chủ', icon: 'ph:house' },
  { id: 'genres', name: 'Thể Loại', icon: 'ph:squares-four' },
  { id: 'history', name: 'Lịch sử đọc', icon: 'ph:clock' },
  { id: 'bookmarks', name: 'Truyện đã lưu', icon: 'ph:bookmark-simple' },
]

// Fetching logic
const fetchComics = async (page = 1) => {
  comics.value = []
  currentPage.value = page

  const processResponse = (res: OTruyenResponse | null, filterComingSoon = false) => {
    if (res?.data?.items) {
      let items = res.data.items
      if (filterComingSoon) {
        items = items.filter((c) => c.status !== 'coming_soon' && c.status !== 'Sắp ra mắt')
      }
      comics.value = items
      const pag = res.data.params?.pagination
      if (pag) {
        totalItems.value = pag.totalItems || comics.value.length
        totalPages.value =
          pag.totalItems && pag.totalItemsPerPage
            ? Math.ceil(pag.totalItems / pag.totalItemsPerPage)
            : 1
      } else {
        totalPages.value = 1
        totalItems.value = comics.value.length
      }
    }
  }

  if (activeTab.value === 'home') {
    // Dashboard mode: fetch 3 different categories
    if (page === 1) {
      const [recentRes, rcmRes, comingSoonRes] = await Promise.all([
        getRecentComics(1),
        getComicsByCategory('truyen-moi', 1), // "truyen-moi" acts as recommendation on otruyen
        getComingSoonComics(1),
      ])

      if (recentRes?.data?.items) {
        homeMoiCapNhat.value = recentRes.data.items
          .filter((c) => c.status !== 'coming_soon' && c.status !== 'Sắp ra mắt')
          .slice(0, 12)
      }
      if (rcmRes?.data?.items) {
        homeDeXuat.value = rcmRes.data.items.slice(0, 10) // show top 10
      }
      if (comingSoonRes?.data?.items) {
        homeSapRaMat.value = comingSoonRes.data.items.slice(0, 10) // show top 10
      }

      // Pagination for recent comics only at bottom
      processResponse(recentRes, true)
    } else {
      const res = await getRecentComics(page)
      processResponse(res, true)
      homeMoiCapNhat.value = comics.value
    }
  } else if (activeTab.value === 'search') {
    if (!searchQuery.value) return
    const res = await searchComics(searchQuery.value, page)
    processResponse(res)
  } else if (activeTab.value === 'genres') {
    const res = await getComicsByCategory(activeGenre.value, page)
    processResponse(res)
  }
}

watch(activeTab, () => {
  selectedComic.value = null
  readingChapter.value = null
  if (
    activeTab.value !== 'history' &&
    activeTab.value !== 'search' &&
    activeTab.value !== 'bookmarks'
  ) {
    fetchComics(1)
  }
})

watch(activeGenre, () => {
  if (activeTab.value === 'genres') {
    fetchComics(1)
  }
})

const handleSearch = () => {
  if (searchInput.value.trim()) {
    searchQuery.value = searchInput.value.trim()
    activeTab.value = 'search'
    fetchComics(1)
  }
}

const goHome = () => {
  activeTab.value = 'home'
  selectedComic.value = null
  readingChapter.value = null
  searchQuery.value = ''
  searchInput.value = ''
  currentPage.value = 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleTabClick = (tabId: string) => {
  if (activeTab.value === tabId) {
    selectedComic.value = null
    readingChapter.value = null
    if (tabId === 'home') currentPage.value = 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    activeTab.value = tabId
  }
}

const handleComicClick = (comic: ComicItem | { slug: string; name: string; thumb_url: string }) => {
  selectedComic.value = {
    slug: comic.slug,
    name: comic.name,
    thumb_url: comic.thumb_url,
  }
  readingChapter.value = null // reset reader state
}

const handleReadChapter = (
  api_data: string,
  name: string,
  chapters: { name: string; api_data: string }[] = [],
) => {
  readingChapter.value = { api_data, name }
  if (chapters && chapters.length > 0) {
    currentComicChapters.value = chapters
  }

  if (selectedComic.value) {
    let thumbUrl = selectedComic.value.thumb_url
    if (!thumbUrl.startsWith('http')) {
      thumbUrl = IMAGE_URL_BASE.value + thumbUrl
    }

    addToHistory({
      slug: selectedComic.value.slug,
      name: selectedComic.value.name,
      thumb_url: thumbUrl,
      last_watched: Date.now(),
      chapter_name: name,
    })
  }
}

const closeReader = () => {
  readingChapter.value = null
}

const getRandomComic = async () => {
  // try fetching a random page from newest 1 to 5
  const randomPage = Math.floor(Math.random() * 5) + 1
  const res = await getRecentComics(randomPage)
  if (res?.data?.items?.length) {
    const items = res.data.items
    const randomItem = items[Math.floor(Math.random() * items.length)]
    handleComicClick(randomItem as ComicItem)
  }
}

onMounted(() => {
  fetchComics(1)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep font-body text-text-primary relative">
    <!-- Nút vể Web Chính góc nhỏ -->
    <RouterLink
      to="/"
      class="fixed top-3 left-3 md:top-5 md:left-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface/60 border border-white/10 text-text-secondary backdrop-blur-md transition-all hover:bg-accent-coral hover:text-bg-deep hover:border-accent-coral shadow-sm hover:shadow-accent-coral/20 hover:-translate-x-1"
      title="Về Trang Chủ VibeWeb"
    >
      <Icon icon="ph:house-line" class="h-5 w-5" />
    </RouterLink>

    <!-- Header -->
    <!-- Header -->
    <header
      class="sticky top-0 z-50 border-b border-white/5 bg-bg-deep/90 backdrop-blur-xl shadow-lg transition-all"
    >
      <div
        class="mx-auto flex h-16 md:h-18 max-w-7xl items-center justify-between px-4 sm:px-6 gap-4"
      >
        <!-- Left: Logo & Desktop Nav -->
        <div class="flex items-center gap-8 h-full">
          <!-- Logo -->
          <button
            @click="goHome"
            class="flex items-center gap-2 group shrink-0 ml-10 md:ml-12 lg:ml-16"
          >
            <div
              class="rounded-lg bg-accent-coral/10 p-1.5 transition-colors group-hover:bg-accent-coral/20"
            >
              <Icon icon="ph:books-fill" class="h-6 w-6 text-accent-coral" />
            </div>
            <h1 class="font-display text-xl sm:text-2xl font-bold tracking-tight hidden sm:block">
              <span class="text-accent-coral drop-shadow-sm">Truyện</span>
              <span class="text-text-primary">Hay</span>
            </h1>
          </button>

          <!-- Desktop Navigation Tabs -->
          <nav class="hidden md:flex items-center gap-1 h-full">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="group flex h-full items-center gap-2 px-4 font-display text-sm font-semibold transition-all relative"
              :class="[
                activeTab === tab.id
                  ? 'text-accent-coral'
                  : 'text-text-secondary hover:text-text-primary',
              ]"
              @click="handleTabClick(tab.id)"
            >
              <Icon :icon="tab.icon" class="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>{{ tab.name }}</span>
              <!-- Active Indicator Bar -->
              <div
                v-if="activeTab === tab.id"
                class="absolute bottom-0 left-0 w-full h-1 bg-accent-coral rounded-t-sm shadow-[0_0_10px_rgba(255,107,107,0.5)]"
              ></div>
            </button>
          </nav>
        </div>

        <!-- Right: Search Bar & Random -->
        <div class="flex items-center flex-1 max-w-sm shrink-0 w-full sm:w-auto gap-2">
          <form @submit.prevent="handleSearch" class="relative w-full group">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Icon
                icon="ph:magnifying-glass"
                class="h-4 w-4 text-text-dim group-focus-within:text-accent-coral transition-colors"
              />
            </div>
            <input
              v-model="searchInput"
              type="text"
              placeholder="Tìm kiếm..."
              class="w-full rounded-full border border-white/10 bg-bg-surface/50 py-2 pl-11 pr-4 text-sm outline-none backdrop-blur-sm transition-all focus:border-accent-coral focus:bg-bg-surface focus:shadow-[0_0_15px_rgba(255,107,107,0.15)] placeholder:text-text-dim"
            />
          </form>

          <button
            @click="getRandomComic"
            class="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-bg-surface/50 border border-white/10 hover:bg-accent-sky hover:border-accent-sky hover:text-bg-deep text-text-secondary transition-all shadow-sm"
            title="Đọc truyện ngẫu nhiên"
          >
            <Icon icon="ph:shuffle-bold" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Tabs (Scrollable Row) -->
      <div
        class="md:hidden border-t border-white/5 bg-bg-deep py-2 px-2 shadow-inner h-[52px] flex items-center"
      >
        <nav
          class="flex w-full items-center gap-2 overflow-x-auto pb-1 flex-nowrap custom-scrollbar"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="group flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 font-display text-sm font-semibold transition-all border"
            :class="[
              activeTab === tab.id
                ? 'bg-accent-coral/10 border-accent-coral text-accent-coral shadow-sm'
                : 'bg-bg-surface border-transparent text-text-secondary',
            ]"
            @click="handleTabClick(tab.id)"
          >
            <Icon :icon="tab.icon" class="h-4 w-4" />
            <span>{{ tab.name }}</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Genres Full Grid -->
    <div
      v-if="activeTab === 'genres' && !selectedComic && !readingChapter"
      class="border-b border-border-default bg-bg-surface/30 pt-6 pb-4"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6">
        <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class="h-8 w-8 flex items-center justify-center rounded-lg bg-accent-amber/10 text-accent-amber"
            >
              <Icon icon="ph:squares-four" class="w-5 h-5" />
            </div>
            <span class="text-sm font-semibold text-text-secondary">Chọn Thể Loại:</span>
          </div>
          <div
            class="text-xs font-display font-medium px-3 py-1.5 rounded-full bg-bg-deep border border-border-default text-text-secondary self-start sm:self-auto"
          >
            Tìm thấy <span class="text-accent-coral font-bold">{{ totalItems }}</span> truyện
          </div>
        </div>
        <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          <button
            v-for="genre in genresList"
            :key="genre.slug"
            @click="activeGenre = genre.slug"
            class="px-4 py-2 rounded-lg text-xs font-semibold transition-all border"
            :class="
              activeGenre === genre.slug
                ? 'bg-accent-amber border-accent-amber text-bg-deep shadow-md'
                : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-amber/50 hover:text-text-primary'
            "
          >
            {{ genre.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Panel -->
    <main v-if="!readingChapter" class="mx-auto max-w-7xl px-2 sm:px-4 py-6 sm:py-8 md:px-6">
      <ComicDetail
        v-if="selectedComic"
        :slug="selectedComic.slug"
        @back="selectedComic = null"
        @read-chapter="handleReadChapter"
      />

      <div v-else>
        <!-- Loading State -->
        <div v-if="isLoading" class="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <Icon icon="ph:spinner-gap-bold" class="h-10 w-10 animate-spin text-accent-coral" />
          <p class="font-display font-semibold text-text-secondary animate-pulse">
            Đang tải dữ liệu...
          </p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
        >
          <div class="rounded-full bg-accent-coral/10 p-4 text-accent-coral">
            <Icon icon="ph:ghost" class="h-12 w-12" />
          </div>
          <p class="font-display text-lg font-semibold text-text-primary">Đã xảy ra lỗi</p>
          <p class="text-text-secondary">{{ error }}</p>
          <button
            @click="fetchComics(currentPage)"
            class="mt-4 rounded-full bg-accent-coral px-6 py-2 font-display font-semibold text-bg-deep transition-colors hover:bg-accent-coral/90"
          >
            Thử Lại
          </button>
        </div>

        <!-- Bookmarks Tab -->
        <div v-else-if="activeTab === 'bookmarks'" class="space-y-12 flex-1">
          <section>
            <h2
              class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-amber/20 text-accent-amber"
              >
                <Icon icon="ph:bookmark-simple-fill" class="h-5 w-5" />
              </div>
              Truyện đang theo dõi
            </h2>
            <div
              v-if="bookmarks.length === 0"
              class="rounded-xl border border-dashed border-border-default p-12 flex flex-col items-center gap-3 text-center text-text-secondary"
            >
              <Icon icon="ph:bookmark-simple-dashed" class="h-10 w-10 opacity-50" />
              <p>Bạn chưa theo dõi truyện nào.</p>
              <button
                @click="goHome"
                class="mt-2 text-accent-coral font-medium text-sm hover:underline"
              >
                Khám phá truyện ngay
              </button>
            </div>
            <div
              v-else
              class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              <button
                v-for="comic in paginatedBookmarks"
                :key="comic.slug"
                class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-bg-surface text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-amber/5"
                @click="handleComicClick(comic)"
              >
                <div class="aspect-[2/3] w-full bg-bg-deep">
                  <img
                    :src="comic.thumb_url"
                    :alt="comic.name"
                    class="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div
                    class="absolute right-2 top-2 rounded bg-accent-amber px-2 py-1 text-xs font-bold text-bg-deep shadow-md"
                  >
                    Đã Lưu
                  </div>
                </div>
                <div class="p-3">
                  <h3
                    class="line-clamp-2 font-display text-sm font-semibold transition-colors group-hover:text-accent-amber"
                  >
                    {{ comic.name }}
                  </h3>
                </div>
              </button>
            </div>
            <div v-if="bookmarkTotalPages > 1" class="mt-8 flex justify-center">
              <AppPagination
                :current-page="bookmarkPage"
                :total-pages="bookmarkTotalPages"
                @page-change="(p) => (bookmarkPage = p)"
              />
            </div>
          </section>
        </div>

        <!-- History Tab -->
        <div v-else-if="activeTab === 'history'" class="space-y-12 flex-1">
          <!-- Timeline History -->
          <section>
            <h2
              class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sky/20 text-accent-sky"
              >
                <Icon icon="ph:clock" class="h-5 w-5" />
              </div>
              Truyện đã đọc gần đây
            </h2>
            <div
              v-if="watchHistory.length === 0"
              class="rounded-xl border border-dashed border-border-default p-12 flex flex-col items-center gap-3 text-center text-text-secondary"
            >
              <Icon icon="ph:clock-dashed" class="h-10 w-10 opacity-50" />
              <p>Lịch sử đọc truyện trống.</p>
              <button
                @click="goHome"
                class="mt-2 text-accent-coral font-medium text-sm hover:underline"
              >
                Hãy đọc thử một bộ
              </button>
            </div>
            <div
              v-else
              class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              <button
                v-for="comic in paginatedHistory"
                :key="comic.slug"
                class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-bg-surface text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-sky/5 text-text-primary"
                @click="handleComicClick(comic)"
              >
                <div class="aspect-[2/3] w-full bg-bg-deep relative">
                  <img
                    :src="comic.thumb_url"
                    :alt="comic.name"
                    class="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <!-- Gradient overlay -->
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
                  ></div>

                  <!-- Bottom Text Overlay -->
                  <div
                    class="absolute bottom-0 left-0 w-full p-2.5 sm:p-3 flex flex-col justify-end"
                  >
                    <h3
                      class="line-clamp-2 font-display text-sm font-semibold text-white drop-shadow-md transition-colors group-hover:text-accent-sky"
                      :title="comic.name"
                    >
                      {{ comic.name }}
                    </h3>
                  </div>
                </div>

                <!-- Info Section -->
                <div class="p-2.5 sm:p-3 bg-bg-surface flex flex-col gap-1 border-t border-white/5">
                  <div v-if="comic.chapter_name" class="flex justify-between items-center text-xs">
                    <span class="text-accent-coral font-bold truncate"
                      >Đang đọc: Ch.{{ comic.chapter_name }}</span
                    >
                  </div>
                  <div class="flex items-center gap-1.5 text-text-dim text-[10px] mt-0.5">
                    <Icon icon="ph:clock" class="w-3 h-3" />
                    <span>{{ formatTimeAgo(comic.last_watched) }}</span>
                  </div>
                </div>
              </button>
            </div>
            <div v-if="historyTotalPages > 1" class="mt-8 flex justify-center">
              <AppPagination
                :current-page="historyPage"
                :total-pages="historyTotalPages"
                @page-change="(p) => (historyPage = p)"
              />
            </div>
          </section>
        </div>

        <!-- Search Results Tab -->
        <div v-else-if="activeTab === 'search'" class="space-y-8 flex-1">
          <h2
            class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-coral/20 text-accent-coral"
            >
              <Icon icon="ph:magnifying-glass" class="h-5 w-5" />
            </div>
            Kết quả tìm kiếm: <span class="text-text-secondary">"{{ searchQuery }}"</span>
          </h2>
          <div
            v-if="comics.length === 0 && searchQuery"
            class="rounded-xl border border-dashed border-border-default p-12 text-center text-text-secondary flex flex-col items-center justify-center gap-3"
          >
            <Icon icon="ph:ghost" class="h-8 w-8 opacity-50" />
            <p>Không tìm thấy truyện nào khớp với từ khóa của bạn.</p>
          </div>
          <div v-else class="space-y-8">
            <div class="mb-5 flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <p class="text-xs text-text-dim mt-1">Tổng: {{ totalItems }} truyện</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-text-secondary hidden sm:block">
                  Trang <span class="text-white font-medium">{{ currentPage }}</span> /
                  {{ totalPages }}
                </p>
              </div>
            </div>
            <ComicList :comics="comics" @click="handleComicClick" />
            <div class="mt-8 flex justify-center">
              <AppPagination
                :current-page="currentPage"
                :total-pages="totalPages"
                @page-change="fetchComics"
              />
            </div>
          </div>
        </div>

        <!-- List Tabs (home, genres) -->
        <div v-else class="space-y-12 flex-1">
          <div class="mb-5 flex items-end justify-between border-b border-white/5 pb-4">
            <h2
              class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-coral/10 text-accent-coral"
              >
                <Icon
                  :icon="tabs.find((t) => t.id === activeTab)?.icon || 'ph:books'"
                  class="h-5 w-5"
                />
              </div>
              {{
                activeTab === 'genres'
                  ? `Tuyển tập: ${genresList.find((g) => g.slug === activeGenre)?.name}`
                  : activeTab === 'home' && currentPage === 1
                    ? 'Mới Cập Nhật'
                    : tabs.find((t) => t.id === activeTab)?.name
              }}
            </h2>
            <div class="text-right">
              <p class="text-sm text-text-secondary hidden sm:block">
                Trang <span class="text-white font-medium">{{ currentPage }}</span> /
                {{ totalPages }}
              </p>
              <p v-if="activeTab !== 'genres'" class="text-xs text-text-dim hidden sm:block mt-1">
                Tổng: {{ totalItems }} truyện
              </p>
            </div>
          </div>

          <!-- Professional Dashboard layout for home page -->
          <div v-if="activeTab === 'home'">
            <div v-if="currentPage === 1" class="space-y-12">
              <!-- Continue Reading Row -->
              <!-- Recent Updates Grid -->
              <section v-if="homeMoiCapNhat.length > 0">
                <div class="flex items-center justify-between mb-4 px-2">
                  <h3
                    class="font-display text-lg sm:text-xl font-bold flex items-center gap-2 text-white"
                  >
                    Mới cập nhật
                  </h3>
                </div>
                <ComicList :comics="homeMoiCapNhat" layout="grid" @click="handleComicClick" />
              </section>

              <!-- Promoted/Recommended Row -->
              <section v-if="homeDeXuat.length > 0">
                <div class="flex items-center justify-between mb-4 px-2">
                  <h3
                    class="font-display text-lg sm:text-xl font-bold flex items-center gap-2 text-white"
                  >
                    Đọc nhiều
                  </h3>
                </div>
                <ComicList :comics="homeDeXuat" layout="row" autoScroll @click="handleComicClick" />
              </section>

              <!-- Coming Soon Row -->
              <section v-if="homeSapRaMat.length > 0">
                <div class="flex items-center justify-between mb-4 px-2">
                  <h3
                    class="font-display text-lg sm:text-xl font-bold flex items-center gap-2 text-white"
                  >
                    Sắp ra mắt
                  </h3>
                </div>
                <ComicList
                  :comics="homeSapRaMat"
                  layout="row"
                  autoScroll
                  hide-status
                  @click="handleComicClick"
                />
              </section>
            </div>

            <!-- Pagination view for home -->
            <div v-else>
              <ComicList :comics="homeMoiCapNhat" layout="grid" @click="handleComicClick" />
            </div>
          </div>

          <div v-else>
            <ComicList :comics="comics" layout="grid" @click="handleComicClick" />
          </div>

          <div class="mt-12 flex justify-center pt-4">
            <AppPagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="fetchComics"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer
        class="mt-20 border-t border-white/5 pt-10 pb-12 text-center text-sm w-full transition-opacity opacity-70 hover:opacity-100"
      >
        <div class="flex flex-col items-center justify-center gap-2">
          <div class="h-1 w-10 rounded-full bg-accent-coral/50 mb-4"></div>
          <p class="font-display text-text-secondary">
            Created by
            <span
              class="bg-gradient-to-r from-accent-coral to-accent-amber bg-clip-text font-bold text-transparent text-base tracking-wide"
              >Nguyen Duc Kien</span
            >
          </p>
          <p class="text-text-dim text-xs tracking-wider uppercase mt-1">
            VibeCoding &mdash; J2TEAM Community
          </p>
        </div>
      </footer>
    </main>

    <!-- Full Reader View Component Layer -->
    <ComicReader
      v-if="readingChapter && selectedComic"
      :chapterApiData="readingChapter.api_data"
      :chapterName="readingChapter.name"
      :comicName="selectedComic.name"
      :allChapters="currentComicChapters"
      @back="closeReader"
      @change-chapter="
        (api_data: string, name: string) => handleReadChapter(api_data, name, currentComicChapters)
      "
    />
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--color-bg-deep);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-dim);
}
</style>
