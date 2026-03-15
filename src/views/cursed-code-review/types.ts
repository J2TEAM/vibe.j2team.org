export type BugType = 'naming' | 'logic' | 'memory' | 'security' | 'redundancy'

export interface Bug {
  id: string
  line: number
  description: string
  type: BugType
  explanation: string
  severity: number // 1-10
}

export interface CodeSnippet {
  id: string
  title: string
  code: string
  language: string
  bugs: Bug[]
  timeLimit: number // seconds
  minBugsToPass: number
}

export interface GameState {
  score: number
  currentSnippetIdx: number
  foundBugIds: string[]
  stability: number // 0-100
  timeRemaining: number
  status: 'start' | 'playing' | 'reviewing' | 'failed' | 'success'
  isGlitching: boolean
}
