<script setup lang="ts">
import { useLanguage } from '../composables/useLanguage'

defineProps<{
  time: string
  steps: number
  bestTime?: number
}>()

const { t } = useLanguage()
</script>

<template>
  <div class="flex gap-6 justify-center items-center text-sm font-display">
    <div class="flex items-center gap-2">
      <span class="text-text-secondary">{{ t.time }}:</span>
      <span class="text-accent-amber font-semibold text-lg">{{ time }}</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-text-secondary">{{ t.steps }}:</span>
      <span class="text-accent-coral font-semibold text-lg">{{ steps }}</span>
    </div>
  </div>
</template>
