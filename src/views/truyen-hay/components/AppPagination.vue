<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

const maxVisibleButtons = 5

const pageNumbers = computed(() => {
  const half = Math.floor(maxVisibleButtons / 2)
  let start = props.currentPage - half
  let end = props.currentPage + half

  if (start <= 0) {
    start = 1
    end = Math.min(props.totalPages, maxVisibleButtons)
  }

  if (end > props.totalPages) {
    end = props.totalPages
    start = Math.max(1, props.totalPages - maxVisibleButtons + 1)
  }

  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const changePage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-2">
    <!-- Prev -->
    <button
      :disabled="currentPage === 1"
      class="flex h-10 w-10 items-center justify-center rounded-lg border border-border-default bg-bg-surface text-text-secondary transition-colors hover:border-accent-coral hover:text-accent-coral disabled:cursor-not-allowed disabled:opacity-50"
      @click="changePage(currentPage - 1)"
    >
      <Icon icon="ph:caret-left-bold" class="h-4 w-4" />
    </button>

    <!-- First -->
    <template
      v-if="pageNumbers.length > 0 && typeof pageNumbers[0] === 'number' && pageNumbers[0] > 1"
    >
      <button
        class="flex h-10 w-10 items-center justify-center rounded-lg border border-border-default bg-bg-surface font-display text-sm font-semibold text-text-secondary transition-colors hover:border-accent-coral hover:text-accent-coral"
        @click="changePage(1)"
      >
        1
      </button>
      <span v-if="typeof pageNumbers[0] === 'number' && pageNumbers[0] > 2" class="text-text-dim"
        >...</span
      >
    </template>

    <!-- Pages -->
    <button
      v-for="page in pageNumbers"
      :key="page"
      class="flex h-10 w-10 items-center justify-center rounded-lg font-display text-sm font-semibold transition-all"
      :class="
        page === currentPage
          ? 'bg-accent-coral text-bg-deep shadow-md shadow-accent-coral/20'
          : 'border border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:text-accent-coral'
      "
      @click="changePage(page)"
    >
      {{ page }}
    </button>

    <!-- Last -->
    <template
      v-if="
        pageNumbers.length > 0 &&
        typeof pageNumbers[pageNumbers.length - 1] === 'number' &&
        (pageNumbers[pageNumbers.length - 1] as number) < totalPages
      "
    >
      <span
        v-if="(pageNumbers[pageNumbers.length - 1] as number) < totalPages - 1"
        class="text-text-dim"
        >...</span
      >
      <button
        class="flex h-10 w-10 items-center justify-center rounded-lg border border-border-default bg-bg-surface font-display text-sm font-semibold text-text-secondary transition-colors hover:border-accent-coral hover:text-accent-coral"
        @click="changePage(totalPages)"
      >
        {{ totalPages }}
      </button>
    </template>

    <!-- Next -->
    <button
      :disabled="currentPage === totalPages"
      class="flex h-10 w-10 items-center justify-center rounded-lg border border-border-default bg-bg-surface text-text-secondary transition-colors hover:border-accent-coral hover:text-accent-coral disabled:cursor-not-allowed disabled:opacity-50"
      @click="changePage(currentPage + 1)"
    >
      <Icon icon="ph:caret-right-bold" class="h-4 w-4" />
    </button>
  </div>
</template>
