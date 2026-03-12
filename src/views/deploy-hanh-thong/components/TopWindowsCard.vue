<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { WindowSuggestion } from '../types'

defineProps<{
  windows: WindowSuggestion[]
}>()
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-5">
    <h2 class="flex items-center gap-2 font-display text-lg text-text-primary">
      <span class="text-accent-sky text-sm tracking-widest">//</span>
      Top 3 giờ đẹp
    </h2>

    <ul class="mt-4 space-y-2 text-sm">
      <li
        v-for="(window, index) in windows"
        :key="window.label"
        class="flex items-center justify-between border border-border-default bg-bg-deep px-3 py-2"
      >
        <span class="inline-flex items-center gap-2 text-text-secondary">
          <Icon :icon="index === 0 ? 'lucide:crown' : 'lucide:clock-3'" class="size-4 text-accent-amber" />
          {{ window.label }}
        </span>
        <span class="font-display text-accent-coral">{{ window.score }}</span>
      </li>
    </ul>
  </article>
</template>
