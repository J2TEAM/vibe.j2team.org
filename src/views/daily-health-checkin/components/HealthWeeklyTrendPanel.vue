<script setup lang="ts">
import type { DailyBarPoint } from '../types'

const props = defineProps<{
  todayKey: string
  sevenDaySeries: DailyBarPoint[]
  perfectDays: number
  activeDays: number
  historySummary: DailyBarPoint[]
  liftedHistoryDate: string | null
  chartPulseActive: boolean
  suggestions: string[]
}>()
</script>

<template>
  <article
    class="animate-fade-up animate-delay-7 border border-border-default bg-bg-surface/90 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-7"
  >
    <h2 class="mb-4 flex items-center gap-3 font-display text-2xl font-semibold">
      <span class="font-display text-xs tracking-widest text-accent-sky">//</span>
      Xu hướng 7 ngày
    </h2>

    <div class="mb-4 grid gap-3 sm:grid-cols-2">
      <div class="border border-border-default bg-bg-elevated px-3 py-2">
        <p class="text-[11px] tracking-[0.12em] text-text-dim">PERFECT DAYS</p>
        <p class="mt-1 font-display text-xl text-accent-sky">{{ props.perfectDays }}/7</p>
      </div>
      <div class="border border-border-default bg-bg-elevated px-3 py-2">
        <p class="text-[11px] tracking-[0.12em] text-text-dim">ACTIVE DAYS</p>
        <p class="mt-1 font-display text-xl text-accent-amber">{{ props.activeDays }}/7</p>
      </div>
    </div>

    <div
      class="grid h-44 grid-cols-7 items-end gap-3 border border-border-default bg-bg-elevated p-4"
    >
      <div
        v-for="point in props.sevenDaySeries"
        :key="point.date"
        class="flex flex-col items-center gap-2"
      >
        <div class="flex h-24 w-full max-w-8 items-end bg-bg-deep/70">
          <div
            class="w-full bg-accent-sky transition-all duration-300"
            :class="
              point.date === props.todayKey && props.chartPulseActive ? 'bar-today-pulse' : ''
            "
            :style="{ height: `${Math.max(point.percent, 6)}%` }"
          />
        </div>
        <span class="text-[10px] text-text-dim">{{ point.label }}</span>
      </div>
    </div>

    <div class="mt-3 space-y-2">
      <div
        v-for="point in props.historySummary"
        :key="`history-${point.date}`"
        class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2 text-xs transition"
        :class="point.date === props.liftedHistoryDate ? 'history-row-lift' : ''"
      >
        <span class="text-text-secondary">{{ point.date }}</span>
        <span class="text-text-dim">{{ point.completion }}/4</span>
      </div>
    </div>

    <ul class="mt-4 space-y-2 text-sm text-text-secondary">
      <li
        v-for="tip in props.suggestions"
        :key="tip"
        class="border border-border-default bg-bg-elevated px-3 py-2"
      >
        {{ tip }}
      </li>
    </ul>
  </article>
</template>

<style scoped>
.bar-today-pulse {
  animation: today-bar-pulse 0.75s ease-out;
  transform-origin: bottom;
}

.history-row-lift {
  animation: history-row-lift 0.48s ease-out;
}

@keyframes today-bar-pulse {
  0% {
    filter: brightness(1);
    transform: scaleY(1);
  }
  45% {
    filter: brightness(1.3);
    transform: scaleY(1.1);
  }
  100% {
    filter: brightness(1);
    transform: scaleY(1);
  }
}

@keyframes history-row-lift {
  0% {
    transform: translateY(0);
    border-color: rgba(56, 189, 248, 0.28);
    background-color: rgba(56, 189, 248, 0.04);
  }
  50% {
    transform: translateY(-2px);
    border-color: rgba(56, 189, 248, 0.45);
    background-color: rgba(56, 189, 248, 0.09);
  }
  100% {
    transform: translateY(0);
    border-color: rgba(56, 189, 248, 0.28);
    background-color: rgba(56, 189, 248, 0.04);
  }
}
</style>
