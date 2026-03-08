<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { usePikachuGame } from './composables/usePikachuGame'
import CreditsModal from './components/CreditsModal.vue'
import GameBoard from './components/GameBoard.vue'
import GameInfoSidebar from './components/GameInfoSidebar.vue'
import GameSidebar from './components/GameSidebar.vue'
import LeaderboardModal from './components/LeaderboardModal.vue'
import NewGameModal from './components/NewGameModal.vue'
import RecordPromptModal from './components/RecordPromptModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import pageMeta from './meta'

const {
  STORY_TOTAL_LEVELS,
  sizeOptions,
  difficultyOptions,
  appliedMode,
  appliedDifficulty,
  pendingSize,
  pendingDifficulty,
  pendingMainMode,
  pendingCustomMode,
  firstSelected,
  secondSelected,
  failedPairIds,
  flashPath,
  score,
  assistsLeft,
  storyLevel,
  message,
  isPaused,
  isResolvingPair,
  isLightMode,
  isMobilePortrait,
  isSoundOn,
  isBgmOn,
  sfxVolume,
  bgmVolume,
  showNewGameModal,
  showSettingsModal,
  showRecordPrompt,
  showLeaderboardModal,
  showCreditsModal,
  leaderboardStep,
  leaderboardCategory,
  leaderboardDifficulty,
  playerName,
  easterMessage,
  gravityUnlocked,
  creditsContainerRef,
  creditsContentRef,
  creditsEasterButtonRef,
  extRows,
  extCols,
  displayCells,
  isStoryMode,
  isGameOver,
  timeLabel,
  timeProgress,
  portraitCellSizeClass,
  pathPolylinePoints,
  wrapperClass,
  surfaceClass,
  panelInnerClass,
  textMutedClass,
  classicBoard,
  timedBoard,
  storyBoard,
  gravityBoard,
  creditsTransformStyle,
  applyNewGameSettings,
  togglePause,
  selectTile,
  useHint,
  useReload,
  openLeaderboardFlow,
  saveRecord,
  unlockEasterEgg,
  startCreditsBoost,
  stopCreditsBoost,
} = usePikachuGame()
</script>

<template>
  <div class="min-h-screen px-4 py-6 sm:px-6 sm:py-10" :class="wrapperClass">
    <div class="mx-auto flex w-full max-w-[1900px] flex-col gap-4">
      <header class="animate-fade-up border p-3 sm:p-4" :class="surfaceClass">
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="font-display text-xs tracking-widest text-accent-amber">TIME BAR // LIVE</p>
          <p class="font-display text-sm text-accent-coral">
            {{ appliedMode === 'timed' ? timeLabel : '∞' }}
          </p>
        </div>
        <div class="h-2 w-full border border-border-default bg-bg-deep">
          <div class="h-full bg-accent-coral transition-all duration-300" :style="{ width: `${timeProgress}%` }" />
        </div>
      </header>

      <div
        v-if="isMobilePortrait"
        class="animate-fade-up border px-3 py-2 text-center text-xs sm:hidden"
        :class="surfaceClass"
      >
        <p class="font-display tracking-wide text-accent-amber">• Xoay ngang điện thoại để có trải nghiệm tốt nhất</p>
      </div>

      <section class="grid gap-4 lg:grid-cols-[210px_1fr_280px] lg:items-start">
        <GameSidebar
          :surface-class="surfaceClass"
          :panel-inner-class="panelInnerClass"
          :is-paused="isPaused"
          :bgm-volume="bgmVolume"
          :sfx-volume="sfxVolume"
          @update:bgm-volume="(value) => (bgmVolume = value)"
          @update:sfx-volume="(value) => (sfxVolume = value)"
          @open-new-game="showNewGameModal = true"
          @open-settings="showSettingsModal = true"
          @toggle-pause="togglePause"
          @open-leaderboard="openLeaderboardFlow"
          @open-credits="showCreditsModal = true"
        />

        <GameBoard
          :display-cells="displayCells"
          :ext-cols="extCols"
          :ext-rows="extRows"
          :portrait-cell-size-class="portraitCellSizeClass"
          :first-selected="firstSelected"
          :second-selected="secondSelected"
          :failed-pair-ids="failedPairIds"
          :flash-path="flashPath"
          :path-polyline-points="pathPolylinePoints"
          :is-paused="isPaused"
          :is-game-over="isGameOver"
          :is-resolving-pair="isResolvingPair"
          :surface-class="surfaceClass"
          @select-tile="selectTile"
        />

        <GameInfoSidebar
          :surface-class="surfaceClass"
          :panel-inner-class="panelInnerClass"
          :text-muted-class="textMutedClass"
          :score="score"
          :time-label="timeLabel"
          :applied-mode="appliedMode"
          :story-level="storyLevel"
          :story-total-levels="STORY_TOTAL_LEVELS"
          :applied-difficulty="appliedDifficulty"
          :is-story-mode="isStoryMode"
          :assists-left="assistsLeft"
          :message="message"
          @use-hint="useHint"
          @use-reload="useReload"
        />
      </section>

      <RouterLink to="/" class="mx-auto inline-flex w-full max-w-[220px] items-center justify-center border px-2.5 py-1.5 text-xs transition hover:border-accent-amber" :class="panelInnerClass">
        ← Về trang chủ
      </RouterLink>

      <footer class="animate-fade-up animate-delay-3 border px-3 py-2 text-center text-xs sm:text-sm" :class="surfaceClass">
        <p class="font-display text-accent-amber">// {{ pageMeta.name }}</p>
        <p class="mt-1" :class="textMutedClass">{{ pageMeta.description }}</p>
        <p class="mt-1 text-[11px]" :class="textMutedClass">Tác giả: {{ pageMeta.author }}</p>
      </footer>
    </div>

    <NewGameModal
      :open="showNewGameModal"
      :surface-class="surfaceClass"
      :panel-inner-class="panelInnerClass"
      :text-muted-class="textMutedClass"
      :story-total-levels="STORY_TOTAL_LEVELS"
      :size-options="sizeOptions"
      :pending-size="pendingSize"
      :pending-difficulty="pendingDifficulty"
      :pending-main-mode="pendingMainMode"
      :pending-custom-mode="pendingCustomMode"
      :gravity-unlocked="gravityUnlocked"
      @close="showNewGameModal = false"
      @apply="applyNewGameSettings"
      @update:pending-size="(value) => (pendingSize = value)"
      @update:pending-difficulty="(value) => (pendingDifficulty = value)"
      @update:pending-main-mode="(value) => (pendingMainMode = value)"
      @update:pending-custom-mode="(value) => (pendingCustomMode = value)"
    />

    <SettingsModal
      :open="showSettingsModal"
      :surface-class="surfaceClass"
      :panel-inner-class="panelInnerClass"
      :text-muted-class="textMutedClass"
      :is-light-mode="isLightMode"
      :is-bgm-on="isBgmOn"
      :is-sound-on="isSoundOn"
      :bgm-volume="bgmVolume"
      :sfx-volume="sfxVolume"
      @close="showSettingsModal = false"
      @toggle-light="isLightMode = !isLightMode"
      @toggle-bgm="isBgmOn = !isBgmOn"
      @toggle-sound="isSoundOn = !isSoundOn"
      @update:bgm-volume="(value) => (bgmVolume = value)"
      @update:sfx-volume="(value) => (sfxVolume = value)"
    />

    <CreditsModal
      :open="showCreditsModal"
      :surface-class="surfaceClass"
      :panel-inner-class="panelInnerClass"
      :text-muted-class="textMutedClass"
      :credits-transform-style="creditsTransformStyle"
      :gravity-unlocked="gravityUnlocked"
      :easter-message="easterMessage"
      @close="showCreditsModal = false"
      @unlock="unlockEasterEgg"
      @bind:credits-container="(value) => (creditsContainerRef = value)"
      @bind:credits-content="(value) => (creditsContentRef = value)"
      @bind:credits-easter-button="(value) => (creditsEasterButtonRef = value)"
      @start-boost="startCreditsBoost"
      @stop-boost="stopCreditsBoost"
    />

    <LeaderboardModal
      :open="showLeaderboardModal"
      :surface-class="surfaceClass"
      :panel-inner-class="panelInnerClass"
      :text-muted-class="textMutedClass"
      :leaderboard-category="leaderboardCategory"
      :leaderboard-step="leaderboardStep"
      :leaderboard-difficulty="leaderboardDifficulty"
      :difficulty-options="difficultyOptions"
      :story-board="storyBoard"
      :gravity-board="gravityBoard"
      :classic-board="classicBoard"
      :timed-board="timedBoard"
      @close="showLeaderboardModal = false"
      @update:leaderboard-category="(value) => (leaderboardCategory = value)"
      @update:leaderboard-step="(value) => (leaderboardStep = value)"
      @update:leaderboard-difficulty="(value) => (leaderboardDifficulty = value)"
    />

    <RecordPromptModal
      :open="showRecordPrompt"
      :surface-class="surfaceClass"
      :panel-inner-class="panelInnerClass"
      :text-muted-class="textMutedClass"
      :applied-mode="appliedMode"
      :story-total-levels="STORY_TOTAL_LEVELS"
      :time-label="timeLabel"
      :player-name="playerName"
      @close="showRecordPrompt = false"
      @save="saveRecord"
      @update:player-name="(value) => (playerName = value)"
    />
  </div>
</template>
