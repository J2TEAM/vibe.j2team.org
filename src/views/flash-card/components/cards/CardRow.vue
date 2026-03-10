<script setup lang="ts">
import type { Card } from '../../types'

defineProps<{
  card: Card
  isFirst: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  moveUp: []
  moveDown: []
}>()

const levelColors: Record<number, string> = {
  0: 'bg-text-dim/20 text-text-dim',
  1: 'bg-accent-coral/20 text-accent-coral',
  2: 'bg-accent-amber/20 text-accent-amber',
  3: 'bg-accent-sky/20 text-accent-sky',
}

const levelLabels: Record<number, string> = {
  0: 'Mới',
  1: 'Lv.1',
  2: 'Lv.2',
  3: 'Thuộc',
}
</script>

<template>
  <div
    class="flex items-center gap-3 border border-border-default bg-bg-surface p-4 transition hover:border-accent-coral/30 group"
  >
    <!-- Reorder -->
    <div class="flex flex-col gap-0.5 shrink-0">
      <button
        class="p-0.5 text-text-dim hover:text-text-primary transition disabled:opacity-20 disabled:cursor-not-allowed"
        :disabled="isFirst"
        aria-label="Di chuyển lên"
        @click="emit('moveUp')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
      <button
        class="p-0.5 text-text-dim hover:text-text-primary transition disabled:opacity-20 disabled:cursor-not-allowed"
        :disabled="isLast"
        aria-label="Di chuyển xuống"
        @click="emit('moveDown')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 grid grid-cols-2 gap-4">
      <div class="truncate text-sm text-text-primary">{{ card.front }}</div>
      <div class="truncate text-sm text-text-secondary">{{ card.back }}</div>
    </div>

    <!-- Level badge -->
    <span class="shrink-0 px-2 py-0.5 text-xs font-display" :class="levelColors[card.level]">
      {{ levelLabels[card.level] }}
    </span>

    <!-- Actions -->
    <div class="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        class="p-1.5 text-text-dim hover:text-accent-amber transition-colors"
        aria-label="Sửa thẻ"
        @click="emit('edit')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>
      <button
        class="p-1.5 text-text-dim hover:text-accent-coral transition-colors"
        aria-label="Xóa thẻ"
        @click="emit('delete')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>
