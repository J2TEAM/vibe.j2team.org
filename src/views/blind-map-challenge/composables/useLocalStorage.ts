import type { GameResult, Difficulty, GameMode } from '../types'

const PREFIX = 'blind-map-challenge:'

interface UserSettings {
    soundEnabled: boolean
    defaultDifficulty: Difficulty
    defaultMode: GameMode
}

const defaultSettings: UserSettings = {
    soundEnabled: true,
    defaultDifficulty: 'easy',
    defaultMode: 'classic',
}

function getItem<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(PREFIX + key)
        if (raw === null) return fallback
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

function setItem<T>(key: string, value: T): void {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
        // localStorage full or unavailable
    }
}

export function useLocalStorage() {
    function getHistory(): GameResult[] {
        return getItem<GameResult[]>('history', [])
    }

    function addHistory(result: GameResult): void {
        const history = getHistory()
        history.unshift(result)
        // Keep max 20 records
        if (history.length > 20) history.length = 20
        setItem('history', history)
    }

    function getSettings(): UserSettings {
        return getItem<UserSettings>('settings', defaultSettings)
    }

    function saveSettings(settings: Partial<UserSettings>): void {
        const current = getSettings()
        setItem('settings', { ...current, ...settings })
    }

    function getDailyResult(): { date: string; result: GameResult } | null {
        return getItem<{ date: string; result: GameResult } | null>('daily', null)
    }

    function saveDailyResult(result: GameResult): void {
        const today = new Date().toISOString().slice(0, 10)
        setItem('daily', { date: today, result })
    }

    function hasPlayedToday(): boolean {
        const daily = getDailyResult()
        if (!daily) return false
        const today = new Date().toISOString().slice(0, 10)
        return daily.date === today
    }

    function getBestScore(mode: GameMode, difficulty: Difficulty): number {
        const history = getHistory()
        const matching = history.filter(r => r.mode === mode && r.difficulty === difficulty)
        if (matching.length === 0) return 0
        return Math.max(...matching.map(r => r.score))
    }

    return {
        getHistory,
        addHistory,
        getSettings,
        saveSettings,
        getDailyResult,
        saveDailyResult,
        hasPlayedToday,
        getBestScore,
    }
}
