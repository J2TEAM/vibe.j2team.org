import { ref, computed } from 'vue'
import type { GamePhase } from '../types'
import { route02 } from '../utils/route-data'
import { randomInt } from '../utils/rng'
import { usePassengerManager } from './usePassengerManager'
import { useScoreEngine } from './useScoreEngine'
import { useBusAudio } from './useBusAudio'

export function useGameEngine() {
  const phase = ref<GamePhase>('IDLE')
  const currentStopIndex = ref(0)
  const lastBoarded = ref(0)
  const lastAlighted = ref(0)
  const boardingTimer = ref(0)
  const countingTimer = ref(0)
  const startTime = ref(0)
  const totalTime = ref(0)
  const lastResult = ref<{
    correct: boolean
    close: boolean
    diff: number
    pointsEarned: number
    playerAnswer: number
    actualCount: number
  } | null>(null)

  let boardingInterval: ReturnType<typeof setInterval> | null = null
  let countingInterval: ReturnType<typeof setInterval> | null = null
  let timeInterval: ReturnType<typeof setInterval> | null = null
  let scoringTimeout: ReturnType<typeof setTimeout> | null = null

  const passengerManager = usePassengerManager()
  const scoreEngine = useScoreEngine()
  const busAudio = useBusAudio()

  const currentStop = computed(() => route02[currentStopIndex.value])
  const isLastStop = computed(() => currentStopIndex.value >= route02.length - 1)
  const totalStops = computed(() => route02.length)

  function startGame() {
    passengerManager.reset()
    scoreEngine.resetScore()
    currentStopIndex.value = 0
    lastBoarded.value = 0
    lastAlighted.value = 0
    lastResult.value = null
    startTime.value = Date.now()
    totalTime.value = 0

    // Init audio on first user interaction
    busAudio.init()

    timeInterval = setInterval(() => {
      totalTime.value = Math.floor((Date.now() - startTime.value) / 1000)
    }, 1000)

    passengerManager.startWandering()

    startBoarding()
  }

  function startTransitAndCounting() {
    lastResult.value = null
    phase.value = 'COUNTING'

    // Play engine sound during transit
    busAudio.playDepart()
    busAudio.playEngine()

    countingTimer.value = 8

    countingInterval = setInterval(() => {
      countingTimer.value--
      if (countingTimer.value <= 0) {
        if (countingInterval) clearInterval(countingInterval)
        submitAnswer(-1)
      }
    }, 1000)
  }

  async function startBoarding() {
    const stop = currentStop.value
    if (!stop) return

    phase.value = 'BOARDING'

    // Play door open sound
    busAudio.playDoor()

    let alightCount = 0
    let boardCount = 0

    if (isLastStop.value) {
      alightCount = passengerManager.passengerCount.value
      boardCount = 0
    } else {
      alightCount = Math.min(
        randomInt(stop.alightMin, stop.alightMax),
        passengerManager.passengerCount.value,
      )
      boardCount = randomInt(stop.boardMin, stop.boardMax)
    }

    const totalPassengersMoving = alightCount + boardCount
    const baseDuration = 10
    const extraTime = Math.min(5, Math.ceil(totalPassengersMoving / 4))
    const boardingDuration = baseDuration + extraTime
    boardingTimer.value = boardingDuration

    boardingInterval = setInterval(() => {
      boardingTimer.value--
      if (boardingTimer.value <= 0) {
        if (boardingInterval) clearInterval(boardingInterval)
      }
    }, 1000)

    const alighted = await passengerManager.alightPassengers(alightCount)
    lastAlighted.value = alighted

    const boarded = await passengerManager.boardPassengers(boardCount)
    lastBoarded.value = boarded

    const elapsed = boardingDuration - boardingTimer.value
    const remaining = Math.max(0, boardingDuration - elapsed)
    if (remaining > 0) {
      await delay(remaining * 1000)
    }

    if (boardingInterval) clearInterval(boardingInterval)
    boardingTimer.value = 0

    // Play door close sound
    busAudio.playDoor()

    if (isLastStop.value) {
      finishRoute()
    } else {
      startTransitAndCounting()
    }
  }

  function submitAnswer(playerAnswer: number) {
    if (phase.value !== 'COUNTING') return

    if (countingInterval) clearInterval(countingInterval)
    countingTimer.value = 0

    const actualCount = passengerManager.passengerCount.value
    const stop = currentStop.value
    if (!stop) return

    const result = scoreEngine.evaluateAnswer(playerAnswer, actualCount, stop.difficulty)

    lastResult.value = {
      ...result,
      playerAnswer,
      actualCount,
    }

    phase.value = 'SCORING'

    scoringTimeout = setTimeout(() => {
      if (scoreEngine.isGameOver.value) {
        gameOver()
      } else {
        currentStopIndex.value++
        arriveAtNextStop()
      }
    }, 2000)
  }

  function arriveAtNextStop() {
    phase.value = 'TRANSIT'
    busAudio.fadeOutEngine(600)
    busAudio.playArrive()

    setTimeout(() => {
      startBoarding()
    }, 1500)
  }

  function quitGame() {
    stopTimers()
    phase.value = 'GAMEOVER'
  }

  function gameOver() {
    phase.value = 'GAMEOVER'
    stopTimers()
  }

  function finishRoute() {
    phase.value = 'COMPLETE'
    stopTimers()
  }

  function stopTimers() {
    if (boardingInterval) clearInterval(boardingInterval)
    if (countingInterval) clearInterval(countingInterval)
    if (timeInterval) clearInterval(timeInterval)
    if (scoringTimeout) clearTimeout(scoringTimeout)
    passengerManager.stopWandering()
    busAudio.stopEngine()
    if (startTime.value > 0) {
      totalTime.value = Math.floor((Date.now() - startTime.value) / 1000)
    }
  }

  function cleanup() {
    stopTimers()
    busAudio.cleanup()
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return {
    phase,
    currentStopIndex,
    currentStop,
    isLastStop,
    totalStops,
    lastBoarded,
    lastAlighted,
    boardingTimer,
    countingTimer,
    totalTime,
    lastResult,
    passengerManager,
    scoreEngine,
    busAudio,
    startGame,
    submitAnswer,
    quitGame,
    cleanup,
    formatTime,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
