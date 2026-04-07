<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { HighScoreEntry } from '../types'

defineProps<{
  highScores: HighScoreEntry[]
}>()

const emit = defineEmits<{
  start: []
}>()

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-4 py-8">
    <!-- Bus Icon -->
    <div class="animate-fade-up mb-6">
      <div
        class="border-accent-coral/30 bg-accent-coral/10 inline-flex items-center justify-center border p-5"
      >
        <Icon icon="lucide:bus" class="text-accent-coral size-14" />
      </div>
    </div>

    <!-- Title -->
    <h1
      class="font-display text-accent-coral animate-fade-up animate-delay-1 mb-2 text-5xl font-bold tracking-tight sm:text-6xl"
    >
      Bus Counter
    </h1>
    <p
      class="text-text-secondary animate-fade-up animate-delay-2 mb-1 max-w-md text-center text-lg"
    >
      Đếm hành khách tuyến 02
    </p>
    <p class="text-text-dim animate-fade-up animate-delay-2 mb-8 text-sm">Bác Cổ ↔ BX Yên Nghĩa</p>

    <!-- Rules -->
    <div
      class="border-border-default bg-bg-surface animate-fade-up animate-delay-3 mb-8 w-full max-w-sm border p-5"
    >
      <h2 class="font-display text-text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon icon="lucide:book-open" class="text-accent-amber size-4" />
        Cách chơi
      </h2>
      <ul class="text-text-secondary space-y-2 text-sm">
        <li class="flex items-start gap-2">
          <Icon icon="lucide:eye" class="text-accent-sky mt-0.5 size-4 shrink-0" />
          <span>Quan sát hành khách lên/xuống tại mỗi điểm dừng</span>
        </li>
        <li class="flex items-start gap-2">
          <Icon icon="lucide:calculator" class="text-accent-coral mt-0.5 size-4 shrink-0" />
          <span>Nhập số hành khách hiện tại trên xe</span>
        </li>
        <li class="flex items-start gap-2">
          <Icon icon="lucide:heart" class="text-accent-coral mt-0.5 size-4 shrink-0" />
          <span>3 mạng — sai lệch &gt; 3 người = mất 1 mạng</span>
        </li>
        <li class="flex items-start gap-2">
          <Icon icon="lucide:trophy" class="text-accent-amber mt-0.5 size-4 shrink-0" />
          <span>Đúng chính xác = điểm thưởng cao nhất!</span>
        </li>
      </ul>
    </div>

    <!-- Start Button -->
    <button
      class="animate-fade-up animate-delay-4 bg-accent-coral font-display text-bg-deep hover:bg-accent-coral/90 mb-8 px-10 py-3 text-lg font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      @click="emit('start')"
    >
      <Icon icon="lucide:play" class="mr-2 inline size-5 -translate-y-0.5" />
      BẮT ĐẦU
    </button>

    <!-- High Scores -->
    <div
      v-if="highScores.length > 0"
      class="border-border-default bg-bg-surface animate-fade-up animate-delay-5 w-full max-w-sm border p-5"
    >
      <h2 class="font-display text-text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon icon="lucide:crown" class="text-accent-amber size-4" />
        Bảng điểm cao
      </h2>
      <div class="space-y-2">
        <div
          v-for="(entry, i) in highScores"
          :key="i"
          class="border-border-default bg-bg-elevated flex items-center gap-3 border px-3 py-2"
        >
          <span class="font-display text-accent-amber w-6 text-sm font-bold"> #{{ i + 1 }} </span>
          <span class="text-text-primary flex-1 truncate text-sm">{{ entry.name }}</span>
          <span class="text-accent-coral font-display text-sm font-semibold">
            {{ entry.score }}
          </span>
          <span class="text-text-dim text-xs"> {{ entry.stopsCompleted }} stops </span>
          <span class="text-text-dim text-xs">
            {{ formatTime(entry.totalTime) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
