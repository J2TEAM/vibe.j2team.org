import { ref, shallowRef } from 'vue'
import type { GameMap } from '../types'
import {
  drawTerrainFromProfile,
  findGroundY,
  generateHillsProfile,
  isGrounded,
  isSolidPixel,
} from '../utils/terrain'

export function useTerrain() {
  // OffscreenCanvas used as collision mask
  const maskCanvas = shallowRef<OffscreenCanvas | null>(null)
  const maskCtx = shallowRef<OffscreenCanvasRenderingContext2D | null>(null)
  const maskData = shallowRef<ImageData | null>(null)

  // Heights profile for rendering
  const heightProfile = ref<number[]>([])

  const mapWidth = ref(0)
  const mapHeight = ref(0)

  /** Call once when game starts / map is chosen */
  function initTerrain(map: GameMap, seed: number) {
    mapWidth.value = map.width
    mapHeight.value = map.height

    const canvas = new OffscreenCanvas(map.width, map.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    maskCanvas.value = canvas
    maskCtx.value = ctx

    // Generate terrain profile
    const baseY = map.height * 0.55
    const amplitude = map.height * 0.12

    const profile = generateHillsProfile(map.width, baseY, amplitude, seed)
    heightProfile.value = profile

    // Draw terrain onto mask canvas
    ctx.clearRect(0, 0, map.width, map.height)
    drawTerrainFromProfile(ctx, profile, map.height, '#ffffff')

    // Snapshot imageData for pixel queries
    maskData.value = ctx.getImageData(0, 0, map.width, map.height)
  }

  /** Blow a circular hole in the terrain at (cx, cy) with given radius */
  function explode(cx: number, cy: number, radius: number) {
    const ctx = maskCtx.value
    const canvas = maskCanvas.value
    if (!ctx || !canvas) return

    // Use destination-out composite to erase pixels
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // Sync imageData snapshot
    maskData.value = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  function checkSolid(x: number, y: number): boolean {
    if (!maskData.value) return false
    return isSolidPixel(maskData.value, x, y)
  }

  function checkGrounded(charX: number, charY: number, charW: number, charH: number): boolean {
    if (!maskData.value) return false
    return isGrounded(maskData.value, charX, charY, charW, charH)
  }

  function getGroundY(x: number, fromY: number): number {
    if (!maskData.value) return mapHeight.value
    return findGroundY(maskData.value, x, fromY, mapHeight.value)
  }

  /**
   * Render the terrain onto the main visible canvas.
   * Call each frame from GameCanvas.
   */
  function renderTerrain(ctx: CanvasRenderingContext2D, groundColor: string, skyColor: string) {
    const w = mapWidth.value
    const h = mapHeight.value
    // Sky fill
    ctx.fillStyle = skyColor
    ctx.fillRect(0, 0, w, h)

    if (heightProfile.value.length === 0) return

    // Ground shape from profile
    ctx.fillStyle = groundColor
    ctx.beginPath()
    ctx.moveTo(0, heightProfile.value[0] ?? h)
    for (let x = 1; x < heightProfile.value.length; x++) {
      ctx.lineTo(x, heightProfile.value[x] ?? h)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()

    // Overlay the mask: erase areas that have been destroyed
    if (maskCanvas.value) {
      // Use the mask as the actual terrain shape
      // We draw ground, then use destination-in with the mask — but since we
      // already have the mask canvas as OffscreenCanvas, we composite it:
      ctx.save()
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(maskCanvas.value, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.restore()
    }

    // Ground outline
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, heightProfile.value[0] ?? h)
    for (let x = 1; x < heightProfile.value.length; x++) {
      ctx.lineTo(x, heightProfile.value[x] ?? h)
    }
    ctx.stroke()
  }

  return {
    mapWidth,
    mapHeight,
    heightProfile,
    maskCanvas,
    initTerrain,
    explode,
    checkSolid,
    checkGrounded,
    getGroundY,
    renderTerrain,
  }
}
