import type { CharacterStats, Weapon } from '../types'

/** A = weapon_dmg × (1 + ATK / 1000) */
export function computeRawDamage(weapon: Weapon, atk: number, buffCoeff: number): number {
  return weapon.baseDamage * (1 + atk / 1000) * buffCoeff
}

/** B = armor × (1 + DEF / 1000) */
export function computeReduction(stats: CharacterStats): number {
  return stats.armor * (1 + stats.def / 1000)
}

/** Returns { finalDamage, isCrit } */
export function resolveDamage(
  weapon: Weapon,
  attackerStats: CharacterStats,
  defenderStats: CharacterStats,
  buffCoeff: number,
): { finalDamage: number; isCrit: boolean } {
  const A = computeRawDamage(weapon, attackerStats.atk, buffCoeff)
  const B = computeReduction(defenderStats)

  // Critical chance: base 5% + LCK/200
  const critChance = 0.05 + attackerStats.lck / 200
  const isCrit = Math.random() < critChance
  const critCoeff = isCrit ? (attackerStats.lck > 100 ? 2.0 : 1.5) : 1.0

  const raw = (A - B) * critCoeff
  const finalDamage = Math.max(1, Math.round(raw)) // minimum 1 damage
  return { finalDamage, isCrit }
}

/**
 * Compute delay added to a character after a turn.
 * Total_Delay = (D_base + ΣD_items) × (1 − AGI / K)
 * K = 500 so that AGI=250 → 50% reduction
 */
const AGI_CONSTANT = 500

export function computeDelay(weaponBaseDelay: number, itemDelayTotal: number, agi: number): number {
  const raw =
    (weaponBaseDelay + itemDelayTotal) * (1 - Math.min(agi, AGI_CONSTANT - 10) / AGI_CONSTANT)
  return Math.max(10, Math.round(raw))
}

/** Stamina cost: 240 base + AGI bonus */
export function computeMaxStamina(agi: number): number {
  return 240 + Math.floor(agi / 10)
}
