<template>
  <div
    class="min-h-screen transition-colors duration-1000 font-sans relative overflow-hidden pb-10"
    :class="[isNight ? 'bg-slate-900' : 'bg-sky-100', { 'shake-animation': isShaking }]"
  >
    <div class="max-w-6xl mx-auto p-4 md:p-8">
      <header
        class="flex flex-col md:flex-row justify-between items-center bg-white/90 backdrop-blur-sm p-5 rounded-3xl shadow-xl mb-8 border border-white/20 gap-4 relative z-40"
      >
        <div class="flex-1 w-full flex items-center gap-4">
          <a
            href="/"
            class="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors text-gray-600 group"
            title="Launcher"
          >
            <Icon
              icon="fluent:home-24-filled"
              class="text-2xl group-hover:scale-110 transition-transform"
            />
          </a>

          <div>
            <h1 class="text-3xl font-extrabold text-green-800 flex items-center gap-3">
              Nông Trại Vibe
            </h1>
            <div class="mt-2 flex items-center gap-3 w-full max-w-sm">
              <div
                class="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-sm"
              >
                LV.{{ level }}
              </div>
              <div
                class="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner border border-gray-300"
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
            @click="isGachaModalOpen = true"
            class="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 border-b-4 border-purple-800 text-sm transition-all active:scale-95"
          >
            <Icon icon="twemoji:slot-machine" class="text-xl" /> Gacha
          </button>

          <div
            ref="coinTargetRef"
            class="flex items-center gap-3 bg-yellow-100 px-6 py-2.5 rounded-2xl text-yellow-700 font-black text-xl shadow-inner border-2 border-yellow-200 transition-all"
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
          <div
            class="max-h-[400px] overflow-y-auto p-4 custom-scrollbar bg-white/40 rounded-3xl border border-white/10"
          >
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                v-for="seed in AVAILABLE_SEEDS"
                :key="seed.id"
                @click="selectSeed(seed)"
                class="p-5 rounded-3xl border-4 transition-all flex flex-col items-center gap-1 group relative overflow-hidden shadow-sm"
                :class="[
                  selectedSeed?.id === seed.id
                    ? 'border-green-600 bg-green-100 shadow-md scale-105'
                    : 'border-transparent bg-white/80 hover:bg-white hover:scale-105',
                  seed.cost > 5000
                    ? 'ring-2 ring-orange-400'
                    : seed.cost > 1000
                      ? 'ring-2 ring-purple-400'
                      : '',
                ]"
              >
                <div
                  v-if="seed.cost > 5000"
                  class="absolute top-2 right-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse"
                >
                  LEGENDARY
                </div>
                <div
                  v-else-if="seed.cost > 1000"
                  class="absolute top-2 right-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black"
                >
                  EPIC
                </div>
                <Icon :icon="seed.icon" class="text-6xl drop-shadow-sm mb-2" />
                <span class="font-black text-gray-800 text-sm truncate w-full text-center">{{
                  seed.name
                }}</span>
                <div class="flex items-center gap-2 w-full justify-center mt-1">
                  <span
                    class="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200"
                  >
                    <Icon icon="twemoji:stopwatch" />
                    {{ Math.max(1, seed.growTime * (1 - upgrades.fertilizer * 0.1)).toFixed(0) }}s
                  </span>
                  <span
                    class="text-xs font-black text-red-600 flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded-lg border border-red-200"
                  >
                    -{{ seed.cost }} Xu
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
              v-for="(lv, type) in upgrades"
              :key="type"
              class="bg-white/90 p-5 rounded-3xl flex items-center justify-between shadow-md border border-white/20"
            >
              <div class="flex items-center gap-4">
                <div
                  :class="type === 'fertilizer' ? 'bg-green-100' : 'bg-yellow-100'"
                  class="p-3 rounded-2xl text-4xl"
                >
                  <Icon :icon="type === 'fertilizer' ? 'twemoji:test-tube' : 'twemoji:pick'" />
                </div>
                <div>
                  <h3 class="font-black text-gray-800 text-base">
                    {{ type === 'fertilizer' ? 'Phân bón' : 'Lưỡi hái' }} Lv.{{ lv }}
                  </h3>
                  <div class="flex gap-1.5 mt-2">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="w-4 h-2 rounded-full shadow-inner"
                      :class="
                        i <= lv
                          ? type === 'fertilizer'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                          : 'bg-gray-300'
                      "
                    ></div>
                  </div>
                </div>
              </div>
              <button
                @click="buyUpgrade(type)"
                :disabled="lv >= 5"
                class="px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:bg-gray-300 disabled:text-gray-500"
                :class="lv < 5 ? 'bg-blue-600 text-white hover:bg-blue-500' : ''"
              >
                <span v-if="lv < 5">-{{ UPGRADE_PRICES[type][lv] }} Xu</span>
                <span v-else>MAX</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-0">
        <section class="lg:col-span-2">
          <h2
            class="text-2xl font-bold mb-5 flex items-center gap-2.5"
            :class="isNight ? 'text-white' : 'text-gray-700'"
          >
            <Icon icon="twemoji:sun-with-face" /> Mảnh Đất Của Bạn
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
              class="bg-indigo-100 text-indigo-700 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm border border-indigo-200"
            >
              <Icon icon="twemoji:alarm-clock" class="animate-pulse text-sm" />
              {{ questResetCountdown }}
            </div>
          </div>
          <div
            class="max-h-[500px] overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4 bg-white/30 rounded-3xl border border-white/10 shadow-inner"
          >
            <template v-for="quest in quests" :key="quest.id">
              <div
                v-if="!quest.isClaimed"
                class="bg-white/90 p-5 rounded-3xl shadow-md border-l-8 border-yellow-500 transition-all shrink-0"
              >
                <div class="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h3 class="font-black text-gray-900 text-sm mb-1">{{ quest.title }}</h3>
                    <p class="text-xs text-gray-600 leading-snug">{{ quest.description }}</p>
                  </div>
                  <div
                    class="bg-yellow-100 text-yellow-800 text-xs font-black px-2.5 py-1 rounded flex items-center gap-1 border border-yellow-200 shrink-0"
                  >
                    +{{ quest.reward }} <Icon icon="twemoji:coin" />
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div
                    class="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner border border-gray-300"
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
                  class="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black text-sm py-2.5 rounded-2xl shadow-lg transition-all animate-pulse active:scale-95"
                >
                  Nhận Thưởng
                </button>
              </div>
            </template>
            <div
              v-if="quests.every((q) => q.isClaimed)"
              class="text-center p-8 bg-white/60 rounded-3xl border-2 border-dashed border-gray-400"
            >
              <Icon icon="twemoji:party-popper" class="text-5xl mx-auto mb-3" />
              <p class="text-gray-600 font-black text-sm">Hết nhiệm vụ rồi, đợi giờ chẵn nhé!</p>
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
        class="bg-white rounded-[2.5rem] p-8 max-w-[360px] w-full flex flex-col items-center relative shadow-2xl border-4 border-purple-300"
      >
        <button
          v-if="!isSpinning"
          @click="isGachaModalOpen = false"
          class="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors active:scale-90"
        >
          <Icon icon="fluent:dismiss-24-filled" class="text-3xl" />
        </button>
        <h2 class="text-2xl font-black text-purple-700 mb-8 flex items-center gap-2">
          <Icon icon="twemoji:slot-machine" /> Gacha (40% Win)
        </h2>
        <div class="relative w-72 h-72 mb-8">
          <div class="absolute -top-6 left-1/2 -translate-x-1/2 z-20 text-red-500 drop-shadow-md">
            <Icon icon="fluent:caret-down-24-filled" class="text-6xl -mt-2" />
          </div>
          <div
            class="w-full h-full rounded-full border-8 border-yellow-400 overflow-hidden relative shadow-2xl"
            :style="{
              transform: `rotate(${wheelRotation}deg)`,
              transition: 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)',
            }"
          >
            <div class="absolute inset-0 rounded-full" :style="{ background: wheelGradient }"></div>
            <div
              v-for="(opt, i) in GACHA_OPTIONS"
              :key="i"
              class="absolute inset-0 flex flex-col items-center justify-start pt-4"
              :style="{ transform: `rotate(${i * 45}deg)` }"
            >
              <Icon :icon="opt.icon" class="text-3xl mb-1 drop-shadow-md" />
              <span
                class="font-black text-gray-900 text-[10px] bg-white/70 px-1.5 py-0.5 rounded shadow-sm border border-white"
                >{{ opt.label }}</span
              >
            </div>
          </div>
        </div>
        <button
          @click="spinWheel"
          :disabled="isSpinning"
          class="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-lg py-3.5 rounded-[1.5rem] shadow-lg border-b-4 border-purple-800 disabled:opacity-50 transition-all active:scale-95"
        >
          {{ isSpinning ? 'Đang quay...' : 'Quay (-1.000 Xu)' }}
        </button>
      </div>
    </div>

    <div class="fixed inset-0 pointer-events-none z-[9999]">
      <div
        v-for="coin in flyingCoins"
        :key="coin.id"
        class="absolute flex items-center font-black text-3xl text-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flying-coin"
        :style="{
          '--start-x': coin.startX + 'px',
          '--start-y': coin.startY + 'px',
          '--end-x': coin.endX + 'px',
          '--end-y': coin.endY + 'px',
        }"
      >
        <Icon icon="twemoji:coin" class="mr-1" /> +{{ coin.amount }}
      </div>
    </div>

    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="px-5 py-3.5 rounded-2xl shadow-xl font-black text-sm flex items-center gap-3 transform transition-all border-b-4"
          :class="
            toast.type === 'error'
              ? 'bg-red-500 text-white border-red-700'
              : toast.type === 'success'
                ? 'bg-green-500 text-white border-green-700'
                : 'bg-white text-gray-800 border-gray-200'
          "
        >
          {{ toast.message }}
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useFarm, GACHA_OPTIONS, AVAILABLE_SEEDS } from './composables/useFarm'
import FarmPlot from './components/FarmPlot.vue'

const {
  coins,
  plots,
  selectedSeed,
  selectSeed,
  isNight,
  toasts,
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
  isShaking,
} = useFarm()

const isGachaModalOpen = ref(false)
const isSpinning = ref(false)
const wheelRotation = ref(0)
const wheelGradient = computed(
  () =>
    `conic-gradient(from -22.5deg, ${GACHA_OPTIONS.map((o, i) => `${o.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')})`,
)

const spinWheel = () => {
  if (coins.value < 1000) return
  coins.value -= 1000
  isSpinning.value = true
  const rand = Math.random() * 100
  const idx =
    rand < 5
      ? 0
      : rand < 20
        ? 1
        : rand < 30
          ? 2
          : rand < 45
            ? 3
            : rand < 65
              ? 4
              : rand < 75
                ? 5
                : rand < 80
                  ? 6
                  : 7
  const targetDeg = 360 - idx * 45
  const currentSpins = Math.floor(wheelRotation.value / 360) * 360
  wheelRotation.value = currentSpins + 360 * 6 + targetDeg + (Math.random() * 20 - 10)
  setTimeout(() => {
    isSpinning.value = false
    applyGachaReward(GACHA_OPTIONS[idx].id, null)
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

.shake-animation {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes shake {
  10%,
  90% {
    transform: translate3d(-2px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(4px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-8px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(8px, 0, 0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s forwards;
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
  transition: 0.4s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.toast-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
