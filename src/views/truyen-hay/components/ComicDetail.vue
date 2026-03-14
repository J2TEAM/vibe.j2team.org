<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useOTruyen } from '../composables/useOTruyen'
import { useComicHistory } from '../composables/useComicHistory'
import type { ComicDetail, ComicItem } from '../types'

const props = defineProps<{
  slug: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (
    e: 'read-chapter',
    chapterApiData: string,
    chapterName: string,
    chapters: { name: string; api_data: string }[],
  ): void
  (e: 'select-comic', comic: ComicItem): void
}>()

const { getComicDetail, isLoading, error, IMAGE_URL_BASE } = useOTruyen()
const { isBookmarked, toggleBookmark, watchHistory } = useComicHistory()

const comicDetail = ref<ComicDetail | null>(null)

const fetchDetail = async () => {
  const res = await getComicDetail(props.slug)
  if (res?.data) {
    comicDetail.value = res.data
  }
}

onMounted(() => {
  fetchDetail()
})

watch(
  () => props.slug,
  () => {
    fetchDetail()
  },
)

const getThumb = (url: string) => {
  if (url.startsWith('http')) return url
  return IMAGE_URL_BASE.value + url
}

const bookmarked = computed(() => isBookmarked(props.slug).value)

const handleBookmark = () => {
  if (comicDetail.value) {
    toggleBookmark({
      slug: comicDetail.value.item.slug,
      name: comicDetail.value.item.name,
      thumb_url: getThumb(comicDetail.value.item.thumb_url),
    })
  }
}

// Check if user watched any chapter of this comic
const watchedData = computed(() => {
  return watchHistory.value.find((h) => h.slug === props.slug)
})

// Flatten all chapters into one list for easier display
const allChapters = computed(() => {
  const chapters: { name: string; title: string; api_data: string; server: string }[] = []
  if (comicDetail.value?.item?.chapters) {
    comicDetail.value.item.chapters.forEach((server) => {
      server.server_data.forEach((chap) => {
        chapters.push({
          name: chap.chapter_name,
          title: chap.chapter_title,
          api_data: chap.chapter_api_data,
          server: server.server_name,
        })
      })
    })
  }
  return chapters.reverse() // Usually chapters come in ascending order, we want latest first, or vice-versa
})

const readFirstChapter = () => {
  if (allChapters.value.length > 0) {
    const firstChap = allChapters.value[allChapters.value.length - 1] // assumes reversed
    if (firstChap) {
      emit('read-chapter', firstChap.api_data, firstChap.name, allChapters.value)
    }
  }
}
</script>

<template>
  <div class="space-y-6 sm:space-y-8 animate-fade-up">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-text-secondary sm:mb-4 px-2 sm:px-0">
      <button
        @click="emit('back')"
        class="flex items-center gap-1 hover:text-accent-coral transition-colors py-1 pl-1"
      >
        <Icon icon="ph:arrow-left" class="h-4 w-4" />
        Trở về
      </button>
      <span class="text-text-dim">/</span>
      <span class="truncate text-text-dim" v-if="comicDetail?.item">{{
        comicDetail.item.name
      }}</span>
    </nav>

    <div v-if="isLoading" class="flex min-h-[40vh] items-center justify-center">
      <Icon icon="ph:spinner-gap-bold" class="h-10 w-10 animate-spin text-accent-coral" />
    </div>

    <div v-else-if="error" class="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <Icon icon="ph:warning-circle" class="h-12 w-12 text-accent-coral" />
      <p class="text-text-secondary">{{ error }}</p>
      <button
        @click="fetchDetail"
        class="rounded-full bg-accent-coral px-6 py-2 font-semibold text-bg-deep"
      >
        Thử Lại
      </button>
    </div>

    <template v-else-if="comicDetail">
      <!-- Main Content Block -->
      <div
        class="relative overflow-hidden border border-border-default bg-bg-surface p-4 sm:p-6 md:p-8 rounded-xl shadow-lg"
      >
        <div
          class="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 border-b border-border-default pb-6 sm:pb-8"
        >
          <!-- Poster -->
          <div class="mx-auto w-48 shrink-0 md:mx-0 md:w-56">
            <div
              class="overflow-hidden shadow-2xl rounded-xl border border-white/10 relative group bg-bg-deep aspect-[2/3]"
            >
              <img
                :src="getThumb(comicDetail.item.thumb_url)"
                :alt="comicDetail.item.name"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-bg-deep/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4"
              >
                <button
                  @click="readFirstChapter"
                  class="bg-accent-coral text-bg-deep px-4 py-2 rounded-full font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-lg"
                >
                  <Icon icon="ph:book-open-text-fill" class="w-5 h-5" /> Đọc Ngay
                </button>
              </div>
            </div>

            <button
              @click="handleBookmark"
              class="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border py-3 font-semibold transition-all shadow-md group text-sm"
              :class="
                bookmarked
                  ? 'border-accent-amber bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20'
                  : 'border-border-default bg-bg-deep text-text-primary hover:border-accent-amber/50 hover:bg-bg-elevated'
              "
            >
              <Icon
                :icon="bookmarked ? 'ph:bookmark-simple-fill' : 'ph:bookmark-simple'"
                class="h-5 w-5 transition-transform group-hover:scale-110"
              />
              {{ bookmarked ? 'Đã Lưu Danh Sách' : 'Lưu Danh Sách' }}
            </button>
          </div>

          <!-- Info Text -->
          <div class="flex-1 space-y-5">
            <div>
              <h1
                class="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight"
              >
                {{ comicDetail.item.name }}
              </h1>
              <p
                v-if="comicDetail.item.origin_name && comicDetail.item.origin_name.length > 0"
                class="font-display text-sm text-text-dim mt-1.5 italic"
              >
                {{ comicDetail.item.origin_name.join(', ') }}
              </p>
            </div>

            <!-- Author & Categories table-like layout -->
            <div class="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-y-3 text-sm">
              <span class="text-text-dim mt-0.5">Tác giả:</span>
              <span class="text-white font-medium">{{
                comicDetail.item.author && comicDetail.item.author.length > 0
                  ? comicDetail.item.author.join(', ')
                  : 'Đang cập nhật'
              }}</span>

              <span class="text-text-dim mt-1.5">Thể loại:</span>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="cat in comicDetail.item.category"
                  :key="cat.id"
                  class="rounded-full bg-transparent border border-white/10 px-3 py-1 text-xs text-text-secondary transition-colors hover:text-white hover:border-white/20 select-none"
                >
                  {{ cat.name }}
                </span>
              </div>

              <span class="text-text-dim mt-1">Trạng thái:</span>
              <span class="text-accent-coral font-medium flex items-center gap-1.5 mt-1">
                {{
                  comicDetail.item.status === 'completed'
                    ? 'Hoàn thành'
                    : comicDetail.item.status === 'ongoing'
                      ? 'Đang ra'
                      : comicDetail.item.status
                }}
              </span>
            </div>

            <!-- Content HTML -->
            <div class="pt-2">
              <h3
                class="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-widest flex items-center gap-2"
              >
                <Icon icon="ph:text-align-left" class="w-4 h-4 text-text-dim" />
                Nội dung truyện
              </h3>
              <div
                class="prose prose-invert prose-sm max-w-none text-text-dim/90 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer"
                v-html="comicDetail.item.content"
              ></div>
              <p class="text-[11px] text-text-dim/40 mt-1 italic text-left">
                (Bấm vào đoạn văn để xem chi tiết)
              </p>
            </div>
          </div>
        </div>

        <!-- History resume banner if exist -->
        <div
          v-if="watchedData && watchedData.chapter_name"
          class="mt-8 flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 bg-accent-sky/10 border border-accent-sky/20 rounded-xl relative overflow-hidden group gap-4"
        >
          <div class="relative z-10 flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-full bg-accent-sky/20 flex items-center justify-center text-accent-sky shadow-inner shrink-0"
            >
              <Icon icon="ph:clock-counter-clockwise-fill" class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs text-text-dim mb-0.5">Bạn đang đọc dở:</p>
              <p class="font-bold text-accent-sky text-sm sm:text-base">
                Chương {{ watchedData.chapter_name }}
              </p>
            </div>
          </div>

          <button
            class="relative z-10 w-full sm:w-auto px-6 py-2.5 rounded-lg border border-accent-sky/30 text-accent-sky font-semibold hover:bg-accent-sky hover:text-[#111111] transition-all text-sm shadow-[0_0_15px_rgba(56,189,248,0.15)] flex justify-center items-center gap-2"
            @click="
              () => {
                const chap = allChapters.find((c) => c.name === watchedData?.chapter_name)
                if (chap) emit('read-chapter', chap.api_data, chap.name, allChapters)
              }
            "
          >
            Đọc tiếp
            <Icon icon="ph:arrow-right-bold" class="w-4 h-4" />
          </button>
        </div>

        <!-- Chapters List -->
        <div class="pt-8 space-y-6">
          <div class="flex items-center justify-between gap-3 border-b border-border-default pb-3">
            <h3
              class="flex items-center gap-2 font-display text-lg sm:text-xl font-bold text-white"
            >
              <span class="text-accent-coral font-black text-xl italic">//</span>
              Danh Sách Chương
            </h3>
            <span
              class="text-xs font-semibold text-text-dim border border-border-default bg-bg-deep rounded-full px-3 py-1"
            >
              {{ allChapters.length }} chương
            </span>
          </div>

          <div
            v-if="allChapters.length === 0"
            class="text-center py-10 text-text-secondary border border-dashed border-border-default rounded-xl"
          >
            Hiện chưa có chương nào được cập nhật.
          </div>

          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
          >
            <button
              v-for="chap in allChapters"
              :key="chap.api_data"
              class="flex flex-col p-3 rounded-lg border text-left transition-all relative overflow-hidden group"
              :class="
                watchedData?.chapter_name === chap.name
                  ? 'border-accent-sky bg-accent-sky/10 shadow-inner'
                  : 'border-border-default bg-bg-deep hover:border-text-dim hover:bg-bg-elevated'
              "
              @click="emit('read-chapter', chap.api_data, chap.name, allChapters)"
            >
              <span
                class="font-semibold text-sm line-clamp-1 transition-colors"
                :class="
                  watchedData?.chapter_name === chap.name
                    ? 'text-accent-sky'
                    : 'text-white group-hover:text-accent-coral'
                "
              >
                Chương {{ chap.name }}
              </span>

              <div
                v-if="watchedData && watchedData.chapter_name === chap.name"
                class="absolute top-1/2 -translate-y-1/2 right-3"
              >
                <Icon icon="ph:eye-fill" class="w-4 h-4 text-accent-sky/80" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
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
