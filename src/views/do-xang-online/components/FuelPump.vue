<script setup lang="ts">
import { ref } from 'vue'
import type { DropSeed } from '../types'

defineProps<{
  islandStyle: Record<string, string | number>
  pumpVibrate: boolean
  spiralPathD: string
  spiralLength: number
  spiralDashOffset: number
  spiralMeterPercent: number
  nozzleGlow: boolean
  showNozzleStream: boolean
  showDrops: boolean
  dropSeeds: DropSeed[]
}>()

const spiralPathRef = ref<SVGPathElement | null>(null)
defineExpose({ spiralPathRef })
</script>

<template>
  <div
    class="pumpIsland sceneSeqLayer absolute right-[5%] sm:right-[7%] bottom-6 w-[32%] max-w-[158px] z-[5] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
    :style="islandStyle"
    :class="pumpVibrate ? 'pumpVibrate' : ''"
  >
    <div
      class="relative mx-auto w-[72%] min-h-[158px] h-auto pb-2 border border-border-default bg-gradient-to-b from-bg-elevated to-bg-surface shadow-[0_16px_0_rgba(0,0,0,0.25)]"
    >
      <div
        class="absolute inset-x-2 top-2 h-12 border border-border-default bg-bg-deep/80 flex items-center justify-center overflow-hidden"
      >
        <svg class="spiralFace" width="76" height="44" viewBox="0 0 48 48">
          <defs>
            <linearGradient id="pumpSpiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFB830" />
              <stop offset="55%" stop-color="#FF6B4A" />
              <stop offset="100%" stop-color="#38BDF8" />
            </linearGradient>
          </defs>
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            stroke-width="1"
          />
          <path
            ref="spiralPathRef"
            :d="spiralPathD"
            fill="none"
            stroke="rgba(255,184,48,0.22)"
            stroke-width="1.4"
            stroke-linecap="round"
          />
          <path
            :d="spiralPathD"
            fill="none"
            stroke="url(#pumpSpiralGrad)"
            stroke-width="1.75"
            stroke-linecap="round"
            :style="{
              strokeDasharray: spiralLength,
              strokeDashoffset: spiralDashOffset,
              opacity: spiralMeterPercent > 0.5 ? 0.95 : 0,
            }"
          />
        </svg>
      </div>
      <div
        class="absolute left-1/2 top-16 -translate-x-1/2 w-14 h-20 border border-border-default bg-bg-surface"
      >
        <div
          class="absolute left-1/2 top-2 -translate-x-1/2 w-8 h-12 border border-border-default bg-bg-elevated flex items-start justify-center pt-1"
        >
          <div
            class="w-6 h-7 border border-border-default bg-accent-coral/15"
            :class="nozzleGlow ? 'nozzleGlow' : ''"
          />
        </div>
        <div v-if="showNozzleStream" class="nozzleStream nozzleStream--scene" />
      </div>
      <div
        class="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-bg-elevated border border-t border-border-default"
      />
    </div>
    <template v-if="showDrops">
      <div
        v-for="d in dropSeeds"
        :key="d.key"
        class="drop drop--scene"
        :style="{
          left: `${d.left}%`,
          animationDelay: `${d.delay}s`,
          animationDuration: `${d.duration}s`,
        }"
      />
    </template>
  </div>
</template>
