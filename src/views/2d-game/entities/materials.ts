// === UPGRADE MATERIALS & GOLD SYSTEM ===

export type MaterialType = 'upgrade_stone' | 'refine_dust' | 'protection_scroll'

export interface MaterialConfig {
    id: MaterialType
    name: string
    icon: string
    color: string
    description: string
    shopPrice: number // gold cost in shop
}

export const MATERIALS: Record<MaterialType, MaterialConfig> = {
    upgrade_stone: {
        id: 'upgrade_stone', name: 'Đá Nâng Cấp', icon: '💎',
        color: '#60a5fa', description: 'Nguyên liệu cơ bản để nâng cấp trang bị',
        shopPrice: 100,
    },
    refine_dust: {
        id: 'refine_dust', name: 'Bụi Tinh Luyện', icon: '✨',
        color: '#a78bfa', description: 'Tăng 15% tỷ lệ thành công nâng cấp',
        shopPrice: 250,
    },
    protection_scroll: {
        id: 'protection_scroll', name: 'Cuộn Bảo Vệ', icon: '📜',
        color: '#fbbf24', description: 'Bảo vệ trang bị không giảm cấp khi thất bại',
        shopPrice: 500,
    },
}

export interface MaterialInventory {
    upgrade_stone: number
    refine_dust: number
    protection_scroll: number
}

// How many upgrade stones needed per level
export function stonesNeeded(currentLevel: number): number {
    if (currentLevel <= 2) return 2
    if (currentLevel <= 4) return 3
    if (currentLevel <= 6) return 5
    if (currentLevel <= 8) return 8
    return 12
}

// Base success rate per level
export function upgradeSuccessRate(currentLevel: number, useRefineDust: boolean): number {
    const baseRates: Record<number, number> = {
        1: 100, 2: 95, 3: 85, 4: 75, 5: 65,
        6: 55, 7: 45, 8: 35, 9: 25,
    }
    let rate = baseRates[currentLevel] ?? 20
    if (useRefineDust) rate = Math.min(100, rate + 15)
    return rate
}

// Roll upgrade success
export function rollUpgradeSuccess(currentLevel: number, useRefineDust: boolean): boolean {
    const rate = upgradeSuccessRate(currentLevel, useRefineDust)
    return Math.random() * 100 < rate
}

// Monster gold drop
export function monsterGoldDrop(monsterType: string, level: number): number {
    const base: Record<string, number> = {
        slime: 5, skeleton: 12, demon: 20, boss: 80,
        bat: 8, ghost: 15,
    }
    const b = base[monsterType] ?? 5
    return Math.floor(b * (1 + level * 0.1) + Math.random() * b * 0.5)
}

// Monster material drop chance
export function rollMaterialDrop(monsterType: string): MaterialType | null {
    const chance = monsterType === 'boss' ? 0.60 : monsterType === 'demon' ? 0.15 : 0.06
    if (Math.random() > chance) return null
    const roll = Math.random()
    if (roll < 0.60) return 'upgrade_stone'
    if (roll < 0.90) return 'refine_dust'
    return 'protection_scroll'
}

// Shop items list
export interface ShopItem {
    material: MaterialType
    price: number
    stock: number // -1 = unlimited
}

export function getShopItems(): ShopItem[] {
    return [
        { material: 'upgrade_stone', price: MATERIALS.upgrade_stone.shopPrice, stock: -1 },
        { material: 'refine_dust', price: MATERIALS.refine_dust.shopPrice, stock: -1 },
        { material: 'protection_scroll', price: MATERIALS.protection_scroll.shopPrice, stock: -1 },
    ]
}

// Draw material icon with count
export function drawMaterialSlot(
    ctx: CanvasRenderingContext2D,
    mat: MaterialType, count: number,
    x: number, y: number, w: number, h: number,
    selected = false,
) {
    const cfg = MATERIALS[mat]
    ctx.fillStyle = selected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = selected ? cfg.color : '#374151'
    ctx.lineWidth = selected ? 2 : 1
    ctx.strokeRect(x, y, w, h)

    ctx.font = '16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(cfg.icon, x + w / 2, y + h / 2 + 2)

    ctx.fillStyle = count > 0 ? '#e2e8f0' : '#4b5563'
    ctx.font = 'bold 9px monospace'
    ctx.fillText(`×${count}`, x + w / 2, y + h - 4)
    ctx.textAlign = 'left'
}
