import type { Monster, MonsterType } from '../types'
import { getBiomeForLevel } from '../world/biomes'
import { CANVAS_HEIGHT } from '../engine/constants'

// Monster stat configurations - Open/Closed: extend by adding entries, no core changes needed
const MONSTER_CONFIGS: Record<
  MonsterType,
  {
    w: number
    h: number
    hp: number
    speed: number
    damage: number
    exp: number
    score: number
    color: string
    flying: boolean
  }
> = {
  slime: {
    w: 24,
    h: 20,
    hp: 30,
    speed: 1,
    damage: 8,
    exp: 15,
    score: 100,
    color: '#4ade80',
    flying: false,
  },
  skeleton: {
    w: 26,
    h: 38,
    hp: 60,
    speed: 1.8,
    damage: 15,
    exp: 30,
    score: 200,
    color: '#e2e8f0',
    flying: false,
  },
  demon: {
    w: 30,
    h: 42,
    hp: 100,
    speed: 2.2,
    damage: 25,
    exp: 50,
    score: 350,
    color: '#f87171',
    flying: false,
  },
  boss: {
    w: 48,
    h: 56,
    hp: 300,
    speed: 1.5,
    damage: 40,
    exp: 150,
    score: 1000,
    color: '#a855f7',
    flying: false,
  },
  bat: {
    w: 22,
    h: 18,
    hp: 25,
    speed: 2.5,
    damage: 10,
    exp: 20,
    score: 150,
    color: '#8b5cf6',
    flying: true,
  },
  ghost: {
    w: 26,
    h: 30,
    hp: 45,
    speed: 1.6,
    damage: 18,
    exp: 35,
    score: 250,
    color: '#c4b5fd',
    flying: true,
  },
}

/** Biome color overrides for slime variants */
const BIOME_SLIME_COLORS: Record<string, string> = {
  desert: '#d4a44a',
  ice: '#93c5fd',
  volcano: '#fb923c',
}

/** Create a new monster instance */
export function createMonster(
  type: MonsterType,
  x: number,
  level: number,
  H: number = CANVAS_HEIGHT,
): Monster {
  const baseConfig = { ...MONSTER_CONFIGS[type] }
  const biome = getBiomeForLevel(level)

  // Apply biome color variant
  if (type === 'slime' && BIOME_SLIME_COLORS[biome]) {
    baseConfig.color = BIOME_SLIME_COLORS[biome]!
  }

  return {
    x,
    y: baseConfig.flying ? H - 200 - Math.random() * 120 : H - 100,
    vx: 0,
    vy: 0,
    w: baseConfig.w,
    h: baseConfig.h,
    hp: baseConfig.hp + level * 5,
    maxHp: baseConfig.hp + level * 5,
    type,
    speed: baseConfig.speed + level * 0.1,
    damage: baseConfig.damage + level * 2,
    exp: baseConfig.exp,
    scoreValue: baseConfig.score,
    onGround: false,
    facing: -1,
    animFrame: 0,
    animTimer: 0,
    attackTimer: 0,
    attackCooldown: 60,
    state: 'chase',
    hurtTimer: 0,
    color: baseConfig.color,
    dead: false,
    flying: baseConfig.flying,
  }
}

/** Get available monster types based on level */
export function getSpawnPool(level: number, hasExistingBoss: boolean): MonsterType[] {
  const types: MonsterType[] = ['slime', 'slime', 'slime']
  if (level >= 2) types.push('skeleton', 'bat')
  if (level >= 3) types.push('skeleton', 'demon', 'bat', 'bat')
  if (level >= 4) types.push('ghost', 'ghost')
  if (level >= 5) types.push('demon', 'demon', 'ghost')
  if (level >= 7 && !hasExistingBoss) types.push('boss')
  return types
}

/** Pick a random type from spawn pool */
export function pickRandomType(pool: MonsterType[]): MonsterType {
  return pool[Math.floor(Math.random() * pool.length)] ?? 'slime'
}
