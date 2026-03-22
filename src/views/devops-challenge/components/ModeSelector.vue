<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PlayMode } from '../types'

defineEmits<{
  select: [mode: PlayMode]
}>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <button
      class="group border border-border-default bg-bg-surface p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
      @click="$emit('select', 'level')"
    >
      <Icon
        icon="lucide:layers"
        class="size-10 text-accent-coral transition-transform duration-300 group-hover:scale-110"
      />
      <h3 class="mt-4 font-display text-lg font-semibold text-text-primary">Chơi theo Level</h3>
      <p class="mt-2 text-sm text-text-secondary">
        30 level từ dễ đến khó. Mở khóa level mới bằng cách hoàn thành level trước. Mỗi level là một
        yêu cầu từ khách hàng thực tế.
      </p>
      <div class="mt-4 flex gap-1">
        <span
          class="border border-accent-sky/30 bg-accent-sky/10 px-2 py-0.5 text-xs text-accent-sky"
          >Nhập môn</span
        >
        <span class="border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-400"
          >Dễ</span
        >
        <span
          class="border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 text-xs text-accent-amber"
          >Trung bình</span
        >
        <span
          class="border border-accent-coral/30 bg-accent-coral/10 px-2 py-0.5 text-xs text-accent-coral"
          >Khó</span
        >
        <span class="border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
          >Chuyên gia</span
        >
      </div>
    </button>

    <button
      class="group border border-border-default bg-bg-surface p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-amber/5"
      @click="$emit('select', 'random')"
    >
      <Icon
        icon="lucide:shuffle"
        class="size-10 text-accent-amber transition-transform duration-300 group-hover:scale-110"
      />
      <h3 class="mt-4 font-display text-lg font-semibold text-text-primary">Chơi ngẫu nhiên</h3>
      <p class="mt-2 text-sm text-text-secondary">
        Nhận một thử thách bất kỳ từ dễ đến khó. Phù hợp khi muốn luyện tập nhanh hoặc thử thách bản
        thân.
      </p>
      <div class="mt-4 flex items-center gap-2 text-xs text-text-dim">
        <Icon icon="lucide:dice-3" class="size-4" />
        <span>Ngẫu nhiên từ 30 thử thách</span>
      </div>
    </button>
  </div>
</template>
