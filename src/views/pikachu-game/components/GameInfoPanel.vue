<script setup lang="ts">
import type { GameMode } from '../types'

interface Props {
  score: number
  timeLabel: string
  mode: GameMode
  difficulty: number
  assistsLeft: number
  message: string
  storyLabel: string
}

defineProps<Props>()

defineEmits<{ useHint: []; useReload: [] }>()
</script>

<template>
  <aside class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-4">
    <h2 class="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
      <span class="text-xs tracking-widest text-accent-amber">//</span>
      Thông tin màn choi
    </h2>

    <div class="grid grid-cols-2 gap-2">
      <div class="border border-border-default bg-bg-deep p-2.5">
        <p class="font-display text-[10px] tracking-widest text-text-secondary">SCORE</p>
        <p class="font-display text-xl font-semibold text-accent-coral">{{ score }}</p>
      </div>
      <div class="border border-border-default bg-bg-deep p-2.5">
        <p class="font-display text-[10px] tracking-widest text-text-secondary">TIME</p>
        <p class="font-display text-xl font-semibold text-accent-sky">{{ mode === 'classic' ? '8' : timeLabel }}</p>
      </div>
      <div class="border border-border-default bg-bg-deep p-2.5">
        <p class="font-display text-[10px] tracking-widest text-text-secondary">MODE</p>
        <p class="font-display text-sm font-semibold text-accent-amber">{{ mode.toUpperCase() }}</p>
      </div>
      <div class="border border-border-default bg-bg-deep p-2.5">
        <p class="font-display text-[10px] tracking-widest text-text-secondary">DIFFICULTY</p>
        <p class="font-display text-sm font-semibold text-accent-coral">LEVEL {{ difficulty }}</p>
      </div>
    </div>

    <h3 class="mt-5 flex items-center gap-2 font-display text-sm font-semibold">
      <span class="text-[10px] tracking-widest text-accent-sky">//</span>
      Tr? giúp (Power-up)
    </h3>
    <p class="mt-1 text-xs text-text-secondary">
      Lu?t còn l?i: <span class="text-accent-amber">{{ assistsLeft }}</span>
    </p>

    <div class="mt-2 grid grid-cols-2 gap-2">
      <button type="button" class="border border-border-default bg-bg-deep px-2 py-2 text-xs transition hover:border-accent-amber" @click="$emit('useHint')">
        G?i ý
      </button>
      <button type="button" class="border border-border-default bg-bg-deep px-2 py-2 text-xs transition hover:border-accent-coral" @click="$emit('useReload')">
        T?i l?i
      </button>
    </div>

    <p class="mt-3 text-xs text-text-secondary">{{ message }}</p>
    <p v-if="storyLabel" class="mt-1 text-xs text-accent-amber">{{ storyLabel }}</p>
  </aside>
</template>

