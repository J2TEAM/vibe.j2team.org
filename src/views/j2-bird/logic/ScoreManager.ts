// ---------------------------------------------------------------------------
// ScoreManager.ts — LocalStorage Top-10, no database required
// ---------------------------------------------------------------------------

export interface ScoreEntry {
  name: string
  score: number
  date: string   // ISO string
}

const STORAGE_KEY  = 'j2-bird-scores'
const MAX_ENTRIES  = 10

// ---- Load -------------------------------------------------------------------
export function loadHighScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ScoreEntry[]
  } catch {
    return []
  }
}

// ---- Save -------------------------------------------------------------------
export function saveHighScore(entry: ScoreEntry): ScoreEntry[] {
  const scores = loadHighScores()

  // Early return — not good enough and leaderboard is already full
  const lastScore = scores[scores.length - 1]?.score ?? 0
  if (scores.length >= MAX_ENTRIES && entry.score <= lastScore) {
    return scores
  }

  const updated = [...scores, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch { /* storage quota edge case */ }

  return updated
}

// ---- Check if new score enters leaderboard ----------------------------------
export function isHighScore(score: number): boolean {
  const scores = loadHighScores()
  if (scores.length < MAX_ENTRIES) return score > 0
  return score > (scores[scores.length - 1]?.score ?? 0)
}
