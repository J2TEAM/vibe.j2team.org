import { ref, computed } from 'vue'
import type { HighScoreEntry } from '../types'
import { DIFFICULTY_MULTIPLIER } from '../utils/route-data'

export function useScoreEngine() {
  const score = ref(0)
  const lives = ref(3)
  const highScores = ref<HighScoreEntry[]>([])

  function resetScore() {
    score.value = 0
    lives.value = 3
  }

  function evaluateAnswer(
    playerAnswer: number,
    actualCount: number,
    difficulty: number,
  ): { correct: boolean; close: boolean; diff: number; pointsEarned: number } {
    const diff = Math.abs(playerAnswer - actualCount)
    const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1

    if (diff === 0) {
      const points = Math.round(100 * multiplier)
      score.value += points
      return { correct: true, close: false, diff, pointsEarned: points }
    }

    if (diff <= 3) {
      const points = Math.round(50 * multiplier * (1 - diff * 0.15))
      score.value += points
      return { correct: false, close: true, diff, pointsEarned: points }
    }

    lives.value = Math.max(0, lives.value - 1)
    return { correct: false, close: false, diff, pointsEarned: 0 }
  }

  const isGameOver = computed(() => lives.value <= 0)

  function addHighScore(entry: HighScoreEntry) {
    highScores.value.push(entry)
    highScores.value.sort((a, b) => b.score - a.score)
    highScores.value = highScores.value.slice(0, 5)
  }

  return {
    score,
    lives,
    highScores,
    isGameOver,
    resetScore,
    evaluateAnswer,
    addHighScore,
  }
}
