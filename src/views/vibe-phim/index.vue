<script setup lang="ts">
import BackToTop from '@/components/BackToTop.vue'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useMovieDetail } from './composables/useMovieDetail'
import { MOVIE_CATEGORIES, useMovieList, type MovieCategory } from './composables/useMovieList'
import type { Movie } from './types'

// ==================== Composables ====================
const movieListComposable = useMovieList()
const movieDetailComposable = useMovieDetail()

const { listData, carouselData, getListData, getCarouselData, searchMovieData, switchCategory } =
  movieListComposable

const { movieDetail, episodes, currentM3u8Url, fetchMovieDetail, fetchMovieActors, selectEpisode } =
  movieDetailComposable

// ==================== State ====================
const searchQuery = ref('')
const selectedMovie = ref<Movie | null>(null)
const favorites = useLocalStorage<string[]>('vibe-phim-favorites', [])
const carouselIndex = ref(0)
const showVideoPlayer = ref(false)
const selectedEpisodeGroupIdx = ref(0)
const selectedServerIdx = ref(0)
const selectedEpisodeGroupPage = ref(1)
const currentEpisodeIdx = ref(0)

// ==================== Lifecycle ====================
onMounted(async () => {
  await movieListComposable.initializeConfig()
  await getListData('hot')
  await getCarouselData(8)

  // Auto rotate carousel
  setInterval(() => {
    if (carouselData.value.length > 0) {
      carouselIndex.value = (carouselIndex.value + 1) % carouselData.value.length
    }
  }, 5000)
})

// Watch movie change in modal
watch(selectedMovie, async (newMovie) => {
  if (newMovie) {
    selectedServerIdx.value = 0
    selectedEpisodeGroupPage.value = 1
    currentEpisodeIdx.value = 0
    await fetchMovieDetail(newMovie.slug)
    await fetchMovieActors(newMovie.slug)
  }
})

// ==================== Computed ====================
const isFavorite = computed(() => {
  return selectedMovie.value ? favorites.value.includes(selectedMovie.value._id) : false
})

const currentCarouselMovie = computed(() => {
  return carouselData.value[carouselIndex.value] || null
})

const currentEpisodeGroup = computed(() => {
  return episodes.value[selectedEpisodeGroupIdx.value]
})

const currentEpisodes = computed(() => {
  if (!currentEpisodeGroup.value?.server_data) return []
  const start = (selectedEpisodeGroupPage.value - 1) * 50
  const end = start + 50
  return currentEpisodeGroup.value.server_data.slice(start, end)
})

const totalEpisodeGroups = computed(() => {
  return currentEpisodeGroup.value?.server_data?.length
    ? Math.ceil(currentEpisodeGroup.value.server_data.length / 50)
    : 0
})

const currentEpisode = computed(() => {
  return currentEpisodeGroup.value?.server_data?.[currentEpisodeIdx.value]
})

// ==================== Methods ====================
const openModal = (movie: Movie) => {
  selectedMovie.value = movie
}

const closeModal = () => {
  selectedMovie.value = null
  showVideoPlayer.value = false
}

const playEpisodeModal = (relativeIdx: number) => {
  const absoluteIdx = (selectedEpisodeGroupPage.value - 1) * 50 + relativeIdx
  currentEpisodeIdx.value = absoluteIdx
  const episode = currentEpisodeGroup.value?.server_data?.[absoluteIdx]
  if (episode) {
    selectEpisode(selectedEpisodeGroupIdx.value, absoluteIdx)
    showVideoPlayer.value = true
  }
}

const playNextEpisode = () => {
  if (!currentEpisodeGroup.value?.server_data) return
  const nextIdx = currentEpisodeIdx.value + 1
  if (nextIdx < currentEpisodeGroup.value.server_data.length) {
    currentEpisodeIdx.value = nextIdx
    selectEpisode(selectedEpisodeGroupIdx.value, nextIdx)
    // Update page if needed
    selectedEpisodeGroupPage.value = Math.floor(nextIdx / 50) + 1
  }
}

const playPreviousEpisode = () => {
  if (currentEpisodeIdx.value > 0) {
    currentEpisodeIdx.value = currentEpisodeIdx.value - 1
    selectEpisode(selectedEpisodeGroupIdx.value, currentEpisodeIdx.value)
    // Update page if needed
    selectedEpisodeGroupPage.value = Math.floor(currentEpisodeIdx.value / 50) + 1
  }
}

const changeEpisodeGroup = (page: number) => {
  selectedEpisodeGroupPage.value = page
}

const changeServerInPlayer = (serverIdx: number) => {
  selectedServerIdx.value = serverIdx
  selectedEpisodeGroupIdx.value = serverIdx
  currentEpisodeIdx.value = 0
  selectedEpisodeGroupPage.value = 1
  // Auto play first episode of new server
  if (
    episodes.value &&
    serverIdx !== undefined &&
    episodes.value[serverIdx] &&
    episodes.value[serverIdx]?.server_data?.length > 0
  ) {
    selectEpisode(serverIdx, 0)
    showVideoPlayer.value = true
  }
}

const toggleFavorite = () => {
  if (!selectedMovie.value) return

  const movieId = selectedMovie.value._id
  const index = favorites.value.indexOf(movieId)

  if (index > -1) {
    favorites.value.splice(index, 1)
  } else {
    favorites.value.push(movieId)
  }
}

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await searchMovieData(searchQuery.value)
  } else {
    await getListData('hot')
  }
}

const handleCategorySwitch = async (category: MovieCategory) => {
  await switchCategory(category)
}

const playEpisode = (groupIdx: number, episodeIdx: number = 0) => {
  selectedEpisodeGroupIdx.value = groupIdx
  selectEpisode(groupIdx, episodeIdx)
  showVideoPlayer.value = true
}

const getImageUrl = (url: string | undefined): string => {
  if (!url) return 'https://via.placeholder.com/300x450?text=No+Image'
  if (url.startsWith('http')) return url
  return `${movieListComposable.imageBaseUrl.value}${url}`
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <!-- Header -->
    <div class="border-b border-border-default bg-bg-surface py-6">
      <div class="mx-auto max-w-5xl px-6">
        <div class="mb-6 flex items-center justify-between">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 text-accent-sky transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:arrow-left" class="size-5" />
            <span class="text-sm font-display">Back</span>
          </RouterLink>
        </div>

        <h1 class="font-display text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
          <span class="text-accent-coral">🎬</span> Vibe Phim
        </h1>
        <p class="mt-2 text-xs text-text-secondary sm:text-sm">
          Khám phá bộ sưu tập phim tuyệt vời từ ophim1
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="mx-auto max-w-5xl px-6 py-12">
      <!-- Carousel Section -->
      <div v-if="carouselData.length > 0" class="mb-16 animate-fade-up">
        <h2 class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold">
          <span class="text-accent-coral">//</span>
          Trending
        </h2>

        <div class="relative overflow-hidden border border-border-default bg-bg-surface">
          <!-- Main Carousel Image -->
          <div class="relative h-64 overflow-hidden bg-bg-deep sm:h-80 md:h-96 lg:h-125">
            <img
              v-if="currentCarouselMovie"
              :src="getImageUrl(currentCarouselMovie.thumb_url || currentCarouselMovie.poster_url)"
              :alt="currentCarouselMovie.name"
              class="h-full w-full object-cover transition-all duration-500"
            />

            <!-- Gradient Overlay -->
            <div
              class="absolute inset-0 bg-linear-to-r from-bg-deep/90 via-bg-deep/50 to-transparent"
            />

            <!-- Movie Info Overlay -->
            <div
              v-if="currentCarouselMovie"
              class="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-6 lg:p-10"
            >
              <div class="space-y-2 sm:space-y-3">
                <h3
                  class="font-display text-lg font-bold text-text-primary sm:text-2xl md:text-3xl lg:text-4xl line-clamp-2"
                >
                  {{ currentCarouselMovie.name }}
                </h3>
                <p
                  class="line-clamp-1 text-xs text-text-secondary sm:line-clamp-2 sm:text-sm md:text-base"
                >
                  {{ currentCarouselMovie.content }}
                </p>

                <!-- Meta Info -->
                <div
                  class="flex flex-wrap gap-2 pt-1 text-xs text-text-dim sm:gap-4 sm:pt-2 md:text-sm"
                >
                  <span v-if="currentCarouselMovie.year" class="flex items-center gap-1">
                    <Icon icon="lucide:calendar" class="size-3 sm:size-4" />
                    {{ currentCarouselMovie.year }}
                  </span>
                  <span v-if="currentCarouselMovie.quality" class="flex items-center gap-1">
                    <Icon icon="lucide:film" class="size-3 sm:size-4" />
                    {{ currentCarouselMovie.quality }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="lucide:type" class="size-3 sm:size-4" />
                    {{ currentCarouselMovie.type }}
                  </span>
                </div>

                <!-- CTA Button -->
                <div class="pt-2 sm:pt-4">
                  <button
                    @click="openModal(currentCarouselMovie)"
                    class="inline-flex items-center gap-1 border border-accent-coral bg-accent-coral/10 px-3 py-2 font-display text-xs font-semibold text-accent-coral transition-all hover:bg-accent-coral/20 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
                  >
                    <Icon icon="lucide:play" class="size-4 sm:size-5" />
                    Xem Chi Tiết
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Carousel Navigation -->
          <div class="border-t border-border-default bg-bg-deep p-2 sm:p-4">
            <div class="flex items-center justify-between gap-2 sm:gap-4">
              <!-- Thumbnails -->
              <div class="flex gap-1 overflow-x-auto sm:gap-2">
                <button
                  v-for="(movie, idx) in carouselData"
                  :key="movie._id"
                  @click="carouselIndex = idx"
                  :class="[
                    'shrink-0 border-2 transition-all',
                    carouselIndex === idx
                      ? 'border-accent-coral'
                      : 'border-border-default hover:border-accent-amber',
                  ]"
                >
                  <img
                    :src="getImageUrl(movie.thumb_url || movie.poster_url)"
                    :alt="movie.name"
                    class="h-16 w-12 object-cover sm:h-20 sm:w-16"
                  />
                </button>
              </div>

              <!-- Indicators -->
              <div class="flex gap-1">
                <button
                  v-for="(_, idx) in carouselData"
                  :key="idx"
                  @click="carouselIndex = idx"
                  :class="[
                    'h-1.5 transition-all sm:h-2',
                    carouselIndex === idx ? 'w-6 bg-accent-coral sm:w-8' : 'w-1.5 bg-text-dim',
                  ]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mb-12 animate-fade-up animate-delay-1">
        <div class="relative">
          <Icon
            icon="lucide:search"
            class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-secondary"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm phim..."
            @keyup.enter="handleSearch"
            class="w-full border border-border-default bg-bg-surface py-3 pl-12 pr-12 text-text-primary placeholder-text-dim outline-none transition-all duration-300 focus:border-accent-coral focus:bg-bg-elevated"
          />
          <button
            @click="handleSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:arrow-right" class="size-5" />
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div
        class="mb-12 animate-fade-up animate-delay-2 -mx-6 overflow-x-auto border-b border-border-default px-6"
      >
        <div class="flex gap-2">
          <button
            v-for="cat in MOVIE_CATEGORIES"
            :key="cat.id"
            @click="handleCategorySwitch(cat.id)"
            :class="[
              'shrink-0 flex items-center gap-1 px-3 py-3 border-b-2 transition-all duration-300 font-display text-xs font-semibold whitespace-nowrap sm:gap-2 sm:px-4 sm:text-sm',
              movieListComposable.currentCategory.value === cat.id
                ? 'border-accent-coral text-accent-coral'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-accent-amber/50',
            ]"
          >
            <Icon :icon="cat.icon" class="size-4" />
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Movie Grid -->
      <div
        v-if="listData.length > 0"
        class="grid gap-4 animate-fade-up animate-delay-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        <button
          v-for="movie in listData"
          :key="movie._id"
          @click="openModal(movie)"
          class="group cursor-pointer text-left"
        >
          <div
            class="relative overflow-hidden border border-border-default bg-bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <!-- Movie Image -->
            <div class="relative h-56 overflow-hidden bg-bg-deep sm:h-64 md:h-72">
              <img
                :src="getImageUrl(movie.thumb_url || movie.poster_url)"
                :alt="movie.name"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <!-- Play Button Overlay -->
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <button
                  @click.stop="playEpisode(0, 0)"
                  v-if="movie.episodes && movie.episodes.length > 0"
                  class="flex items-center justify-center size-12 border-2 border-accent-coral bg-accent-coral/20 transition-all hover:bg-accent-coral hover:text-bg-deep sm:size-16"
                >
                  <Icon icon="lucide:play" class="size-6 ml-1 sm:size-8" />
                </button>
              </div>

              <!-- Status Badge -->
              <div
                v-if="movie.episode_current || movie.status"
                class="absolute right-2 top-2 border border-accent-amber bg-bg-deep/90 px-2 py-1 backdrop-blur-sm sm:right-3 sm:top-3 sm:px-3 sm:py-2"
              >
                <p class="font-display text-xs font-bold text-accent-amber sm:text-sm">
                  {{ movie.episode_current || movie.status }}
                </p>
              </div>

              <!-- Favorite Button -->
              <button
                v-if="favorites.includes(movie._id)"
                @click.stop
                class="absolute left-2 top-2 transition-colors duration-300 sm:left-3 sm:top-3"
              >
                <Icon icon="lucide:heart" class="size-5 text-accent-coral sm:size-6" />
              </button>
            </div>

            <!-- Movie Info -->
            <div class="border-t border-border-default p-2 sm:p-3 md:p-4">
              <h3
                class="font-display text-xs font-semibold text-text-primary line-clamp-2 sm:text-sm"
              >
                {{ movie.name }}
              </h3>

              <!-- Meta Info -->
              <div class="mt-1 space-y-0.5 text-left hidden sm:block">
                <p v-if="movie.year" class="text-xs text-text-secondary">{{ movie.year }}</p>
                <p class="truncate text-xs text-text-dim">
                  {{ movie.origin_name || 'N/A' }}
                </p>
              </div>

              <!-- Categories/Genres -->
              <div
                v-if="movie.category && movie.category.length > 0"
                class="mt-2 flex flex-wrap gap-0.5 sm:flex"
              >
                <span
                  v-for="cat in movie.category.slice(0, 2)"
                  :key="cat.slug"
                  class="inline-block border border-accent-sky px-1 py-0.5 font-display text-xs text-accent-sky"
                >
                  {{ cat.name }}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="py-12 text-center">
        <Icon icon="lucide:search-x" class="mx-auto mb-4 size-12 text-text-secondary" />
        <p class="text-text-secondary">Không tìm thấy phim nào</p>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="selectedMovie"
      @click="closeModal"
      class="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm z-50"
    >
      <div
        @click.stop
        class="relative w-full max-w-2xl border border-border-default bg-bg-surface p-4 sm:p-8 animate-fade-up max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-none"
      >
        <!-- Close Button -->
        <button
          @click="closeModal"
          class="absolute right-4 top-4 text-text-secondary transition-colors hover:text-accent-coral"
        >
          <Icon icon="lucide:x" class="size-5 sm:size-6" />
        </button>

        <!-- Content -->
        <div class="flex flex-col gap-4 sm:gap-6 pt-6 sm:pt-0 sm:flex-row">
          <!-- Image -->
          <div class="shrink-0 hidden sm:block">
            <img
              :src="getImageUrl(selectedMovie.poster_url || selectedMovie.thumb_url)"
              :alt="selectedMovie.name"
              class="h-80 w-56 object-cover border border-border-default"
            />
          </div>

          <!-- Info -->
          <div class="flex-1">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-2 sm:gap-4">
              <div class="flex-1">
                <h2 class="font-display text-lg font-bold text-text-primary sm:text-2xl">
                  {{ selectedMovie.name }}
                </h2>
                <p class="mt-1 text-xs text-text-secondary sm:text-sm">
                  {{ selectedMovie.origin_name }}
                </p>
              </div>

              <!-- Favorite Button -->
              <button @click="toggleFavorite" class="group transition-transform hover:scale-110">
                <Icon
                  :icon="isFavorite ? 'lucide:heart' : 'lucide:heart'"
                  :class="[
                    'size-6 sm:size-8 transition-colors',
                    isFavorite
                      ? 'text-accent-coral fill-accent-coral'
                      : 'text-text-secondary group-hover:text-accent-coral',
                  ]"
                />
              </button>
            </div>

            <!-- Director/Country -->
            <div
              v-if="selectedMovie.director && selectedMovie.director.length > 0"
              class="mb-4 border-l-4 border-accent-coral pl-4"
            >
              <p class="text-xs uppercase tracking-widest text-text-dim">Đạo diễn</p>
              <p class="font-display text-xs font-semibold text-text-primary sm:text-sm">
                {{ selectedMovie.director.join(', ') }}
              </p>
            </div>

            <!-- Meta Stats -->
            <div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
              <div class="border border-border-default bg-bg-deep p-2 sm:p-3">
                <p class="text-xs uppercase tracking-widest text-text-dim">Năm</p>
                <p class="mt-1 font-display text-base font-bold text-text-primary sm:text-xl">
                  {{ selectedMovie.year }}
                </p>
              </div>
              <div class="border border-border-default bg-bg-deep p-2 sm:p-3">
                <p class="text-xs uppercase tracking-widest text-text-dim">Chất lượng</p>
                <p class="mt-1 font-display text-xs font-bold text-accent-amber sm:text-base">
                  {{ selectedMovie.quality || 'HD' }}
                </p>
              </div>
              <div
                class="border border-border-default bg-bg-deep p-2 sm:p-3 col-span-2 sm:col-span-1"
              >
                <p class="text-xs uppercase tracking-widest text-text-dim">Thời gian</p>
                <p class="mt-1 font-display text-xs font-bold text-accent-sky sm:text-base">
                  {{ selectedMovie.time || 'N/A' }}
                </p>
              </div>
            </div>

            <!-- Description -->
            <div class="mb-4">
              <p class="text-xs uppercase tracking-widest text-text-dim">Nội dung</p>
              <p
                class="mt-2 line-clamp-3 sm:line-clamp-4 text-xs leading-relaxed text-text-secondary sm:text-sm"
              >
                {{ selectedMovie.content }}
              </p>
            </div>

            <!-- Categories -->
            <div v-if="selectedMovie.category && selectedMovie.category.length > 0" class="mb-4">
              <p class="mb-2 text-xs uppercase tracking-widest text-text-dim">Thể loại</p>
              <div class="flex flex-wrap gap-1 sm:gap-2">
                <span
                  v-for="cat in selectedMovie.category.slice(0, 3)"
                  :key="cat.slug"
                  class="border border-accent-sky px-2 py-1 font-display text-xs text-accent-sky sm:px-3 sm:py-2 sm:text-sm"
                >
                  {{ cat.name }}
                </span>
              </div>
            </div>

            <!-- Countries -->
            <div v-if="selectedMovie.country && selectedMovie.country.length > 0" class="mb-6">
              <p class="mb-2 text-xs uppercase tracking-widest text-text-dim">Quốc gia</p>
              <div class="flex flex-wrap gap-1 sm:gap-2">
                <span
                  v-for="ctry in selectedMovie.country.slice(0, 3)"
                  :key="ctry.slug"
                  class="border border-accent-amber px-2 py-1 font-display text-xs text-accent-amber sm:px-3 sm:py-2 sm:text-sm"
                >
                  {{ ctry.name }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-2 sm:gap-3">
              <!-- Play Button -->
              <button
                v-if="movieDetail && movieDetail.episodes && movieDetail.episodes.length > 0"
                @click="playEpisode(0, 0)"
                class="flex items-center justify-center gap-2 border border-accent-coral bg-accent-coral/10 py-2 font-display text-xs font-semibold text-accent-coral transition-all hover:bg-accent-coral hover:text-bg-deep sm:py-3 sm:text-sm"
              >
                <Icon icon="lucide:play" class="size-4 sm:size-5" />
                Xem Phim
              </button>

              <!-- Episodes Display (if available) -->
              <div
                v-if="movieDetail && movieDetail.episodes && movieDetail.episodes.length > 0"
                class="border border-border-default bg-bg-deep p-2 max-h-32 overflow-y-auto"
              >
                <p class="mb-2 text-xs uppercase tracking-widest text-text-dim">Tập phim</p>
                <div class="grid grid-cols-6 gap-1 sm:grid-cols-8">
                  <button
                    v-for="(ep, idx) in (movieDetail.episodes[0]?.server_data || []).slice(0, 12)"
                    :key="`ep-${idx}`"
                    @click="playEpisode(0, idx)"
                    class="border border-border-default bg-bg-surface py-1 text-xs text-text-primary transition-all hover:border-accent-coral hover:bg-accent-coral/20 sm:py-2"
                  >
                    {{ idx + 1 }}
                  </button>
                </div>
              </div>

              <!-- Favorite & Close Buttons -->
              <div class="flex gap-2 sm:gap-3">
                <button
                  @click="toggleFavorite"
                  :class="[
                    'flex-1 border py-2 font-display text-xs font-semibold transition-all sm:py-3 sm:text-sm',
                    isFavorite
                      ? 'border-accent-coral bg-accent-coral/20 text-accent-coral hover:bg-accent-coral/30'
                      : 'border-border-default text-text-primary hover:border-accent-coral hover:text-accent-coral',
                  ]"
                >
                  <Icon
                    :icon="isFavorite ? 'lucide:heart' : 'lucide:heart'"
                    class="mr-1 inline size-4 sm:mr-2 sm:size-5"
                  />
                  {{ isFavorite ? 'Đã yêu thích' : 'Yêu thích' }}
                </button>
                <button
                  @click="closeModal"
                  class="flex-1 border border-border-default bg-bg-surface py-2 font-display text-xs font-semibold text-text-primary transition-all hover:border-accent-sky hover:text-accent-sky sm:py-3 sm:text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Video Player Modal -->
    <div
      v-if="showVideoPlayer && selectedMovie && currentM3u8Url"
      class="fixed inset-0 block bg-black z-50 pt-16 xl:px-40 px-2 overflow-y-auto video-modal"
    >
      <!-- Header with Movie Title & Back Button -->
      <div class="mb-4 flex items-center justify-between">
        <button
          @click="closeModal"
          class="flex items-center gap-2 text-text-secondary transition-colors hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="size-5 sm:size-6" />
          <span class="text-xs sm:text-sm font-display">{{ selectedMovie.name }}</span>
        </button>
        <button
          @click="closeModal"
          class="text-text-secondary transition-colors hover:text-accent-coral"
        >
          <Icon icon="lucide:x" class="size-5 sm:size-6" />
        </button>
      </div>

      <!-- Video Player Container -->
      <div class="relative w-full bg-black mb-4 rounded-none sm:rounded-lg overflow-hidden">
        <div class="relative w-full aspect-video bg-black">
          <iframe
            v-if="currentM3u8Url.startsWith('http')"
            :src="currentM3u8Url"
            :key="currentM3u8Url"
            frameborder="0"
            allowfullscreen
            class="h-full w-full"
          />
          <!-- <video
            :key="currentM3u8Url"
            ref="videoPlayer"
            controls
            autoplay
            class="w-full h-full"
            crossorigin="anonymous"
          >
            <source :src="currentM3u8Url" type="application/x-mpegURL" />
            <p class="text-text-secondary text-center pt-4">Trình duyệt của bạn không hỗ trợ video HTML5</p>
          </video> -->
        </div>
      </div>

      <!-- Episode Info & Controls -->
      <div class="space-y-4 pb-8">
        <!-- Current Episode Info -->
        <div class="border border-border-default bg-bg-surface p-3 sm:p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="text-xs uppercase tracking-widest text-text-dim">
                {{ currentEpisodeGroup?.server_name }} - Tập {{ currentEpisodeIdx + 1 }}
              </p>
              <p class="mt-1 text-xs sm:text-sm text-text-secondary">
                {{ currentEpisode?.name || 'Episode ' + (currentEpisodeIdx + 1) }}
              </p>
            </div>
            <div class="flex gap-1 sm:gap-2">
              <button
                v-if="currentEpisodeIdx > 0"
                @click="playPreviousEpisode"
                class="border border-border-default bg-bg-deep px-2 py-1 text-text-primary transition-all hover:border-accent-amber sm:px-3"
                title="Tập trước"
              >
                <Icon icon="lucide:chevron-left" class="size-4" />
              </button>
              <button
                v-if="currentEpisodeIdx < (currentEpisodeGroup?.server_data?.length || 0) - 1"
                @click="playNextEpisode"
                class="border border-border-default bg-bg-deep px-2 py-1 text-text-primary transition-all hover:border-accent-amber sm:px-3"
                title="Tập tiếp"
              >
                <Icon icon="lucide:chevron-right" class="size-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Server Selection -->
        <div
          v-if="movieDetail && movieDetail.episodes"
          class="border border-border-default bg-bg-surface p-3 sm:p-4"
        >
          <p class="mb-3 text-xs uppercase tracking-widest text-text-dim">Chọn server</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(ep, idx) in movieDetail.episodes"
              :key="`server-${idx}`"
              @click="changeServerInPlayer(idx)"
              :class="[
                'border px-3 py-2 font-display text-xs transition-all sm:text-sm',
                selectedServerIdx === idx
                  ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                  : 'border-border-default text-text-primary hover:border-accent-amber hover:bg-bg-elevated',
              ]"
            >
              {{ ep.server_name }}
            </button>
          </div>
        </div>

        <!-- Episode List with Pagination -->
        <div class="border border-border-default bg-bg-surface p-3 sm:p-4">
          <p class="mb-3 text-xs uppercase tracking-widest text-text-dim">Danh sách tập</p>

          <!-- Episode Group Pagination Buttons -->
          <div v-if="totalEpisodeGroups > 1" class="mb-3 flex flex-wrap gap-1 sm:gap-2">
            <button
              v-for="page in totalEpisodeGroups"
              :key="`page-${page}`"
              @click="changeEpisodeGroup(page)"
              :class="[
                'border px-2 py-1 font-display text-xs transition-all sm:px-3 sm:py-2 sm:text-sm',
                selectedEpisodeGroupPage === page
                  ? 'border-accent-sky bg-accent-sky/20 text-accent-sky'
                  : 'border-border-default text-text-primary hover:border-accent-sky hover:text-accent-sky',
              ]"
            >
              {{ (page - 1) * 50 + 1 }}-{{
                Math.min(page * 50, currentEpisodeGroup?.server_data?.length || 0)
              }}
            </button>
          </div>

          <!-- Episode Grid -->
          <div
            class="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto sm:grid-cols-8 sm:gap-2 sm:max-h-48"
          >
            <button
              v-for="(ep, idx) in currentEpisodes"
              :key="`ep-${(selectedEpisodeGroupPage - 1) * 50 + idx}`"
              @click="playEpisodeModal(idx)"
              :class="[
                'border py-1 font-display text-xs transition-all sm:py-2 font-semibold',
                currentEpisodeIdx === idx
                  ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                  : 'border-border-default text-text-primary hover:border-accent-coral hover:bg-accent-coral/10',
              ]"
            >
              {{ (selectedEpisodeGroupPage - 1) * 50 + idx + 1 }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Back to Top -->
    <BackToTop />
  </div>
</template>

<style scoped>
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.6s ease-out forwards;
  opacity: 0;
}

.animate-delay-1 {
  animation-delay: 100ms;
}

.animate-delay-2 {
  animation-delay: 200ms;
}

.animate-delay-3 {
  animation-delay: 300ms;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
