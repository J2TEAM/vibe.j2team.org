/* eslint-disable @typescript-eslint/no-explicit-any */

export const createInstruments = (Tone: any) => {
  const limiter = new Tone.Limiter(-3).toDestination()
  const masterVol = new Tone.Volume(-4).connect(limiter)

  const reverb = new Tone.Reverb({ decay: 6, wet: 0.6 }).connect(masterVol)

  // Clean low-end: Add high-pass filters to prevent mud buildup
  const padHPF = new Tone.Filter(100, 'highpass').connect(reverb)
  const pad = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 12,
    oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
    envelope: { attack: 1.5, decay: 1, sustain: 0.8, release: 3 },
  }).connect(padHPF)
  pad.volume.value = -12 // Level restored from hard-mute

  const droneHPF = new Tone.Filter(80, 'highpass').connect(reverb)
  const cosmicDrone = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 12,
    oscillator: { type: 'sine' },
    envelope: { attack: 5, decay: 2, sustain: 1, release: 8 },
  }).connect(droneHPF)
  cosmicDrone.volume.value = -16 // Level restored from hard-mute

  const bioPulse = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 10,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
  }).connect(reverb)
  bioPulse.volume.value = -10

  const digitalCrystal = new Tone.PolySynth(Tone.FMSynth, {
    maxPolyphony: 12,
    harmonicity: 3,
    modulationIndex: 8,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 1.2 },
  }).connect(reverb)
  digitalCrystal.volume.value = -12

  const shatterNoise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.0, release: 0.6 },
  }).connect(masterVol)
  shatterNoise.volume.value = -10 // Boosted for more impact 'fuzzy' texture

  const arpeggio = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 1.5 },
  }).connect(reverb)
  arpeggio.volume.value = -10

  const sweep = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 2.0, decay: 1.0, sustain: 0.5, release: 3.0 },
  }).connect(
    new Tone.AutoFilter({
      frequency: 0.08,
      baseFrequency: 200,
      octaves: 4,
    })
      .connect(reverb)
      .start(),
  )
  sweep.volume.value = -22 // Level restored from hard-mute

  const pulseBass = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 1.2 },
  }).connect(reverb)
  pulseBass.volume.value = -24

  const vibrato = new Tone.Vibrato({ frequency: 0.5, depth: 0.1 }).connect(reverb)

  const bioPad = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 12,
    oscillator: { type: 'fatsawtooth', count: 2, spread: 15 },
    envelope: { attack: 1.0, decay: 0.8, sustain: 0.9, release: 2.0 },
  }).connect(vibrato)
  // Also HPF the bioPad via the same padHPF or locally
  bioPad.volume.value = -16

  const padDigital = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 12,
    oscillator: { type: 'fatsawtooth', count: 2, spread: 15 },
    envelope: { attack: 0.3, decay: 0.8, sustain: 0.7, release: 1.5 },
  }).connect(reverb)
  padDigital.volume.value = -10

  const piano = new Tone.Sampler({
    urls: {
      A3: 'A3.mp3',
      C4: 'C4.mp3',
      'D#4': 'Ds4.mp3',
      'F#4': 'Fs4.mp3',
      A4: 'A4.mp3',
      C5: 'C5.mp3',
    },
    release: 1,
    baseUrl: 'https://tonejs.github.io/audio/salamander/',
  }).connect(reverb)
  piano.volume.value = -8

  return {
    masterVol,
    pad,
    cosmicDrone,
    bioPulse,
    digitalCrystal,
    shatterNoise,
    arpeggio,
    sweep,
    bioPad,
    piano,
    pulseBass,
    padDigital,
    _bangTriggered: false,
    _42Triggered: false,
    _cubeShatterTriggered: false,
    _dnaShatterTriggered: false,
    _atgcSnapTriggered: false,
    _pulseLock: false,
    _shockLock: false,
    _collisionTriggered: false,
    _mergeUnifiedTriggered: false,
    _pianoTick: -1,
  }
}
