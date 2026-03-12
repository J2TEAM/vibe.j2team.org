import type { Direction } from '../../types'

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

// Walk: 6 frames per direction
const walkGlob = import.meta.glob<string>('./animations/walk-1/*/*.png', {
  eager: true,
  import: 'default',
})

export const WALK_FRAMES: Record<Direction, string[]> = {} as Record<Direction, string[]>
for (const dir of directions) {
  WALK_FRAMES[dir] = Array.from({ length: 6 }, (_, i) => {
    const path = `./animations/walk-1/${dir}/frame_${String(i).padStart(3, '0')}.png`
    return walkGlob[path] ?? ''
  })
}

// Death: 7 frames per direction
const deathGlob = import.meta.glob<string>('./animations/falling-back-death/*/*.png', {
  eager: true,
  import: 'default',
})

export const DEATH_FRAMES: Record<Direction, string[]> = {} as Record<Direction, string[]>
for (const dir of directions) {
  DEATH_FRAMES[dir] = Array.from({ length: 7 }, (_, i) => {
    const path = `./animations/falling-back-death/${dir}/frame_${String(i).padStart(3, '0')}.png`
    return deathGlob[path] ?? ''
  })
}
