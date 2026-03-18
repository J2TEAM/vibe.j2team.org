import { OpticalObject } from './OpticalObject'
import { Ray } from './Ray'
import type { Intersection } from './Intersection'
import { Vector2 } from './Vector2'

export function chaikinSmooth(points: Vector2[], iterations: number = 3): Vector2[] {
  if (points.length <= 2) return points

  let current = points
  for (let iter = 0; iter < iterations; iter++) {
    const next: Vector2[] = []
    // Keep the first point
    next.push(current[0]!.clone())

    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i]!
      const p1 = current[i + 1]!

      const q = p0.mul(0.75).add(p1.mul(0.25))
      const r = p0.mul(0.25).add(p1.mul(0.75))

      next.push(q, r)
    }

    // Keep the last point
    next.push(current[current.length - 1]!.clone())
    current = next
  }
  return current
}

export class FreehandMirror extends OpticalObject {
  constructor(
    public points: Vector2[],
    id?: string,
  ) {
    super(id)
  }

  intersect(ray: Ray): Intersection | null {
    let closest: Intersection | null = null

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i]!
      const p2 = this.points[i + 1]!

      const v1 = ray.origin.sub(p1)
      const v2 = p2.sub(p1)
      const v3 = new Vector2(-ray.direction.y, ray.direction.x)

      const dot = v2.dot(v3)
      if (Math.abs(dot) < 0.000001) continue

      const t1 = v2.cross(v1) / dot
      const t2 = ray.direction.cross(v1) / dot

      if (t1 > 0.000001 && t2 >= 0 && t2 <= 1) {
        if (!closest || t1 < closest.distance) {
          const point = ray.pointAt(t1)
          let normal = new Vector2(-v2.y, v2.x).normalize()
          if (ray.direction.dot(normal) > 0) {
            normal = new Vector2(-normal.x, -normal.y)
          }

          closest = {
            point,
            distance: t1,
            normal,
            object: this,
          }
        }
      }
    }
    return closest
  }

  interact(ray: Ray, intersection: Intersection): Ray[] {
    const d = ray.direction
    const n = intersection.normal

    const dot = d.dot(n)
    const reflectedDir = d.sub(n.mul(2 * dot))

    const safeOrigin = intersection.point.add(n.mul(0.0001))

    return [new Ray(safeOrigin, reflectedDir)]
  }
}
