import type { Difficulty } from './types'

export const difficultyConfig: Record<Difficulty, number> = {
  noob: 8,
  medium: 12,
  hard: 16,
  asian: 40,
}

export const trollThreshold: Record<Difficulty, number> = {
  noob: 20000, // 20 seconds
  medium: 30000, // 30 seconds
  hard: 40000, // 40 seconds
  asian: 60000, // 60 seconds
}

export const CELL_SIZE = 20
export const WALL_WIDTH = 2

export const STORAGE_KEY = {
  BEST_NOOB: 'maze_best_noob',
  BEST_MEDIUM: 'maze_best_medium',
  BEST_HARD: 'maze_best_hard',
  BEST_ASIAN: 'maze_best_asian',
  LANGUAGE: 'maze_language',
}
