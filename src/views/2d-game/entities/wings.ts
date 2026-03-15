// === WINGS EQUIPMENT SYSTEM ===
import type { Rarity } from '../types'
import { RARITY_COLORS } from './equipment'

export type WingType = 'wood_wings' | 'angel_wings' | 'dragon_wings' | 'shadow_wings' | 'celestial_wings'

export interface WingConfig {
    id: WingType
    name: string
    icon: string
    rarity: Rarity
    color: string
    color2: string // secondary color for gradient
    description: string
    extraJumps: number      // additional jumps
    floatReduction: number  // gravity reduction (0-1), 0.3 = 30% less gravity
    flyDuration: number     // frames of hover after last jump
}

export const WINGS: Record<WingType, WingConfig> = {
    wood_wings: {
        id: 'wood_wings', name: 'Cánh Gỗ', icon: '🪵', rarity: 'common',
        color: '#92400e', color2: '#78350f',
        description: 'Cánh gỗ thô sơ, nhảy thêm 1 lần',
        extraJumps: 1, floatReduction: 0.1, flyDuration: 0,
    },
    angel_wings: {
        id: 'angel_wings', name: 'Cánh Thiên Thần', icon: '👼', rarity: 'rare',
        color: '#e0f2fe', color2: '#bae6fd',
        description: 'Cánh trắng tinh khiết, lơ lửng nhẹ',
        extraJumps: 1, floatReduction: 0.25, flyDuration: 30,
    },
    dragon_wings: {
        id: 'dragon_wings', name: 'Cánh Rồng', icon: '🐉', rarity: 'epic',
        color: '#dc2626', color2: '#991b1b',
        description: 'Cánh rồng mạnh mẽ, bay cao',
        extraJumps: 2, floatReduction: 0.35, flyDuration: 45,
    },
    shadow_wings: {
        id: 'shadow_wings', name: 'Cánh Bóng Tối', icon: '🦇', rarity: 'epic',
        color: '#6b21a8', color2: '#3b0764',
        description: 'Cánh bóng tối huyền bí',
        extraJumps: 2, floatReduction: 0.3, flyDuration: 60,
    },
    celestial_wings: {
        id: 'celestial_wings', name: 'Cánh Tiên Giới', icon: '🌟', rarity: 'legendary',
        color: '#fbbf24', color2: '#f59e0b',
        description: 'Cánh thần thánh, bay không giới hạn',
        extraJumps: 3, floatReduction: 0.45, flyDuration: 90,
    },
}

const WING_LIST: WingType[] = ['wood_wings', 'angel_wings', 'dragon_wings', 'shadow_wings', 'celestial_wings']

export function getRandomWingDrop(monsterType: string): WingType | null {
    // Wings are rare drops
    const dropChance = monsterType === 'boss' ? 0.25 : monsterType === 'demon' ? 0.04 : 0.01
    if (Math.random() > dropChance) return null

    // Weighted random
    const weights: Record<WingType, number> = {
        wood_wings: 40, angel_wings: 25, dragon_wings: 15,
        shadow_wings: 12, celestial_wings: 8,
    }
    if (monsterType === 'boss') {
        weights.dragon_wings += 15; weights.celestial_wings += 10
    }
    const total = Object.values(weights).reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    for (const wt of WING_LIST) {
        roll -= weights[wt]
        if (roll <= 0) return wt
    }
    return 'wood_wings'
}

// Draw wings on player character — each type has unique shape
export function drawWings(
    ctx: CanvasRenderingContext2D,
    wing: WingConfig,
    w: number, h: number,
    facing: number,
    frame: number,
    isFlying: boolean,
) {
    const t = Date.now()
    const flap = isFlying
        ? Math.sin(t * 0.015) * 0.5
        : Math.sin(t * 0.003 + frame * 0.1) * 0.15
    const yOff = h * 0.3

    if (wing.id === 'wood_wings') {
        // === CÁNH GỖ: 2 thanh gỗ thô, nẹp kim loại ===
        const span = 28
        const drawPlank = (dir: number) => {
            ctx.save()
            ctx.translate(w / 2 + dir * 2, yOff + 2)
            ctx.rotate(dir * (-0.4 - flap * 0.6))
            // Thanh gỗ chính
            ctx.fillStyle = '#92400e'
            ctx.fillRect(dir > 0 ? 0 : -span, -4, span, 8)
            // Vân gỗ
            ctx.fillStyle = '#78350f'
            ctx.fillRect(dir > 0 ? 4 : -span + 4, -2, span - 8, 1)
            ctx.fillRect(dir > 0 ? 6 : -span + 6, 2, span - 10, 1)
            // Nẹp kim loại
            ctx.fillStyle = '#a3a3a3'
            ctx.fillRect(dir > 0 ? 1 : -3, -5, 3, 10)
            ctx.fillRect(dir > 0 ? span - 4 : -span + 1, -3, 3, 6)
            // Mấu gỗ
            ctx.fillStyle = '#713f12'
            ctx.fillRect(dir > 0 ? span / 2 : -span / 2 - 2, -3, 3, 3)
            ctx.restore()
        }
        drawPlank(-1); drawPlank(1)

    } else if (wing.id === 'angel_wings') {
        // === CÁNH THIÊN THẦN: Lông vũ xếp lớp, mềm mại ===
        const span = 34
        const drawFeatherWing = (dir: number) => {
            ctx.save()
            ctx.translate(w / 2 + dir * 2, yOff)
            ctx.rotate(dir * (-0.25 - flap * 0.7))
            // 4 lớp lông vũ
            for (let i = 0; i < 4; i++) {
                const featherLen = span - i * 5
                const fy = i * 3 - 2
                const curve = i * 2
                ctx.fillStyle = i % 2 === 0 ? '#e0f2fe' : '#bae6fd'
                ctx.beginPath()
                ctx.moveTo(0, fy)
                ctx.quadraticCurveTo(dir * featherLen * 0.5, fy - 8 - curve, dir * featherLen, fy - 3 + curve)
                ctx.quadraticCurveTo(dir * featherLen * 0.7, fy + 4, 0, fy + 4)
                ctx.fill()
            }
            // Lông tơ nhỏ rơi (khi bay)
            if (isFlying && Math.random() > 0.92) {
                ctx.fillStyle = 'rgba(224,242,254,0.5)'
                ctx.fillRect(dir * 10 + Math.random() * 10 * dir, 8, 2, 3)
            }
            ctx.restore()
        }
        drawFeatherWing(-1); drawFeatherWing(1)
        // Hào quang nhẹ
        ctx.fillStyle = `rgba(224,242,254,${0.1 + Math.sin(t * 0.003) * 0.05})`
        ctx.beginPath(); ctx.ellipse(w / 2, yOff, span + 4, 12, 0, 0, Math.PI * 2); ctx.fill()

    } else if (wing.id === 'dragon_wings') {
        // === CÁNH RỒNG: Màng da + xương gân, rách mép ===
        const span = 36
        const drawDragonWing = (dir: number) => {
            ctx.save()
            ctx.translate(w / 2 + dir * 2, yOff - 2)
            ctx.rotate(dir * (-0.3 - flap * 0.8))
            // Xương chính (3 xương gân)
            ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2
            for (let i = 0; i < 3; i++) {
                const angle = -0.3 + i * 0.35
                const boneLen = span - i * 6
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(dir * Math.cos(angle) * boneLen, -Math.sin(angle) * boneLen)
                ctx.stroke()
            }
            // Màng da giữa xương
            ctx.fillStyle = 'rgba(220,38,38,0.7)'
            ctx.beginPath()
            ctx.moveTo(0, 0)
            const b1x = dir * Math.cos(-0.3) * span
            const b1y = -Math.sin(-0.3) * span
            const b3x = dir * Math.cos(0.4) * (span - 12)
            const b3y = -Math.sin(0.4) * (span - 12)
            ctx.lineTo(b1x, b1y)
            ctx.quadraticCurveTo(dir * span * 0.8, -span * 0.2, b3x, b3y)
            ctx.lineTo(0, 4)
            ctx.fill()
            // Màng da trong
            ctx.fillStyle = 'rgba(153,27,27,0.5)'
            ctx.beginPath()
            ctx.moveTo(0, 1)
            ctx.lineTo(b1x * 0.6, b1y * 0.6)
            ctx.quadraticCurveTo(dir * span * 0.4, -span * 0.1, b3x * 0.7, b3y * 0.7)
            ctx.lineTo(0, 3)
            ctx.fill()
            // Móng vuốt ở đầu xương
            ctx.fillStyle = '#1a1a2e'
            ctx.fillRect(b1x - 1, b1y - 1, 3, 3)
            ctx.restore()
        }
        drawDragonWing(-1); drawDragonWing(1)

    } else if (wing.id === 'shadow_wings') {
        // === CÁNH BÓNG TỐI: Khói sương nhấp nháy, mảnh bóng tối bay ===
        const span = 34
        const drawShadowWing = (dir: number) => {
            ctx.save()
            ctx.translate(w / 2 + dir * 1, yOff)
            // Nhiều lớp khói mờ dần
            for (let layer = 3; layer >= 0; layer--) {
                const layerSpan = span - layer * 4
                const layerAlpha = 0.15 + layer * 0.12 + Math.sin(t * 0.004 + layer) * 0.06
                const waveOff = Math.sin(t * 0.003 + layer * 0.7) * 3
                ctx.fillStyle = `rgba(107,33,168,${layerAlpha})`
                ctx.beginPath()
                ctx.moveTo(0, -2)
                ctx.quadraticCurveTo(
                    dir * layerSpan * 0.5, -layerSpan * 0.6 + waveOff - flap * 10,
                    dir * layerSpan, -layerSpan * 0.1 + waveOff
                )
                ctx.quadraticCurveTo(
                    dir * layerSpan * 0.6, layerSpan * 0.2 + waveOff,
                    0, 6
                )
                ctx.fill()
            }
            ctx.restore()
        }
        drawShadowWing(-1); drawShadowWing(1)
        // Mảnh bóng tối bay xung quanh
        for (let i = 0; i < 5; i++) {
            const sx = w / 2 + Math.sin(t * 0.003 + i * 1.3) * (span + 2)
            const sy = yOff + Math.cos(t * 0.004 + i * 1.7) * 14
            const sa = 0.3 + Math.sin(t * 0.005 + i) * 0.2
            ctx.fillStyle = `rgba(59,7,100,${sa})`
            ctx.fillRect(sx - 1, sy - 1, 3, 3)
        }

    } else if (wing.id === 'celestial_wings') {
        // === CÁNH TIÊN GIỚI: Hào quang năng lượng, tia sáng, ngôi sao xoay ===
        const span = 38
        const drawCelestialWing = (dir: number) => {
            ctx.save()
            ctx.translate(w / 2 + dir * 2, yOff - 2)
            ctx.rotate(dir * (-0.2 - flap * 0.6))
            // Vầng hào quang chính
            const grad = ctx.createRadialGradient(0, 0, 0, dir * span * 0.5, -span * 0.2, span)
            grad.addColorStop(0, 'rgba(251,191,36,0.6)')
            grad.addColorStop(0.5, 'rgba(245,158,11,0.3)')
            grad.addColorStop(1, 'rgba(251,191,36,0)')
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.moveTo(0, -2)
            ctx.quadraticCurveTo(dir * span * 0.4, -span * 0.7 - flap * 6, dir * span, -span * 0.15)
            ctx.quadraticCurveTo(dir * span * 0.6, span * 0.3, 0, 6)
            ctx.fill()
            // Tia sáng (energy streaks)
            ctx.strokeStyle = `rgba(251,191,36,${0.4 + Math.sin(t * 0.006) * 0.2})`
            ctx.lineWidth = 1.5
            for (let i = 0; i < 3; i++) {
                const angle = -0.2 + i * 0.3
                const rayLen = span * (0.7 + Math.sin(t * 0.005 + i) * 0.2)
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(dir * Math.cos(angle) * rayLen, -Math.sin(angle) * rayLen)
                ctx.stroke()
            }
            ctx.restore()
        }
        drawCelestialWing(-1); drawCelestialWing(1)
        // Ngôi sao xoay quanh
        const starT = t * 0.003
        for (let i = 0; i < 6; i++) {
            const sx = w / 2 + Math.cos(starT + i * 1.05) * (span + 4)
            const sy = yOff + Math.sin(starT + i * 1.05) * 16
            const sa = 0.5 + Math.sin(starT + i * 2) * 0.3
            ctx.fillStyle = `rgba(251,191,36,${sa})`
            // Hình ngôi sao nhỏ
            ctx.beginPath()
            ctx.moveTo(sx, sy - 2); ctx.lineTo(sx + 1, sy - 1)
            ctx.lineTo(sx + 2, sy); ctx.lineTo(sx + 1, sy + 1)
            ctx.lineTo(sx, sy + 2); ctx.lineTo(sx - 1, sy + 1)
            ctx.lineTo(sx - 2, sy); ctx.lineTo(sx - 1, sy - 1)
            ctx.fill()
        }
        // Hào quang sáng quanh nhân vật
        ctx.fillStyle = `rgba(251,191,36,${0.06 + Math.sin(t * 0.004) * 0.03})`
        ctx.beginPath(); ctx.ellipse(w / 2, yOff, span + 8, 18, 0, 0, Math.PI * 2); ctx.fill()
    }
}

// Draw wing drop on ground
export function drawWingDrop(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, wing: WingConfig, cameraX: number, life: number,
) {
    const dx = x - cameraX
    const bob = Math.sin(Date.now() * 0.005 + x) * 3
    const color = RARITY_COLORS[wing.rarity]

    // Glow
    const alpha = 0.4 + Math.sin(Date.now() * 0.004) * 0.2
    ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
    ctx.beginPath(); ctx.arc(dx + 10, y + 10 + bob, 16, 0, Math.PI * 2); ctx.fill()

    ctx.fillStyle = 'rgba(15,15,35,0.9)'
    ctx.beginPath(); ctx.arc(dx + 10, y + 10 + bob, 11, 0, Math.PI * 2); ctx.fill()

    ctx.font = '14px monospace'; ctx.textAlign = 'center'
    ctx.fillText(wing.icon, dx + 10, y + 14 + bob)

    if (life < 120 && Math.floor(Date.now() / 200) % 2 === 0) { ctx.textAlign = 'left'; return }

    ctx.fillStyle = color; ctx.font = 'bold 8px monospace'
    ctx.fillText(wing.name, dx + 10, y - 6 + bob)
    ctx.textAlign = 'left'
}
