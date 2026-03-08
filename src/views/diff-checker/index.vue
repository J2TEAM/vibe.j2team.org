<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useDiff } from './composables/useDiff'
import DiffSideBySide from './components/DiffSideBySide.vue'
import DiffUnified from './components/DiffUnified.vue'
import DiffToolbar from './components/DiffToolbar.vue'

const oldText = ref('const x = 10;\nconst y = 20;\nconsole.log(x + y);')
const newText = ref('const x = 10;\nconst y = 30;\nconsole.log(x + y);')

const debouncedOld = ref(oldText.value)
const debouncedNew = ref(newText.value)

const DEBOUNCE_MS = 200
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleDebounce() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedOld.value = oldText.value
    debouncedNew.value = newText.value
    debounceTimer = null
  }, DEBOUNCE_MS)
}

watch([oldText, newText], scheduleDebounce, { immediate: false })

const { twoPanels, unified, stats, isLargeInput } = useDiff(debouncedOld, debouncedNew)

const viewMode = ref<'side-by-side' | 'unified'>('side-by-side')

function swapTexts() {
  const tmp = oldText.value
  oldText.value = newText.value
  newText.value = tmp
  debouncedOld.value = oldText.value
  debouncedNew.value = newText.value
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8">
    <div class="mx-auto max-w-6xl">
      <header class="mb-8 animate-fade-up">
        <h1 class="font-display text-4xl font-bold text-accent-coral sm:text-5xl">Diff Checker</h1>
        <p class="mt-2 text-text-secondary">
          Dán hai đoạn văn bản hoặc code vào, xem ngay sự khác biệt. Miễn cài đặt, chạy trên trình
          duyệt — không lưu hay gửi dữ liệu đi đâu.
        </p>
        <RouterLink
          to="/"
          class="mt-4 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </header>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="animate-fade-up animate-delay-1">
          <label class="mb-2 block font-display text-sm font-semibold text-text-primary">
            Original
          </label>
          <textarea
            v-model="oldText"
            class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
            rows="10"
            placeholder="Nhập văn bản gốc..."
            spellcheck="false"
          />
        </div>
        <div class="animate-fade-up animate-delay-2">
          <label class="mb-2 block font-display text-sm font-semibold text-text-primary">
            Modified
          </label>
          <textarea
            v-model="newText"
            class="w-full border border-border-default bg-bg-surface px-3 py-2 font-mono text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
            rows="10"
            placeholder="Nhập văn bản đã sửa..."
            spellcheck="false"
          />
        </div>
      </div>

      <div class="mt-6 animate-fade-up animate-delay-3">
        <DiffToolbar
          v-model:view-mode="viewMode"
          :additions="stats.additions"
          :deletions="stats.deletions"
        />
      </div>

      <div
        v-if="isLargeInput"
        class="mt-6 animate-fade-up animate-delay-4 border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-text-secondary"
      >
        ⚠ Nội dung quá lớn — kết quả so sánh có thể kém chính xác hơn do dùng thuật toán đơn giản
        thay vì LCS.
      </div>

      <div class="mt-6 animate-fade-up animate-delay-4">
        <DiffSideBySide
          v-if="viewMode === 'side-by-side'"
          :panels="twoPanels"
          :additions="stats.additions"
          :deletions="stats.deletions"
          :old-text="debouncedOld"
          :new-text="debouncedNew"
          @swap="swapTexts"
        />
        <DiffUnified v-else :lines="unified" />
      </div>
    </div>
  </div>
</template>
