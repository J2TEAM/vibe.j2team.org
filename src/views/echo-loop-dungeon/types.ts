export type Step = 'U' | 'D' | 'L' | 'R' | 'W'
export type Tile = '#' | '.' | 'P' | 'D'

export interface Point {
  x: number
  y: number
}

export interface EchoState {
  id: number
  start: Point
  position: Point
  script: Step[]
  stepIndex: number
}

export interface RecordingState {
  start: Point
  steps: Step[]
}

export interface LevelDefinition {
  name: string
  hint: string
  maxEchoes: number
  minEchoToClear: number
  maxLoopLength: number
  map: string[]
}
