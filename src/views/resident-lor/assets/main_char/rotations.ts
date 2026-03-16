import type { Direction } from '../../types'

const BASE = '/resident-lor/main_char/rotations'

export const ROTATION_SPRITES: Record<Direction, string> = {
  south: `${BASE}/south.png`,
  'south-east': `${BASE}/south-east.png`,
  east: `${BASE}/east.png`,
  'north-east': `${BASE}/north-east.png`,
  north: `${BASE}/north.png`,
  'north-west': `${BASE}/north-west.png`,
  west: `${BASE}/west.png`,
  'south-west': `${BASE}/south-west.png`,
}
