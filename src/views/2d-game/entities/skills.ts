import type { SkillType, SkillConfig, Projectile, Player, WeaponType } from '../types'
import { WEAPONS } from './weapons'

export const SKILLS: Record<SkillType, SkillConfig> = {
  dash: {
    name: 'Dash Strike',
    description: 'Lao nhanh + chém',
    manaCost: 15,
    cooldown: 90, // 1.5s
    icon: '💨',
    color: '#38bdf8',
    key: 'Q',
  },
  heal: {
    name: 'Heal Pulse',
    description: 'Hồi HP bản thân',
    manaCost: 25,
    cooldown: 300, // 5s
    icon: '💚',
    color: '#4ade80',
    key: 'E',
  },
  ultimate: {
    name: 'Ultimate',
    description: 'Chiêu cuối theo vũ khí',
    manaCost: 50,
    cooldown: 600, // 10s
    icon: '🔥',
    color: '#f97316',
    key: 'R',
  },
}

// Get ultimate name based on weapon
export function getUltimateName(weapon: WeaponType): string {
  const names: Record<WeaponType, string> = {
    sword: '⚔ Kiếm Khí Trảm',
    dual_swords: '⚔ Loạn Kiếm Vũ',
    axe: '🪓 Rìu Phá Thiên',
    bow: '🏹 Mưa Tên Lửa',
    shuriken: '✦ Phi Tiêu Bão',
    hammer: '🔨 Sấm Sét Nộ',
  }
  return names[weapon]
}

// Create projectiles for weapon attacks
export function createWeaponProjectile(player: Player, weapon: WeaponType): Projectile | null {
  const wCfg = WEAPONS[weapon]

  if (weapon === 'bow') {
    return {
      x: player.x + (player.facing > 0 ? player.w : -16),
      y: player.y + player.h / 2 - 6,
      vx: player.facing * 10,
      vy: 0,
      w: 18,
      h: 12,
      damage: wCfg.damage + player.baseAtk,
      life: 60,
      type: 'arrow',
      color: wCfg.color,
      rotation: 0,
      piercing: false,
      hitTargets: [],
    }
  }

  if (weapon === 'shuriken') {
    return {
      x: player.x + (player.facing > 0 ? player.w : -10),
      y: player.y + player.h / 2 - 7,
      vx: player.facing * 8,
      vy: 0,
      w: 14,
      h: 14,
      damage: wCfg.damage + player.baseAtk * 0.5,
      life: 50,
      type: 'shuriken_proj',
      color: wCfg.color,
      rotation: 0,
      piercing: false,
      hitTargets: [],
    }
  }

  if (weapon === 'hammer') {
    // Shockwave on ground
    if (player.onGround) {
      return {
        x: player.x + (player.facing > 0 ? player.w : -40),
        y: player.y + player.h - 10,
        vx: player.facing * 4,
        vy: 0,
        w: 50,
        h: 12,
        damage: wCfg.damage * 0.6,
        life: 30,
        type: 'shockwave',
        color: '#fbbf24',
        rotation: 0,
        piercing: true,
        hitTargets: [],
      }
    }
  }

  return null
}

// Create ultimate projectile
export function createUltimateProjectile(player: Player): Projectile[] {
  const weapon = player.weapon
  const projectiles: Projectile[] = []

  switch (weapon) {
    case 'sword':
      // Large sword wave
      projectiles.push({
        x: player.x + (player.facing > 0 ? player.w : -60),
        y: player.y - 10,
        vx: player.facing * 7,
        vy: 0,
        w: 60,
        h: 50,
        damage: 80 + player.baseAtk * 2,
        life: 40,
        type: 'ultimate',
        color: '#60a5fa',
        rotation: 0,
        piercing: true,
        hitTargets: [],
      })
      break

    case 'dual_swords':
      // Multiple slashes
      for (let i = 0; i < 5; i++) {
        projectiles.push({
          x: player.x + (player.facing > 0 ? player.w : -30) + player.facing * i * 20,
          y: player.y - 5 + (i % 2) * 10,
          vx: player.facing * (8 + i * 1.5),
          vy: (i % 2 === 0 ? -1 : 1) * 0.5,
          w: 30,
          h: 8,
          damage: 25 + player.baseAtk,
          life: 30,
          type: 'ultimate',
          color: '#60a5fa',
          rotation: 0,
          piercing: false,
          hitTargets: [],
        })
      }
      break

    case 'axe':
      // Giant shockwave
      projectiles.push({
        x: player.x - 80,
        y: player.y + player.h - 20,
        vx: 0,
        vy: 0,
        w: 200,
        h: 30,
        damage: 120 + player.baseAtk * 2,
        life: 25,
        type: 'ultimate',
        color: '#a78bfa',
        rotation: 0,
        piercing: true,
        hitTargets: [],
      })
      break

    case 'bow':
      // Rain of arrows
      for (let i = 0; i < 8; i++) {
        projectiles.push({
          x: player.x + player.facing * 40 + i * 30 * player.facing,
          y: player.y - 100 - i * 20,
          vx: player.facing * 2,
          vy: 6 + Math.random() * 2,
          w: 4,
          h: 12,
          damage: 20 + player.baseAtk * 0.8,
          life: 45,
          type: 'arrow',
          color: '#fb923c',
          rotation: 0,
          piercing: false,
          hitTargets: [],
        })
      }
      break

    case 'shuriken':
      // Spiral of shurikens
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2
        projectiles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h / 2,
          vx: Math.cos(angle) * 6,
          vy: Math.sin(angle) * 6,
          w: 8,
          h: 8,
          damage: 18 + player.baseAtk * 0.5,
          life: 40,
          type: 'shuriken_proj',
          color: '#5eead4',
          rotation: 0,
          piercing: false,
          hitTargets: [],
        })
      }
      break

    case 'hammer':
      // Thunder slam - large AOE
      projectiles.push({
        x: player.x - 100,
        y: player.y - 60,
        vx: 0,
        vy: 0,
        w: 240,
        h: 120,
        damage: 150 + player.baseAtk * 2.5,
        life: 20,
        type: 'ultimate',
        color: '#fbbf24',
        rotation: 0,
        piercing: true,
        hitTargets: [],
      })
      break
  }
  return projectiles
}

// Draw projectile
export function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile, cameraX: number) {
  const dx = p.x - cameraX
  const dy = p.y
  const alpha = Math.min(1, p.life / 10)

  ctx.save()
  ctx.globalAlpha = alpha

  if (p.type === 'arrow') {
    // Arrow
    ctx.fillStyle = p.color
    ctx.save()
    ctx.translate(dx + p.w / 2, dy + p.h / 2)
    ctx.rotate(Math.atan2(p.vy, p.vx))
    ctx.fillRect(-p.w / 2, -1, p.w, 2)
    // Arrowhead
    ctx.beginPath()
    ctx.moveTo(p.w / 2, -3)
    ctx.lineTo(p.w / 2 + 5, 0)
    ctx.lineTo(p.w / 2, 3)
    ctx.fill()
    // Tail feather
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(-p.w / 2 - 3, -2, 4, 1)
    ctx.fillRect(-p.w / 2 - 3, 1, 4, 1)
    ctx.restore()
  } else if (p.type === 'shuriken_proj') {
    // Spinning shuriken
    ctx.save()
    ctx.translate(dx + p.w / 2, dy + p.h / 2)
    ctx.rotate(Date.now() * 0.02)
    ctx.fillStyle = p.color
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2)
      ctx.fillRect(-1, -6, 2, 6)
      ctx.fillRect(-2, -6, 4, 2)
    }
    ctx.fillRect(-2, -2, 4, 4) // center
    ctx.restore()
  } else if (p.type === 'shockwave') {
    // Ground shockwave
    const waveProgress = 1 - p.life / 30
    ctx.fillStyle = `${p.color}${Math.floor((1 - waveProgress) * 180)
      .toString(16)
      .padStart(2, '0')}`
    ctx.fillRect(dx, dy - waveProgress * 8, p.w * (1 + waveProgress * 0.5), p.h)

    // Debris particles
    for (let i = 0; i < 3; i++) {
      const px = dx + Math.random() * p.w
      const py = dy - Math.random() * 15 * waveProgress
      ctx.fillStyle = '#92400e'
      ctx.fillRect(px, py, 3, 3)
    }
  } else if (p.type === 'ultimate') {
    // Ultimate - big flashy effect
    const progress = 1 - p.life / 40
    const glow = ctx.createRadialGradient(
      dx + p.w / 2,
      dy + p.h / 2,
      0,
      dx + p.w / 2,
      dy + p.h / 2,
      Math.max(p.w, p.h) / 2,
    )
    glow.addColorStop(0, p.color)
    glow.addColorStop(0.5, `${p.color}88`)
    glow.addColorStop(1, `${p.color}00`)
    ctx.fillStyle = glow
    ctx.fillRect(dx - 10, dy - 10, p.w + 20, p.h + 20)

    // Inner core
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = (1 - progress) * 0.8
    ctx.fillRect(dx + p.w * 0.2, dy + p.h * 0.2, p.w * 0.6, p.h * 0.6)

    // Energy sparks
    for (let i = 0; i < 4; i++) {
      const angle = Date.now() * 0.01 + (i * Math.PI) / 2
      const sparkX = dx + p.w / 2 + Math.cos(angle) * (p.w / 2 + 5)
      const sparkY = dy + p.h / 2 + Math.sin(angle) * (p.h / 2 + 5)
      ctx.fillStyle = '#fff'
      ctx.fillRect(sparkX - 1, sparkY - 1, 3, 3)
    }
  } else if (p.type === 'dash_slash') {
    // Dash trail
    ctx.fillStyle = `${p.color}${Math.floor(alpha * 150)
      .toString(16)
      .padStart(2, '0')}`
    ctx.fillRect(dx, dy, p.w, p.h)
    ctx.strokeStyle = p.color
    ctx.lineWidth = 2
    ctx.strokeRect(dx, dy, p.w, p.h)
  }

  ctx.restore()
}

// Draw skill bar UI
export function drawSkillBar(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  mp: number,
  maxMp: number,
  cooldowns: Record<SkillType, number>,
) {
  const skills: SkillType[] = ['dash', 'heal', 'ultimate']
  const barW = 120
  const barX = W - barW - 16
  const barY = H - 68

  // Mana bar
  ctx.fillStyle = 'rgba(15,15,35,0.85)'
  ctx.fillRect(barX - 4, barY - 20, barW + 8, 14)
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(barX, barY - 18, barW, 10)
  const mpGrad = ctx.createLinearGradient(barX, 0, barX + barW * (mp / maxMp), 0)
  mpGrad.addColorStop(0, '#3b82f6')
  mpGrad.addColorStop(1, '#818cf8')
  ctx.fillStyle = mpGrad
  ctx.fillRect(barX, barY - 18, barW * (mp / maxMp), 10)
  ctx.fillStyle = '#c7d2fe'
  ctx.font = '8px monospace'
  ctx.fillText(`MP ${Math.floor(mp)}/${maxMp}`, barX + 2, barY - 10)

  // Skill icons
  const skillSize = 32
  const skillGap = 4
  const skillStartX = barX

  skills.forEach((sk, i) => {
    const cfg = SKILLS[sk]
    const sx = skillStartX + i * (skillSize + skillGap)
    const sy = barY

    const onCooldown = cooldowns[sk] > 0
    const hasEnough = mp >= cfg.manaCost

    // BG
    ctx.fillStyle = onCooldown
      ? 'rgba(30,30,30,0.9)'
      : hasEnough
        ? 'rgba(15,15,50,0.9)'
        : 'rgba(40,20,20,0.9)'
    ctx.fillRect(sx, sy, skillSize, skillSize)

    // Border
    ctx.strokeStyle = onCooldown ? '#374151' : hasEnough ? cfg.color : '#7f1d1d'
    ctx.lineWidth = onCooldown ? 1 : 2
    ctx.strokeRect(sx, sy, skillSize, skillSize)

    // Icon
    ctx.font = '14px monospace'
    ctx.textAlign = 'center'
    ctx.globalAlpha = onCooldown ? 0.4 : 1
    ctx.fillText(cfg.icon, sx + skillSize / 2, sy + 20)
    ctx.globalAlpha = 1

    // Key hint
    ctx.fillStyle = hasEnough && !onCooldown ? '#e2e8f0' : '#64748b'
    ctx.font = 'bold 8px monospace'
    ctx.fillText(cfg.key, sx + skillSize / 2, sy - 3)

    // Cooldown overlay
    if (onCooldown) {
      const cdPct = cooldowns[sk] / cfg.cooldown
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(sx, sy, skillSize, skillSize * cdPct)
      ctx.fillStyle = '#94a3b8'
      ctx.font = 'bold 10px monospace'
      ctx.fillText(`${Math.ceil(cooldowns[sk] / 60)}`, sx + skillSize / 2, sy + skillSize / 2 + 4)
    }

    // Mana cost
    ctx.fillStyle = '#60a5fa'
    ctx.font = '7px monospace'
    ctx.fillText(`${cfg.manaCost}`, sx + skillSize / 2, sy + skillSize + 8)

    ctx.textAlign = 'left'
  })
}
