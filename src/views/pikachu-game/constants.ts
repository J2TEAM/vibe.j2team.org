import type { GameMode, GridSize } from './types'
export const STORAGE_KEY = 'pikachu-records-v3'

export const iconSet = [
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
] as const

export const directions: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
] as const

export const storyLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export const sizeOptions: ReadonlyArray<GridSize> = [10, 20, 30]
export const difficultyOptions = Array.from({ length: 10 }, (_, i) => i)
export const rankedModes: ReadonlyArray<GameMode> = ['classic', 'timed']

