export type Point01 = {
  x: number
  y: number
}

export type DrawableBox = {
  x: number
  y: number
  width: number
  height: number
}

export type BrushSettings = {
  brushColor: string
  brushSize: number
  brushSizeRel?: number
  brushOpacity: number
  brushSizeRandomness: number
  brushOpacityRandomness: number
  freeDraw: boolean
  tool?: 'draw' | 'erase'
}

export type AxisSnapshot = {
  center: Point01
  axisAngles: number[]
}

export type PointsDelta = {
  scale: number
  start: readonly [number, number]
  deltas: number[]
}

export type BrushKeyframe = {
  atPointIndex: number
  brush: BrushSettings
}

export type StrokeRecord = {
  version: 1
  seed: number
  points: Point01[]
  axis: AxisSnapshot
  brushTimeline: BrushKeyframe[]
  meta: {
    canvasWidth: number
    canvasHeight: number
  }
}

export type StrokeRecordEncoded = Omit<StrokeRecord, 'points'> & {
  pointsDelta: PointsDelta
}

export type BuaDrawingPayloadV2 = {
  version: 2
  createdAt: string
  name: string
  drawableBox: DrawableBox
  strokes: StrokeRecordEncoded[]
}

export type DrawingStats = {
  canvasWidth: number
  canvasHeight: number
  strokeCount: number
  pointCount: number
}
