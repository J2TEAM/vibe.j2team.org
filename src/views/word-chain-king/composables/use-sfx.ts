import { ref } from 'vue'
const correctSfx = '/word-chain-king/correct.mp3'
const wrongSfx = '/word-chain-king/wrong.mp3'

export function useSfx() {
  const sfxEnabled = ref(true)
  let correctAudio: HTMLAudioElement | null = null
  let wrongAudio: HTMLAudioElement | null = null

  function initAudio() {
    if (!correctAudio) {
      correctAudio = new Audio(correctSfx)
      correctAudio.volume = 0.5
    }
    if (!wrongAudio) {
      wrongAudio = new Audio(wrongSfx)
      wrongAudio.volume = 0.5
    }
  }

  function playCorrect() {
    if (!sfxEnabled.value) return
    initAudio()
    if (correctAudio) {
      correctAudio.currentTime = 0
      correctAudio.play().catch(() => {})
    }
  }

  function playWrong() {
    if (!sfxEnabled.value) return
    initAudio()
    if (wrongAudio) {
      wrongAudio.currentTime = 0
      wrongAudio.play().catch(() => {})
    }
  }

  function toggleSfx() {
    sfxEnabled.value = !sfxEnabled.value
  }

  return {
    sfxEnabled,
    playCorrect,
    playWrong,
    toggleSfx,
  }
}
