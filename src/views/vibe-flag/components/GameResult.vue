<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { GameStats, RankInfo, GameMode } from '../types'

const { stats, accuracy, rank, mode } = defineProps<{
  stats: GameStats
  accuracy: number
  rank: RankInfo
  mode: GameMode
}>()

const emit = defineEmits<{
  restart: [mode: GameMode]
  menu: []
}>()

const modeLabel: Record<GameMode, string> = {
  classic: 'Classic',
  survival: 'Survival',
  hard: 'Hard Mode',
}
</script>

<template>
  <div class="animate-fade-up flex w-full max-w-lg flex-col items-center gap-6">
    <!-- Rank card -->
    <div class="border-border-default bg-bg-surface w-full border p-6 text-center">
      <span class="font-display text-text-dim text-xs tracking-widest"
        >KẾT QUẢ · {{ modeLabel[mode] }}</span
      >

      <div class="my-4 text-6xl">{{ rank.emoji }}</div>

      <div :class="['font-display text-3xl font-bold mb-1', rank.color]">
        {{ rank.label }}
      </div>
      <p class="font-body text-text-secondary text-sm">
        Độ chính xác:
        <span class="font-display text-text-primary font-semibold">{{ accuracy }}%</span>
      </p>
    </div>

    <!-- Score row -->
    <div
      class="border-border-default bg-bg-surface grid w-full grid-cols-3 divide-x divide-border-default border"
    >
      <div class="flex flex-col items-center gap-1 p-4">
        <span class="font-display text-accent-amber text-2xl font-bold tabular-nums">
          {{ stats.score.toLocaleString() }}
        </span>
        <span class="font-display text-text-dim text-xs tracking-widest">ĐIỂM</span>
      </div>
      <div class="flex flex-col items-center gap-1 p-4">
        <span class="font-display text-green-400 text-2xl font-bold tabular-nums">{{
          stats.correct
        }}</span>
        <span class="font-display text-text-dim text-xs tracking-widest">ĐÚNG</span>
      </div>
      <div class="flex flex-col items-center gap-1 p-4">
        <span class="font-display text-red-400 text-2xl font-bold tabular-nums">{{
          stats.wrong
        }}</span>
        <span class="font-display text-text-dim text-xs tracking-widest">SAI</span>
      </div>
    </div>

    <!-- Streak info -->
    <div
      class="border-border-default bg-bg-surface grid w-full grid-cols-2 divide-x divide-border-default border"
    >
      <div class="flex flex-col items-center gap-1 p-4">
        <div class="font-display text-accent-coral flex items-center gap-1 text-xl font-bold">
          <Icon icon="lucide:flame" class="size-4" />
          {{ stats.maxStreak }}
        </div>
        <span class="font-display text-text-dim text-xs tracking-widest">STREAK CAO NHẤT</span>
      </div>
      <div class="flex flex-col items-center gap-1 p-4">
        <span class="font-display text-accent-sky text-xl font-bold">+{{ stats.timeBonus }}</span>
        <span class="font-display text-text-dim text-xs tracking-widest">TIME BONUS</span>
      </div>
    </div>

    <!-- Wrong countries -->
    <div v-if="stats.wrongCountries.length > 0" class="w-full">
      <h3
        class="font-display text-text-secondary mb-2 flex items-center gap-2 text-sm tracking-widest"
      >
        <span class="text-accent-coral">// </span>CẦN HỌC LẠI
      </h3>
      <div class="border-border-default bg-bg-surface flex flex-wrap gap-2 border p-3">
        <span
          v-for="c in stats.wrongCountries"
          :key="c.code"
          class="font-body border-border-default bg-bg-elevated text-text-secondary flex items-center gap-1.5 border px-2 py-1 text-xs"
        >
          <img
            :src="`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`"
            :alt="c.name"
            class="h-3 w-5 object-cover"
          />
          {{ c.nameVi }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex w-full gap-3">
      <button
        class="border-accent-coral bg-accent-coral text-bg-deep font-display flex-1 cursor-pointer border px-4 py-3 text-sm font-bold tracking-widest transition hover:bg-accent-coral/90"
        @click="emit('restart', mode)"
      >
        CHƠI LẠI
      </button>
      <button
        class="border-border-default bg-bg-surface text-text-secondary font-display flex-1 cursor-pointer border px-4 py-3 text-sm tracking-widest transition hover:border-accent-coral hover:text-text-primary"
        @click="emit('menu')"
      >
        THỬ CHẾ ĐỘ KHÁC
      </button>
    </div>
  </div>
</template>
