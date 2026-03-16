/**
 * Project 42 - Cat SVG Sampler
 * Samples points from an SVG image for particle morphing
 */

export async function sampleCatPositions(
  svgUrl: string,
  sampleCount: number = 8000,
): Promise<Float32Array> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const W = 400
      const H = 266
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Could not get 2D context')
        resolve(new Float32Array(sampleCount * 3))
        return
      }
      ctx.drawImage(img, 0, 0, W, H)

      const imageData = ctx.getImageData(0, 0, W, H)
      const data = imageData.data

      // Collect all pixels with brightness > 128
      const filled: [number, number][] = []
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4
          const r = data[i] ?? 0
          const g = data[i + 1] ?? 0
          const b = data[i + 2] ?? 0
          const brightness = (r + g + b) / 3
          if (brightness > 128) {
            filled.push([x, y])
          }
        }
      }

      // If no pixels found, return empty array
      if (filled.length === 0) {
        console.warn('No bright pixels found in cat SVG')
        resolve(new Float32Array(sampleCount * 3))
        return
      }

      // Sample randomly among filled pixels
      const out = new Float32Array(sampleCount * 3)
      for (let i = 0; i < sampleCount; i++) {
        const point = filled[Math.floor(Math.random() * filled.length)]
        if (point) {
          const [px, py] = point
          const scale = 0.045 // Nhỏ gọn, tinh tế ở giữa màn hình
          out[i * 3] = (px - 200) * scale
          out[i * 3 + 1] = -(py - 133) * scale // Flip Y for Three.js coordinate system
          out[i * 3 + 2] = 0
        }
      }

      resolve(out)
    }
    img.onerror = (err) => {
      console.error('Failed to load cat SVG:', err)
      resolve(new Float32Array(sampleCount * 3))
    }
    img.src = svgUrl
  })
}
