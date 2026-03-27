<script setup lang="ts">
import { computed } from 'vue'

import { formatDateTimeInTimeZone } from '../utils/cron'

const props = defineProps<{
  nextRuns: Date[]
  timezone: string
}>()

const timelinePoints = computed(() => {
  if (props.nextRuns.length < 2) {
    return []
  }

  const firstRun = props.nextRuns[0]
  const lastRun = props.nextRuns[props.nextRuns.length - 1]

  if (!firstRun || !lastRun) {
    return []
  }

  const start = firstRun.getTime()
  const end = lastRun.getTime()
  const duration = end - start

  return props.nextRuns.map((date, index) => {
    const position =
      duration > 0
        ? ((date.getTime() - start) / duration) * 100
        : (index / (props.nextRuns.length - 1)) * 100

    return {
      date,
      position: Math.min(100, Math.max(0, position)),
      label: formatDateTimeInTimeZone(date, props.timezone, {
        hour: '2-digit',
        minute: '2-digit',
      }),
      tooltip: formatDateTimeInTimeZone(date, props.timezone, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
    }
  })
})
</script>

<template>
  <div class="relative px-4 py-12">
    <div v-if="timelinePoints.length > 0" class="relative min-h-40">
      <div class="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border-default"></div>

      <div
        v-for="(point, index) in timelinePoints"
        :key="`${point.date.getTime()}-${index}`"
        class="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        :style="{ left: `${point.position}%` }"
      >
        <button
          type="button"
          class="group relative flex flex-col items-center outline-none"
          :aria-label="point.tooltip"
        >
          <span
            class="size-4 border-2 border-bg-surface bg-accent-amber transition-transform group-hover:scale-125"
          />

          <span
            class="absolute top-6 whitespace-nowrap border border-border-default bg-bg-elevated px-2 py-1 text-[10px] font-mono text-text-primary opacity-0 transition-opacity group-hover:opacity-100"
          >
            {{ point.tooltip }}
          </span>
        </button>

        <span class="mt-5 whitespace-nowrap text-[10px] font-mono text-text-dim">
          {{ point.label }}
        </span>
      </div>
    </div>
    <div
      v-else
      class="border border-dashed border-border-default bg-bg-deep px-4 py-8 text-center italic text-text-dim"
    >
      Cần ít nhất 2 lần chạy để vẽ dòng thời gian
    </div>
  </div>
</template>
