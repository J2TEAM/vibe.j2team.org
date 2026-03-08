export type Severity = 'SEV-1' | 'SEV-2' | 'SEV-3'
export type GameMode = 'normal' | 'hardcore'

export interface Effect {
  stability: number
  trust: number
  energy: number
  minutes: number
  chaos: number
}

export interface Choice {
  title: string
  description: string
  effect: Effect
}

export interface Incident {
  id: string
  title: string
  severity: Severity
  context: string
  choices: Choice[]
}

export interface Metrics {
  stability: number
  trust: number
  energy: number
  timeLeft: number
  chaos: number
}

export interface RoundLog {
  incident: string
  severity: Severity
  action: string
  note: string
  impact: string
  deltaScore?: number
  chaosDelta?: number
}

export interface TacticalNode {
  id: string
  x: number
  y: number
  lane: 'api' | 'db' | 'gateway' | 'queue'
  label: string
}

export interface TacticalEdge {
  from: string
  to: string
}

export interface ChaosAlert {
  id: number
  message: string
  level: 'warning' | 'critical' | 'meltdown'
}

export interface RandomEvent {
  id: string
  title: string
  description: string
  effect: Effect
  severity: Severity
  weight?: number
}

export interface SharePayload {
  player: string
  mode: string
  rank: string
  dailySeed: string
  campaignScore: number
  rawScore: number
  bestScore: number
  dailyBestScore: number
  chaos: number
  timeLeft: number
  rounds: string
  state: string
  verdict: string
  generatedAt: string
}

export interface DailyLeaderboardEntry {
  id: string
  player: string
  score: number
  rank: string
  chaos: number
  timeLeft: number
  createdAt: string
}

export interface LearningEntry {
  id: string
  title: string
  note: string
  severity: Severity
  lesson: string
  createdAt: string
}

export interface ResultHistoryEntry {
  id: string
  payload: SharePayload
  missionBonus: number
}
