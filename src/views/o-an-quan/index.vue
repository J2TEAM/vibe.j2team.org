<script setup lang="ts">
/**
 * Ô Ăn Quan — Trò chơi dân gian Việt Nam
 * Người chơi vs Máy trên bàn cờ 12 ô
 */
import { ref } from 'vue'
import BackToTop from '@/components/BackToTop.vue'
import GameHeader from './components/GameHeader.vue'
import BoardView from './components/BoardView.vue'
import DirectionPicker from './components/DirectionPicker.vue'
import GameOverPanel from './components/GameOverPanel.vue'
import MoveHistory from './components/MoveHistory.vue'
import { useOAnQuan } from './composables/useOAnQuan'
import type { CellIndex, Direction } from './composables/useOAnQuan'

const {
  board,
  currentPlayer,
  gamePhase,
  humanScore,
  computerScore,
  selectedCell,
  highlightedCell,
  lastCapturedCells,
  moveHistory,
  gameMessage,

  // Computed
  isPlayableCell,

  // Hằng số
  QUAN_LEFT,
  QUAN_RIGHT,

  // Hành động
  humanMove,
  resetGame,
} = useOAnQuan()

// --- State cho DirectionPicker ---
const showDirectionPicker = ref(false)
const pendingCell = ref<CellIndex | null>(null)

/** Khi người chơi click vào ô dân */
function handleSelectCell(cellIndex: CellIndex) {
  pendingCell.value = cellIndex
  showDirectionPicker.value = true
}

/** Khi chọn xong hướng đi */
function handleDirectionSelected(direction: Direction) {
  showDirectionPicker.value = false
  if (pendingCell.value !== null) {
    humanMove(pendingCell.value, direction)
    pendingCell.value = null
  }
}

/** Huỷ chọn hướng */
function handleDirectionCancel() {
  showDirectionPicker.value = false
  pendingCell.value = null
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <GameHeader
        :human-score="humanScore"
        :computer-score="computerScore"
        :game-message="gameMessage"
      />

      <!-- Dấu chấm phân cách -->
      <div class="flex justify-center gap-1.5 mb-6">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Bàn cờ -->
      <BoardView
        :board="board"
        :game-phase="gamePhase"
        :current-player="currentPlayer"
        :highlighted-cell="highlightedCell"
        :last-captured-cells="lastCapturedCells"
        :selected-cell="selectedCell"
        :quan-left="QUAN_LEFT"
        :quan-right="QUAN_RIGHT"
        :is-playable-cell="isPlayableCell"
        @select-cell="handleSelectCell"
      />

      <!-- Kết quả game over -->
      <GameOverPanel
        v-if="gamePhase === 'gameOver'"
        :human-score="humanScore"
        :computer-score="computerScore"
        :game-message="gameMessage"
        @reset-game="resetGame"
      />

      <!-- Lịch sử nước đi -->
      <MoveHistory :history="moveHistory" />

      <!-- Hướng dẫn chơi -->
      <section class="mb-8 animate-fade-up animate-delay-5">
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Luật chơi
        </h2>
        <div class="border border-border-default bg-bg-surface p-5">
          <ul class="space-y-3 text-text-secondary text-sm">
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">01</span>
              <span
                >Bàn cờ có <strong class="text-text-primary">12 ô</strong>: 2 ô
                <strong class="text-accent-amber">Quan</strong> (lớn) ở 2 đầu + 10 ô
                <strong class="text-text-primary">Dân</strong> (nhỏ).</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">02</span>
              <span
                >Mỗi ô nhỏ bắt đầu với <strong class="text-accent-coral">5 quân</strong>, ô Quan có
                <strong class="text-accent-amber">10 quân</strong>.</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">03</span>
              <span
                >Lượt của bạn: chọn 1 ô dân (phía dưới), chọn hướng rải
                <strong class="text-accent-amber">trái</strong> hoặc
                <strong class="text-accent-coral">phải</strong>.</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">04</span>
              <span
                >Nhặt hết quân trong ô, rải từng quân 1 vào các ô tiếp theo theo hướng đã
                chọn.</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">05</span>
              <span
                ><strong class="text-accent-amber">Ăn quân</strong>: khi rải xong, nếu ô tiếp theo
                trống → ăn hết quân ở ô sau đó. Tiếp tục nếu chuỗi ăn còn.</span
              >
            </li>
            <li class="flex items-start gap-3">
              <span class="text-accent-coral font-display font-bold text-xs mt-0.5">06</span>
              <span>Game kết thúc khi cả 2 ô Quan trống. Ai nhiều quân hơn → thắng!</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Dot divider -->
      <div class="flex justify-center gap-1.5 mb-6">
        <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Footer -->
      <footer class="text-center text-text-dim text-xs font-display tracking-wide mb-8">
        Ô ĂN QUAN — Trò chơi trí tuệ dân gian Việt Nam
      </footer>
    </div>

    <!-- Popup chọn hướng -->
    <DirectionPicker
      v-if="showDirectionPicker && pendingCell !== null"
      :cell-index="pendingCell"
      :stones="board[pendingCell!] ?? 0"
      @select-direction="handleDirectionSelected"
      @cancel="handleDirectionCancel"
    />

    <!-- Nút về đầu trang -->
    <BackToTop />
  </div>
</template>
