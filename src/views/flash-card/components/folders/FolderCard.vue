<script setup lang="ts">
import type { Folder } from '../../types'

defineProps<{
  folder: Folder
  setCount: number
}>()

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
  export: []
}>()
</script>

<template>
  <div
    class="relative border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 cursor-pointer group"
    @click="emit('click')"
  >
    <!-- Color accent bar -->
    <div class="absolute top-0 left-0 w-full h-1" :style="{ backgroundColor: folder.color }" />

    <!-- Actions -->
    <div
      class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <button
        class="p-1.5 text-text-dim hover:text-accent-sky transition-colors"
        aria-label="Xuất thư mục"
        @click.stop="emit('export')"
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
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      </button>
      <button
        class="p-1.5 text-text-dim hover:text-accent-amber transition-colors"
        aria-label="Sửa thư mục"
        @click.stop="emit('edit')"
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
        aria-label="Xóa thư mục"
        @click.stop="emit('delete')"
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

    <!-- Icon -->
    <div class="text-4xl mb-3">{{ folder.icon }}</div>

    <!-- Name -->
    <h3
      class="font-display text-lg font-semibold text-text-primary group-hover:text-accent-coral transition-colors"
    >
      {{ folder.name }}
    </h3>

    <!-- Description -->
    <p v-if="folder.description" class="text-text-secondary text-sm mt-1 line-clamp-2">
      {{ folder.description }}
    </p>

    <!-- Set count -->
    <p class="text-text-dim text-xs mt-3 font-display tracking-wide">{{ setCount }} bộ thẻ</p>
  </div>
</template>
