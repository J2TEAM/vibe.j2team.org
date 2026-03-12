import type { Point01, StrokeRecord, StrokeRecordEncoded } from '../types/drawing'

const DEFAULT_SCALE = 100000

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function quantize01(value: number, scale: number): number {
  return clampInt(Math.round(value * scale), 0, scale)
}

export function encodePointsDelta(points: Point01[], scale = DEFAULT_SCALE) {
  const safeScale = Number.isFinite(scale) ? Math.max(1, Math.round(scale)) : DEFAULT_SCALE
  if (points.length === 0) {
    return { scale: safeScale, start: [0, 0] as const, deltas: [] as number[] }
  }

  const x0 = quantize01(points[0]!.x, safeScale)
  const y0 = quantize01(points[0]!.y, safeScale)
  const deltas: number[] = []

  let prevX = x0
  let prevY = y0
  for (let i = 1; i < points.length; i += 1) {
    const x = quantize01(points[i]!.x, safeScale)
    const y = quantize01(points[i]!.y, safeScale)
    deltas.push(x - prevX, y - prevY)
    prevX = x
    prevY = y
  }

  return { scale: safeScale, start: [x0, y0] as const, deltas }
}

export function decodePointsDelta(encoded: {
  scale: number
  start: readonly [number, number]
  deltas: number[]
}) {
  const scale = Number.isFinite(encoded.scale)
    ? Math.max(1, Math.round(encoded.scale))
    : DEFAULT_SCALE
  const points: Point01[] = []

  let x = clampInt(Math.round(encoded.start[0] ?? 0), 0, scale)
  let y = clampInt(Math.round(encoded.start[1] ?? 0), 0, scale)
  points.push({ x: x / scale, y: y / scale })

  const deltas = encoded.deltas ?? []
  for (let i = 0; i + 1 < deltas.length; i += 2) {
    const dx = Number.isFinite(deltas[i]!) ? Math.round(deltas[i]!) : 0
    const dy = Number.isFinite(deltas[i + 1]!) ? Math.round(deltas[i + 1]!) : 0
    x = clampInt(x + dx, 0, scale)
    y = clampInt(y + dy, 0, scale)
    points.push({ x: x / scale, y: y / scale })
  }

  return points
}

export function encodeStroke(stroke: StrokeRecord): StrokeRecordEncoded {
  return {
    version: stroke.version,
    seed: stroke.seed,
    pointsDelta: encodePointsDelta(stroke.points, DEFAULT_SCALE),
    axis: {
      center: { x: stroke.axis.center.x, y: stroke.axis.center.y },
      axisAngles: stroke.axis.axisAngles.slice(),
    },
    brushTimeline: stroke.brushTimeline.map((k) => ({
      atPointIndex: k.atPointIndex,
      brush: { ...k.brush },
    })),
    meta: { canvasWidth: stroke.meta.canvasWidth, canvasHeight: stroke.meta.canvasHeight },
  }
}

export function decodeStroke(encoded: StrokeRecordEncoded): StrokeRecord {
  return {
    version: encoded.version,
    seed: encoded.seed,
    points: decodePointsDelta(encoded.pointsDelta),
    axis: {
      center: { x: encoded.axis.center.x, y: encoded.axis.center.y },
      axisAngles: encoded.axis.axisAngles.slice(),
    },
    brushTimeline: encoded.brushTimeline.map((k) => ({
      atPointIndex: k.atPointIndex,
      brush: { ...k.brush },
    })),
    meta: { canvasWidth: encoded.meta.canvasWidth, canvasHeight: encoded.meta.canvasHeight },
  }
}
