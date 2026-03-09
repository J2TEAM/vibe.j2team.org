<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useFetch, useIntervalFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// --- 1. Lấy dữ liệu NASA APOD ---
const NASA_API_KEY = 'DEMO_KEY'
const nasaApiUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`

interface NasaApod {
  date: string
  explanation: string
  hdurl: string
  media_type: string
  service_version: string
  title: string
  url: string
}

const isApodFetching = ref(true)
const apodError = ref(false)
const apodData = ref<NasaApod | null>(null)

async function translateText(text: string): Promise<string> {
  if (!text) return ''
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`
    const { data } = await useFetch(url).get().json()
    // data có dạng: [ [ ["bản dịch 1", "source 1"], ["bản dịch 2", "source 2"] ], ... ]
    if (data.value && Array.isArray(data.value[0])) {
      return data.value[0].map((item: string[]) => item[0]).join('')
    }
  } catch {
    console.error('Translation error')
  }
  return text // Fallback về bản gốc nếu lỗi
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}-${month}-${year}`
}

async function fetchAndTranslateApod() {
  isApodFetching.value = true
  apodError.value = false

  try {
    const { data, error } = await useFetch(nasaApiUrl).get().json<NasaApod>()

    if (error.value || !data.value) {
      apodError.value = true
      return
    }

    const rawData = data.value

    // Dịch tiêu đề và nội dung giải thích
    const [translatedTitle, translatedExplanation] = await Promise.all([
      translateText(rawData.title),
      translateText(rawData.explanation),
    ])

    apodData.value = {
      ...rawData,
      title: translatedTitle,
      explanation: translatedExplanation,
    }
  } catch {
    apodError.value = true
  } finally {
    isApodFetching.value = false
  }
}

fetchAndTranslateApod()

// --- 2. Theo dõi Trạm ISS ---
interface IssLocation {
  message: string
  timestamp: number
  iss_position: {
    latitude: string
    longitude: string
  }
}

const issLocationUrl = 'http://api.open-notify.org/iss-now.json'
const {
  data: issData,
  isFetching: isIssFetching,
  execute: fetchIssData,
} = useFetch(issLocationUrl, { immediate: true }).get().json<IssLocation>()

// Tự động cập nhật ISS mỗi 5 giây
useIntervalFn(() => {
  fetchIssData()
}, 5000)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-12">
    <!-- Header -->
    <div class="w-full pt-20 px-6 max-w-5xl mx-auto">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral mb-8 link-underline"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>

      <h1 class="font-display text-4xl sm:text-6xl font-bold text-accent-coral animate-fade-up">
        Space Explorer
      </h1>
      <p class="mt-4 text-text-secondary text-lg max-w-2xl animate-fade-up animate-delay-2">
        Bảng điều khiển theo dõi không gian thời gian thực. Khám phá Vũ trụ qua góc nhìn của NASA và
        theo dõi Trạm vũ trụ Quốc tế (ISS).
      </p>
    </div>

    <div
      class="w-full max-w-5xl mx-auto px-6 mt-12 grid gap-6 lg:grid-cols-3 animate-fade-up animate-delay-3"
    >
      <!-- NASA APOD Card -->
      <div
        class="lg:col-span-2 border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 group relative overflow-hidden flex flex-col h-full"
      >
        <!-- Badge -->
        <span class="absolute top-6 right-6 font-display text-xs tracking-widest text-text-dim"
          >NASA // APOD</span
        >
        <!-- Section Header -->
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Ảnh Thiên văn Hôm nay
        </h2>

        <!-- Loading State -->
        <div
          v-if="isApodFetching"
          class="flex-1 flex flex-col items-center justify-center py-12 text-text-secondary gap-4"
        >
          <Icon icon="lucide:loader" class="size-8 animate-spin text-accent-coral" />
          <p>Đang kết nối tín hiệu vệ tinh...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="apodError"
          class="flex-1 flex flex-col items-center justify-center py-12 text-accent-coral gap-4"
        >
          <Icon icon="lucide:alert-triangle" class="size-8" />
          <p>Mất kết nối với cơ sở dữ liệu NASA.</p>
        </div>

        <!-- Data State -->
        <div v-else-if="apodData" class="flex-1 flex flex-col gap-6">
          <div class="w-full aspect-video border border-border-default relative overflow-hidden">
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
            <div class="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none"></div>
          </div>

          <div>
            <h3
              class="font-display text-xl font-bold group-hover:text-accent-coral transition-colors"
            >
              {{ apodData.title }}
            </h3>
            <p class="text-sm text-text-dim mt-1">{{ formatDate(apodData.date) }}</p>
            <p class="mt-4 text-sm text-text-secondary leading-relaxed text-justify">
              {{ apodData.explanation }}
            </p>
          </div>
        </div>
      </div>

      <!-- ISS Tracker Card -->
      <div
        class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:border-accent-sky hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-sky/5 flex flex-col h-full group"
      >
        <!-- Badge -->
        <span class="absolute top-6 right-6 font-display text-xs tracking-widest text-text-dim"
          >LIVE // ISS</span
        >

        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
        >
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Vị trí Trạm ISS
        </h2>

        <div class="flex-1 flex flex-col justify-center">
          <div
            v-if="issData && !isIssFetching && !issData?.iss_position"
            class="text-center py-8 text-text-secondary"
          >
            <Icon icon="lucide:satellite-dish" class="size-12 mx-auto mb-4 opacity-50" />
            <p>Đang tìm kiếm tín hiệu...</p>
          </div>

          <div v-if="issData?.iss_position" class="space-y-8 relative">
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
                class="p-4 bg-bg-deep border border-border-default font-mono text-sm tracking-wider group-hover:border-accent-sky/30 transition-colors"
              >
                <div class="text-text-dim text-xs mb-1">VĨ ĐỘ (LATITUDE)</div>
                <div class="text-accent-sky flex justify-between items-center">
                  <span class="text-lg"
                    >{{ Number(issData.iss_position.latitude).toFixed(4) }}°</span
                  >
                  <span class="text-text-dim">{{
                    Number(issData.iss_position.latitude) >= 0 ? 'N' : 'S'
                  }}</span>
                </div>
              </div>

              <div
                class="p-4 bg-bg-deep border border-border-default font-mono text-sm tracking-wider group-hover:border-accent-sky/30 transition-colors"
              >
                <div class="text-text-dim text-xs mb-1">KINH ĐỘ (LONGITUDE)</div>
                <div class="text-accent-sky flex justify-between items-center">
                  <span class="text-lg"
                    >{{ Number(issData.iss_position.longitude).toFixed(4) }}°</span
                  >
                  <span class="text-text-dim">{{
                    Number(issData.iss_position.longitude) >= 0 ? 'E' : 'W'
                  }}</span>
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
                >Cập nhật trực tiếp mỗi 5s</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
