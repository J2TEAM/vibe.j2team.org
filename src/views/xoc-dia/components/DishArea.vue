<script setup lang="ts">
/**
 * DishArea — Khu vực bát đĩa: hiển thị 4 đồng xu + animation xóc
 */
import { computed } from 'vue'
import type { CoinFace, GamePhase } from '../composables/useXocDia'

const props = defineProps<{
  coins: CoinFace[]
  gamePhase: GamePhase
}>()

// Tính trạng thái hiển thị mỗi đồng xu
const visibleCoins = computed(() => {
  if (props.gamePhase === 'betting') {
    // Trạng thái chờ — hiện 4 xu ngửa placeholder
    return props.coins.map(() => ({ face: 'hidden' as const, visible: true }))
  }
  if (props.gamePhase === 'shaking') {
    return props.coins.map(() => ({ face: 'hidden' as const, visible: false }))
  }
  // revealing hoặc result — hiện kết quả thực
  return props.coins.map((face) => ({ face, visible: true }))
})
</script>

<template>
  <section class="mb-8">
    <!-- Bát đĩa -->
    <div class="relative flex items-center justify-center">
      <!-- Viền trang trí bát -->
      <div class="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        <!-- Vòng tròn ngoài -->
        <div
          class="absolute inset-0 border-2 rounded-full transition-colors duration-500"
          :class="
            gamePhase === 'shaking'
              ? 'border-accent-coral animate-pulse'
              : gamePhase === 'result'
                ? 'border-accent-amber'
                : 'border-border-default'
          "
        />

        <!-- Vòng tròn trong -->
        <div
          class="absolute inset-4 border rounded-full transition-colors duration-500"
          :class="gamePhase === 'shaking' ? 'border-accent-coral/30' : 'border-border-default/50'"
        />

        <!-- Nền bát -->
        <div
          class="absolute inset-8 rounded-full transition-all duration-500"
          :class="gamePhase === 'shaking' ? 'bg-accent-coral/5' : 'bg-bg-surface'"
        />

        <!-- Animation xóc (3 dấu chấm nhảy) -->
        <div
          v-if="gamePhase === 'shaking'"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div class="flex gap-2">
            <div
              class="w-3 h-3 bg-accent-coral rounded-full xoc-bounce"
              style="animation-delay: 0ms"
            />
            <div
              class="w-3 h-3 bg-accent-amber rounded-full xoc-bounce"
              style="animation-delay: 150ms"
            />
            <div
              class="w-3 h-3 bg-accent-sky rounded-full xoc-bounce"
              style="animation-delay: 300ms"
            />
          </div>
          <p
            class="absolute bottom-[25%] font-display text-sm text-text-secondary tracking-wide animate-pulse"
          >
            Đang xóc...
          </p>
        </div>

        <!-- 4 đồng xu -->
        <div v-if="gamePhase !== 'shaking'" class="relative z-10 grid grid-cols-2 gap-4 sm:gap-5">
          <div
            v-for="(coin, index) in visibleCoins"
            :key="index"
            class="coin-wrapper"
            :style="{ animationDelay: `${index * 120}ms` }"
            :class="{
              'coin-reveal': gamePhase === 'revealing' || gamePhase === 'result',
              'coin-idle': gamePhase === 'betting',
            }"
          >
            <!-- Hình dáng đồng xu -->
            <div
              class="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 flex items-center justify-center transition-all duration-300 font-display text-2xl sm:text-3xl font-bold select-none"
              :class="coinClass(coin.face)"
            >
              <span v-if="coin.face === 'up'">&#9728;</span>
              <span v-else-if="coin.face === 'down'" class="text-lg sm:text-xl">&#9790;</span>
              <span v-else class="text-text-dim text-lg">?</span>
            </div>
            <!-- Label bên dưới -->
            <div
              v-if="(gamePhase === 'revealing' || gamePhase === 'result') && coin.face !== 'hidden'"
              class="text-center mt-1.5 text-xs font-display tracking-wide"
              :class="coin.face === 'up' ? 'text-accent-coral' : 'text-accent-sky'"
            >
              {{ coin.face === 'up' ? 'Ngửa' : 'Úp' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
// Hàm tính class cho đồng xu dựa trên mặt
function coinClass(face: 'up' | 'down' | 'hidden') {
  switch (face) {
    case 'up':
      return 'border-accent-coral bg-accent-coral/10 text-accent-coral shadow-lg shadow-accent-coral/20'
    case 'down':
      return 'border-accent-sky bg-accent-sky/10 text-accent-sky shadow-lg shadow-accent-sky/20'
    default:
      return 'border-border-default bg-bg-elevated text-text-dim'
  }
}
</script>

<style scoped>
/* Animation bounce khi xóc */
@keyframes xoc-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
}

.xoc-bounce {
  animation: xoc-bounce 0.8s ease-in-out infinite;
}

/* Animation reveal đồng xu */
@keyframes coin-pop {
  0% {
    opacity: 0;
    transform: scale(0.3) rotateY(180deg);
  }
  60% {
    transform: scale(1.15) rotateY(0deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateY(0deg);
  }
}

.coin-reveal {
  animation: coin-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.coin-idle {
  animation: none;
}

/* Custom size cho mobile */
@media (min-width: 640px) {
  .sm\:w-18 {
    width: 4.5rem;
  }
  .sm\:h-18 {
    height: 4.5rem;
  }
}
</style>
