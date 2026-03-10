<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import { useCornerStore } from '../store/useCornerStore'
import type { CornerThresholdKey } from '../types'

const store = useCornerStore()
const { thresholdsForSelected, selectedThreshold, preferences } = storeToRefs(store)

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

const selectThreshold = (key: CornerThresholdKey) => {
  if (selectedThreshold.value === key) {
    store.setSelectedThreshold(null)
  } else {
    store.setSelectedThreshold(key)
  }
}
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-4 sm:p-5 mt-4 sm:mt-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
  >
    <h2 class="font-display text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      Phân rã theo ngưỡng kèo
    </h2>

    <p class="text-text-secondary text-xs mb-3">
      Xem chi tiết xác suất Over/Under, edge và khuyến nghị cho từng ngưỡng kèo góc phổ biến.
    </p>

    <div
      v-if="!thresholdsForSelected || !thresholdsForSelected.length"
      class="text-text-dim text-sm"
    >
      Chọn một trận ở danh sách bên trái để xem chi tiết ngưỡng kèo.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        v-for="entry in thresholdsForSelected"
        :key="entry.key"
        type="button"
        class="relative border border-border-default bg-bg-elevated p-3 text-left text-xs sm:text-[13px] transition hover:border-accent-coral hover:bg-bg-surface group"
        :class="selectedThreshold === entry.key ? 'border-accent-coral bg-bg-surface' : ''"
        @click="selectThreshold(entry.key)"
      >
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <div class="font-display text-[13px] text-text-primary flex items-center gap-1.5">
            <Icon icon="lucide:corner-down-right" class="size-3.5 text-accent-coral" />
            <span>O/U {{ entry.key }}</span>
          </div>
          <span
            class="font-display text-[10px] uppercase tracking-widest px-1.5 py-0.5 border"
            :class="{
              'border-accent-coral text-accent-coral bg-accent-coral/10':
                entry.detail.recommendation === 'OVER',
              'border-accent-amber text-accent-amber bg-accent-amber/10':
                entry.detail.recommendation === 'UNDER',
              'border-border-default text-text-secondary bg-bg-elevated/80':
                entry.detail.recommendation === 'NO BET',
            }"
          >
            {{ entry.detail.recommendation }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-1.5">
          <div>
            <div class="text-[10px] text-text-dim mb-0.5">P(Over)</div>
            <div class="font-mono text-[13px] text-accent-coral">
              {{ formatPercent(entry.detail.prob_over) }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-text-dim mb-0.5">P(Under)</div>
            <div class="font-mono text-[13px] text-accent-amber">
              {{ formatPercent(entry.detail.prob_under) }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-text-dim">
          <span>
            Edge:
            <span class="font-mono text-text-secondary">
              {{ formatPercent(entry.detail.edge) }}
            </span>
          </span>
          <span v-if="preferences.confidenceThreshold">
            Ngưỡng tự tin:
            <span class="font-mono">
              {{ formatPercent(preferences.confidenceThreshold) }}
            </span>
          </span>
        </div>
      </button>
    </div>
  </section>
</template>
