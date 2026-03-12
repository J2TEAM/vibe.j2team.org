<template>
  <div
    class="min-h-screen transition-colors duration-1000 font-sans relative overflow-hidden pb-10"
    :class="isNight ? 'bg-slate-900' : 'bg-sky-100'"
  >
    <div class="max-w-6xl mx-auto p-4 md:p-8">
      <header
        class="flex flex-col md:flex-row justify-between items-center bg-white/90 backdrop-blur-sm p-5 rounded-3xl shadow-xl mb-8 border border-white/20 gap-4 relative z-40"
      >
        <div class="flex-1 w-full flex items-center gap-4">
          <RouterLink
            to="/"
            class="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors text-gray-600 group"
            title="Quay về Launcher"
          >
            <Icon
              icon="fluent:home-24-filled"
              class="text-2xl group-hover:scale-110 transition-transform"
            />
          </RouterLink>

          <div>
            <h1 class="text-4xl font-extrabold text-green-800 flex items-center gap-3 leading-none">
              <Icon icon="twemoji:tractor" class="text-5xl" /> Are you a farmer?
            </h1>
            <div class="mt-3 flex items-center gap-3 w-full max-w-sm">
              <div class="bg-blue-600 text-white text-xs font-black px-2.5 py-1.5 rounded-lg">
                LV.{{ level }}
              </div>
              <div
                class="flex-1 bg-gray-200 h-3.5 rounded-full overflow-hidden shadow-inner border border-gray-300"
              >
                <div
                  class="bg-blue-400 h-full transition-all duration-500"
                  :style="{ width: `${(xp / xpToNextLevel) * 100}%` }"
                ></div>
              </div>
              <span class="text-xs font-bold text-gray-600">{{ xp }}/{{ xpToNextLevel }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-end">
          <button
            @click="openGacha"
            class="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-3 md:py-2.5 rounded-2xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 border-b-4 border-purple-800 text-sm"
          >
            <Icon icon="twemoji:slot-machine" class="text-xl" /> Gacha
          </button>

          <div
            ref="coinTargetRef"
            class="flex items-center gap-3 bg-yellow-100 px-6 py-3 md:py-2.5 rounded-2xl text-yellow-700 font-black text-xl shadow-inner border-2 border-yellow-200 transition-all"
          >
            <Icon icon="twemoji:coin" class="animate-bounce" /> {{ coins }} Xu
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        <section class="xl:col-span-2 flex flex-col">
          <h2
            class="text-2xl font-bold mb-5 flex items-center gap-2.5"
            :class="isNight ? 'text-white' : 'text-gray-700'"
          >
            <Icon icon="twemoji:convenience-store" /> Cửa hàng Hạt Giống
          </h2>
          <div class="max-h-[400px] overflow-y-auto p-4 custom-scrollbar">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              <button
                v-for="seed in AVAILABLE_SEEDS"
                :key="seed.id"
                @click="selectedSeed = seed"
                class="p-5 rounded-3xl border-4 transition-all flex flex-col items-center gap-1 group relative overflow-hidden"
                :class="
                  selectedSeed?.id === seed.id
                    ? 'border-green-600 bg-green-100 shadow-md scale-105'
                    : 'border-transparent bg-white/80 hover:bg-white hover:scale-105'
                "
              >
                <Icon :icon="seed.icon" class="text-6xl drop-shadow-sm mb-2" />
                <span class="font-black text-gray-800 text-base mb-1 text-center w-full truncate">{{
                  seed.name
                }}</span>
                <div class="flex items-center gap-2.5 w-full justify-center">
                  <span
                    class="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-100 px-2.5 py-1 rounded-lg"
                  >
                    <Icon icon="twemoji:stopwatch" />
                    {{ Math.max(1, seed.growTime * (1 - upgrades.fertilizer * 0.1)).toFixed(0) }}s
                  </span>
                  <span
                    class="text-xs font-black text-red-600 flex items-center gap-1 bg-red-100 px-2.5 py-1 rounded-lg"
                  >
                    -{{ seed.cost }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2
            class="text-2xl font-bold mb-5 flex items-center gap-2.5"
            :class="isNight ? 'text-white' : 'text-gray-700'"
          >
            <Icon icon="twemoji:hammer-and-wrench" /> Trạm Công Nghệ
          </h2>
          <div class="flex flex-col gap-4">
            <div
              class="bg-white/90 p-5 rounded-3xl flex items-center justify-between shadow-md border border-white/20"
            >
              <div class="flex items-center gap-4">
                <div class="bg-green-100 p-2.5 rounded-2xl text-4xl">
                  <Icon icon="twemoji:test-tube" />
                </div>
                <div>
                  <h3 class="font-black text-gray-800 text-sm">Phân bón Sinh học</h3>
                  <p class="text-xs text-gray-500 font-medium">Giảm 10% T.gian mọc/cấp</p>
                  <div class="flex gap-1.5 mt-1.5">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="w-4 h-2 rounded-full"
                      :class="i <= upgrades.fertilizer ? 'bg-green-500' : 'bg-gray-300'"
                    ></div>
                  </div>
                </div>
              </div>
              <button
                @click="buyUpgrade('fertilizer')"
                :disabled="upgrades.fertilizer >= 5"
                class="px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shrink-0"
                :class="
                  upgrades.fertilizer >= 5
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                "
              >
                <span v-if="upgrades.fertilizer >= 5">MAX</span>
                <span v-else
                  >-{{ UPGRADE_PRICES.fertilizer[upgrades.fertilizer] }} <Icon icon="twemoji:coin"
                /></span>
              </button>
            </div>

            <div
              class="bg-white/90 p-5 rounded-3xl flex items-center justify-between shadow-md border border-white/20"
            >
              <div class="flex items-center gap-4">
                <div class="bg-yellow-100 p-2.5 rounded-2xl text-4xl">
                  <Icon icon="twemoji:pick" />
                </div>
                <div>
                  <h3 class="font-black text-gray-800 text-sm">Lưỡi hái Tư bản</h3>
                  <p class="text-xs text-gray-500 font-medium">Tăng 20% Tiền/cấp</p>
                  <div class="flex gap-1.5 mt-1.5">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="w-4 h-2 rounded-full"
                      :class="i <= upgrades.scythe ? 'bg-yellow-500' : 'bg-gray-300'"
                    ></div>
                  </div>
                </div>
              </div>
              <button
                @click="buyUpgrade('scythe')"
                :disabled="upgrades.scythe >= 5"
                class="px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shrink-0"
                :class="
                  upgrades.scythe >= 5
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                "
              >
                <span v-if="upgrades.scythe >= 5">MAX</span>
                <span v-else
                  >-{{ UPGRADE_PRICES.scythe[upgrades.scythe] }} <Icon icon="twemoji:coin"
                /></span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-0">
        <section class="lg:col-span-2 relative">
          <h2
            class="text-2xl font-bold mb-5 flex items-center gap-2.5"
            :class="isNight ? 'text-white' : 'text-gray-700'"
          >
            <Icon :icon="isNight ? 'twemoji:crescent-moon' : 'twemoji:sun-with-face'" />
            Mảnh Đất Của Bạn
          </h2>
          <div class="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 max-w-xl mx-auto lg:mx-0">
            <FarmPlot v-for="plot in plots" :key="plot.id" :plot="plot" />
          </div>
        </section>

        <section class="lg:col-span-1 flex flex-col">
          <div class="flex justify-between items-center mb-5">
            <h2
              class="text-2xl font-bold flex items-center gap-2.5"
              :class="isNight ? 'text-white' : 'text-gray-700'"
            >
              <Icon icon="twemoji:scroll" /> Nhiệm Vụ
            </h2>
            <div
              class="bg-indigo-100/90 text-indigo-700 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-indigo-200"
            >
              <Icon icon="twemoji:alarm-clock" class="text-base animate-pulse" />
              {{ questResetCountdown }}
            </div>
          </div>
          <div class="max-h-[500px] overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
            <template v-for="quest in quests" :key="quest.id">
              <div
                v-if="!quest.isClaimed"
                class="bg-white/90 p-5 rounded-3xl shadow-md border-l-8 border-yellow-500 transition-all shrink-0"
              >
                <div class="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h3 class="font-black text-gray-900 text-sm mb-0.5">{{ quest.title }}</h3>
                    <p class="text-xs text-gray-600">{{ quest.description }}</p>
                  </div>
                  <div
                    class="bg-yellow-100 text-yellow-800 text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 border border-yellow-200"
                  >
                    +{{ quest.reward }} <Icon icon="twemoji:coin" />
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div
                    class="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner border border-gray-300"
                  >
                    <div
                      class="bg-yellow-400 h-full transition-all duration-500"
                      :style="{ width: `${(quest.progress / quest.target) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-xs font-black text-gray-700 w-10 text-right"
                    >{{ quest.progress }}/{{ quest.target }}</span
                  >
                </div>
                <button
                  v-if="quest.progress >= quest.target"
                  @click="claimQuest(quest.id, $event)"
                  class="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black text-sm py-2.5 rounded-2xl shadow-lg transition-all animate-pulse"
                >
                  Nhận thưởng
                </button>
              </div>
            </template>
            <div
              v-if="quests.every((q) => q.isClaimed)"
              class="text-center p-8 bg-white/60 rounded-3xl border-2 border-dashed border-gray-400 shadow-inner"
            >
              <Icon icon="twemoji:party-popper" class="text-5xl mx-auto mb-3" />
              <p class="text-gray-600 font-black text-base">Bạn đã hoàn thành hết nhiệm vụ!</p>
              <p class="text-gray-500 text-xs mt-2 font-medium">
                Đợi đến mốc giờ chẵn để nhận đợt mới nhé!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="isGachaModalOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        class="bg-white rounded-[2rem] p-8 max-w-[340px] w-full flex flex-col items-center relative shadow-2xl border-4 border-purple-300"
      >
        <button
          v-if="!isSpinning"
          @click="isGachaModalOpen = false"
          class="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Icon icon="fluent:dismiss-24-filled" class="text-3xl" />
        </button>

        <h2 class="text-2xl font-black text-purple-700 mb-8 flex items-center gap-2">
          <Icon icon="twemoji:slot-machine" /> Gacha
        </h2>

        <div class="relative w-64 h-64 mb-8">
          <div class="absolute -top-5 left-1/2 -translate-x-1/2 z-20 text-red-500 drop-shadow-md">
            <Icon icon="fluent:caret-down-24-filled" class="text-6xl -mt-2" />
          </div>

          <div
            class="w-full h-full rounded-full border-8 border-yellow-400 overflow-hidden relative shadow-inner"
            :style="{
              transform: `rotate(${wheelRotation}deg)`,
              transition: 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)',
            }"
          >
            <div class="absolute inset-0 rounded-full" :style="{ background: wheelGradient }"></div>

            <div
              v-for="(opt, i) in GACHA_OPTIONS"
              :key="i"
              class="absolute inset-0 flex flex-col items-center justify-start pt-3"
              :style="{ transform: `rotate(${i * 45}deg)` }"
            >
              <Icon :icon="opt.icon" class="text-[28px] mb-0.5 drop-shadow-md" />
              <span class="font-black text-gray-900 text-[10px] bg-white/50 px-1 rounded">{{
                opt.label
              }}</span>
            </div>
          </div>
        </div>

        <button
          @click="spinWheel"
          :disabled="isSpinning"
          class="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-lg py-3 rounded-2xl shadow-lg transition-transform active:scale-95 border-b-4 border-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSpinning ? 'Đang quay...' : 'Thử vận (-1.000 Xu)' }}
        </button>
      </div>
    </div>

    <div class="fixed inset-0 pointer-events-none z-[9999]">
      <div
        v-for="coin in flyingCoins"
        :key="coin.id"
        class="absolute flex items-center font-black text-2xl text-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flying-coin"
        :style="{
          '--start-x': coin.startX + 'px',
          '--start-y': coin.startY + 'px',
          '--end-x': coin.endX + 'px',
          '--end-y': coin.endY + 'px',
        }"
      >
        <Icon icon="twemoji:coin" class="text-3xl mr-1" /> +{{ coin.amount }}
      </div>
    </div>

    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-black text-sm transform transition-all max-w-xs"
          :class="{
            'bg-red-500 text-white': toast.type === 'error',
            'bg-green-500 text-white': toast.type === 'success',
            'bg-white text-gray-800 border-l-4 border-blue-600': toast.type === 'info',
          }"
        >
          {{ toast.message }}
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useFarm, GACHA_OPTIONS } from './composables/useFarm'
import FarmPlot from './components/FarmPlot.vue'

const {
  coins,
  plots,
  AVAILABLE_SEEDS,
  selectedSeed,
  isNight,
  toasts,
  showToast,
  coinTargetRef,
  flyingCoins,
  level,
  xp,
  xpToNextLevel,
  upgrades,
  UPGRADE_PRICES,
  buyUpgrade,
  quests,
  claimQuest,
  questResetCountdown,
  applyGachaReward,
} = useFarm()

// --- LOGIC MODAL & VÒNG QUAY 8 Ô ---
const isGachaModalOpen = ref(false)
const isSpinning = ref(false)
const wheelRotation = ref(0)
const gachaEvent = ref<MouseEvent | null>(null)

// Tự động tạo mảng màu CSS tương ứng với 8 góc
const wheelGradient = computed(() => {
  const stops = GACHA_OPTIONS.map((opt, i) => `${opt.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(
    ', ',
  )
  return `conic-gradient(from -22.5deg, ${stops})`
})

const openGacha = (e: MouseEvent) => {
  gachaEvent.value = e
  isGachaModalOpen.value = true
}

const spinWheel = () => {
  const GACHA_COST = 1000 // Tăng giá lên 1.000

  if (coins.value < GACHA_COST) {
    showToast(`Bạn cần ít nhất ${GACHA_COST} Xu để chơi. Nghèo thì đừng ham hố cờ bạc!`, 'error')
    return
  }
  if (isSpinning.value) return

  coins.value -= GACHA_COST
  isSpinning.value = true

  // Quay Gacha theo tỷ lệ
  const rand = Math.random() * 100
  let index = 0

  if (rand < 5)
    index = 0 // 5% Nổ Hũ (Ô số 0)
  else if (rand < 20)
    index = 1 // 15% Bão (Ô số 1)
  else if (rand < 30)
    index = 2 // 10% Mưa (Ô số 2)
  else if (rand < 45)
    index = 3 // 15% Sâu (Ô số 3)
  else if (rand < 65)
    index = 4 // 20% Mini Jackpot (Ô số 4)
  else if (rand < 75)
    index = 5 // 10% Trộm (Ô số 5)
  else if (rand < 80)
    index = 6 // 5% Thúc Chín (Ô số 6)
  else index = 7 // 20% Trash (Ô số 7)

  // Tính toán góc quay để kim luôn chỉ đúng vào ô đã chọn
  const targetDeg = 360 - index * 45
  const offset = Math.floor(Math.random() * 30) - 15 // Tránh kim cắm ngay đường kẻ vạch (lệch nhẹ +/- 15 độ)

  const currentSpins = Math.floor(wheelRotation.value / 360) * 360
  const extraSpins = 360 * 5 // Xoay ít nhất 5 vòng trước khi dừng
  wheelRotation.value = currentSpins + extraSpins + targetDeg + offset

  // Chờ 4 giây (khớp time CSS) cho bánh xe dừng thì trả thưởng và gieo họa
  setTimeout(() => {
    isSpinning.value = false
    applyGachaReward(GACHA_OPTIONS[index].id, gachaEvent.value)
  }, 4000)
}
</script>

<style scoped>
@keyframes flyToTarget {
  0% {
    transform: translate(calc(var(--start-x) - 50%), calc(var(--start-y) - 50%)) scale(0.5);
    opacity: 0;
  }
  20% {
    transform: translate(calc(var(--start-x) - 50%), calc(var(--start-y) - 100px)) scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translate(calc(var(--end-x) - 50%), calc(var(--end-y) - 50%)) scale(0.5);
    opacity: 0;
  }
}
.flying-coin {
  top: 0;
  left: 0;
  animation: flyToTarget 0.8s cubic-bezier(0.42, 0, 0.58, 1) forwards;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}
</style>
