export interface CommitNode {
  hash: string
  message: string
  parentHashes: string[] // Changed from parentHash: string | null
  x: number
  y: number
  branch?: string
  isHead?: boolean
}

export interface Branch {
  name: string
  commitHash: string
}

export interface GitState {
  commits: CommitNode[]
  branches: Branch[]
  head: string // Branch name or commit hash
}

export interface Level {
  id: number
  title: string
  description: string
  goalDescription: string
  initialState: GitState
  checkWin: (state: GitState) => boolean
}

export interface CommandResult {
  success: boolean
  message: string
  newState?: GitState
}
