<script setup lang="ts">
// ──────────────────────────────────────────────
// ShuffleDeck — hiển thị bộ bài với hiệu ứng xào bài.
//
// Animation:
// - CSS keyframes với animation-delay so le cho mỗi lớp bài
// - GPU-accelerated: chỉ dùng transform (translate3d, rotate) và opacity
// - Không phụ thuộc GSAP — CSS thuần + JS tối thiểu để quản lý state
// ──────────────────────────────────────────────

import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useTarotStore } from '../stores/useTarotStore'
import { getCardBackUrl } from '../utils/cardImages'

const store = useTarotStore()

/** Số lớp bài hiển thị trong hình minh họa bộ bài */
const DECK_LAYERS = 7

/** Hiệu ứng xào đang chạy hay không */
const isShuffling = ref(false)

/** Bộ bài đã được xào ít nhất một lần chưa */
const hasShuffled = computed(() => store.shuffleCount > 0)

/** URL ảnh mặt sau lá bài */
const backImageUrl = computed(() => getCardBackUrl())

/**
 * Kích hoạt xào bài: chạy animation CSS, sau đó xào dữ liệu.
 * Animation chạy ~1.2s, sau đó kích hoạt nút "Rút Bài".
 */
async function handleShuffle() {
  if (isShuffling.value) return

  isShuffling.value = true
  store.setAnimating(true)

  // Xào dữ liệu ngay lập tức (animation chỉ là hiệu ứng thị giác)
  store.shuffle()

  // Chờ animation CSS kết thúc (~1200ms)
  await new Promise((resolve) => setTimeout(resolve, 1200))

  isShuffling.value = false
  store.setAnimating(false)
}

/** Chia ba lá bài và chuyển sang giao diện trải bài */
function handleDeal() {
  if (isShuffling.value) return
  store.dealCards()
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-6 py-12"
    role="region"
    aria-label="Bộ bài tarot — xào và rút bài"
  >
    <!-- Tiêu đề -->
    <div class="text-center mb-8 animate-fade-up">
      <h2
        class="font-display text-2xl font-semibold text-text-primary flex items-center justify-center gap-3"
      >
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Bộ Bài Đang Chờ Bạn
      </h2>
      <p class="mt-2 text-text-secondary text-sm">
        {{
          hasShuffled
            ? `Đã xào ${store.shuffleCount} lần. Xào tiếp hoặc rút bài.`
            : 'Xào bài để bắt đầu trải bài.'
        }}
      </p>
    </div>

    <!-- Hình minh họa bộ bài — các lớp bài xếp chồng -->
    <div
      class="relative mb-10 animate-fade-up animate-delay-1"
      :style="{ width: '180px', height: '270px' }"
      aria-hidden="true"
    >
      <div
        v-for="i in DECK_LAYERS"
        :key="i"
        class="deck-card absolute overflow-hidden border border-border-default bg-bg-deep"
        :class="{ 'deck-card-shuffling': isShuffling }"
        :style="{
          width: '160px',
          height: '256px',
          top: `${(DECK_LAYERS - i) * 2}px`,
          left: `${(DECK_LAYERS - i) * 2}px`,
          zIndex: i,
          animationDelay: isShuffling ? `${(i - 1) * 80}ms` : '0ms',
          '--shuffle-x': `${(i % 2 === 0 ? 1 : -1) * (20 + i * 12)}px`,
          '--shuffle-y': `${(i % 3 === 0 ? -1 : 1) * (10 + i * 5)}px`,
          '--shuffle-r': `${(i % 2 === 0 ? 1 : -1) * (5 + i * 2)}deg`,
        }"
      >
        <!-- Ảnh mặt sau trên lớp trên cùng -->
        <img
          v-if="backImageUrl"
          :src="backImageUrl"
          alt=""
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Nút hành động -->
    <div class="flex flex-col sm:flex-row items-center gap-4 animate-fade-up animate-delay-2">
      <!-- Nút Xào Bài -->
      <button
        class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-6 py-2.5 font-display text-sm tracking-wider uppercase text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep focus-visible:outline-2 focus-visible:outline-accent-coral focus-visible:outline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="isShuffling"
        :aria-label="`Xào bài${isShuffling ? ' — đang xào' : ''}`"
        @click="handleShuffle"
      >
        <Icon
          icon="lucide:shuffle"
          class="w-4 h-4 transition-transform duration-300"
          :class="{ 'animate-spin': isShuffling }"
        />
        {{ isShuffling ? 'Đang xào...' : 'Xào Bài' }}
      </button>

      <!-- Nút Rút Bài (chỉ hiện sau khi đã xào ít nhất 1 lần) -->
      <button
        v-if="hasShuffled"
        class="inline-flex items-center gap-2 border border-accent-amber bg-accent-amber/10 px-6 py-2.5 font-display text-sm tracking-wider uppercase text-accent-amber transition-all duration-300 hover:bg-accent-amber hover:text-bg-deep focus-visible:outline-2 focus-visible:outline-accent-amber focus-visible:outline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="isShuffling"
        aria-label="Rút ba lá bài cho trải bài"
        @click="handleDeal"
      >
        <Icon icon="lucide:hand" class="w-4 h-4" />
        Rút Bài
      </button>
    </div>
  </div>
</template>

<style scoped>
/*
 * Hiệu ứng xào bài — mỗi lớp bài xòe ra vị trí ngẫu nhiên
 * rồi quay về, tạo hiệu ứng xào trực quan.
 *
 * GPU acceleration: translate3d tự động promote lên compositor layer.
 */

.deck-card {
  transition:
    transform 0.3s ease-out,
    box-shadow 0.3s ease-out;
}

.deck-card-shuffling {
  animation: shuffle-fan 1.2s ease-in-out forwards;
}

@keyframes shuffle-fan {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  20% {
    transform: translate3d(var(--shuffle-x), var(--shuffle-y), 0) rotate(var(--shuffle-r));
    box-shadow: 0 4px 20px rgba(255, 107, 74, 0.15);
  }
  40% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  60% {
    transform: translate3d(calc(var(--shuffle-x) * -0.7), calc(var(--shuffle-y) * -0.8), 0)
      rotate(calc(var(--shuffle-r) * -0.8));
    box-shadow: 0 4px 20px rgba(255, 184, 48, 0.15);
  }
  80% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
    box-shadow: none;
  }
}
</style>
