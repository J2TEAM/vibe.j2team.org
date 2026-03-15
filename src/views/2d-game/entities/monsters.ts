import type { Monster, MonsterType, BiomeType } from '../types'
import { getBiomeForLevel } from '../world/biomes'
import { CANVAS_HEIGHT } from '../engine/constants'

// Monster stat configurations
const MONSTER_CONFIGS: Record<MonsterType, {
    w: number; h: number; hp: number; speed: number; damage: number
    exp: number; score: number; color: string; flying: boolean
}> = {
    // === FOREST ===
    slime: { w: 24, h: 20, hp: 30, speed: 1, damage: 8, exp: 15, score: 100, color: '#4ade80', flying: false },
    skeleton: { w: 26, h: 38, hp: 60, speed: 1.8, damage: 15, exp: 30, score: 200, color: '#e2e8f0', flying: false },
    bat: { w: 22, h: 18, hp: 25, speed: 2.5, damage: 10, exp: 20, score: 150, color: '#8b5cf6', flying: true },

    // === DESERT ===
    scorpion: { w: 28, h: 16, hp: 80, speed: 2.0, damage: 20, exp: 35, score: 250, color: '#d97706', flying: false },
    mummy: { w: 28, h: 40, hp: 120, speed: 1.2, damage: 28, exp: 50, score: 350, color: '#a8a29e', flying: false },
    sand_worm: { w: 34, h: 22, hp: 100, speed: 2.8, damage: 22, exp: 45, score: 300, color: '#ca8a04', flying: false },

    // === ICE ===
    ice_golem: { w: 32, h: 44, hp: 180, speed: 1.0, damage: 35, exp: 60, score: 400, color: '#93c5fd', flying: false },
    yeti: { w: 34, h: 46, hp: 150, speed: 1.8, damage: 30, exp: 55, score: 380, color: '#e2e8f0', flying: false },
    frost_spirit: { w: 24, h: 28, hp: 70, speed: 2.2, damage: 20, exp: 40, score: 280, color: '#bfdbfe', flying: true },

    // === VOLCANO ===
    lava_snake: { w: 30, h: 18, hp: 130, speed: 3.0, damage: 28, exp: 55, score: 380, color: '#ef4444', flying: false },
    fire_elemental: { w: 28, h: 36, hp: 160, speed: 2.0, damage: 38, exp: 70, score: 500, color: '#f97316', flying: true },
    magma_golem: { w: 36, h: 48, hp: 250, speed: 0.9, damage: 45, exp: 80, score: 600, color: '#7f1d1d', flying: false },

    // === SHARED ===
    demon: { w: 30, h: 42, hp: 100, speed: 2.2, damage: 25, exp: 50, score: 350, color: '#f87171', flying: false },
    boss: { w: 48, h: 56, hp: 300, speed: 1.5, damage: 40, exp: 150, score: 1000, color: '#a855f7', flying: false },
    ghost: { w: 26, h: 30, hp: 45, speed: 1.6, damage: 18, exp: 35, score: 250, color: '#c4b5fd', flying: true },
}

// === BIOME STAT MULTIPLIERS - quái mạnh hơn ở map khó ===
const BIOME_STAT_MULT: Record<BiomeType, { hp: number; damage: number; speed: number; exp: number; score: number }> = {
    forest: { hp: 1.0, damage: 1.0, speed: 1.0, exp: 1.0, score: 1.0 },
    desert: { hp: 1.3, damage: 1.2, speed: 1.05, exp: 1.3, score: 1.3 },
    ice:    { hp: 1.6, damage: 1.5, speed: 1.1, exp: 1.6, score: 1.6 },
    volcano:{ hp: 2.0, damage: 1.8, speed: 1.15, exp: 2.0, score: 2.0 },
}

/** Create a new monster instance - with biome scaling */
export function createMonster(type: MonsterType, x: number, level: number, H: number = CANVAS_HEIGHT, biome?: BiomeType): Monster {
    const baseConfig = { ...MONSTER_CONFIGS[type] }
    const actualBiome: BiomeType = biome ?? getBiomeForLevel(level)
    const biomeMult = BIOME_STAT_MULT[actualBiome]

    const hp = Math.floor((baseConfig.hp + level * 5) * biomeMult.hp)
    const damage = Math.floor((baseConfig.damage + level * 2) * biomeMult.damage)
    const speed = (baseConfig.speed + level * 0.1) * biomeMult.speed
    const exp = Math.floor(baseConfig.exp * biomeMult.exp)
    const scoreValue = Math.floor(baseConfig.score * biomeMult.score)

    return {
        x,
        y: baseConfig.flying ? H - 200 - Math.random() * 120 : H - 100,
        vx: 0, vy: 0,
        w: baseConfig.w, h: baseConfig.h,
        hp, maxHp: hp,
        type,
        speed,
        damage,
        exp,
        scoreValue,
        onGround: false, facing: -1,
        animFrame: 0, animTimer: 0,
        attackTimer: 0, attackCooldown: 60,
        state: 'chase', hurtTimer: 0,
        color: baseConfig.color,
        dead: false,
        flying: baseConfig.flying,
    }
}

/** Get available monster types based on level */
export function getSpawnPool(level: number, hasExistingBoss: boolean): MonsterType[] {
    const types: MonsterType[] = ['slime', 'slime', 'slime']
    if (level >= 2) types.push('skeleton', 'bat')
    if (level >= 3) types.push('skeleton', 'bat', 'bat')
    if (level >= 5) types.push('scorpion', 'mummy')
    if (level >= 7 && !hasExistingBoss) types.push('boss')
    return types
}

/** Pick a random type from spawn pool */
export function pickRandomType(pool: MonsterType[]): MonsterType {
    return pool[Math.floor(Math.random() * pool.length)] ?? 'slime'
}
