<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FlightState } from '../types'

const props = defineProps<{
  flights: FlightState[]
}>()

const collapsed = ref(true)

const stats = computed(() => {
  const all = props.flights
  const airborne = all.filter((f) => !f.onGround)
  const grounded = all.filter((f) => f.onGround)

  // Top countries
  const countryMap = new Map<string, number>()
  for (const f of all) {
    countryMap.set(f.originCountry, (countryMap.get(f.originCountry) ?? 0) + 1)
  }
  const topCountries = [...countryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxCountryCount = topCountries[0]?.[1] ?? 1

  // Altitude buckets (meters): 0-3k, 3k-6k, 6k-9k, 9k-12k, 12k+
  const altBuckets: number[] = [0, 0, 0, 0, 0]
  const altLabels = ['0-3km', '3-6km', '6-9km', '9-12km', '12km+']
  for (const f of airborne) {
    const alt = f.baroAltitude ?? f.geoAltitude ?? 0
    if (alt < 3000) altBuckets[0] = (altBuckets[0] ?? 0) + 1
    else if (alt < 6000) altBuckets[1] = (altBuckets[1] ?? 0) + 1
    else if (alt < 9000) altBuckets[2] = (altBuckets[2] ?? 0) + 1
    else if (alt < 12000) altBuckets[3] = (altBuckets[3] ?? 0) + 1
    else altBuckets[4] = (altBuckets[4] ?? 0) + 1
  }
  const maxAltCount = Math.max(...altBuckets, 1)

  // Average speed
  const speeds = airborne.filter((f) => f.velocity !== null).map((f) => f.velocity!)
  const avgSpeed = speeds.length ? Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 3.6) : 0

  return {
    total: all.length,
    airborne: airborne.length,
    grounded: grounded.length,
    topCountries,
    maxCountryCount,
    altBuckets,
    altLabels,
    maxAltCount,
    avgSpeed,
  }
})

/** Color cycle for bars */
const barColors = ['bg-accent-coral', 'bg-accent-amber', 'bg-accent-sky', 'bg-accent-coral/70', 'bg-accent-amber/70']
</script>

<template>
  <div class="border border-border-default bg-bg-surface/95 backdrop-blur-sm">
    <!-- Toggle header -->
    <button
      class="w-full flex items-center justify-between p-3 text-sm
             text-text-secondary hover:text-text-primary transition"
      @click="collapsed = !collapsed"
    >
      <span class="flex items-center gap-2">
        <span class="text-accent-amber font-display text-xs tracking-widest">//</span>
        <span class="font-display font-semibold">Thống kê</span>
        <span class="text-text-dim text-xs">({{ stats.total }} máy bay)</span>
      </span>
      <svg
        class="w-4 h-4 transition-transform"
        :class="{ 'rotate-180': !collapsed }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Collapsible content -->
    <div v-if="!collapsed" class="px-3 pb-3 space-y-4">
      <!-- Counts -->
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="bg-bg-elevated p-2">
          <p class="text-lg font-display font-bold text-accent-sky">{{ stats.airborne }}</p>
          <p class="text-xs text-text-dim">Đang bay</p>
        </div>
        <div class="bg-bg-elevated p-2">
          <p class="text-lg font-display font-bold text-text-dim">{{ stats.grounded }}</p>
          <p class="text-xs text-text-dim">Mặt đất</p>
        </div>
        <div class="bg-bg-elevated p-2">
          <p class="text-lg font-display font-bold text-accent-amber">{{ stats.avgSpeed }}</p>
          <p class="text-xs text-text-dim">km/h TB</p>
        </div>
      </div>

      <!-- Top countries -->
      <div v-if="stats.topCountries.length">
        <p class="text-xs text-text-dim mb-2">Top quốc gia</p>
        <div class="space-y-1.5">
          <div v-for="([country, count], i) in stats.topCountries" :key="country" class="flex items-center gap-2">
            <span class="text-xs text-text-secondary w-24 truncate">{{ country }}</span>
            <div class="flex-1 h-3 bg-bg-elevated relative">
              <div
                class="h-full transition-all duration-500"
                :class="barColors[i]"
                :style="{ width: `${(count / stats.maxCountryCount) * 100}%` }"
              />
            </div>
            <span class="text-xs text-text-dim w-6 text-right">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Altitude distribution -->
      <div v-if="stats.airborne > 0">
        <p class="text-xs text-text-dim mb-2">Phân bố độ cao</p>
        <div class="flex items-end gap-1 h-16">
          <div
            v-for="(count, i) in stats.altBuckets"
            :key="i"
            class="flex-1 flex flex-col items-center gap-0.5"
          >
            <span class="text-[10px] text-text-dim">{{ count }}</span>
            <div
              class="w-full bg-accent-sky/80 transition-all duration-500"
              :style="{ height: `${(count / stats.maxAltCount) * 100}%`, minHeight: count ? '4px' : '0' }"
            />
            <span class="text-[10px] text-text-dim">{{ stats.altLabels[i] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
