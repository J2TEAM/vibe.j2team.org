import { ref, computed, watch, onUnmounted } from "vue";
import { validateWord } from "../utils/wordValidator";
import { selectBannedLetters, getMinWordsToPass } from "../utils/letterUtils";

const DEFAULT_ROUND_SECONDS = 30;

function getRoundTime(round: number): number {
  return DEFAULT_ROUND_SECONDS + Math.floor((round - 1) / 5) * 10;
}

export type GameState = "idle" | "playing" | "roundEnd" | "gameOver";

export interface Feedback {
  type: "success" | "error";
  message: string;
}

export interface RoundStats {
  wordsSubmitted: number;
  minRequired: number;
  passed: boolean;
}

export function useGameLogic() {
  const gameState = ref<GameState>("idle");
  const playerName = ref("");
  const round = ref(1);
  const timer = ref(DEFAULT_ROUND_SECONDS);
  const bannedLetters = ref<string[]>([]);
  const acceptedWords = ref<string[]>([]);
  const allUsedWords = ref<string[]>([]);
  const currentWord = ref("");
  const feedback = ref<Feedback | null>(null);
  const isValidating = ref(false);
  const roundsCleared = ref(0);
  const roundPassed = ref<boolean | null>(null);
  const roundStats = ref<RoundStats | null>(null);
  const totalTimeSeconds = ref(0);

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let gameTimerInterval: ReturnType<typeof setInterval> | null = null;
  let previousBanned: string[] = [];
  let gameStartTime: number | null = null;
  let roundEndTime: number | null = null;
  let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  const minWordsToPass = computed(() => getMinWordsToPass(round.value));

  function clearTimers() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function clearGameTimer() {
    if (gameTimerInterval) {
      clearInterval(gameTimerInterval);
      gameTimerInterval = null;
    }
  }

  function clearFeedbackTimeout() {
    if (feedbackTimeout) {
      clearTimeout(feedbackTimeout);
      feedbackTimeout = null;
    }
  }

  function handleRoundEnd() {
    clearTimers();
    const minWords = getMinWordsToPass(round.value);
    const passed = acceptedWords.value.length >= minWords;
    roundPassed.value = passed;
    roundStats.value = {
      wordsSubmitted: acceptedWords.value.length,
      minRequired: minWords,
      passed,
    };
    if (passed) roundsCleared.value++;
    gameState.value = "roundEnd";
  }

  function startTimers() {
    // Game time tracking
    if (!gameStartTime) {
      gameStartTime = Date.now();
    }
    gameTimerInterval = setInterval(() => {
      if (gameStartTime) {
        totalTimeSeconds.value = Math.floor((Date.now() - gameStartTime) / 1000);
      }
    }, 100);

    // Round timer (real time based, works when tab is inactive)
    roundEndTime = Date.now() + timer.value * 1000;
    timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roundEndTime! - now) / 1000));
      timer.value = remaining;

      if (remaining === 0) {
        handleRoundEnd();
      }
    }, 100);
  }

  // Watch for accepted words reaching min required
  watch(
    () => acceptedWords.value.length,
    () => {
      if (
        gameState.value === "playing" &&
        acceptedWords.value.length >= getMinWordsToPass(round.value)
      ) {
        handleRoundEnd();
      }
    },
  );

  function startGame(name: string) {
    playerName.value = name;
    round.value = 1;
    timer.value = getRoundTime(1);
    acceptedWords.value = [];
    allUsedWords.value = [];
    roundsCleared.value = 0;
    currentWord.value = "";
    feedback.value = null;
    roundPassed.value = null;
    roundStats.value = null;
    totalTimeSeconds.value = 0;
    previousBanned = [];
    gameStartTime = null;

    const banned = selectBannedLetters(1, []);
    bannedLetters.value = banned;
    previousBanned = banned;
    gameState.value = "playing";
    startTimers();
  }

  function nextRound() {
    clearTimers();
    clearGameTimer();

    const newRound = round.value + 1;
    round.value = newRound;
    timer.value = getRoundTime(newRound);
    acceptedWords.value = [];
    currentWord.value = "";
    feedback.value = null;
    roundPassed.value = null;
    roundStats.value = null;
    const banned = selectBannedLetters(newRound, previousBanned);
    bannedLetters.value = banned;
    previousBanned = banned;
    gameState.value = "playing";
    startTimers();
  }

  function gameOver() {
    clearTimers();
    clearGameTimer();
    clearFeedbackTimeout();
    gameState.value = "gameOver";
  }

  async function submitWord() {
    if (!currentWord.value.trim() || isValidating.value || gameState.value !== "playing") return;
    const word = currentWord.value.trim();
    isValidating.value = true;
    feedback.value = null;
    clearFeedbackTimeout();

    try {
      const result = await validateWord(word, bannedLetters.value, allUsedWords.value);
      if (result.valid) {
        const lowerWord = word.toLowerCase();
        acceptedWords.value = [...acceptedWords.value, lowerWord];
        allUsedWords.value = [...allUsedWords.value, lowerWord];
        currentWord.value = "";
        feedback.value = {
          type: "success",
          message: result.fallbackMessage || `"${word}" accepted!`,
        };
      } else {
        feedback.value = {
          type: "error",
          message: result.reason || "Invalid word",
        };
      }
    } catch {
      feedback.value = { type: "error", message: "Validation error. Try again." };
    }
    isValidating.value = false;
    feedbackTimeout = setTimeout(() => {
      feedback.value = null;
    }, 2000);
  }

  function resetGame() {
    clearTimers();
    clearGameTimer();
    clearFeedbackTimeout();
    gameState.value = "idle";
    playerName.value = "";
    round.value = 1;
    timer.value = getRoundTime(1);
    bannedLetters.value = [];
    acceptedWords.value = [];
    allUsedWords.value = [];
    currentWord.value = "";
    feedback.value = null;
    roundsCleared.value = 0;
    roundPassed.value = null;
    roundStats.value = null;
    totalTimeSeconds.value = 0;
    gameStartTime = null;
  }

  onUnmounted(() => {
    clearTimers();
    clearGameTimer();
    clearFeedbackTimeout();
  });

  return {
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
  };
}
