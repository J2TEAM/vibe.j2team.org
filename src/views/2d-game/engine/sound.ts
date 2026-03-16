// 8-bit Sound Engine using Web Audio API
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', vol = 0.15) {
  try {
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
  } catch {
    /* ignore audio errors */
  }
}

function playNoise(duration: number, vol = 0.1) {
  try {
    const ctx = getCtx()
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch {
    /* ignore */
  }
}

export function sfxAttack() {
  playTone(800, 0.08, 'sawtooth', 0.12)
  setTimeout(() => playTone(600, 0.06, 'square', 0.08), 30)
}

export function sfxHit() {
  playTone(200, 0.1, 'square', 0.15)
  playNoise(0.05, 0.08)
}

export function sfxKill() {
  playTone(500, 0.08, 'square', 0.1)
  setTimeout(() => playTone(700, 0.08, 'square', 0.1), 60)
  setTimeout(() => playTone(900, 0.12, 'square', 0.1), 120)
}

export function sfxPlayerHurt() {
  playTone(300, 0.15, 'sawtooth', 0.12)
  playTone(150, 0.2, 'square', 0.1)
}

export function sfxJump() {
  const ctx = getCtx()
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch {
    /* ignore */
  }
}

export function sfxLevelUp() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'square', 0.12), i * 100))
}

export function sfxChestOpen() {
  playTone(400, 0.1, 'triangle', 0.12)
  setTimeout(() => playTone(600, 0.1, 'triangle', 0.12), 80)
  setTimeout(() => playTone(800, 0.15, 'triangle', 0.15), 160)
}

export function sfxItem() {
  playTone(880, 0.08, 'sine', 0.1)
  setTimeout(() => playTone(1100, 0.12, 'sine', 0.12), 60)
}

export function sfxGameOver() {
  const notes = [400, 350, 300, 200]
  notes.forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'square', 0.1), i * 150))
}

export function sfxMenuSelect() {
  playTone(600, 0.08, 'square', 0.08)
  setTimeout(() => playTone(800, 0.06, 'square', 0.08), 50)
}

export function initAudio() {
  try {
    getCtx()
  } catch {
    /* ignore */
  }
}
