import type { WeaponType, WeaponConfig, WeaponDrop } from '../types'

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  sword: {
    name: 'Kiếm',
    damage: 15,
    range: 30,
    speed: 0,
    color: '#94a3b8',
    icon: '🗡️',
    description: 'Kiếm cơ bản, cân bằng',
  },
  dual_swords: {
    name: 'Song Kiếm',
    damage: 12,
    range: 26,
    speed: 8,
    color: '#60a5fa',
    icon: '⚔️',
    description: 'Đánh nhanh, sát thương mỗi hit thấp',
  },
  axe: {
    name: 'Rìu Chiến',
    damage: 28,
    range: 28,
    speed: -8,
    color: '#a78bfa',
    icon: '🪓',
    description: 'Sát thương cao, tốc độ chậm',
  },
  bow: {
    name: 'Cung',
    damage: 18,
    range: 80,
    speed: -4,
    color: '#fb923c',
    icon: '🏹',
    description: 'Tầm xa, sát thương trung bình',
  },
  shuriken: {
    name: 'Phi Tiêu',
    damage: 10,
    range: 60,
    speed: 12,
    color: '#5eead4',
    icon: '✦',
    description: 'Tầm xa, cực nhanh, sát thương thấp',
  },
  hammer: {
    name: 'Búa Sấm',
    damage: 35,
    range: 24,
    speed: -12,
    color: '#fbbf24',
    icon: '🔨',
    description: 'Sát thương cực cao, rất chậm',
  },
}

const WEAPON_LIST: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']

export function getRandomWeapon(): WeaponType {
  // Don't drop basic sword, only special weapons
  const specials = WEAPON_LIST.filter((w) => w !== 'sword')
  return specials[Math.floor(Math.random() * specials.length)]!
}

export function createWeaponDrop(x: number, y: number, weapon?: WeaponType): WeaponDrop {
  return {
    x,
    y,
    vy: -3,
    w: 20,
    h: 20,
    weapon: weapon || getRandomWeapon(),
    life: 600, // 10 seconds
    onGround: false,
    animFrame: 0,
  }
}

export function drawWeaponDrop(ctx: CanvasRenderingContext2D, drop: WeaponDrop, cameraX: number) {
  const dx = drop.x - cameraX
  const dy = drop.y
  const cfg = WEAPONS[drop.weapon]

  // Floating bob
  const bob = Math.sin(Date.now() * 0.005 + drop.x) * 3

  // Glow circle
  const alpha = 0.3 + Math.sin(Date.now() * 0.004) * 0.15
  ctx.fillStyle = `${cfg.color}${Math.floor(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`
  ctx.beginPath()
  ctx.arc(dx + drop.w / 2, dy + drop.h / 2 + bob, 14, 0, Math.PI * 2)
  ctx.fill()

  // Weapon icon bg
  ctx.fillStyle = 'rgba(15,15,35,0.8)'
  ctx.beginPath()
  ctx.arc(dx + drop.w / 2, dy + drop.h / 2 + bob, 10, 0, Math.PI * 2)
  ctx.fill()

  // Weapon shape
  ctx.fillStyle = cfg.color
  const cx = dx + drop.w / 2
  const cy = dy + drop.h / 2 + bob

  if (drop.weapon === 'sword' || drop.weapon === 'dual_swords') {
    ctx.fillRect(cx - 1, cy - 8, 2, 12)
    ctx.fillRect(cx - 4, cy - 1, 8, 2)
    if (drop.weapon === 'dual_swords') {
      ctx.fillRect(cx + 3, cy - 7, 2, 10)
    }
  } else if (drop.weapon === 'axe') {
    ctx.fillRect(cx - 1, cy - 7, 2, 14)
    ctx.fillRect(cx + 1, cy - 6, 5, 6)
  } else if (drop.weapon === 'bow') {
    ctx.beginPath()
    ctx.arc(cx, cy, 7, -1.2, 1.2)
    ctx.lineWidth = 2
    ctx.strokeStyle = cfg.color
    ctx.stroke()
    ctx.fillRect(cx, cy - 6, 1, 12)
  } else if (drop.weapon === 'shuriken') {
    const t = Date.now() * 0.005
    for (let i = 0; i < 4; i++) {
      const a = t + (i * Math.PI) / 2
      ctx.fillRect(cx + Math.cos(a) * 5 - 1, cy + Math.sin(a) * 5 - 1, 3, 3)
    }
    ctx.fillRect(cx - 1, cy - 1, 3, 3)
  } else if (drop.weapon === 'hammer') {
    ctx.fillRect(cx - 1, cy - 2, 2, 10)
    ctx.fillRect(cx - 5, cy - 7, 10, 6)
  }

  // Blink when about to expire
  if (drop.life < 120 && Math.floor(Date.now() / 200) % 2 === 0) return

  // Name label
  ctx.fillStyle = cfg.color
  ctx.font = 'bold 8px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(cfg.name, dx + drop.w / 2, dy - 4 + bob)
  ctx.textAlign = 'left'
}

export function drawInventory(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  inventory: WeaponType[],
  equipped: WeaponType,
  selectedIdx: number,
) {
  // Overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)'
  ctx.fillRect(0, 0, W, H)

  const panelW = 420
  const panelH = 320
  const px = (W - panelW) / 2
  const py = (H - panelH) / 2

  // Panel bg
  ctx.fillStyle = 'rgba(15,15,35,0.95)'
  ctx.fillRect(px, py, panelW, panelH)
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 2
  ctx.strokeRect(px, py, panelW, panelH)

  // Title
  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('🎒 TÚI ĐỒ', px + panelW / 2, py + 24)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '10px monospace'
  ctx.fillText('Nhấn 1-6 để trang bị | B đóng', px + panelW / 2, py + 40)
  ctx.textAlign = 'left'

  // Weapon slots
  const slotSize = 56
  const slotGap = 8
  const startX = px + 20
  const startY = py + 56

  const allWeapons: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']

  allWeapons.forEach((wt, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const sx = startX + col * (slotSize + slotGap)
    const sy = startY + row * (slotSize + slotGap + 20)

    const owned = inventory.includes(wt)
    const isEquipped = equipped === wt
    const isSelected = selectedIdx === i

    // Slot bg
    ctx.fillStyle = isEquipped
      ? 'rgba(251,191,36,0.2)'
      : owned
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.02)'
    ctx.fillRect(sx, sy, slotSize, slotSize)

    // Border
    ctx.strokeStyle = isEquipped
      ? '#fbbf24'
      : isSelected
        ? '#e2e8f0'
        : owned
          ? '#4b5563'
          : '#1f2937'
    ctx.lineWidth = isEquipped ? 2 : 1
    ctx.strokeRect(sx, sy, slotSize, slotSize)

    const cfg = WEAPONS[wt]

    if (owned) {
      // Weapon icon
      ctx.fillStyle = cfg.color
      ctx.font = '20px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(cfg.icon, sx + slotSize / 2, sy + 28)

      // Name
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '8px monospace'
      ctx.fillText(cfg.name, sx + slotSize / 2, sy + slotSize - 6)

      // Equipped badge
      if (isEquipped) {
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 7px monospace'
        ctx.fillText('EQUIPPED', sx + slotSize / 2, sy + slotSize + 10)
      }

      // Key hint
      ctx.fillStyle = '#64748b'
      ctx.font = '9px monospace'
      ctx.fillText(`[${i + 1}]`, sx + slotSize / 2, sy - 4)
      ctx.textAlign = 'left'
    } else {
      // Locked
      ctx.fillStyle = '#374151'
      ctx.font = '20px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('🔒', sx + slotSize / 2, sy + 28)
      ctx.fillStyle = '#4b5563'
      ctx.font = '7px monospace'
      ctx.fillText('Chưa có', sx + slotSize / 2, sy + slotSize - 6)
      ctx.textAlign = 'left'
    }
  })

  // Selected weapon details
  if (selectedIdx >= 0 && selectedIdx < allWeapons.length) {
    const wt = allWeapons[selectedIdx]!
    const cfg = WEAPONS[wt]
    const detX = px + 220
    const detY = startY + 8

    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(`${cfg.icon} ${cfg.name}`, detX, detY + 12)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px monospace'
    ctx.fillText(cfg.description, detX, detY + 30)

    // Stats
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`⚔ DMG: ${cfg.damage}`, detX, detY + 52)
    ctx.fillStyle = '#3b82f6'
    ctx.fillText(`↔ Range: ${cfg.range}`, detX, detY + 68)
    ctx.fillStyle = '#4ade80'
    ctx.fillText(`⚡ Speed: ${cfg.speed > 0 ? '+' : ''}${cfg.speed}`, detX, detY + 84)

    // Damage bar
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(detX, detY + 94, 150, 6)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(detX, detY + 94, Math.min(150, cfg.damage * 4.3), 6)
    // Range bar
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(detX, detY + 106, 150, 6)
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(detX, detY + 106, Math.min(150, cfg.range * 1.87), 6)
  }
}
