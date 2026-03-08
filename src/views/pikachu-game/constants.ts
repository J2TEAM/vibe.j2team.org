import type { GridPreset, GridSize, RecordItem } from './types'

export const STORAGE_KEY = 'pikachu-records-v2'
export const GRAVITY_UNLOCKED_STORAGE_KEY = 'pikachu-gravity-mode-unlocked-v1'
export const AUTO_RECOVER_RESHUFFLE_LIMIT = 5
export const STORY_TOTAL_LEVELS = 10
export const STORY_GRID_SIZE: GridSize = '10x20'

export const DEFAULT_RECORDS: ReadonlyArray<RecordItem> = [
  { name: 'Starter A', score: 40, difficulty: 0, mode: 'classic', timeSpent: 0, createdAt: '2026-01-01T00:00:00.000Z' },
  { name: 'Starter B', score: 55, difficulty: 1, mode: 'classic', timeSpent: 0, createdAt: '2026-01-02T00:00:00.000Z' },
  { name: 'Starter C', score: 65, difficulty: 1, mode: 'timed', timeSpent: 120, createdAt: '2026-01-03T00:00:00.000Z' },
  { name: 'Starter D', score: 80, difficulty: 2, mode: 'timed', timeSpent: 140, createdAt: '2026-01-04T00:00:00.000Z' },
  { name: 'Story Runner', score: 0, difficulty: 8, mode: 'story', timeSpent: 3300, createdAt: '2026-01-05T00:00:00.000Z' },
  { name: 'Story Explorer', score: 0, difficulty: 8, mode: 'story', timeSpent: 2700, createdAt: '2026-01-06T00:00:00.000Z' },
  { name: 'Story Sprinter', score: 0, difficulty: 8, mode: 'story', timeSpent: 2280, createdAt: '2026-01-07T00:00:00.000Z' },
  { name: 'Gravity Master', score: 0, difficulty: 8, mode: 'gravity', timeSpent: 2520, createdAt: '2026-01-08T00:00:00.000Z' },
]

export const iconSet = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'] as const

export const directions: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
] as const

export const gridPresets: ReadonlyArray<GridPreset> = [
  { key: '10x10', rows: 10, cols: 10 },
  { key: '20x20', rows: 20, cols: 20 },
  { key: '30x30', rows: 30, cols: 30 },
  { key: '10x20', rows: 10, cols: 20 },
  { key: '10x30', rows: 10, cols: 30 },
  { key: '20x30', rows: 20, cols: 30 },
] as const

export const gridPresetMap: Readonly<Record<GridSize, GridPreset>> = {
  '10x10': gridPresets[0] as GridPreset,
  '20x20': gridPresets[1] as GridPreset,
  '30x30': gridPresets[2] as GridPreset,
  '10x20': gridPresets[3] as GridPreset,
  '10x30': gridPresets[4] as GridPreset,
  '20x30': gridPresets[5] as GridPreset,
}

export const sizeOptions: ReadonlyArray<GridSize> = gridPresets.map((preset) => preset.key)
export const difficultyOptions = Array.from({ length: 21 }, (_, i) => i)
