<script setup lang="ts">
defineProps<{
  canUndo: boolean
}>()

const emit = defineEmits<{
  flip: []
  correct: []
  incorrect: []
  undo: []
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Main controls -->
    <div class="flex items-center justify-center gap-4">
      <button
        class="flex-1 max-w-[140px] py-3 text-sm border border-accent-coral bg-accent-coral/10 text-accent-coral font-semibold transition hover:bg-accent-coral hover:text-bg-deep"
        @click="emit('incorrect')"
      >
        Chưa nhớ
      </button>

      <button
        class="px-6 py-3 text-sm border border-border-default bg-bg-surface text-text-secondary font-semibold transition hover:border-accent-coral hover:text-text-primary"
        @click="emit('flip')"
      >
        Lật thẻ
      </button>

      <button
        class="flex-1 max-w-[140px] py-3 text-sm border border-accent-sky bg-accent-sky/10 text-accent-sky font-semibold transition hover:bg-accent-sky hover:text-bg-deep"
        @click="emit('correct')"
      >
        Đã nhớ
      </button>
    </div>

    <!-- Undo + keyboard hints -->
    <div class="flex items-center justify-between">
      <button
        v-if="canUndo"
        class="text-xs text-text-dim hover:text-text-secondary transition"
        @click="emit('undo')"
      >
        Hoàn tác (Ctrl+Z)
      </button>
      <span v-else />
      <p class="text-xs text-text-dim">
        Space: lật &middot; &larr; chưa nhớ &middot; &rarr; đã nhớ
      </p>
    </div>
  </div>
</template>
