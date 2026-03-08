/// <reference lib="webworker" />

import { LEGO_COLORS, COLOR_RGB_FLAT } from './lego-colors'
import { findClosestLegoColorIndex } from './color-matcher'

// ─── Message types ────────────────────────────────────────────────────────────

interface ProcessMsg {
  type: 'process'
  pixels: ArrayBuffer // Uint8ClampedArray from getImageData (transferred)
  size: number // grid width = height (number of bricks per side)
  brick: number // canvas pixels per brick
}

interface RenderMsg {
  type: 'render'
  idxGrid: ArrayBuffer // Uint8Array of color indices (transferred copy)
  size: number
  brick: number
}

type WorkerInput = ProcessMsg | RenderMsg

// ─── Shared: build RGBA ImageData buffer from color-index grid ────────────────

function buildImageBuffer(idxGrid: Uint8Array, size: number, brick: number): Uint8ClampedArray {
  const cw = size * brick
  const buf = new Uint8ClampedArray(cw * cw * 4)
  const n = LEGO_COLORS.length

  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      const ci = idxGrid[gy * size + gx]! % n
      const fi = ci * 3
      const r = COLOR_RGB_FLAT[fi]!
      const g = COLOR_RGB_FLAT[fi + 1]!
      const b = COLOR_RGB_FLAT[fi + 2]!
      const bx = gx * brick
      const by = gy * brick

      for (let dy = 0; dy < brick; dy++) {
        const rowBase = (by + dy) * cw
        for (let dx = 0; dx < brick; dx++) {
          const pi = (rowBase + bx + dx) * 4
          buf[pi] = r
          buf[pi + 1] = g
          buf[pi + 2] = b
          buf[pi + 3] = 255
        }
      }
    }
  }

  return buf
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = ({ data }: MessageEvent<WorkerInput>) => {
  if (data.type === 'process') {
    const { pixels, size, brick } = data
    const src = new Uint8ClampedArray(pixels)
    const total = size * size

    // Step 1: Color matching (O(1) per pixel via LUT)
    const idxGrid = new Uint8Array(total)
    const stats = new Uint32Array(LEGO_COLORS.length)

    for (let i = 0; i < total; i++) {
      const pi = i * 4
      const idx = findClosestLegoColorIndex(src[pi]!, src[pi + 1]!, src[pi + 2]!)
      idxGrid[i] = idx
      stats[idx] = (stats[idx] ?? 0) + 1
    }

    // Step 2: Build ImageData (solid colors, no grid — grid is a canvas overlay)
    const imgBuf = buildImageBuffer(idxGrid, size, brick)

    self.postMessage(
      {
        type: 'process',
        imgBuffer: imgBuf.buffer,
        idxGrid: idxGrid.buffer,
        statsBuffer: stats.buffer,
        size,
        brick,
      },
      [imgBuf.buffer, idxGrid.buffer, stats.buffer],
    )
  } else if (data.type === 'render') {
    const { idxGrid: rawBuf, size, brick } = data
    const idxGrid = new Uint8Array(rawBuf)
    const imgBuf = buildImageBuffer(idxGrid, size, brick)

    self.postMessage({ type: 'render', imgBuffer: imgBuf.buffer, size, brick }, [imgBuf.buffer])
  }
}
