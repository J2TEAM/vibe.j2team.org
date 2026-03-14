<script setup lang="ts">
import type { ComicItem } from '../types'
import { useOTruyen } from '../composables/useOTruyen'

import { useTimeAgo } from '@vueuse/core'

import { ref } from 'vue'

defineProps<{
  comics: ComicItem[]
  layout?: 'grid' | 'row'
  autoScroll?: boolean
  hideStatus?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', comic: ComicItem): void
}>()

const scrollContainer = ref<HTMLElement | null>(null)

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
  }
}

const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
  }
}

const { IMAGE_URL_BASE } = useOTruyen()

const getThumb = (url: string) => {
  if (url.startsWith('http')) return url
  return IMAGE_URL_BASE.value + url
}

const getLatestChapters = (comic: ComicItem) => {
  if (comic.chaptersLatest && comic.chaptersLatest.length > 0) {
    // Return up to 2 latest chapters
    return comic.chaptersLatest.slice(0, 2)
  }
  return []
}

// Small helper to resolve updatedAt
const getUpdateTime = (comic: ComicItem) => {
  // Use useTimeAgo, format it simply by modifying the output or just relying on default
  const time = useTimeAgo(new Date(comic.updatedAt))
  // Removing 'truớc' etc by simple string replacement can be complex with i18n, but since we want en-ish format or default vi
  return time.value
}
</script>

<template>
  <div v-if="layout === 'row'" class="relative group/list">
    <!-- Left Scroll Button -->
    <button
      @click="scrollLeft"
      class="absolute left-0 top-[40%] -translate-y-1/2 z-10 w-8 h-12 bg-black/60 hover:bg-black text-white hover:text-accent-coral flex items-center justify-center rounded-r-lg opacity-0 group-hover/list:opacity-100 transition-all border border-l-0 border-white/10 shadow-lg"
    >
      <Icon icon="ph:caret-left-bold" class="w-5 h-5" />
    </button>

    <!-- Right Scroll Button -->
    <button
      @click="scrollRight"
      class="absolute right-0 top-[40%] -translate-y-1/2 z-10 w-8 h-12 bg-black/60 hover:bg-black text-white hover:text-accent-coral flex items-center justify-center rounded-l-lg opacity-0 group-hover/list:opacity-100 transition-all border border-r-0 border-white/10 shadow-lg"
    >
      <Icon icon="ph:caret-right-bold" class="w-5 h-5" />
    </button>

    <div
      ref="scrollContainer"
      class="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide px-1"
      :class="{ 'snap-x snap-mandatory': autoScroll }"
    >
      <div
        v-for="comic in comics"
        :key="comic._id"
        class="group relative flex w-[140px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl bg-bg-deep text-left transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-accent-coral/20 sm:w-[160px] md:w-[180px]"
        :class="{ 'snap-start': autoScroll }"
        @click="emit('click', comic)"
      >
        <div class="aspect-[2/3] w-full overflow-hidden relative rounded-xl">
          <img
            :src="getThumb(comic.thumb_url)"
            :alt="comic.name"
            class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <!-- Gradient overlay for text readability -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
          ></div>

          <!-- Top Right: Status -->
          <div
            v-if="comic.status && !hideStatus"
            class="absolute right-2 top-2 rounded bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-md border border-white/10 uppercase"
          >
            {{
              comic.status === 'completed'
                ? 'Hoàn thành'
                : comic.status === 'ongoing'
                  ? 'Đang ra'
                  : comic.status
            }}
          </div>

          <!-- Bottom: Title -->
          <div class="absolute bottom-0 left-0 w-full p-2.5 sm:p-3 flex flex-col justify-end">
            <h3
              class="line-clamp-2 font-display text-sm sm:text-base font-bold text-white leading-snug drop-shadow-md group-hover:text-accent-coral transition-colors"
              :title="comic.name"
            >
              {{ comic.name }}
            </h3>
          </div>
        </div>

        <!-- Chapters below image -->
        <div v-if="getLatestChapters(comic).length > 0" class="mt-2 flex flex-col gap-1 px-1">
          <div
            v-for="chap in getLatestChapters(comic)"
            :key="chap.chapter_name"
            class="flex items-center justify-between text-xs group/chap cursor-pointer py-1 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded"
          >
            <span
              class="text-text-primary font-bold group-hover/chap:text-accent-coral transition-colors"
              >Chapter {{ chap.chapter_name }}</span
            >
            <span class="text-text-dim text-[10px]">{{ getUpdateTime(comic) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 px-1 py-1"
  >
    <div
      v-for="comic in comics"
      :key="comic._id"
      class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-bg-deep text-left transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-accent-coral/20"
      @click="emit('click', comic)"
    >
      <div class="aspect-[2/3] w-full overflow-hidden relative rounded-xl">
        <img
          :src="getThumb(comic.thumb_url)"
          :alt="comic.name"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <!-- Gradient overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
        ></div>

        <!-- Top Right: Status -->
        <div
          v-if="comic.status && !hideStatus"
          class="absolute right-2 top-2 rounded bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-md border border-white/10 uppercase"
        >
          {{
            comic.status === 'completed'
              ? 'Hoàn thành'
              : comic.status === 'ongoing'
                ? 'Đang ra'
                : comic.status
          }}
        </div>

        <!-- Bottom: Title -->
        <div class="absolute bottom-0 left-0 w-full p-2.5 sm:p-3 flex flex-col justify-end">
          <h3
            class="line-clamp-2 font-display text-sm sm:text-base font-bold text-white leading-snug drop-shadow-md group-hover:text-accent-coral transition-colors"
            :title="comic.name"
          >
            {{ comic.name }}
          </h3>
        </div>
      </div>

      <!-- Chapters below image -->
      <div v-if="getLatestChapters(comic).length > 0" class="mt-2 flex flex-col gap-1 px-1">
        <div
          v-for="chap in getLatestChapters(comic)"
          :key="chap.chapter_name"
          class="flex items-center justify-between text-xs group/chap cursor-pointer py-1 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded"
        >
          <span
            class="text-text-primary font-bold group-hover/chap:text-accent-coral transition-colors"
            >Chapter {{ chap.chapter_name }}</span
          >
          <span class="text-text-dim text-[10px]">{{ getUpdateTime(comic) }}</span>
        </div>
      </div>
    </div>
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
</style>
