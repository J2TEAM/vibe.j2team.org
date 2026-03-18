<script setup lang="ts">
/**
 * GameHeader — Header trang game: nút Home, VOL.01 badge, tên game, score
 */
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

defineProps<{
  humanScore: number
  computerScore: number
  gameMessage: string
}>()
</script>

<template>
  <header class="relative mb-6">
    <!-- Nút Home (trên cùng bên trái) -->
    <RouterLink
      to="/"
      class="absolute top-0 left-0 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary z-10"
    >
      <Icon icon="lucide:home" class="w-4 h-4" />
      <span class="hidden sm:inline">Trang chủ</span>
    </RouterLink>

    <!-- VOL.01 / 2026 badge -->
    <div class="absolute top-0 right-0 z-10">
      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
      >
        VOL.01 / 2026
      </div>
    </div>

    <!-- Tiêu đề -->
    <div class="text-center pt-14 sm:pt-12">
      <div class="inline-flex items-center gap-2 mb-3">
        <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
        <span class="font-display text-xs tracking-widest text-text-dim uppercase">
          Trò chơi dân gian
        </span>
      </div>
      <h1
        class="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary animate-fade-up leading-tight"
      >
        Ô Ăn
        <span class="text-accent-amber">Quan</span>
      </h1>
      <p class="mt-3 text-text-secondary text-sm max-w-md mx-auto animate-fade-up animate-delay-2">
        Đấu trí trên bàn cờ 12 ô — rải quân, ăn quân, bảo vệ Quan!
      </p>
    </div>

    <!-- Bảng điểm -->
    <div class="mt-6 grid grid-cols-2 gap-4 max-w-sm mx-auto animate-fade-up animate-delay-3">
      <!-- Điểm người chơi -->
      <div class="border border-border-default bg-bg-surface px-4 py-3 text-center">
        <div class="text-text-dim text-xs font-display tracking-wide mb-1">BẠN</div>
        <div class="font-display text-3xl font-bold text-accent-coral tabular-nums">
          {{ humanScore }}
        </div>
      </div>
      <!-- Điểm máy -->
      <div class="border border-border-default bg-bg-surface px-4 py-3 text-center">
        <div class="text-text-dim text-xs font-display tracking-wide mb-1">MÁY</div>
        <div class="font-display text-3xl font-bold text-accent-sky tabular-nums">
          {{ computerScore }}
        </div>
      </div>
    </div>

    <!-- Thông báo game -->
    <div class="mt-4 text-center animate-fade-up animate-delay-4">
      <p class="text-text-secondary text-sm font-display">
        {{ gameMessage }}
      </p>
    </div>
  </header>
</template>
