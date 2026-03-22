<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PlayMode } from '../types'

defineEmits<{
  select: [mode: PlayMode]
}>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <!-- Level mode -->
    <button
      class="group relative overflow-hidden border border-border-default bg-bg-surface p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:shadow-xl hover:shadow-accent-coral/10 active:scale-[0.98]"
      @click="$emit('select', 'level')"
    >
      <!-- Glow background on hover -->
      <div
        class="absolute -right-10 -top-10 size-40 bg-accent-coral/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div class="relative">
        <div class="flex items-center gap-3">
          <div
            class="flex size-12 items-center justify-center border border-accent-coral/30 bg-accent-coral/10"
          >
            <Icon
              icon="lucide:layers"
              class="size-6 text-accent-coral transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div>
            <h3 class="font-display text-lg font-bold text-text-primary">Chơi theo Level</h3>
            <span class="text-xs text-text-dim">30 thử thách</span>
          </div>
        </div>

        <p class="mt-3 text-sm leading-relaxed text-text-secondary">
          Từ blog cá nhân đến hệ thống triệu người dùng. Mở khóa level mới bằng cách hoàn thành
          level trước.
        </p>

        <div class="mt-4 flex flex-wrap gap-1.5">
          <span
            class="border border-accent-sky/30 bg-accent-sky/10 px-2 py-0.5 text-[11px] font-display text-accent-sky"
          >
            Nhập môn
          </span>
          <span
            class="border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] font-display text-green-400"
          >
            Dễ
          </span>
          <span
            class="border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 text-[11px] font-display text-accent-amber"
          >
            Trung bình
          </span>
          <span
            class="border border-accent-coral/30 bg-accent-coral/10 px-2 py-0.5 text-[11px] font-display text-accent-coral"
          >
            Khó
          </span>
          <span
            class="border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-display text-red-400"
          >
            Chuyên gia
          </span>
        </div>
      </div>
    </button>

    <!-- Random mode -->
    <button
      class="group relative overflow-hidden border border-border-default bg-bg-surface p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent-amber hover:shadow-xl hover:shadow-accent-amber/10 active:scale-[0.98]"
      @click="$emit('select', 'random')"
    >
      <div
        class="absolute -right-10 -top-10 size-40 bg-accent-amber/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div class="relative">
        <div class="flex items-center gap-3">
          <div
            class="flex size-12 items-center justify-center border border-accent-amber/30 bg-accent-amber/10"
          >
            <Icon
              icon="lucide:shuffle"
              class="size-6 text-accent-amber transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div>
            <h3 class="font-display text-lg font-bold text-text-primary">Chơi ngẫu nhiên</h3>
            <span class="text-xs text-text-dim">Thử vận may</span>
          </div>
        </div>

        <p class="mt-3 text-sm leading-relaxed text-text-secondary">
          Nhận thử thách bất kỳ từ dễ đến khó. Phù hợp khi muốn luyện tập nhanh hoặc thử thách bản
          thân.
        </p>

        <div class="mt-4 flex items-center gap-2 text-xs text-text-dim">
          <Icon icon="lucide:dice-3" class="size-4 text-accent-amber" />
          <span>Ngẫu nhiên từ 30 thử thách có sẵn</span>
        </div>
      </div>
    </button>
  </div>
</template>
