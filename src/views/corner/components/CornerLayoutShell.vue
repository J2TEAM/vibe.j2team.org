<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6">
      <header class="flex items-start justify-between gap-4 animate-fade-up">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="size-3.5" />
            <span>Về trang chủ</span>
          </RouterLink>
          <div class="hidden sm:block text-xs text-text-dim">
            <span class="font-display tracking-widest text-accent-sky">//</span>
            <span class="ml-1">SCOPE CORNER · PREMIER LEAGUE</span>
          </div>
        </div>
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-[10px] sm:text-xs tracking-widest px-3 py-1.5 rotate-3"
        >
          VOL.01 / 2026
        </div>
      </header>

      <section class="animate-fade-up animate-delay-2">
        <h1
          class="font-display text-3xl min-[375px]:text-4xl sm:text-5xl font-bold text-accent-coral tracking-tight"
        >
          Scope Corner
        </h1>
        <p class="mt-3 text-text-secondary text-sm sm:text-base max-w-2xl">
          Dashboard dự đoán tổng phạt góc cho các trận đấu Premier League, hiển thị xác suất
          Over/Under ở nhiều ngưỡng kèo khác nhau dựa trên mô hình ensemble offline.
        </p>
        <p v-if="store.updatedAt" class="mt-2 text-text-dim text-xs">
          Cập nhật dữ liệu:
          <span class="font-mono">{{ store.updatedAt }}</span>
        </p>
      </section>

      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
