export type TournamentFormat =
  | 'single-elimination'
  | 'double-elimination'
  | 'group-knockout'
  | 'round-robin'

export type TournamentStatus = 'setup' | 'in-progress' | 'finished'

export interface Participant {
  id: string
  name: string
}

export type MatchStatus = 'pending' | 'done'

export interface Match {
  id: string
  roundIndex: number
  matchIndex: number
  participantA: string | null
  participantB: string | null
  scoreA: number | null
  scoreB: number | null
  status: MatchStatus
  winner: string | null
  isBye?: boolean
  /** For double elimination */
  bracket?: 'winners' | 'losers' | 'grand-final'
  /** For group stage */
  groupIndex?: number
}

export interface GroupStanding {
  participantId: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface Group {
  name: string
  participantIds: string[]
  matches: Match[]
  standings: GroupStanding[]
}

export interface KnockoutStage {
  matches: Match[]
  rounds: number
}

export interface Tournament {
  id: string
  name: string
  sport: string
  format: TournamentFormat
  status: TournamentStatus
  participants: Participant[]
  matches: Match[]
  groups: Group[]
  knockoutStage: KnockoutStage | null
  roundRobinLegs: 1 | 2
  groupCount: number | null
  advancePerGroup: number
  createdAt: number
}

export type TournamentView = 'list' | 'create' | 'detail'

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  'single-elimination': 'Single Elimination',
  'double-elimination': 'Double Elimination',
  'group-knockout': 'Group Stage + Knockout',
  'round-robin': 'Round Robin',
}

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  setup: 'Đang thiết lập',
  'in-progress': 'Đang thi đấu',
  finished: 'Đã kết thúc',
}
