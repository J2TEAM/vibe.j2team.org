<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Idiom } from '../../data/types'

defineProps<{
  idiom: Idiom
}>()
</script>

<template>
  <div class="relative overflow-hidden border-2 border-accent-coral bg-bg-surface p-6">
    <!-- Corner badge -->
    <div
      class="absolute right-0 top-0 bg-accent-coral px-3 py-1 font-display text-xs font-bold tracking-widest text-bg-deep"
    >
      FLEX CỦA NGÀY
    </div>

    <div class="flex items-start gap-4">
      <span class="text-4xl">{{ idiom.emoji }}</span>
      <div class="flex-1">
        <h3 class="font-display text-xl font-bold text-accent-coral">
          {{ idiom.phrase }}
        </h3>
        <p class="mt-1 font-display text-base font-semibold text-accent-amber">
          {{ idiom.literal_vi }}
        </p>
        <p class="mt-2 text-sm text-text-primary">
          {{ idiom.meaning_vi }}
        </p>
        <p class="mt-2 text-sm italic text-text-secondary">
          {{ idiom.funny_context }}
        </p>
        <div class="mt-3 space-y-1 text-sm">
          <p class="text-accent-sky">
            <Icon icon="lucide:message-circle" class="mr-1 inline size-3" />
            {{ idiom.example_en }}
          </p>
          <p class="text-text-secondary">→ {{ idiom.example_vi }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
