export interface ClanMember {
  tag: string
  name: string
  role: 'leader' | 'coLeader' | 'admin' | 'member'
  expLevel: number
  league: {
    id: number
    name: string
    iconUrls: {
      small: string
      tiny: string
      medium: string
    }
  }
  trophies: number
  versusTrophies: number
  clanRank: number
  previousClanRank: number
  donations: number
  donationsReceived: number
  townHallLevel: number
}

export interface ClanDetails {
  tag: string
  name: string
  type: string
  description: string
  location?: {
    id: number
    name: string
    isCountry: boolean
    countryCode: string
  }
  badgeUrls: {
    small: string
    large: string
    medium: string
  }
  clanLevel: number
  clanPoints: number
  clanVersusPoints: number
  members: number
  memberList: ClanMember[]
  warFrequency: string
  warWinStreak: number
  warWins: number
  warTies?: number
  warLosses?: number
  isWarLogPublic: boolean
}

export interface WarLogEntry {
  result: 'win' | 'lose' | 'tie' | null
  endTime: string
  teamSize: number
  clan: {
    tag: string
    name: string
    badgeUrls: { small: string; medium: string; large: string }
    clanLevel: number
    attacks: number
    stars: number
    destructionPercentage: number
    expEarned: number
  }
  opponent: {
    tag: string
    name: string
    badgeUrls: { small: string; medium: string; large: string }
    clanLevel: number
    stars: number
    destructionPercentage: number
  }
}

export interface Equipment {
  name: string
  level: number
  maxLevel: number
  village: string
}

export interface PlayerDetails {
  tag: string
  name: string
  townHallLevel: number
  townHallWeaponLevel?: number
  expLevel: number
  trophies: number
  bestTrophies: number
  warStars: number
  attackWins: number
  defenseWins: number
  builderHallLevel?: number
  versusTrophies?: number
  bestVersusTrophies?: number
  versusBattleWins?: number
  role?: string
  warPreference?: 'in' | 'out'
  donations: number
  donationsReceived: number
  clan?: {
    tag: string
    name: string
    clanLevel: number
    badgeUrls: { small: string; large: string; medium: string }
  }
  league?: {
    id: number
    name: string
    iconUrls: { small: string; tiny: string; medium: string }
  }
  achievements: Array<{
    name: string
    stars: number
    value: number
    target: number
    info: string
    completionInfo: string | null
    village: string
  }>
  labels: Array<{
    id: number
    name: string
    iconUrls: { small: string; medium: string }
  }>
  troops: Array<{
    name: string
    level: number
    maxLevel: number
    village: string
  }>
  heroes: Array<{
    name: string
    level: number
    maxLevel: number
    village: string
    equipment?: Equipment[] // Active equipment on this hero
  }>
  heroEquipment?: Equipment[] // All unlocked equipment
  spells: Array<{
    name: string
    level: number
    maxLevel: number
    village: string
  }>
}

export interface WarMember {
  tag: string
  name: string
  townhallLevel: number
  mapPosition: number
  attacks?: Array<{
    attackerTag: string
    defenderTag: string
    stars: number
    destructionPercentage: number
    order: number
  }>
  opponentAttacks: number
  bestOpponentAttack?: {
    stars: number
    destructionPercentage: number
    attackerTag: string
  }
}

export interface CurrentWar {
  state: 'notInWar' | 'preparation' | 'inWar' | 'warEnded'
  teamSize: number
  startTime: string
  endTime: string
  clan: {
    tag: string
    name: string
    badgeUrls: { small: string; medium: string; large: string }
    clanLevel: number
    attacks: number
    stars: number
    destructionPercentage: number
    members: WarMember[]
  }
  opponent: {
    tag: string
    name: string
    badgeUrls: { small: string; medium: string; large: string }
    clanLevel: number
    attacks?: number
    stars: number
    destructionPercentage: number
    members: WarMember[]
  }
}

export interface LeagueGroup {
  state: string
  season: string
  clans: Array<{
    tag: string
    name: string
    clanLevel: number
    badgeUrls: { small: string; medium: string; large: string }
    members: Array<{
      tag: string
      name: string
      townHallLevel: number
    }>
  }>
  rounds: Array<{
    warTags: string[]
  }>
}

export interface CWLWar {
  state: 'notInWar' | 'preparation' | 'inWar' | 'warEnded'
  teamSize: number
  preparationStartTime: string
  startTime: string
  endTime: string
  clan: {
    tag: string
    name: string
    badgeUrls: { small: string; medium: string; large: string }
    clanLevel: number
    attacks: number
    stars: number
    destructionPercentage: number
    members: WarMember[]
  }
  opponent: {
    tag: string
    name: string
    badgeUrls: { small: string; medium: string; large: string }
    clanLevel: number
    attacks: number
    stars: number
    destructionPercentage: number
    members: WarMember[]
  }
}
