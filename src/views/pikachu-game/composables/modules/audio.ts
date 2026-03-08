export interface AudioController {
  ensureBgmPlayback: (isBgmOn: boolean, bgmVolume: number) => Promise<void>
  syncBgmState: (isBgmOn: boolean, bgmVolume: number) => void
  playSelectSound: (isSoundOn: boolean, sfxVolume: number) => void
  playMatchSound: (isSoundOn: boolean, sfxVolume: number) => void
  playFailSound: (isSoundOn: boolean, sfxVolume: number) => void
  playHintSound: (isSoundOn: boolean, sfxVolume: number) => void
  playPauseSound: (isSoundOn: boolean, sfxVolume: number, paused: boolean) => void
  playWinSound: (isSoundOn: boolean, sfxVolume: number) => void
  pauseBgm: () => void
  dispose: () => void
}

export function createAudioController(bgmTrack: string): AudioController {
  let audioContext: AudioContext | null = null
  let bgmAudio: HTMLAudioElement | null = null

  function initBgm(): void {
    if (bgmAudio || typeof Audio === 'undefined') {
      return
    }

    bgmAudio = new Audio(bgmTrack)
    bgmAudio.loop = true
    bgmAudio.preload = 'auto'
  }

  function syncBgmState(isBgmOn: boolean, bgmVolume: number): void {
    if (!bgmAudio) {
      return
    }

    const volume = Math.max(0, Math.min(1, (bgmVolume / 100) * 0.55))
    bgmAudio.volume = isBgmOn ? volume : 0
  }

  async function ensureBgmPlayback(isBgmOn: boolean, bgmVolume: number): Promise<void> {
    initBgm()
    syncBgmState(isBgmOn, bgmVolume)
    if (!bgmAudio || !isBgmOn) {
      return
    }

    try {
      await bgmAudio.play()
    } catch {
      // Autoplay can be blocked until user interacts with the page.
    }
  }

  function getAudioContext(isSoundOn: boolean): AudioContext | null {
    if (!isSoundOn || typeof AudioContext === 'undefined') {
      return null
    }

    if (!audioContext) {
      audioContext = new AudioContext()
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume()
    }

    return audioContext
  }

  function playTone(
    isSoundOn: boolean,
    sfxVolume: number,
    frequency: number,
    durationMs: number,
    volume: number,
    type: OscillatorType = 'sine',
    delaySeconds = 0,
  ): void {
    const ctx = getAudioContext(isSoundOn)
    if (!ctx) {
      return
    }

    const start = ctx.currentTime + delaySeconds
    const end = start + durationMs / 1000
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    const adjustedVolume = Math.max(0, Math.min(1, volume * (sfxVolume / 100) * 8.0))
    gain.gain.linearRampToValueAtTime(adjustedVolume, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(end + 0.01)
  }

  function playSelectSound(isSoundOn: boolean, sfxVolume: number): void {
    playTone(isSoundOn, sfxVolume, 760, 70, 0.035, 'triangle')
  }

  function playMatchSound(isSoundOn: boolean, sfxVolume: number): void {
    playTone(isSoundOn, sfxVolume, 880, 90, 0.05, 'triangle')
    playTone(isSoundOn, sfxVolume, 1175, 110, 0.04, 'triangle', 0.08)
  }

  function playFailSound(isSoundOn: boolean, sfxVolume: number): void {
    playTone(isSoundOn, sfxVolume, 260, 80, 0.05, 'sawtooth')
    playTone(isSoundOn, sfxVolume, 220, 110, 0.045, 'sawtooth', 0.06)
  }

  function playHintSound(isSoundOn: boolean, sfxVolume: number): void {
    playTone(isSoundOn, sfxVolume, 680, 90, 0.04, 'sine')
    playTone(isSoundOn, sfxVolume, 980, 90, 0.035, 'sine', 0.08)
  }

  function playPauseSound(isSoundOn: boolean, sfxVolume: number, paused: boolean): void {
    if (paused) {
      playTone(isSoundOn, sfxVolume, 420, 90, 0.03, 'square')
      playTone(isSoundOn, sfxVolume, 320, 120, 0.03, 'square', 0.08)
      return
    }
    playTone(isSoundOn, sfxVolume, 320, 90, 0.03, 'square')
    playTone(isSoundOn, sfxVolume, 420, 120, 0.03, 'square', 0.08)
  }

  function playWinSound(isSoundOn: boolean, sfxVolume: number): void {
    playTone(isSoundOn, sfxVolume, 660, 120, 0.045, 'triangle')
    playTone(isSoundOn, sfxVolume, 880, 120, 0.045, 'triangle', 0.1)
    playTone(isSoundOn, sfxVolume, 1320, 180, 0.045, 'triangle', 0.2)
  }

  function pauseBgm(): void {
    bgmAudio?.pause()
  }

  function dispose(): void {
    if (audioContext) {
      void audioContext.close()
      audioContext = null
    }

    if (bgmAudio) {
      bgmAudio.pause()
      bgmAudio.currentTime = 0
      bgmAudio = null
    }
  }

  return {
    ensureBgmPlayback,
    syncBgmState,
    playSelectSound,
    playMatchSound,
    playFailSound,
    playHintSound,
    playPauseSound,
    playWinSound,
    pauseBgm,
    dispose,
  }
}
