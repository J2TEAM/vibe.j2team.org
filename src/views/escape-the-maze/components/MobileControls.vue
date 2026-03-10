<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  move: [direction: 'up' | 'down' | 'left' | 'right']
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <button
      :disabled="disabled"
      class="w-16 h-16 bg-bg-surface border border-border-default text-text-primary font-display font-bold text-2xl transition-all duration-200 hover:bg-bg-elevated hover:border-accent-coral hover:text-accent-coral active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-surface disabled:hover:border-border-default disabled:hover:text-text-primary"
      @click="emit('move', 'up')"
    >
      ↑
    </button>
    <div class="flex gap-2">
      <button
        :disabled="disabled"
        class="w-16 h-16 bg-bg-surface border border-border-default text-text-primary font-display font-bold text-2xl transition-all duration-200 hover:bg-bg-elevated hover:border-accent-coral hover:text-accent-coral active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-surface disabled:hover:border-border-default disabled:hover:text-text-primary"
        @click="emit('move', 'left')"
      >
        ←
      </button>
      <button
        :disabled="disabled"
        class="w-16 h-16 bg-bg-surface border border-border-default text-text-primary font-display font-bold text-2xl transition-all duration-200 hover:bg-bg-elevated hover:border-accent-coral hover:text-accent-coral active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-surface disabled:hover:border-border-default disabled:hover:text-text-primary"
        @click="emit('move', 'down')"
      >
        ↓
      </button>
      <button
        :disabled="disabled"
        class="w-16 h-16 bg-bg-surface border border-border-default text-text-primary font-display font-bold text-2xl transition-all duration-200 hover:bg-bg-elevated hover:border-accent-coral hover:text-accent-coral active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-surface disabled:hover:border-border-default disabled:hover:text-text-primary"
        @click="emit('move', 'right')"
      >
        →
      </button>
    </div>
  </div>
</template>
