<script setup lang="ts">
import { ref } from 'vue'
import type { Character, DamageEvent, Explosion, GameMap, Projectile } from '../types'

const props = defineProps<{
  characters: Character[]
  projectiles: Projectile[]
  explosions: Explosion[]
  damageEvents: DamageEvent[]
  map: GameMap
  activeCharId: number
  angle: number
  power: number
  powerCharging: boolean
  phase: string
  wind: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

// ─── Draw helpers ───────────────────────────────────────────────────────────

function drawCharacter(ctx: CanvasRenderingContext2D, char: Character, isActive: boolean) {
  const { x, y, facingRight } = char
  const size = 36 // emoji font size
  const halfH = size / 2

  ctx.save()
  ctx.translate(x, y)

  // Active indicator (arrow above)
  if (isActive) {
    ctx.fillStyle = '#FFB830'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('▼', 0, -halfH - 22)
  }

  // Emoji character (flip horizontally when facing left)
  ctx.save()
  if (!facingRight) ctx.scale(-1, 1)
  ctx.font = `${size}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char.emoji, 0, -halfH)
  ctx.restore()

  // HP bar above
  const hpPct = char.hp / char.maxHp
  const barW = 44
  const barY = -halfH * 2 - 14
  ctx.fillStyle = '#253549'
  ctx.fillRect(-barW / 2, barY, barW, 6)
  ctx.fillStyle = hpPct > 0.4 ? '#38BDF8' : '#FF6B4A'
  ctx.fillRect(-barW / 2, barY, barW * hpPct, 6)

  // Name
  ctx.fillStyle = '#F0EDE6'
  ctx.font = '10px "Be Vietnam Pro", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(char.name, 0, barY - 4)

  ctx.restore()
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  ctx.save()
  ctx.translate(proj.x, proj.y)
  if (proj.isTeleport) {
    // Rotate plane to face direction of travel
    const angle = Math.atan2(proj.vy, proj.vx)
    ctx.rotate(angle)
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✈️', 0, 0)
  } else {
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(proj.weapon.emoji, 0, 0)
  }
  ctx.restore()
}

function drawExplosion(ctx: CanvasRenderingContext2D, ex: Explosion) {
  const eased = 1 - Math.pow(1 - ex.progress, 3)
  const r = ex.radius * (0.4 + eased * 0.6)
  const alpha = 1 - eased

  // Outer ring
  const grad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, r)
  grad.addColorStop(0, `rgba(255,180,50,${alpha})`)
  grad.addColorStop(0.5, `rgba(255,80,20,${alpha * 0.8})`)
  grad.addColorStop(1, `rgba(255,50,0,0)`)

  ctx.save()
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawDamageEvent(ctx: CanvasRenderingContext2D, ev: DamageEvent) {
  const alpha = Math.min(1, ev.ttl * 2)
  const yOffset = (1 - ev.ttl / 1.5) * 30
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = `bold ${ev.isCrit ? 20 : 16}px "Anybody", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = ev.isCrit ? '#FFB830' : '#FF6B4A'
  ctx.strokeStyle = '#0F1923'
  ctx.lineWidth = 3
  const text = ev.isCrit ? `💥 ${ev.damage}!` : `${ev.damage}`
  ctx.strokeText(text, ev.x, ev.y - yOffset)
  ctx.fillText(text, ev.x, ev.y - yOffset)
  ctx.restore()
}

function drawAimLine(ctx: CanvasRenderingContext2D, char: Character, angle: number, power: number) {
  const dir = char.facingRight ? 1 : -1
  const rad = (angle * Math.PI) / 180

  ctx.save()
  ctx.setLineDash([3, 6])
  ctx.strokeStyle = 'rgba(255,184,48,0.5)'
  ctx.lineWidth = 1.5

  let px = char.x
  let py = char.y - 20
  let vx = Math.cos(rad) * power * 0.4 * dir
  let vy = -Math.sin(rad) * power * 0.4

  ctx.beginPath()
  ctx.moveTo(px, py)

  for (let i = 0; i < 25; i++) {
    vx += 0 // no wind preview (simplified)
    vy += 3 // gravity preview
    px += vx
    py += vy
    if (px < 0 || px > props.map.width || py > props.map.height) break
    ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()
}

// ─── Main render (called by parent each frame) ───────────────────────────────

function render(renderTerrain: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. Terrain (delegated to useTerrain)
  renderTerrain(ctx)

  // 2. Aim line (before characters so it's behind them)
  const activeChar = props.characters.find((c) => c.id === props.activeCharId)
  if (activeChar && (props.phase === 'aiming' || props.phase === 'buff_select')) {
    drawAimLine(ctx, activeChar, props.angle, props.power)
  }

  // 3. Characters
  for (const char of props.characters) {
    if (char.alive) {
      drawCharacter(ctx, char, char.id === props.activeCharId)
    }
  }

  // 4. Projectiles
  for (const proj of props.projectiles) {
    if (proj.active) drawProjectile(ctx, proj)
  }

  // 5. Explosions
  for (const ex of props.explosions) {
    drawExplosion(ctx, ex)
  }

  // 6. Damage events
  for (const ev of props.damageEvents) {
    drawDamageEvent(ctx, ev)
  }
}

defineExpose({ canvasRef, render })
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="map.width"
    :height="map.height"
    class="block border border-border-default"
    style="image-rendering: pixelated"
  />
</template>
