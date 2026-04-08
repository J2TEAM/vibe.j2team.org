<script setup lang="ts">
import { Icon } from '@iconify/vue'

import type { Scenario } from '../types'

const props = defineProps<{
  scenarios: readonly Scenario[]
  selectedScenarioId: string
  locked: boolean
}>()

const emit = defineEmits<{
  select: [scenarioId: string]
}>()

function handlePick(scenarioId: string) {
  if (props.locked) {
    return
  }

  emit('select', scenarioId)
}
</script>

<template>
  <section class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
    <button
      v-for="scenario in scenarios"
      :key="scenario.id"
      type="button"
      class="group border bg-bg-surface p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-bg-elevated"
      :class="
        selectedScenarioId === scenario.id
          ? 'border-accent-coral shadow-lg shadow-accent-coral/10'
          : 'border-border-default'
      "
      :disabled="locked"
      @click="handlePick(scenario.id)"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="font-display text-xs tracking-[0.2em] text-text-dim">{{
          scenario.badge
        }}</span>
        <span class="inline-flex items-center gap-1 text-xs text-accent-sky">
          <Icon :icon="scenario.icon" class="size-3.5" />
          <span>{{ scenario.steps.length }} bước</span>
        </span>
      </div>

      <img
        :src="scenario.image"
        :alt="`Minh họa ${scenario.name}`"
        class="aspect-video w-full border border-border-default bg-bg-deep object-contain p-1"
        loading="lazy"
      />

      <h2 class="mt-3 font-display text-2xl font-semibold text-text-primary">
        {{ scenario.name }}
      </h2>
      <p class="mt-2 text-sm text-text-secondary">{{ scenario.description }}</p>
      <p class="mt-2 text-xs text-text-dim">{{ scenario.summary }}</p>
    </button>
  </section>
</template>
