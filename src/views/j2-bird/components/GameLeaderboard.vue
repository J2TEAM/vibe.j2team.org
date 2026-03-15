<script setup lang="ts">
import type { ScoreEntry } from '../logic/ScoreManager'

const props = defineProps<{
  scores: ScoreEntry[]
  currentScore?: number
}>()

const RANK_ICONS = ['🥇', '🥈', '🥉']

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  } catch {
    return '??'
  }
}
</script>

<template>
  <div class="w-full font-mono text-xs">
    <!-- Header -->
    <div class="flex justify-between text-[10px] text-green-800 tracking-widest uppercase pb-1.5 border-b border-green-900 mb-1">
      <span>RANK · NAME</span>
      <span>PTS · DATE</span>
    </div>

    <!-- Empty state -->
    <div v-if="scores.length === 0" class="py-5 text-center text-green-900">
      No records yet. Be the first! 🐦
    </div>

    <!-- Entries -->
    <div
      v-for="(entry, i) in scores"
      :key="i"
      class="flex items-center gap-2 py-1.5 px-1 border-b border-green-950/60 transition-colors"
      :class="entry.score === props.currentScore && i === scores.findIndex(s => s.score === props.currentScore)
        ? 'bg-green-900/30 border-green-700/50'
        : ''"
    >
      <!-- Rank -->
      <span class="w-6 text-center shrink-0 text-sm">
        {{ i < 3 ? RANK_ICONS[i] : `#${i + 1}` }}
      </span>

      <!-- Name -->
      <span
        class="flex-1 truncate"
        :class="i === 0 ? 'text-yellow-300 font-bold' : 'text-green-300'"
      >
        {{ entry.name }}
      </span>

      <!-- Score -->
      <span
        class="tabular-nums font-bold"
        :class="i === 0 ? 'text-yellow-400' : 'text-green-400'"
      >
        {{ entry.score }}
      </span>

      <!-- Date -->
      <span class="text-green-900 text-[10px] shrink-0 w-9 text-right">
        {{ formatDate(entry.date) }}
      </span>
    </div>
  </div>
</template>
