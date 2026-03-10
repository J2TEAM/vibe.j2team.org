<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CornerLayoutShell from './components/CornerLayoutShell.vue'
import FixtureSelector from './components/FixtureSelector.vue'
import CornerSummaryCard from './components/CornerSummaryCard.vue'
import CornerThresholdGrid from './components/CornerThresholdGrid.vue'
import { useCornerStore } from './store/useCornerStore'

const store = useCornerStore()
const { preferences } = storeToRefs(store)
</script>

<template>
  <CornerLayoutShell>
    <section class="animate-fade-up animate-delay-3">
      <div class="grid gap-5 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <FixtureSelector />
        </div>
        <div class="flex flex-col">
          <CornerSummaryCard />
          <CornerThresholdGrid />

          <section
            class="mt-4 border border-border-default bg-bg-surface p-3 sm:p-4 text-xs text-text-dim"
          >
            <h2
              class="font-display text-sm font-semibold text-text-primary mb-2 flex items-center gap-2"
            >
              <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
              Tuỳ chỉnh hiển thị
            </h2>
            <div class="flex flex-wrap items-center gap-3">
              <label class="inline-flex items-center gap-2">
                <input
                  v-model="preferences.showAdvancedStats"
                  type="checkbox"
                  class="size-3 accent-accent-coral"
                />
                <span>Hiện chi tiết nâng cao (số lượng OVER/UNDER, edge mạnh nhất)</span>
              </label>
              <div class="flex items-center gap-2">
                <span>Ngưỡng tự tin khuyến nghị:</span>
                <input
                  v-model.number="preferences.confidenceThreshold"
                  type="number"
                  min="0.5"
                  max="0.8"
                  step="0.01"
                  class="w-20 bg-bg-elevated border border-border-default px-2 py-1 text-[11px] text-text-primary focus:border-accent-coral focus:outline-none font-mono"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  </CornerLayoutShell>
</template>
