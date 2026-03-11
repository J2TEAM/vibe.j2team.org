<script setup lang="ts">
// ──────────────────────────────────────────────
// Trải Bài Tarot — component trang chính.
//
// Điều phối ba giai đoạn:
//   1. Landing  — màn hình giới thiệu với CTA
//   2. Deck     — xào bài và rút bài
//   3. Spread   — trải ba lá bài với lật & lời giải
//
// Sử dụng Pinia store (useTarotStore) để quản lý state.
// Tất cả chuyển tiếp dùng CSS animation cho GPU-accelerated.
// ──────────────────────────────────────────────

import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useTarotStore } from './stores/useTarotStore'
import LandingScreen from './components/LandingScreen.vue'
import ShuffleDeck from './components/ShuffleDeck.vue'
import ThreeCardSpread from './components/ThreeCardSpread.vue'
import ReadingSynthesis from './components/ReadingSynthesis.vue'

const store = useTarotStore()
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Thanh điều hướng -->
    <nav class="flex items-center justify-between px-6 py-4 border-b border-border-default/50">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-text-secondary text-sm transition-all duration-300 hover:text-accent-coral focus-visible:outline-2 focus-visible:outline-accent-coral focus-visible:outline-offset-4"
        aria-label="Quay về trang chủ"
      >
        <Icon icon="lucide:arrow-left" class="w-4 h-4" />
        <span class="hidden sm:inline">Trang chủ</span>
      </RouterLink>

      <!-- Tên trang (hiển thị khi không ở landing) -->
      <span
        v-if="store.phase !== 'landing'"
        class="font-display text-sm tracking-wider uppercase text-text-dim"
      >
        Trải Bài Tarot
      </span>

      <!-- Nút làm lại (hiển thị khi không ở landing) -->
      <button
        v-if="store.phase !== 'landing'"
        class="inline-flex items-center gap-1.5 text-text-dim text-xs font-display tracking-wider uppercase transition-colors hover:text-accent-coral focus-visible:outline-2 focus-visible:outline-accent-coral focus-visible:outline-offset-4"
        aria-label="Bắt đầu lại từ đầu"
        @click="store.reset()"
      >
        <Icon icon="lucide:rotate-ccw" class="w-3.5 h-3.5" />
        Làm lại
      </button>

      <!-- Spacer khi ở landing (để cân bằng flex layout) -->
      <div v-if="store.phase === 'landing'" class="w-16" />
    </nav>

    <!-- Nội dung chính — chuyển tiếp giữa các giai đoạn -->
    <main>
      <Transition name="phase" mode="out-in">
        <!-- Giai đoạn 1: Màn hình giới thiệu -->
        <LandingScreen
          v-if="store.phase === 'landing'"
          key="landing"
          @start="store.startReading()"
        />

        <!-- Giai đoạn 2: Xào bài & rút bài -->
        <ShuffleDeck v-else-if="store.phase === 'deck'" key="deck" />

        <!-- Giai đoạn 3: Trải ba lá bài + lời giải -->
        <div v-else-if="store.phase === 'spread'" key="spread">
          <ThreeCardSpread />
          <ReadingSynthesis @reset="store.reset()" />
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
/*
 * Chuyển tiếp giữa các giai đoạn — crossfade mượt mà.
 * Dùng opacity + translate nhẹ cho cảm giác tinh tế.
 * GPU-accelerated: chỉ animate opacity và transform.
 */
.phase-enter-active,
.phase-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.phase-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.phase-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
