type SfxName =
  | 'type'
  | 'hit'
  | 'kill'
  | 'hurt'
  | 'shield'
  | 'power'
  | 'mistake'
  | 'combo'
  | 'gameover'

type OscType = OscillatorType

interface Beep {
  freq: number
  ms: number
  gain: number
  type: OscType
  slideToFreq?: number
}

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function createNoop() {
  return {
    unlock() {},
    play(_name: SfxName) {},
  }
}

function createSfx() {
  if (typeof window === 'undefined') return createNoop()

  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return createNoop()

  const ctx = new Ctx()
  const master = ctx.createGain()
  master.gain.value = 0.08
  master.connect(ctx.destination)

  const lastPlayed = new Map<SfxName, number>()
  const minGap: Record<SfxName, number> = {
    type: 35,
    hit: 55,
    kill: 70,
    hurt: 90,
    shield: 90,
    power: 120,
    mistake: 90,
    combo: 140,
    gameover: 250,
  }

  const beeps: Record<SfxName, Beep> = {
    type: { freq: 760, ms: 16, gain: 0.22, type: 'square' },
    hit: { freq: 520, ms: 34, gain: 0.38, type: 'triangle', slideToFreq: 680 },
    kill: { freq: 260, ms: 70, gain: 0.5, type: 'sawtooth', slideToFreq: 130 },
    hurt: { freq: 120, ms: 110, gain: 0.55, type: 'sawtooth', slideToFreq: 90 },
    shield: { freq: 420, ms: 90, gain: 0.42, type: 'sine', slideToFreq: 760 },
    power: { freq: 680, ms: 120, gain: 0.44, type: 'triangle', slideToFreq: 980 },
    mistake: { freq: 180, ms: 95, gain: 0.5, type: 'square', slideToFreq: 140 },
    combo: { freq: 880, ms: 140, gain: 0.36, type: 'triangle', slideToFreq: 1240 },
    gameover: { freq: 130, ms: 260, gain: 0.65, type: 'sawtooth', slideToFreq: 70 },
  }

  function unlock() {
    if (ctx.state !== 'suspended') return
    void ctx.resume()
  }

  function play(name: SfxName) {
    const last = lastPlayed.get(name) ?? 0
    const t = nowMs()
    if (t - last < (minGap[name] ?? 60)) return
    lastPlayed.set(name, t)

    if (ctx.state === 'suspended') return

    const spec = beeps[name]
    if (!spec) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = spec.type
    osc.frequency.value = spec.freq
    gain.gain.value = 0

    osc.connect(gain)
    gain.connect(master)

    const startAt = ctx.currentTime
    const endAt = startAt + spec.ms / 1000
    const peak = Math.max(0.001, spec.gain)

    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt)

    if (spec.slideToFreq) {
      osc.frequency.setValueAtTime(spec.freq, startAt)
      osc.frequency.exponentialRampToValueAtTime(spec.slideToFreq, endAt)
    }

    osc.start(startAt)
    osc.stop(endAt + 0.02)
  }

  return { unlock, play }
}

let singleton: ReturnType<typeof createSfx> | null = null

export function getSfx() {
  if (!singleton) singleton = createSfx()
  return singleton
}
