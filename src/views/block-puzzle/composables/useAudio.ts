import { useLocalStorage } from '@vueuse/core'

/**
 * Simplified audio manager using Web Audio API
 * Since sound files are typical audio formats, we'll use the Audio element
 */
export function useAudio() {
  const isMuted = useLocalStorage('block-puzzle-muted', false)

  /**
   * Play a simple beep sound using Web Audio API (no external files needed)
   */
  function playBeep(frequency: number = 800, duration: number = 100, volume: number = 0.3) {
    if (isMuted.value) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (e) {
      console.error('Audio playback error:', e)
    }
  }

  /**
   * Play block placement sound
   */
  function playBlockPlace() {
    playBeep(600, 80, 0.2)
  }

  /**
   * Play line clear sound (ascending tone)
   */
  function playLineClear() {
    playBeep(800, 120, 0.25)
  }

  /**
   * Play combo sound (multiple ascending tones)
   */
  function playCombo() {
    playBeep(1000, 100, 0.25)
    setTimeout(() => playBeep(1200, 100, 0.25), 150)
  }

  /**
   * Play game over sound (descending tone)
   */
  function playGameOver() {
    playBeep(400, 200, 0.3)
  }

  /**
   * Play button click sound
   */
  function playClick() {
    playBeep(500, 50, 0.15)
  }

  return {
    isMuted,
    playBlockPlace,
    playLineClear,
    playCombo,
    playGameOver,
    playClick,
  }
}
