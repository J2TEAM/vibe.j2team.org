export function generateSeed(): number {
  return Date.now() + navigator.userAgent.length + window.innerWidth
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
