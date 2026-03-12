export type Direction =
  | 'south'
  | 'south-east'
  | 'east'
  | 'north-east'
  | 'north'
  | 'north-west'
  | 'west'
  | 'south-west'

export type ZombieState = 'alive' | 'dying' | 'dead'

export interface Zombie {
  id: string
  lat: number
  lng: number
  direction: Direction
  state: ZombieState
  spawnTime: number
  deathStartTime?: number
  /** Hệ số tốc độ (0.6–1.5), mỗi zombie khác nhau */
  speed: number
}

export interface Bullet {
  id: number
  lat: number
  lng: number
  startLat: number
  startLng: number
  dirLat: number
  dirLng: number
}
