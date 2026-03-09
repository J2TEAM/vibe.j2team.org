import { ref, watch } from 'vue'
import type { GameMode, LeaderboardEntry } from '../types'

const MAX_ENTRIES = 20

function readFromStorage(key: string): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as LeaderboardEntry[]
  } catch {
    return []
  }
}

function writeToStorage(key: string, entries: LeaderboardEntry[]) {
  localStorage.setItem(key, JSON.stringify(entries))
}

export function useLeaderboard() {
  const normalScores = ref<LeaderboardEntry[]>(readFromStorage('vua-noi-tu-lb-normal'))
  const soloScores = ref<LeaderboardEntry[]>(readFromStorage('vua-noi-tu-lb-solo'))

  // Sync to localStorage on change
  watch(normalScores, (v) => writeToStorage('vua-noi-tu-lb-normal', v), { deep: true })
  watch(soloScores, (v) => writeToStorage('vua-noi-tu-lb-solo', v), { deep: true })

  function getScores(mode: GameMode): LeaderboardEntry[] {
    return mode === 'normal' ? normalScores.value : soloScores.value
  }

  function addScore(mode: GameMode, entry: LeaderboardEntry): boolean {
    const scores = mode === 'normal' ? normalScores : soloScores

    if (scores.value.length >= MAX_ENTRIES) {
      const minScore = scores.value[scores.value.length - 1]?.score ?? 0
      if (entry.score <= minScore) return false
    }

    scores.value = [...scores.value, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES)

    return true
  }

  function clearScores(mode: GameMode) {
    if (mode === 'normal') {
      normalScores.value = []
    } else {
      soloScores.value = []
    }
  }

  return {
    getScores,
    addScore,
    clearScores,
  }
}
