<script setup lang="ts">
import { computed } from 'vue'
import type { HourlyScore } from '../types'

const props = defineProps<{
  scores: HourlyScore[]
  currentHour: number
}>()

const normalized = computed(() => {
  return props.scores.map((item) => {
    const toneClass =
      item.score >= 75
        ? 'bg-accent-coral/70'
        : item.score >= 55
          ? 'bg-accent-amber/70'
          : 'bg-accent-sky/50'

    return {
      ...item,
      toneClass,
    }
  })
})
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-5">
    <h2 class="flex items-center gap-2 font-display text-lg text-text-primary">
      <span class="text-accent-coral text-sm tracking-widest">//</span>
      Timeline 24 giờ
    </h2>
    <p class="mt-2 text-xs text-text-dim">Màu coral: tốt, amber: trung tính, sky: nên cân nhắc</p>

    <div class="mt-4 grid grid-cols-12 gap-2 sm:[grid-template-columns:repeat(24,minmax(0,1fr))]">
      <div
        v-for="slot in normalized"
        :key="slot.hour"
        class="group relative h-10 border border-border-default"
        :class="[slot.toneClass, slot.hour === currentHour ? 'ring-1 ring-accent-coral' : '']"
      >
        <span class="absolute left-1 top-1 font-display text-[10px] text-text-primary">{{ slot.hour }}</span>
        <div
          class="invisible pointer-events-none absolute -top-9 left-1/2 z-10 w-max -translate-x-1/2 border border-border-default bg-bg-deep px-2 py-1 text-[10px] text-text-secondary group-hover:visible"
        >
          {{ String(slot.hour).padStart(2, '0') }}:00 - {{ String(slot.hour).padStart(2, '0') }}:59 | {{ slot.score }}
        </div>
      </div>
    </div>
  </article>
</template>
