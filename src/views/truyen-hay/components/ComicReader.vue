<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useOTruyen } from '../composables/useOTruyen'
import ComicImage from './ComicImage.vue'

const props = defineProps<{
  chapterApiData: string
  chapterName: string
  comicName: string
  allChapters: { name: string; api_data: string }[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'change-chapter', apiData: string, name: string): void
}>()

const { getChapterData, isLoading, error } = useOTruyen()
const chapterImages = ref<{ image_file: string; image_page: number }[]>([])
const chapterDomain = ref('')
const chapterPath = ref('')

// No more interaction state needed since it's inline now

// Chapter Navigation
const currentIndex = computed(() => {
  return props.allChapters.findIndex((c) => c.api_data === props.chapterApiData)
})

const nextChapter = computed(() => {
  // if chapters are ordered newest first (index 0 is latest), then next chapter reading-wise is currentIndex - 1
  // let's assume they are ordered newest to oldest, which is standard for OTruyen.
  if (currentIndex.value > 0) {
    return props.allChapters[currentIndex.value - 1]
  }
  return null
})

const prevChapter = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < props.allChapters.length - 1) {
    return props.allChapters[currentIndex.value + 1]
  }
  return null
})

const goToChapter = (chap: { api_data: string; name: string }) => {
  emit('change-chapter', chap.api_data, chap.name)
}

const fetchChapter = async () => {
  if (!props.chapterApiData) return
  const res = await getChapterData(props.chapterApiData)
  if (res?.data) {
    chapterDomain.value = res.data.domain_cdn
    chapterPath.value = res.data.item.chapter_path
    chapterImages.value = res.data.item.chapter_image
  }
}

watch(
  () => props.chapterApiData,
  () => {
    chapterImages.value = []
    fetchChapter()
    window.scrollTo({ top: 0, behavior: 'instant' })
  },
)

onMounted(() => {
  fetchChapter()
  window.scrollTo({ top: 0, behavior: 'instant' })
})

onUnmounted(() => {
  // cleanup
})

const getImageUrl = (filename: string) => {
  return `${chapterDomain.value}/${chapterPath.value}/${filename}`
}
</script>

<template>
  <div class="w-full bg-bg-deep min-h-screen pt-4 pb-12">
    <!-- Top Sleek Navigation -->
    <div class="mx-auto max-w-2xl px-2 sm:px-4 mb-6 sticky top-[60px] md:top-[72px] z-40">
      <div
        class="flex items-center justify-between gap-3 bg-bg-surface/90 backdrop-blur-xl border border-border-default px-4 py-2.5 rounded-full shadow-2xl"
      >
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <button
            @click="emit('back')"
            class="text-xs sm:text-sm font-bold text-text-dim hover:text-white transition-colors truncate max-w-[120px] sm:max-w-[200px]"
            :title="comicName"
          >
            {{ comicName }}
          </button>
        </div>

        <!-- Controls -->
        <div
          class="flex items-center bg-bg-deep/50 rounded-full border border-border-default h-10 overflow-hidden shadow-inner"
        >
          <button
            @click="prevChapter ? goToChapter(prevChapter) : null"
            class="w-10 h-10 flex items-center justify-center transition-all shrink-0"
            :class="
              prevChapter
                ? 'hover:bg-bg-elevated hover:text-accent-coral text-text-primary'
                : 'text-text-dim/30 cursor-not-allowed'
            "
            title="Chương trước"
          >
            <Icon icon="ph:caret-left-bold" class="w-4 h-4" />
          </button>

          <div
            class="px-2 min-w-[100px] sm:min-w-[140px] flex items-center justify-center border-x border-border-default/50 h-full relative group"
          >
            <select
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              :value="chapterApiData"
              @change="
                (e) => {
                  const target = (e.target as HTMLSelectElement).value
                  const chap = allChapters.find((c) => c.api_data === target)
                  if (chap) goToChapter(chap)
                }
              "
            >
              <option
                v-for="chap in allChapters"
                :key="chap.api_data"
                :value="chap.api_data"
                class="bg-bg-deep text-text-primary"
              >
                Chương {{ chap.name }}
              </option>
            </select>
            <div
              class="flex items-center gap-1.5 text-white text-xs sm:text-sm font-bold truncate group-hover:text-accent-coral transition-colors"
            >
              <span>Chương {{ chapterName }}</span>
              <Icon icon="ph:caret-down-bold" class="w-3 h-3 opacity-50" />
            </div>
          </div>

          <button
            @click="nextChapter ? goToChapter(nextChapter) : null"
            class="w-10 h-10 flex items-center justify-center transition-all shrink-0"
            :class="
              nextChapter
                ? 'hover:bg-bg-elevated hover:text-accent-coral text-text-primary'
                : 'text-text-dim/30 cursor-not-allowed'
            "
            title="Chương sau"
          >
            <Icon icon="ph:caret-right-bold" class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 flex justify-end"></div>
      </div>
    </div>

    <!-- Main Images Container -->
    <div class="w-full flex flex-col items-center min-h-[50vh]">
      <div v-if="isLoading" class="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Icon icon="ph:spinner-gap-bold" class="h-10 w-10 animate-spin text-accent-coral" />
        <p class="font-display font-semibold text-text-secondary animate-pulse">
          Đang tải dữ liệu chương...
        </p>
      </div>

      <div
        v-else-if="error"
        class="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-bg-surface p-8 rounded-2xl border border-border-default max-w-md mx-auto text-center mt-12"
      >
        <div
          class="w-16 h-16 rounded-full bg-accent-coral/10 flex items-center justify-center text-accent-coral mb-2"
        >
          <Icon icon="ph:warning-circle-fill" class="h-8 w-8" />
        </div>
        <p class="text-text-primary text-lg font-bold">Lỗi Tải Ảnh</p>
        <p class="text-text-secondary text-sm">{{ error }}</p>
        <button
          @click="fetchChapter"
          class="mt-4 rounded-full bg-accent-coral px-8 py-2.5 font-bold text-black transition-colors hover:bg-accent-coral/90 shadow-lg"
        >
          Thử Lại
        </button>
      </div>

      <div v-else class="max-w-3xl w-full mx-auto flex flex-col items-center bg-bg-deep relative">
        <template v-for="img in chapterImages" :key="img.image_file">
          <ComicImage :src="getImageUrl(img.image_file)" />
        </template>
      </div>
    </div>

    <!-- Bottom Navigation Bar -->
    <div v-if="chapterImages.length > 0" class="mx-auto max-w-3xl px-2 sm:px-4 mt-8">
      <div
        class="flex flex-col items-center justify-center gap-5 bg-bg-surface border border-border-default p-6 rounded-2xl shadow-xl"
      >
        <p class="text-text-secondary font-medium text-sm">Hết chương {{ chapterName }}</p>

        <div class="flex items-center gap-4 w-full sm:w-auto justify-center">
          <button
            @click="prevChapter ? goToChapter(prevChapter) : null"
            class="flex-1 sm:flex-none sm:w-32 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm border"
            :class="
              prevChapter
                ? 'border-border-default bg-bg-deep hover:bg-bg-elevated text-text-primary'
                : 'border-transparent bg-transparent text-text-dim cursor-not-allowed'
            "
          >
            <Icon icon="ph:caret-left-bold" class="w-4 h-4" />
            Chap trước
          </button>

          <button
            @click="nextChapter ? goToChapter(nextChapter) : emit('back')"
            class="flex-1 sm:flex-none sm:w-40 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm"
            :class="
              nextChapter
                ? 'bg-accent-coral hover:bg-accent-coral/90 text-black shadow-[0_0_20px_rgba(255,107,107,0.4)]'
                : 'bg-accent-sky text-black'
            "
          >
            <span>{{ nextChapter ? 'Chap sau' : 'Về thông tin' }}</span>
            <Icon icon="ph:caret-right-bold" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
