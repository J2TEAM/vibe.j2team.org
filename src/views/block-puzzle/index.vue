<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '@unhead/vue'
import GameBoard from './components/GameBoard.vue'
import BlockTray from './components/BlockTray.vue'
import ScoreDisplay from './components/ScoreDisplay.vue'
import GameOverModal from './components/GameOverModal.vue'
import { useGameEngine } from './composables/useGameEngine'
import { useAudio } from './composables/useAudio'

useHead({
  title: 'Block Puzzle',
  meta: [
    {
      name: 'description',
      content: 'A polished browser puzzle game where you drag blocks to clear rows and columns.',
    },
  ],
})

const {
  board,
  score,
  highScore,
  isGameOver,
  blocks,
  clearingRows,
  clearingCols,
  lastPlacedBlockId,
  tryPlaceBlock,
  restart,
  canPlace,
} = useGameEngine()
const { playClick } = useAudio()

// Drag and drop state
const draggingBlockIndex = ref<number | null>(null)
const dragPreviewPosition = ref<{ row: number; col: number } | null>(null)

const canDropAtPreview = computed(() => {
  if (draggingBlockIndex.value === null || !dragPreviewPosition.value) {
    return false
  }

  return canPlace(
    draggingBlockIndex.value,
    dragPreviewPosition.value.row,
    dragPreviewPosition.value.col,
  )
})

function handleBlockDragStart(blockIndex: number) {
  draggingBlockIndex.value = blockIndex
  dragPreviewPosition.value = null
}

function handleBlockDragEnd() {
  draggingBlockIndex.value = null
  dragPreviewPosition.value = null
}

function handleBoardPlaceBlock(blockIndex: number, row: number, col: number) {
  playClick()
  tryPlaceBlock(blockIndex, row, col)
  draggingBlockIndex.value = null
  dragPreviewPosition.value = null
}

function handleRestart() {
  restart()
  playClick()
}

function handlePreviewUpdate(row: number, col: number) {
  dragPreviewPosition.value = { row, col }
}
</script>

<template>
  <div class="page-container">
    <div class="header-section animate-fade-up">
      <div class="header-title-wrap">
        <p class="eyebrow">// Puzzle</p>
        <h1 class="page-title">Block Puzzle</h1>
      </div>
      <RouterLink to="/" class="home-button">
        <span class="text-accent-sky">←</span>
        Back
      </RouterLink>
    </div>

    <div class="game-container animate-fade-up animate-delay-1">
      <div class="game-layout">
        <section class="play-area">
          <ScoreDisplay :score="score" :high-score="highScore" />

          <div class="board-wrap">
            <GameBoard
              :board="board"
              :blocks="blocks"
              :clearing-rows="clearingRows"
              :clearing-cols="clearingCols"
              :last-placed-block-id="lastPlacedBlockId"
              :dragging-block-index="draggingBlockIndex"
              :drag-preview-position="dragPreviewPosition"
              :can-preview-place="canDropAtPreview"
              @place-block="handleBoardPlaceBlock"
              @update-preview="handlePreviewUpdate"
            />
          </div>

          <p v-if="draggingBlockIndex !== null" class="drag-hint">
            <span class="hint-valid">Green</span> means valid drop.
            <span class="hint-invalid">Red</span> means invalid drop.
          </p>
        </section>

        <aside class="side-area">
          <BlockTray
            :blocks="blocks"
            :can-place-block="canPlace"
            @drag-start="handleBlockDragStart"
            @drag-end="handleBlockDragEnd"
          />

          <div class="controls">
            <button class="restart-button" @click="handleRestart">
              <span>↻</span>
              New Game
            </button>
          </div>

          <div class="quick-tip">
            <p class="quick-tip-title">// Pro Tip</p>
            <p class="quick-tip-text">
              Keep space near the center to avoid getting locked out by long blocks.
            </p>
          </div>
        </aside>
      </div>
    </div>

    <!-- Instructions -->
    <div class="instructions-section animate-fade-up animate-delay-2">
      <h2 class="section-heading">
        <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
        How to Play
      </h2>
      <ul class="instruction-list">
        <li><strong>Drag blocks</strong> from the tray to the game board</li>
        <li><strong>Complete rows or columns</strong> to clear them and earn points</li>
        <li><strong>Keep pieces moving</strong> until no blocks fit on the board</li>
        <li>+10 points per tile placed</li>
        <li>+100 points per line cleared</li>
        <li>Bonus points for clearing multiple lines at once!</li>
      </ul>
    </div>

    <!-- Game Over Modal -->
    <GameOverModal
      :score="score"
      :high-score="highScore"
      :is-showing="isGameOver"
      @restart-game="handleRestart"
    />
  </div>
</template>

<style scoped lang="css">
.page-container {
  min-height: 100vh;
  background: #0f1923;
  color: #f0ede6;
  padding: 20px 14px 40px;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

.header-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.eyebrow {
  margin: 0;
  font-family: 'Anybody', sans-serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffb830;
}

.home-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #162232;
  border: 1px solid #253549;
  color: #38bdf8;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}

.home-button:hover {
  border-color: #38bdf8;
  transform: translateX(-2px);
}

.page-title {
  font-family: 'Anybody', sans-serif;
  font-size: clamp(1.5rem, 3.6vw, 2.2rem);
  font-weight: 700;
  color: #ff6b4a;
  text-transform: uppercase;
  margin: 0;
  letter-spacing: 0.04em;
}

.game-container {
  max-width: 1100px;
  margin: 0 auto 36px;
}

.game-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.play-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(180deg, rgba(22, 34, 50, 0.85), rgba(15, 25, 35, 0.95));
  border: 1px solid #253549;
  padding: 14px;
}

.board-wrap {
  padding: 10px;
  border: 1px solid #253549;
  background: #0f1923;
}

.side-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drag-hint {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: #8b9db5;
  min-height: 18px;
}

.hint-valid {
  color: #34d399;
  font-weight: 600;
  margin-right: 4px;
}

.hint-invalid {
  color: #f87171;
  font-weight: 600;
  margin-left: 10px;
  margin-right: 4px;
}

.controls {
  display: flex;
  gap: 8px;
}

.restart-button {
  flex: 1;
  padding: 12px 16px;
  background: #ff6b4a;
  color: white;
  border: none;
  font-family: 'Anybody', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.restart-button:hover {
  background: #ff5533;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 74, 0.3);
}

.restart-button:active {
  transform: translateY(0);
}

.quick-tip {
  border: 1px solid #253549;
  background: #162232;
  padding: 12px;
}

.quick-tip-title {
  margin: 0 0 6px;
  font-family: 'Anybody', sans-serif;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffb830;
}

.quick-tip-text {
  margin: 0;
  color: #8b9db5;
  font-size: 13px;
  line-height: 1.5;
}

.instructions-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #162232;
  border: 1px solid #253549;
}

.section-heading {
  font-family: 'Anybody', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #f0ede6;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.instruction-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: #8b9db5;
  line-height: 1.6;
}

.instruction-list li {
  padding-left: 24px;
  position: relative;
}

.instruction-list li::before {
  content: '▪';
  position: absolute;
  left: 0;
  color: #ffb830;
}

.instruction-list strong {
  color: #f0ede6;
  font-weight: 600;
}

/* Animations */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fadeUp 0.6s ease-out forwards;
  opacity: 0;
}

.animate-delay-1 {
  animation-delay: 100ms;
}

.animate-delay-2 {
  animation-delay: 200ms;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .page-container {
    padding: 16px 10px 26px;
  }

  .header-section {
    margin-bottom: 14px;
  }

  .home-button {
    font-size: 12px;
    padding: 7px 10px;
  }

  .page-title {
    font-size: 24px;
  }

  .game-layout {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .play-area,
  .board-wrap,
  .quick-tip,
  .instructions-section {
    padding: 10px;
  }

  .instruction-list {
    font-size: 13px;
  }

  .drag-hint {
    font-size: 11px;
  }
}

@media (min-width: 481px) and (max-width: 960px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
}
</style>
