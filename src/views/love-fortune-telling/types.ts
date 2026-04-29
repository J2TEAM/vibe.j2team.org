export interface CalculationStep {
  type: 'input' | 'count' | 'combine' | 'result'
  content: string
  displayItems?: string[]
}

export interface FireworkParticle {
  id: string
  dx: number
  dy: number
  size: number
  colorClass: string
  delay: number
  duration: number
}

export interface FireworkBurst {
  id: string
  x: number
  y: number
  delay: number
  particles: FireworkParticle[]
}
