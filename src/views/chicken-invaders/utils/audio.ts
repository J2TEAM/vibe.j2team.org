class RetroAudio {
  ctx: AudioContext | null = null
  isMuted = false

  init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }

  playTone(freqStart: number, freqEnd: number, type: OscillatorType, dur: number, vol: number) {
    if (this.isMuted || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type

    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime)
    if (freqStart !== freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur)
    }

    gain.gain.setValueAtTime(vol, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + dur)
  }

  shoot() {
    this.playTone(800, 200, 'square', 0.1, 0.05)
  }
  hit() {
    this.playTone(300, 100, 'sawtooth', 0.1, 0.05)
  }
  explode() {
    this.playTone(150, 40, 'square', 0.4, 0.1)
  }
  damage() {
    this.playTone(200, 50, 'sawtooth', 0.5, 0.3)
  }
  powerup() {
    this.playTone(400, 400, 'sine', 0.1, 0.1)
    setTimeout(() => this.playTone(600, 600, 'sine', 0.1, 0.1), 100)
    setTimeout(() => this.playTone(800, 800, 'sine', 0.2, 0.1), 200)
  }
}

export const sfx = new RetroAudio()
