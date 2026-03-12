<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative overflow-hidden">
    <!-- Header -->
    <header
      class="w-full flex items-center justify-between px-6 py-4 border-b border-border-default animate-fade-up relative z-10"
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

    <main class="max-w-5xl mx-auto px-6 py-12 relative z-10">
      <!-- Tiêu đề chính -->
      <div class="text-center mb-12 animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight">
          <span class="text-accent-coral font-display text-sm tracking-widest block mb-2">//</span>
          <span class="text-text-primary">Stack_</span>
          <span class="text-accent-amber">Roulette</span>
        </h1>
        <p class="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
          Chơi roulette để xem số phận của project tiếp theo sẽ rơi vào tay Tech Stack nào.
        </p>
        <p class="mt-1 text-text-dim text-sm italic">
          "Đừng chọn tech stack dựa trên nhu cầu, hãy chọn mạo hiểm vì sự sống còn của CV."
        </p>
      </div>

      <!-- Khu vực Vòng Xoay (Roulette) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-up animate-delay-1">
        <!-- Vòng xoay Frontend -->
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group"
        >
          <span class="absolute top-2 left-3 font-display text-xs tracking-widest text-text-dim"
            >FRONTEND</span
          >
          <Transition name="spin" mode="out-in">
            <h2
              :key="currentFrontend.id"
              class="font-display text-3xl font-bold"
              :class="currentFrontend.color"
            >
              {{ currentFrontend.name }}
            </h2>
          </Transition>
        </div>

        <!-- Vòng xoay Backend -->
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group"
        >
          <span class="absolute top-2 left-3 font-display text-xs tracking-widest text-text-dim"
            >BACKEND</span
          >
          <Transition name="spin" mode="out-in">
            <h2
              :key="currentBackend.id"
              class="font-display text-3xl font-bold"
              :class="currentBackend.color"
            >
              {{ currentBackend.name }}
            </h2>
          </Transition>
        </div>

        <!-- Vòng xoay Database -->
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group"
        >
          <span class="absolute top-2 left-3 font-display text-xs tracking-widest text-text-dim"
            >DATABASE</span
          >
          <Transition name="spin" mode="out-in">
            <h2
              :key="currentDatabase.id"
              class="font-display text-3xl font-bold"
              :class="currentDatabase.color"
            >
              {{ currentDatabase.name }}
            </h2>
          </Transition>
        </div>
      </div>

      <!-- Action Button -->
      <div class="text-center animate-fade-up animate-delay-2 flex flex-col items-center">
        <button
          class="relative border border-accent-coral bg-bg-deep px-10 py-5 font-display text-xl tracking-widest text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          :class="isSpinning ? 'animate-pulse-border' : ''"
          :disabled="isSpinning"
          @click="spinRoulette"
        >
          <span v-if="!isSpinning" class="flex items-center gap-2">🔄 QUAY SỐ MỆNH</span>
          <span v-else class="flex items-center gap-2">
            <span
              class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            ></span>
            ĐANG CHỌN NGHIỆP...
          </span>
          <div
            class="absolute inset-0 bg-accent-coral opacity-0 group-hover:opacity-10 transition-opacity blur-lg pointer-events-none"
          ></div>
        </button>
      </div>

      <!-- Senior Review Section (Kết quả) -->
      <Transition name="fade-up">
        <div
          v-if="hasResult && !isSpinning"
          class="mt-16 border-t border-border-default pt-12 animate-fade-up"
        >
          <div class="border border-border-default bg-bg-surface p-6 relative">
            <span
              class="absolute -top-3 left-6 bg-bg-deep px-2 font-display text-xs tracking-widest text-accent-sky flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-accent-sky"></span>
              ĐÁNH GIÁ TỪ SENIOR
            </span>

            <div class="mt-4">
              <p
                class="font-display text-text-primary text-xl leading-relaxed italic border-l-2 border-accent-coral pl-4"
              >
                "{{ resultReview.review }}"
              </p>
            </div>

            <div class="mt-6 flex items-center justify-between border-t border-border-default pt-4">
              <!-- Độ hype / Đánh giá -->
              <div class="flex items-center gap-2">
                <span class="font-display text-xs tracking-widest text-text-dim"
                  >KHẢ NĂNG SỐNG SÓT:</span
                >
                <div class="flex gap-1 text-sm">
                  <span v-for="i in 5" :key="'s' + i">
                    {{ i <= resultReview.rating ? '🔥' : '➖' }}
                  </span>
                </div>
              </div>

              <div class="text-xs font-display text-text-dim tracking-widest">
                (BASED ON TRUE STORIES)
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <div class="flex gap-1.5 justify-center mt-16 animate-fade-up animate-delay-4">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { techStacks, getSeniorReview, type TechOption } from './data/stacks'

// Default khởi tạo (hiển thị gì đó ban đầu)
const currentFrontend = ref<TechOption>(techStacks.frontend[0]!)
const currentBackend = ref<TechOption>(techStacks.backend[0]!)
const currentDatabase = ref<TechOption>(techStacks.database[0]!)

const isSpinning = ref(false)
const hasResult = ref(false)
const resultReview = ref({ rating: 0, review: '' })

// Hàm tiện ích lấy random
const getRandomItem = (arr: TechOption[]) => arr[Math.floor(Math.random() * arr.length)]!

// Thực hiện hiệu ứng quay vòng slot machine
const spinRoulette = () => {
  if (isSpinning.value) return

  isSpinning.value = true
  hasResult.value = false

  const SPIN_DURATION = 2500 // tổng thời gian
  const INTERVAL = 100 // tốc độ đổi (ms)

  let elapsed = 0

  const intervalId = setInterval(() => {
    elapsed += INTERVAL

    // Thay đổi liên tục
    if (elapsed < SPIN_DURATION - 500) {
      currentFrontend.value = getRandomItem(techStacks.frontend)
      currentBackend.value = getRandomItem(techStacks.backend)
      currentDatabase.value = getRandomItem(techStacks.database)
    }

    // Kết thúc vòng quay
    if (elapsed >= SPIN_DURATION) {
      clearInterval(intervalId)
      isSpinning.value = false
      hasResult.value = true

      // Gọi logic đánh giá
      resultReview.value = getSeniorReview(
        currentFrontend.value.id,
        currentBackend.value.id,
        currentDatabase.value.id,
      )
    }
  }, INTERVAL)
}
</script>

<style scoped>
/* Hiệu ứng chuyển của slot machine (Roll) */
.spin-enter-active,
.spin-leave-active {
  transition: all 0.08s ease-in-out;
}

.spin-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.spin-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.fade-up-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
