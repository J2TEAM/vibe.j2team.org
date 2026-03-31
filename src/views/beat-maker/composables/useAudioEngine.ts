import { ref, type Ref } from 'vue'

type SoundType =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'openhat'
  | 'tom'
  | 'clap'
  | 'cowbell'
  | 'rimshot'
  | 'bass'
  | 'subbass'
  | 'slapbass'
  | 'fretless'
  | 'bassgtr'
  | 'synth'
  | 'pad'
  | 'epiano'
  | 'organ'
  | 'marimba'
  | 'bells'
  | 'piano'
  | 'violin'
  | 'elecgtr'
  | 'classgtr'
  | 'acoustgtr'

export function useAudioEngine() {
  const audioCtx: Ref<AudioContext | null> = ref(null)
  const masterGain: Ref<GainNode | null> = ref(null)

  const initAudio = () => {
    if (audioCtx.value) {
      if (audioCtx.value.state === 'suspended') audioCtx.value.resume()
      return audioCtx.value
    }
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(ctx.destination)
    audioCtx.value = ctx
    masterGain.value = master
    return ctx
  }

  const createGainAndPan = (ctx: AudioContext, gainVal: number, pan: number) => {
    const gainNode = ctx.createGain()
    gainNode.gain.value = gainVal
    const panNode = ctx.createStereoPanner()
    panNode.pan.value = pan
    gainNode.connect(panNode)
    panNode.connect(masterGain.value!)
    return gainNode
  }

  const createNoise = (ctx: AudioContext, duration: number) => {
    const bufLen = ctx.sampleRate * duration
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    return src
  }

  const playKick = (ctx: AudioContext, time: number, gain: number, pan: number) => {
    const dest = createGainAndPan(ctx, gain, pan)
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.frequency.setValueAtTime(180, time)
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5)
    env.gain.setValueAtTime(1, time)
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.5)
    osc.connect(env)
    env.connect(dest)
    osc.start(time)
    osc.stop(time + 0.5)
  }

  const playSnare = (ctx: AudioContext, time: number, gain: number, pan: number) => {
    const dest = createGainAndPan(ctx, gain * 0.8, pan)
    const noise = createNoise(ctx, 0.2)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1500
    const env = ctx.createGain()
    env.gain.setValueAtTime(1, time)
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
    noise.connect(filter)
    filter.connect(env)
    env.connect(dest)
    noise.start(time)
  }

  const playHiHat = (ctx: AudioContext, time: number, gain: number, pan: number, open = false) => {
    const dest = createGainAndPan(ctx, gain * 0.4, pan)
    const duration = open ? 0.3 : 0.05
    const noise = createNoise(ctx, duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 8000
    const env = ctx.createGain()
    env.gain.setValueAtTime(1, time)
    env.gain.exponentialRampToValueAtTime(0.001, time + duration)
    noise.connect(filter)
    filter.connect(env)
    env.connect(dest)
    noise.start(time)
  }

  const playTom = (ctx: AudioContext, time: number, gain: number, pan: number) => {
    const dest = createGainAndPan(ctx, gain, pan)
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.frequency.setValueAtTime(120, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.3)
    env.gain.setValueAtTime(1, time)
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
    osc.connect(env)
    env.connect(dest)
    osc.start(time)
    osc.stop(time + 0.3)
  }

  const playClap = (ctx: AudioContext, time: number, gain: number, pan: number) => {
    const dest = createGainAndPan(ctx, gain * 0.6, pan)
    for (let i = 0; i < 3; i++) {
      const noise = createNoise(ctx, 0.05)
      const env = ctx.createGain()
      const t = time + i * 0.01
      env.gain.setValueAtTime(1, t)
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
      noise.connect(env)
      env.connect(dest)
      noise.start(t)
    }
  }

  const playCowbell = (ctx: AudioContext, time: number, gain: number, pan: number) => {
    const dest = createGainAndPan(ctx, gain * 0.5, pan)
    ;[562, 845].forEach((freq) => {
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const env = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      filter.type = 'bandpass'
      filter.frequency.value = 800
      filter.Q.value = 5
      env.gain.setValueAtTime(1, time)
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.5)
      osc.connect(filter)
      filter.connect(env)
      env.connect(dest)
      osc.start(time)
      osc.stop(time + 0.5)
    })
  }

  const playRimshot = (ctx: AudioContext, time: number, gain: number, pan: number) => {
    const dest = createGainAndPan(ctx, gain * 0.5, pan)
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.frequency.value = 1600
    env.gain.setValueAtTime(1, time)
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.03)
    osc.connect(env)
    env.connect(dest)
    osc.start(time)
    osc.stop(time + 0.03)
  }

  const playBass = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain, pan)
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = midiToFreq(pitch)
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq
    filter.Q.value = 3
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + 0.01)
    env.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(filter)
    filter.connect(env)
    env.connect(dest)
    osc.start(time)
    osc.stop(time + duration + 0.1)
  }

  const playSynth = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.6, pan)
    const osc = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = midiToFreq(pitch)
    osc2.type = 'sawtooth'
    osc2.frequency.value = midiToFreq(pitch) * 1.005 // slight detune
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq
    filter.Q.value = 2
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + 0.05)
    env.gain.setValueAtTime(0.7, time + duration * 0.5)
    env.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(filter)
    osc2.connect(filter)
    filter.connect(env)
    env.connect(dest)
    osc.start(time)
    osc2.start(time)
    osc.stop(time + duration + 0.1)
    osc2.stop(time + duration + 0.1)
  }

  const playPad = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.4, pan)
    const oscs = [pitch, pitch + 4, pitch + 7].map((p) => {
      // major chord
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = midiToFreq(p)
      return o
    })
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(filterFreq, 3000)
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + 0.2)
    env.gain.setValueAtTime(1, time + duration - 0.2)
    env.gain.linearRampToValueAtTime(0, time + duration)
    oscs.forEach((o) => {
      o.connect(filter)
      o.start(time)
      o.stop(time + duration + 0.1)
    })
    filter.connect(env)
    env.connect(dest)
  }

  // Sub Bass — pure deep sine, very low filter
  const playSubBass = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.9, pan)
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = midiToFreq(pitch - 12) // one octave lower
    filter.type = 'lowpass'
    filter.frequency.value = 200
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(filter)
    filter.connect(env)
    env.connect(dest)
    osc.start(time)
    osc.stop(time + duration + 0.1)
  }

  // Slap Bass — short attack + pluck with harmonics
  const playSlapBass = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain, pan)
    const osc = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = midiToFreq(pitch)
    osc2.type = 'square'
    osc2.frequency.value = midiToFreq(pitch) * 2
    filter.type = 'bandpass'
    filter.frequency.value = Math.min(filterFreq, 1500)
    filter.Q.value = 4
    env.gain.setValueAtTime(1, time) // hard attack
    env.gain.exponentialRampToValueAtTime(0.3, time + 0.05) // snap decay
    env.gain.exponentialRampToValueAtTime(0.001, time + Math.min(duration, 0.4))
    osc.connect(filter)
    osc2.connect(filter)
    filter.connect(env)
    env.connect(dest)
    osc.start(time)
    osc2.start(time)
    osc.stop(time + 0.5)
    osc2.stop(time + 0.5)
  }

  // Fretless Bass — smooth sine with subtle vibrato
  const playFretless = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.8, pan)
    const osc = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    const freq = midiToFreq(pitch)
    osc.type = 'sine'
    osc.frequency.value = freq
    lfo.frequency.value = 5.5 // vibrato rate
    lfoGain.gain.value = freq * 0.01 // subtle vibrato depth
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(filterFreq, 1200)
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + 0.06)
    env.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(filter)
    filter.connect(env)
    env.connect(dest)
    lfo.start(time)
    osc.start(time)
    lfo.stop(time + duration + 0.1)
    osc.stop(time + duration + 0.1)
  }

  // Electric Piano — FM-style tine piano (carrier + modulator)
  const playEPiano = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.6, pan)
    const carrier = ctx.createOscillator()
    const modulator = ctx.createOscillator()
    const modGain = ctx.createGain()
    const env = ctx.createGain()
    const freq = midiToFreq(pitch)
    carrier.type = 'sine'
    carrier.frequency.value = freq
    modulator.type = 'sine'
    modulator.frequency.value = freq * 14 // FM ratio for tine timbre
    modGain.gain.setValueAtTime(freq * 2, time)
    modGain.gain.exponentialRampToValueAtTime(freq * 0.1, time + 0.3)
    env.gain.setValueAtTime(1, time)
    env.gain.exponentialRampToValueAtTime(0.001, time + duration)
    modulator.connect(modGain)
    modGain.connect(carrier.frequency)
    carrier.connect(env)
    env.connect(dest)
    modulator.start(time)
    carrier.start(time)
    modulator.stop(time + duration + 0.1)
    carrier.stop(time + duration + 0.1)
  }

  // Organ — additive harmonics (Hammond-style)
  const playOrgan = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    _filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.5, pan)
    const freq = midiToFreq(pitch)
    const harmonics = [1, 2, 3, 4, 6] // drawbar harmonics
    const gains = [0.4, 0.3, 0.2, 0.1, 0.05]
    const env = ctx.createGain()
    env.gain.setValueAtTime(1, time)
    env.gain.setValueAtTime(1, time + duration - 0.01)
    env.gain.linearRampToValueAtTime(0, time + duration)
    env.connect(dest)
    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator()
      const hGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq * h
      hGain.gain.value = gains[i] ?? 0.05
      osc.connect(hGain)
      hGain.connect(env)
      osc.start(time)
      osc.stop(time + duration + 0.05)
    })
  }

  // Marimba — short mallet strike with quick decay
  const playMarimba = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.7, pan)
    const freq = midiToFreq(pitch)
    ;[1, 4, 10].forEach((h, i) => {
      // marimba overtones
      const osc = ctx.createOscillator()
      const hGain = ctx.createGain()
      const decay = 0.6 / (i + 1)
      osc.type = 'sine'
      osc.frequency.value = freq * h
      hGain.gain.setValueAtTime(1 / (i + 1), time)
      hGain.gain.exponentialRampToValueAtTime(0.001, time + decay)
      osc.connect(hGain)
      hGain.connect(dest)
      osc.start(time)
      osc.stop(time + decay + 0.05)
    })
  }

  // Bells — high, shimmering bell tone with long sustain
  const playBells = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.5, pan)
    const freq = midiToFreq(pitch + 12) // transpose up for bell range
    ;[1, 2.756, 5.404, 8.933].forEach((ratio, i) => {
      // inharmonic partials
      const osc = ctx.createOscillator()
      const hGain = ctx.createGain()
      const decay = Math.max(0.5, duration) / (i * 0.5 + 1)
      osc.type = 'sine'
      osc.frequency.value = freq * ratio
      hGain.gain.setValueAtTime(1 / (i + 1), time)
      hGain.gain.exponentialRampToValueAtTime(0.001, time + decay)
      osc.connect(hGain)
      hGain.connect(dest)
      osc.start(time)
      osc.stop(time + decay + 0.05)
    })
  }

  // ── Classical Piano ─────────────────────────────────────────────────
  // Additive sine harmonics with piano-like fast attack, multi-stage decay
  const playPiano = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.7, pan)
    const freq = midiToFreq(pitch)
    // Each partial has its own decay rate (higher = faster decay, like a real piano string)
    const partials: [number, number][] = [
      [1, 0.6],
      [2, 0.45],
      [3, 0.3],
      [4, 0.2],
      [5, 0.12],
      [6, 0.08],
    ]
    partials.forEach(([h, g]) => {
      const osc = ctx.createOscillator()
      const hg = ctx.createGain()
      const decayTime = Math.max(duration, 1.0) * (1 / h + 0.5) // higher partials decay faster
      osc.type = 'sine'
      osc.frequency.value = freq * h + (h > 2 ? h * 0.3 : 0) // slight inharmonicity
      hg.gain.setValueAtTime(g, time)
      hg.gain.exponentialRampToValueAtTime(0.001, time + decayTime)
      osc.connect(hg)
      hg.connect(dest)
      osc.start(time)
      osc.stop(time + decayTime + 0.05)
    })
    // Initial click/hammer transient
    const click = createNoise(ctx, 0.01)
    const clickFilter = ctx.createBiquadFilter()
    const clickEnv = ctx.createGain()
    clickFilter.type = 'highpass'
    clickFilter.frequency.value = freq * 3
    clickEnv.gain.setValueAtTime(0.15, time)
    clickEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.012)
    click.connect(clickFilter)
    clickFilter.connect(clickEnv)
    clickEnv.connect(dest)
    click.start(time)
  }

  // ── Bass Guitar ─────────────────────────────────────────────────────
  // Triangle + sawtooth mix for a warm, plucked bass string
  const playBassGuitar = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.85, pan)
    const freq = midiToFreq(pitch)
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    osc1.type = 'triangle' // warm fundamental
    osc1.frequency.value = freq
    osc2.type = 'sawtooth' // harmonic content
    osc2.frequency.value = freq * 2
    g2.gain.value = 0.15
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(filterFreq, 900)
    filter.Q.value = 2
    // Pluck envelope: fast attack, fast initial decay, then slower sustain
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + 0.005)
    env.gain.exponentialRampToValueAtTime(0.5, time + 0.08) // initial pluck transient
    env.gain.exponentialRampToValueAtTime(0.001, time + Math.max(duration, 0.3))
    osc1.connect(filter)
    osc2.connect(g2)
    g2.connect(filter)
    filter.connect(env)
    env.connect(dest)
    osc1.start(time)
    osc2.start(time)
    osc1.stop(time + Math.max(duration, 0.3) + 0.05)
    osc2.stop(time + Math.max(duration, 0.3) + 0.05)
  }

  // ── Electric Guitar ─────────────────────────────────────────────────
  // Bright sawtooth + mid-range bandpass filter, medium sustain
  const playElecGuitar = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.65, pan)
    const freq = midiToFreq(pitch)
    const osc = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const notch = ctx.createBiquadFilter()
    const env = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc2.type = 'sawtooth'
    osc2.frequency.value = freq * 1.003 // slight detune for thickness
    g2.gain.value = 0.5
    // Crunch tone via bandpass near 2kHz (guitar speaker cabinet)
    filter.type = 'bandpass'
    filter.frequency.value = Math.min(freq * 3, 2200)
    filter.Q.value = 0.8
    // Cut the mud below the fundamental
    notch.type = 'highpass'
    notch.frequency.value = freq * 0.8
    // Aggressive pick attack, sustaining body
    env.gain.setValueAtTime(1, time)
    env.gain.exponentialRampToValueAtTime(0.6, time + 0.05)
    env.gain.setValueAtTime(0.6, time + duration - 0.05)
    env.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.05)
    osc.connect(notch)
    osc2.connect(g2)
    g2.connect(notch)
    notch.connect(filter)
    filter.connect(env)
    env.connect(dest)
    osc.start(time)
    osc2.start(time)
    osc.stop(time + duration + 0.1)
    osc2.stop(time + duration + 0.1)
  }

  // ── Classical Guitar ────────────────────────────────────────────────
  // Warm nylon-string: triangle fundamental + soft harmonics, medium-long decay
  const playClassicalGuitar = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.7, pan)
    const freq = midiToFreq(pitch)
    // Nylon string = mostly triangle (soft) + gentle harmonics
    const partials: [number, number][] = [
      [1, 0.7],
      [2, 0.2],
      [3, 0.08],
      [4, 0.03],
    ]
    const decayLen = Math.max(duration + 0.4, 1.0)
    partials.forEach(([h, g]) => {
      const osc = ctx.createOscillator()
      const hg = ctx.createGain()
      osc.type = h === 1 ? 'triangle' : 'sine'
      osc.frequency.value = freq * h
      hg.gain.setValueAtTime(g, time)
      hg.gain.exponentialRampToValueAtTime(0.001, time + decayLen / h)
      osc.connect(hg)
      hg.connect(dest)
      osc.start(time)
      osc.stop(time + decayLen / h + 0.05)
    })
    // Nail/finger pluck click
    const click = createNoise(ctx, 0.008)
    const cf = ctx.createBiquadFilter()
    const ce = ctx.createGain()
    cf.type = 'bandpass'
    cf.frequency.value = freq * 5
    cf.Q.value = 3
    ce.gain.setValueAtTime(0.12, time)
    ce.gain.exponentialRampToValueAtTime(0.001, time + 0.01)
    click.connect(cf)
    cf.connect(ce)
    ce.connect(dest)
    click.start(time)
  }

  // ── Acoustic Guitar ─────────────────────────────────────────────────
  // Steel-string: brighter, more harmonics, quick initial decay + short sustain
  const playAcousticGuitar = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.75, pan)
    const freq = midiToFreq(pitch)
    // Steel string = sawtooth dominant + multiple harmonics
    const partials: [number, number][] = [
      [1, 0.55],
      [2, 0.25],
      [3, 0.12],
      [4, 0.06],
      [5, 0.02],
    ]
    const decayLen = Math.max(duration * 0.8, 0.6)
    partials.forEach(([h, g]) => {
      const osc = ctx.createOscillator()
      const hg = ctx.createGain()
      osc.type = h <= 2 ? 'sawtooth' : 'sine'
      osc.frequency.value = freq * h
      hg.gain.setValueAtTime(g, time)
      hg.gain.setValueAtTime(g * 0.6, time + 0.04) // fast initial decay (pluck)
      hg.gain.exponentialRampToValueAtTime(0.001, time + decayLen)
      osc.connect(hg)
      hg.connect(dest)
      osc.start(time)
      osc.stop(time + decayLen + 0.05)
    })
    // Pick transient
    const click = createNoise(ctx, 0.01)
    const cf = ctx.createBiquadFilter()
    const ce = ctx.createGain()
    cf.type = 'highpass'
    cf.frequency.value = freq * 2
    ce.gain.setValueAtTime(0.2, time)
    ce.gain.exponentialRampToValueAtTime(0.001, time + 0.015)
    click.connect(cf)
    cf.connect(ce)
    ce.connect(dest)
    click.start(time)
  }

  // ── Violin ──────────────────────────────────────────────────────────
  // Bowed string: slow attack, sawtooth body + resonance body filter + vibrato
  const playViolin = (
    ctx: AudioContext,
    time: number,
    pitch: number,
    duration: number,
    gain: number,
    pan: number,
    filterFreq: number,
  ) => {
    const dest = createGainAndPan(ctx, gain * 0.6, pan)
    const freq = midiToFreq(pitch)
    // Vibrato LFO
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 5.5
    lfoGain.gain.value = freq * 0.012
    lfo.connect(lfoGain)
    // Two slightly detuned sawtooths for rich bowed tone
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    osc1.type = 'sawtooth'
    osc1.frequency.value = freq
    osc2.type = 'sawtooth'
    osc2.frequency.value = freq * 1.004 // warmth through slight detune
    g2.gain.value = 0.6
    lfoGain.connect(osc1.frequency)
    lfoGain.connect(osc2.frequency)
    // Violin body resonance: two formant peaks
    const formant1 = ctx.createBiquadFilter()
    const formant2 = ctx.createBiquadFilter()
    formant1.type = 'peaking'
    formant1.frequency.value = 300
    formant1.Q.value = 3
    formant1.gain.value = 6
    formant2.type = 'peaking'
    formant2.frequency.value = 3000
    formant2.Q.value = 2
    formant2.gain.value = 4
    // Lowpass ceiling
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = Math.min(filterFreq * 0.6, 5000)
    // Bow envelope: slow attack + linear release
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + 0.12) // bow catching the string
    env.gain.setValueAtTime(1, time + Math.max(duration - 0.1, 0.11))
    env.gain.linearRampToValueAtTime(0, time + duration + 0.02)
    osc1.connect(formant1)
    osc2.connect(g2)
    g2.connect(formant1)
    formant1.connect(formant2)
    formant2.connect(lp)
    lp.connect(env)
    env.connect(dest)
    lfo.start(time)
    osc1.start(time)
    osc2.start(time)
    lfo.stop(time + duration + 0.1)
    osc1.stop(time + duration + 0.1)
    osc2.stop(time + duration + 0.1)
  }

  const playMetronome = (ctx: AudioContext, time: number, isBeat: boolean) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.frequency.value = isBeat ? 1760 : 880
    env.gain.setValueAtTime(0.3, time)
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.connect(env)
    env.connect(masterGain.value!)
    osc.start(time)
    osc.stop(time + 0.05)
  }

  const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

  const playSound = (
    instrumentId: string,
    time: number,
    options: {
      velocity?: number // 0–127
      pan?: number
      filterFreq?: number
      pitch?: number
      duration?: number
    } = {},
  ) => {
    const ctx = initAudio()
    const gain = (options.velocity ?? 100) / 127
    const pan = options.pan ?? 0
    const filterFreq = options.filterFreq ?? 8000
    const pitch = options.pitch ?? 60
    const duration = options.duration ?? 0.25

    const id = instrumentId as SoundType
    switch (id) {
      case 'kick':
        playKick(ctx, time, gain, pan)
        break
      case 'snare':
        playSnare(ctx, time, gain, pan)
        break
      case 'hihat':
        playHiHat(ctx, time, gain, pan, false)
        break
      case 'openhat':
        playHiHat(ctx, time, gain, pan, true)
        break
      case 'tom':
        playTom(ctx, time, gain, pan)
        break
      case 'clap':
        playClap(ctx, time, gain, pan)
        break
      case 'cowbell':
        playCowbell(ctx, time, gain, pan)
        break
      case 'rimshot':
        playRimshot(ctx, time, gain, pan)
        break
      // Bass
      case 'bass':
        playBass(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      case 'subbass':
        playSubBass(ctx, time, pitch, duration, gain, pan)
        break
      case 'slapbass':
        playSlapBass(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      case 'fretless':
        playFretless(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      case 'bassgtr':
        playBassGuitar(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      // Melodic
      case 'synth':
        playSynth(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      case 'pad':
        playPad(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      case 'epiano':
        playEPiano(ctx, time, pitch, duration, gain, pan)
        break
      case 'organ':
        playOrgan(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      case 'marimba':
        playMarimba(ctx, time, pitch, gain, pan)
        break
      case 'bells':
        playBells(ctx, time, pitch, duration, gain, pan)
        break
      case 'piano':
        playPiano(ctx, time, pitch, duration, gain, pan)
        break
      // Strings
      case 'violin':
        playViolin(ctx, time, pitch, duration, gain, pan, filterFreq)
        break
      // Guitar
      case 'elecgtr':
        playElecGuitar(ctx, time, pitch, duration, gain, pan)
        break
      case 'classgtr':
        playClassicalGuitar(ctx, time, pitch, duration, gain, pan)
        break
      case 'acoustgtr':
        playAcousticGuitar(ctx, time, pitch, duration, gain, pan)
        break
    }
  }

  const setMasterVolume = (value: number) => {
    if (masterGain.value) masterGain.value.gain.value = value
  }

  return {
    audioCtx,
    masterGain,
    initAudio,
    playSound,
    playMetronome,
    setMasterVolume,
    midiToFreq,
  }
}
