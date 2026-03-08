<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  hours: number
  minutes: number
  seconds: number
  date: string
}>()

const hourAngle = computed(() => ((props.hours % 12) / 12) * 360 + (props.minutes / 60) * 30)
const minuteAngle = computed(() => (props.minutes / 60) * 360 + (props.seconds / 60) * 6)
const secondAngle = computed(() => (props.seconds / 60) * 360)

const hourMarkers = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 360
  const rad = (angle * Math.PI) / 180
  const isMain = i % 3 === 0
  return {
    x1: 100 + Math.sin(rad) * (isMain ? 78 : 82),
    y1: 100 - Math.cos(rad) * (isMain ? 78 : 82),
    x2: 100 + Math.sin(rad) * 88,
    y2: 100 - Math.cos(rad) * 88,
    isMain,
  }
})

const minuteMarkers = Array.from({ length: 60 }, (_, i) => {
  if (i % 5 === 0) return null
  const angle = (i / 60) * 360
  const rad = (angle * Math.PI) / 180
  return {
    x1: 100 + Math.sin(rad) * 85,
    y1: 100 - Math.cos(rad) * 85,
    x2: 100 + Math.sin(rad) * 88,
    y2: 100 - Math.cos(rad) * 88,
  }
}).filter(Boolean)
</script>

<template>
  <div class="text-center">
    <svg
      viewBox="0 0 200 200"
      class="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] mx-auto"
    >
      <!-- Face -->
      <circle cx="100" cy="100" r="92" fill="none" stroke="#253549" stroke-width="1.5" />
      <circle cx="100" cy="100" r="91" fill="#162232" />

      <!-- Minute ticks -->
      <line
        v-for="(m, i) in minuteMarkers"
        :key="'m' + i"
        :x1="m!.x1"
        :y1="m!.y1"
        :x2="m!.x2"
        :y2="m!.y2"
        stroke="#4A6180"
        stroke-width="0.5"
      />

      <!-- Hour markers -->
      <line
        v-for="(marker, i) in hourMarkers"
        :key="'h' + i"
        :x1="marker.x1"
        :y1="marker.y1"
        :x2="marker.x2"
        :y2="marker.y2"
        :stroke="marker.isMain ? '#FF6B4A' : '#8B9DB5'"
        :stroke-width="marker.isMain ? 2.5 : 1"
        stroke-linecap="butt"
      />

      <!-- Hour hand -->
      <g class="clock-hand" :style="{ transform: `rotate(${hourAngle}deg)` }">
        <line
          x1="100"
          y1="105"
          x2="100"
          y2="50"
          stroke="#F0EDE6"
          stroke-width="3.5"
          stroke-linecap="butt"
        />
      </g>

      <!-- Minute hand -->
      <g class="clock-hand" :style="{ transform: `rotate(${minuteAngle}deg)` }">
        <line
          x1="100"
          y1="105"
          x2="100"
          y2="32"
          stroke="#F0EDE6"
          stroke-width="2"
          stroke-linecap="butt"
        />
      </g>

      <!-- Second hand -->
      <g class="clock-hand" :style="{ transform: `rotate(${secondAngle}deg)` }">
        <line
          x1="100"
          y1="115"
          x2="100"
          y2="24"
          stroke="#FF6B4A"
          stroke-width="1"
          stroke-linecap="butt"
        />
        <circle cx="100" cy="115" r="2.5" fill="#FF6B4A" />
      </g>

      <!-- Center dot -->
      <circle cx="100" cy="100" r="3.5" fill="#FF6B4A" />
      <circle cx="100" cy="100" r="1.5" fill="#0F1923" />
    </svg>

    <p class="mt-6 text-text-secondary text-sm sm:text-base font-display tracking-widest uppercase">
      {{ date }}
    </p>
  </div>
</template>

<style scoped>
.clock-hand {
  transform-origin: 100px 100px;
  will-change: transform;
}
</style>
