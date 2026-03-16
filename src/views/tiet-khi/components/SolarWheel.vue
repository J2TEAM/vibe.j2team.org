<script setup lang="ts">
import { computed } from 'vue'
import type { SolarTerm } from '../types'

const props = defineProps<{
  terms: SolarTerm[]
  activeIndex: number
}>()

const emit = defineEmits<{
  (e: 'select', index: number): void
}>()

const radius = 150
const innerRadius = 100
const centerX = 200
const centerY = 200

const segments = computed(() => {
  return props.terms.map((term, i) => {
    const angleStart = (i * 360) / 24 - 90
    const angleEnd = ((i + 1) * 360) / 24 - 90

    // Calculate path for the arc segment
    const x1 = centerX + radius * Math.cos((angleStart * Math.PI) / 180)
    const y1 = centerY + radius * Math.sin((angleStart * Math.PI) / 180)
    const x2 = centerX + radius * Math.cos((angleEnd * Math.PI) / 180)
    const y2 = centerY + radius * Math.sin((angleEnd * Math.PI) / 180)

    const xi1 = centerX + innerRadius * Math.cos((angleStart * Math.PI) / 180)
    const yi1 = centerY + innerRadius * Math.sin((angleStart * Math.PI) / 180)
    const xi2 = centerX + innerRadius * Math.cos((angleEnd * Math.PI) / 180)
    const yi2 = centerY + innerRadius * Math.sin((angleEnd * Math.PI) / 180)

    const path = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 0 1 ${x2} ${y2}
      L ${xi2} ${yi2}
      A ${innerRadius} ${innerRadius} 0 0 0 ${xi1} ${yi1}
      Z
    `

    // Label position
    const midAngle = (angleStart + angleEnd) / 2
    const tx = centerX + (radius + 25) * Math.cos((midAngle * Math.PI) / 180)
    const ty = centerY + (radius + 25) * Math.sin((midAngle * Math.PI) / 180)

    return {
      term,
      path,
      labelPos: { x: tx, y: ty },
      midAngle,
      isActive: i === props.activeIndex,
    }
  })
})
const rotationAngle = computed(() => {
  // Tính toán góc xoay sao cho tiết khí active luôn nằm ở đỉnh (12h)
  // Mỗi tiết khí chiếm 15 độ (360/24).
  // Chúng ta xoay ngược lại một lượng tương ứng với index.
  return -(props.activeIndex * 15) - 7.5
})
</script>

<template>
  <div class="relative w-[400px] h-[400px] mx-auto scale-90 md:scale-110">
    <svg viewBox="0 0 400 400" class="w-full h-full drop-shadow-[0_0_30px_rgba(255,107,74,0.1)]">
      <!-- Decorative outer ring (Fixed) -->
      <circle
        :cx="centerX"
        :cy="centerY"
        :r="radius + 10"
        fill="none"
        stroke="white"
        stroke-width="0.5"
        stroke-dasharray="2 4"
        class="opacity-10"
      />

      <!-- Rotating Wheel Content -->
      <g
        :style="{ transform: `rotate(${rotationAngle}deg)`, transformOrigin: '200px 200px' }"
        class="transition-transform duration-1000 ease-in-out"
      >
        <g
          v-for="(seg, i) in segments"
          :key="seg.term.id"
          class="cursor-pointer group"
          @click="emit('select', i)"
        >
          <path
            :d="seg.path"
            :class="[
              'transition-all duration-700 hover:opacity-100',
              seg.isActive ? 'opacity-100 stroke-accent-coral/50 stroke-1' : 'opacity-20',
            ]"
            :fill="seg.isActive ? '#ff6b4a' : 'white'"
            class="hover:scale-[1.02] transform-origin-center"
          />

          <text
            :x="seg.labelPos.x"
            :y="seg.labelPos.y"
            text-anchor="middle"
            alignment-baseline="middle"
            :class="[
              'text-[9px] font-display font-bold uppercase tracking-widest transition-all duration-700',
              seg.isActive
                ? 'fill-accent-coral scale-125'
                : 'fill-white/30 group-hover:fill-white/60',
            ]"
            :transform="`rotate(${seg.midAngle + 90}, ${seg.labelPos.x}, ${seg.labelPos.y})`"
          >
            {{ seg.term.name }}
          </text>
        </g>
      </g>

      <!-- Center Info (Fixed) -->
      <circle :cx="centerX" :cy="centerY" :r="innerRadius - 5" fill="black" class="opacity-20" />
      <g class="pointer-events-none">
        <text
          :x="centerX"
          :y="centerY - 10"
          text-anchor="middle"
          class="fill-white/20 font-display text-[10px] uppercase tracking-[0.3em]"
        >
          Tiết Mùa
        </text>
        <text
          :x="centerX"
          :y="centerY + 20"
          text-anchor="middle"
          class="fill-white/40 font-display text-2xl font-black tracking-widest"
        >
          {{ terms[activeIndex]?.season.toUpperCase() }}
        </text>
      </g>
    </svg>

    <!-- Pulse Effect for Active Term -->
    <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div class="w-48 h-48 rounded-full border border-accent-coral/20 animate-ping"></div>
    </div>
  </div>
</template>

<style scoped>
.transform-origin-center {
  transform-origin: 200px 200px;
}
</style>
