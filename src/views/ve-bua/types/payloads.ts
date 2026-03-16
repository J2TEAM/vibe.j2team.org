import type { DrawableBox, Point01 } from './drawing'

export type PaperTransform = {
  offsetX: number
  offsetY: number
  scale: number
}

export type DrawingTransform = {
  offsetX: number
  offsetY: number
  scale: number
}

export type BuaStylePayloadV1 = {
  version: 1
  createdAt: string
  name: string
  style: {
    brushColor: string
    brushSize: number
    brushOpacity?: number
    brushSizeRandomness?: number
    brushOpacityRandomness?: number
    paperTint: string
    frameTint: string
    axisCount: number
    showGuides: boolean
    showAxisEditor: boolean
    freeDraw?: boolean
    drawableBox: DrawableBox
    paperTransform?: PaperTransform
  }
  axis: {
    center: Point01
    axisAngles: number[]
  }
}

export type BuaDrawingPayloadV1 = {
  version: 1
  createdAt: string
  name: string
  drawingDataUrl: string
}
