<script setup lang="ts">
/**
 * ResultOverlay — Hiển thị kết quả thắng/thua sau mỗi ván
 */
import { Icon } from '@iconify/vue'
import type { GameResult } from '../composables/useXocDia'

defineProps<{
  result: GameResult
  balance: number
}>()

const emit = defineEmits<{
  (e: 'new-round'): void
  (e: 'reset-game'): void
}>()
</script>

<template>
  <section class="mb-8 animate-fade-up">
    <div
      class="border-2 p-6 sm:p-8 text-center transition-all duration-300"
      :class="
        result.won
          ? 'border-accent-amber bg-accent-amber/5'
          : 'border-accent-coral bg-accent-coral/5'
      "
    >
      <!-- Icon kết quả -->
      <div class="mb-4">
        <div
          class="inline-flex items-center justify-center w-16 h-16 mb-2"
          :class="result.won ? 'text-accent-amber' : 'text-accent-coral'"
        >
          <Icon :icon="result.won ? 'lucide:trophy' : 'lucide:frown'" class="w-12 h-12" />
        </div>
      </div>

      <!-- Thông báo -->
      <h2
        class="font-display text-3xl sm:text-4xl font-bold mb-2"
        :class="result.won ? 'text-accent-amber' : 'text-accent-coral'"
      >
        {{ result.won ? 'THẮNG!' : 'THUA!' }}
      </h2>

      <!-- Chi tiết kết quả -->
      <div class="space-y-2 mb-6">
        <p class="text-text-secondary text-sm">
          Kết quả:
          <span
            class="font-display font-bold"
            :class="result.isEven ? 'text-accent-coral' : 'text-accent-sky'"
          >
            {{ result.isEven ? 'CHẴN' : 'LẺ' }}
          </span>
          <span class="text-text-dim">
            ({{ result.upCount }} ngửa, {{ result.downCount }} úp)
          </span>
        </p>
        <p class="text-text-secondary text-sm">
          Bạn đặt:
          <span
            class="font-display font-semibold"
            :class="result.betType === 'chan' ? 'text-accent-coral' : 'text-accent-sky'"
          >
            {{ result.betType === 'chan' ? 'CHẴN' : 'LẺ' }}
          </span>
        </p>
        <p
          class="font-display text-2xl font-bold tabular-nums"
          :class="result.won ? 'text-accent-amber' : 'text-accent-coral'"
        >
          {{ result.won ? '+' : '' }}{{ result.payout.toLocaleString('vi-VN') }} xu
        </p>
      </div>

      <!-- Nút hành động -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          v-if="balance >= 10"
          class="w-full sm:w-auto px-8 py-3 font-display font-bold text-sm tracking-wide bg-accent-coral text-bg-deep transition-all duration-300 hover:shadow-lg hover:shadow-accent-coral/20 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          @click="emit('new-round')"
        >
          <Icon icon="lucide:rotate-ccw" class="w-4 h-4" />
          CHƠI TIẾP
        </button>
        <button
          v-else
          class="w-full sm:w-auto px-8 py-3 font-display font-bold text-sm tracking-wide bg-accent-amber text-bg-deep transition-all duration-300 hover:shadow-lg hover:shadow-accent-amber/20 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          @click="emit('reset-game')"
        >
          <Icon icon="lucide:refresh-cw" class="w-4 h-4" />
          CHƠI LẠI TỪ ĐẦU
        </button>
      </div>
    </div>
  </section>
</template>
