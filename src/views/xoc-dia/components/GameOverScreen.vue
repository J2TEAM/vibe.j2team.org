<script setup lang="ts">
/**
 * GameOverScreen — Màn hình hết tiền
 */
import { Icon } from '@iconify/vue'
import type { GameStats } from '../composables/useXocDia'

defineProps<{
  stats: GameStats
}>()

const emit = defineEmits<{
  (e: 'reset-game'): void
}>()
</script>

<template>
  <section class="mb-8 animate-fade-up">
    <div class="border-2 border-accent-coral bg-accent-coral/5 p-8 sm:p-12 text-center">
      <!-- Icon -->
      <div class="mb-6">
        <Icon icon="lucide:wallet" class="w-16 h-16 text-accent-coral mx-auto opacity-50" />
      </div>

      <!-- Tiêu đề -->
      <h2 class="font-display text-3xl sm:text-4xl font-bold text-accent-coral mb-3">
        Hết xu rồi!
      </h2>
      <p class="text-text-secondary text-sm mb-8 max-w-sm mx-auto">
        Bạn đã chơi <span class="text-accent-amber font-bold">{{ stats.totalGames }}</span> ván,
        thắng <span class="text-accent-amber font-bold">{{ stats.wins }}</span> ván. Số dư cao nhất
        đạt được:
        <span class="text-accent-amber font-bold">{{
          stats.maxBalance.toLocaleString('vi-VN')
        }}</span>
        xu.
      </p>

      <!-- Nút chơi lại -->
      <button
        class="px-10 py-4 bg-accent-coral text-bg-deep font-display font-bold text-lg tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-accent-coral/20 hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-3"
        @click="emit('reset-game')"
      >
        <Icon icon="lucide:refresh-cw" class="w-5 h-5" />
        CHƠI LẠI TỪ ĐẦU
      </button>
    </div>
  </section>
</template>
