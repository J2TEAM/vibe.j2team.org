<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { HistoryItem } from '../types'

defineProps<{
  items: HistoryItem[]
}>()

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-5">
    <div class="flex items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 font-display text-lg text-text-primary">
        <span class="text-accent-coral text-sm tracking-widest">//</span>
        Lịch sử đánh giá
      </h2>
      <button
        type="button"
        class="inline-flex items-center gap-1 border border-border-default px-3 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @click="emit('clear')"
      >
        <Icon icon="lucide:trash-2" class="size-3.5" />
        Xóa
      </button>
    </div>

    <div v-if="items.length === 0" class="mt-4 border border-dashed border-border-default bg-bg-deep p-5">
      <p class="inline-flex items-center gap-2 font-display text-sm text-text-primary">
        <Icon icon="lucide:inbox" class="size-4 text-accent-sky" />
        Chưa có snapshot nào
      </p>
      <p class="mt-2 text-sm text-text-secondary">
        Hãy bấm <span class="text-accent-coral">Lưu snapshot</span> ở phía trên để tạo mốc so sánh cho các lần release sau.
      </p>
    </div>

    <ul v-else class="mt-4 space-y-2 text-xs text-text-secondary">
      <li v-for="item in items.slice(0, 6)" :key="item.id" class="border border-border-default bg-bg-deep p-3">
        <p class="font-display text-sm text-text-primary">{{ item.score }} điểm - {{ item.releaseType }}</p>
        <p class="mt-1">{{ item.deployers.join(', ') || 'Không có tên' }}</p>
        <p class="mt-1 text-text-dim">
          {{ new Date(item.createdAt).toLocaleString('vi-VN') }} | risk: {{ item.riskLevel }} | test:
          {{ item.testPassRate }}%
        </p>
      </li>
    </ul>
  </article>
</template>
