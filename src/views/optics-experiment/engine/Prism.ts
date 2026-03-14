import { OpticalObject } from './OpticalObject'
import { Ray } from './Ray'
import type { Intersection } from './Intersection'
import { Vector2 } from './Vector2'

export class Prism extends OpticalObject {
  refractiveIndex: number

  constructor(
    public p1: Vector2,
    public p2: Vector2,
    public p3: Vector2,
    refractiveIndex = 1.5,
    id?: string,
  ) {
    super(id)
    this.refractiveIndex = refractiveIndex
  }

  // Helper to get outward normal of segment (A, B) given opposite vertex C
  private getOutwardNormal(A: Vector2, B: Vector2, C: Vector2): Vector2 {
    const ab = B.sub(A)
    let n = new Vector2(-ab.y, ab.x).normalize()
    const ac = C.sub(A)
    // If the normal points towards the opposite vertex, flip it
    if (ac.dot(n) > 0) {
      n = new Vector2(ab.y, -ab.x).normalize()
    }
    return n
  }

  intersect(ray: Ray): Intersection | null {
    const segments = [
      { a: this.p1, b: this.p2, c: this.p3 },
      { a: this.p2, b: this.p3, c: this.p1 },
      { a: this.p3, b: this.p1, c: this.p2 },
    ]

    let closest: Intersection | null = null

    for (const seg of segments) {
      const v1 = ray.origin.sub(seg.a)
      const v2 = seg.b.sub(seg.a)
      const v3 = new Vector2(-ray.direction.y, ray.direction.x)

      const dot = v2.dot(v3)
      if (Math.abs(dot) < 0.000001) continue

      const t1 = v2.cross(v1) / dot
      const t2 = ray.direction.cross(v1) / dot

      // Use a small epsilon for t1 to avoid immediate self-intersection
      if (t1 > 0.000001 && t2 >= 0 && t2 <= 1) {
        if (!closest || t1 < closest.distance) {
          const point = ray.pointAt(t1)
          const outwardNormal = this.getOutwardNormal(seg.a, seg.b, seg.c)
          closest = {
            point,
            distance: t1,
            normal: outwardNormal,
            object: this,
          }
        }
      }
    }
    return closest
  }

  interact(ray: Ray, intersection: Intersection): Ray[] {
    const d = ray.direction
    const n = intersection.normal // This is always the outward normal
    const dDotN = d.dot(n)

    let n1 = 1 // Air
    let n2 = this.refractiveIndex
    let isEntering = true
    let normalToUse = n

    // If d dot n > 0, the ray is moving in the same direction as the outward normal
    // i.e., it is exiting the prism
    if (dDotN > 0) {
      n1 = this.refractiveIndex
      n2 = 1
      isEntering = false
      // For Snell's law, we want the normal pointing against the incoming ray
      normalToUse = new Vector2(-n.x, -n.y)
    }

    const ratio = n1 / n2
    const cosThetaI = -d.dot(normalToUse)
    const sin2ThetaT = ratio * ratio * (1 - cosThetaI * cosThetaI)

    if (sin2ThetaT > 1) {
      // Total Internal Reflection (TIR)
      const reflectedDir = d.add(normalToUse.mul(2 * cosThetaI))
      // Offset slightly to stay inside the prism
      const safeOrigin = intersection.point.add(n.mul(-0.0001))
      return [new Ray(safeOrigin, reflectedDir)]
    } else {
      // Refraction
      const cosThetaT = Math.sqrt(1 - sin2ThetaT)
      const refractedDir = d
        .mul(ratio)
        .add(normalToUse.mul(ratio * cosThetaI - cosThetaT))
        .normalize()

      // Offset slightly in the direction of the new medium
      const offsetDir = isEntering ? n.mul(-0.0001) : n.mul(0.0001)
      const safeOrigin = intersection.point.add(offsetDir)
      return [new Ray(safeOrigin, refractedDir)]
    }
  }
}
