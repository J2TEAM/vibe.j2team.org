import { estimateAngle, estimatePower } from '../utils/ballistics'
import type { Character, Wind } from '../types'
import { ref } from 'vue'
import { BUFFS } from './useGameState'

export type AIHardness = 'medium' | 'hard' | 'asian'

/** Returns AI decision: angle, power, selectedBuff (may be null) */
export interface AIDecision {
  angle: number
  power: number
  buffIds: (keyof typeof BUFFS)[]
}

export function useAI() {
  const hardLevel = ref<AIHardness>('medium')
  const randomFactor: Record<AIHardness, number> = {
    medium: 1.0, // ±100% error
    hard: 0.5, // ±50% error
    asian: 0.0, // ±0% error (just for fun)
  }

  function setHardness(level: AIHardness) {
    hardLevel.value = level
  }

  function computeDecision(aiChar: Character, enemy: Character, wind: Wind): AIDecision {
    const dx = enemy.x - aiChar.x
    const isTailwind = (wind.value > 0 && dx > 0) || (wind.value < 0 && dx < 0)
    const absWind = Math.abs(wind.value)
    const random = randomFactor[hardLevel.value]

    const weapon = aiChar.weapon
    const { minAngle, maxAngle } = weapon

    // 30% chance to use digging strategy (high angle)
    const useHighAngle = Math.random() < 0.3

    let angle: number
    if (useHighAngle && maxAngle >= 80) {
      // Bắn siêu cao: 85–90° for dig
      angle = Math.min(maxAngle, 80 + Math.random() * 8)
    } else {
      // Classic 65° rule adjusted for wind
      angle = estimateAngle(absWind, isTailwind, minAngle, maxAngle)
    }

    // Angle jitter
    angle = angle + (Math.random() * 2 - 1) * random * 5
    angle = Math.max(minAngle, Math.min(maxAngle, angle))

    // Wind-corrected power estimation
    let power = estimatePower(dx, angle, aiChar.facingRight, wind.value)

    // Power jitter
    power = Math.max(10, Math.min(95, power + (Math.random() * 2 - 1) * random * 5))

    // Use buffs
    const buffIds: AIDecision['buffIds'] = []

    let rand = Math.random()
    if (rand < 0.3) buffIds.push('dmg50')
    else if (rand < 0.6) buffIds.push('dmg30')

    rand = Math.random()
    if (rand < 0.1) {
      buffIds.push('trident')
    } else if (rand < 0.2) {
      buffIds.push('extra1')
    }

    return { angle, power, buffIds }
  }

  return { setHardness, computeDecision }
}
