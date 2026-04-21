export type CommitKind =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'chore'
  | 'style'
  | 'ci'
  | 'revert'
  | 'other'

export type StoryLane = 'value' | 'stability' | 'quality' | 'maintenance' | 'knowledge' | 'other'

export interface ParsedCommit {
  raw: string
  hash: string
  kind: CommitKind
  scope: string
  summary: string
  breaking: boolean
}

export interface StoryChapter {
  id: StoryLane
  title: string
  note: string
  icon: string
  commits: ParsedCommit[]
}

export interface TypeBreakdownItem {
  kind: CommitKind
  count: number
}

export interface ReleaseRisk {
  label: 'High' | 'Medium' | 'Low'
  hint: string
}

export type ExportFormat = 'markdown' | 'json' | 'csv'
