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
            <span class="ml-1">CORNER PREDICTION · PREMIER LEAGUE</span>
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
          Corner Prediction
        </h1>

        <p class="mt-3 text-text-secondary text-sm sm:text-base max-w-2xl">
          Phân tích phạt góc Premier League theo mô hình thống kê — chọn cặp đội, xem xác suất
          Over/Under và lịch sử đối đầu.
        </p>
        <div class="mt-3 border border-border-default bg-bg-surface p-3 max-w-2xl">
          <p class="text-text-dim text-xs leading-relaxed">
            <Icon icon="lucide:shield-alert" class="size-3 inline-block mr-1 text-accent-amber" />
            <strong class="text-text-secondary">Disclaimer:</strong>
            Đây chỉ là công cụ giải trí & nghiên cứu. Cờ bạc, cá độ là
            <span class="text-accent-coral font-semibold">bất hợp pháp</span>. Để tuân theo nguyên
            tắc của vibe.j2team.org, dữ liệu được train offline rồi xuất JSON tĩnh, có thể chậm so
            với thực tế.
          </p>
        </div>
        <p v-if="store.updatedAt" class="mt-2 text-text-dim text-xs flex items-center gap-1.5">
          <Icon icon="lucide:clock" class="size-3" />
          Cập nhật lần cuối:
          <span class="font-mono text-text-secondary">{{ store.updatedAt }}</span>
        </p>
      </section>

      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
