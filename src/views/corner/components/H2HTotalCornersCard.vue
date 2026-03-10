<script setup lang="ts">
// Card hiển thị tổng corners theo thời gian trong các trận H2H
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { h2hForSelection, h2hSummary } = storeToRefs(store)

// Tìm max total để scale bar
const maxTotal = computed(() => {
  if (!h2hForSelection.value) return 1
  return Math.max(...h2hForSelection.value.h2hTotals.map((m) => m.homeCorners + m.awayCorners), 1)
})
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
      Tổng Phạt góc H2H
    </h2>

    <div v-if="!h2hForSelection" class="text-text-dim text-sm">
      Chọn cặp đội để xem tổng phạt góc đối đầu.
    </div>

    <div v-else>
      <!-- Summary -->
      <div
        v-if="h2hSummary"
        class="mb-3 text-xs text-text-secondary flex flex-wrap gap-x-4 gap-y-1"
      >
        <span>
          Trung bình:
          <span class="font-mono text-accent-coral">{{
            h2hSummary.avgTotalCorners.toFixed(1)
          }}</span>
        </span>
        <span> {{ h2hSummary.totalMatches }} trận </span>
      </div>

      <!-- Bar chart theo thời gian -->
      <div class="flex items-end gap-1 sm:gap-2" style="height: 120px">
        <div
          v-for="match in h2hForSelection.h2hTotals"
          :key="match.date"
          class="flex-1 flex flex-col items-center justify-end h-full"
        >
          <span class="text-[8px] font-mono text-text-dim mb-0.5">
            {{ match.homeCorners + match.awayCorners }}
          </span>
          <!-- Stacked bar: home (dưới) + away (trên) -->
          <div
            class="w-full flex flex-col justify-end transition-all duration-300"
            :style="{ height: ((match.homeCorners + match.awayCorners) / maxTotal) * 100 + '%' }"
          >
            <div
              class="w-full bg-accent-amber/70"
              :style="{
                height:
                  (match.awayCorners / (match.homeCorners + match.awayCorners || 1)) * 100 + '%',
              }"
            />
            <div
              class="w-full bg-accent-coral/70"
              :style="{
                height:
                  (match.homeCorners / (match.homeCorners + match.awayCorners || 1)) * 100 + '%',
              }"
            />
          </div>
        </div>
      </div>

      <!-- Date labels -->
      <div class="flex gap-1 sm:gap-2 mt-1.5 overflow-x-auto">
        <div
          v-for="match in h2hForSelection.h2hTotals"
          :key="'d-' + match.date"
          class="flex-1 text-center text-[7px] sm:text-[8px] text-text-dim font-mono whitespace-nowrap"
        >
          {{ match.date.slice(0, 5) }}
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 mt-2 text-[10px] text-text-secondary">
        <div class="flex items-center gap-1">
          <span class="size-2 bg-accent-coral/70" />
          <span>Sân nhà</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="size-2 bg-accent-amber/70" />
          <span>Sân khách</span>
        </div>
      </div>
    </div>
  </section>
</template>
