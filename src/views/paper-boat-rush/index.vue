<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import PaperBoatRushBoard from './components/PaperBoatRushBoard.vue'
import PaperBoatRushSidebar from './components/PaperBoatRushSidebar.vue'
import { usePaperBoatRushGame } from './composables/usePaperBoatRushGame'

const {
  gameMode,
  difficultyLevel,
  difficultyLabel,
  phase,
  timeLeft,
  progress,
  turnMessage,
  riverTick,
  boat,
  obstacles,
  whirlpools,
  trailPoints,
  windPower,
  boatAngle,
  activePlayerLabel,
  stageLabel,
  turnSummaryButtonLabel,
  playerOneScore,
  playerTwoScore,
  summaryHeadline,
  riverStyle,
  setBoardElement,
  setMode,
  setDifficulty,
  startMatch,
  startSecondPlayerTurn,
  returnToSetup,
  replayMatch,
  handleBoardPointerDown,
  handleBoardPointerMove,
  handleBoardPointerUp,
} = usePaperBoatRushGame()
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-8 text-text-primary sm:px-6">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header class="animate-fade-up border border-border-default bg-bg-surface p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="font-display text-xs tracking-[0.2em] text-accent-sky">// GAME</p>
            <h1 class="mt-2 font-display text-3xl font-bold text-accent-coral sm:text-4xl">
              Đua Thuyền Giấy
            </h1>
            <p class="mt-3 max-w-3xl text-sm text-text-secondary sm:text-base">
              Điều khiển thuyền giấy vượt sông đang đổi dòng liên tục. Vuốt để tạo gió, né rác và
              vùng xoáy, rồi cập bờ trước khi hết giờ.
            </p>
          </div>

          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Về trang chủ
          </RouterLink>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <PaperBoatRushSidebar
          :game-mode="gameMode"
          :difficulty-level="difficultyLevel"
          :difficulty-label="difficultyLabel"
          :phase="phase"
          :active-player-label="activePlayerLabel"
          :stage-label="stageLabel"
          :turn-summary-button-label="turnSummaryButtonLabel"
          :time-left="timeLeft"
          :boat-hits="boat.hits"
          :wind-power="windPower"
          :player-one-score="playerOneScore"
          :player-two-score="playerTwoScore"
          @replay-match="replayMatch"
          @return-setup="returnToSetup"
          @set-difficulty="setDifficulty"
          @set-mode="setMode"
          @start-match="startMatch"
          @start-second-turn="startSecondPlayerTurn"
        />

        <PaperBoatRushBoard
          :phase="phase"
          :river-style="riverStyle"
          :whirlpools="whirlpools"
          :obstacles="obstacles"
          :trail-points="trailPoints"
          :river-tick="riverTick"
          :boat="boat"
          :boat-angle="boatAngle"
          :progress="progress"
          :turn-message="turnMessage"
          :summary-headline="summaryHeadline"
          :set-board-element="setBoardElement"
          @pointerdown="handleBoardPointerDown"
          @pointermove="handleBoardPointerMove"
          @pointerup="handleBoardPointerUp"
        />
      </div>
    </div>
  </div>
</template>
