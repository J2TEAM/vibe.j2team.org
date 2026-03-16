import type { Ray } from './Ray'
import type { Intersection } from './Intersection'

export abstract class OpticalObject {
  id: string

  constructor(id?: string) {
    this.id = id || Math.random().toString(36).substring(2, 9)
  }

  /**
   * Calculates the intersection point of a ray with this object.
   * Returns null if no intersection.
   */
  abstract intersect(ray: Ray): Intersection | null

  /**
   * Determines how the ray behaves after hitting the object.
   * A mirror reflects it. A prism refracts it and might split it.
   * An opaque wall absorbs it (returns empty array).
   */
  abstract interact(ray: Ray, intersection: Intersection): Ray[]
}
