<script setup lang="ts">
import type { FlightState, UnitSystem } from '../types'
import { POSITION_SOURCES } from '../types'
import {
  formatAltitude,
  formatSpeed,
  formatVerticalRate,
  formatHeading,
  formatTimestamp,
  getFlightColorClass,
} from '../utils/flight-format-helpers'

defineProps<{
  flight: FlightState | null
  unit: UnitSystem
}>()

const emit = defineEmits<{
  close: []
  'toggle-unit': []
}>()
</script>

<template>
  <!-- Overlay backdrop on mobile -->
  <Transition name="fade">
    <div
      v-if="flight"
      class="fixed inset-0 bg-black/40 z-1001 md:hidden"
      @click="emit('close')"
    />
  </Transition>

  <!-- Panel -->
  <Transition name="slide">
    <div
      v-if="flight"
      class="fixed z-1001 bg-bg-surface border border-border-default
             bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto
             md:top-0 md:right-0 md:bottom-0 md:left-auto md:max-h-none md:w-80 md:overflow-y-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-border-default">
        <div>
          <h3 class="font-display text-lg font-semibold text-text-primary">
            {{ flight.callsign || flight.icao24 }}
          </h3>
          <p class="text-xs text-text-secondary">{{ flight.originCountry }}</p>
        </div>
        <button
          class="text-text-dim hover:text-text-primary transition p-1"
          @click="emit('close')"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4 text-sm">
        <!-- Status indicator -->
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full"
            :class="flight.onGround ? 'bg-text-dim' : 'bg-accent-sky animate-pulse'"
          />
          <span :class="getFlightColorClass(flight.verticalRate, flight.onGround)">
            {{ flight.onGround ? 'Trên mặt đất' : 'Đang bay' }}
          </span>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 gap-3">
          <!-- ICAO24 -->
          <div>
            <p class="text-text-dim text-xs">ICAO24</p>
            <p class="text-text-primary font-mono">{{ flight.icao24 }}</p>
          </div>

          <!-- Squawk -->
          <div>
            <p class="text-text-dim text-xs">Squawk</p>
            <p class="text-text-primary font-mono">{{ flight.squawk ?? 'N/A' }}</p>
          </div>

          <!-- Baro Altitude -->
          <div>
            <p class="text-text-dim text-xs">Độ cao (baro)</p>
            <p class="text-text-primary">{{ formatAltitude(flight.baroAltitude, unit) }}</p>
          </div>

          <!-- Geo Altitude -->
          <div>
            <p class="text-text-dim text-xs">Độ cao (geo)</p>
            <p class="text-text-primary">{{ formatAltitude(flight.geoAltitude, unit) }}</p>
          </div>

          <!-- Speed -->
          <div>
            <p class="text-text-dim text-xs">Tốc độ</p>
            <p class="text-text-primary">{{ formatSpeed(flight.velocity, unit) }}</p>
          </div>

          <!-- Vertical Rate -->
          <div>
            <p class="text-text-dim text-xs">Tốc độ thẳng đứng</p>
            <p :class="getFlightColorClass(flight.verticalRate, flight.onGround)">
              {{ formatVerticalRate(flight.verticalRate, unit) }}
            </p>
          </div>

          <!-- Heading -->
          <div>
            <p class="text-text-dim text-xs">Hướng bay</p>
            <p class="text-text-primary">{{ formatHeading(flight.trueTrack) }}</p>
          </div>

          <!-- Position Source -->
          <div>
            <p class="text-text-dim text-xs">Nguồn</p>
            <p class="text-text-primary">{{ POSITION_SOURCES[flight.positionSource] ?? 'N/A' }}</p>
          </div>

          <!-- Position -->
          <div class="col-span-2">
            <p class="text-text-dim text-xs">Vị trí</p>
            <p class="text-text-primary font-mono text-xs">
              {{ flight.latitude?.toFixed(4) ?? 'N/A' }}, {{ flight.longitude?.toFixed(4) ?? 'N/A' }}
            </p>
          </div>

          <!-- Last Contact -->
          <div class="col-span-2">
            <p class="text-text-dim text-xs">Liên lạc cuối</p>
            <p class="text-text-primary">{{ formatTimestamp(flight.lastContact) }}</p>
          </div>
        </div>

        <!-- Unit toggle -->
        <button
          class="w-full border border-border-default bg-bg-elevated px-3 py-2
                 text-xs text-text-secondary transition
                 hover:border-accent-sky hover:text-text-primary"
          @click="emit('toggle-unit')"
        >
          {{ unit === 'metric' ? 'Chuyển sang ft/kts' : 'Chuyển sang m/km/h' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

/* Mobile: slide up from bottom */
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(100%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
