<template>
  <div
    class="min-h-screen text-text-primary font-body relative overflow-hidden transition-colors duration-500"
    :class="sirenState ? 'bg-[#3b0a0a]' : 'bg-bg-deep'"
  >
    <!-- Background nhấp nháy báo động khi quay -->
    <div
      v-if="sirenState"
      class="absolute inset-0 bg-red-500/10 mix-blend-overlay animate-pulse pointer-events-none"
    ></div>

    <header
      class="w-full flex items-center justify-between px-6 py-4 border-b border-border-default/50 relative z-10"
    >
      <RouterLink
        to="/"
        class="font-display text-sm tracking-widest text-text-secondary hover:text-accent-coral transition-colors"
      >
        HOME
      </RouterLink>
      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
      >
        VOL.01 / 2026
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-12 relative z-10">
      <div class="text-center mb-10 animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight">
          <span class="text-accent-coral font-display text-sm tracking-widest block mb-2"
            >// ALERT</span
          >
          <span class="text-text-primary">Blame_</span>
          <span class="text-accent-coral animate-pulse">Roulette</span>
        </h1>
        <p class="mt-4 text-text-secondary text-lg">
          Bug thì đã on Production. Vấn đề bây giờ là: Chửi ai?
        </p>
      </div>

      <!-- Khung quay Blame -->
      <div class="relative w-full max-w-2xl mx-auto mb-10 animate-fade-up animate-delay-1">
        <div
          class="border-2 bg-bg-surface p-1 relative overflow-hidden transition-all duration-300"
          :class="[
            sirenState
              ? 'border-accent-coral shadow-[0_0_50px_rgba(255,107,107,0.3)]'
              : hasResult
                ? 'border-accent-coral shadow-[0_0_20px_rgba(255,107,107,0.15)]'
                : 'border-border-default',
          ]"
        >
          <!-- Cảnh báo góc trang trí -->
          <div
            class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 transition-colors duration-300"
            :class="sirenState || hasResult ? 'border-accent-coral' : 'border-text-dim'"
          ></div>
          <div
            class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 transition-colors duration-300"
            :class="sirenState || hasResult ? 'border-accent-coral' : 'border-text-dim'"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 transition-colors duration-300"
            :class="sirenState || hasResult ? 'border-accent-coral' : 'border-text-dim'"
          ></div>
          <div
            class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 transition-colors duration-300"
            :class="sirenState || hasResult ? 'border-accent-coral' : 'border-text-dim'"
          ></div>

          <div class="flex flex-col items-center justify-center bg-bg-deep py-12 px-6 min-h-60">
            <span
              class="font-display text-sm tracking-widest mb-4 block transition-colors duration-300"
              :class="
                isSpinning
                  ? 'text-accent-amber animate-pulse'
                  : hasResult
                    ? 'text-accent-coral font-bold'
                    : 'text-text-dim'
              "
            >
              {{
                isSpinning
                  ? 'SCANNING FOR SCAPEGOATS...'
                  : hasResult
                    ? 'TARGET LOCKED:'
                    : 'SYSTEM STANDBY:'
              }}
            </span>
            <Transition name="rapid" mode="out-in">
              <h2
                :key="currentDisplay.id"
                class="font-display text-4xl md:text-5xl font-black text-center wrap-break-word uppercase"
                :class="isSpinning ? 'text-text-primary' : currentDisplay.color"
              >
                {{ currentDisplay.target }}
              </h2>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="text-center animate-fade-up animate-delay-2 flex flex-col items-center">
        <button
          class="relative border border-accent-coral px-10 py-5 font-display text-xl tracking-widest transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
          :class="
            isSpinning
              ? 'bg-bg-surface text-text-dim border-border-default'
              : 'bg-accent-coral text-bg-deep shadow-[0_4px_20px_rgba(255,107,107,0.4)]'
          "
          :disabled="isSpinning"
          @click="fireBlame"
        >
          <span v-if="!isSpinning" class="relative z-10 flex items-center gap-2">
            ⚠️ FIRE ĐỔ LỖI THE HOLE!
          </span>
          <span v-else class="relative z-10 flex items-center gap-2 text-accent-coral">
            <span
              class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            ></span>
            TÌM KẾ TỘI ĐỒ...
          </span>
          <div
            v-if="!isSpinning"
            class="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"
          ></div>
        </button>
      </div>

      <!-- Kết quả hiển thị chửi -->
      <Transition name="slide-up">
        <div v-if="hasResult && !isSpinning" class="mt-12 animate-fade-up">
          <div class="border border-border-default bg-bg-surface p-6 md:p-8 relative">
            <span
              class="absolute -top-3 right-6 bg-accent-amber text-bg-deep px-3 py-0.5 font-display text-xs font-bold tracking-widest shadow-md"
            >
              {{ currentDisplay.title }}
            </span>
            <div class="flex flex-col md:flex-row gap-6 items-start">
              <div class="text-6xl md:text-8xl font-black text-border-default/30 select-none">
                "
              </div>
              <div class="flex-1 mt-2">
                <p
                  class="font-display text-xl md:text-2xl text-text-primary leading-relaxed italic"
                >
                  {{ currentDisplay.reason }}
                </p>
                <div
                  class="mt-6 flex items-center justify-between border-t border-border-default pt-4"
                >
                  <span class="font-display text-xs tracking-widest text-[#FF3E00]">
                    [ DO NOT ARGUE - ISSUE RESOLVED BY BLAME ]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <div class="flex gap-1.5 justify-center mt-16 animate-fade-up animate-delay-3">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { blames, type BlameItem } from './data/blames'

// State
const currentDisplay = ref<BlameItem>(blames[0]!)
const isSpinning = ref(false)
const hasResult = ref(false)
const sirenState = ref(false)

const getRandomItem = () => blames[Math.floor(Math.random() * blames.length)]!

const TOTAL_DURATION = 3500 // Quay trong 3.5s
const FLASH_INTERVAL = 60 // Tốc độ giật nhấp nháy cực nhanh chữ

let elapsed = 0

const { pause, resume } = useIntervalFn(
  () => {
    elapsed += FLASH_INTERVAL

    if (elapsed < TOTAL_DURATION - 800) {
      // Đảo item random liên tục
      currentDisplay.value = getRandomItem()
    } else if (elapsed > TOTAL_DURATION) {
      // Kết thúc
      pause()

      // Chọn ra kết quả cuối
      currentDisplay.value = getRandomItem()

      isSpinning.value = false
      hasResult.value = true
      sirenState.value = false // Tắt còi
    }
  },
  FLASH_INTERVAL,
  { immediate: false },
)

// Logic Quay
const fireBlame = () => {
  if (isSpinning.value) return

  isSpinning.value = true
  hasResult.value = false
  sirenState.value = true // Kích hoạt còi báo động nhấp nháy nền
  elapsed = 0

  resume()
}
</script>

<style scoped>
/* Hiệu ứng switch giật như máy tính nhiễu */
.rapid-enter-active,
.rapid-leave-active {
  transition:
    opacity 0.03s,
    filter 0.05s;
}

.rapid-enter-from,
.rapid-leave-to {
  opacity: 0.1;
  filter: blur(2px) contrast(200%);
  transform: scale(0.98);
}

.rapid-enter-to,
.rapid-leave-from {
  opacity: 1;
  filter: blur(0) contrast(100%);
  transform: scale(1);
  /* Removed !important */
}

.slide-up-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
