import type { Direction } from '../../types'
import east from './rotations/east.png'
import north from './rotations/north.png'
import northEast from './rotations/north-east.png'
import northWest from './rotations/north-west.png'
import south from './rotations/south.png'
import southEast from './rotations/south-east.png'
import southWest from './rotations/south-west.png'
import west from './rotations/west.png'

export const ROTATION_SPRITES: Record<Direction, string> = {
  south,
  'south-east': southEast,
  east,
  'north-east': northEast,
  north,
  'north-west': northWest,
  west,
  'south-west': southWest,
}
