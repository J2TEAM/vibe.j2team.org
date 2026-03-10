<script setup lang="ts">
// Card hiển thị bar chart xác suất Over/Under theo từng ngưỡng kèo
import { storeToRefs } from 'pinia'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { h2hForSelection } = storeToRefs(store)

const thresholdKeys = store.DEFAULT_THRESHOLDS
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      Xác suất theo Ngưỡng
    </h2>

    <div v-if="!h2hForSelection" class="text-text-dim text-sm">
      Chọn cặp đội để xem xác suất theo ngưỡng.
    </div>

    <!-- Bar chart dọc -->
    <div v-else class="flex items-end justify-around gap-2 sm:gap-4" style="height: 180px">
      <div v-for="key in thresholdKeys" :key="key" class="flex flex-col items-center flex-1">
        <!-- Cặp bar -->
        <div class="flex items-end gap-1 w-full justify-center" style="height: 150px">
          <!-- Bar Over -->
          <div class="flex flex-col items-center flex-1 max-w-5 h-full justify-end">
            <span class="text-[9px] font-mono text-accent-coral mb-0.5">
              {{ (h2hForSelection.probabilityByThreshold[key].prob_over * 100).toFixed(0) }}%
            </span>
            <div
              class="w-full bg-accent-coral/80 transition-all duration-500"
              :style="{ height: h2hForSelection.probabilityByThreshold[key].prob_over * 100 + '%' }"
            />
          </div>
          <!-- Bar Under -->
          <div class="flex flex-col items-center flex-1 max-w-5 h-full justify-end">
            <span class="text-[9px] font-mono text-accent-amber mb-0.5">
              {{ (h2hForSelection.probabilityByThreshold[key].prob_under * 100).toFixed(0) }}%
            </span>
            <div
              class="w-full bg-accent-amber/80 transition-all duration-500"
              :style="{
                height: h2hForSelection.probabilityByThreshold[key].prob_under * 100 + '%',
              }"
            />
          </div>
        </div>
        <!-- Label ngưỡng -->
        <div class="mt-1.5 text-[10px] text-text-dim font-mono">T/X {{ key }}</div>
      </div>
    </div>

    <!-- Legend -->
    <div
      v-if="h2hForSelection"
      class="flex items-center gap-4 mt-3 text-[10px] text-text-secondary"
    >
      <div class="flex items-center gap-1">
        <span class="size-2 bg-accent-coral/80" />
        <span>Tài</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="size-2 bg-accent-amber/80" />
        <span>Xỉu</span>
      </div>
    </div>
  </section>
</template>
