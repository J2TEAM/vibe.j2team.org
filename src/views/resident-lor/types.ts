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
  deathFrame?: number
  /** Hệ số tốc độ (0.6–1.5), mỗi zombie khác nhau */
  speed: number
  /** Timestamp lần cuối zombie di chuyển được — dùng để phát hiện kẹt tường */
  lastMoveTime: number
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
