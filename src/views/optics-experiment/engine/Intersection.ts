import type { Vector2 } from './Vector2'
import type { OpticalObject } from './OpticalObject'

export interface Intersection {
  point: Vector2
  distance: number
  normal: Vector2 // The normal vector of the surface at the point of intersection
  object: OpticalObject
}
