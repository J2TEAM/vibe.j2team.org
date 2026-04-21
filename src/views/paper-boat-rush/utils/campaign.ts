import type { GameMode, GamePhase } from '../types'

export type SummaryAction = 'next-player' | 'next-stage' | null

interface ScoreInput {
  progress: number
  timeLeft: number
  success: boolean
  hits: number
  difficultyMultiplier: number
}

interface ResolveTurnInput {
  scores: number[]
  turnIndex: number
  gainedScore: number
  gameMode: GameMode
  stageIndex: number
  totalStages: number
}

interface ResolveTurnResult {
  scores: number[]
  phase: GamePhase
  summaryAction: SummaryAction
}

export function calculateTurnScore(input: ScoreInput) {
  const progressScore = Math.round(input.progress * 460)
  const timeScore = Math.round(input.timeLeft * 14)
  const completionBonus = input.success ? 340 : 0
  const penalty = input.hits * 65
  const baseScore = progressScore + timeScore + completionBonus - penalty

  return Math.max(0, Math.round(baseScore * input.difficultyMultiplier))
}

export function resolveTurnEnd(input: ResolveTurnInput): ResolveTurnResult {
  const nextScores = [...input.scores]
  nextScores[input.turnIndex] = (nextScores[input.turnIndex] ?? 0) + input.gainedScore

  if (input.gameMode === 'single') {
    if (input.stageIndex < input.totalStages - 1) {
      return {
        scores: nextScores,
        phase: 'turn-summary',
        summaryAction: 'next-stage',
      }
    }

    return {
      scores: nextScores,
      phase: 'match-summary',
      summaryAction: null,
    }
  }

  if (input.turnIndex === 0) {
    return {
      scores: nextScores,
      phase: 'turn-summary',
      summaryAction: 'next-player',
    }
  }

  if (input.stageIndex < input.totalStages - 1) {
    return {
      scores: nextScores,
      phase: 'turn-summary',
      summaryAction: 'next-stage',
    }
  }

  return {
    scores: nextScores,
    phase: 'match-summary',
    summaryAction: null,
  }
}
