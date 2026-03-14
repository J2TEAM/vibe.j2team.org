import { Vector2 } from './Vector2'
import type { RaySegment } from './Ray'
import { Ray } from './Ray'
import type { OpticalObject } from './OpticalObject'

export class Laser {
  id: string

  constructor(
    public origin: Vector2,
    public direction: Vector2,
    id?: string,
  ) {
    this.id = id || Math.random().toString(36).substring(2, 9)
    this.direction = this.direction.normalize()
  }

  /**
   * Generates rays from this laser through the scene
   * @param sceneObjects all objects in the scene
   * @param maxBounces maximum number of ray bounces
   * @param bounds maximum bounds of the scene ray casting
   */
  calculateRays(sceneObjects: OpticalObject[], maxBounces = 50, bounds = 5000): RaySegment[] {
    const segments: RaySegment[] = []

    // Using an array of active rays to process (for things like prisms that split rays)
    const activeRays: { ray: Ray; bounces: number }[] = [
      { ray: new Ray(this.origin, this.direction), bounces: 0 },
    ]

    while (activeRays.length > 0) {
      const { ray, bounces } = activeRays.shift()!

      if (bounces >= maxBounces) {
        continue // stop tracing this ray path
      }

      let closestIntersection: {
        point: Vector2
        distance: number
        object: OpticalObject
        normal: Vector2
      } | null = null

      for (const obj of sceneObjects) {
        const intersection = obj.intersect(ray)
        if (intersection) {
          if (!closestIntersection || intersection.distance < closestIntersection.distance) {
            closestIntersection = intersection
          }
        }
      }

      if (closestIntersection) {
        // Hit something
        segments.push({
          start: ray.origin.clone(),
          end: closestIntersection.point.clone(),
        })

        // Ask the object how it interacts with the ray
        const newRays = closestIntersection.object.interact(ray, closestIntersection)

        for (const newRay of newRays) {
          activeRays.push({ ray: newRay, bounces: bounces + 1 })
        }
      } else {
        // Hit nothing, ray goes to infinity (or scene bounds)
        segments.push({
          start: ray.origin.clone(),
          end: ray.pointAt(bounds),
        })
      }
    }

    return segments
  }
}
