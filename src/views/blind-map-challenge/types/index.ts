export type Zone = 'Bắc' | 'Trung' | 'Nam'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type GameMode = 'classic' | 'time-attack' | 'daily' | 'region'
export type PlacementStatus = 'idle' | 'correct' | 'wrong'

export interface Province {
    id: string
    name: string
    shortName: string
    zone: Zone
    region: string
    capital: string
    area: number
    population: number
    svgPathId: string
    neighbors: string[]
}

export interface PlacedProvince {
    provinceId: string
    status: PlacementStatus
    attempts: number
}

export interface GameConfig {
    mode: GameMode
    difficulty: Difficulty
    regionFilter?: Zone
}

export interface GameResult {
    date: string
    mode: GameMode
    difficulty: Difficulty
    score: number
    accuracy: number
    timeUsed: number
    wrongProvinces: string[]
}
