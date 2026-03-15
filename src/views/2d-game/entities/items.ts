import type { ItemType, Chest } from '../types'

const ITEM_NAMES: Record<ItemType, string> = {
    hp_potion: '❤️ HP Potion',
    atk_boost: '⚔️ ATK Boost',
    speed_boost: '💨 Speed Boost',
    shield: '🛡️ Shield',
    exp_gem: '💎 EXP Gem',
}

const ITEM_COLORS: Record<ItemType, string> = {
    hp_potion: '#ef4444',
    atk_boost: '#f97316',
    speed_boost: '#3b82f6',
    shield: '#a855f7',
    exp_gem: '#10b981',
}

const ITEM_DURATIONS: Record<ItemType, number> = {
    hp_potion: 0,      // instant
    atk_boost: 600,    // 10 seconds
    speed_boost: 480,  // 8 seconds
    shield: 360,       // 6 seconds
    exp_gem: 0,        // instant
}

export { ITEM_NAMES, ITEM_COLORS, ITEM_DURATIONS }

export function createChest(x: number, y: number): Chest {
    const items: ItemType[] = ['hp_potion', 'hp_potion', 'atk_boost', 'speed_boost', 'shield', 'exp_gem']
    const item = items[Math.floor(Math.random() * items.length)]!
    return {
        x, y: y - 24, w: 24, h: 24,
        opened: false, openTimer: 0,
        item, animFrame: 0,
    }
}

export function drawChest(ctx: CanvasRenderingContext2D, c: Chest, cameraX: number) {
    const cx = c.x - cameraX
    const cy = c.y

    if (c.opened) {
        // Opened chest
        ctx.fillStyle = '#8b6914'
        ctx.fillRect(cx, cy + 6, c.w, c.h - 6)
        ctx.fillStyle = '#a07a1e'
        ctx.fillRect(cx + 2, cy + 8, c.w - 4, c.h - 10)
        // Lid open
        ctx.fillStyle = '#8b6914'
        ctx.fillRect(cx - 2, cy - 2, c.w + 4, 8)
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(cx + c.w / 2 - 3, cy + 8, 6, 4)
        // Sparkle
        const sparkle = Math.sin(Date.now() * 0.01) * 0.5 + 0.5
        ctx.fillStyle = `rgba(251,191,36,${sparkle})`
        ctx.fillRect(cx + c.w / 2 - 1, cy - 4 - sparkle * 4, 2, 2)
    } else {
        // Closed chest with floating animation
        const float = Math.sin(Date.now() * 0.004) * 2
        const dy = cy + float
        ctx.fillStyle = '#8b6914'
        ctx.fillRect(cx, dy, c.w, c.h)
        ctx.fillStyle = '#a07a1e'
        ctx.fillRect(cx + 2, dy + 2, c.w - 4, c.h - 4)
        // Metal bands
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(cx, dy + c.h / 2 - 2, c.w, 4)
        ctx.fillRect(cx + c.w / 2 - 3, dy + 2, 6, c.h - 4)
        // Lock
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(cx + c.w / 2 - 2, dy + c.h / 2 - 3, 4, 6)
        // Glow
        ctx.strokeStyle = `rgba(251,191,36,${0.3 + Math.sin(Date.now() * 0.005) * 0.2})`
        ctx.lineWidth = 1
        ctx.strokeRect(cx - 2, dy - 2, c.w + 4, c.h + 4)
    }
}

export function drawItemPopup(ctx: CanvasRenderingContext2D, item: ItemType, x: number, y: number, timer: number) {
    const alpha = Math.min(1, timer / 10)
    const rise = (60 - timer) * 0.8
    ctx.globalAlpha = alpha
    ctx.fillStyle = ITEM_COLORS[item]
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(ITEM_NAMES[item], x, y - 30 - rise)
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
}
