import { ref, computed, type Ref } from 'vue'
import type { Province, PlacedProvince, GameConfig, GameResult, Difficulty } from '../types'
import { provinces as allProvinces } from '../data/provinces'
import { useTimer } from './useTimer'
import { useLocalStorage } from './useLocalStorage'

// Scoring constants
const SCORE_FIRST_ATTEMPT = 10
const SCORE_SECOND_ATTEMPT = 5
const SCORE_THIRD_PLUS = 2
const HINT_PENALTY = 5
const TIME_BONUS_MULTIPLIER = 0.5

const WRONG_PENALTY: Record<Difficulty, number> = {
    easy: 0,
    medium: -5,
    hard: -10,
    expert: -20,
}

const TIME_LIMITS: Record<Difficulty, number> = {
    easy: 0,        // No limit
    medium: 600,    // 10 min
    hard: 300,      // 5 min
    expert: 180,    // 3 min
}

function getDailySeed(): number {
    const today = new Date().toISOString().slice(0, 10)
    let hash = 0
    for (let i = 0; i < today.length; i++) {
        const char = today.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
    }
    return Math.abs(hash)
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr]
    let s = seed
    for (let i = result.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) & 0x7fffffff
        const j = s % (i + 1)
        const tmp = result[i]!
        result[i] = result[j]!
        result[j] = tmp
    }
    return result
}

// Sound effects using Web Audio API
function playSound(type: 'correct' | 'wrong' | 'complete') {
    try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        if (type === 'correct') {
            osc.type = 'sine'
            osc.frequency.setValueAtTime(523, ctx.currentTime)
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.3)
        } else if (type === 'wrong') {
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(200, ctx.currentTime)
            osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15)
            gain.gain.setValueAtTime(0.2, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.4)
        } else {
            // complete — celebratory arpeggio
            osc.type = 'sine'
            osc.frequency.setValueAtTime(523, ctx.currentTime)
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12)
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24)
            osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.36)
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.6)
        }
    } catch {
        // Web Audio not available
    }
}

export function useGameLogic() {
    const config: Ref<GameConfig> = ref({
        mode: 'classic',
        difficulty: 'easy',
    })

    const gameProvinces = ref<Province[]>([])
    const placedProvinces = ref<Map<string, PlacedProvince>>(new Map())
    const score = ref(0)
    const hintsUsed = ref(0)
    const isGameActive = ref(false)
    const isGameOver = ref(false)
    const selectedProvinceId = ref<string | null>(null)
    const hintedProvinceId = ref<string | null>(null)
    const wrongProvinceId = ref<string | null>(null)
    const soundEnabled = ref(true)

    const timer = useTimer()
    const storage = useLocalStorage()

    // Computed
    const totalProvinces = computed(() => gameProvinces.value.length)
    const correctCount = computed(() => {
        let count = 0
        placedProvinces.value.forEach(p => { if (p.status === 'correct') count++ })
        return count
    })
    const remainingProvinces = computed(() =>
        gameProvinces.value.filter(p => {
            const placed = placedProvinces.value.get(p.id)
            return !placed || placed.status !== 'correct'
        })
    )
    const progressPercent = computed(() =>
        totalProvinces.value > 0 ? (correctCount.value / totalProvinces.value) * 100 : 0
    )
    const isWon = computed(() => correctCount.value === totalProvinces.value && totalProvinces.value > 0)
    const accuracy = computed(() => {
        let totalAttempts = 0
        placedProvinces.value.forEach(p => { totalAttempts += p.attempts })
        if (totalAttempts === 0) return 100
        return Math.round((correctCount.value / totalAttempts) * 100)
    })

    const wrongProvincesList = computed(() => {
        const wrong: string[] = []
        placedProvinces.value.forEach((p, id) => {
            if (p.status !== 'correct') wrong.push(id)
        })
        return wrong
    })

    // Grade based on accuracy
    function getGrade(): string {
        const acc = accuracy.value
        if (acc >= 95) return 'S'
        if (acc >= 85) return 'A'
        if (acc >= 70) return 'B'
        if (acc >= 50) return 'C'
        return 'F'
    }

    // Initialize game
    function startGame(gameConfig: GameConfig) {
        config.value = gameConfig
        placedProvinces.value = new Map()
        score.value = 0
        hintsUsed.value = 0
        isGameOver.value = false
        selectedProvinceId.value = null
        hintedProvinceId.value = null
        wrongProvinceId.value = null

        // Load settings
        const settings = storage.getSettings()
        soundEnabled.value = settings.soundEnabled

        // Filter provinces based on mode
        let filtered = [...allProvinces]
        if (gameConfig.mode === 'region' && gameConfig.regionFilter) {
            filtered = filtered.filter(p => p.zone === gameConfig.regionFilter)
        } else if (gameConfig.mode === 'daily') {
            const seed = getDailySeed()
            const shuffled = seededShuffle(allProvinces, seed)
            filtered = shuffled.slice(0, 10)
        }

        gameProvinces.value = filtered
        isGameActive.value = true

        // Start timer
        const timeLimit = TIME_LIMITS[gameConfig.difficulty]
        if (timeLimit > 0 || gameConfig.mode === 'time-attack') {
            const limit = timeLimit > 0 ? timeLimit : 300 // default 5 min for time-attack
            timer.start(limit)
        } else {
            timer.startCountUp()
        }
    }

    // Place a province on the map
    function placeProvince(provinceId: string, targetSvgId: string): boolean {
        if (!isGameActive.value || isGameOver.value) return false

        const province = gameProvinces.value.find(p => p.id === provinceId)
        if (!province) return false

        const existing = placedProvinces.value.get(provinceId)
        if (existing && existing.status === 'correct') return false

        const attempts = existing ? existing.attempts + 1 : 1
        const isCorrect = province.svgPathId === targetSvgId

        if (isCorrect) {
            placedProvinces.value.set(provinceId, {
                provinceId,
                status: 'correct',
                attempts,
            })

            // Calculate score
            if (attempts === 1) score.value += SCORE_FIRST_ATTEMPT
            else if (attempts === 2) score.value += SCORE_SECOND_ATTEMPT
            else score.value += SCORE_THIRD_PLUS

            if (soundEnabled.value) playSound('correct')
            selectedProvinceId.value = null

            // Check win condition
            if (isWon.value) {
                endGame()
            }
        } else {
            placedProvinces.value.set(provinceId, {
                provinceId,
                status: 'wrong',
                attempts,
            })
            score.value += WRONG_PENALTY[config.value.difficulty]

            if (soundEnabled.value) playSound('wrong')

            // Flash wrong province
            wrongProvinceId.value = targetSvgId
            setTimeout(() => { wrongProvinceId.value = null }, 600)
        }

        return isCorrect
    }

    // Use hint
    function useHint(): string | null {
        if (!isGameActive.value || remainingProvinces.value.length === 0) return null

        const randomIndex = Math.floor(Math.random() * remainingProvinces.value.length)
        const province = remainingProvinces.value[randomIndex]
        if (!province) return null

        score.value -= HINT_PENALTY
        hintsUsed.value++

        hintedProvinceId.value = province.svgPathId
        setTimeout(() => { hintedProvinceId.value = null }, 2000)

        return province.id
    }

    // End game
    function endGame() {
        isGameActive.value = false
        isGameOver.value = true
        timer.stop()

        // Mark remaining provinces as wrong (e.g. when time expires)
        gameProvinces.value.forEach(p => {
            if (!placedProvinces.value.has(p.id) || placedProvinces.value.get(p.id)?.status !== 'correct') {
                placedProvinces.value.set(p.id, {
                    provinceId: p.id,
                    status: 'wrong',
                    attempts: placedProvinces.value.get(p.id)?.attempts ?? 0,
                })
            }
        })

        // Time bonus (only for timed modes)
        const timeLimit = TIME_LIMITS[config.value.difficulty]
        if (timeLimit > 0 && timer.remainingSeconds.value > 0) {
            score.value += Math.floor(timer.remainingSeconds.value * TIME_BONUS_MULTIPLIER)
        }

        if (soundEnabled.value && isWon.value) playSound('complete')

        // Save result
        const result: GameResult = {
            date: new Date().toISOString(),
            mode: config.value.mode,
            difficulty: config.value.difficulty,
            score: score.value,
            accuracy: accuracy.value,
            timeUsed: timer.elapsedSeconds.value,
            wrongProvinces: wrongProvincesList.value,
        }

        storage.addHistory(result)

        if (config.value.mode === 'daily') {
            storage.saveDailyResult(result)
        }
    }

    // Give up
    function giveUp() {
        endGame()
    }

    // Select province for click-to-place
    function selectProvince(id: string | null) {
        selectedProvinceId.value = id
    }

    // Toggle sound
    function toggleSound() {
        soundEnabled.value = !soundEnabled.value
        storage.saveSettings({ soundEnabled: soundEnabled.value })
    }

    // Check if timer expired
    function checkTimerExpired(): boolean {
        const timeLimit = TIME_LIMITS[config.value.difficulty]
        if (timeLimit > 0 && timer.isExpired.value && isGameActive.value) {
            endGame()
            return true
        }
        return false
    }

    return {
        config,
        gameProvinces,
        placedProvinces,
        score,
        hintsUsed,
        isGameActive,
        isGameOver,
        selectedProvinceId,
        hintedProvinceId,
        wrongProvinceId,
        soundEnabled,
        timer,
        totalProvinces,
        correctCount,
        remainingProvinces,
        progressPercent,
        isWon,
        accuracy,
        wrongProvincesList,
        getGrade,
        startGame,
        placeProvince,
        useHint,
        endGame,
        giveUp,
        selectProvince,
        toggleSound,
        checkTimerExpired,
    }
}
