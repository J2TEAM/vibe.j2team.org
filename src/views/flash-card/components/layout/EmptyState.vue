<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description?: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="text-center py-20">
    <p class="text-text-dim text-6xl mb-4">{{ icon }}</p>
    <p class="text-text-secondary font-display text-lg">{{ title }}</p>
    <p v-if="description" class="text-text-dim text-sm mt-2">{{ description }}</p>
    <button
      v-if="actionLabel"
      class="mt-6 inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm text-accent-coral font-semibold transition hover:bg-accent-coral hover:text-bg-deep"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
