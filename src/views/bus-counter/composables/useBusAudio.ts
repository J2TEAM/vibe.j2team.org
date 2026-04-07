import { ref, onUnmounted } from 'vue'

/**
 * Composable to manage bus sound effects.
 *
 * Place your audio files in: public/bus-counter/
 *   - bus-engine.mp3    — engine/driving loop sound
 *   - bus-arrive.mp3    — bus arriving at stop (brake sound)
 *   - bus-depart.mp3    — bus departing from stop (horn/acceleration)
 *   - bus-door.mp3      — door open/close sound (optional)
 *
 * The composable will attempt to play them; if a file doesn't exist,
 * it fails silently (no error shown to user).
 */
export function useBusAudio() {
  const isMuted = ref(false)

  let engineAudio: HTMLAudioElement | null = null
  let arriveAudio: HTMLAudioElement | null = null
  let departAudio: HTMLAudioElement | null = null
  let doorAudio: HTMLAudioElement | null = null

  function createAudio(src: string, loop = false): HTMLAudioElement {
    const audio = new Audio(src)
    audio.loop = loop
    audio.volume = 0.4
    // Fail silently if file not found
    audio.onerror = () => {}
    return audio
  }

  function init() {
    engineAudio = createAudio('/bus-counter/bus-engine.mp3', true)
    engineAudio.volume = 0.25
    arriveAudio = createAudio('/bus-counter/bus-arrive.mp3')
    departAudio = createAudio('/bus-counter/bus-depart.mp3')
    doorAudio = createAudio('/bus-counter/bus-door.mp3')
  }

  function playEngine() {
    if (isMuted.value || !engineAudio) return
    engineAudio.currentTime = 0
    engineAudio.play().catch(() => {})
  }

  function stopEngine() {
    if (!engineAudio) return
    engineAudio.pause()
    engineAudio.currentTime = 0
  }

  function fadeOutEngine(durationMs = 800) {
    if (!engineAudio) return
    const startVol = engineAudio.volume
    const steps = 20
    const stepMs = durationMs / steps
    const volStep = startVol / steps
    let step = 0
    const interval = setInterval(() => {
      step++
      if (engineAudio) {
        engineAudio.volume = Math.max(0, startVol - volStep * step)
      }
      if (step >= steps) {
        clearInterval(interval)
        stopEngine()
        if (engineAudio) engineAudio.volume = 0.25
      }
    }, stepMs)
  }

  function playArrive() {
    if (isMuted.value || !arriveAudio) return
    arriveAudio.currentTime = 0
    arriveAudio.play().catch(() => {})
  }

  function playDepart() {
    if (isMuted.value || !departAudio) return
    departAudio.currentTime = 0
    departAudio.play().catch(() => {})
  }

  function playDoor() {
    if (isMuted.value || !doorAudio) return
    doorAudio.currentTime = 0
    doorAudio.play().catch(() => {})
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (isMuted.value) {
      stopEngine()
    }
  }

  function cleanup() {
    stopEngine()
    engineAudio = null
    arriveAudio = null
    departAudio = null
    doorAudio = null
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    isMuted,
    init,
    playEngine,
    stopEngine,
    fadeOutEngine,
    playArrive,
    playDepart,
    playDoor,
    toggleMute,
    cleanup,
  }
}
