<script setup lang="ts">
import { ref, watch } from "vue";
import { useGameLogic } from "./composables/useGameLogic";
import HomeScreen from "./components/HomeScreen.vue";
import GameScreen from "./components/GameScreen.vue";
import GameOverScreen from "./components/GameOverScreen.vue";

type View = "home" | "game" | "gameOver";

const view = ref<View>("home");
const showRoundOverlay = ref(false);

const {
  gameState,
  playerName,
  round,
  timer,
  bannedLetters,
  acceptedWords,
  allUsedWords,
  currentWord,
  feedback,
  isValidating,
  roundsCleared,
  roundPassed,
  roundStats,
  totalTimeSeconds,
  minWordsToPass,
  startGame,
  nextRound,
  gameOver,
  submitWord,
  resetGame,
} = useGameLogic();

function handleStart(name: string) {
  startGame(name);
  view.value = "game";
}

function handlePlayAgain() {
  resetGame();
  view.value = "home";
}

// Handle round end transitions
watch(gameState, (state) => {
  if (state === "roundEnd") {
    showRoundOverlay.value = true;
    if (roundPassed.value) {
      setTimeout(() => {
        showRoundOverlay.value = false;
        nextRound();
      }, 1500);
    } else {
      setTimeout(() => {
        showRoundOverlay.value = false;
        gameOver();
        view.value = "gameOver";
      }, 1500);
    }
  }
});
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body relative overflow-hidden">
    <HomeScreen v-if="view === 'home'" @start="handleStart" />

    <GameScreen
      v-if="view === 'game'"
      :round="round"
      :timer="timer"
      :banned-letters="bannedLetters"
      :accepted-words="acceptedWords"
      :all-used-words="allUsedWords"
      :current-word="currentWord"
      :feedback="feedback"
      :is-validating="isValidating"
      :round-passed="roundPassed"
      :round-stats="roundStats"
      :show-round-overlay="showRoundOverlay"
      :min-words-to-pass="minWordsToPass"
      @update:current-word="currentWord = $event"
      @submit-word="submitWord"
    />

    <GameOverScreen
      v-if="view === 'gameOver'"
      :rounds-cleared="roundsCleared"
      :total-time-seconds="totalTimeSeconds"
      :player-name="playerName"
      @play-again="handlePlayAgain"
      @go-home="view = 'home'"
    />
  </div>
</template>
