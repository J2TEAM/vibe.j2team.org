<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const currentPage = useLocalStorage('digits:lastChallengePage', 1)
const numPages = ref(15)
const challengesPerPage = 4
const iframeLoaded = ref(false)
const loadError = ref(false)

const handlePreviousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}
const handleNextPage = () => {
  if (currentPage.value < numPages.value) currentPage.value++
}
const handlePageSelect = (page: number) => {
  currentPage.value = page
}
const getLevelRangeForPage = (page: number) => {
  const start = (page - 1) * challengesPerPage + 1
  const end = page * challengesPerPage
  return `Màn ${start}–${end}`
}
const pdfSrc = (page: number) =>
  `/digit-packing-puzzle/challenges.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=${page}`

const openPdfInNewTab = () => {
  window.open(pdfSrc(currentPage.value), '_blank')
}

watch(currentPage, () => {
  iframeLoaded.value = false
  loadError.value = false
})
</script>

<template>
  <div class="flex flex-col gap-2 min-h-0">
    <!-- Page Navigation -->
    <div class="flex gap-2 items-center shrink-0">
      <button
        @click="handlePreviousPage"
        :disabled="currentPage === 1"
        class="px-3 py-1.5 text-xs font-medium cursor-pointer border border-border-default bg-bg-surface text-text-primary transition-all duration-200 hover:bg-bg-elevated hover:border-accent-coral disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Trước
      </button>
      <select
        v-model="currentPage"
        @change="handlePageSelect(Number(($event.target as HTMLSelectElement).value))"
        class="flex-1 px-2 py-1.5 text-xs border border-border-default bg-bg-deep text-text-primary cursor-pointer"
      >
        <option v-for="i in numPages" :key="i" :value="i">
          {{ getLevelRangeForPage(i) }}
        </option>
      </select>
      <button
        @click="handleNextPage"
        :disabled="currentPage === numPages"
        class="px-3 py-1.5 text-xs font-medium cursor-pointer border border-border-default bg-bg-surface text-text-primary transition-all duration-200 hover:bg-bg-elevated hover:border-accent-coral disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Tiếp →
      </button>
    </div>

    <!-- PDF: fill all remaining height in the flex column -->
    <div class="flex-1 min-h-0 relative border border-border-default bg-bg-deep overflow-hidden">
      <!-- Loading indicator -->
      <div
        v-if="!iframeLoaded"
        class="absolute inset-0 flex items-center justify-center text-text-secondary"
      >
        <div class="text-center">
          <div
            class="animate-spin w-8 h-8 border-2 border-accent-coral border-t-transparent rounded-full mx-auto mb-2"
          ></div>
          <div class="text-sm">Đang tải PDF...</div>
        </div>
      </div>

      <iframe
        :key="currentPage"
        :src="pdfSrc(currentPage)"
        class="absolute inset-0 w-full h-full transition-opacity duration-300"
        :class="iframeLoaded ? 'opacity-100' : 'opacity-0'"
        @load="iframeLoaded = true"
        @error="loadError = true"
        frameborder="0"
        title="Thử thách"
      />

      <!-- Fallback if PDF doesn't load -->
      <div
        v-if="loadError"
        class="absolute inset-0 flex items-center justify-center text-text-secondary bg-bg-deep"
      >
        <div class="text-center p-4">
          <div class="text-lg mb-2">⚠️ Không thể tải PDF</div>
          <div class="text-sm mb-4">Trình duyệt có thể không hỗ trợ hiển thị PDF</div>
          <button
            @click="openPdfInNewTab"
            class="px-4 py-2 bg-accent-coral text-white rounded hover:brightness-110 transition-all"
          >
            Mở PDF trong tab mới
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
