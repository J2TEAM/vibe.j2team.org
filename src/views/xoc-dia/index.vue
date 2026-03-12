<script setup lang="ts">
/**
 * Xóc Đĩa — Trò chơi xóc đĩa truyền thống
 * Người chơi vs Máy: đặt cược Chẵn/Lẻ, xóc bát và xem kết quả
 */
import BackToTop from '@/components/BackToTop.vue'
import GameHeader from './components/GameHeader.vue'
import BettingPanel from './components/BettingPanel.vue'
import DishArea from './components/DishArea.vue'
import ResultOverlay from './components/ResultOverlay.vue'
import GameHistory from './components/GameHistory.vue'
import GameOverScreen from './components/GameOverScreen.vue'
import { useXocDia } from './composables/useXocDia'

const {
  // Trạng thái
  balance,
  betAmount,
  betType,
  gamePhase,
  coins,
  lastResult,
  history,
  stats,

  // Computed
  canBet,
  isGameOver,

  // Hằng số
  MIN_BET,
  MAX_BET,
  BET_PRESETS,

  // Hành động
  placeBet,
  setBetAmount,
  shake,
  newRound,
  resetGame,
} = useXocDia()

// Xử lý xóc đĩa
async function handleShake() {
  try {
    await shake()
  } catch {
    // Bỏ qua lỗi khi không thể đặt cược
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <!-- Header: logo, tên, số dư -->
      <GameHeader :balance="balance" />

      <!-- Dấu chấm phân cách -->
      <div class="flex justify-center gap-1.5 mb-8">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Panel đặt cược (chỉ hiện khi đang ở phase betting và chưa hết tiền) -->
      <BettingPanel
        v-if="gamePhase === 'betting' && !isGameOver"
        :bet-type="betType"
        :bet-amount="betAmount"
        :balance="balance"
        :can-bet="canBet"
        :min-bet="MIN_BET"
        :max-bet="MAX_BET"
        :bet-presets="BET_PRESETS"
        @place-bet="placeBet"
        @set-amount="setBetAmount"
        @shake="handleShake"
      />

      <!-- Khu vực bát đĩa (luôn hiển thị) -->
      <DishArea :coins="coins" :game-phase="gamePhase" />

      <!-- Hiển thị kết quả thắng/thua -->
      <ResultOverlay
        v-if="gamePhase === 'result' && lastResult"
        :result="lastResult"
        :balance="balance"
        @new-round="newRound"
        @reset-game="resetGame"
      />

      <!-- Giao diện hết tiền -->
      <GameOverScreen v-if="isGameOver" :stats="stats" @reset-game="resetGame" />

      <!-- Lịch sử & thống kê -->
      <GameHistory :history="history" :stats="stats" />

      <!-- Hướng dẫn chơi -->
      <section class="mb-8">
        <h2
          class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Luật chơi
        </h2>
        <div class="border border-border-default bg-bg-surface p-5">
          <ul class="space-y-3 text-text-secondary text-sm">
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">01</span>
              <span
                >Chọn <strong class="text-accent-coral">Chẵn</strong> hoặc
                <strong class="text-accent-sky">Lẻ</strong>, rồi chọn số tiền cược.</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">02</span>
              <span
                >Nhấn <strong class="text-text-primary">XÓC ĐĨA</strong> — máy sẽ tung 4 đồng xu
                ngẫu nhiên.</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">03</span>
              <span
                ><strong class="text-accent-coral">Chẵn</strong> = 0, 2 hoặc 4 mặt ngửa.
                <strong class="text-accent-sky">Lẻ</strong> = 1 hoặc 3 mặt ngửa.</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">04</span>
              <span
                >Đoán đúng: <strong class="text-accent-amber">×2</strong> tiền cược. Sai: mất tiền
                cược.</span
              >
            </li>
          </ul>
        </div>
      </section>

      <!-- Decorative dot divider -->
      <div class="flex justify-center gap-1.5 mb-6">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Footer credit -->
      <footer class="text-center text-text-dim text-xs font-display tracking-wide mb-8">
        XÓC ĐĨA — Trò chơi dân gian Việt Nam
      </footer>
    </div>

    <!-- Nút về đầu trang -->
    <BackToTop />
  </div>
</template>
