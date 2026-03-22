import type { Boss, GameEngine } from './types'

export const getCampaignBosses = (
  wave: number,
  activeWidth: number,
  hpMult: number,
  engine: GameEngine,
): Boss[] => {
  const bosses: Boss[] = []
  const baseHp = (1000 + wave * 400) * hpMult

  const createBoss = (type: number, x: number, y: number, hp: number, w = 160, h = 160): Boss => ({
    id: `boss-${engine.objCounter++}`,
    bossType: type,
    x,
    y,
    targetY: 40,
    width: w,
    height: h,
    hp,
    maxHp: hp,
    direction: 1,
    state: 'idle',
    stateTimer: 60,
    laserTimer: 200,
    burstCount: 0,
  })

  switch (wave) {
    case 10:
      bosses.push(createBoss(0, activeWidth / 2 - 80, -200, baseHp))
      break
    case 20:
      bosses.push(createBoss(0, activeWidth / 3 - 80, -200, baseHp))
      bosses.push(createBoss(0, (activeWidth * 2) / 3 - 80, -200, baseHp))
      break
    case 30:
      // 2 Boss type 1
      bosses.push(createBoss(1, activeWidth / 3 - 60, -200, baseHp * 0.8, 120, 120))
      bosses.push(createBoss(1, (activeWidth * 2) / 3 - 60, -200, baseHp * 0.8, 120, 120))
      break
    case 40:
      bosses.push(createBoss(2, activeWidth / 2 - 80, -200, baseHp)) // UFO
      break
    case 50:
      bosses.push(createBoss(2, activeWidth / 3 - 80, -200, baseHp))
      bosses.push(createBoss(2, (activeWidth * 2) / 3 - 80, -200, baseHp))
      break
    case 60:
      bosses.push(createBoss(0, activeWidth / 3 - 80, -200, baseHp))
      bosses.push(createBoss(4, (activeWidth * 2) / 3 - 80, -200, baseHp))
      break
    case 70:
      // 2 Boss type 3 (Cỗ máy Laser 3 tia)
      bosses.push(createBoss(3, activeWidth / 3 - 80, -200, baseHp * 1.2))
      bosses.push(createBoss(3, (activeWidth * 2) / 3 - 80, -200, baseHp * 1.2))
      break
    case 80:
      // 2 Boss type 4
      bosses.push(createBoss(4, activeWidth / 3 - 80, -200, baseHp))
      bosses.push(createBoss(4, (activeWidth * 2) / 3 - 80, -200, baseHp))
      break
    case 90:
      // 1 Boss Gà Trắng
      bosses.push(createBoss(6, activeWidth / 2 - 80, -200, baseHp * 1.5))
      break
    case 100:
      // 2 Boss Gà Trắng
      bosses.push(createBoss(6, activeWidth / 3 - 80, -200, baseHp))
      bosses.push(createBoss(6, (activeWidth * 2) / 3 - 80, -200, baseHp))
      break
    case 110:
      // 2 Boss type 5 (Gà Vàng Laser)
      bosses.push(createBoss(5, activeWidth / 3 - 80, -200, baseHp))
      bosses.push(createBoss(5, (activeWidth * 2) / 3 - 80, -200, baseHp))
      break
    case 120:
      // FINAL BOSS
      const bossHeight = activeWidth * 0.1
      const bossWidth = 600
      const finalBoss = createBoss(
        99,
        activeWidth / 2 - bossWidth / 2,
        -200,
        baseHp * 8,
        bossWidth,
        bossHeight,
      )
      finalBoss.targetY = 20
      bosses.push(finalBoss)
      break
    default:
      bosses.push(createBoss(0, activeWidth / 2 - 80, -200, baseHp))
      break
  }
  return bosses
}
