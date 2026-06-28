<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  hoseGradId: string
  hoseStrokePaint: string
  hosePathD: string
  hoseColoredPathStyle: Record<string, string | number>
  hoseStrokeMotionClass: string
  nozzleDotLive: boolean
}>()

const pathRef = ref<SVGPathElement | null>(null)
defineExpose({ pathRef })
</script>

<template>
  <svg
    class="max-h-full max-w-full h-full w-auto aspect-square shrink-0"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="hoseGradId" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFB830" />
        <stop offset="55%" stop-color="#FF6B4A" />
        <stop offset="100%" stop-color="#38BDF8" />
      </linearGradient>
    </defs>
    <path
      :d="hosePathD"
      fill="none"
      stroke="rgba(255,255,255,0.14)"
      stroke-width="1.35"
      stroke-linecap="round"
    />
    <path
      ref="pathRef"
      :d="hosePathD"
      fill="none"
      :stroke="hoseStrokePaint"
      stroke-width="1.75"
      stroke-linecap="round"
      :class="[
        'hoseGlow',
        'hoseFlowDash',
        'transition-[stroke-opacity]',
        'duration-300',
        hoseStrokeMotionClass,
      ]"
      :style="hoseColoredPathStyle"
    />
    <circle
      cx="78"
      cy="38"
      r="1.8"
      fill="#162232"
      stroke="rgba(255,255,255,0.15)"
      stroke-width="0.35"
      :class="nozzleDotLive ? 'hoseNozzleDot--live' : ''"
    />
  </svg>
</template>
