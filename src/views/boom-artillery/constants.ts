import type { Difficulty } from './types'

export const GRAVITY = 0.02
export const MAX_POWER = 7
export const EXPLOSION_RADIUS = 45
export const TANK_WIDTH = 40
export const TANK_HEIGHT = 20
export const DAMAGE_DIRECT = 35
export const DAMAGE_SPLASH = 15
export const CANVAS_ASPECT = 16 / 9
export const MOVE_SPEED = 0.5

// Stamina system
export const MAX_STAMINA = 100
export const STAMINA_PER_MOVE = 0.75 // stamina cost per movement frame
export const ANGLE_STEP = 1
// Local angle: 0° = horizontal forward, 90° = vertical up
export const MIN_ANGLE = 0
export const MAX_ANGLE = 90
export const POWER_CHARGE_RATE = 0.3 // power % per frame when charging (slower)

// Terrain slope influence on firing angle
export const TERRAIN_SLOPE_RANGE = 20 // pixels left/right to sample slope
export const TERRAIN_SLOPE_MAX_OFFSET = 15 // max degrees offset from slope

export const DIFFICULTIES: Difficulty[] = [
  { id: 'easy', label: 'Dễ', icon: '😊', accuracy: 0.3 },
  { id: 'medium', label: 'Trung bình', icon: '😐', accuracy: 0.6 },
  { id: 'hard', label: 'Khó', icon: '😈', accuracy: 0.85 },
]

export const WEAPONS = [
  {
    id: 'standard',
    name: 'Đạn thường',
    staminaCost: 0,
    damageMultiplier: 1,
    explosionRadiusMultiplier: 1,
    projectilesCount: 1,
    shotsPerTurn: 1,
    spreadAngle: 0,
  },
  {
    id: 'triple',
    name: 'Đạn 3 tia',
    staminaCost: 40,
    damageMultiplier: 0.25,
    explosionRadiusMultiplier: 0.7,
    projectilesCount: 3,
    shotsPerTurn: 1,
    spreadAngle: 15,
  },
  {
    id: 'heavy',
    name: 'Đạn nổ to',
    staminaCost: 60,
    damageMultiplier: 1.5,
    explosionRadiusMultiplier: 1.5,
    projectilesCount: 1,
    shotsPerTurn: 1,
    spreadAngle: 0,
  },
  {
    id: 'plus1',
    name: 'Đạn +1',
    staminaCost: 30,
    damageMultiplier: 0.8,
    explosionRadiusMultiplier: 0.8,
    projectilesCount: 1,
    shotsPerTurn: 2,
    spreadAngle: 0,
  },
  {
    id: 'plus2',
    name: 'Đạn +2',
    staminaCost: 50,
    damageMultiplier: 0.6,
    explosionRadiusMultiplier: 0.6,
    projectilesCount: 1,
    shotsPerTurn: 3,
    spreadAngle: 0,
  },
  {
    id: 'nuke',
    name: 'Hạt nhân',
    staminaCost: 100,
    damageMultiplier: 2.5,
    explosionRadiusMultiplier: 2.5,
    projectilesCount: 1,
    shotsPerTurn: 1,
    spreadAngle: 0,
  },
]
