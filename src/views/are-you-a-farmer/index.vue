<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body relative overflow-hidden pb-10"
    :class="{ 'shake-animation': isShaking }"
  >
    <div class="max-w-5xl mx-auto px-6 py-8">
      <header
        class="flex flex-col md:flex-row justify-between items-center bg-bg-surface border border-border-default p-6 mb-10 relative z-40"
      >
        <div class="flex-1 w-full flex items-center gap-6">
          <a
            href="/"
            class="p-3 border border-border-default hover:border-accent-coral hover:text-accent-coral transition-colors text-text-secondary"
            title="Launcher"
          >
            <Icon icon="fluent:home-24-filled" class="text-2xl" />
          </a>

          <div>
            <h1
              class="font-display text-3xl md:text-4xl font-bold tracking-tight text-text-primary uppercase"
            >
              Are you a <span class="text-accent-coral">farmer?</span>
            </h1>
            <div class="mt-2 flex items-center gap-3 w-full max-w-sm">
              <div class="text-accent-amber font-display font-bold text-xs tracking-widest">
                LV.{{ level }}
              </div>
              <div class="flex-1 bg-bg-deep border border-border-default h-2 overflow-hidden">
                <div
                  class="bg-accent-coral h-full transition-all duration-500"
                  :style="{ width: `${(xp / xpToNextLevel) * 100}%` }"
                ></div>
              </div>
              <span class="text-xs font-display tracking-widest text-text-secondary"
                >{{ xp }}/{{ xpToNextLevel }}</span
              >
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full md:w-auto mt-6 md:mt-0 justify-end">
          <button
            @click="isGachaModalOpen = true"
            class="border border-border-default bg-bg-surface text-text-primary hover:border-accent-sky hover:text-accent-sky font-display tracking-widest text-sm px-6 py-2.5 transition-all flex items-center gap-2 active:scale-95"
          >
            <Icon icon="twemoji:slot-machine" class="text-lg" /> GACHA
          </button>

          <div
            ref="coinTargetRef"
            class="flex items-center gap-2 bg-bg-elevated border border-border-default px-6 py-2.5 text-text-primary font-display font-bold text-xl"
          >
            <Icon icon="twemoji:coin" class="animate-bounce" />
            <span class="text-accent-amber">{{ coins }} Xu</span>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <section class="xl:col-span-2 flex flex-col">
          <h2
            class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span> SHOP
          </h2>
          <div class="max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                v-for="seed in AVAILABLE_SEEDS"
                :key="seed.id"
                @click="selectSeed(seed)"
                class="border bg-bg-surface p-5 transition-all duration-300 flex flex-col items-center gap-2 group relative overflow-hidden"
                :class="
                  selectedSeed?.id === seed.id
                    ? 'border-accent-coral bg-bg-elevated shadow-lg shadow-accent-coral/5 -translate-y-1'
                    : 'border-border-default hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5'
                "
              >
                <div
                  v-if="seed.cost > 5000"
                  class="absolute top-0 right-0 bg-accent-coral text-bg-deep font-display font-bold tracking-widest text-[9px] px-2 py-1"
                >
                  LEGENDARY
                </div>
                <div
                  v-else-if="seed.cost > 1000"
                  class="absolute top-0 right-0 bg-accent-amber text-bg-deep font-display font-bold tracking-widest text-[9px] px-2 py-1"
                >
                  EPIC
                </div>

                <Icon :icon="seed.icon" class="text-5xl drop-shadow-sm mb-1 mt-2" />
                <span
                  class="font-display font-bold text-text-primary text-sm tracking-wide w-full text-center"
                  >{{ seed.name }}</span
                >
                <div class="flex items-center gap-2 w-full justify-center mt-1">
                  <span
                    class="text-xs font-display text-accent-sky flex items-center gap-1 border border-border-default bg-bg-deep px-2 py-0.5"
                  >
                    <Icon icon="twemoji:stopwatch" />
                    {{ Math.max(1, seed.growTime * (1 - upgrades.fertilizer * 0.1)).toFixed(0) }}s
                  </span>
                  <span
                    class="text-xs font-display text-accent-coral flex items-center gap-1 border border-border-default bg-bg-deep px-2 py-0.5"
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
            class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
          >
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span> TECH
            STACK
          </h2>
          <div class="flex flex-col gap-4">
            <div
              v-for="(lv, type) in upgrades"
              :key="type"
              class="bg-bg-surface border border-border-default p-5 flex items-center justify-between transition-all hover:border-accent-amber"
            >
              <div class="flex items-center gap-4">
                <div class="p-2 border border-border-default text-3xl bg-bg-deep">
                  <Icon :icon="type === 'fertilizer' ? 'twemoji:test-tube' : 'twemoji:pick'" />
                </div>
                <div>
                  <h3 class="font-display font-bold text-text-primary text-sm tracking-wide">
                    {{ type === 'fertilizer' ? 'Phân bón' : 'Lưỡi hái' }} Lv.{{ lv }}
                  </h3>
                  <div class="flex gap-1.5 mt-2">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="w-3 h-3 border border-border-default"
                      :class="i <= lv ? 'bg-accent-amber' : 'bg-bg-deep'"
                    ></div>
                  </div>
                </div>
              </div>
              <button
                @click="buyUpgrade(type)"
                :disabled="lv >= 5"
                class="border border-border-default px-3 py-1.5 font-display text-xs tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="
                  lv < 5
                    ? 'bg-bg-deep text-text-primary hover:border-accent-amber hover:text-accent-amber'
                    : 'bg-bg-deep text-text-secondary'
                "
              >
                <span v-if="lv < 5">-{{ UPGRADE_PRICES[type][lv] }}</span>
                <span v-else>MAX</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-0">
        <section class="lg:col-span-2">
          <h2
            class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
          >
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span> FARM
          </h2>
          <div class="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 max-w-xl mx-auto lg:mx-0">
            <FarmPlot v-for="plot in plots" :key="plot.id" :plot="plot" />
          </div>
        </section>

        <section class="lg:col-span-1 flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <h2
              class="font-display text-2xl font-semibold text-text-primary flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span> QUESTS
            </h2>
            <div
              class="text-accent-sky text-xs font-display tracking-widest px-3 py-1.5 border border-border-default bg-bg-surface flex items-center gap-1"
            >
              <Icon icon="twemoji:alarm-clock" class="animate-pulse" /> {{ questResetCountdown }}
            </div>
          </div>
          <div class="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
            <template v-for="quest in quests" :key="quest.id">
              <div
                v-if="!quest.isClaimed"
                class="bg-bg-surface p-5 border border-border-default transition-all hover:-translate-y-1 hover:border-accent-sky"
              >
                <div class="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h3 class="font-display font-bold text-text-primary text-sm tracking-wide mb-1">
                      {{ quest.title }}
                    </h3>
                    <p class="text-xs text-text-secondary font-body">{{ quest.description }}</p>
                  </div>
                  <div
                    class="text-accent-amber text-xs font-display tracking-widest px-2 py-1 border border-border-default bg-bg-deep shrink-0 flex items-center gap-1"
                  >
                    +{{ quest.reward }} <Icon icon="twemoji:coin" />
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex-1 bg-bg-deep h-1.5 border border-border-default">
                    <div
                      class="bg-accent-sky h-full transition-all duration-500"
                      :style="{ width: `${(quest.progress / quest.target) * 100}%` }"
                    ></div>
                  </div>
                  <span
                    class="text-xs font-display tracking-widest text-text-secondary w-10 text-right"
                    >{{ quest.progress }}/{{ quest.target }}</span
                  >
                </div>
                <button
                  v-if="quest.progress >= quest.target"
                  @click="claimQuest(quest.id, $event)"
                  class="w-full mt-4 border border-accent-sky bg-accent-sky/10 text-accent-sky hover:bg-accent-sky hover:text-bg-deep font-display tracking-widest text-xs py-2.5 transition-colors active:scale-95"
                >
                  NHẬN THƯỞNG
                </button>
              </div>
            </template>
            <div
              v-if="quests.every((q) => q.isClaimed)"
              class="text-center p-8 bg-bg-surface border border-border-default border-dashed"
            >
              <Icon icon="twemoji:party-popper" class="text-5xl mx-auto mb-3" />
              <p class="text-text-secondary font-display tracking-widest text-xs">
                ĐỢI GIỜ CHẴN NHÉ
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="isGachaModalOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-bg-deep/90 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        class="bg-bg-surface border border-border-default p-8 max-w-[360px] w-full flex flex-col items-center relative shadow-2xl"
      >
        <button
          v-if="!isSpinning"
          @click="isGachaModalOpen = false"
          class="absolute top-4 right-4 text-text-secondary hover:text-accent-coral transition-colors active:scale-90"
        >
          <Icon icon="fluent:dismiss-24-filled" class="text-2xl" />
        </button>
        <h2 class="font-display text-2xl font-bold text-text-primary mb-8 tracking-wide">
          VÒNG QUAY <span class="text-accent-amber">NHÂN PHẨM</span>
        </h2>

        <div class="relative w-72 h-72 mb-8">
          <div
            class="absolute -top-6 left-1/2 -translate-x-1/2 z-20 text-accent-coral drop-shadow-md"
          >
            <Icon icon="fluent:caret-down-24-filled" class="text-6xl -mt-2" />
          </div>
          <div
            class="w-full h-full rounded-full border-4 border-accent-amber overflow-hidden relative shadow-2xl"
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
                class="font-display font-bold text-bg-deep text-[10px] tracking-widest bg-text-primary px-1.5 py-0.5 border border-bg-deep"
                >{{ opt.label }}</span
              >
            </div>
          </div>
        </div>

        <button
          @click="spinWheel"
          :disabled="isSpinning"
          class="w-full border border-border-default bg-bg-deep text-text-primary font-display tracking-widest text-sm py-3 hover:border-accent-amber hover:text-accent-amber disabled:opacity-50 transition-colors active:scale-95"
        >
          {{ isSpinning ? 'ĐANG QUAY...' : 'QUAY (-1.000 XU)' }}
        </button>
      </div>
    </div>

    <div class="fixed inset-0 pointer-events-none z-[9999]">
      <div
        v-for="coin in flyingCoins"
        :key="coin.id"
        class="absolute flex items-center font-display font-bold text-3xl text-accent-amber drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flying-coin"
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

    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="px-5 py-4 border border-border-default bg-bg-elevated font-body text-sm text-text-primary flex items-center gap-3 transform transition-all shadow-xl"
          :class="
            toast.type === 'error'
              ? 'border-l-4 border-l-accent-coral'
              : toast.type === 'success'
                ? 'border-l-4 border-l-accent-sky'
                : 'border-l-4 border-l-accent-amber'
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

// Chuyển màu wheel sang các màu Retro Editorial đã cấu hình
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
    applyGachaReward(GACHA_OPTIONS[idx]?.id || 'trash', null)
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
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #253549;
} /* border-default */
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4a6180;
} /* text-dim */
</style>
