import {
  HUD_MARGIN_RATIO,
  HEART_SIZE_RATIO,
  HEART_SPACING,
  WEAPON_ICON_SIZE_RATIO,
  WEAPON_ICON_SPACING,
  HUD_FONT_SIZE_RATIO,
  TILE_SIZE,
  COLORS,
  SWORD_RANGE,
} from '../utils/constants'
import type { HUDState, TileMap, TileType, AABB, Vec2, AlertState, Direction } from '../utils/types'
import { Camera } from './Camera'
import { Physics } from './Physics'

/** Map tile types to colors */
const TILE_COLORS: Record<TileType, string> = {
  empty: COLORS.bgDeep,
  ground: COLORS.ground,
  wall: COLORS.wall,
  tree: COLORS.tree,
  bush: COLORS.bush,
  water: COLORS.water,
  chest: COLORS.chest,
  gate: COLORS.gate,
  pillar: '#3D3D50', // dark stone gray
}

/** Bridge theme overrides — stone corridor over a void chasm */
const BRIDGE_TILE_COLORS: Partial<Record<TileType, string>> = {
  ground: '#8B7355', // warm stone
  wall: '#5C4A32', // dark stone railing
  water: '#0A0A15', // dark void/chasm
  empty: '#0A0A15',
}

/** Castle theme overrides — dark throne room atmosphere */
const CASTLE_TILE_COLORS: Partial<Record<TileType, string>> = {
  ground: '#2A2035', // dark stone floor
  wall: '#1A1525', // dark castle walls
  pillar: '#3D3050', // stone pillars (slightly lighter than walls)
  empty: '#0A0510', // deep void
}

export class Renderer {
  /** Draw visible tiles from tilemap */
  drawTileMap(ctx: CanvasRenderingContext2D, map: TileMap, camera: Camera): void {
    const { startCol, endCol, startRow, endRow } = camera.getVisibleTileRange(map)
    const isBridge = map.theme === 'bridge'
    const isCastle = map.theme === 'castle'

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = map.tiles[row]?.[col] ?? 'empty'
        const x = col * TILE_SIZE
        const y = row * TILE_SIZE

        if (isBridge) {
          ctx.fillStyle = BRIDGE_TILE_COLORS[tile] ?? TILE_COLORS[tile]
        } else if (isCastle) {
          ctx.fillStyle = CASTLE_TILE_COLORS[tile] ?? TILE_COLORS[tile]
        } else {
          ctx.fillStyle = TILE_COLORS[tile]
        }
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)

        this.drawTileDetail(ctx, tile, x, y, isBridge)
      }
    }
  }

  /** Draw simple pixel details on tiles */
  private drawTileDetail(
    ctx: CanvasRenderingContext2D,
    tile: TileType,
    x: number,
    y: number,
    isBridge = false,
  ): void {
    const s = TILE_SIZE

    switch (tile) {
      case 'tree':
        ctx.fillStyle = '#3E2723'
        ctx.fillRect(x + s * 0.4, y + s * 0.6, s * 0.2, s * 0.4)
        ctx.fillStyle = '#1B5E20'
        ctx.beginPath()
        ctx.arc(x + s / 2, y + s * 0.4, s * 0.35, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'bush':
        ctx.fillStyle = '#2E7D32'
        ctx.beginPath()
        ctx.arc(x + s * 0.3, y + s * 0.5, s * 0.2, 0, Math.PI * 2)
        ctx.arc(x + s * 0.7, y + s * 0.5, s * 0.2, 0, Math.PI * 2)
        ctx.arc(x + s * 0.5, y + s * 0.35, s * 0.2, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'wall':
        ctx.strokeStyle = isBridge ? '#3A2A1A' : '#4E342E'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 1, y + 1, s / 2 - 1, s / 2 - 1)
        ctx.strokeRect(x + s / 2, y + s / 2, s / 2 - 1, s / 2 - 1)
        break

      case 'water':
        if (!isBridge) {
          ctx.strokeStyle = '#1E88E5'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x + 2, y + s * 0.4)
          ctx.quadraticCurveTo(x + s / 2, y + s * 0.25, x + s - 2, y + s * 0.4)
          ctx.stroke()
        }
        // Bridge water (chasm) — no wave detail, just dark void
        break

      case 'chest':
        ctx.strokeStyle = '#B8860B'
        ctx.lineWidth = 2
        ctx.strokeRect(x + 4, y + 6, s - 8, s - 10)
        ctx.fillStyle = '#8B6914'
        ctx.fillRect(x + s / 2 - 3, y + s / 2, 6, 6)
        break
    }
  }

  /** Draw a colored rectangle (entity placeholder) */
  drawRect(ctx: CanvasRenderingContext2D, aabb: AABB, color: string): void {
    ctx.fillStyle = color
    ctx.fillRect(aabb.x, aabb.y, aabb.width, aabb.height)
  }

  /** Draw grid overlay (debug) */
  drawGrid(ctx: CanvasRenderingContext2D, camera: Camera, map: TileMap): void {
    const { startCol, endCol, startRow, endRow } = camera.getVisibleTileRange(map)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 0.5

    for (let col = startCol; col <= endCol; col++) {
      const x = col * TILE_SIZE
      ctx.beginPath()
      ctx.moveTo(x, startRow * TILE_SIZE)
      ctx.lineTo(x, endRow * TILE_SIZE)
      ctx.stroke()
    }
    for (let row = startRow; row <= endRow; row++) {
      const y = row * TILE_SIZE
      ctx.beginPath()
      ctx.moveTo(startCol * TILE_SIZE, y)
      ctx.lineTo(endCol * TILE_SIZE, y)
      ctx.stroke()
    }
  }

  /** Draw FPS counter (screen space, call without camera transform) */
  drawHUD(ctx: CanvasRenderingContext2D, state: HUDState): void {
    this.drawHearts(ctx, state)
    this.drawWeaponIndicator(ctx, state)
    this.drawStageIndicator(ctx, state)
  }

  private drawHearts(ctx: CanvasRenderingContext2D, state: HUDState): void {
    const { width } = ctx.canvas
    const margin = Math.round(width * HUD_MARGIN_RATIO)
    const size = Math.round(width * HEART_SIZE_RATIO)
    const spacing = HEART_SPACING

    for (let i = 0; i < state.maxHealth; i++) {
      const x = margin + i * (size + spacing)
      const y = margin

      if (i < state.health) {
        // Filled Heart
        ctx.fillStyle = COLORS.heartRed || '#EF4444'
        ctx.beginPath()
        ctx.moveTo(x + size / 2, y + size * 0.9)
        ctx.bezierCurveTo(x + size, y + size * 0.6, x + size, y, x + size / 2, y + size * 0.3)
        ctx.bezierCurveTo(x, y, x, y + size * 0.6, x + size / 2, y + size * 0.9)
        ctx.fill()

        // Highlight
        ctx.fillStyle = '#FCA5A5'
        ctx.fillRect(x + size * 0.25, y + size * 0.25, size * 0.15, size * 0.15)
      } else {
        // Empty Heart
        ctx.strokeStyle = COLORS.heartEmpty || '#374151'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x + size / 2, y + size * 0.9)
        ctx.bezierCurveTo(x + size, y + size * 0.6, x + size, y, x + size / 2, y + size * 0.3)
        ctx.bezierCurveTo(x, y, x, y + size * 0.6, x + size / 2, y + size * 0.9)
        ctx.stroke()
      }
    }
  }

  private drawWeaponIndicator(ctx: CanvasRenderingContext2D, state: HUDState): void {
    const { width } = ctx.canvas
    const margin = Math.round(width * HUD_MARGIN_RATIO)
    const size = Math.round(width * WEAPON_ICON_SIZE_RATIO)
    const spacing = WEAPON_ICON_SPACING

    // Position: Top Right
    const startX = width - margin - (size * 3 + spacing * 2)
    const y = margin

    const weapons = [
      {
        type: 'sword',
        color: '#FFB830',
        unlocked: state.weapons.sword,
        active: state.combatState === 'attacking',
        cooldown: state.swordCooldownRatio,
      },
      {
        type: 'shield',
        color: '#38BDF8',
        unlocked: state.weapons.shield,
        active: state.combatState === 'blocking',
        cooldown: 0,
      },
      {
        type: 'bow',
        color: '#FF6B4A',
        unlocked: state.weapons.bow,
        active: state.combatState === 'shooting',
        cooldown: state.bowCooldownRatio,
      },
    ]

    weapons.forEach((w, index) => {
      const x = startX + index * (size + spacing)

      // Slot Background — always filled; active slot gets an additional glow outline
      ctx.fillStyle = w.unlocked ? '#1F2937' : '#111827'
      ctx.fillRect(x, y, size, size)
      if (w.active) {
        ctx.save()
        ctx.shadowColor = w.color
        ctx.shadowBlur = 10
        ctx.strokeStyle = w.color
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, size, size)
        ctx.shadowBlur = 0
        ctx.restore()
      }

      // Icon
      if (w.unlocked) {
        ctx.fillStyle = w.color
        if (w.type === 'sword') {
          // Sword icon
          ctx.beginPath()
          ctx.moveTo(x + size * 0.2, y + size * 0.8)
          ctx.lineTo(x + size * 0.8, y + size * 0.2)
          ctx.strokeStyle = w.color
          ctx.lineWidth = 2
          ctx.stroke()
        } else if (w.type === 'shield') {
          // Shield icon
          ctx.fillRect(x + size * 0.25, y + size * 0.25, size * 0.5, size * 0.5)
        } else if (w.type === 'bow') {
          // Bow icon
          ctx.beginPath()
          ctx.arc(x + size * 0.3, y + size * 0.5, size * 0.4, -Math.PI / 2, Math.PI / 2)
          ctx.strokeStyle = w.color
          ctx.stroke()
        }

        // Cooldown overlay
        if (w.cooldown > 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
          ctx.fillRect(x, y, size, size * w.cooldown)
        }
      } else {
        // Locked icon (gray silhouette or just empty dark slot)
        ctx.fillStyle = '#374151'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('?', x + size / 2, y + size / 2)
      }
    })
  }

  private drawStageIndicator(ctx: CanvasRenderingContext2D, state: HUDState): void {
    const { width } = ctx.canvas
    const margin = Math.round(width * HUD_MARGIN_RATIO)
    const heartSize = Math.round(width * HEART_SIZE_RATIO)
    const fontSize = Math.round(width * HUD_FONT_SIZE_RATIO)

    const x = margin
    const y = margin + heartSize + fontSize + 4

    ctx.fillStyle = COLORS.textSecondary || '#9CA3AF'
    ctx.font = `${fontSize}px monospace`
    ctx.textAlign = 'left'
    ctx.fillText(`Stage ${state.stageNumber}/3`, x, y)
  }

  drawFPS(ctx: CanvasRenderingContext2D, fps: number): void {
    const { width } = ctx.canvas
    const margin = Math.round(width * HUD_MARGIN_RATIO)
    const weaponSize = Math.round(width * WEAPON_ICON_SIZE_RATIO)
    const boxY = margin + weaponSize + 12

    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(width - 70, boxY, 66, 20)
    ctx.fillStyle = fps >= 55 ? '#4ADE80' : fps >= 30 ? '#FBBF24' : '#EF4444'
    ctx.font = '12px monospace'
    ctx.fillText(`${Math.round(fps)} FPS`, width - 64, boxY + 14)
  }

  /** Draw collision boxes for entities (world space) */
  drawCollisionBoxes(ctx: CanvasRenderingContext2D, boxes: AABB[]): void {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
    ctx.lineWidth = 1
    for (const box of boxes) {
      ctx.strokeRect(box.x, box.y, box.width, box.height)
    }
  }

  /** Draw entity count + debug info (screen space) */
  drawDebugInfo(
    ctx: CanvasRenderingContext2D,
    info: {
      entityCount: number
      playerPos: Vec2
      playerHealth: number
      playerMaxHealth: number
      state: string
      // [RED TEAM #3] OPTIONAL — won't break existing callers that don't pass stageStatus
      stageStatus?: {
        keyCollected: boolean
        chestOpened: boolean
        gateOpen: boolean
        alertCount: number
      }
    },
  ): void {
    const { width } = ctx.canvas
    const margin = Math.round(width * HUD_MARGIN_RATIO)
    const heartSize = Math.round(width * HEART_SIZE_RATIO)
    const fontSize = Math.round(width * HUD_FONT_SIZE_RATIO)
    const stageIndicatorY = margin + heartSize + fontSize + 4
    const lines = 4 + (info.stageStatus ? 1 : 0)
    const height = lines * 14 + 10
    const panelX = 4
    const panelY = stageIndicatorY + fontSize + 12

    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(panelX, panelY, 200, height)
    ctx.fillStyle = '#F0EDE6'
    ctx.font = '11px monospace'
    let y = panelY + 14
    ctx.fillText(`State: ${info.state}`, panelX + 4, y)
    y += 14
    // [RED TEAM #3] Optional chaining — safe when stageStatus is undefined
    const alertSuffix = info.stageStatus?.alertCount
      ? ` (${info.stageStatus.alertCount} alert)`
      : ''
    ctx.fillText(`Entities: ${info.entityCount}${alertSuffix}`, panelX + 4, y)
    y += 14
    ctx.fillText(
      `Pos: ${Math.round(info.playerPos.x)},${Math.round(info.playerPos.y)}`,
      panelX + 4,
      y,
    )
    y += 14
    if (info.stageStatus) {
      const k = info.stageStatus.keyCollected ? '✓' : '✗'
      const g = info.stageStatus.gateOpen ? '✓' : '✗'
      const c = info.stageStatus.chestOpened ? '✓' : '✗'
      ctx.fillText(`Key: ${k} | Gate: ${g} | Chest: ${c}`, panelX + 4, y)
    }
  }

  /**
   * Draw enemy vision cone (occluded ray-casting)
   */
  drawVisionCone(
    ctx: CanvasRenderingContext2D,
    center: Vec2,
    facingAngleRad: number,
    range: number,
    halfAngleRad: number,
    alertState: AlertState,
    map: TileMap,
  ): void {
    const RAY_COUNT = 16
    const STEP = 4
    const startAngle = facingAngleRad - halfAngleRad
    const endAngle = facingAngleRad + halfAngleRad
    const angleStep = (endAngle - startAngle) / (RAY_COUNT - 1)

    const points: Vec2[] = []

    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = startAngle + i * angleStep
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)

      let cx = center.x
      let cy = center.y

      // Ray march
      for (let dist = 0; dist < range; dist += STEP) {
        cx += dx * STEP
        cy += dy * STEP

        const tile = Physics.getTileAt(map, cx, cy)
        // Bushes are see-through for vision
        if (tile === 'wall' || tile === 'tree') {
          break
        }
      }
      points.push({ x: cx, y: cy })
    }

    // Draw Polygon
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    for (const p of points) {
      ctx.lineTo(p.x, p.y)
    }
    ctx.closePath()

    // Fill Color
    let color = 'rgba(255, 165, 0, 0.15)' // patrol: orange
    if (alertState === 'alert') color = 'rgba(255, 50, 50, 0.25)' // alert: red
    if (alertState === 'chase') color = 'rgba(255, 0, 0, 0.35)' // chase: bright red

    ctx.fillStyle = color
    ctx.fill()
  }

  /** Draw alert status indicator above enemy head */
  drawAlertIndicator(ctx: CanvasRenderingContext2D, pos: Vec2, alertState: AlertState): void {
    if (alertState === 'patrol') return

    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'center'

    if (alertState === 'alert') {
      ctx.fillStyle = '#FFD700' // Gold/Yellow
      ctx.fillText('!', pos.x, pos.y - 10)
    } else if (alertState === 'chase') {
      ctx.fillStyle = '#FF0000' // Red
      ctx.fillText('!!', pos.x, pos.y - 10)
    }
  }

  /** Draw floating icon (e.g. key) above an entity */
  drawFloatingIcon(
    ctx: CanvasRenderingContext2D,
    pos: Vec2,
    type: 'key',
    floatOffset: number,
  ): void {
    if (type === 'key') {
      const y = pos.y - 24 + Math.sin(floatOffset) * 4
      ctx.fillStyle = '#FFD700' // Gold
      // Key head
      ctx.beginPath()
      ctx.arc(pos.x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      // Key shaft
      ctx.fillRect(pos.x - 1, y + 4, 2, 8)
      // Key teeth
      ctx.fillRect(pos.x + 1, y + 8, 3, 2)
    }
  }

  /** Draw interaction prompt text */
  drawInteractPrompt(ctx: CanvasRenderingContext2D, pos: Vec2, text: string): void {
    ctx.font = '12px monospace'
    const width = ctx.measureText(text).width + 8

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(pos.x - width / 2, pos.y - 30, width, 20)

    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.fillText(text, pos.x, pos.y - 16)
  }

  /**
   * Draw sword swing arc visual centered on the player (world space).
   * playerCenter — the center point of the player entity.
   */
  drawSwordSwing(ctx: CanvasRenderingContext2D, playerCenter: Vec2, direction: Direction): void {
    ctx.save()
    ctx.strokeStyle = '#E0E8FF'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    const { x: cx, y: cy } = playerCenter
    const r = SWORD_RANGE

    ctx.beginPath()
    switch (direction) {
      case 'right':
        ctx.arc(cx, cy, r, -Math.PI / 4, Math.PI / 4)
        break
      case 'left':
        ctx.arc(cx, cy, r, (Math.PI * 3) / 4, (Math.PI * 5) / 4)
        break
      case 'up':
        ctx.arc(cx, cy, r, (-Math.PI * 3) / 4, -Math.PI / 4)
        break
      case 'down':
        ctx.arc(cx, cy, r, Math.PI / 4, (Math.PI * 3) / 4)
        break
    }
    ctx.stroke()
    ctx.restore()
  }

  // Phase 3: Stage Transition Methods
  drawVictoryBanner(ctx: CanvasRenderingContext2D): void {
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = ctx.canvas
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(15, 25, 35, 0.7)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // "STAGE 1 COMPLETE" — large centered text
    ctx.fillStyle = COLORS.accentAmber || '#FFD700'
    ctx.font = 'bold 36px "Anybody", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('STAGE 1 COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)

    // Subtitle
    ctx.fillStyle = COLORS.textSecondary || '#A0A0A0'
    ctx.font = '16px "Be Vietnam Pro", sans-serif'
    ctx.fillText('Khu rừng đã được giải phóng!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
  }

  drawStage2VictoryBanner(ctx: CanvasRenderingContext2D): void {
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = ctx.canvas
    ctx.fillStyle = 'rgba(15, 25, 35, 0.7)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = COLORS.accentAmber || '#FFD700'
    ctx.font = 'bold 36px "Anybody", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('STAGE 2 COMPLETE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)

    ctx.fillStyle = COLORS.textSecondary || '#A0A0A0'
    ctx.font = '16px "Be Vietnam Pro", sans-serif'
    ctx.fillText('Cầu Hyrule đã vượt qua!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
  }

  drawStage3Transition(ctx: CanvasRenderingContext2D): void {
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = ctx.canvas
    // Dark overlay
    ctx.fillStyle = 'rgba(15, 25, 35, 0.85)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const centerX = CANVAS_WIDTH / 2
    const centerY = CANVAS_HEIGHT / 2

    // Dialog box
    const boxW = Math.min(560, CANVAS_WIDTH - 40),
      boxH = 180
    const boxX = centerX - boxW / 2,
      boxY = centerY - boxH / 2

    ctx.fillStyle = COLORS.bgSurface || '#2A2A2A'
    ctx.fillRect(boxX, boxY, boxW, boxH)

    // Border
    ctx.strokeStyle = COLORS.accentAmber || '#FFD700'
    ctx.lineWidth = 2
    ctx.strokeRect(boxX, boxY, boxW, boxH)

    // Story text — line 1
    ctx.fillStyle = COLORS.textPrimary || '#FFFFFF'
    ctx.font = '16px "Be Vietnam Pro", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Cầu Hyrule đã vượt qua!', centerX, centerY - 30)

    // Story text — line 2
    ctx.fillText('Lâu đài Ganon ở phía trước...', centerX, centerY)

    // Story text — line 3
    ctx.fillText('Zelda đang chờ.', centerX, centerY + 24)

    // Prompt
    ctx.fillStyle = COLORS.textSecondary || '#A0A0A0'
    ctx.font = '14px "Be Vietnam Pro", sans-serif'
    ctx.fillText('Nhấn phím để tiếp tục', centerX, centerY + 60)
  }

  drawVictoryScene(
    ctx: CanvasRenderingContext2D,
    stats: { time: string; enemiesDefeated: number; damageTaken: number },
  ): void {
    const w = ctx.canvas.width
    const h = ctx.canvas.height

    ctx.fillStyle = '#0A0510'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#D4A574'
    ctx.font = 'bold 24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('GANON DEFEATED', w / 2, h * 0.15)

    ctx.fillStyle = '#A78BFA'
    ctx.font = '14px monospace'
    ctx.fillText('Hyrule đã được cứu!', w / 2, h * 0.22)

    const sceneY = h * 0.4
    ctx.fillStyle = '#22C55E'
    ctx.fillRect(w / 2 - 20, sceneY, 8, 16)
    ctx.fillStyle = '#FDE68A'
    ctx.fillRect(w / 2 - 20, sceneY - 4, 8, 6)
    ctx.fillStyle = '#F9A8D4'
    ctx.fillRect(w / 2 + 12, sceneY, 8, 16)
    ctx.fillStyle = '#FDE68A'
    ctx.fillRect(w / 2 + 12, sceneY - 4, 8, 6)

    const statsY = h * 0.6
    ctx.fillStyle = '#E5E7EB'
    ctx.font = '14px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`⏱ Thời gian: ${stats.time}`, w / 2, statsY)
    ctx.fillText(`⚔ Kẻ thù đã hạ: ${stats.enemiesDefeated}`, w / 2, statsY + 24)
    ctx.fillText(`💔 Sát thương nhận: ${stats.damageTaken}`, w / 2, statsY + 48)
  }

  drawVignette(ctx: CanvasRenderingContext2D, intensity: number): void {
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    const cx = w / 2
    const cy = h / 2
    const maxRadius = Math.sqrt(cx * cx + cy * cy)

    const gradient = ctx.createRadialGradient(cx, cy, maxRadius * 0.4, cx, cy, maxRadius)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, `rgba(10, 5, 16, ${0.6 * intensity})`)

    ctx.save()
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }

  /** Pulsing red vignette for low-health warning */
  drawRedVignette(ctx: CanvasRenderingContext2D, intensity: number): void {
    if (intensity <= 0) return
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7)
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0)')
    gradient.addColorStop(1, `rgba(255, 0, 0, ${intensity})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  }

  /** Fallback dark overlay for game-over desaturation when ctx.filter is unavailable. */
  drawDesaturate(ctx: CanvasRenderingContext2D, progress: number): void {
    ctx.globalAlpha = progress * 0.5
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.globalAlpha = 1
  }

  drawStageTransition(ctx: CanvasRenderingContext2D, fromStageNumber = 1): void {
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = ctx.canvas
    // Dark overlay
    ctx.fillStyle = 'rgba(15, 25, 35, 0.85)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const centerX = CANVAS_WIDTH / 2
    const centerY = CANVAS_HEIGHT / 2

    // Dialog box
    const boxW = Math.min(560, CANVAS_WIDTH - 40),
      boxH = 180
    const boxX = centerX - boxW / 2,
      boxY = centerY - boxH / 2

    ctx.fillStyle = COLORS.bgSurface || '#2A2A2A'
    ctx.fillRect(boxX, boxY, boxW, boxH)

    // Border
    ctx.strokeStyle = COLORS.accentAmber || '#FFD700'
    ctx.lineWidth = 2
    ctx.strokeRect(boxX, boxY, boxW, boxH)

    ctx.fillStyle = COLORS.textPrimary || '#FFFFFF'
    ctx.font = '16px "Be Vietnam Pro", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (fromStageNumber === 2) {
      // Stage 2 complete → Stage 3 intro
      ctx.fillText('Cầu Hyrule đã vượt qua!', centerX, centerY - 40)
      ctx.fillText('Lâu đài Ganon ở phía trước...', centerX, centerY - 10)
      ctx.fillText('Zelda đang chờ.', centerX, centerY + 20)
    } else {
      // Stage 1 complete → Stage 2 intro
      ctx.fillText('Khu rừng đã an toàn.', centerX, centerY - 30)
      ctx.fillText('Nhưng nhà tù của Zelda nằm bên kia Cầu Hyrule...', centerX, centerY)
    }

    // Prompt
    ctx.fillStyle = COLORS.textSecondary || '#A0A0A0'
    ctx.font = '14px "Be Vietnam Pro", sans-serif'
    ctx.fillText('Nhấn phím để tiếp tục', centerX, centerY + 50)
  }

  drawComingSoon(ctx: CanvasRenderingContext2D): void {
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = ctx.canvas
    ctx.fillStyle = 'rgba(15, 25, 35, 0.9)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const centerX = CANVAS_WIDTH / 2
    const centerY = CANVAS_HEIGHT / 2

    // Title
    ctx.fillStyle = COLORS.accentAmber || '#FFD700'
    ctx.font = 'bold 28px "Anybody", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('STAGE 1 HOÀN THÀNH!', centerX, centerY - 60)

    // Coming soon message
    ctx.fillStyle = COLORS.textPrimary || '#FFFFFF'
    ctx.font = '18px "Be Vietnam Pro", sans-serif'
    ctx.fillText('Stage 2: Cầu Hyrule — Sắp ra mắt!', centerX, centerY - 10)

    // Play Again button area
    ctx.fillStyle = COLORS.accentCoral || '#FF7F50'
    const btnW = 180,
      btnH = 40
    ctx.fillRect(centerX - btnW / 2, centerY + 30, btnW, btnH)
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px "Be Vietnam Pro", sans-serif'
    ctx.fillText('Chơi lại (Z)', centerX, centerY + 50)

    // Home link
    ctx.fillStyle = COLORS.textSecondary || '#A0A0A0'
    ctx.font = '14px "Be Vietnam Pro", sans-serif'
    ctx.fillText('Về trang chủ: nhấn Escape', centerX, centerY + 90)
  }
}
