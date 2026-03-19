// High scores storage using localStorage

const HISTORY_KEY = 'gach-bong-score-history'

export interface HighScore {
  score: number
  difficulty: string
  date: string
}

const HIGH_SCORES_KEY = 'gach-bong-high-scores'

export function getHighScores(): HighScore[] {
  try {
    const data = localStorage.getItem(HIGH_SCORES_KEY)
    if (!data) return []
    return JSON.parse(data) as HighScore[]
  } catch {
    return []
  }
}

// Get full score history (all entries, not limited to 10)
export function getScoreHistory(): HighScore[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    if (!data) return []
    return JSON.parse(data) as HighScore[]
  } catch {
    return []
  }
}

export function saveHighScore(score: number, difficulty: string): HighScore[] {
  try {
    const scores = getHighScores()
    const newScore: HighScore = {
      score,
      difficulty,
      date: new Date().toISOString(),
    }

    // Save to top scores (limited to 10)
    scores.push(newScore)
    scores.sort((a, b) => b.score - a.score)
    const topScores = scores.slice(0, 10)
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores))

    // Also save to full history
    const history = getScoreHistory()
    history.push(newScore)
    // Keep last 50 entries in history
    const trimmedHistory = history.slice(-50)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory))

    return topScores
  } catch {
    return []
  }
}

export function getHighScoreByDifficulty(difficulty: string): number {
  const scores = getHighScores()
  const filtered = scores.filter((s) => s.difficulty === difficulty)
  if (filtered.length === 0) return 0
  return Math.max(...filtered.map((s) => s.score))
}

export function clearHighScores(): void {
  localStorage.removeItem(HIGH_SCORES_KEY)
  localStorage.removeItem(HISTORY_KEY)
}
