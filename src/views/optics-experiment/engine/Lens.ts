import { OpticalObject } from './OpticalObject'
import { Ray } from './Ray'
import type { Intersection } from './Intersection'
import { Vector2 } from './Vector2'

export class Lens extends OpticalObject {
  constructor(
    public p1: Vector2,
    public p2: Vector2,
    public focalLength: number,
    id?: string,
  ) {
    super(id)
  }

  /** Returns true if the lens has effectively zero length (degenerate) */
  isDegenerate(): boolean {
    return this.p2.sub(this.p1).magsq() < 1
  }

  intersect(ray: Ray): Intersection | null {
    // Skip degenerate lenses (zero-length)
    if (this.isDegenerate()) return null

    const v1 = ray.origin.sub(this.p1)
    const v2 = this.p2.sub(this.p1)
    const v3 = new Vector2(-ray.direction.y, ray.direction.x)

    const dot = v2.dot(v3)
    if (Math.abs(dot) < 0.000001) return null

    const t1 = v2.cross(v1) / dot
    const t2 = ray.direction.cross(v1) / dot

    if (t1 > 0.001 && t2 >= 0 && t2 <= 1) {
      const point = ray.pointAt(t1)
      // Normal points AGAINST the incoming ray direction (into the lens face)
      let normal = new Vector2(-v2.y, v2.x).normalize()
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
    const d = ray.direction
    const I = intersection.point
    const C = this.p1.add(this.p2).div(2)
    const n = intersection.normal // Points against incoming ray

    // "Forward" = the direction the ray is generally passing through
    const forward = new Vector2(-n.x, -n.y)

    // If the ray hits exactly the optical center, it passes through undeviated
    if (I.sub(C).magsq() < 0.01) {
      const safeOrigin = I.add(forward.mul(0.01))
      return [new Ray(safeOrigin, d)]
    }

    // Treat very small focal lengths as effectively undeviated
    if (Math.abs(this.focalLength) < 1) {
      const safeOrigin = I.add(forward.mul(0.01))
      return [new Ray(safeOrigin, d)]
    }

    // Thin lens deflection:
    // The lens deflects the ray's transverse velocity (along the lens surface)
    // proportionally to the distance from the optical center and the ray's axial velocity.
    //
    // This matches the transfer matrix method and guarantees absolute reversibility.
    const lensDir = this.p2.sub(this.p1).normalize()
    const h = I.sub(C).dot(lensDir) // signed offset along lens surface

    // Axial component of the ray direction (always positive as forward points along ray)
    const u = d.dot(forward)

    // Deflection is applied ALONG the lens surface (modifying transverse direction)
    const deflection = lensDir.mul((-h / this.focalLength) * u)

    let newDir = d.add(deflection).normalize()

    // Safety: ensure the outgoing ray goes "forward" (same side as the incoming ray was heading)
    if (newDir.dot(forward) < 0.01) {
      // Extreme deflection would send the ray backwards - just pass through
      newDir = d
    }

    const safeOrigin = I.add(forward.mul(0.01))
    return [new Ray(safeOrigin, newDir)]
  }
}
