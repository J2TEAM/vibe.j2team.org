<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useGameStore } from '../stores/game'
import { useYouStore } from '../stores/you'

const gameStore = useGameStore()
const youStore = useYouStore()

const {
  gateLeftDistance,
  gateRightDistance,
  tankSpeed,
  isGateLeftDone,
  isGateRightDone,
  isTankDone,
  isTankHit,
  stage,
} = storeToRefs(gameStore)

const { maxGateLeftDistance, maxGateRightDistance, maxTankSpeed } = storeToRefs(youStore)

// When all three are "done" and we have scores, finalize
watch(
  [
    isGateLeftDone,
    isGateRightDone,
    isTankDone,
    gateLeftDistance,
    gateRightDistance,
    tankSpeed,
    isTankHit,
  ],
  () => {
    if (
      isGateLeftDone.value &&
      isGateRightDone.value &&
      isTankDone.value &&
      (gateLeftDistance.value > 0 || gateRightDistance.value > 0) &&
      isTankHit.value
    ) {
      gameStore.setIsAnimationDone(true)

      const currentScore = gateLeftDistance.value + gateRightDistance.value + tankSpeed.value
      const maxScore = maxGateLeftDistance.value + maxGateRightDistance.value + maxTankSpeed.value

      if (currentScore > maxScore) {
        youStore.setMaxGateLeftDistance(gateLeftDistance.value)
        youStore.setMaxGateRightDistance(gateRightDistance.value)
        youStore.setMaxTankSpeed(tankSpeed.value)
      }
    }
  },
)

// With simple spans there's no animation - mark "done" when value changes and conditions are met
// Use a short delay to approximate "animation finished"
const debounceMs = 150
let gateLeftTimer: ReturnType<typeof setTimeout> | null = null
let gateRightTimer: ReturnType<typeof setTimeout> | null = null
let tankTimer: ReturnType<typeof setTimeout> | null = null

watch([gateLeftDistance, stage, isTankHit], () => {
  if (gateLeftTimer) clearTimeout(gateLeftTimer)
  if (stage.value === 'playing' && isTankHit.value && gateLeftDistance.value > 0) {
    gateLeftTimer = setTimeout(() => {
      gameStore.setIsGateLeftDone(true)
      gateLeftTimer = null
    }, debounceMs)
  }
})

watch([gateRightDistance, stage, isTankHit], () => {
  if (gateRightTimer) clearTimeout(gateRightTimer)
  if (stage.value === 'playing' && isTankHit.value && gateRightDistance.value > 0) {
    gateRightTimer = setTimeout(() => {
      gameStore.setIsGateRightDone(true)
      gateRightTimer = null
    }, debounceMs)
  }
})

watch([tankSpeed, stage, isTankHit], () => {
  if (tankTimer) clearTimeout(tankTimer)
  if (stage.value === 'playing' && isTankHit.value && tankSpeed.value > 0) {
    tankTimer = setTimeout(() => {
      gameStore.setIsTankDone(true)
      tankTimer = null
    }, debounceMs)
  }
})
</script>

<template>
  <div
    class="fixed p-2 rounded grid grid-rows-3 top-6 left-3 items-start gap-2 md:top-12 md:grid md:grid-cols-[repeat(3,150px)] md:items-center md:gap-2 md:left-1/2 md:-translate-x-1/2 text-black"
  >
    <div class="flex flex-col gap-1.5 items-start md:items-center">
      <p class="text-xs md:text-sm text-black/70">Cổng trái</p>
      <p id="stats-gate-left" class="origin-top">
        <span class="text-primary text-xl md:text-2xl">{{ gateLeftDistance }}m</span>
      </p>
    </div>

    <div class="flex flex-col gap-1.5 items-start md:items-center">
      <p class="text-xs md:text-sm text-black/70">Cổng phải</p>
      <p id="stats-gate-right" class="origin-top">
        <span class="text-primary text-xl md:text-2xl">{{ gateRightDistance }}m</span>
      </p>
    </div>

    <div class="flex flex-col gap-1.5 items-start md:items-center">
      <p class="text-xs md:text-sm text-black/70">Tốc độ xe tăng</p>
      <p id="stats-tank-kph" class="origin-top">
        <span class="text-primary text-xl md:text-2xl">{{ tankSpeed }}km/h</span>
      </p>
    </div>
  </div>
</template>
