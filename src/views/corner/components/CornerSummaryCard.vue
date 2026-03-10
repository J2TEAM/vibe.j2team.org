<script setup lang="ts">
// Summary Card hợp nhất: tên đội lớn, dải O/U cards, và statistics detail
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useCornerStore } from '../store/useCornerStore'

const store = useCornerStore()
const { selectedHomeTeam, selectedAwayTeam, h2hSummary, h2hForSelection, modelInfo } =
  storeToRefs(store)

const thresholdKeys = store.DEFAULT_THRESHOLDS

// Tính confidence level dựa vào số trận H2H
const confidenceLevel = computed(() => {
  const total = h2hSummary.value?.totalMatches ?? 0
  if (total >= 10) return { label: 'Cao', color: 'text-accent-coral' }
  if (total >= 5) return { label: 'Trung bình', color: 'text-accent-amber' }
  return { label: 'Thấp', color: 'text-text-dim' }
})

// Xác định ngưỡng O/U chiếm ưu thế lớn nhất (Over > 60%)
const topThreshold = computed(() => {
  if (!h2hForSelection.value) return null
  const probs = h2hForSelection.value.probabilityByThreshold
  let best: { key: string; prob: number } | null = null
  for (const key of thresholdKeys) {
    const p = probs[key].prob_over
    if (!best || p > best.prob) best = { key, prob: p }
  }
  return best
})
</script>

<template>
  <section
    class="relative border border-border-default bg-bg-surface overflow-hidden transition-all duration-300 hover:border-accent-coral/40"
  >
    <!-- Background decorative number -->
    <span
      class="absolute top-2 right-4 font-display text-6xl sm:text-8xl font-bold text-accent-amber/5 select-none pointer-events-none"
    >
      ⚽
    </span>

    <!-- Header: tên đội phóng to -->
    <div class="p-5 sm:p-6 pb-0">
      <div
        v-if="selectedHomeTeam && selectedAwayTeam"
        class="flex flex-wrap items-baseline gap-x-3 gap-y-1"
      >
        <span class="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
          {{ selectedHomeTeam.name }}
        </span>
        <span class="font-display text-lg sm:text-xl text-text-dim font-light">vs</span>
        <span class="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
          {{ selectedAwayTeam.name }}
        </span>
      </div>
      <div v-else class="font-display text-lg text-text-dim">
        Chọn hai đội để xem dự đoán phạt góc
      </div>
    </div>

    <!-- Statistics Detail (Predicted Total, Confidence) -->
    <div v-if="h2hSummary" class="px-5 sm:px-6 pt-3 pb-4 space-y-2">
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:target" class="size-4 text-accent-coral" />
          <span class="text-text-secondary">Predicted Total Corners:</span>
          <span class="font-mono font-bold text-accent-coral text-base">
            {{ h2hSummary.avgTotalCorners.toFixed(1) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Icon icon="lucide:shield-check" class="size-4" :class="confidenceLevel.color" />
          <span class="text-text-secondary">Confidence:</span>
          <span class="font-display font-semibold" :class="confidenceLevel.color">
            {{ confidenceLevel.label }}
          </span>
          <span class="text-text-dim text-xs">({{ h2hSummary.totalMatches }} trận H2H)</span>
        </div>
      </div>
      <!-- Gợi ý best threshold -->
      <p v-if="topThreshold" class="text-xs text-text-dim leading-relaxed">
        <Icon icon="lucide:trending-up" class="size-3 inline mr-1 text-accent-coral" />
        Ngưỡng <span class="font-mono text-text-secondary">O/U {{ topThreshold.key }}</span>
        có xác suất Over cao nhất:
        <span class="font-mono text-accent-coral font-semibold">
          {{ (topThreshold.prob * 100).toFixed(0) }}%
        </span>
      </p>
    </div>

    <!-- Dải O/U cards -->
    <div v-if="h2hForSelection" class="border-t border-border-default">
      <div class="px-5 sm:px-6 pt-4 pb-2">
        <div
          class="text-[11px] text-text-dim font-display tracking-widest uppercase mb-3 flex items-center gap-1.5"
        >
          <span class="text-accent-sky">//</span>
          Over / Under Probability
        </div>
      </div>
      <div class="grid grid-cols-5 divide-x divide-border-default border-t border-border-default">
        <div
          v-for="key in thresholdKeys"
          :key="key"
          class="p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-bg-elevated/50 transition"
        >
          <!-- Label ngưỡng -->
          <div class="text-[10px] sm:text-xs text-text-dim font-mono text-center">
            O/U {{ key }}
          </div>

          <!-- Mini bars ngang -->
          <div class="w-full space-y-1">
            <!-- Over bar -->
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-mono text-accent-coral w-7 text-right">
                {{ (h2hForSelection.probabilityByThreshold[key].prob_over * 100).toFixed(0) }}%
              </span>
              <div class="flex-1 h-2 bg-bg-deep overflow-hidden">
                <div
                  class="h-full bg-accent-coral/80 transition-all duration-500"
                  :style="{
                    width: h2hForSelection.probabilityByThreshold[key].prob_over * 100 + '%',
                  }"
                />
              </div>
            </div>
            <!-- Under bar -->
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-mono text-accent-amber w-7 text-right">
                {{ (h2hForSelection.probabilityByThreshold[key].prob_under * 100).toFixed(0) }}%
              </span>
              <div class="flex-1 h-2 bg-bg-deep overflow-hidden">
                <div
                  class="h-full bg-accent-amber/80 transition-all duration-500"
                  :style="{
                    width: h2hForSelection.probabilityByThreshold[key].prob_under * 100 + '%',
                  }"
                />
              </div>
            </div>
          </div>

          <!-- Labels -->
          <div class="flex items-center gap-2 text-[8px] text-text-dim">
            <span class="flex items-center gap-0.5">
              <span class="size-1.5 bg-accent-coral/80" /> O
            </span>
            <span class="flex items-center gap-0.5">
              <span class="size-1.5 bg-accent-amber/80" /> U
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Model info footer -->
    <div
      v-if="modelInfo && h2hForSelection"
      class="px-5 sm:px-6 py-2.5 border-t border-border-default text-[10px] text-text-dim flex flex-wrap gap-x-4 gap-y-1 bg-bg-elevated/30"
    >
      <span class="inline-flex items-center gap-1">
        <Icon icon="lucide:cpu" class="size-3" />
        {{ modelInfo.type }}
      </span>
      <span class="inline-flex items-center gap-1">
        <Icon icon="lucide:layers" class="size-3" />
        {{ modelInfo.features }} features
      </span>
      <span class="inline-flex items-center gap-1">
        <Icon icon="lucide:activity" class="size-3" />
        RMSE {{ modelInfo.rmse }}
      </span>
    </div>
  </section>
</template>
