<script setup lang="ts">
// Card lịch sử corners gần nhất (last 10) của mỗi đội
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { h2hForSelection, selectedHomeTeam, selectedAwayTeam } = storeToRefs(store)

// Lấy dữ liệu last 10 cho home và away
const homeHistory = computed(() => {
  if (!h2hForSelection.value || !selectedHomeTeam.value) return null
  return h2hForSelection.value.cornerHistory[selectedHomeTeam.value.id] ?? null
})

const awayHistory = computed(() => {
  if (!h2hForSelection.value || !selectedAwayTeam.value) return null
  return h2hForSelection.value.cornerHistory[selectedAwayTeam.value.id] ?? null
})

// Tìm giá trị max để scale bar
const maxCorner = computed(() => {
  const homeMax = homeHistory.value ? Math.max(...homeHistory.value.last10) : 0
  const awayMax = awayHistory.value ? Math.max(...awayHistory.value.last10) : 0
  return Math.max(homeMax, awayMax, 1)
})
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
      Lịch sử Phạt góc (10 trận gần nhất)
    </h2>

    <div v-if="!homeHistory || !awayHistory" class="text-text-dim text-sm">
      Chọn cặp đội để xem lịch sử phạt góc.
    </div>

    <div v-else>
      <!-- Home team bars -->
      <div class="mb-3">
        <div class="text-[11px] text-accent-coral font-display tracking-wide mb-1.5">
          {{ selectedHomeTeam?.name }}
        </div>
        <div class="flex items-end gap-1" style="height: 60px">
          <div
            v-for="(corners, idx) in homeHistory.last10"
            :key="'h-' + idx"
            class="flex-1 flex flex-col items-center justify-end h-full"
          >
            <span class="text-[8px] font-mono text-text-dim mb-0.5">{{ corners }}</span>
            <div
              class="w-full bg-accent-coral/70 transition-all duration-300"
              :style="{
                height: (corners / maxCorner) * 100 + '%',
                minHeight: corners > 0 ? '2px' : '0',
              }"
            />
          </div>
        </div>
      </div>

      <!-- Away team bars -->
      <div>
        <div class="text-[11px] text-accent-amber font-display tracking-wide mb-1.5">
          {{ selectedAwayTeam?.name }}
        </div>
        <div class="flex items-end gap-1" style="height: 60px">
          <div
            v-for="(corners, idx) in awayHistory.last10"
            :key="'a-' + idx"
            class="flex-1 flex flex-col items-center justify-end h-full"
          >
            <span class="text-[8px] font-mono text-text-dim mb-0.5">{{ corners }}</span>
            <div
              class="w-full bg-accent-amber/70 transition-all duration-300"
              :style="{
                height: (corners / maxCorner) * 100 + '%',
                minHeight: corners > 0 ? '2px' : '0',
              }"
            />
          </div>
        </div>
      </div>

      <!-- Labels Match 1..10 -->
      <div class="flex gap-1 mt-1">
        <div
          v-for="n in homeHistory.last10.length"
          :key="n"
          class="flex-1 text-center text-[8px] text-text-dim"
        >
          {{ n }}
        </div>
      </div>
    </div>
  </section>
</template>
