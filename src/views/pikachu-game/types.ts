export type GameMode = 'classic' | 'timed' | 'story' | 'gravity'
export type Direction = 0 | 1 | 2 | 3
export type GridSize = '10x10' | '20x20' | '30x30' | '10x20' | '10x30' | '20x30'
export type LeaderboardStep = 'pick' | 'view'
export type MainMode = 'story' | 'custom' | 'gravity'
export type LeaderboardCategory = 'story' | 'custom' | 'gravity'

export interface Tile {
  id: number
  kind: 'icon' | 'wall'
  type: number
  icon: string
  x: number
  y: number
  isVisible: boolean
}

export interface SearchNode {
  x: number
  y: number
  dir: Direction | -1
  turns: number
  parent: number
}

export interface Point {
  x: number
  y: number
}

export interface DisplayCell {
  key: string
  x: number
  y: number
  tile: Tile | null
  isOuter: boolean
}

export interface RecordItem {
  name: string
  score: number
  difficulty: number
  mode: GameMode
  timeSpent: number
  createdAt: string
}

export interface GridPreset {
  key: GridSize
  rows: number
  cols: number
}
