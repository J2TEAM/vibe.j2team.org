let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.15) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

function playNoise(duration: number, vol = 0.08) {
  const ctx = getCtx()
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}

export function useAudio() {
  function jump(power: number) {
    const freq = 300 + power * 400
    playTone(freq, 0.15, 'square', 0.08)
    playTone(freq * 1.5, 0.1, 'sine', 0.05)
  }

  function land() {
    playTone(200, 0.1, 'triangle', 0.1)
    playNoise(0.05, 0.06)
  }

  function landCombo(combo: number) {
    const base = 400 + combo * 80
    playTone(base, 0.12, 'sine', 0.12)
    setTimeout(() => playTone(base * 1.25, 0.12, 'sine', 0.1), 60)
    if (combo >= 3) setTimeout(() => playTone(base * 1.5, 0.15, 'sine', 0.1), 120)
  }

  function collectItem() {
    playTone(800, 0.08, 'sine', 0.1)
    setTimeout(() => playTone(1200, 0.08, 'sine', 0.08), 50)
    setTimeout(() => playTone(1600, 0.1, 'sine', 0.06), 100)
  }

  function explosion() {
    playNoise(0.3, 0.15)
    playTone(80, 0.3, 'sawtooth', 0.08)
  }

  function warp() {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  }

  function fail() {
    playTone(300, 0.15, 'sawtooth', 0.08)
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.06), 100)
  }

  function slide() {
    playTone(150, 0.2, 'triangle', 0.05)
  }

  function biomeChange() {
    playTone(500, 0.15, 'sine', 0.08)
    setTimeout(() => playTone(700, 0.15, 'sine', 0.06), 100)
    setTimeout(() => playTone(900, 0.2, 'sine', 0.05), 200)
  }

  function win() {
    const notes = [523, 659, 784, 1047]
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.3, 'sine', 0.12), i * 120)
    })
  }

  return { jump, land, landCombo, collectItem, explosion, warp, fail, slide, biomeChange, win }
}
