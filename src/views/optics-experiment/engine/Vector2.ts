export class Vector2 {
  constructor(
    public x: number,
    public y: number,
  ) {}

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y)
  }

  mul(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar)
  }

  div(scalar: number): Vector2 {
    return new Vector2(this.x / scalar, this.y / scalar)
  }

  magsq(): number {
    return this.x * this.x + this.y * this.y
  }

  mag(): number {
    return Math.sqrt(this.magsq())
  }

  normalize(): Vector2 {
    const m = this.mag()
    if (m === 0) return new Vector2(0, 0)
    return this.div(m)
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y
  }

  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x
  }

  distanceTo(v: Vector2): number {
    return this.sub(v).mag()
  }

  distanceToSq(v: Vector2): number {
    return this.sub(v).magsq()
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y)
  }
}
