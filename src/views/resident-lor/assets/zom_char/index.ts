import type { Direction } from '../../types'

const BASE = '/resident-lor/zom_char'
const directions: Direction[] = [
  'south',
  'south-east',
  'east',
  'north-east',
  'north',
  'north-west',
  'west',
  'south-west',
]

export const WALK_FRAMES: Record<Direction, string[]> = {} as Record<Direction, string[]>
for (const dir of directions) {
  WALK_FRAMES[dir] = Array.from(
    { length: 6 },
    (_, i) => `${BASE}/walk-1/${dir}/frame_${String(i).padStart(3, '0')}.png`,
  )
}

export const DEATH_FRAMES: Record<Direction, string[]> = {} as Record<Direction, string[]>
for (const dir of directions) {
  DEATH_FRAMES[dir] = Array.from(
    { length: 7 },
    (_, i) => `${BASE}/falling-back-death/${dir}/frame_${String(i).padStart(3, '0')}.png`,
  )
}
