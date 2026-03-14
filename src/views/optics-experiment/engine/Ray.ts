import type { Vector2 } from './Vector2'

export class Ray {
  constructor(
    public origin: Vector2,
    public direction: Vector2,
  ) {
    this.direction = direction.normalize()
  }

  pointAt(distance: number): Vector2 {
    return this.origin.add(this.direction.mul(distance))
  }
}

export interface RaySegment {
  start: Vector2
  end: Vector2
  intensity?: number
}
