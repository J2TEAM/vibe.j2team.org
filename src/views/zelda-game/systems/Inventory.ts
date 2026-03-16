import type { WeaponType } from '../utils/types'

export class Inventory {
  private weapons: Set<WeaponType> = new Set()

  unlock(weapon: WeaponType): void {
    this.weapons.add(weapon)
  }

  unlockAll(): void {
    this.weapons.add('sword')
    this.weapons.add('shield')
    this.weapons.add('bow')
  }

  has(weapon: WeaponType): boolean {
    return this.weapons.has(weapon)
  }

  reset(): void {
    this.weapons.clear()
  }
}
