<script setup lang="ts">
import { computed } from 'vue'
import type { Country } from '../types'

const props = defineProps<{
  country: Country
  mode: string
  isHard: boolean
}>()

const flagUrl = computed(() => `https://flagcdn.com/w640/${props.country.code.toLowerCase()}.png`)
</script>

<template>
  <div
    class="border-border-default bg-bg-surface relative flex w-full items-center justify-center border overflow-hidden"
    style="aspect-ratio: 3/2; max-height: 220px"
  >
    <!-- Hard mode overlay — clip to show only top-left quarter -->
    <div v-if="isHard" class="absolute inset-0 z-10 flex items-center justify-center">
      <div class="relative w-full h-full">
        <!-- show top-left corner only -->
        <img
          :src="flagUrl"
          :alt="`Flag of ${country.name}`"
          class="absolute inset-0 h-full w-full object-cover"
          style="clip-path: inset(0 50% 50% 0)"
        />
        <!-- Blur overlay for the rest -->
        <div
          class="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm"
          style="clip-path: inset(0 0 0 50%)"
        />
        <div
          class="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm"
          style="clip-path: inset(50% 50% 0 0)"
        />
        <div
          class="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm"
          style="clip-path: inset(50% 0 0 50%)"
        />

        <div class="absolute bottom-2 right-2 z-20">
          <span
            class="font-display bg-accent-amber text-bg-deep px-2 py-0.5 text-xs font-bold tracking-widest"
          >
            HARD
          </span>
        </div>
      </div>
    </div>

    <!-- Normal mode -->
    <img
      v-else
      :src="flagUrl"
      :alt="`Flag of ${country.name}`"
      class="h-full w-full object-cover"
    />

    <!-- Continent badge -->
    <div class="absolute top-2 left-2 z-20">
      <span
        class="font-display bg-bg-deep/80 text-text-dim border-border-default border px-2 py-0.5 text-xs tracking-wide"
      >
        {{ country.continent }}
      </span>
    </div>
  </div>
</template>
