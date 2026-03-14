<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { FlightState, BoundingBox } from '../types'
import { useFlightMap } from '../composables/use-flight-map'

const props = defineProps<{
  flights: FlightState[]
  selectedFlight: FlightState | null
  bbox: BoundingBox
}>()

const emit = defineEmits<{
  'select-flight': [flight: FlightState]
}>()

const mapEl = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const mapError = ref<string | null>(null)

const { initMap, updateMarkers, focusFlight, fitBounds, invalidateSize, cleanup } = useFlightMap()

onMounted(async () => {
  if (!mapEl.value) return
  try {
    await initMap(mapEl.value, props.bbox)
    mapReady.value = true
    // Initial markers if flights already available
    if (props.flights.length) {
      updateMarkers(props.flights, (f) => emit('select-flight', f), props.selectedFlight?.icao24)
    }
  } catch (e) {
    mapError.value = e instanceof Error ? e.message : 'Không thể tải bản đồ'
  }
})

onUnmounted(() => {
  cleanup()
})

// Update markers when flights change
watch(
  () => props.flights,
  (flights) => {
    if (mapReady.value) {
      updateMarkers(flights, (f) => emit('select-flight', f), props.selectedFlight?.icao24)
    }
  },
)

// Re-highlight when selected flight changes
watch(
  () => props.selectedFlight,
  (flight) => {
    if (!mapReady.value) return
    updateMarkers(props.flights, (f) => emit('select-flight', f), flight?.icao24)
    if (flight) focusFlight(flight)
  },
)

// Fit bounds when bbox changes
watch(
  () => props.bbox,
  (bbox) => {
    if (mapReady.value) fitBounds(bbox)
  },
)

// Expose invalidateSize for parent layout changes
defineExpose({ invalidateSize })
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Map container -->
    <div ref="mapEl" class="w-full h-full" />

    <!-- Loading state -->
    <div
      v-if="!mapReady && !mapError"
      class="absolute inset-0 flex items-center justify-center bg-bg-deep"
    >
      <div class="text-text-secondary text-sm animate-pulse">
        Đang tải bản đồ...
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="mapError"
      class="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep gap-3"
    >
      <p class="text-accent-coral text-sm">{{ mapError }}</p>
      <button
        class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary
               transition hover:border-accent-coral hover:text-text-primary"
        @click="$router.go(0)"
      >
        Thử lại
      </button>
    </div>
  </div>
</template>

<style>
/* Override Leaflet default styles to match design system */
.flight-marker {
  background: transparent !important;
  border: none !important;
}

.flight-tooltip {
  background: #162232 !important;
  color: #F0EDE6 !important;
  border: 1px solid #253549 !important;
  border-radius: 0 !important;
  font-family: 'Be Vietnam Pro', sans-serif !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3) !important;
}

.flight-tooltip::before {
  border-top-color: #253549 !important;
}

/* Hide Leaflet attribution on small screens */
@media (max-width: 640px) {
  .leaflet-control-attribution {
    display: none;
  }
}
</style>
