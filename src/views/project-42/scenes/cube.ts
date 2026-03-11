/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Project 42 - Data Cube (Solid Era)
 * 1. Gathering (155 -> 185)
 * 2. Solid Rotation (185 -> 255): Stays solid until "then it asked"
 */

export const cubeScene = {
  update: (
    positions: Float32Array,
    particlesCount: number,
    time: number,
    progress: number,
    points?: any,
  ) => {
    // Stage 1: Gathering (285.0 -> 345.0)
    const gatheringProgress = Math.min(1.0, Math.max(0, (progress - 285.0) / 60.0))
    const rotationActive = progress >= 345.0

    const colorAttr = points?.geometry?.attributes?.aColor
    const colors = colorAttr?.array as Float32Array | undefined

    const colCount = 200
    const skyBlue = { r: 0.22, g: 0.74, b: 0.97 }

    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      if (i3 + 2 >= positions.length) break

      const colIdx = i % colCount
      const rowIdx = Math.floor(i / colCount)
      const layer = Math.floor(colIdx / 4) % 3
      const direction = colIdx % 2 === 0 ? 1 : -1
      const baseSpeed = layer === 0 ? 1.4 + (colIdx % 8) * 0.12 : 0.8
      const vSpace = 80.0
      const vOff = rowIdx * 1.0

      const matrixX = (colIdx - colCount / 2) * 0.7
      const motionFade = 1.0 - gatheringProgress
      const matrixY =
        direction === 1
          ? 40.0 - ((time * baseSpeed * 12.0 * motionFade + vOff) % vSpace)
          : -40.0 + ((time * baseSpeed * 12.0 * motionFade + vOff) % vSpace)
      const matrixZ = layer === 0 ? 8.0 : layer === 1 ? -10.0 : -28.0

      const face = i % 6
      const side = 13.0
      const faceCount = particlesCount / 6
      const grid = Math.ceil(Math.sqrt(faceCount))
      const fi = (i % faceCount) % grid
      const fj = Math.floor((i % faceCount) / grid)
      const gu = (fi / grid - 0.5) * side
      const gv = (fj / grid - 0.5) * side
      const hSide = side * 0.5

      let cx = 0,
        cy = 0,
        cz = 0
      if (face === 0) {
        cx = gu
        cy = gv
        cz = hSide
      } else if (face === 1) {
        cx = gu
        cy = gv
        cz = -hSide
      } else if (face === 2) {
        cx = hSide
        cy = gu
        cz = gv
      } else if (face === 3) {
        cx = -hSide
        cy = gu
        cz = gv
      } else if (face === 4) {
        cx = gu
        cy = hSide
        cz = gv
      } else {
        cx = gu
        cy = -hSide
        cz = gv
      }

      const rotX = rotationActive ? time * 0.4 : 0
      const rotY = rotationActive ? time * 0.6 : 0

      const rx = cx * Math.cos(rotY) - cz * Math.sin(rotY)
      let rz = cx * Math.sin(rotY) + cz * Math.cos(rotY)
      const ry = cy * Math.cos(rotX) - rz * Math.sin(rotX)
      rz = cy * Math.sin(rotX) + rz * Math.cos(rotX)

      const cubeX = rx
      const cubeY = ry
      const cubeZ = rz - 5.0

      const tx = matrixX + (cubeX - matrixX) * gatheringProgress
      const ty = matrixY + (cubeY - matrixY) * gatheringProgress
      const tz = matrixZ + (cubeZ - matrixZ) * gatheringProgress

      const curX = positions[i3] ?? 0
      const curY = positions[i3 + 1] ?? 0
      const curZ = positions[i3 + 2] ?? 0
      const lerp = 0.1

      positions[i3] = curX + (tx - curX) * lerp
      positions[i3 + 1] = curY + (ty - curY) * lerp
      positions[i3 + 2] = curZ + (tz - curZ) * lerp

      if (colors && i3 + 2 < colors.length) {
        const br = 0.7 + gatheringProgress * 0.3
        colors[i3] = skyBlue.r * br
        colors[i3 + 1] = skyBlue.g * br
        colors[i3 + 2] = skyBlue.b * br
      }
    }
    if (colorAttr) colorAttr.needsUpdate = true
  },
}
