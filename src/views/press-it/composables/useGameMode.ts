import { ref } from 'vue'
import type { GameMode, KeyButton, BeatChallenge, CustomConfig } from '../types'
import { beatMap } from '../assets/beatmap'

const ALL_KEYS: KeyButton[] = ['A', 'W', 'S', 'D']

function pickRandomKeys(count: number): KeyButton[] {
  const shuffled = [...ALL_KEYS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function useGameMode() {
  const selectedMode = ref<GameMode>('basic')
  const customConfig = ref<CustomConfig>({
    useMouse: true,
    useKeys: true,
    maxKeys: 2,
    useHold: false,
    maxHoldTime: 1.5,
  })

  const challenges = ref<BeatChallenge[]>([])

  function generateChallenges() {
    challenges.value = beatMap.map(() => generateOne())
  }

  function generateOne(): BeatChallenge {
    const mode = selectedMode.value

    if (mode === 'basic') {
      return { keys: [], mouse: true, holdDuration: 0 }
    }

    if (mode === 'medium') {
      const keys = pickRandomKeys(1)
      return { keys, mouse: true, holdDuration: 0 }
    }

    if (mode === 'hard') {
      const keyCount = Math.random() < 0.5 ? 1 : 2
      const keys = pickRandomKeys(keyCount)
      const mouse = Math.random() < 0.5
      return { keys, mouse, holdDuration: 0 }
    }

    if (mode === 'asian') {
      const keyCount = Math.random() < 0.4 ? 3 : 2
      const keys = pickRandomKeys(keyCount)
      const mouse = Math.random() < 0.5
      const useHold = Math.random() < 0.4
      const holdDuration = useHold ? 0.5 + Math.random() * 1.0 : 0
      return { keys, mouse, holdDuration }
    }

    // customized
    const cfg = customConfig.value
    const rawCount = cfg.useKeys ? 1 + Math.floor(Math.random() * cfg.maxKeys) : 0
    const keys = cfg.useKeys ? pickRandomKeys(rawCount) : []
    const mouse = cfg.useMouse ? Math.random() < 0.6 : false
    const useHold = cfg.useHold && (keys.length > 0 || mouse) && Math.random() < 0.4
    const holdDuration = useHold ? 0.3 + Math.random() * cfg.maxHoldTime : 0
    return { keys, mouse, holdDuration }
  }

  function getChallengeAt(beatIndex: number): BeatChallenge | null {
    return challenges.value[beatIndex] ?? null
  }

  return {
    selectedMode,
    customConfig,
    challenges,
    generateChallenges,
    getChallengeAt,
  }
}
