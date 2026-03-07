<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { FlightState, UnitSystem } from './types'
import { REGIONS } from './types'
import { useFlightData } from './composables/use-flight-data'
import { useFlightFilter } from './composables/use-flight-filter'
import { formatTimestamp } from './utils/flight-format-helpers'
import FlightMapContainer from './components/flight-map-container.vue'
import FlightSearchBar from './components/flight-search-bar.vue'
import FlightDetailsPanel from './components/flight-details-panel.vue'
import FlightStatsDashboard from './components/flight-stats-dashboard.vue'

// Data layer
const {
  flights,
  loading,
  error,
  lastUpdated,
  fromCache,
  dailyCreditsUsed,
  countdown,
  selectedRegion,
  refresh,
} = useFlightData()

// Filter layer
const {
  searchQuery,
  filters,
  filteredFlights,
  matchCount,
  availableCountries,
  resetFilters,
} = useFlightFilter(flights)

// UI state
const selectedFlight = ref<FlightState | null>(null)
const unit = ref<UnitSystem>('metric')

function selectFlight(flight: FlightState) {
  selectedFlight.value = flight
}

function toggleUnit() {
  unit.value = unit.value === 'metric' ? 'aviation' : 'metric'
}
</script>

<template>
  <div class="h-screen w-screen bg-bg-deep text-text-primary font-body flex flex-col overflow-hidden">
    <!-- Map (fills remaining space) -->
    <div class="flex-1 relative">
      <FlightMapContainer
        :flights="filteredFlights"
        :selected-flight="selectedFlight"
        :bbox="selectedRegion.bbox"
        @select-flight="selectFlight"
      />

      <!-- Top overlay: back + title + search + controls -->
      <div class="absolute top-0 left-0 right-0 z-1001 p-3 flex flex-col gap-2">
        <!-- Row 1: Back + Title + Region + Refresh -->
        <div class="flex items-center gap-2 flex-wrap">
          <RouterLink
            to="/"
            class="border border-border-default bg-bg-surface/90 backdrop-blur-sm
                   px-3 py-1.5 text-xs text-text-secondary
                   transition hover:border-accent-coral hover:text-text-primary
                   flex items-center gap-1 shrink-0"
          >
            &larr; Trang chủ
          </RouterLink>

          <h1 class="font-display text-sm font-semibold text-text-primary shrink-0">
            Flight Tracker
          </h1>

          <div class="flex-1" />

          <!-- Region selector -->
          <select
            v-model="selectedRegion"
            class="bg-bg-surface/90 backdrop-blur-sm border border-border-default
                   px-2 py-1.5 text-xs text-text-primary
                   focus:outline-none focus:border-accent-sky shrink-0"
          >
            <option v-for="r in REGIONS" :key="r.name" :value="r">
              {{ r.label }}
            </option>
          </select>

          <!-- Refresh button -->
          <button
            class="border border-border-default bg-bg-surface/90 backdrop-blur-sm
                   px-3 py-1.5 text-xs text-text-secondary
                   transition hover:border-accent-sky hover:text-text-primary
                   flex items-center gap-1.5 shrink-0"
            :disabled="loading"
            @click="refresh"
          >
            <svg
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': loading }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            {{ countdown }}s
          </button>
        </div>

        <!-- Row 2: Search bar -->
        <div class="max-w-md">
          <FlightSearchBar
            v-model:search-query="searchQuery"
            v-model:filters="filters"
            :match-count="matchCount"
            :total-count="flights.length"
            :countries="availableCountries"
            @reset="resetFilters"
          />
        </div>
      </div>

      <!-- Bottom-left: Stats dashboard -->
      <div class="absolute bottom-12 left-3 z-1001 w-72 hidden md:block">
        <FlightStatsDashboard :flights="filteredFlights" />
      </div>

      <!-- Mobile stats (bottom) -->
      <div class="absolute bottom-12 left-3 right-3 z-1001 md:hidden">
        <FlightStatsDashboard :flights="filteredFlights" />
      </div>

      <!-- Status bar -->
      <div
        class="absolute bottom-0 left-0 right-0 z-1001 flex items-center justify-center gap-3
               bg-bg-deep/80 backdrop-blur-sm px-3 py-1.5 text-[11px] text-text-dim"
      >
        <span v-if="lastUpdated">
          Cập nhật: {{ formatTimestamp(lastUpdated) }}
        </span>
        <span v-if="fromCache" class="text-accent-amber">
          (cache)
        </span>
        <span>
          Credits: ~{{ dailyCreditsUsed }}/400
        </span>
        <span v-if="error" class="text-accent-coral">
          {{ error }}
        </span>
      </div>
    </div>

    <!-- Flight details panel (fixed position, handled internally) -->
    <FlightDetailsPanel
      :flight="selectedFlight"
      :unit="unit"
      @close="selectedFlight = null"
      @toggle-unit="toggleUnit"
    />
  </div>
</template>
