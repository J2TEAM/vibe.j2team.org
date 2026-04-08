<script setup lang="ts">
import { ref } from 'vue'
import type { FlightFilters } from '../composables/use-flight-filter'

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const filters = defineModel<FlightFilters>('filters', {
  default: () => ({ country: '', minAlt: 0, maxAlt: 15000, showGround: true }),
})

defineProps<{
  matchCount: number
  totalCount: number
  countries: string[]
}>()

const emit = defineEmits<{
  reset: []
}>()

const showFilters = ref(false)
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Search input -->
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm callsign hoặc ICAO24..."
          class="w-full bg-bg-surface border border-border-default px-3 py-2 pl-9
                 text-sm text-text-primary placeholder:text-text-dim
                 transition focus:border-accent-sky focus:outline-none"
        />
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      <!-- Filter toggle -->
      <button
        class="border border-border-default bg-bg-surface p-2 text-text-secondary
               transition hover:border-accent-sky hover:text-text-primary"
        :class="{ 'border-accent-sky text-accent-sky': showFilters }"
        title="Bộ lọc"
        @click="showFilters = !showFilters"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </svg>
      </button>

      <!-- Count badge -->
      <span class="text-xs text-text-dim whitespace-nowrap">
        {{ matchCount }}/{{ totalCount }}
      </span>
    </div>

    <!-- Expandable filters -->
    <div
      v-if="showFilters"
      class="flex flex-wrap gap-3 border border-border-default bg-bg-surface p-3 text-sm"
    >
      <!-- Country -->
      <div class="flex flex-col gap-1">
        <label class="text-text-dim text-xs">Quốc gia</label>
        <select
          v-model="filters.country"
          class="bg-bg-elevated border border-border-default px-2 py-1
                 text-text-primary text-xs focus:outline-none focus:border-accent-sky"
        >
          <option value="">Tất cả</option>
          <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <!-- On ground toggle -->
      <div class="flex items-end gap-2">
        <label class="flex items-center gap-1.5 text-text-secondary text-xs cursor-pointer">
          <input
            v-model="filters.showGround"
            type="checkbox"
            class="accent-accent-sky"
          />
          Trên mặt đất
        </label>
      </div>

      <!-- Altitude range -->
      <div class="flex flex-col gap-1">
        <label class="text-text-dim text-xs">Độ cao (m)</label>
        <div class="flex items-center gap-1">
          <input
            v-model.number="filters.minAlt"
            type="number"
            min="0"
            step="1000"
            class="w-20 bg-bg-elevated border border-border-default px-2 py-1
                   text-text-primary text-xs focus:outline-none focus:border-accent-sky"
          />
          <span class="text-text-dim">—</span>
          <input
            v-model.number="filters.maxAlt"
            type="number"
            min="0"
            step="1000"
            class="w-20 bg-bg-elevated border border-border-default px-2 py-1
                   text-text-primary text-xs focus:outline-none focus:border-accent-sky"
          />
        </div>
      </div>

      <!-- Reset -->
      <div class="flex items-end">
        <button
          class="text-xs text-text-dim hover:text-accent-coral transition"
          @click="emit('reset')"
        >
          Đặt lại
        </button>
      </div>
    </div>
  </div>
</template>
