<template>
  <div
    class="relative min-h-[160px] flex flex-col items-center justify-center transition-all duration-300 border aspect-square group"
    :class="
      plot.isUnlocked
        ? 'bg-bg-surface border-border-default cursor-pointer hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5'
        : 'bg-bg-deep border-border-default border-dashed opacity-70'
    "
    @click="handlePlotClick"
  >
    <div
      v-if="plot.seedId && seedInfo"
      class="absolute -top-12 left-1/2 -translate-x-1/2 bg-bg-elevated text-text-primary px-3 py-2 border border-border-default min-w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:-translate-y-2 transition-all duration-300 z-[100] pointer-events-none shadow-xl flex flex-col items-center"
    >
      <span
        class="text-accent-amber mb-1.5 flex items-center gap-1.5 text-sm font-display font-bold"
      >
        <Icon :icon="seedInfo.icon" /> {{ seedInfo.name }}
      </span>
      <div
        class="flex justify-between w-full gap-4 text-xs bg-bg-deep px-2.5 py-1 border border-border-default"
      >
        <span
          class="flex items-center gap-1 font-display tracking-widest"
          :class="{
            'text-accent-sky': needsWater,
            'text-accent-amber': isReady,
            'text-accent-coral': plot.hasBug,
            'text-text-primary': !needsWater && !isReady && !plot.hasBug,
          }"
        >
          <Icon
            :icon="
              plot.hasBug
                ? 'twemoji:bug'
                : isReady
                  ? 'twemoji:sparkles'
                  : needsWater
                    ? 'twemoji:droplet'
                    : 'twemoji:seedling'
            "
          />
          {{ remainingTimeText }}
        </span>
        <span class="text-text-primary flex items-center gap-1 font-display"
          >+{{ seedInfo.reward }} <Icon icon="twemoji:coin"
        /></span>
      </div>
      <div
        class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-bg-elevated rotate-45 border-b border-r border-border-default"
      ></div>
    </div>

    <div
      v-if="!plot.isUnlocked"
      class="text-center flex flex-col items-center gap-3 z-10 w-full px-4"
    >
      <Icon icon="twemoji:locked" class="text-4xl opacity-50" />
      <button
        @click.stop="unlockPlot(plot.id)"
        class="flex items-center justify-center gap-1.5 border border-border-default bg-bg-surface text-text-primary font-display tracking-widest text-xs px-2 py-2 w-full transition-all hover:border-accent-coral hover:text-accent-coral hover:bg-bg-elevated"
      >
        MUA {{ plot.unlockCost }} <Icon icon="twemoji:coin" class="text-sm" />
      </button>
    </div>

    <template v-else>
      <div v-if="!plot.seedId" class="text-center flex flex-col items-center gap-2 z-10">
        <Icon
          icon="twemoji:potted-plant"
          class="text-6xl opacity-30 group-hover:opacity-50 transition-all group-hover:scale-110"
        />
        <p class="text-text-dim font-display tracking-widest text-[10px] uppercase">Đất trống</p>
      </div>

      <div v-else class="flex flex-col items-center w-full z-10 px-4 relative">
        <div
          v-if="plot.hasBug"
          @click.stop="smashBug($event, plot.id)"
          class="absolute inset-0 flex items-center justify-center z-50 cursor-pointer bg-bg-deep/50 backdrop-blur-[1px]"
        >
          <Icon icon="twemoji:bug" class="text-7xl animate-bounce" />
          <div
            class="absolute -bottom-5 bg-accent-coral text-bg-deep font-display tracking-widest font-bold text-[10px] px-2 py-1 animate-pulse"
          >
            ĐẬP SÂU!
          </div>
        </div>

        <Icon
          v-if="seedInfo"
          :icon="seedInfo.icon"
          class="text-6xl mb-4 transition-all duration-500"
          :class="{
            'opacity-60 scale-75 grayscale-[50%]': (!needsWater && !isReady) || plot.hasBug,
            'scale-110 animate-pulse': (needsWater || isReady) && !plot.hasBug,
            'blur-[2px]': plot.hasBug,
          }"
        />

        <div
          class="w-full bg-bg-deep h-1.5 mb-4 border border-border-default"
          :class="{ 'opacity-20': plot.hasBug }"
        >
          <div
            class="h-full transition-all duration-1000 ease-linear"
            :class="needsWater ? 'bg-accent-sky' : isReady ? 'bg-accent-amber' : 'bg-accent-coral'"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div v-if="!plot.hasBug">
          <div v-if="needsWater" class="absolute -bottom-5">
            <button
              class="border border-border-default bg-bg-surface px-4 py-2 font-display text-[10px] uppercase tracking-widest text-accent-sky hover:border-accent-sky transition-colors active:scale-95"
            >
              Tưới Nước
            </button>
          </div>
          <div v-else-if="isReady" class="absolute -bottom-5">
            <button
              class="border border-border-default bg-bg-surface px-4 py-2 font-display text-[10px] uppercase tracking-widest text-accent-amber hover:border-accent-amber transition-colors active:scale-95"
            >
              Thu Hoạch
            </button>
          </div>
          <div
            v-else
            class="text-[9px] font-display tracking-widest text-text-secondary bg-bg-deep px-3 py-1 border border-border-default"
          >
            {{ plot.watered ? 'ĐANG RA QUẢ' : 'ĐANG LỚN' }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useFarm } from '../composables/useFarm'
import type { Plot } from '../types'

const props = defineProps<{ plot: Plot }>()
const {
  now,
  selectedSeed,
  getActualSeedInfo,
  unlockPlot,
  showToast,
  plantSeed,
  waterPlot,
  harvestPlot,
  smashBug,
} = useFarm()

const seedInfo = computed(() => getActualSeedInfo(props.plot.seedId))
const elapsedSeconds = computed(() =>
  props.plot.plantedAt ? Math.max(0, (now.value - props.plot.plantedAt) / 1000) : 0,
)

const progress = computed(() => {
  if (!props.plot.seedId || !seedInfo.value || seedInfo.value.growTime <= 0) return 0
  const pct = (elapsedSeconds.value / seedInfo.value.growTime) * 100
  return props.plot.watered ? Math.min(pct, 100) : Math.min(pct, 50)
})

const needsWater = computed(() => props.plot.seedId && !props.plot.watered && progress.value >= 50)
const isReady = computed(() => props.plot.seedId && props.plot.watered && progress.value >= 100)

const remainingTimeText = computed(() => {
  if (!props.plot.seedId || !seedInfo.value) return ''
  if (props.plot.hasBug) return 'Bị sâu ăn'
  if (isReady.value) return 'Đã chín'
  if (needsWater.value) return 'Cần nước'

  const targetTime = props.plot.watered ? seedInfo.value.growTime : seedInfo.value.growTime / 2
  const remainingSeconds = Math.max(0, Math.ceil(targetTime - elapsedSeconds.value))

  if (remainingSeconds <= 0) return '0s'
  const h = Math.floor(remainingSeconds / 3600)
  const m = Math.floor((remainingSeconds % 3600) / 60)
  const s = remainingSeconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
})

const handlePlotClick = (e: MouseEvent) => {
  if (!props.plot.isUnlocked || props.plot.hasBug) return
  if (!props.plot.seedId) {
    if (!selectedSeed.value) return showToast('Hãy chọn hạt giống!', 'error')
    plantSeed(props.plot.id, selectedSeed.value)
  } else if (needsWater.value) {
    waterPlot(props.plot.id)
  } else if (isReady.value) {
    harvestPlot(props.plot.id, e)
  }
}
</script>
