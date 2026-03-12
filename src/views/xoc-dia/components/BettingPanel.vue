<script setup lang="ts">
/**
 * BettingPanel — Panel đặt cược: chọn Chẵn/Lẻ + chọn số tiền + nút Xóc
 */
import { Icon } from '@iconify/vue'
import type { BetType } from '../composables/useXocDia'

defineProps<{
  betType: BetType | null
  betAmount: number
  balance: number
  canBet: boolean
  minBet: number
  maxBet: number
  betPresets: number[]
}>()

const emit = defineEmits<{
  (e: 'place-bet', type: BetType): void
  (e: 'set-amount', amount: number): void
  (e: 'shake'): void
}>()
</script>

<template>
  <section class="mb-8 animate-fade-up animate-delay-4">
    <!-- Chọn Chẵn / Lẻ -->
    <div class="mb-6">
      <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3">
        <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
        Đặt cược
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <!-- Nút CHẴN -->
        <button
          class="relative group border-2 p-5 sm:p-6 transition-all duration-300 cursor-pointer overflow-hidden"
          :class="
            betType === 'chan'
              ? 'border-accent-coral bg-accent-coral/10 shadow-lg shadow-accent-coral/10'
              : 'border-border-default bg-bg-surface hover:border-accent-coral/50 hover:bg-bg-elevated'
          "
          @click="emit('place-bet', 'chan')"
        >
          <!-- Số nền trang trí -->
          <span
            class="absolute top-2 right-3 font-display text-5xl sm:text-6xl font-bold select-none pointer-events-none transition-colors"
            :class="betType === 'chan' ? 'text-accent-coral/10' : 'text-accent-coral/5'"
          >
            偶
          </span>
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-8 h-8 flex items-center justify-center transition-colors"
                :class="
                  betType === 'chan'
                    ? 'bg-accent-coral text-bg-deep'
                    : 'bg-bg-elevated text-text-secondary'
                "
              >
                <Icon icon="lucide:circle-dot" class="w-5 h-5" />
              </div>
              <span
                class="font-display text-2xl sm:text-3xl font-bold"
                :class="betType === 'chan' ? 'text-accent-coral' : 'text-text-primary'"
              >
                CHẴN
              </span>
            </div>
            <p class="text-text-dim text-xs">0, 2 hoặc 4 mặt ngửa</p>
          </div>
        </button>

        <!-- Nút LẺ -->
        <button
          class="relative group border-2 p-5 sm:p-6 transition-all duration-300 cursor-pointer overflow-hidden"
          :class="
            betType === 'le'
              ? 'border-accent-sky bg-accent-sky/10 shadow-lg shadow-accent-sky/10'
              : 'border-border-default bg-bg-surface hover:border-accent-sky/50 hover:bg-bg-elevated'
          "
          @click="emit('place-bet', 'le')"
        >
          <span
            class="absolute top-2 right-3 font-display text-5xl sm:text-6xl font-bold select-none pointer-events-none transition-colors"
            :class="betType === 'le' ? 'text-accent-sky/10' : 'text-accent-sky/5'"
          >
            奇
          </span>
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-8 h-8 flex items-center justify-center transition-colors"
                :class="
                  betType === 'le'
                    ? 'bg-accent-sky text-bg-deep'
                    : 'bg-bg-elevated text-text-secondary'
                "
              >
                <Icon icon="lucide:diamond" class="w-5 h-5" />
              </div>
              <span
                class="font-display text-2xl sm:text-3xl font-bold"
                :class="betType === 'le' ? 'text-accent-sky' : 'text-text-primary'"
              >
                LẺ
              </span>
            </div>
            <p class="text-text-dim text-xs">1 hoặc 3 mặt ngửa</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Chọn số tiền cược -->
    <div class="mb-6">
      <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3">
        <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
        Số tiền cược
      </h2>
      <div class="border border-border-default bg-bg-surface p-4">
        <!-- Preset buttons -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="preset in betPresets"
            :key="preset"
            class="border px-4 py-2 text-sm font-display font-semibold transition-all duration-200 cursor-pointer"
            :class="
              betAmount === preset
                ? 'border-accent-amber bg-accent-amber/15 text-accent-amber'
                : preset > balance
                  ? 'border-border-default text-text-dim opacity-50 cursor-not-allowed'
                  : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-accent-amber bg-bg-elevated'
            "
            :disabled="preset > balance"
            @click="emit('set-amount', preset)"
          >
            {{ preset }}
          </button>
        </div>

        <!-- Hiển thị số tiền hiện tại -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-dim">Đặt cược:</span>
          <span class="font-display font-bold text-accent-amber text-lg tabular-nums">
            {{ betAmount }} <span class="text-text-dim text-xs">xu</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Nút XÓC -->
    <button
      class="w-full py-4 font-display text-xl font-bold tracking-wide transition-all duration-300 cursor-pointer relative overflow-hidden"
      :class="
        canBet
          ? 'bg-accent-coral text-bg-deep hover:shadow-lg hover:shadow-accent-coral/20 hover:-translate-y-0.5 active:translate-y-0'
          : 'bg-bg-elevated text-text-dim cursor-not-allowed'
      "
      :disabled="!canBet"
      @click="emit('shake')"
    >
      <span class="relative z-10 flex items-center justify-center gap-3">
        <Icon icon="lucide:disc-3" class="w-6 h-6" />
        XÓC ĐĨA
      </span>
    </button>

    <!-- Gợi ý nếu chưa chọn bên -->
    <p v-if="!betType" class="text-center text-text-dim text-xs mt-3">
      ← Chọn <span class="text-accent-coral">Chẵn</span> hoặc
      <span class="text-accent-sky">Lẻ</span> để bắt đầu
    </p>
  </section>
</template>
