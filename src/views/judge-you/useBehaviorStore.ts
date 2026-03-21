import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export const useBehaviorStore = defineStore('judgeBehavior', () => {
  const clicks = ref(0)
  const mouseMoves = ref(0)
  const idleTime = ref(0)
  const totalTime = ref(0)
  const phase = ref(1) // 1 to 9

  const isRapidClicking = ref(false)
  const isFastMoving = ref(false)
  const isMobileTapSpam = ref(false)

  const hasEscaped = ref(false)

  // Fake memory
  const visitCount = useLocalStorage('judge_you_visits', 0)
  const lastDuration = useLocalStorage('judge_you_last_duration', 0)

  // Prediction & Control
  const predictionTarget = ref({ x: 0, y: 0, show: false })
  const reverseControlActive = ref(false)
  const hasFollowedInstruction = ref(false)

  // Personalities
  const personality = ref<string>('unknown')

  function determinePersonality() {
    if (personality.value !== 'unknown') return
    if (isRapidClicking.value) personality.value = 'aggressive'
    else if (idleTime.value > 8000) personality.value = 'sarcastic'
    else personality.value = 'calm'
  }

  function updateClick() {
    clicks.value++
  }
  function updateMove() {
    mouseMoves.value++
  }
  function updateIdle(ms: number) {
    idleTime.value = ms
  }
  function setPhase(newPhase: number) {
    phase.value = newPhase
  }
  function resetIdle() {
    idleTime.value = 0
  }
  function setRapid(rapid: boolean) {
    isRapidClicking.value = rapid
  }
  function setMobileSpam(spam: boolean) {
    isMobileTapSpam.value = spam
  }
  function escape() {
    hasEscaped.value = true
  }

  return {
    clicks,
    mouseMoves,
    idleTime,
    totalTime,
    phase,
    isRapidClicking,
    isFastMoving,
    isMobileTapSpam,
    hasEscaped,
    visitCount,
    lastDuration,
    personality,
    predictionTarget,
    reverseControlActive,
    hasFollowedInstruction,
    determinePersonality,
    updateClick,
    updateMove,
    updateIdle,
    setPhase,
    resetIdle,
    setRapid,
    setMobileSpam,
    escape,
  }
})
