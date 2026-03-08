<script setup lang="ts">
defineProps<{
  viewMode: 'side-by-side' | 'unified'
  additions: number
  deletions: number
}>()

const emit = defineEmits<{
  'update:viewMode': [value: 'side-by-side' | 'unified']
}>()

function setViewMode(mode: 'side-by-side' | 'unified') {
  emit('update:viewMode', mode)
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4"
  >
    <div class="flex items-center gap-2">
      <button
        type="button"
        :class="[
          'px-3 py-1.5 text-sm font-medium transition',
          viewMode === 'side-by-side'
            ? 'border border-accent-coral bg-accent-coral/10 text-accent-coral'
            : 'border border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary',
        ]"
        @click="setViewMode('side-by-side')"
      >
        Side-by-side
      </button>
      <button
        type="button"
        :class="[
          'px-3 py-1.5 text-sm font-medium transition',
          viewMode === 'unified'
            ? 'border border-accent-coral bg-accent-coral/10 text-accent-coral'
            : 'border border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary',
        ]"
        @click="setViewMode('unified')"
      >
        Unified
      </button>
    </div>
    <div class="text-sm text-text-dim">
      <span class="text-accent-coral">−{{ deletions }}</span>
      <span class="mx-2">/</span>
      <span class="text-accent-sky">+{{ additions }}</span>
    </div>
  </div>
</template>
