<template>
  <div
    class="relative rounded-3xl min-h-[160px] flex flex-col items-center justify-center transition-all duration-300 shadow-xl border-4 group aspect-square"
    :class="
      plot.isUnlocked
        ? 'bg-[#a0522d] border-[#8b4513] hover:brightness-110 cursor-pointer'
        : 'bg-[#d2b48c] border-[#b08d6a]'
    "
    @click="handlePlotClick"
  >
    <div
      v-if="!plot.isUnlocked"
      class="text-center flex flex-col items-center gap-3 z-10 w-full px-3"
    >
      <Icon icon="twemoji:locked" class="text-4xl opacity-50" />
      <button
        @click.stop="handleBuyClick"
        class="bg-green-500 hover:bg-green-400 text-white font-black text-sm px-3 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 w-full transition-transform active:scale-95 border-b-4 border-green-700 hover:border-green-600"
      >
        Mua {{ plot.unlockCost }} <Icon icon="twemoji:coin" class="text-lg" />
      </button>
    </div>

    <template v-else>
      <div v-if="!plot.seedId" class="text-center flex flex-col items-center gap-2 z-10">
        <Icon
          icon="twemoji:potted-plant"
          class="text-6xl opacity-40 group-hover:opacity-60 transition-opacity"
        />
        <p class="text-yellow-100 font-bold mb-1">Đất trống</p>
      </div>

      <div v-else class="flex flex-col items-center w-full z-10 px-4 relative">
        <div
          v-if="plot.hasBug"
          @click.stop="smashBug($event, plot.id)"
          class="absolute inset-0 flex items-center justify-center z-50 cursor-pointer hover:scale-110 transition-transform bg-black/20 rounded-xl backdrop-blur-[1px]"
        >
          <Icon
            icon="twemoji:bug"
            class="text-7xl animate-bounce drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"
          />
        </div>

        <Icon
          :icon="seedInfo?.icon || ''"
          class="text-6xl mb-4 transition-all duration-500"
          :class="{
            'opacity-60 scale-75 grayscale-[50%]': (!needsWater && !isReady) || plot.hasBug,
            'scale-110 animate-pulse drop-shadow-lg': (needsWater || isReady) && !plot.hasBug,
            'blur-sm': plot.hasBug,
          }"
        />

        <div
          class="w-full bg-black/40 rounded-full h-3 mb-4 overflow-hidden shadow-inner border border-black/20"
          :class="{ 'opacity-30': plot.hasBug }"
        >
          <div
            class="h-full transition-all duration-1000 ease-linear"
            :class="needsWater ? 'bg-blue-400' : isReady ? 'bg-yellow-400' : 'bg-green-400'"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div v-if="plot.hasBug" class="absolute -bottom-4 z-50">
          <span
            class="bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg border-2 border-white animate-pulse"
          >
            BỊ SÂU ĂN!
          </span>
        </div>
        <div v-else-if="needsWater" class="absolute -bottom-4">
          <button
            class="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-blue-500 animate-bounce border-2 border-white"
          >
            <Icon icon="twemoji:droplet" /> Tưới
          </button>
        </div>
        <div v-else-if="isReady" class="absolute -bottom-4">
          <button
            class="bg-yellow-400 text-yellow-950 font-black text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-yellow-300 animate-bounce border-2 border-white"
          >
            <Icon icon="twemoji:sparkles" /> Thu hoạch
          </button>
        </div>
        <div v-else class="text-xs text-white/95 font-medium bg-black/40 px-3 py-1 rounded-full">
          {{ plot.watered ? 'Đang ra quả...' : 'Đang lớn...' }}
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
  coins,
  getActualSeedInfo,
  unlockPlot,
  showToast,
  harvestCrop,
  trackAction,
  smashBug,
} = useFarm()

const seedInfo = computed(() => getActualSeedInfo(props.plot.seedId))
const elapsedSeconds = computed(() => {
  if (!props.plot.plantedAt) return 0
  return (now.value - props.plot.plantedAt) / 1000
})
const halfTime = computed(() => (seedInfo.value ? seedInfo.value.growTime / 2 : 0))

const needsWater = computed(() => {
  if (!props.plot.seedId || props.plot.watered || !seedInfo.value) return false
  return elapsedSeconds.value >= halfTime.value
})

const isReady = computed(() => {
  if (!props.plot.seedId || !props.plot.watered || !seedInfo.value) return false
  return elapsedSeconds.value >= seedInfo.value.growTime
})

const progress = computed(() => {
  if (!props.plot.seedId || !seedInfo.value) return 0
  if (!props.plot.watered) {
    return Math.min((elapsedSeconds.value / seedInfo.value.growTime) * 100, 50)
  } else {
    return Math.min((elapsedSeconds.value / seedInfo.value.growTime) * 100, 100)
  }
})

const handleBuyClick = () => {
  unlockPlot(props.plot.id)
}

const handlePlotClick = (e: MouseEvent) => {
  const p = props.plot
  if (!p.isUnlocked) return
  if (p.hasBug) {
    showToast('Cây bị sâu ăn rồi, mau đập sâu đi!', 'error')
    return
  }

  if (!p.seedId) {
    if (!selectedSeed.value) return showToast('Tiền bối hãy chọn hạt giống trước!', 'error')
    if (coins.value >= selectedSeed.value.cost) {
      coins.value -= selectedSeed.value.cost
      p.seedId = selectedSeed.value.id
      p.plantedAt = Date.now()
      p.watered = false
    } else {
      showToast('Tiền ít mà đòi hít hạt giống thơm à?', 'error')
    }
    return
  }

  if (needsWater.value) {
    p.watered = true
    p.plantedAt = Date.now() - halfTime.value * 1000
    trackAction('water', 1)
  } else if (isReady.value) {
    harvestCrop(e, seedInfo.value!.reward, p.seedId)
    p.seedId = null
    p.plantedAt = null
    p.watered = false
  }
}
</script>
