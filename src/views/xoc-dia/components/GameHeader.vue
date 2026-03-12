<script setup lang="ts">
/**
 * GameHeader — Phần header game: logo VOL.01, tên game, nút Home
 */
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

defineProps<{
  balance: number
}>()
</script>

<template>
  <header class="relative mb-8">
    <!-- Nút Home (trên cùng bên trái) -->
    <RouterLink
      to="/"
      class="absolute top-0 left-0 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary z-10"
    >
      <Icon icon="lucide:home" class="w-4 h-4" />
      <span class="hidden sm:inline">Trang chủ</span>
    </RouterLink>

    <!-- VOL.01 / 2026 badge (trên cùng bên phải) -->
    <div class="absolute top-0 right-0 z-10">
      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
      >
        VOL.01 / 2026
      </div>
    </div>

    <!-- Tiêu đề game -->
    <div class="text-center pt-14 sm:pt-12">
      <div class="inline-flex items-center gap-2 mb-3">
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        <span class="font-display text-xs tracking-widest text-text-dim uppercase">
          Trò chơi dân gian
        </span>
      </div>
      <h1
        class="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-text-primary animate-fade-up leading-tight"
      >
        Xóc
        <span class="text-accent-coral">Đĩa</span>
      </h1>
      <p
        class="mt-3 text-text-secondary text-sm sm:text-base max-w-md mx-auto animate-fade-up animate-delay-2"
      >
        Đặt cược Chẵn / Lẻ — xóc bát và thử vận may!
      </p>

      <!-- Hiển thị số dư nổi bật -->
      <div class="mt-6 animate-fade-up animate-delay-3">
        <div
          class="inline-flex items-center gap-3 border border-border-default bg-bg-surface px-6 py-3"
        >
          <Icon icon="lucide:wallet" class="w-5 h-5 text-accent-amber" />
          <div class="text-left">
            <div class="text-text-dim text-xs font-display tracking-wide">SỐ DƯ</div>
            <div class="font-display text-2xl font-bold text-accent-amber tabular-nums">
              {{ balance.toLocaleString('vi-VN') }}
              <span class="text-sm text-text-dim">xu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
