<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'

interface AnimeTitle {
  romaji: string
  english: string | null
  native: string | null
}

interface AnimeDate {
  year: number | null
  month: number | null
  day: number | null
}

interface Studio {
  name: string
}

interface AnimeMedia {
  id: number
  title: AnimeTitle
  coverImage: { large: string; medium: string }
  format: string | null
  episodes: number | null
  genres: string[]
  popularity: number
  season: string | null
  seasonYear: number | null
  startDate: AnimeDate
  studios: { nodes: Studio[] }
}

interface PageInfo {
  total: number
  currentPage: number
  lastPage: number
  hasNextPage: boolean
  perPage: number
}

interface AniListResponse {
  data: {
    Page: {
      pageInfo: PageInfo
      media: AnimeMedia[]
    }
  }
}

const ANILIST_API = 'https://graphql.anilist.co'
const PER_PAGE = 20

const QUERY = `
query ($page: Int, $perPage: Int, $search: String, $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $genre: String, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media(status: NOT_YET_RELEASED, type: ANIME, sort: $sort, search: $search, season: $season, seasonYear: $seasonYear, format: $format, genre: $genre) {
      id
      title { romaji english native }
      coverImage { large medium }
      format
      episodes
      genres
      popularity
      season
      seasonYear
      startDate { year month day }
      studios(isMain: true) { nodes { name } }
    }
  }
}
`

const SEASONS: { value: string; label: string }[] = [
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' },
]

const FORMATS: { value: string; label: string }[] = [
  { value: 'TV', label: 'TV' },
  { value: 'TV_SHORT', label: 'TV Short' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'MUSIC', label: 'Music' },
]

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
]

const YEARS = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current + i)
})

const animeList = ref<AnimeMedia[]>([])
const pageInfo = ref<PageInfo | null>(null)
const currentPage = ref(1)
const loading = ref(false)
const error = ref('')

const searchInput = ref('')
const searchQuery = ref('')
const selectedSeason = ref('')
const selectedYear = ref('')
const selectedFormat = ref('')
const selectedGenre = ref('')

const hasActiveFilters = computed(
  () =>
    !!(
      searchQuery.value ||
      selectedSeason.value ||
      selectedYear.value ||
      selectedFormat.value ||
      selectedGenre.value
    ),
)

async function fetchAnime(page: number) {
  loading.value = true
  error.value = ''

  const variables: Record<string, unknown> = {
    page,
    perPage: PER_PAGE,
    sort: searchQuery.value ? ['SEARCH_MATCH', 'POPULARITY_DESC'] : ['POPULARITY_DESC'],
  }
  if (searchQuery.value) variables.search = searchQuery.value
  if (selectedSeason.value) variables.season = selectedSeason.value
  if (selectedYear.value) variables.seasonYear = Number(selectedYear.value)
  if (selectedFormat.value) variables.format = selectedFormat.value
  if (selectedGenre.value) variables.genre = selectedGenre.value

  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = (await res.json()) as AniListResponse
    animeList.value = json.data.Page.media
    pageInfo.value = json.data.Page.pageInfo
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Đã xảy ra lỗi khi tải dữ liệu.'
    animeList.value = []
    pageInfo.value = null
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  currentPage.value = 1
  fetchAnime(1)
}

function onSearch() {
  searchQuery.value = searchInput.value.trim()
  applyFilters()
}

function onFilterChange() {
  applyFilters()
}

function clearFilters() {
  searchInput.value = ''
  searchQuery.value = ''
  selectedSeason.value = ''
  selectedYear.value = ''
  selectedFormat.value = ''
  selectedGenre.value = ''
  applyFilters()
}

function goToPage(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const paginationRange = computed(() => {
  if (!pageInfo.value) return []
  const last = pageInfo.value.lastPage
  const current = currentPage.value
  const delta = 2
  const range: (number | string)[] = []

  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== '...') {
      range.push('...')
    }
  }

  return range
})

function formatSeason(season: string | null, year: number | null): string {
  if (!season && !year) return ''
  const seasonMap: Record<string, string> = {
    WINTER: 'Winter',
    SPRING: 'Spring',
    SUMMER: 'Summer',
    FALL: 'Fall',
  }
  const s = season ? (seasonMap[season] ?? season) : ''
  return `${s} ${year ?? ''}`.trim()
}

function formatFormat(f: string | null): string {
  if (!f) return '—'
  const map: Record<string, string> = {
    TV: 'TV',
    TV_SHORT: 'TV Short',
    MOVIE: 'Movie',
    SPECIAL: 'Special',
    OVA: 'OVA',
    ONA: 'ONA',
    MUSIC: 'Music',
  }
  return map[f] ?? f
}

watch(currentPage, (page) => fetchAnime(page), { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Header -->
    <header
      class="border-b border-border-default bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-10"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 class="font-display text-lg sm:text-xl font-bold text-text-primary">
          <span class="text-accent-coral">//</span> Anime sắp tới
        </h1>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <!-- Search & Filters -->
      <div class="space-y-3 mb-6 animate-fade-up">
        <!-- Search bar -->
        <form class="flex gap-2" @submit.prevent="onSearch">
          <input
            v-model="searchInput"
            type="text"
            placeholder="Tìm anime..."
            class="flex-1 border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
          />
          <button
            type="submit"
            class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            Tìm
          </button>
        </form>

        <!-- Filter row -->
        <div class="flex flex-wrap gap-2 animate-fade-up animate-delay-1">
          <select
            v-model="selectedSeason"
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary outline-none transition focus:border-accent-coral hover:border-accent-coral/50"
            @change="onFilterChange"
          >
            <option value="">Mùa</option>
            <option v-for="s in SEASONS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>

          <select
            v-model="selectedYear"
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary outline-none transition focus:border-accent-coral hover:border-accent-coral/50"
            @change="onFilterChange"
          >
            <option value="">Năm</option>
            <option v-for="y in YEARS" :key="y" :value="String(y)">{{ y }}</option>
          </select>

          <select
            v-model="selectedFormat"
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary outline-none transition focus:border-accent-coral hover:border-accent-coral/50"
            @change="onFilterChange"
          >
            <option value="">Định dạng</option>
            <option v-for="f in FORMATS" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>

          <select
            v-model="selectedGenre"
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary outline-none transition focus:border-accent-coral hover:border-accent-coral/50"
            @change="onFilterChange"
          >
            <option value="">Thể loại</option>
            <option v-for="g in GENRES" :key="g" :value="g">{{ g }}</option>
          </select>

          <button
            v-if="hasActiveFilters"
            class="border border-accent-coral/30 px-3 py-1.5 text-xs text-accent-coral transition hover:bg-accent-coral/10"
            @click="clearFilters"
          >
            Xoá bộ lọc
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
        <div
          class="w-8 h-8 border-2 border-accent-coral border-t-transparent rounded-full animate-spin"
        />
        <p class="text-text-secondary text-sm">Chờ xíu nghen ( •̀ ω •́ )✧</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-4">
        <p class="text-accent-coral font-display text-lg">Lỗi</p>
        <p class="text-text-secondary text-sm">{{ error }}</p>
        <button
          class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="fetchAnime(currentPage)"
        >
          Thử lại
        </button>
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Info bar -->
        <div
          v-if="pageInfo"
          class="flex flex-wrap items-center justify-between gap-2 mb-6 text-text-dim text-xs font-display tracking-wide animate-fade-up animate-delay-2"
        >
          <span>{{ pageInfo.total }} kết quả</span>
          <span>Trang {{ pageInfo.currentPage }} / {{ pageInfo.lastPage }}</span>
        </div>

        <!-- Empty state -->
        <div
          v-if="animeList.length === 0"
          class="flex flex-col items-center justify-center py-20 gap-3"
        >
          <p class="text-text-secondary text-sm">Không tìm thấy anime nào.</p>
          <button
            v-if="hasActiveFilters"
            class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="clearFilters"
          >
            Xoá bộ lọc
          </button>
        </div>

        <!-- Anime grid -->
        <div
          v-else
          class="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <a
            v-for="anime in animeList"
            :key="anime.id"
            :href="`https://anilist.co/anime/${anime.id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="group relative aspect-[2/3] overflow-hidden border border-border-default transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <img
              :src="anime.coverImage.large"
              :alt="anime.title.romaji"
              class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            <!-- Format badge -->
            <span
              class="absolute top-0 left-0 bg-accent-amber text-bg-deep text-[9px] sm:text-[10px] font-display font-bold tracking-wide px-1.5 py-0.5"
            >
              {{ formatFormat(anime.format) }}
            </span>

            <!-- Bottom overlay -->
            <div
              class="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-linear-to-t from-bg-deep from-25% via-bg-deep/85 via-55% to-transparent p-2.5 sm:p-3 pt-20"
            >
              <h3
                class="font-display text-xs sm:text-sm font-semibold text-text-primary leading-tight line-clamp-2 group-hover:text-accent-coral transition-colors"
              >
                {{ anime.title.english || anime.title.romaji }}
              </h3>
              <div class="flex items-center gap-1.5 text-[10px] text-text-secondary mt-1 truncate">
                <span v-if="anime.season || anime.seasonYear">{{
                  formatSeason(anime.season, anime.seasonYear)
                }}</span>
                <span
                  v-if="(anime.season || anime.seasonYear) && anime.studios.nodes.length"
                  class="text-text-dim"
                  >·</span
                >
                <span v-if="anime.studios.nodes.length" class="truncate text-text-dim">{{
                  anime.studios.nodes.map((s) => s.name).join(', ')
                }}</span>
              </div>
              <div v-if="anime.genres.length" class="flex flex-wrap gap-1 mt-1.5">
                <span
                  v-for="genre in anime.genres.slice(0, 3)"
                  :key="genre"
                  class="text-[8px] sm:text-[9px] border border-text-primary/20 px-1 py-px text-text-secondary"
                >
                  {{ genre }}
                </span>
              </div>
            </div>
          </a>
        </div>

        <!-- Pagination -->
        <nav
          v-if="pageInfo && pageInfo.lastPage > 1"
          class="mt-8 mb-4 flex items-center justify-center gap-1 sm:gap-2 flex-wrap"
        >
          <button
            :disabled="currentPage === 1"
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            @click="goToPage(currentPage - 1)"
          >
            &larr;
          </button>

          <template v-for="item in paginationRange" :key="item">
            <span v-if="item === '...'" class="px-2 text-text-dim text-xs">...</span>
            <button
              v-else
              :class="[
                'min-w-[32px] sm:min-w-[36px] border px-2 py-1.5 text-xs sm:text-sm transition',
                item === currentPage
                  ? 'border-accent-coral bg-accent-coral/10 text-accent-coral font-semibold'
                  : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-text-primary',
              ]"
              @click="goToPage(item as number)"
            >
              {{ item }}
            </button>
          </template>

          <button
            :disabled="!pageInfo.hasNextPage"
            class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            @click="goToPage(currentPage + 1)"
          >
            &rarr;
          </button>
        </nav>

        <!-- Footer credit -->
        <div class="text-center text-text-dim text-[10px] font-display tracking-wide mt-4 mb-8">
          Data lụm từ
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-sky link-underline"
            >AniList</a
          >
        </div>
      </template>
    </main>
  </div>
</template>
