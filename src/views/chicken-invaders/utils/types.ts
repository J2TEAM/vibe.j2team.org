export interface GameObject {
  x: number
  y: number
  width: number
  height: number
}

export interface Bullet extends GameObject {
  id: string | number
  dx: number
  dy: number
  color: string
  shape: string
  damage: number
  rotation: number
  hitTargets: Set<string | number>
  isAttached?: boolean
  attachedId?: number
  lastTick?: number
}

export interface Enemy extends GameObject {
  id: string | number
  hp: number
  maxHp: number
  isMeteor?: boolean
  isFallingChicken?: boolean
  isHazard?: boolean
  isStash?: boolean
  shirtColor?: string
  targetY?: number
  dx?: number
  dy?: number
  targetOffsetX?: number
  targetOffsetY?: number
}

export interface Boss extends Enemy {
  bossType: number
  direction: number
  state: 'idle' | 'dash' | 'burst' | 'laser_warning' | 'laser_firing' | 'circle_burst'
  stateTimer: number
  burstCount?: number
  laserTimer?: number
  laserX?: number
  laserXs?: number[] // Hỗ trợ bắn nhiều tia laser cùng lúc
}

export interface Egg extends GameObject {
  id: string | number
  isBossEgg?: boolean
  isMeteor?: boolean
  dx?: number
  dy?: number
}

export interface PowerUp extends GameObject {
  id: string | number
  wType: number
}

export interface ActiveDot {
  targetId: string | number
  damagePerTick: number
  endTime: number
  lastTick: number
}

export interface LeaderboardEntry {
  score: number
  wave: number
  difficulty: string
  date: number
}
