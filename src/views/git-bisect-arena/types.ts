export type Difficulty = 'easy' | 'medium' | 'hard'

export type CommitStatus = 'unknown' | 'pass' | 'fail' | 'skip'

export interface BisectLevel {
  id: number
  name: string
  difficulty: Difficulty
  commitCount: number
  badCommit: number
  untestable: number[]
  description: string
  hint: string
}

export interface LevelResult {
  attempts: number
  stars: number
  par: number
}
