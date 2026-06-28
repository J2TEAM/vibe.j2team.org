<script setup lang="ts">
import { computed } from 'vue'
import type { VehicleOption } from '../types'

const props = defineProps<{
  vehicle: VehicleOption
  canPump: boolean
  vehicleImageSrc: string
  isCar: boolean
  parkingProgress01: number
  prefersReducedMotion: boolean
}>()

/** Trước khi đậu: đẩy xe ra ngoài mép trái (responsive: % theo khung xe + vw). */
const parkingTransform = computed(() => {
  const p = Math.max(0, Math.min(1, props.parkingProgress01))
  const t = 1 - p
  if (props.prefersReducedMotion) {
    if (p >= 1) return 'translate3d(0, 0, 0)'
    return 'translate3d(calc(-100% - min(36vw, 10rem)), 0, 0)'
  }
  return `translate3d(calc(${t * -100}% + ${t * -36}vw), 0, 0)`
})
</script>

<template>
  <div
    class="vehicleSlot absolute bottom-6 origin-bottom z-[3] will-change-transform"
    :class="
      isCar
        ? 'left-[1%] sm:left-[2%] w-[58%] max-w-[320px] min-h-[100px] sm:min-h-[120px] scale-[0.92] sm:scale-100'
        : 'left-[2%] sm:left-[4%] w-[46%] max-w-[240px] min-h-[88px] sm:min-h-[104px] scale-95 sm:scale-100'
    "
    :style="{ transform: parkingTransform }"
  >
    <img
      :key="`${vehicle.id}-${vehicle.bodyType}-${vehicleImageSrc}`"
      :src="vehicleImageSrc"
      :alt="`Minh họa ${isCar ? 'ô tô' : 'xe máy'} ${vehicle.modelLine}, đời ${vehicle.yearLabel}`"
      class="w-full h-auto min-h-[5rem] object-contain select-none pointer-events-none drop-shadow-[0_14px_36px_rgba(0,0,0,0.5)] transition-opacity duration-300"
      :class="canPump ? 'opacity-100' : 'opacity-40'"
      :width="isCar ? 360 : 260"
      :height="isCar ? 160 : 120"
      :loading="canPump ? 'eager' : 'lazy'"
      decoding="async"
    />
  </div>
</template>
