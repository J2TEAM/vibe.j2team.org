import type { BlindMazeStats, TodayResult } from './types'
import { createDefaultStats, createTodayResult, getDateKey } from './utils'

const STATS_KEY = 'blind-maze-stats'
const TODAY_KEY = 'blind-maze-today'

export function loadStats(): BlindMazeStats {
  const stored = localStorage.getItem(STATS_KEY)
  if (!stored) return createDefaultStats()

  try {
    return JSON.parse(stored) as BlindMazeStats
  } catch {
    return createDefaultStats()
  }
}

export function saveStats(stats: BlindMazeStats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function loadTodayResult(): TodayResult | null {
  const stored = localStorage.getItem(TODAY_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as TodayResult
  } catch {
    return null
  }
}

export function hasPlayedToday(): boolean {
  const todayData = loadTodayResult()
  if (!todayData) return false
  return todayData.date === getDateKey()
}

export function recordPlayedSession(mazeNumber: number, time: number): void {
  if (hasPlayedToday()) return

  const today = getDateKey()
  const stats = loadStats()
  stats.mazesPlayed++
  stats.lastPlayedDate = today
  saveStats(stats)

  const result = createTodayResult(false, 0, time, mazeNumber)
  localStorage.setItem(TODAY_KEY, JSON.stringify(result))
}

export function recordGameComplete(
  won: boolean,
  moves: number,
  time: number,
  mazeNumber: number,
): void {
  const today = getDateKey()
  const stats = loadStats()

  if (!hasPlayedToday()) {
    stats.mazesPlayed++
  }

  if (won) {
    stats.mazesWon++
    if (stats.bestMoves === null || moves < stats.bestMoves) stats.bestMoves = moves
    if (stats.bestTime === null || time < stats.bestTime) stats.bestTime = time
  }

  stats.lastPlayedDate = today
  stats.history.push({ date: today, won, moves, time, mazeNumber })

  if (stats.history.length > 365) {
    stats.history = stats.history.slice(-365)
  }

  saveStats(stats)

  const result = createTodayResult(won, moves, time, mazeNumber)
  localStorage.setItem(TODAY_KEY, JSON.stringify(result))
}

export function getShareText(mazeNumber: number, moves: number, time: number): string {
  return `Blind Maze #${mazeNumber}\nThoát mê cung trong ${moves} bước (${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')})\n\nhttps://vibe.j2team.org/blind-maze`
}
