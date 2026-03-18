import { Laser } from './Laser'
import type { OpticalObject } from './OpticalObject'
import type { RaySegment } from './Ray'

export class Scene {
  lasers: Laser[] = []
  objects: OpticalObject[] = []

  // Store computed rays so Vue can render them reactively
  computedRays: RaySegment[] = []

  addLaser(laser: Laser) {
    this.lasers.push(laser)
  }

  removeLaser(id: string) {
    this.lasers = this.lasers.filter((l) => l.id !== id)
  }

  addObject(obj: OpticalObject) {
    this.objects.push(obj)
  }

  removeObject(id: string) {
    this.objects = this.objects.filter((o) => o.id !== id)
  }

  clear() {
    this.lasers = []
    this.objects = []
    this.computedRays = []
  }

  update() {
    this.computedRays = []
    for (const laser of this.lasers) {
      const rays = laser.calculateRays(this.objects)
      this.computedRays.push(...rays)
    }
  }
}
