<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useFetch, useIntervalFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// --- 1. NASA APOD Logic ---
const NASA_API_KEY = 'DEMO_KEY'
const nasaApiUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`

interface NasaApod {
  date: string
  explanation: string
  hdurl: string
  media_type: string
  title: string
  url: string
}

const isApodFetching = ref(true)
const apodError = ref(false)
const apodData = ref<NasaApod | null>(null)

/**
 * Basic translation using Google Translate gtx API
 */
async function translateText(text: string): Promise<string> {
  if (!text) return ''
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const data = (await res.json()) as [
      Array<[string, string, string | null, string | null, number]>,
    ]
    if (data && Array.isArray(data[0])) {
      return data[0].map((item) => item[0]).join('')
    }
  } catch (err) {
    console.warn('Translation failed, falling back to original text:', err)
  }
  return text
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

async function fetchAndTranslateApod() {
  isApodFetching.value = true
  apodError.value = false

  try {
    const { data, error } = await useFetch(nasaApiUrl).get().json<NasaApod>()

    if (error.value || !data.value) throw new Error('NASA API Error')

    const rawData = data.value
    const [translatedTitle, translatedExplanation] = await Promise.all([
      translateText(rawData.title),
      translateText(rawData.explanation),
    ])

    apodData.value = {
      ...rawData,
      title: translatedTitle,
      explanation: translatedExplanation,
    }
  } catch (err) {
    console.error('Failed to fetch APOD:', err)
    apodError.value = true
  } finally {
    isApodFetching.value = false
  }
}

// Initial fetch
fetchAndTranslateApod()

// --- 2. ISS Tracking Logic ---
interface IssLocation {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  visibility: string
  timestamp: number
}

// Using wheretheiss.at for ISS location
const issLocationUrl = 'https://api.wheretheiss.at/v1/satellites/25544'
const {
  data: issData,
  isFetching: isIssFetching,
  execute: fetchIssData,
} = useFetch(issLocationUrl, { immediate: true }).get().json<IssLocation>()

// Format coordinates via computed to avoid template bloat
const formattedLocation = computed(() => {
  if (!issData.value) return null
  const { latitude, longitude } = issData.value
  return {
    lat: latitude.toFixed(4),
    latDir: latitude >= 0 ? 'N' : 'S',
    lng: longitude.toFixed(4),
    lngDir: longitude >= 0 ? 'E' : 'W',
  }
})

// Auto-update every 5 seconds
useIntervalFn(fetchIssData, 5000)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20 relative overflow-hidden">
    <!-- Issue Badge -->
    <div class="fixed top-6 right-6 z-50 animate-fade-up animate-delay-5 hidden md:block">
      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg"
      >
        VOL.01 / 2026
      </div>
    </div>

    <!-- Header -->
    <header class="w-full pt-20 px-6 max-w-5xl mx-auto">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up mb-12"
      >
        &larr; Về trang chủ
      </RouterLink>

      <h1
        class="font-display text-7xl md:text-8xl font-bold text-accent-coral tracking-tight animate-fade-up animate-delay-1"
      >
        Space Explorer
      </h1>
      <p
        class="mt-6 text-text-secondary text-lg md:text-xl max-w-2xl animate-fade-up animate-delay-2 leading-relaxed"
      >
        Bảng điều khiển theo dõi không gian thời gian thực. Khám phá Vũ trụ qua góc nhìn của NASA và
        theo dõi Trạm vũ trụ Quốc tế (ISS) trực tiếp.
      </p>

      <!-- Dot Divider -->
      <div class="flex gap-1.5 mt-12 animate-fade-up animate-delay-3">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>
    </header>

    <main
      class="w-full max-w-5xl mx-auto px-6 mt-12 grid gap-6 lg:grid-cols-3 animate-fade-up animate-delay-4"
    >
      <!-- NASA APOD Card -->
      <section
        class="lg:col-span-2 border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 group relative overflow-hidden flex flex-col h-full"
      >
        <span
          class="absolute top-4 right-6 font-display text-8xl font-bold text-accent-coral/5 select-none pointer-events-none"
        >
          01
        </span>

        <span class="font-display text-xs tracking-widest text-text-dim mb-2 uppercase"
          >NASA // APOD</span
        >
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Ảnh Thiên văn trong Ngày
        </h2>

        <!-- Loading State -->
        <div
          v-if="isApodFetching"
          class="flex-1 flex flex-col items-center justify-center py-20 text-text-secondary gap-4"
        >
          <Icon icon="lucide:loader" class="size-8 animate-spin text-accent-coral" />
          <p class="font-display text-sm tracking-wide uppercase">
            Đang kết nối tín hiệu vệ tinh...
          </p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="apodError"
          class="flex-1 flex flex-col items-center justify-center py-20 text-accent-coral gap-4 text-center"
        >
          <Icon icon="lucide:alert-triangle" class="size-10" />
          <p class="font-display text-sm tracking-wide uppercase max-w-xs">
            Mất kết nối với cơ sở dữ liệu NASA.
          </p>
          <button
            @click="fetchAndTranslateApod"
            class="mt-4 px-6 py-2 border border-accent-coral text-xs font-display tracking-widest hover:bg-accent-coral hover:text-bg-deep transition-colors"
          >
            THỬ KẾT NỐI LẠI
          </button>
        </div>

        <!-- Data State -->
        <article v-else-if="apodData" class="flex-1 flex flex-col gap-6">
          <div
            class="w-full aspect-video border border-border-default relative overflow-hidden ring-1 ring-border-default bg-bg-deep"
          >
            <template v-if="apodData.media_type === 'image'">
              <img
                :src="apodData.url"
                :alt="apodData.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </template>
            <template v-else-if="apodData.media_type === 'video'">
              <iframe
                :src="apodData.url"
                title="NASA Video"
                frameborder="0"
                allow="encrypted-media"
                allowfullscreen
                class="w-full h-full"
              ></iframe>
            </template>
          </div>

          <div class="relative z-10">
            <h3
              class="font-display text-xl font-bold group-hover:text-accent-coral transition-colors"
            >
              {{ apodData.title }}
            </h3>
            <p class="text-xs text-text-dim font-display tracking-wide mt-2 uppercase">
              {{ formatDate(apodData.date) }}
            </p>
            <p class="mt-4 text-text-secondary leading-relaxed text-justify">
              {{ apodData.explanation }}
            </p>
          </div>
        </article>
      </section>

      <!-- ISS Tracker Card -->
      <section
        class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-sky/5 flex flex-col h-full group relative overflow-hidden"
      >
        <span
          class="absolute top-4 right-6 font-display text-8xl font-bold text-accent-sky/5 select-none pointer-events-none"
        >
          02
        </span>

        <span class="font-display text-xs tracking-widest text-text-dim mb-2 uppercase"
          >LIVE // ISS</span
        >
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3"
        >
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Vị trí Trạm ISS
        </h2>

        <div class="flex-1 flex flex-col justify-center">
          <!-- Loading state for first fetch -->
          <div v-if="isIssFetching && !issData" class="text-center py-12 text-text-secondary">
            <Icon icon="lucide:refresh-cw" class="size-8 animate-spin mx-auto mb-4 opacity-50" />
            <p class="font-display text-xs tracking-widest">ĐANG THU TÍN HIỆU...</p>
          </div>

          <div v-else-if="formattedLocation" class="space-y-8 relative">
            <!-- Radar sweep animation -->
            <div
              class="mx-auto w-32 h-32 rounded-full border border-accent-sky/20 flex items-center justify-center relative overflow-hidden group-hover:border-accent-sky/40 transition-colors"
            >
              <Icon icon="lucide:satellite" class="size-8 text-accent-sky relative z-10" />
              <div
                class="absolute inset-0 bg-accent-sky/10 rounded-full animate-ping"
                style="animation-duration: 3s"
              ></div>
              <!-- Radar Line -->
              <div
                class="absolute top-0 left-1/2 w-[1px] h-1/2 bg-gradient-to-b from-transparent to-accent-sky origin-bottom animate-spin"
                style="animation-duration: 5s"
              ></div>
            </div>

            <div class="space-y-4">
              <div
                class="p-4 bg-bg-deep border border-border-default font-mono text-sm tracking-wider transition-colors group-hover:border-accent-sky/30"
              >
                <div class="text-text-dim text-xs font-display tracking-widest mb-1 uppercase">
                  VĨ ĐỘ (LATITUDE)
                </div>
                <div class="text-accent-sky flex justify-between items-center">
                  <span class="text-lg">{{ formattedLocation.lat }}°</span>
                  <span class="text-text-dim">{{ formattedLocation.latDir }}</span>
                </div>
              </div>

              <div
                class="p-4 bg-bg-deep border border-border-default font-mono text-sm tracking-wider transition-colors group-hover:border-accent-sky/30"
              >
                <div class="text-text-dim text-xs font-display tracking-widest mb-1 uppercase">
                  KINH ĐỘ (LONGITUDE)
                </div>
                <div class="text-accent-sky flex justify-between items-center">
                  <span class="text-lg">{{ formattedLocation.lng }}°</span>
                  <span class="text-text-dim">{{ formattedLocation.lngDir }}</span>
                </div>
              </div>
            </div>

            <div class="text-center mt-6 flex items-center justify-center gap-2">
              <span class="relative flex h-2 w-2">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sky opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-accent-sky"></span>
              </span>
              <span class="text-xs text-text-dim font-display tracking-widest uppercase"
                >Cập nhật trực tiếp mỗi 5 giây</span
              >
            </div>
          </div>

          <!-- Error Fallback -->
          <div v-else class="text-center py-8 text-accent-coral">
            <Icon icon="lucide:satellite-dish-off" class="size-10 mx-auto mb-4 opacity-50" />
            <p class="font-display text-xs tracking-widest uppercase">Mất tín hiệu</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
