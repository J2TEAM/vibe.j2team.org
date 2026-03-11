export type Rng = () => number

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomSeed(): number {
  try {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    return values[0] ?? Date.now() >>> 0
  } catch {
    return (Date.now() >>> 0) ^ ((Math.random() * 0xffffffff) >>> 0)
  }
}
