export class SoundFX {
  private ctx: AudioContext | null = null
  private bgmNode: OscillatorNode | null = null
  private bgmGain: GainNode | null = null
  private bgmPlaying = false
  private bgmTimerId: ReturnType<typeof setTimeout> | null = null
  private muted = false

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.muted ? 0 : 0.08
    }
    return this.muted
  }

  get isMuted(): boolean {
    return this.muted
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  private playSequence(notes: [number, number][], type: OscillatorType = 'square', volume = 0.12) {
    if (this.muted) return
    const ctx = this.getCtx()
    let time = ctx.currentTime
    for (const [freq, dur] of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.value = volume
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(time)
      osc.stop(time + dur)
      time += dur
    }
  }

  jump() {
    this.playSequence(
      [
        [400, 0.06],
        [500, 0.06],
        [600, 0.08],
      ],
      'square',
      0.1,
    )
  }

  coin() {
    this.playSequence(
      [
        [988, 0.05],
        [1319, 0.15],
      ],
      'square',
      0.1,
    )
  }

  stomp() {
    this.playTone(200, 0.12, 'square', 0.12)
  }

  powerUp() {
    this.playSequence(
      [
        [523, 0.08],
        [659, 0.08],
        [784, 0.08],
        [1047, 0.08],
        [1319, 0.08],
        [1568, 0.12],
      ],
      'square',
      0.1,
    )
  }

  brickBreak() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 300
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
    gain.gain.value = 0.12
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  }

  bump() {
    this.playTone(150, 0.1, 'triangle', 0.1)
  }

  hurt() {
    this.playSequence(
      [
        [400, 0.1],
        [300, 0.1],
        [200, 0.15],
      ],
      'sawtooth',
      0.15,
    )
  }

  death() {
    this.playSequence(
      [
        [784, 0.15],
        [622, 0.15],
        [523, 0.15],
        [392, 0.2],
        [330, 0.2],
        [262, 0.3],
      ],
      'square',
      0.15,
    )
  }

  gameOver() {
    this.playSequence(
      [
        [392, 0.2],
        [330, 0.2],
        [262, 0.2],
        [220, 0.15],
        [262, 0.15],
        [220, 0.4],
      ],
      'triangle',
      0.15,
    )
  }

  victory() {
    this.playSequence(
      [
        [523, 0.1],
        [587, 0.1],
        [659, 0.1],
        [784, 0.1],
        [880, 0.1],
        [1047, 0.2],
        [880, 0.1],
        [1047, 0.3],
      ],
      'square',
      0.12,
    )
  }

  bossRoar() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 100
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5)
    gain.gain.value = 0.2
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }

  bossHit() {
    this.playSequence(
      [
        [200, 0.1],
        [150, 0.1],
        [100, 0.15],
      ],
      'sawtooth',
      0.2,
    )
  }

  bossDefeat() {
    this.playSequence(
      [
        [200, 0.1],
        [180, 0.1],
        [160, 0.1],
        [140, 0.1],
        [120, 0.15],
        [100, 0.15],
        [80, 0.2],
        [60, 0.3],
      ],
      'sawtooth',
      0.2,
    )
  }

  fireball() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 600
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2)
    gain.gain.value = 0.1
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  }

  levelClear() {
    this.playSequence(
      [
        [523, 0.1],
        [659, 0.1],
        [784, 0.1],
        [1047, 0.15],
        [784, 0.1],
        [1047, 0.25],
      ],
      'square',
      0.12,
    )
  }

  startBGM() {
    if (this.bgmPlaying) return
    const ctx = this.getCtx()

    const melody = [
      659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0, 523, 0, 0, 392, 0, 0, 330, 0, 0,
      440, 0, 494, 0, 466, 440, 0, 392, 659, 784, 880, 0, 698, 784, 0, 659, 0, 523, 587, 494, 0, 0,
    ]

    const noteLength = 0.14
    let currentNote = 0
    this.bgmPlaying = true

    const playNextNote = () => {
      if (!this.bgmPlaying) return

      const freq = melody[currentNote % melody.length]!
      if (freq > 0) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = freq as number
        if (!this.bgmGain) {
          this.bgmGain = ctx.createGain()
          this.bgmGain.connect(ctx.destination)
        }
        this.bgmGain.gain.value = this.muted ? 0 : 0.08
        gain.gain.value = 1
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteLength * 0.9)
        osc.connect(gain)
        gain.connect(this.bgmGain)
        osc.start()
        osc.stop(ctx.currentTime + noteLength * 0.9)
      }
      currentNote++
      this.bgmTimerId = setTimeout(playNextNote, noteLength * 1000)
    }

    playNextNote()
  }

  stopBGM() {
    this.bgmPlaying = false
    if (this.bgmTimerId !== null) {
      clearTimeout(this.bgmTimerId)
      this.bgmTimerId = null
    }
    this.bgmNode = null
    this.bgmGain = null
  }
}
