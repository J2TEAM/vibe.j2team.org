<script setup lang="ts">
// ──────────────────────────────────────────────
// LandingScreen — màn hình giới thiệu cho trang Trải Bài Tarot.
// Bố cục toàn màn hình với chủ đề huyền bí, nút "Bắt Đầu Trải Bài".
// Hỗ trợ truy cập: điều hướng bàn phím, focus states rõ ràng.
// ──────────────────────────────────────────────

import { Icon } from '@iconify/vue'

const emit = defineEmits<{
  start: []
}>()
</script>

<template>
  <div
    class="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center"
    role="main"
    aria-label="Giới thiệu Trải Bài Tarot"
  >
    <!-- Trang trí phía trên -->
    <div class="flex items-center gap-3 mb-6 animate-fade-up">
      <div class="w-12 h-px bg-accent-coral/40" />
      <Icon icon="lucide:sparkles" class="w-5 h-5 text-accent-amber/60" />
      <div class="w-12 h-px bg-accent-coral/40" />
    </div>

    <!-- Tiêu đề -->
    <h1
      class="font-display text-7xl md:text-8xl font-bold tracking-tight text-accent-coral animate-fade-up animate-delay-1"
    >
      Trải Bài Tarot
    </h1>

    <!-- Phụ đề -->
    <p
      class="mt-4 text-text-secondary text-base sm:text-lg max-w-md leading-relaxed animate-fade-up animate-delay-2"
    >
      Khám phá những gì các lá bài tiết lộ về
      <span class="text-accent-amber">quá khứ</span>,
      <span class="text-accent-coral">hiện tại</span> và
      <span class="text-accent-sky">tương lai</span> của bạn.
    </p>

    <!-- Mô tả -->
    <p class="mt-3 text-text-dim text-sm max-w-sm animate-fade-up animate-delay-3">
      Trải bài ba lá từ bộ bài 78 lá hoàn chỉnh — 22 Ẩn Chính và 56 Ẩn Phụ. Mỗi lần trải bài là duy
      nhất.
    </p>

    <!-- Nút Bắt Đầu -->
    <button
      class="mt-10 group inline-flex items-center gap-3 border border-accent-coral bg-accent-coral/10 px-8 py-3.5 font-display text-sm tracking-wider uppercase text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep focus-visible:outline-2 focus-visible:outline-accent-coral focus-visible:outline-offset-4 animate-fade-up animate-delay-4"
      aria-label="Bắt đầu trải bài tarot"
      @click="emit('start')"
    >
      <Icon
        icon="lucide:eye"
        class="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
      />
      Bắt Đầu Trải Bài
      <Icon
        icon="lucide:arrow-right"
        class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
      />
    </button>

    <!-- Gợi ý tính năng -->
    <div
      class="mt-12 flex flex-wrap items-center justify-center gap-6 text-text-dim animate-fade-up animate-delay-5"
    >
      <div class="flex items-center gap-2">
        <Icon icon="lucide:shuffle" class="w-4 h-4" />
        <span class="font-display text-xs tracking-wider uppercase">Xào bài</span>
      </div>
      <div class="w-1 h-1 bg-text-dim/30 rounded-full" />
      <div class="flex items-center gap-2">
        <Icon icon="lucide:hand" class="w-4 h-4" />
        <span class="font-display text-xs tracking-wider uppercase">Rút bài</span>
      </div>
      <div class="w-1 h-1 bg-text-dim/30 rounded-full" />
      <div class="flex items-center gap-2">
        <Icon icon="lucide:rotate-3d" class="w-4 h-4" />
        <span class="font-display text-xs tracking-wider uppercase">Lật bài</span>
      </div>
    </div>
  </div>
</template>
