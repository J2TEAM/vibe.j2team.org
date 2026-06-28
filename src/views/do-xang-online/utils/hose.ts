import type { VehicleBodyType } from '../types'

export type HosePoint = { x: number; y: number }

export type HoseGeom = {
  pump: HosePoint
  hand: HosePoint
  c1: HosePoint
  c2: HosePoint
  c3: HosePoint
  c4: HosePoint
  end: HosePoint
}

export function hoseJitter(id: string, slot: number, span: number, sessionSalt: number): number {
  let h = 2166136261 ^ (sessionSalt * 1103515245)
  h ^= sessionSalt * 2654435769
  h ^= (id.length + slot * 17) * 1597334677
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= sessionSalt * (slot + 7) * 2246822519
  const t = ((h >>> ((slot * 5) % 20)) & 4095) / 4095
  return t * span
}

export function clampHoseGeomLow(g: HoseGeom): HoseGeom {
  const { pump, hand, end } = g
  const c1 = {
    x: g.c1.x,
    y: Math.max(g.c1.y, pump.y + 5),
  }
  const c2 = {
    x: g.c2.x,
    y: Math.max(g.c2.y, pump.y + 9, hand.y - 7),
  }
  const mid = Math.min(hand.y, end.y)
  const c3 = {
    x: g.c3.x,
    y: Math.max(g.c3.y, mid + 2),
  }
  const c4 = {
    x: g.c4.x,
    y: Math.max(g.c4.y, end.y - 3),
  }
  return { pump, hand, c1, c2, c3, c4, end }
}

export function computeHoseGeom(
  body: VehicleBodyType,
  vehicleId: string,
  sessionSalt: number,
): HoseGeom {
  const pump = { x: 78, y: 38 }
  const hand = {
    x: 56 + hoseJitter(vehicleId, 8, 12, sessionSalt),
    y: 55 + hoseJitter(vehicleId, 9, 7, sessionSalt),
  }

  const ex0 = body === 'car' ? 24 : 12
  const ex1 = body === 'car' ? 38 : 24
  const ey0 = body === 'car' ? 46 : 58
  const ey1 = body === 'car' ? 56 : 70
  const ex = ex0 + hoseJitter(vehicleId, 1, ex1 - ex0, sessionSalt)
  const ey = ey0 + hoseJitter(vehicleId, 2, ey1 - ey0, sessionSalt)

  const c1x = 73 + hoseJitter(vehicleId, 3, 6, sessionSalt)
  const c1y = 44 + hoseJitter(vehicleId, 4, 6, sessionSalt)
  const c2x = 66 + hoseJitter(vehicleId, 5, 8, sessionSalt)
  const c2y = 51 + hoseJitter(vehicleId, 6, 6, sessionSalt)
  const c3x = 44 + hoseJitter(vehicleId, 12, 10, sessionSalt)
  const c3y = 60 + hoseJitter(vehicleId, 13, 6, sessionSalt)
  const c4x = Math.min(hand.x - 4, ex + (body === 'car' ? 15 : 11))
  const c4y = ey - (body === 'car' ? 3 : 2)

  return clampHoseGeomLow({
    pump,
    hand,
    c1: { x: c1x, y: c1y },
    c2: { x: c2x, y: c2y },
    c3: { x: c3x, y: c3y },
    c4: { x: c4x, y: c4y },
    end: { x: ex, y: ey },
  })
}

export function buildHosePathFullFromGeom(g: HoseGeom): string {
  const { pump, hand, c1, c2, c3, c4, end } = g
  return `M ${pump.x} ${pump.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${hand.x} ${hand.y} C ${c3.x} ${c3.y}, ${c4.x} ${c4.y}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

export function smoothstep01(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function buildHosePathProgressive(g: HoseGeom, walkT: number, coupleT: number): string {
  const { pump, hand, c1, c2, c3, c4, end } = g
  const handWalkStart = { x: 77, y: 40 }
  const w = smoothstep01(walkT)
  const handNow = {
    x: lerp(handWalkStart.x, hand.x, w),
    y: lerp(handWalkStart.y, hand.y, w),
  }
  const c1w = {
    x: lerp(pump.x, c1.x, Math.max(0.35, w)),
    y: lerp(pump.y, c1.y, Math.max(0.35, w)),
  }
  const c2w = {
    x: lerp(handWalkStart.x, c2.x, w),
    y: lerp(handWalkStart.y, c2.y, w),
  }

  if (w < 1 - 1e-5) {
    return `M ${pump.x} ${pump.y} C ${c1w.x} ${c1w.y}, ${c2w.x} ${c2w.y}, ${handNow.x} ${handNow.y}`
  }

  const u = smoothstep01(coupleT)
  const endNow = {
    x: lerp(hand.x, end.x, u),
    y: lerp(hand.y, end.y, u),
  }
  const c3u = {
    x: lerp(hand.x, c3.x, 0.25 + 0.75 * u),
    y: lerp(hand.y, c3.y, 0.25 + 0.75 * u),
  }
  const c4u = {
    x: lerp(c4.x, endNow.x, u),
    y: lerp(c4.y, endNow.y, u),
  }
  return `M ${pump.x} ${pump.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${hand.x} ${hand.y} C ${c3u.x} ${c3u.y}, ${c4u.x} ${c4u.y}, ${endNow.x} ${endNow.y}`
}
