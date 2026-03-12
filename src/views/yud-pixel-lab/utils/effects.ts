import type { EffectId, EffectParams } from '../types'

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function grayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function applyDithering(imageData: ImageData, params: EffectParams): ImageData {
  const { width, height } = imageData
  const data = new Uint8ClampedArray(imageData.data)
  const threshold = params['threshold'] ?? 128
  const scale = params['scale'] ?? 1

  const w = Math.ceil(width / scale)
  const h = Math.ceil(height / scale)
  const gray = new Float32Array(w * h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(x * scale, width - 1)
      const sy = Math.min(y * scale, height - 1)
      const i = (sy * width + sx) * 4
      gray[y * w + x] = grayscale(data[i]!, data[i + 1]!, data[i + 2]!)
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      const oldVal = gray[idx]!
      const newVal = oldVal < threshold ? 0 : 255
      gray[idx] = newVal
      const err = oldVal - newVal

      if (x + 1 < w) gray[idx + 1] = gray[idx + 1]! + err * 7 / 16
      if (y + 1 < h) {
        if (x > 0) gray[(y + 1) * w + x - 1] = gray[(y + 1) * w + x - 1]! + err * 3 / 16
        gray[(y + 1) * w + x] = gray[(y + 1) * w + x]! + err * 5 / 16
        if (x + 1 < w) gray[(y + 1) * w + x + 1] = gray[(y + 1) * w + x + 1]! + err * 1 / 16
      }
    }
  }

  const out = new Uint8ClampedArray(data.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 4
      const si = Math.floor(y / scale) * w + Math.floor(x / scale)
      const val = clamp(Math.round(gray[si]!), 0, 255)
      out[di] = val
      out[di + 1] = val
      out[di + 2] = val
      out[di + 3] = 255
    }
  }
  return new ImageData(out, width, height)
}

function applyPixelate(imageData: ImageData, params: EffectParams): ImageData {
  const { width, height } = imageData
  const data = imageData.data
  const blockSize = Math.max(2, params['blockSize'] ?? 10)
  const out = new Uint8ClampedArray(data.length)

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      let r = 0, g = 0, b = 0, count = 0
      const bh = Math.min(blockSize, height - by)
      const bw = Math.min(blockSize, width - bx)

      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const i = ((by + y) * width + bx + x) * 4
          r += data[i]!
          g += data[i + 1]!
          b += data[i + 2]!
          count++
        }
      }

      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)

      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const i = ((by + y) * width + bx + x) * 4
          out[i] = r
          out[i + 1] = g
          out[i + 2] = b
          out[i + 3] = 255
        }
      }
    }
  }
  return new ImageData(out, width, height)
}

function applyHalftone(
  imageData: ImageData,
  params: EffectParams,
  canvas: OffscreenCanvas,
): ImageData {
  const { width, height } = imageData
  const data = imageData.data
  const spacing = Math.max(4, params['spacing'] ?? 8)
  const maxDot = Math.max(2, params['maxDot'] ?? 8)

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0F1923'
  ctx.fillRect(0, 0, width, height)

  for (let y = Math.floor(spacing / 2); y < height; y += spacing) {
    for (let x = Math.floor(spacing / 2); x < width; x += spacing) {
      const i = (y * width + x) * 4
      const brightness = grayscale(data[i]!, data[i + 1]!, data[i + 2]!)
      const radius = ((255 - brightness) / 255) * (maxDot / 2)

      if (radius > 0.5) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#F0EDE6'
        ctx.fill()
      }
    }
  }
  return ctx.getImageData(0, 0, width, height)
}

function applyEdge(imageData: ImageData, params: EffectParams): ImageData {
  const { width, height } = imageData
  const data = imageData.data
  const threshold = params['threshold'] ?? 50
  const shouldInvert = (params['invert'] ?? 0) > 0.5
  const out = new Uint8ClampedArray(data.length)

  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0, sumY = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * width + (x + kx)) * 4
          const gray = grayscale(data[i]!, data[i + 1]!, data[i + 2]!)
          const ki = (ky + 1) * 3 + (kx + 1)
          sumX += gray * gx[ki]!
          sumY += gray * gy[ki]!
        }
      }
      const magnitude = Math.sqrt(sumX * sumX + sumY * sumY)
      let val = magnitude > threshold ? 255 : 0
      if (shouldInvert) val = 255 - val

      const oi = (y * width + x) * 4
      out[oi] = val
      out[oi + 1] = val
      out[oi + 2] = val
      out[oi + 3] = 255
    }
  }
  return new ImageData(out, width, height)
}

export function processEffect(
  imageData: ImageData,
  effectId: EffectId,
  params: EffectParams,
  helperCanvas: OffscreenCanvas,
): ImageData {
  switch (effectId) {
    case 'dithering':
      return applyDithering(imageData, params)
    case 'pixelate':
      return applyPixelate(imageData, params)
    case 'halftone':
      return applyHalftone(imageData, params, helperCanvas)
    case 'edge':
      return applyEdge(imageData, params)
  }
}
