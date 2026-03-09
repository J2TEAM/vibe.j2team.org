export interface DiffChange {
  value: string
  added?: boolean
  removed?: boolean
}

export interface JsonProcessResult {
  success: boolean
  data: string
  error?: string
}

export interface DiffResult {
  changes: DiffChange[]
  hasChanges: boolean
}

export type ViewMode = 'formatter' | 'diff'
export type IndentSize = 2 | 4 | 'tab'
