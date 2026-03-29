<script setup lang="ts">
import StationProgress from './ui/StationProgress.vue'
import StationPanel from './ui/StationPanel.vue'
import StatusPanel from './StatusPanel.vue'

defineProps<{
  progressHeroLabel: string
  progressHeroMode: 'phase' | 'percent'
  progressHeroValue: number | null
  progressHeroKey: string
  pulseHero: boolean
  stationStateLabel: string
  statusHelper?: string
  litersText: string
  totalCostText: string
  litersOdometerKey: string
  costOdometerKey: string
  showTankBar: boolean
  tankBarPercent: number
  tankBarId: string
}>()
</script>

<template>
  <div
    class="lg:w-[38%] border-b border-border-default lg:border-b-0 lg:border-r border-border-default p-4 sm:p-5 flex flex-col justify-between gap-4 sm:gap-6 bg-bg-deep/30 shrink-0"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div class="min-w-0">
        <div class="font-display text-xs tracking-widest text-accent-coral">
          {{ progressHeroLabel }}
        </div>
        <div
          v-if="progressHeroMode === 'phase'"
          :key="progressHeroKey"
          class="mt-1 font-display text-3xl sm:text-4xl font-bold text-text-secondary tabular-nums leading-none"
          aria-hidden="true"
        >
          …
        </div>
        <div
          v-else
          :key="progressHeroKey"
          class="odometerNumber mt-1 font-display text-3xl min-[400px]:text-4xl lg:text-5xl font-bold text-text-primary tabular-nums leading-none"
          :class="pulseHero ? 'progressPulse' : ''"
        >
          {{ progressHeroValue
          }}<span class="text-lg min-[400px]:text-xl sm:text-2xl text-text-secondary">%</span>
        </div>
        <div v-if="showTankBar" class="mt-4 max-w-xs">
          <StationProgress :id="tankBarId" :model-value="tankBarPercent" label="Mức bình xe" />
        </div>
      </div>
      <StatusPanel :label="stationStateLabel" :helper="statusHelper" />
    </div>

    <StationPanel>
      <div class="flex items-center justify-between gap-2 sm:gap-3 text-sm min-w-0">
        <span class="text-text-dim shrink-0">Lít</span>
        <span
          :key="litersOdometerKey"
          class="odometerNumber font-display font-bold text-accent-sky tabular-nums text-base sm:text-lg text-right truncate"
        >
          {{ litersText }} L
        </span>
      </div>
      <div class="flex items-center justify-between gap-2 sm:gap-3 text-sm min-w-0 mt-3">
        <span class="text-text-dim shrink-0">Tạm tính</span>
        <span
          :key="costOdometerKey"
          class="odometerNumber font-display font-bold text-accent-amber tabular-nums text-base sm:text-lg text-right truncate"
        >
          {{ totalCostText }}
        </span>
      </div>
    </StationPanel>

    <p class="text-xs text-text-secondary leading-relaxed">
      <span class="text-accent-amber font-display font-semibold">Lưu ý:</span>
      Web giải trí — xăng thật vẫn phải ra trạm.
    </p>
  </div>
</template>
