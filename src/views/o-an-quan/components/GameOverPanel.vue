<script setup lang="ts">
/**
 * GameOverPanel — Hiển thị kết quả cuối game
 */
import { Icon } from '@iconify/vue'

defineProps<{
  humanScore: number
  computerScore: number
  gameMessage: string
}>()

const emit = defineEmits<{
  (e: 'reset-game'): void
}>()
</script>

<template>
  <section class="mb-8 animate-fade-up">
    <div
      class="border-2 p-6 sm:p-8 text-center"
      :class="
        humanScore > computerScore
          ? 'border-accent-amber bg-accent-amber/5'
          : humanScore < computerScore
            ? 'border-accent-coral bg-accent-coral/5'
            : 'border-accent-sky bg-accent-sky/5'
      "
    >
      <!-- Icon -->
      <div class="mb-4">
        <Icon
          :icon="
            humanScore > computerScore
              ? 'lucide:trophy'
              : humanScore < computerScore
                ? 'lucide:frown'
                : 'lucide:handshake'
          "
          class="w-14 h-14 mx-auto"
          :class="
            humanScore > computerScore
              ? 'text-accent-amber'
              : humanScore < computerScore
                ? 'text-accent-coral'
                : 'text-accent-sky'
          "
        />
      </div>

      <!-- Thông báo -->
      <h2
        class="font-display text-3xl sm:text-4xl font-bold mb-4"
        :class="
          humanScore > computerScore
            ? 'text-accent-amber'
            : humanScore < computerScore
              ? 'text-accent-coral'
              : 'text-accent-sky'
        "
      >
        {{ humanScore > computerScore ? 'THẮNG!' : humanScore < computerScore ? 'THUA!' : 'HOÀ!' }}
      </h2>

      <!-- Điểm cuối cùng -->
      <div class="flex items-center justify-center gap-6 mb-6">
        <div class="text-center">
          <div class="text-text-dim text-xs font-display tracking-wide">BẠN</div>
          <div class="font-display text-4xl font-bold text-accent-coral tabular-nums">
            {{ humanScore }}
          </div>
        </div>
        <div class="text-text-dim text-2xl font-display">—</div>
        <div class="text-center">
          <div class="text-text-dim text-xs font-display tracking-wide">MÁY</div>
          <div class="font-display text-4xl font-bold text-accent-sky tabular-nums">
            {{ computerScore }}
          </div>
        </div>
      </div>

      <!-- Nút chơi lại -->
      <button
        class="px-10 py-4 bg-accent-coral text-bg-deep font-display font-bold text-lg tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-accent-coral/20 hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-3"
        @click="emit('reset-game')"
      >
        <Icon icon="lucide:refresh-cw" class="w-5 h-5" />
        CHƠI LẠI
      </button>
    </div>
  </section>
</template>
