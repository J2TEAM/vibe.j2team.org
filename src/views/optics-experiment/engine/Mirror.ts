import { OpticalObject } from './OpticalObject'
import { Ray } from './Ray'
import type { Intersection } from './Intersection'
import { Vector2 } from './Vector2'

export class Mirror extends OpticalObject {
  constructor(
    public p1: Vector2,
    public p2: Vector2,
    id?: string,
  ) {
    super(id)
  }

  getNormal(): Vector2 {
    const dx = this.p2.x - this.p1.x
    const dy = this.p2.y - this.p1.y
    // normal is (-dy, dx) or (dy, -dx)
    return new Vector2(-dy, dx).normalize()
  }

  intersect(ray: Ray): Intersection | null {
    // Line-line intersection logic
    // Line 1: p1 -> p2
    // Line 2: ray.origin -> ray.origin + ray.direction * t
    const v1 = ray.origin.sub(this.p1)
    const v2 = this.p2.sub(this.p1)
    const v3 = new Vector2(-ray.direction.y, ray.direction.x)

    const dot = v2.dot(v3)
    // if dot == 0, lines are parallel
    if (Math.abs(dot) < 0.000001) {
      return null
    }

    const t1 = v2.cross(v1) / dot
    const t2 = ray.direction.cross(v1) / dot

    // t1 must be >= 0 (ray goes forward)
    // t2 must be between 0 and 1 (intersection on the line segment p1-p2)
    if (t1 >= 0.000001 && t2 >= 0 && t2 <= 1) {
      const point = ray.pointAt(t1)

      // Determine correct normal direction (pointing towards incoming ray)
      let normal = this.getNormal()
      if (ray.direction.dot(normal) > 0) {
        normal = new Vector2(-normal.x, -normal.y)
      }

      return {
        point,
        distance: t1,
        normal,
        object: this,
      }
    }

    return null
  }

  interact(ray: Ray, intersection: Intersection): Ray[] {
    // Reflection reflection formula: r = d - 2(d dot n)n
    const d = ray.direction
    const n = intersection.normal

    const dot = d.dot(n)
    const reflectedDir = d.sub(n.mul(2 * dot))

    // To prevent immediate self-intersection, shift origin slightly along the normal
    const safeOrigin = intersection.point.add(n.mul(0.0001))

    return [new Ray(safeOrigin, reflectedDir)]
  }
}
