<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { idiomCategories } from '../../data/categories'
import type { IdiomCategoryId } from '../../data/categories'

defineProps<{
  selectedCategory: IdiomCategoryId | null
}>()

defineEmits<{
  (e: 'select', id: IdiomCategoryId | null): void
}>()
</script>

<template>
  <div class="space-y-3">
    <!-- All button -->
    <button
      class="w-full border p-3 text-left text-sm font-display transition-all duration-300"
      :class="
        selectedCategory === null
          ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
          : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral hover:bg-bg-elevated'
      "
      @click="$emit('select', null)"
    >
      <Icon icon="lucide:layers" class="mr-2 inline size-4" />
      Tất cả chủ đề
    </button>

    <!-- Category grid -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button
        v-for="cat in idiomCategories"
        :key="cat.id"
        class="border p-3 text-left transition-all duration-300"
        :class="[
          selectedCategory === cat.id
            ? `border-accent-${cat.accent} bg-accent-${cat.accent}/10`
            : 'border-border-default bg-bg-surface hover:-translate-y-1 hover:bg-bg-elevated hover:shadow-lg',
          `hover:border-accent-${cat.accent}`,
        ]"
        @click="$emit('select', cat.id)"
      >
        <span class="text-2xl">{{ cat.emoji }}</span>
        <p class="mt-1 text-xs font-display" :class="`text-accent-${cat.accent}`">
          {{ cat.label }}
        </p>
      </button>
    </div>
  </div>
</template>
