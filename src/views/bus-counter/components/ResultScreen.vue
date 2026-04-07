<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { HighScoreEntry } from '../types'

const props = defineProps<{
  isComplete: boolean
  score: number
  stopsCompleted: number
  totalStops: number
  totalTime: number
  highScores: HighScoreEntry[]
}>()

const emit = defineEmits<{
  restart: []
  saveScore: [entry: HighScoreEntry]
}>()

const playerName = ref('')
const saved = ref(false)

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function handleSave() {
  if (!playerName.value.trim()) return
  emit('saveScore', {
    name: playerName.value.trim(),
    score: props.score,
    stopsCompleted: props.stopsCompleted,
    totalTime: props.totalTime,
  })
  saved.value = true
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-4 py-8">
    <!-- Result icon -->
    <div class="animate-fade-up mb-6">
      <div
        class="inline-flex items-center justify-center border p-5"
        :class="
          isComplete
            ? 'border-green-500/30 bg-green-500/10'
            : 'border-accent-coral/30 bg-accent-coral/10'
        "
      >
        <Icon
          :icon="isComplete ? 'lucide:trophy' : 'lucide:skull'"
          class="size-14"
          :class="isComplete ? 'text-accent-amber' : 'text-accent-coral'"
        />
      </div>
    </div>

    <!-- Title -->
    <h1
      class="font-display animate-fade-up animate-delay-1 mb-2 text-4xl font-bold"
      :class="isComplete ? 'text-accent-amber' : 'text-accent-coral'"
    >
      {{ isComplete ? 'HOÀN THÀNH!' : 'GAME OVER' }}
    </h1>
    <p v-if="isComplete" class="text-text-secondary animate-fade-up animate-delay-1 mb-6 text-sm">
      Bạn đã hoàn thành tuyến 02!
    </p>
    <p v-else class="text-text-secondary animate-fade-up animate-delay-1 mb-6 text-sm">
      Hết mạng rồi — hãy thử lại!
    </p>

    <!-- Stats -->
    <div
      class="border-border-default bg-bg-surface animate-fade-up animate-delay-2 mb-6 grid w-full max-w-xs grid-cols-3 gap-4 border p-5"
    >
      <div class="text-center">
        <p class="text-accent-coral font-display text-2xl font-bold">{{ score }}</p>
        <p class="text-text-dim text-xs">Điểm</p>
      </div>
      <div class="text-center">
        <p class="text-accent-sky font-display text-2xl font-bold">
          {{ stopsCompleted }}/{{ totalStops }}
        </p>
        <p class="text-text-dim text-xs">Điểm dừng</p>
      </div>
      <div class="text-center">
        <p class="text-accent-amber font-display text-2xl font-bold">
          {{ formatTime(totalTime) }}
        </p>
        <p class="text-text-dim text-xs">Thời gian</p>
      </div>
    </div>

    <!-- Save score -->
    <div
      v-if="!saved"
      class="border-border-default bg-bg-surface animate-fade-up animate-delay-3 mb-6 w-full max-w-xs border p-4"
    >
      <p class="text-text-secondary mb-2 text-sm">Lưu điểm cao:</p>
      <div class="flex gap-2">
        <input
          v-model="playerName"
          type="text"
          placeholder="Tên của bạn..."
          maxlength="20"
          class="bg-bg-elevated border-border-default text-text-primary focus:border-accent-coral flex-1 border px-3 py-2 text-sm focus:outline-none"
          @keydown.enter="handleSave"
        />
        <button
          class="bg-accent-amber text-bg-deep font-display hover:bg-accent-amber/90 shrink-0 px-4 py-2 text-sm font-bold transition"
          :disabled="!playerName.trim()"
          @click="handleSave"
        >
          Lưu
        </button>
      </div>
    </div>
    <div
      v-else
      class="animate-fade-up mb-6 border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400"
    >
      <Icon icon="lucide:check" class="mr-1 inline size-4" />
      Đã lưu điểm!
    </div>

    <!-- High Scores -->
    <div
      v-if="highScores.length > 0"
      class="border-border-default bg-bg-surface animate-fade-up animate-delay-4 mb-6 w-full max-w-xs border p-4"
    >
      <h3 class="font-display text-text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon icon="lucide:crown" class="text-accent-amber size-4" />
        Bảng điểm cao
      </h3>
      <div class="space-y-2">
        <div
          v-for="(entry, i) in highScores"
          :key="i"
          class="border-border-default bg-bg-elevated flex items-center gap-2 border px-3 py-2 text-xs"
        >
          <span class="font-display text-accent-amber w-5 font-bold">#{{ i + 1 }}</span>
          <span class="text-text-primary flex-1 truncate">{{ entry.name }}</span>
          <span class="text-accent-coral font-display font-semibold">{{ entry.score }}</span>
          <span class="text-text-dim">{{ formatTime(entry.totalTime) }}</span>
        </div>
      </div>
    </div>

    <!-- Restart -->
    <button
      class="animate-fade-up animate-delay-5 bg-accent-coral font-display text-bg-deep hover:bg-accent-coral/90 px-8 py-3 text-lg font-bold tracking-wide transition hover:-translate-y-0.5 active:translate-y-0"
      @click="emit('restart')"
    >
      <Icon icon="lucide:rotate-ccw" class="mr-2 inline size-5 -translate-y-0.5" />
      CHƠI LẠI
    </button>
  </div>
</template>
