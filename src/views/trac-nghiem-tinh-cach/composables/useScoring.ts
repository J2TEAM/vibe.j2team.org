import type { Question, QuizResult, DimensionScore } from '../types'

type PoleKey = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'

function getScore(scores: Record<PoleKey, number>, pole: PoleKey): number {
  return scores[pole] ?? 0
}

function setScore(scores: Record<PoleKey, number>, pole: PoleKey, value: number): void {
  scores[pole] = value
}

export function calculateResult(
  answers: Record<number, number>,
  questions: Question[],
): QuizResult {
  // Score per pole
  const scores: Record<PoleKey, number> = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  }

  // Sum scores per pole
  // Answer ranges from -2 to +2
  // For pole: if answer matches pole direction, add positive; if opposite, add negative
  // Convert -2,-1,0,1,2 to 0,1,2,3,4
  for (const q of questions) {
    const answer = answers[q.id]
    if (answer !== undefined) {
      // Convert -2,-1,0,1,2 to 0,1,2,3,4
      const normalizedAnswer = answer + 2

      if (q.dimension === 'EI') {
        if (q.pole === 'E') {
          setScore(scores, 'E', getScore(scores, 'E') + normalizedAnswer)
          setScore(scores, 'I', getScore(scores, 'I') + (4 - normalizedAnswer))
        } else {
          setScore(scores, 'I', getScore(scores, 'I') + normalizedAnswer)
          setScore(scores, 'E', getScore(scores, 'E') + (4 - normalizedAnswer))
        }
      } else if (q.dimension === 'SN') {
        if (q.pole === 'S') {
          setScore(scores, 'S', getScore(scores, 'S') + normalizedAnswer)
          setScore(scores, 'N', getScore(scores, 'N') + (4 - normalizedAnswer))
        } else {
          setScore(scores, 'N', getScore(scores, 'N') + normalizedAnswer)
          setScore(scores, 'S', getScore(scores, 'S') + (4 - normalizedAnswer))
        }
      } else if (q.dimension === 'TF') {
        if (q.pole === 'T') {
          setScore(scores, 'T', getScore(scores, 'T') + normalizedAnswer)
          setScore(scores, 'F', getScore(scores, 'F') + (4 - normalizedAnswer))
        } else {
          setScore(scores, 'F', getScore(scores, 'F') + normalizedAnswer)
          setScore(scores, 'T', getScore(scores, 'T') + (4 - normalizedAnswer))
        }
      } else if (q.dimension === 'JP') {
        if (q.pole === 'J') {
          setScore(scores, 'J', getScore(scores, 'J') + normalizedAnswer)
          setScore(scores, 'P', getScore(scores, 'P') + (4 - normalizedAnswer))
        } else {
          setScore(scores, 'P', getScore(scores, 'P') + normalizedAnswer)
          setScore(scores, 'J', getScore(scores, 'J') + (4 - normalizedAnswer))
        }
      }
    }
  }

  // Calculate percentages and determine type
  const dimensions = ['EI', 'SN', 'TF', 'JP'] as const
  const percentages: Record<string, number> = {}
  const dimensionScores: Record<string, DimensionScore> = {}

  let mbtiType = ''

  for (const dim of dimensions) {
    let leftPole: PoleKey
    let rightPole: PoleKey

    if (dim === 'EI') {
      leftPole = 'E'
      rightPole = 'I'
    } else if (dim === 'SN') {
      leftPole = 'S'
      rightPole = 'N'
    } else if (dim === 'TF') {
      leftPole = 'T'
      rightPole = 'F'
    } else {
      leftPole = 'J'
      rightPole = 'P'
    }

    const leftScore = getScore(scores, leftPole)
    const rightScore = getScore(scores, rightPole)
    const total = leftScore + rightScore

    if (total > 0) {
      const leftPercentage = Math.round((leftScore / total) * 100)
      const rightPercentage = 100 - leftPercentage
      percentages[leftPole] = leftPercentage
      percentages[rightPole] = rightPercentage

      // Determine which pole wins (if tie, prefer the second one - I, N, F, P)
      const dominant = leftScore >= rightScore ? leftPole : rightPole
      mbtiType += dominant

      dimensionScores[dim] = {
        left: { label: leftPole, score: leftScore, percentage: leftPercentage },
        right: { label: rightPole, score: rightScore, percentage: rightPercentage },
      }
    }
  }

  return {
    type: mbtiType,
    scores: scores as Record<string, number>,
    percentages,
    dimensions: dimensionScores,
    date: new Date().toISOString(),
  }
}

export function shuffleQuestions<T>(array: readonly T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] as [T, T]
  }
  return shuffled
}
