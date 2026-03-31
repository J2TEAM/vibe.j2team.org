// === NPC SYSTEM ===
// NPCs trong Hub Town cho shop, upgrade, quest

import type { EquipmentConfig } from '../types'
import type { MaterialInventory, MaterialType} from './materials'
import { MATERIALS, stonesNeeded, upgradeSuccessRate } from './materials'
import { RARITY_COLORS, RARITY_NAMES, SLOT_ICONS } from './equipment'

export type NPCType = 'merchant' | 'blacksmith' | 'elder' | 'portal'

export interface NPC {
    x: number; y: number
    w: number; h: number
    type: NPCType
    name: string
    icon: string
    color: string
    dialog: string[]
    interacting: boolean
}

export interface NPCConfig {
    name: string; icon: string; color: string
    dialog: string[]
    w: number; h: number
}

export const NPC_CONFIGS: Record<NPCType, NPCConfig> = {
    merchant: {
        name: 'Thương Nhân',
        icon: '🏪', color: '#fbbf24',
        dialog: ['Chào Ninja! Cần mua gì không?', 'Tôi có nguyên liệu nâng cấp tốt nhất!'],
        w: 30, h: 42,
    },
    blacksmith: {
        name: 'Thợ Rèn',
        icon: '🔧', color: '#fb923c',
        dialog: ['Mang trang bị đến đây!', 'Tôi sẽ nâng cấp cho bạn!'],
        w: 32, h: 44,
    },
    elder: {
        name: 'Trưởng Làng',
        icon: '👴', color: '#a78bfa',
        dialog: ['Chào mừng đến Làng Ninja!', 'Hãy ra ngoài tiêu diệt quái vật, bảo vệ làng!'],
        w: 28, h: 42,
    },
    portal: {
        name: 'Cổng Dịch Chuyển',
        icon: '🌀', color: '#818cf8',
        dialog: ['Chọn map để dịch chuyển...'],
        w: 40, h: 50,
    },
}

export function createNPC(type: NPCType, x: number, y: number): NPC {
    const cfg = NPC_CONFIGS[type]
    return {
        x, y, w: cfg.w, h: cfg.h,
        type, name: cfg.name, icon: cfg.icon, color: cfg.color,
        dialog: cfg.dialog, interacting: false,
    }
}

// Draw NPC on canvas
export function drawNPC(ctx: CanvasRenderingContext2D, npc: NPC, cameraX: number, playerX: number) {
    const dx = npc.x - cameraX
    const dy = npc.y

    // Body
    const bobY = Math.sin(Date.now() * 0.002 + npc.x) * 2
    ctx.save()
    ctx.translate(dx, dy + bobY)

    if (npc.type === 'merchant') {
        // Brown robe body
        ctx.fillStyle = '#92400e'
        ctx.fillRect(4, 16, npc.w - 8, npc.h - 16)
        // Head
        ctx.fillStyle = '#fde68a'
        ctx.fillRect(8, 4, npc.w - 16, 14)
        // Hat
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(4, 0, npc.w - 8, 8)
        // Eyes
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(11, 8, 3, 3); ctx.fillRect(npc.w - 14, 8, 3, 3)
        // Bag
        ctx.fillStyle = '#78350f'
        ctx.fillRect(npc.w - 8, 22, 8, 12)
    } else if (npc.type === 'blacksmith') {
        // Muscular body
        ctx.fillStyle = '#4a4a4a'
        ctx.fillRect(4, 16, npc.w - 8, npc.h - 16)
        // Apron
        ctx.fillStyle = '#92400e'
        ctx.fillRect(8, 20, npc.w - 16, npc.h - 22)
        // Head
        ctx.fillStyle = '#fde68a'
        ctx.fillRect(8, 4, npc.w - 16, 14)
        // Eyes
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(12, 8, 3, 3); ctx.fillRect(npc.w - 15, 8, 3, 3)
        // Hammer
        ctx.fillStyle = '#94a3b8'
        ctx.fillRect(npc.w - 4, 12, 3, 16)
        ctx.fillStyle = '#6b7280'
        ctx.fillRect(npc.w - 6, 8, 7, 6)
    } else if (npc.type === 'elder') {
        // Long robe
        ctx.fillStyle = '#6b21a8'
        ctx.fillRect(4, 14, npc.w - 8, npc.h - 14)
        // Head
        ctx.fillStyle = '#fde68a'
        ctx.fillRect(8, 2, npc.w - 16, 14)
        // White beard
        ctx.fillStyle = '#e2e8f0'
        ctx.fillRect(10, 12, npc.w - 20, 8)
        // Eyes
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(11, 6, 2, 3); ctx.fillRect(npc.w - 13, 6, 2, 3)
        // Staff
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(-4, 0, 3, npc.h)
        ctx.fillStyle = '#818cf8'
        ctx.beginPath(); ctx.arc(-2, -2, 4, 0, Math.PI * 2); ctx.fill()
    } else if (npc.type === 'portal') {
        // Portal swirl
        const t = Date.now() * 0.003
        for (let i = 0; i < 3; i++) {
            const alpha = 0.3 + Math.sin(t + i * 2.1) * 0.2
            ctx.fillStyle = `rgba(129,140,248,${alpha})`
            ctx.beginPath()
            ctx.arc(npc.w / 2, npc.h / 2, 20 - i * 4, 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.fillStyle = 'rgba(15,15,35,0.8)'
        ctx.beginPath(); ctx.arc(npc.w / 2, npc.h / 2, 10, 0, Math.PI * 2); ctx.fill()
        // Sparkles
        for (let i = 0; i < 4; i++) {
            const angle = t + i * Math.PI / 2
            const sx = npc.w / 2 + Math.cos(angle) * 22
            const sy = npc.h / 2 + Math.sin(angle) * 22
            ctx.fillStyle = '#c7d2fe'
            ctx.fillRect(sx - 1, sy - 1, 2, 2)
        }
    }

    ctx.restore()

    // Name tag
    const nearPlayer = Math.abs(playerX - npc.x) < 60
    ctx.fillStyle = npc.color
    ctx.font = nearPlayer ? 'bold 9px monospace' : '8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(npc.name, dx + npc.w / 2, dy - 6 + bobY)

    // Interaction hint
    if (nearPlayer) {
        ctx.fillStyle = '#e2e8f0'
        ctx.font = '8px monospace'
        ctx.fillText('▲ Nhấn ↑', dx + npc.w / 2, dy - 16 + bobY)
    }
    ctx.textAlign = 'left'
}

// =====================
// SHOP UI (NPC-based, in-world style)
// =====================
export interface ShopState {
    selectedIdx: number
    buying: boolean
}

export function drawShopUI(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    gold: number,
    materials: MaterialInventory,
) {
    const panelW = 360, panelH = 300
    const px = (W - panelW) / 2, py = H - panelH - 50

    // Semi-transparent panel
    ctx.fillStyle = 'rgba(15,15,35,0.92)'
    ctx.fillRect(px, py, panelW, panelH)
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2
    ctx.strokeRect(px, py, panelW, panelH)

    // Title
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🏪 THƯƠNG NHÂN', px + panelW / 2, py + 22)
    ctx.fillStyle = '#fbbf24'; ctx.font = '11px monospace'
    ctx.fillText(`💰 ${gold} Gold`, px + panelW / 2, py + 40)
    ctx.textAlign = 'left'

    // Items
    const items: { mat: MaterialType; price: number }[] = [
        { mat: 'upgrade_stone', price: 100 },
        { mat: 'refine_dust', price: 250 },
        { mat: 'protection_scroll', price: 500 },
    ]

    items.forEach((item, i) => {
        const cfg = MATERIALS[item.mat]
        const iy = py + 54 + i * 68
        const canAfford = gold >= item.price

        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        ctx.fillRect(px + 12, iy, panelW - 24, 58)
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 1
        ctx.strokeRect(px + 12, iy, panelW - 24, 58)

        // Icon
        ctx.font = '20px monospace'; ctx.textAlign = 'center'
        ctx.fillText(cfg.icon, px + 36, iy + 30)

        // Info
        ctx.textAlign = 'left'
        ctx.fillStyle = cfg.color; ctx.font = 'bold 11px monospace'
        ctx.fillText(cfg.name, px + 56, iy + 18)
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'
        ctx.fillText(cfg.description, px + 56, iy + 32)
        ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'
        ctx.fillText(`Đang có: ×${materials[item.mat]}`, px + 56, iy + 46)

        // Buy button
        const btnX = px + panelW - 88, btnY2 = iy + 14, bw = 70, bh = 28
        ctx.fillStyle = canAfford ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.1)'
        ctx.fillRect(btnX, btnY2, bw, bh)
        ctx.strokeStyle = canAfford ? '#4ade80' : '#ef4444'; ctx.lineWidth = 1
        ctx.strokeRect(btnX, btnY2, bw, bh)
        ctx.fillStyle = canAfford ? '#4ade80' : '#ef4444'; ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`💰${item.price}`, btnX + bw / 2, btnY2 + 12)
        ctx.fillStyle = canAfford ? '#e2e8f0' : '#6b7280'; ctx.font = '8px monospace'
        ctx.fillText(canAfford ? 'CLICK MUA' : 'KHÔNG ĐỦ', btnX + bw / 2, btnY2 + 24)
        ctx.textAlign = 'left'
    })

    // Hint
    ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
    ctx.fillText('Nhấn ↓ hoặc B để đóng', px + panelW / 2, py + panelH - 8)
    ctx.textAlign = 'left'
}

// =====================
// UPGRADE UI (NPC-based, in-world style)
// =====================
export function drawUpgradeUI(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    selectedEquip: EquipmentConfig | null,
    materials: MaterialInventory,
    useRefineDust: boolean,
    useProtection: boolean,
    allItems: EquipmentConfig[],
    upgradeResult: 'none' | 'success' | 'fail',
    upgradeAnim: number,
    selectedIdx: number,
) {
    const panelW = 420, panelH = 360
    const px = (W - panelW) / 2, py = H - panelH - 50

    ctx.fillStyle = 'rgba(15,15,35,0.92)'
    ctx.fillRect(px, py, panelW, panelH)
    ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2
    ctx.strokeRect(px, py, panelW, panelH)

    ctx.fillStyle = '#fb923c'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🔧 THỢ RÈN - NÂNG CẤP', px + panelW / 2, py + 22)
    ctx.textAlign = 'left'

    if (!selectedEquip) {
        // List items to pick
        ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
        ctx.fillText('Chọn trang bị muốn nâng cấp:', px + panelW / 2, py + 44)
        ctx.textAlign = 'left'

        const maxVisible = 7
        const startI = Math.max(0, selectedIdx - 3)
        const endI = Math.min(allItems.length, startI + maxVisible)

        for (let i = startI; i < endI; i++) {
            const eq = allItems[i]!
            const iy = py + 56 + (i - startI) * 40
            const isSelected = i === selectedIdx
            const color = RARITY_COLORS[eq.rarity]

            ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'
            ctx.fillRect(px + 12, iy, panelW - 24, 34)
            ctx.strokeStyle = isSelected ? color : '#2a2a3e'; ctx.lineWidth = isSelected ? 2 : 1
            ctx.strokeRect(px + 12, iy, panelW - 24, 34)

            if (isSelected) {
                ctx.fillStyle = color
                ctx.fillRect(px + 12, iy, 3, 34)
            }

            ctx.font = '14px monospace'; ctx.textAlign = 'center'
            ctx.fillText(eq.icon, px + 30, iy + 22)
            ctx.textAlign = 'left'

            ctx.fillStyle = color; ctx.font = 'bold 10px monospace'
            const lvl = eq.level > 1 ? ` +${eq.level - 1}` : ''
            ctx.fillText(`${eq.name}${lvl}`, px + 44, iy + 14)

            ctx.fillStyle = '#94a3b8'; ctx.font = '8px monospace'
            ctx.fillText(`${RARITY_NAMES[eq.rarity]} | Lv.${eq.level}/10 | ${SLOT_ICONS[eq.slot]}`, px + 44, iy + 26)

            if (eq.level >= 10) {
                ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'right'
                ctx.fillText('MAX', px + panelW - 20, iy + 20); ctx.textAlign = 'left'
            }
        }

        if (allItems.length === 0) {
            ctx.fillStyle = '#4b5563'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
            ctx.fillText('Chưa có trang bị nào!', px + panelW / 2, py + 120)
            ctx.fillText('Hãy đi đánh quái để nhặt đồ', px + panelW / 2, py + 140)
            ctx.textAlign = 'left'
        }

        ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
        ctx.fillText('↑↓ Chọn | Enter Xác nhận | ↓ hoặc B Đóng', px + panelW / 2, py + panelH - 8)
        ctx.textAlign = 'left'
        return
    }

    // === UPGRADE DETAIL VIEW ===
    const eq = selectedEquip
    const color = RARITY_COLORS[eq.rarity]

    // Item header
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(px + 12, py + 38, panelW - 24, 60)
    ctx.strokeStyle = color; ctx.lineWidth = 2
    ctx.strokeRect(px + 12, py + 38, panelW - 24, 60)

    // Anim glow
    if (upgradeAnim > 0) {
        const a = upgradeAnim / 60
        ctx.fillStyle = upgradeResult === 'success' ? `rgba(74,222,128,${a * 0.3})` : `rgba(239,68,68,${a * 0.3})`
        ctx.fillRect(px + 12, py + 38, panelW - 24, 60)
    }

    ctx.font = '22px monospace'; ctx.textAlign = 'center'
    ctx.fillText(eq.icon, px + 36, py + 72)
    ctx.textAlign = 'left'

    ctx.fillStyle = color; ctx.font = 'bold 12px monospace'
    const lvlStr = eq.level > 1 ? ` +${eq.level - 1}` : ''
    ctx.fillText(`${eq.name}${lvlStr}`, px + 56, py + 58)
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'
    ctx.fillText(`${RARITY_NAMES[eq.rarity]} | Lv.${eq.level}/10`, px + 56, py + 72)

    // Stats
    let statStr = ''
    if (eq.stats.hp) statStr += `HP+${eq.stats.hp} `
    if (eq.stats.atk) statStr += `ATK+${eq.stats.atk} `
    if (eq.stats.def) statStr += `DEF+${eq.stats.def} `
    if (eq.stats.speed) statStr += `SPD+${eq.stats.speed.toFixed(1)} `
    if (eq.stats.critChance) statStr += `CRIT+${eq.stats.critChance}% `
    ctx.fillStyle = '#94a3b8'; ctx.font = '8px monospace'
    ctx.fillText(statStr, px + 56, py + 86)

    if (eq.level >= 10) {
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'
        ctx.fillText('⭐ MAX LEVEL ⭐', px + panelW / 2, py + 140)
        ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'
        ctx.fillText('Esc: Quay lại', px + panelW / 2, py + panelH - 8)
        ctx.textAlign = 'left'; return
    }

    // Materials needed
    const needed = stonesNeeded(eq.level)
    const hasStones = materials.upgrade_stone >= needed
    const matY = py + 108

    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px monospace'
    ctx.fillText('Nguyên liệu:', px + 16, matY)

    // Stones
    ctx.fillStyle = hasStones ? '#4ade80' : '#ef4444'; ctx.font = '9px monospace'
    ctx.fillText(`💎 Đá Nâng Cấp: ${materials.upgrade_stone}/${needed}`, px + 16, matY + 18)

    // Success rate
    const rate = upgradeSuccessRate(eq.level, useRefineDust)
    const rateY = matY + 40

    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px monospace'
    ctx.fillText('Tỷ lệ thành công:', px + 16, rateY)

    const barW = panelW - 40, barH = 18, barX = px + 16, barY2 = rateY + 6
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(barX, barY2, barW, barH)
    const rateColor = rate >= 80 ? '#4ade80' : rate >= 50 ? '#fbbf24' : '#ef4444'
    ctx.fillStyle = rateColor; ctx.fillRect(barX, barY2, barW * (rate / 100), barH)
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY2, barW, barH)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
    ctx.fillText(`${rate}%`, barX + barW / 2, barY2 + 14)
    ctx.textAlign = 'left'

    // Options
    const optY = barY2 + 28

    // Refine dust
    const hasDust = materials.refine_dust > 0
    ctx.fillStyle = useRefineDust ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)'
    ctx.fillRect(px + 16, optY, (panelW - 40) / 2 - 4, 26)
    ctx.strokeStyle = useRefineDust ? '#a78bfa' : '#374151'; ctx.lineWidth = 1
    ctx.strokeRect(px + 16, optY, (panelW - 40) / 2 - 4, 26)
    ctx.fillStyle = hasDust ? '#a78bfa' : '#4b5563'; ctx.font = '9px monospace'
    ctx.fillText(`${useRefineDust ? '☑' : '☐'} ✨ +15% (×${materials.refine_dust})`, px + 22, optY + 17)

    // Protection scroll
    const hasScroll = materials.protection_scroll > 0
    const optX2 = px + 16 + (panelW - 40) / 2 + 4
    ctx.fillStyle = useProtection ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)'
    ctx.fillRect(optX2, optY, (panelW - 40) / 2 - 4, 26)
    ctx.strokeStyle = useProtection ? '#fbbf24' : '#374151'
    ctx.strokeRect(optX2, optY, (panelW - 40) / 2 - 4, 26)
    ctx.fillStyle = hasScroll ? '#fbbf24' : '#4b5563'; ctx.font = '9px monospace'
    ctx.fillText(`${useProtection ? '☑' : '☐'} 📜 Bảo vệ (×${materials.protection_scroll})`, optX2 + 6, optY + 17)

    // Upgrade button
    const canDo = hasStones && eq.level < 10
    const btnY = optY + 36
    ctx.fillStyle = canDo ? 'rgba(251,191,36,0.2)' : 'rgba(100,100,100,0.15)'
    ctx.fillRect(px + panelW / 2 - 90, btnY, 180, 34)
    ctx.strokeStyle = canDo ? '#fbbf24' : '#4b5563'; ctx.lineWidth = 2
    ctx.strokeRect(px + panelW / 2 - 90, btnY, 180, 34)
    ctx.fillStyle = canDo ? '#fbbf24' : '#4b5563'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'
    ctx.fillText(canDo ? '⬆ NÂNG CẤP' : 'THIẾU NGUYÊN LIỆU', px + panelW / 2, btnY + 23)
    ctx.textAlign = 'left'

    // Result flash
    if (upgradeAnim > 0) {
        const a = upgradeAnim / 60
        ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'
        if (upgradeResult === 'success') {
            ctx.fillStyle = `rgba(74,222,128,${a})`
            ctx.fillText('✅ THÀNH CÔNG!', px + panelW / 2, btnY + 56)
        } else if (upgradeResult === 'fail') {
            ctx.fillStyle = `rgba(239,68,68,${a})`
            ctx.fillText('❌ THẤT BẠI!', px + panelW / 2, btnY + 56)
        }
        ctx.textAlign = 'left'
    }

    ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
    ctx.fillText('Click nâng cấp | Click ✨/📜 bật/tắt | Esc quay lại', px + panelW / 2, py + panelH - 8)
    ctx.textAlign = 'left'
}
