// === SHOP & UPGRADE UI ===
// Tách logic vẽ UI cho Shop và Nâng Cấp ra khỏi index.vue

import type { EquipmentConfig, EquipSlot } from '../types'
import type { MaterialInventory, ShopItem } from '../entities/materials'
import type { WingType, WingConfig } from '../entities/wings'
import { MATERIALS, stonesNeeded, upgradeSuccessRate, drawMaterialSlot } from '../entities/materials'
import { RARITY_COLORS, RARITY_NAMES, SLOT_ICONS } from '../entities/equipment'


// ===========================
// SHOP UI
// ===========================
export function drawShopPanel(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    gold: number,
    materials: MaterialInventory,
    shopItems: ShopItem[],
    selectedIdx: number,
) {
    const panelW = 480, panelH = 380
    const px = (W - panelW) / 2, py = (H - panelH) / 2

    // Background
    ctx.fillStyle = 'rgba(15,15,35,0.97)'
    ctx.fillRect(px, py, panelW, panelH)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    ctx.strokeRect(px, py, panelW, panelH)

    // Title
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🏪 CỬA HÀNG', px + panelW / 2, py + 28)

    // Gold display
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 12px monospace'
    ctx.fillText(`💰 ${gold} Gold`, px + panelW / 2, py + 48)
    ctx.textAlign = 'left'

    // Shop items
    const itemH = 72, gap = 8
    const startY = py + 64

    shopItems.forEach((item, i) => {
        const mat = MATERIALS[item.material]
        const iy = startY + i * (itemH + gap)
        const selected = selectedIdx === i
        const canAfford = gold >= item.price

        // Item bg
        ctx.fillStyle = selected ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)'
        ctx.fillRect(px + 16, iy, panelW - 32, itemH)
        ctx.strokeStyle = selected ? '#fbbf24' : '#374151'
        ctx.lineWidth = selected ? 2 : 1
        ctx.strokeRect(px + 16, iy, panelW - 32, itemH)

        // Icon
        ctx.font = '24px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(mat.icon, px + 46, iy + 36)

        // Name & desc
        ctx.textAlign = 'left'
        ctx.fillStyle = mat.color
        ctx.font = 'bold 12px monospace'
        ctx.fillText(mat.name, px + 72, iy + 22)

        ctx.fillStyle = '#94a3b8'
        ctx.font = '9px monospace'
        ctx.fillText(mat.description, px + 72, iy + 38)

        // Current count
        ctx.fillStyle = '#64748b'
        ctx.font = '9px monospace'
        ctx.fillText(`Đang có: ×${materials[item.material]}`, px + 72, iy + 54)

        // Price & buy button
        ctx.textAlign = 'right'
        ctx.fillStyle = canAfford ? '#fbbf24' : '#ef4444'
        ctx.font = 'bold 11px monospace'
        ctx.fillText(`💰 ${item.price}`, px + panelW - 80, iy + 26)

        // Buy button
        if (selected) {
            const btnX = px + panelW - 76, btnY = iy + 36, bw = 56, bh = 22
            ctx.fillStyle = canAfford ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'
            ctx.fillRect(btnX, btnY, bw, bh)
            ctx.strokeStyle = canAfford ? '#4ade80' : '#ef4444'
            ctx.lineWidth = 1
            ctx.strokeRect(btnX, btnY, bw, bh)
            ctx.fillStyle = canAfford ? '#4ade80' : '#ef4444'
            ctx.font = 'bold 10px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(canAfford ? 'MUA' : 'THIẾU', btnX + bw / 2, btnY + 15)
        }
        ctx.textAlign = 'left'
    })

    // Controls hint
    ctx.fillStyle = '#64748b'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('↑↓ Chọn | Enter Mua | Tab Đổi tab', px + panelW / 2, py + panelH - 12)
    ctx.textAlign = 'left'
}

// ===========================
// UPGRADE UI
// ===========================
export function drawUpgradePanel(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    selectedEquip: EquipmentConfig | null,
    materials: MaterialInventory,
    useRefineDust: boolean,
    useProtection: boolean,
    equipInventory: EquipmentConfig[],
    equippedItems: Partial<Record<EquipSlot, EquipmentConfig | null>>,
    equippedWing: WingConfig | null,
    ownedWings: WingType[],
    upgradeResult: 'none' | 'success' | 'fail',
    upgradeAnim: number,
) {
    const panelW = 500, panelH = 420
    const px = (W - panelW) / 2, py = (H - panelH) / 2

    ctx.fillStyle = 'rgba(15,15,35,0.97)'
    ctx.fillRect(px, py, panelW, panelH)
    ctx.strokeStyle = '#fb923c'
    ctx.lineWidth = 2
    ctx.strokeRect(px, py, panelW, panelH)

    ctx.fillStyle = '#fb923c'
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🔧 NÂNG CẤP TRANG BỊ', px + panelW / 2, py + 28)
    ctx.textAlign = 'left'

    if (!selectedEquip) {
        // Show list of all equipment to select
        ctx.fillStyle = '#94a3b8'
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Chọn vật phẩm muốn nâng cấp (click hoặc dùng ↑↓)', px + panelW / 2, py + 56)
        ctx.textAlign = 'left'

        // List equipped items first
        let row = 0
        const itemH = 36, startY = py + 72, listX = px + 16, listW = panelW - 32

        // Section: Equipped
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 10px monospace'
        ctx.fillText('— Đang trang bị —', listX, startY + row * (itemH + 4) - 4)
        row++

        const slots: EquipSlot[] = ['head', 'chest', 'legs', 'gloves', 'boots', 'accessory']
        for (const slot of slots) {
            const eq = equippedItems[slot]
            if (!eq) continue
            drawEquipListItem(ctx, eq, listX, startY + row * (itemH + 4), listW, itemH, false)
            row++
        }

        // Wing
        if (equippedWing) {
            ctx.fillStyle = RARITY_COLORS[equippedWing.rarity]
            ctx.font = '10px monospace'
            ctx.fillText(`${equippedWing.icon} ${equippedWing.name} (Cánh)`, listX + 4, startY + row * (itemH + 4) + 14)
            row++
        }

        // Section: Inventory
        if (equipInventory.length > 0) {
            row++
            ctx.fillStyle = '#94a3b8'
            ctx.font = 'bold 10px monospace'
            ctx.fillText('— Trong kho —', listX, startY + row * (itemH + 4) - 4)
            row++

            for (const eq of equipInventory.slice(0, 6)) {
                drawEquipListItem(ctx, eq, listX, startY + row * (itemH + 4), listW, itemH, false)
                row++
            }
            if (equipInventory.length > 6) {
                ctx.fillStyle = '#64748b'
                ctx.font = '9px monospace'
                ctx.fillText(`... và ${equipInventory.length - 6} vật phẩm nữa`, listX + 4, startY + row * (itemH + 4) + 14)
            }
        }
        return
    }

    // === SELECTED ITEM UPGRADE VIEW ===
    const eq = selectedEquip
    const rarityColor = RARITY_COLORS[eq.rarity]
    const maxLevel = 10

    // Item display (top area)
    const itemX = px + 20, itemY = py + 48
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(itemX, itemY, panelW - 40, 80)
    ctx.strokeStyle = rarityColor
    ctx.lineWidth = 2
    ctx.strokeRect(itemX, itemY, panelW - 40, 80)

    // Upgrade animation glow
    if (upgradeAnim > 0) {
        const glowAlpha = upgradeAnim / 60
        ctx.fillStyle = upgradeResult === 'success'
            ? `rgba(74,222,128,${glowAlpha * 0.3})`
            : `rgba(239,68,68,${glowAlpha * 0.3})`
        ctx.fillRect(itemX, itemY, panelW - 40, 80)
    }

    // Icon
    ctx.font = '28px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(eq.icon, itemX + 36, itemY + 46)

    // Name + level
    ctx.textAlign = 'left'
    ctx.fillStyle = rarityColor
    ctx.font = 'bold 14px monospace'
    const lvlStr = eq.level > 1 ? ` +${eq.level - 1}` : ''
    ctx.fillText(`${eq.name}${lvlStr}`, itemX + 70, itemY + 24)

    // Rarity
    ctx.fillStyle = rarityColor
    ctx.font = '10px monospace'
    ctx.fillText(`${RARITY_NAMES[eq.rarity]} | Lv.${eq.level}/${maxLevel}`, itemX + 70, itemY + 40)

    // Current stats
    ctx.fillStyle = '#94a3b8'
    ctx.font = '9px monospace'
    let statStr = ''
    if (eq.stats.hp) statStr += `HP+${eq.stats.hp} `
    if (eq.stats.atk) statStr += `ATK+${eq.stats.atk} `
    if (eq.stats.def) statStr += `DEF+${eq.stats.def} `
    if (eq.stats.speed) statStr += `SPD+${eq.stats.speed.toFixed(1)} `
    if (eq.stats.critChance) statStr += `CRIT+${eq.stats.critChance}% `
    ctx.fillText(statStr, itemX + 70, itemY + 56)

    // Preview next level stats
    if (eq.level < maxLevel) {
        const boost = 1 + eq.level * 0.15
        ctx.fillStyle = '#4ade80'
        ctx.font = '9px monospace'
        let nextStr = '→ '
        if (eq.stats.hp) nextStr += `HP+${Math.round(eq.stats.hp * boost / (1 + (eq.level - 1) * 0.15))} `
        if (eq.stats.atk) nextStr += `ATK+${Math.round(eq.stats.atk * boost / (1 + (eq.level - 1) * 0.15))} `
        if (eq.stats.def) nextStr += `DEF+${Math.round(eq.stats.def * boost / (1 + (eq.level - 1) * 0.15))} `
        ctx.fillText(nextStr, itemX + 70, itemY + 70)
    } else {
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 10px monospace'
        ctx.fillText('⭐ MAX LEVEL ⭐', itemX + 70, itemY + 70)
    }

    // === MATERIALS NEEDED ===
    const matY = itemY + 100
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 11px monospace'
    ctx.fillText('Nguyên liệu cần:', itemX, matY)

    const stoneCount = stonesNeeded(eq.level)
    const hasStones = materials.upgrade_stone >= stoneCount

    // Stone slots
    drawMaterialSlot(ctx, 'upgrade_stone', materials.upgrade_stone, itemX, matY + 16, 56, 48, false)
    ctx.fillStyle = hasStones ? '#4ade80' : '#ef4444'
    ctx.font = '9px monospace'
    ctx.fillText(`Cần ×${stoneCount}`, itemX, matY + 76)

    // Success rate
    const rate = upgradeSuccessRate(eq.level, useRefineDust)
    const rateY = matY + 100

    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 11px monospace'
    ctx.fillText('Tỷ lệ thành công:', itemX, rateY)

    // Rate bar
    const barW = 200, barH = 16, barX = itemX, barY = rateY + 8
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(barX, barY, barW, barH)
    const rateColor = rate >= 80 ? '#4ade80' : rate >= 50 ? '#fbbf24' : '#ef4444'
    ctx.fillStyle = rateColor
    ctx.fillRect(barX, barY, barW * (rate / 100), barH)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${rate}%`, barX + barW / 2, barY + 13)
    ctx.textAlign = 'left'

    // Options: Refine Dust & Protection Scroll
    const optY = barY + 30

    // Refine dust checkbox
    ctx.fillStyle = useRefineDust ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)'
    ctx.fillRect(itemX, optY, 200, 28)
    ctx.strokeStyle = useRefineDust ? '#a78bfa' : '#374151'
    ctx.lineWidth = 1
    ctx.strokeRect(itemX, optY, 200, 28)
    ctx.fillStyle = materials.refine_dust > 0 ? '#a78bfa' : '#4b5563'
    ctx.font = '10px monospace'
    ctx.fillText(`${useRefineDust ? '☑' : '☐'} ✨ Bụi Tinh Luyện (+15%) ×${materials.refine_dust}`, itemX + 6, optY + 18)

    // Protection scroll checkbox
    ctx.fillStyle = useProtection ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)'
    ctx.fillRect(itemX + 210, optY, 200, 28)
    ctx.strokeStyle = useProtection ? '#fbbf24' : '#374151'
    ctx.strokeRect(itemX + 210, optY, 200, 28)
    ctx.fillStyle = materials.protection_scroll > 0 ? '#fbbf24' : '#4b5563'
    ctx.fillText(`${useProtection ? '☑' : '☐'} 📜 Cuộn Bảo Vệ ×${materials.protection_scroll}`, itemX + 216, optY + 18)

    // Upgrade button
    const btnY = optY + 42
    const canUpgrade = eq.level < maxLevel && hasStones
    ctx.fillStyle = canUpgrade ? 'rgba(251,191,36,0.2)' : 'rgba(100,100,100,0.2)'
    ctx.fillRect(px + panelW / 2 - 80, btnY, 160, 36)
    ctx.strokeStyle = canUpgrade ? '#fbbf24' : '#4b5563'
    ctx.lineWidth = 2
    ctx.strokeRect(px + panelW / 2 - 80, btnY, 160, 36)
    ctx.fillStyle = canUpgrade ? '#fbbf24' : '#4b5563'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(canUpgrade ? '⬆ NÂNG CẤP' : eq.level >= maxLevel ? 'MAX LEVEL' : 'THIẾU NGL', px + panelW / 2, btnY + 24)
    ctx.textAlign = 'left'

    // Result flash
    if (upgradeAnim > 0) {
        ctx.font = 'bold 20px monospace'
        ctx.textAlign = 'center'
        const resultY = btnY + 60
        if (upgradeResult === 'success') {
            ctx.fillStyle = `rgba(74,222,128,${upgradeAnim / 60})`
            ctx.fillText('✅ THÀNH CÔNG!', px + panelW / 2, resultY)
        } else if (upgradeResult === 'fail') {
            ctx.fillStyle = `rgba(239,68,68,${upgradeAnim / 60})`
            ctx.fillText('❌ THẤT BẠI!', px + panelW / 2, resultY)
        }
        ctx.textAlign = 'left'
    }

    // Controls
    ctx.fillStyle = '#64748b'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Enter: Nâng cấp | D/F: Bật/tắt Bụi/Cuộn | Esc: Quay lại', px + panelW / 2, py + panelH - 12)
    ctx.textAlign = 'left'
}

function drawEquipListItem(
    ctx: CanvasRenderingContext2D,
    eq: EquipmentConfig,
    x: number, y: number, w: number, h: number,
    selected: boolean,
) {
    const color = RARITY_COLORS[eq.rarity]
    ctx.fillStyle = selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = selected ? color : '#2a2a3e'
    ctx.lineWidth = selected ? 2 : 1
    ctx.strokeRect(x, y, w, h)

    ctx.font = '14px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(eq.icon, x + 18, y + h / 2 + 5)

    ctx.textAlign = 'left'
    ctx.fillStyle = color
    ctx.font = 'bold 10px monospace'
    const lvl = eq.level > 1 ? ` +${eq.level - 1}` : ''
    ctx.fillText(`${eq.name}${lvl}`, x + 36, y + 14)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '8px monospace'
    ctx.fillText(`${RARITY_NAMES[eq.rarity]} | Lv.${eq.level}`, x + 36, y + 26)

    // Slot icon
    ctx.fillStyle = '#64748b'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(SLOT_ICONS[eq.slot], x + w - 8, y + h / 2 + 4)
    ctx.textAlign = 'left'
}

// Draw gold indicator on HUD
export function drawGoldHUD(ctx: CanvasRenderingContext2D, gold: number, x: number, y: number) {
    ctx.fillStyle = 'rgba(15,15,35,0.85)'
    ctx.fillRect(x, y, 100, 20)
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, 100, 20)
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 10px monospace'
    ctx.fillText(`💰 ${gold}`, x + 6, y + 14)
}

// Draw wing indicator on HUD
export function drawWingHUD(ctx: CanvasRenderingContext2D, wing: WingConfig | null, x: number, y: number) {
    if (!wing) return
    ctx.fillStyle = 'rgba(15,15,35,0.85)'
    ctx.fillRect(x, y, 100, 20)
    ctx.strokeStyle = RARITY_COLORS[wing.rarity]
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, 100, 20)
    ctx.fillStyle = RARITY_COLORS[wing.rarity]
    ctx.font = 'bold 9px monospace'
    ctx.fillText(`${wing.icon} ${wing.name}`, x + 6, y + 14)
}
