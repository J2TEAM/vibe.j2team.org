<template>
  <div
    class="relative rounded-[2rem] min-h-[160px] flex flex-col items-center justify-center transition-all duration-300 shadow-xl border-4 group aspect-square"
    :class="
      plot.isUnlocked
        ? 'bg-[#a0522d] border-[#8b4513] hover:brightness-110 cursor-pointer shadow-[inset_0_-8px_0_rgba(0,0,0,0.1)]'
        : 'bg-[#d2b48c] border-[#b08d6a] shadow-[inset_0_-8px_0_rgba(0,0,0,0.05)]'
    "
    @click="handlePlotClick"
  >
    <div
      v-if="plot.seedId && seedInfo"
      class="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-2.5 rounded-xl font-black min-w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:-translate-y-2 transition-all duration-300 z-[100] pointer-events-none shadow-2xl flex flex-col items-center border-2 border-white/20"
    >
      <span class="text-yellow-400 mb-1.5 flex items-center gap-1.5 text-sm drop-shadow-md">
        <Icon :icon="seedInfo.icon" /> {{ seedInfo.name }}
      </span>
      <div
        class="flex justify-between w-full gap-4 text-xs bg-black/40 px-2.5 py-1 rounded-lg shadow-inner"
      >
        <span
          class="flex items-center gap-1"
          :class="{
            'text-blue-400': needsWater,
            'text-yellow-400': isReady,
            'text-red-400': plot.hasBug,
            'text-green-400': !needsWater && !isReady && !plot.hasBug,
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
        <span class="text-yellow-300 flex items-center gap-1"
          >+{{ seedInfo.reward }} <Icon icon="twemoji:coin"
        /></span>
      </div>
      <div
        class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-b-2 border-r-2 border-white/20"
      ></div>
    </div>

    <div
      v-if="!plot.isUnlocked"
      class="text-center flex flex-col items-center gap-3 z-10 w-full px-3"
    >
      <Icon icon="twemoji:locked" class="text-4xl opacity-50" />
      <button
        @click.stop="unlockPlot(plot.id)"
        class="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-400 text-white font-black text-sm px-2 py-2 rounded-xl shadow-lg w-full transition-all active:scale-90 border-b-4 border-green-700"
      >
        Mua {{ plot.unlockCost }} <Icon icon="twemoji:coin" class="text-base" />
      </button>
    </div>

    <template v-else>
      <div v-if="!plot.seedId" class="text-center flex flex-col items-center gap-2 z-10">
        <Icon
          icon="twemoji:potted-plant"
          class="text-6xl opacity-30 group-hover:opacity-50 transition-all group-hover:scale-110"
        />
        <p class="text-yellow-100/60 font-black text-xs uppercase">Đất trống</p>
      </div>

      <div v-else class="flex flex-col items-center w-full z-10 px-4 relative">
        <div
          v-if="plot.hasBug"
          @click.stop="smashBug($event, plot.id)"
          class="absolute inset-0 flex items-center justify-center z-50 cursor-pointer bg-black/10 rounded-2xl backdrop-blur-[1px]"
        >
          <Icon icon="twemoji:bug" class="text-7xl animate-bounce" />
          <div
            class="absolute -bottom-5 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse shadow-lg border border-white"
          >
            SÂU ĂN! MAU ĐẬP
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
          class="w-full bg-black/40 rounded-full h-3 mb-4 overflow-hidden shadow-inner border border-black/20"
          :class="{ 'opacity-20': plot.hasBug }"
        >
          <div
            class="h-full transition-all duration-1000 ease-linear"
            :class="needsWater ? 'bg-blue-400' : isReady ? 'bg-yellow-400' : 'bg-green-400'"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div v-if="!plot.hasBug">
          <div v-if="needsWater" class="absolute -bottom-5">
            <button
              class="bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg animate-bounce border-2 border-white transition-all active:scale-90"
            >
              TƯỚI NƯỚC
            </button>
          </div>
          <div v-else-if="isReady" class="absolute -bottom-5">
            <button
              class="bg-yellow-400 text-yellow-950 font-black text-xs px-4 py-2 rounded-full shadow-lg animate-bounce border-2 border-white transition-all active:scale-90"
            >
              THU HOẠCH
            </button>
          </div>
          <div
            v-else
            class="text-xs text-white/95 font-black bg-black/40 px-3 py-1 rounded-full border border-white/20 shadow-sm"
          >
            {{ plot.watered ? 'ĐANG RA QUẢ...' : 'ĐANG LỚN...' }}
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

// --- TÍNH TOÁN HIỂN THỊ THỜI GIAN CÒN LẠI THÔNG MINH ---
const remainingTimeText = computed(() => {
  if (!props.plot.seedId || !seedInfo.value) return ''

  // Xử lý các trạng thái đặc biệt
  if (props.plot.hasBug) return 'Bị sâu ăn'
  if (isReady.value) return 'Đã chín'
  if (needsWater.value) return 'Cần nước'

  // Tính thời gian cần thiết cho giai đoạn hiện tại (Tưới nước = 50%, Chín = 100%)
  const targetTime = props.plot.watered ? seedInfo.value.growTime : seedInfo.value.growTime / 2
  const remainingSeconds = Math.max(0, Math.ceil(targetTime - elapsedSeconds.value))

  if (remainingSeconds <= 0) return '0s'

  // Chuyển đổi giây thành Giờ / Phút / Giây
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
