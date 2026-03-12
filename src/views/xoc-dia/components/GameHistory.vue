<script setup lang="ts">
/**
 * GameHistory — Lịch sử các ván đã chơi + thống kê tổng quan
 */
import { Icon } from '@iconify/vue'
import type { GameResult, GameStats } from '../composables/useXocDia'

defineProps<{
  history: GameResult[]
  stats: GameStats
}>()
</script>

<template>
  <section v-if="history.length > 0" class="mb-8">
    <!-- Thống kê tổng quan -->
    <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3">
      <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
      Thống kê
    </h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <!-- Tổng ván -->
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <div class="font-display text-2xl font-bold text-text-primary tabular-nums">
          {{ stats.totalGames }}
        </div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">TỔNG VÁN</div>
      </div>

      <!-- Tỉ lệ thắng -->
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <div
          class="font-display text-2xl font-bold tabular-nums"
          :class="stats.winRate >= 50 ? 'text-accent-amber' : 'text-accent-coral'"
        >
          {{ stats.winRate }}%
        </div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">TỈ LỆ THẮNG</div>
      </div>

      <!-- Chuỗi hiện tại -->
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <div
          class="font-display text-2xl font-bold tabular-nums"
          :class="
            stats.currentStreak > 0
              ? 'text-accent-amber'
              : stats.currentStreak < 0
                ? 'text-accent-coral'
                : 'text-text-primary'
          "
        >
          {{ stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak }}
        </div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">STREAK</div>
      </div>

      <!-- Cao nhất -->
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <div class="font-display text-2xl font-bold text-accent-amber tabular-nums">
          {{ stats.maxBalance.toLocaleString('vi-VN') }}
        </div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">CAO NHẤT</div>
      </div>
    </div>

    <!-- Lịch sử các ván -->
    <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3">
      <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
      Lịch sử
    </h2>
    <div
      class="border border-border-default bg-bg-surface divide-y divide-border-default max-h-64 overflow-y-auto"
    >
      <div
        v-for="(game, index) in history"
        :key="index"
        class="flex items-center justify-between px-4 py-3 transition-colors hover:bg-bg-elevated"
      >
        <div class="flex items-center gap-3">
          <!-- Icon thắng/thua -->
          <div
            class="w-7 h-7 flex items-center justify-center flex-shrink-0"
            :class="game.won ? 'text-accent-amber' : 'text-accent-coral'"
          >
            <Icon :icon="game.won ? 'lucide:check-circle' : 'lucide:x-circle'" class="w-5 h-5" />
          </div>

          <!-- Kết quả đồng xu -->
          <div class="flex gap-1">
            <span
              v-for="(coin, ci) in game.coins"
              :key="ci"
              class="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold"
              :class="
                coin === 'up'
                  ? 'bg-accent-coral/20 text-accent-coral'
                  : 'bg-accent-sky/20 text-accent-sky'
              "
            >
              {{ coin === 'up' ? '☀' : '☾' }}
            </span>
          </div>

          <!-- Cược gì -->
          <span
            class="text-xs font-display"
            :class="game.betType === 'chan' ? 'text-accent-coral' : 'text-accent-sky'"
          >
            {{ game.betType === 'chan' ? 'Chẵn' : 'Lẻ' }}
          </span>
        </div>

        <!-- Số tiền thắng/thua -->
        <span
          class="font-display font-bold text-sm tabular-nums"
          :class="game.won ? 'text-accent-amber' : 'text-accent-coral'"
        >
          {{ game.won ? '+' : '' }}{{ game.payout }}
        </span>
      </div>
    </div>
  </section>
</template>
