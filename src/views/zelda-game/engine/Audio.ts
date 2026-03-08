import { MASTER_VOLUME, SFX_VOLUME, MUSIC_VOLUME } from '../utils/constants'

export class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private muted = false
  private initialized = false
  private musicTimeout: ReturnType<typeof setTimeout> | null = null
  private currentTrack: 'none' | 'overworld' | 'boss' | 'victory' = 'none'
  private activeSfxCount = 0
  private readonly MAX_CONCURRENT_SFX = 4

  /** Must be called from a user gesture (click/keydown). No-op if already initialized. */
  init(): void {
    if (this.initialized) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = MASTER_VOLUME
    this.masterGain.connect(this.ctx.destination)

    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = SFX_VOLUME
    this.sfxGain.connect(this.masterGain)

    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = MUSIC_VOLUME
    this.musicGain.connect(this.masterGain)

    this.muted = localStorage.getItem('zelda-muted') === 'true'
    if (this.muted) this.masterGain.gain.value = 0

    this.initialized = true

    // Resume context if browser suspended it (mobile autoplay policy)
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
  }

  private get isReady(): boolean {
    return this.initialized && this.ctx !== null && this.ctx.state !== 'closed'
  }

  // ─── SFX ────────────────────────────────────────────────────────────

  playSwordSwing(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.05
    const noise = this.createNoise(duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3000
    filter.Q.value = 0.5
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain!)
    noise.start()
    noise.stop(ctx.currentTime + duration)
    this.trackSfx(noise, duration)
  }

  playHit(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.03
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(80, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    this.trackSfx(osc, duration)
    // Noise burst layer
    const noise = this.createNoise(duration)
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    noise.connect(noiseGain)
    noiseGain.connect(this.sfxGain!)
    noise.start()
    noise.stop(ctx.currentTime + duration)
  }

  playBlock(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.1
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 800
    const osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.value = 1600
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    osc2.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    osc2.start()
    osc2.stop(ctx.currentTime + duration)
    this.trackSfx(osc, duration)
  }

  playEnemyDeath(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.3
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    this.trackSfx(osc, duration)
  }

  playPlayerDamage(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.15
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration * 0.5)
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    this.trackSfx(osc, duration)
  }

  playBossAttack(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.2
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 60
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    const noise = this.createNoise(duration)
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.sfxGain!)
    noise.connect(noiseGain)
    noiseGain.connect(this.sfxGain!)
    osc.start()
    osc.stop(ctx.currentTime + duration)
    noise.start()
    noise.stop(ctx.currentTime + duration)
    this.trackSfx(osc, duration)
  }

  playArrowFire(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.1
    const noise = this.createNoise(duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain!)
    noise.start()
    noise.stop(ctx.currentTime + duration)
    this.trackSfx(noise, duration)
  }

  playUIConfirm(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.05)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(this.sfxGain!)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
    this.trackSfx(osc, 0.1)
  }

  playTransition(): void {
    if (!this.isReady || this.activeSfxCount >= this.MAX_CONCURRENT_SFX) return
    const ctx = this.ctx!
    const duration = 0.5
    const noise = this.createNoise(duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(5000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain!)
    noise.start()
    noise.stop(ctx.currentTime + duration)
    this.trackSfx(noise, duration)
  }

  // ─── Music ──────────────────────────────────────────────────────────

  playOverworldMusic(): void {
    if (!this.isReady) return
    if (this.currentTrack === 'overworld') return
    this.stopMusic()
    this.currentTrack = 'overworld'
    this.scheduleOverworldLoop()
  }

  playBossMusic(): void {
    if (!this.isReady) return
    if (this.currentTrack === 'boss') return
    this.stopMusic()
    this.currentTrack = 'boss'
    this.scheduleBossLoop()
  }

  playVictoryFanfare(): void {
    if (!this.isReady) return
    this.stopMusic()
    this.currentTrack = 'victory'
    this.scheduleVictoryFanfare()
  }

  stopMusic(): void {
    this.currentTrack = 'none'
    if (this.musicTimeout !== null) {
      clearTimeout(this.musicTimeout)
      this.musicTimeout = null
    }
  }

  // ─── Controls ───────────────────────────────────────────────────────

  toggleMute(): void {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : MASTER_VOLUME
    }
    localStorage.setItem('zelda-muted', String(this.muted))
  }

  get isMuted(): boolean {
    return this.muted
  }

  get isInitialized(): boolean {
    return this.initialized
  }

  reset(): void {
    this.stopMusic()
  }

  // ─── Private helpers ─────────────────────────────────────────────────

  private createNoise(duration: number): AudioBufferSourceNode {
    const ctx = this.ctx!
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    return source
  }

  private trackSfx(node: AudioScheduledSourceNode, _duration: number): void {
    this.activeSfxCount++
    node.addEventListener('ended', () => {
      this.activeSfxCount = Math.max(0, this.activeSfxCount - 1)
    })
  }

  // A4 pentatonic: A4 C5 D5 E5 G5
  private scheduleOverworldLoop(): void {
    if (this.currentTrack !== 'overworld' || !this.isReady) return
    const ctx = this.ctx!
    const notes = [440, 523, 587, 659, 784]
    const melody = [0, 2, 4, 3, 2, 1, 0, 2]
    const noteDuration = 60 / 100 // 100 BPM

    let time = ctx.currentTime
    for (const noteIdx of melody) {
      const freq = notes[noteIdx]
      if (freq === undefined) continue
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.3, time + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, time + noteDuration * 0.9)
      osc.connect(gain)
      gain.connect(this.musicGain!)
      osc.start(time)
      osc.stop(time + noteDuration)
      time += noteDuration
    }

    const loopDuration = melody.length * noteDuration * 1000
    this.musicTimeout = setTimeout(() => {
      if (this.currentTrack === 'overworld') this.scheduleOverworldLoop()
    }, loopDuration - 100)
  }

  // Minor pentatonic feel: A3 C4 D4 Eb4 G4
  private scheduleBossLoop(): void {
    if (this.currentTrack !== 'boss' || !this.isReady) return
    const ctx = this.ctx!
    const notes = [220, 261, 294, 311, 392]
    const melody = [0, 0, 2, 1, 0, 3, 2, 0, 1, 2, 3, 4, 2, 0, 1, 0]
    const noteDuration = 60 / 140 // 140 BPM

    let time = ctx.currentTime
    for (const noteIdx of melody) {
      const freq = notes[noteIdx]
      if (freq === undefined) continue
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.2, time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, time + noteDuration * 0.8)
      osc.connect(gain)
      gain.connect(this.musicGain!)
      osc.start(time)
      osc.stop(time + noteDuration)
      time += noteDuration
    }

    const loopDuration = melody.length * noteDuration * 1000
    this.musicTimeout = setTimeout(() => {
      if (this.currentTrack === 'boss') this.scheduleBossLoop()
    }, loopDuration - 100)
  }

  // Major key fanfare: C4 E4 G4 C5 sequence
  private scheduleVictoryFanfare(): void {
    if (!this.isReady) return
    const ctx = this.ctx!
    type NoteEntry = { freq: number; dur: number }
    const sequence: NoteEntry[] = [
      { freq: 261, dur: 0.15 },
      { freq: 329, dur: 0.15 },
      { freq: 392, dur: 0.15 },
      { freq: 523, dur: 0.5 },
      { freq: 0, dur: 0.1 },
      { freq: 523, dur: 0.15 },
      { freq: 659, dur: 0.15 },
      { freq: 784, dur: 0.8 },
    ]

    let time = ctx.currentTime
    for (const note of sequence) {
      if (note.freq === 0) {
        time += note.dur
        continue
      }
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = note.freq
      const osc2 = ctx.createOscillator()
      osc2.type = 'triangle'
      osc2.frequency.value = note.freq * 1.5
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(0.35, time + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.01, time + note.dur * 0.95)
      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(this.musicGain!)
      osc.start(time)
      osc.stop(time + note.dur)
      osc2.start(time)
      osc2.stop(time + note.dur)
      time += note.dur
    }
  }
}

export const audio = new AudioManager()
