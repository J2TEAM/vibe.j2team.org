export type LeagueGroup = 'national' | 'international'
export type LeagueTag = 'hot' | 'other'

export interface League {
  id: string
  slug: string
  name: string
  nameVi: string
  logo: string
  country?: string
  group: LeagueGroup
  tag: LeagueTag
}

export interface Team {
  id: string
  name: string
  shortName: string
  abbreviation: string
  logo: string
}

export interface MatchStatus {
  name: string
  description: string
  displayClock: string
  isCompleted: boolean
  isInProgress: boolean
  isScheduled: boolean
}

export interface MatchEvent {
  type: string
  minute: string
  playerName: string
  teamId: string
  isGoal: boolean
  isOwnGoal: boolean
  isRedCard: boolean
  isYellowCard: boolean
  isPenalty: boolean
}

export interface TeamStats {
  possession: string
  shots: string
  shotsOnTarget: string
  corners: string
  fouls: string
  assists: string
}

export interface TeamDetail {
  team: Team
  score: string
  form: string
  record: string
  stats: TeamStats | null
}

export interface MatchDetail {
  headline: string
  headlineDescription: string
  venue: string
  venueCity: string
  attendance: number
  homeDetail: TeamDetail
  awayDetail: TeamDetail
  events: MatchEvent[]
}

export interface Match {
  id: string
  date: string
  name: string
  shortName: string
  homeTeam: Team
  awayTeam: Team
  homeScore: string
  awayScore: string
  status: MatchStatus
  venue: string
  leagueId: string
  detail: MatchDetail | null
}

export interface LeagueMatches {
  league: League
  matches: Match[]
}

export interface DayMatches {
  date: Date
  dateLabel: string
  leagueMatches: LeagueMatches[]
  totalMatches: number
}

export type ViewMode = 'daily' | 'upcoming'

export type UpcomingPeriod = 'week' | 'month' | 'year'

export type DateString = string // YYYYMMDD format
