export type RiskLevel = 'low' | 'medium' | 'high'
export type ReleaseType = 'hotfix' | 'minor' | 'major'

export interface DeployerProfile {
  name: string
  birthYear: number | null
}

export interface ReleaseScenario {
  riskLevel: RiskLevel
  releaseType: ReleaseType
  testPassRate: number
  filesChanged: number
  hasRollbackPlan: boolean
}

export interface ScoreInput {
  hour: number
  minute: number
  nowYear: number
  deployers: DeployerProfile[]
  scenario: ReleaseScenario
}

export interface ScoreBreakdown {
  score: number
  reasons: string[]
}

export interface HourlyScore {
  hour: number
  score: number
}

export interface WindowSuggestion {
  label: string
  score: number
  hour: number
}

export interface HistoryItem {
  id: string
  createdAt: string
  deployers: string[]
  score: number
  releaseType: ReleaseType
  riskLevel: RiskLevel
  hasRollbackPlan: boolean
  filesChanged: number
  testPassRate: number
}
