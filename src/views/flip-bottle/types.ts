/* eslint-disable @typescript-eslint/no-explicit-any */

/** Minimal Matter.js type shims for CDN-loaded library */
export interface MatterBody {
  id: number
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  angle: number
  angularVelocity: number
  speed: number
  bounds: any
  label: string
  isSensor: boolean
  isStatic: boolean
  render: { fillStyle?: string; visible?: boolean }
  parts: MatterBody[]
  vertices: { x: number; y: number }[]
  [key: string]: any
}

export interface MatterEngine {
  gravity: { x: number; y: number }
  world: any
  [key: string]: any
}

export interface MatterAPI {
  Engine: {
    create(): MatterEngine
    update(engine: MatterEngine, delta: number): void
    clear(engine: MatterEngine): void
  }
  Render: any
  Bodies: {
    rectangle(x: number, y: number, w: number, h: number, opts?: any): MatterBody
    circle(x: number, y: number, r: number, opts?: any): MatterBody
    polygon(x: number, y: number, sides: number, r: number, opts?: any): MatterBody
    fromVertices(x: number, y: number, verts: any, opts?: any): MatterBody
  }
  Body: {
    create(opts: any): MatterBody
    setPosition(body: MatterBody, pos: { x: number; y: number }): void
    setVelocity(body: MatterBody, vel: { x: number; y: number }): void
    setAngle(body: MatterBody, angle: number): void
    setAngularVelocity(body: MatterBody, vel: number): void
    applyForce(
      body: MatterBody,
      pos: { x: number; y: number },
      force: { x: number; y: number },
    ): void
    setStatic(body: MatterBody, isStatic: boolean): void
  }
  Composite: {
    add(world: any, bodies: MatterBody | MatterBody[]): void
    remove(world: any, body: MatterBody): void
    clear(world: any, keepStatic: boolean): void
  }
  Events: {
    on(target: any, name: string, callback: (event: any) => void): void
  }
  Vector: {
    sub(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }
    add(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }
    mult(v: { x: number; y: number }, scalar: number): { x: number; y: number }
    magnitude(v: { x: number; y: number }): number
    normalise(v: { x: number; y: number }): { x: number; y: number }
  }
  Constraint: {
    create(opts: any): any
  }
  Bounds: {
    overlaps(a: any, b: any): boolean
  }
}

export function getMatter(): MatterAPI {
  return (window as any).Matter as MatterAPI
}
