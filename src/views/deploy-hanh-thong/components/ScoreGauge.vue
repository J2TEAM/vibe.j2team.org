<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  score: number
  verdict: string
}>()

const circumference = 2 * Math.PI * 52
const strokeDashoffset = computed(() => {
  const normalized = Math.max(0, Math.min(100, props.score))
  return circumference - (normalized / 100) * circumference
})

const scoreClass = computed(() => {
  if (props.score >= 75) return 'text-accent-coral'
  if (props.score >= 55) return 'text-accent-amber'
  return 'text-accent-sky'
})

const statusLabel = computed(() => {
  if (props.score >= 75) return 'READY'
  if (props.score >= 55) return 'HOLD'
  return 'DELAY'
})

const moodCardClass = computed(() => {
  if (props.score >= 75) return 'border-accent-coral/60 shadow-[0_0_0_1px_rgba(255,107,74,0.15)]'
  if (props.score >= 55) return 'border-accent-amber/60 shadow-[0_0_0_1px_rgba(255,184,48,0.12)]'
  return 'border-accent-sky/60 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]'
})
</script>

<template>
  <article class="border bg-bg-surface p-5 transition-all duration-300" :class="moodCardClass">
    <div class="flex items-start justify-between gap-3">
      <h2 class="flex items-center gap-2 font-display text-lg text-text-primary">
        <span class="text-accent-amber text-sm tracking-widest">//</span>
        Điểm tổng hợp
      </h2>
      <span class="border border-border-default bg-bg-deep px-2 py-1 font-display text-[10px] tracking-widest" :class="scoreClass">
        {{ statusLabel }}
      </span>
    </div>

    <div class="mt-5 flex items-center gap-5">
      <div class="relative size-32">
        <svg viewBox="0 0 120 120" class="size-32 -rotate-90">
          <circle cx="60" cy="60" r="52" class="fill-none stroke-border-default" stroke-width="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            class="fill-none stroke-current transition-all duration-700"
            :class="scoreClass"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
          />
        </svg>

        <div class="absolute inset-0 flex items-center justify-center">
          <p class="font-display text-3xl font-bold" :class="scoreClass">{{ score }}</p>
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-xs uppercase tracking-wider text-text-dim">Khuyến nghị</p>
        <p class="mt-2 text-sm text-text-secondary">{{ verdict }}</p>
        <p class="mt-3 inline-flex items-center gap-2 text-xs text-text-dim">
          <Icon icon="lucide:shield-check" class="size-4 text-accent-sky" />
          Mô hình đánh giá: vibe + kỹ thuật + rủi ro
        </p>
      </div>
    </div>
  </article>
</template>
