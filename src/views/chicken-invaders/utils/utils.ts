import type { GameObject, Enemy } from './types'

export const checkCollision = (rect1?: GameObject, rect2?: GameObject) => {
  if (!rect1 || !rect2) return false
  const padding = 5
  return (
    rect1.x < rect2.x + rect2.width - padding &&
    rect1.x + rect1.width > rect2.x + padding &&
    rect1.y < rect2.y + rect2.height - padding &&
    rect1.y + rect1.height > rect2.y + padding
  )
}

export const getWeaponStats = (typeId: number, level: number) => {
  let rays = 1,
    damage = 10
  if (typeId === 0) {
    rays = 1
    damage = 15 + level * 5
  } else if (typeId === 1) {
    rays = Math.min(1 + Math.floor(level / 2), 20)
    damage = 8 + level * 3
  } else if (typeId === 2) {
    rays = Math.min(1 + Math.floor(level / 2), 7)
    damage = 15 + level * 5
  } else if (typeId === 3) {
    rays = Math.min(level, 5)
    damage = 12 + level * 4
  } else if (typeId === 4) {
    rays = Math.min(1 + Math.floor(level / 3), 10)
    damage = 25 + level * 7
  } else if (typeId === 5) {
    rays = level < 10 ? 1 : level < 20 ? 2 : 3
    damage = 12 + level * 3
  } else if (typeId === 6) {
    rays = 1
    damage = 15 + level * 4
  } else if (typeId === 7) {
    rays = Math.min(1 + Math.floor(level / 4), 6)
    damage = 14 + level * 5
  } else if (typeId === 8) {
    rays = 1
    damage = 40 + level * 15
  } else if (typeId === 9) {
    rays = Math.min(3 + Math.floor(level / 3) * 2, 5)
    damage = 10 + level * 2
  }
  return { rays, damage }
}

export const arrangeFormation = (list: Enemy[], type: number) => {
  if (type === 0) {
    let idx = 0
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c <= r; c++) {
        const enemy = list[idx]
        if (enemy) {
          enemy.targetOffsetX = (c - r / 2) * 55
          enemy.targetOffsetY = r * 45 - 60
        }
        idx++
      }
    }
  } else if (type === 1) {
    list.forEach((e, i) => {
      const angle = (Math.PI * 2 * i) / list.length
      e.targetOffsetX = Math.cos(angle) * 120
      e.targetOffsetY = Math.sin(angle) * 120
    })
  } else if (type === 2) {
    list.forEach((e, i) => {
      if (i === 0) {
        e.targetOffsetX = 0
        e.targetOffsetY = -100
      } else if (i <= 7) {
        e.targetOffsetX = -i * 35
        e.targetOffsetY = -100 + i * 35
      } else {
        const j = i - 7
        e.targetOffsetX = j * 35
        e.targetOffsetY = -100 + j * 35
      }
    })
  }
}

export const getRotationForWave = (wave: number) => {
  const h = Math.floor((wave - 1) / 100)
  const t = ((wave - 1) % 100) + 1
  if ((h - 3) % 5 === 0) return 180
  if (h % 2 === 1 && t >= 51 && t <= 60) return 180
  if (t >= 21 && t <= 30) return -90
  if (t >= 81 && t <= 90) return 90
  return 0
}
