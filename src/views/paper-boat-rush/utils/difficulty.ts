import type { DifficultyLevel } from '../types'

export interface DifficultyConfig {
  label: string
  timeLimit: number
  obstacleCount: number
  obstacleRadiusMin: number
  obstacleRadiusMax: number
  obstacleSpeedMin: number
  obstacleSpeedMax: number
  obstacleSwayMin: number
  obstacleSwayMax: number
  whirlpoolCount: number
  whirlpoolRadiusMin: number
  whirlpoolRadiusMax: number
  whirlpoolStrengthMin: number
  whirlpoolStrengthMax: number
  riverCurrentX: number
  riverCurrentYBase: number
  riverCurrentYWave: number
  collisionPenaltySeconds: number
  scoreMultiplier: number
}

export const difficultyConfigs: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    label: 'Dễ',
    timeLimit: 55,
    obstacleCount: 6,
    obstacleRadiusMin: 10,
    obstacleRadiusMax: 14,
    obstacleSpeedMin: 12,
    obstacleSpeedMax: 22,
    obstacleSwayMin: 8,
    obstacleSwayMax: 18,
    whirlpoolCount: 2,
    whirlpoolRadiusMin: 48,
    whirlpoolRadiusMax: 62,
    whirlpoolStrengthMin: 56,
    whirlpoolStrengthMax: 82,
    riverCurrentX: 58,
    riverCurrentYBase: -42,
    riverCurrentYWave: 9,
    collisionPenaltySeconds: 0.8,
    scoreMultiplier: 1,
  },
  medium: {
    label: 'Trung bình',
    timeLimit: 45,
    obstacleCount: 9,
    obstacleRadiusMin: 11,
    obstacleRadiusMax: 16,
    obstacleSpeedMin: 16,
    obstacleSpeedMax: 36,
    obstacleSwayMin: 12,
    obstacleSwayMax: 34,
    whirlpoolCount: 3,
    whirlpoolRadiusMin: 56,
    whirlpoolRadiusMax: 72,
    whirlpoolStrengthMin: 78,
    whirlpoolStrengthMax: 114,
    riverCurrentX: 76,
    riverCurrentYBase: -55,
    riverCurrentYWave: 12,
    collisionPenaltySeconds: 1.1,
    scoreMultiplier: 1.18,
  },
  hard: {
    label: 'Khó',
    timeLimit: 35,
    obstacleCount: 12,
    obstacleRadiusMin: 12,
    obstacleRadiusMax: 18,
    obstacleSpeedMin: 24,
    obstacleSpeedMax: 42,
    obstacleSwayMin: 16,
    obstacleSwayMax: 30,
    whirlpoolCount: 4,
    whirlpoolRadiusMin: 60,
    whirlpoolRadiusMax: 82,
    whirlpoolStrengthMin: 112,
    whirlpoolStrengthMax: 162,
    riverCurrentX: 96,
    riverCurrentYBase: -70,
    riverCurrentYWave: 16,
    collisionPenaltySeconds: 1.5,
    scoreMultiplier: 1.35,
  },
}
