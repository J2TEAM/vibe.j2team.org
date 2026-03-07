<script setup lang="ts">
import type { CardSet } from '../../types'
import { formatDate } from '../../composables/format'

defineProps<{
  set: CardSet
  cardCount: number
  masteredCount: number
  inProgressCount: number
  newCount: number
  lastStudied: number | null
}>()

const emit = defineEmits<{
  click: []
  study: []
  edit: []
  delete: []
}>()
</script>

<template>
  <div
    class="border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 cursor-pointer group"
    @click="emit('click')"
  >
    <!-- Title + Actions -->
    <div class="flex items-center justify-between gap-3">
      <h3
        class="font-display text-lg font-semibold text-text-primary group-hover:text-accent-coral transition-colors truncate"
      >
        {{ set.name }}
      </h3>
      <div class="flex items-center gap-1 shrink-0">
        <button
          v-if="cardCount > 0"
          class="px-3 py-1.5 text-xs border border-accent-sky bg-accent-sky/10 text-accent-sky font-semibold transition hover:bg-accent-sky hover:text-bg-deep"
          aria-label="Học bộ thẻ"
          @click.stop="emit('study')"
        >
          Học
        </button>
        <button
          class="p-1.5 text-text-dim hover:text-accent-amber transition-colors"
          aria-label="Sửa bộ thẻ"
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
          aria-label="Xóa bộ thẻ"
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
    </div>

    <p v-if="set.description" class="text-text-secondary text-sm mt-1 line-clamp-1">
      {{ set.description }}
    </p>

    <!-- Segmented progress bar -->
    <div class="mt-3 flex items-center gap-3">
      <div class="flex-1 h-2 bg-bg-elevated overflow-hidden flex">
        <div
          class="h-full bg-accent-sky transition-all"
          :style="{ width: cardCount > 0 ? `${(masteredCount / cardCount) * 100}%` : '0%' }"
        />
        <div
          class="h-full bg-accent-amber transition-all"
          :style="{ width: cardCount > 0 ? `${(inProgressCount / cardCount) * 100}%` : '0%' }"
        />
        <div
          class="h-full bg-text-dim/30 transition-all"
          :style="{ width: cardCount > 0 ? `${(newCount / cardCount) * 100}%` : '0%' }"
        />
      </div>
      <span class="text-text-dim text-xs font-display whitespace-nowrap">
        {{ cardCount > 0 ? Math.round((masteredCount / cardCount) * 100) : 0 }}%
      </span>
    </div>

    <!-- Stats row -->
    <div class="mt-2 flex items-center gap-4 text-xs">
      <span class="flex items-center gap-1">
        <span class="w-2 h-2 bg-accent-sky inline-block shrink-0" />
        <span class="text-text-secondary">Thuộc: {{ masteredCount }}</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="w-2 h-2 bg-accent-amber inline-block shrink-0" />
        <span class="text-text-secondary">Đang học: {{ inProgressCount }}</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="w-2 h-2 bg-text-dim/30 inline-block shrink-0" />
        <span class="text-text-secondary">Mới: {{ newCount }}</span>
      </span>
      <span v-if="lastStudied" class="ml-auto text-text-dim">{{ formatDate(lastStudied) }}</span>
    </div>
  </div>
</template>
