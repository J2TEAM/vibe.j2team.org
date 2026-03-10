<script setup lang="ts">
// Card so sánh Over Rates giữa Home & Away theo từng ngưỡng
import { storeToRefs } from 'pinia'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { h2hForSelection, selectedHomeTeam, selectedAwayTeam } = storeToRefs(store)
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      So sánh Tỷ lệ Tài
    </h2>

    <div v-if="!h2hForSelection" class="text-text-dim text-sm">Chọn cặp đội để xem tỷ lệ Over.</div>

    <div v-else class="space-y-3">
      <div v-for="entry in h2hForSelection.overRates" :key="entry.threshold" class="space-y-1.5">
        <!-- Tiêu đề ngưỡng -->
        <div class="text-[11px] text-text-dim font-mono">T/X {{ entry.threshold }}</div>

        <!-- Home rate bar -->
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-accent-coral w-8 shrink-0 font-display">
            {{ selectedHomeTeam?.shortName }}
          </span>
          <div
            class="flex-1 h-4 bg-bg-elevated border border-border-default relative overflow-hidden"
          >
            <div
              class="h-full bg-accent-coral/60 transition-all duration-500"
              :style="{ width: entry.homeRate * 100 + '%' }"
            />
          </div>
          <span class="text-[10px] font-mono text-text-secondary w-10 text-right">
            {{ (entry.homeRate * 100).toFixed(0) }}%
          </span>
        </div>

        <!-- Away rate bar -->
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-accent-amber w-8 shrink-0 font-display">
            {{ selectedAwayTeam?.shortName }}
          </span>
          <div
            class="flex-1 h-4 bg-bg-elevated border border-border-default relative overflow-hidden"
          >
            <div
              class="h-full bg-accent-amber/60 transition-all duration-500"
              :style="{ width: entry.awayRate * 100 + '%' }"
            />
          </div>
          <span class="text-[10px] font-mono text-text-secondary w-10 text-right">
            {{ (entry.awayRate * 100).toFixed(0) }}%
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
