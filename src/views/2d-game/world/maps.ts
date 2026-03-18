// === MULTI-MAP SYSTEM ===
// Mỗi map có layout, NPC, quái vật riêng
// Mỗi map có 3 khu vực (zone), mỗi zone có loại quái riêng

import type { Platform, MonsterType, BiomeType } from '../types'
import type { NPC } from '../entities/npc'
import { createNPC } from '../entities/npc'
import { CANVAS_HEIGHT } from '../engine/constants'

export type MapId = 'hub' | 'forest' | 'desert' | 'ice' | 'volcano'

// === ZONE SYSTEM ===
export interface MonsterZone {
    name: string           // tên khu vực
    xStart: number         // x bắt đầu zone
    xEnd: number           // x kết thúc zone
    monsterType: MonsterType  // loại quái duy nhất của zone
    maxMonsters: number    // 2-3 con / zone
    spawnRate: number      // frames between respawn check
    label: string          // nhãn hiển thị trên map
    color: string          // màu zone indicator
}

export interface MapConfig {
    id: MapId
    name: string
    icon: string
    description: string
    biome: BiomeType
    width: number
    minLevel: number  // recommended level
    monsterPool: MonsterType[]  // kept for backward compat
    bossType: MonsterType | null
    spawnRate: number  // global fallback
    maxMonsters: number
    hasNPCs: boolean
    portalX: number  // x position of exit portal (right side)
    nextMap: MapId | null
    zones: MonsterZone[]  // 3 khu vực cho mỗi battle map
}

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
    hub: {
        id: 'hub', name: '🏘️ Làng Ninja', icon: '🏘️',
        description: 'Khu vực an toàn — mua đồ, nâng cấp, nhận nhiệm vụ',
        biome: 'forest', width: 2400, minLevel: 0,
        monsterPool: [], // NO monsters in hub
        bossType: null, spawnRate: 9999, maxMonsters: 0,
        hasNPCs: true, portalX: 2200, nextMap: null,
        zones: [],
    },
    forest: {
        id: 'forest', name: '🌲 Rừng Xanh', icon: '🌲',
        description: 'Khu rừng cổ đại — quái vật yếu',
        biome: 'forest', width: 3200, minLevel: 1,
        monsterPool: ['slime', 'skeleton', 'bat'],
        bossType: 'boss', spawnRate: 180, maxMonsters: 9,
        hasNPCs: false, portalX: 3000, nextMap: 'hub',
        zones: [
            {
                name: 'Bìa Rừng', xStart: 200, xEnd: 900,
                monsterType: 'slime', maxMonsters: 3, spawnRate: 200,
                label: '🌿 Bìa Rừng', color: '#4ade80',
            },
            {
                name: 'Rừng Sâu', xStart: 1000, xEnd: 1900,
                monsterType: 'skeleton', maxMonsters: 3, spawnRate: 180,
                label: '🦴 Rừng Sâu', color: '#e2e8f0',
            },
            {
                name: 'Hang Dơi', xStart: 2100, xEnd: 2900,
                monsterType: 'bat', maxMonsters: 2, spawnRate: 160,
                label: '🦇 Hang Dơi', color: '#8b5cf6',
            },
        ],
    },
    desert: {
        id: 'desert', name: '🏜️ Sa Mạc Lửa', icon: '🏜️',
        description: 'Sa mạc nóng bỏng — quái trung bình',
        biome: 'desert', width: 3600, minLevel: 3,
        monsterPool: ['scorpion', 'mummy', 'sand_worm'],
        bossType: 'boss', spawnRate: 150, maxMonsters: 9,
        hasNPCs: false, portalX: 3400, nextMap: 'hub',
        zones: [
            {
                name: 'Bãi Cát', xStart: 200, xEnd: 1000,
                monsterType: 'scorpion', maxMonsters: 3, spawnRate: 170,
                label: '🦂 Bãi Cát', color: '#d97706',
            },
            {
                name: 'Hầm Mộ', xStart: 1200, xEnd: 2200,
                monsterType: 'mummy', maxMonsters: 3, spawnRate: 150,
                label: '🧟 Hầm Mộ', color: '#a8a29e',
            },
            {
                name: 'Hang Giun', xStart: 2400, xEnd: 3300,
                monsterType: 'sand_worm', maxMonsters: 2, spawnRate: 140,
                label: '🐛 Hang Giun', color: '#ca8a04',
            },
        ],
    },
    ice: {
        id: 'ice', name: '❄️ Vùng Băng Giá', icon: '❄️',
        description: 'Vùng đất đóng băng — quái mạnh',
        biome: 'ice', width: 3600, minLevel: 5,
        monsterPool: ['frost_spirit', 'yeti', 'ice_golem'],
        bossType: 'boss', spawnRate: 130, maxMonsters: 9,
        hasNPCs: false, portalX: 3400, nextMap: 'hub',
        zones: [
            {
                name: 'Hồ Đóng Băng', xStart: 200, xEnd: 1000,
                monsterType: 'frost_spirit', maxMonsters: 3, spawnRate: 150,
                label: '❄️ Hồ Đóng Băng', color: '#bfdbfe',
            },
            {
                name: 'Hang Tuyết', xStart: 1200, xEnd: 2200,
                monsterType: 'yeti', maxMonsters: 3, spawnRate: 140,
                label: '🐻‍❄️ Hang Tuyết', color: '#e2e8f0',
            },
            {
                name: 'Đỉnh Băng', xStart: 2400, xEnd: 3300,
                monsterType: 'ice_golem', maxMonsters: 2, spawnRate: 130,
                label: '🧊 Đỉnh Băng', color: '#93c5fd',
            },
        ],
    },
    volcano: {
        id: 'volcano', name: '🌋 Núi Lửa', icon: '🌋',
        description: 'Vùng nguy hiểm nhất — quái cực mạnh',
        biome: 'volcano', width: 4000, minLevel: 7,
        monsterPool: ['lava_snake', 'fire_elemental', 'magma_golem'],
        bossType: 'boss', spawnRate: 110, maxMonsters: 9,
        hasNPCs: false, portalX: 3800, nextMap: 'hub',
        zones: [
            {
                name: 'Bờ Dung Nham', xStart: 200, xEnd: 1100,
                monsterType: 'lava_snake', maxMonsters: 3, spawnRate: 130,
                label: '🐍 Bờ Dung Nham', color: '#ef4444',
            },
            {
                name: 'Biển Lửa', xStart: 1300, xEnd: 2400,
                monsterType: 'fire_elemental', maxMonsters: 3, spawnRate: 120,
                label: '🔥 Biển Lửa', color: '#f97316',
            },
            {
                name: 'Lõi Núi Lửa', xStart: 2600, xEnd: 3700,
                monsterType: 'magma_golem', maxMonsters: 2, spawnRate: 110,
                label: '🪨 Lõi Núi Lửa', color: '#7f1d1d',
            },
        ],
    },
}

export const MAP_ORDER: MapId[] = ['hub', 'forest', 'desert', 'ice', 'volcano']
export const BATTLE_MAPS: MapId[] = ['forest', 'desert', 'ice', 'volcano']

// Generate platforms for a specific map - terrain được rebuild cho từng khu vực
export function generateMapPlatforms(mapId: MapId, H: number = CANVAS_HEIGHT): Platform[] {
    const cfg = MAP_CONFIGS[mapId]
    const platforms: Platform[] = []

    if (mapId === 'hub') {
        // Hub: mặt đất phẳng
        platforms.push({ x: 0, y: H - 48, w: cfg.width, h: 48, type: 'ground' })
        // Platforms cho NPC areas
        platforms.push({ x: 180, y: H - 120, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 600, y: H - 140, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 1000, y: H - 130, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 1500, y: H - 150, w: 140, h: 16, type: 'floating' })
        platforms.push({ x: 1800, y: H - 180, w: 80, h: 16, type: 'floating' })
        platforms.push({ x: 1950, y: H - 240, w: 80, h: 16, type: 'floating' })
        return platforms
    }

    // === BATTLE MAPS: terrain phức tạp theo từng zone ===

    if (mapId === 'forest') {
        // Zone 1: Bìa Rừng (200-900) - terrain bằng phẳng, nhiều cây
        platforms.push({ x: 0, y: H - 48, w: 950, h: 48, type: 'ground' })
        platforms.push({ x: 300, y: H - 120, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 550, y: H - 160, w: 90, h: 16, type: 'floating' })
        platforms.push({ x: 750, y: H - 130, w: 100, h: 16, type: 'floating' })

        // Khe hở giữa zone 1 và 2
        // Zone 2: Rừng Sâu (1000-1900) - gò đồi, nhiều platform
        platforms.push({ x: 950, y: H - 38, w: 1000, h: 38, type: 'ground' }) // đất cao hơn 1 chút
        platforms.push({ x: 1050, y: H - 140, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 1250, y: H - 190, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 1450, y: H - 150, w: 130, h: 16, type: 'floating' })
        platforms.push({ x: 1300, y: H - 260, w: 80, h: 16, type: 'floating' })  // platform cao
        platforms.push({ x: 1650, y: H - 120, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 1800, y: H - 180, w: 90, h: 16, type: 'floating' })

        // Zone 3: Hang Dơi (2100-2900) - địa hình hẹp, tối, nhiều platform trên cao
        platforms.push({ x: 1950, y: H - 48, w: 1250, h: 48, type: 'ground' })
        platforms.push({ x: 2150, y: H - 130, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 2350, y: H - 200, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 2550, y: H - 160, w: 90, h: 16, type: 'floating' })
        platforms.push({ x: 2400, y: H - 280, w: 80, h: 16, type: 'floating' })
        platforms.push({ x: 2700, y: H - 230, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 2850, y: H - 140, w: 80, h: 16, type: 'floating' })
    }
    else if (mapId === 'desert') {
        // Zone 1: Bãi Cát (200-1000) - cồn cát, terrain gợn sóng
        platforms.push({ x: 0, y: H - 48, w: 500, h: 48, type: 'ground' })
        platforms.push({ x: 500, y: H - 56, w: 300, h: 56, type: 'ground' })  // cồn cát cao
        platforms.push({ x: 800, y: H - 48, w: 300, h: 48, type: 'ground' })
        platforms.push({ x: 350, y: H - 140, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 600, y: H - 180, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 850, y: H - 130, w: 90, h: 16, type: 'floating' })

        // Zone 2: Ốc Đảo Tối (1200-2200) - có hố sâu, platform trên nước
        platforms.push({ x: 1100, y: H - 48, w: 400, h: 48, type: 'ground' })
        platforms.push({ x: 1600, y: H - 48, w: 200, h: 48, type: 'ground' })  // đảo nhỏ
        platforms.push({ x: 1900, y: H - 48, w: 400, h: 48, type: 'ground' })
        platforms.push({ x: 1250, y: H - 150, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 1500, y: H - 120, w: 100, h: 16, type: 'floating' })  // cầu nối
        platforms.push({ x: 1700, y: H - 170, w: 130, h: 16, type: 'floating' })
        platforms.push({ x: 1950, y: H - 200, w: 90, h: 16, type: 'floating' })
        platforms.push({ x: 2100, y: H - 140, w: 100, h: 16, type: 'floating' })

        // Zone 3: Đền Cổ (2400-3300) - bậc thang, platform kiểu đền
        platforms.push({ x: 2300, y: H - 48, w: 1100, h: 48, type: 'ground' })
        platforms.push({ x: 2450, y: H - 110, w: 140, h: 16, type: 'floating' })  // bậc 1
        platforms.push({ x: 2650, y: H - 170, w: 140, h: 16, type: 'floating' })  // bậc 2
        platforms.push({ x: 2850, y: H - 230, w: 140, h: 16, type: 'floating' })  // bậc 3
        platforms.push({ x: 3050, y: H - 150, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 2750, y: H - 290, w: 100, h: 16, type: 'floating' })  // đỉnh đền
        platforms.push({ x: 3200, y: H - 120, w: 100, h: 16, type: 'floating' })
    }
    else if (mapId === 'ice') {
        // Zone 1: Hồ Đóng Băng (200-1000) - terrain trơn, phẳng
        platforms.push({ x: 0, y: H - 48, w: 1100, h: 48, type: 'ground' })
        platforms.push({ x: 300, y: H - 120, w: 130, h: 16, type: 'floating' })
        platforms.push({ x: 550, y: H - 180, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 800, y: H - 140, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 450, y: H - 250, w: 80, h: 16, type: 'floating' })

        // Zone 2: Hang Băng (1200-2200) - hang động, nhiều platform dọc
        platforms.push({ x: 1100, y: H - 42, w: 1200, h: 42, type: 'ground' })
        platforms.push({ x: 1250, y: H - 130, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 1450, y: H - 200, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 1650, y: H - 150, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 1350, y: H - 280, w: 90, h: 16, type: 'floating' })
        platforms.push({ x: 1850, y: H - 220, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 2050, y: H - 130, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 1550, y: H - 310, w: 80, h: 16, type: 'floating' })

        // Zone 3: Đỉnh Tuyết (2400-3300) - cao, gập ghềnh
        platforms.push({ x: 2300, y: H - 56, w: 1100, h: 56, type: 'ground' })  // đất cao
        platforms.push({ x: 2450, y: H - 140, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 2650, y: H - 200, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 2850, y: H - 260, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 3050, y: H - 180, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 2750, y: H - 330, w: 80, h: 16, type: 'floating' })  // đỉnh cao nhất
        platforms.push({ x: 3200, y: H - 130, w: 90, h: 16, type: 'floating' })
    }
    else if (mapId === 'volcano') {
        // Zone 1: Bờ Dung Nham (200-1100) - terrain gãy, lava gaps
        platforms.push({ x: 0, y: H - 48, w: 450, h: 48, type: 'ground' })
        platforms.push({ x: 500, y: H - 56, w: 300, h: 56, type: 'ground' })
        platforms.push({ x: 850, y: H - 48, w: 350, h: 48, type: 'ground' })
        platforms.push({ x: 300, y: H - 140, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 550, y: H - 180, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 800, y: H - 130, w: 90, h: 16, type: 'floating' })
        platforms.push({ x: 1000, y: H - 200, w: 80, h: 16, type: 'floating' })

        // Zone 2: Hang Quỷ (1300-2400) - hang sâu, nhiều tầng
        platforms.push({ x: 1200, y: H - 44, w: 1300, h: 44, type: 'ground' })
        platforms.push({ x: 1350, y: H - 130, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 1550, y: H - 200, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 1750, y: H - 160, w: 130, h: 16, type: 'floating' })
        platforms.push({ x: 1950, y: H - 230, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 1650, y: H - 290, w: 90, h: 16, type: 'floating' })
        platforms.push({ x: 2150, y: H - 140, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 2350, y: H - 180, w: 80, h: 16, type: 'floating' })

        // Zone 3: Miệng Núi Lửa (2600-3700) - núi lửa, cao dần
        platforms.push({ x: 2500, y: H - 48, w: 1500, h: 48, type: 'ground' })
        platforms.push({ x: 2650, y: H - 120, w: 130, h: 16, type: 'floating' })
        platforms.push({ x: 2850, y: H - 180, w: 120, h: 16, type: 'floating' })
        platforms.push({ x: 3050, y: H - 240, w: 110, h: 16, type: 'floating' })
        platforms.push({ x: 3250, y: H - 300, w: 100, h: 16, type: 'floating' })
        platforms.push({ x: 3450, y: H - 200, w: 90, h: 16, type: 'floating' })
        platforms.push({ x: 3150, y: H - 360, w: 80, h: 16, type: 'floating' })  // đỉnh núi lửa
        platforms.push({ x: 3600, y: H - 140, w: 100, h: 16, type: 'floating' })
    }

    return platforms
}

// Find which zone the player is currently in
export function getPlayerZone(mapId: MapId, playerX: number): MonsterZone | null {
    const cfg = MAP_CONFIGS[mapId]
    for (const zone of cfg.zones) {
        if (playerX >= zone.xStart && playerX <= zone.xEnd) return zone
    }
    return null
}

// Generate NPCs for Hub Town
export function generateHubNPCs(H: number = CANVAS_HEIGHT): NPC[] {
    return [
        createNPC('elder', 200, H - 48 - 42),      // Trưởng Làng bên trái
        createNPC('merchant', 600, H - 48 - 42),     // Thương Nhân
        createNPC('blacksmith', 1000, H - 48 - 44),   // Thợ Rèn
        createNPC('portal', 1800, H - 48 - 50),       // Portal chọn map
    ]
}

// Draw portal on map edge
export function drawPortal(ctx: CanvasRenderingContext2D, x: number, y: number, cameraX: number, targetName: string) {
    const dx = x - cameraX
    const t = Date.now() * 0.003

    // Swirl rings
    for (let i = 0; i < 4; i++) {
        const alpha = 0.15 + Math.sin(t + i * 1.5) * 0.1
        ctx.fillStyle = `rgba(129,140,248,${alpha})`
        ctx.beginPath()
        ctx.ellipse(dx, y + 6, 24 - i * 3, 36 - i * 5, 0, 0, Math.PI * 2)
        ctx.fill()
    }

    // Center glow
    ctx.fillStyle = 'rgba(15,15,35,0.7)'
    ctx.beginPath()
    ctx.ellipse(dx, y + 6, 12, 20, 0, 0, Math.PI * 2)
    ctx.fill()

    // Sparkles
    for (let i = 0; i < 6; i++) {
        const angle = t + i * Math.PI / 3
        const sx = dx + Math.cos(angle) * 26
        const sy = y + 6 + Math.sin(angle) * 38
        ctx.fillStyle = `rgba(199,210,254,${0.3 + Math.sin(t * 2 + i) * 0.3})`
        ctx.fillRect(sx - 1, sy - 1, 2, 2)
    }

    // Label
    ctx.fillStyle = '#c7d2fe'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🌀 ' + targetName, dx, y - 30)
    ctx.fillStyle = '#818cf8'; ctx.font = '8px monospace'
    ctx.fillText('Nhấn ↑ để vào', dx, y - 18)
    ctx.textAlign = 'left'
}

// Draw zone indicator on HUD
export function drawZoneIndicator(
    ctx: CanvasRenderingContext2D,
    zone: MonsterZone | null,
    W: number,
) {
    if (!zone) return
    const t = Date.now() * 0.002

    // Zone name banner at top center
    ctx.save()
    ctx.textAlign = 'center'

    // Background
    const textWidth = ctx.measureText(zone.label).width + 40
    const bx = W / 2 - textWidth / 2
    ctx.fillStyle = 'rgba(15,15,35,0.7)'
    ctx.fillRect(bx, 6, textWidth, 22)
    ctx.strokeStyle = zone.color + '80'
    ctx.lineWidth = 1
    ctx.strokeRect(bx, 6, textWidth, 22)

    // Zone label
    ctx.fillStyle = zone.color
    ctx.font = 'bold 10px monospace'
    ctx.fillText(zone.label, W / 2, 21)

    // Pulse effect
    const pulse = Math.sin(t) * 0.3 + 0.7
    ctx.fillStyle = zone.color + Math.floor(pulse * 40).toString(16).padStart(2, '0')
    ctx.fillRect(bx, 6, 3, 22)
    ctx.fillRect(bx + textWidth - 3, 6, 3, 22)

    ctx.restore()
}

// Draw zone boundaries on the ground (subtle markers)
export function drawZoneBoundaries(
    ctx: CanvasRenderingContext2D,
    mapId: MapId,
    cameraX: number,
    H: number,
) {
    const cfg = MAP_CONFIGS[mapId]
    if (cfg.zones.length === 0) return

    const t = Date.now() * 0.002
    ctx.save()

    for (const zone of cfg.zones) {
        // Zone boundary markers
        const startX = zone.xStart - cameraX
        const endX = zone.xEnd - cameraX

        // Start marker
        const alpha = 0.15 + Math.sin(t) * 0.05
        ctx.strokeStyle = zone.color
        ctx.globalAlpha = alpha
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(startX, H - 48)
        ctx.lineTo(startX, H - 48 - 30)
        ctx.stroke()

        // Zone name on ground
        ctx.globalAlpha = 0.4 + Math.sin(t + 1) * 0.1
        ctx.fillStyle = zone.color
        ctx.font = '7px monospace'
        ctx.textAlign = 'center'
        const centerX = (startX + endX) / 2
        ctx.fillText(zone.name, centerX, H - 52)
    }

    ctx.setLineDash([])
    ctx.restore()
}

// Draw map selection panel (when at portal)
export function drawMapSelection(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    unlockedMaps: MapId[],
    selectedIdx: number,
) {
    const panelW = 400, panelH = 320
    const px = (W - panelW) / 2, py = H - panelH - 50

    ctx.fillStyle = 'rgba(15,15,35,0.94)'
    ctx.fillRect(px, py, panelW, panelH)
    ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2
    ctx.strokeRect(px, py, panelW, panelH)

    ctx.fillStyle = '#818cf8'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🌀 CHỌN MAP', px + panelW / 2, py + 22)
    ctx.textAlign = 'left'

    const allMaps: MapId[] = ['forest', 'desert', 'ice', 'volcano']

    allMaps.forEach((mapId, i) => {
        const cfg = MAP_CONFIGS[mapId]
        const unlocked = unlockedMaps.includes(mapId)
        const isSelected = i === selectedIdx
        const iy = py + 40 + i * 62

        ctx.fillStyle = isSelected ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.03)'
        ctx.fillRect(px + 12, iy, panelW - 24, 52)
        ctx.strokeStyle = isSelected ? '#818cf8' : '#2a2a3e'; ctx.lineWidth = isSelected ? 2 : 1
        ctx.strokeRect(px + 12, iy, panelW - 24, 52)

        if (isSelected) {
            ctx.fillStyle = '#818cf8'; ctx.fillRect(px + 12, iy, 3, 52)
        }

        if (unlocked) {
            ctx.font = '20px monospace'; ctx.textAlign = 'center'
            ctx.fillText(cfg.icon, px + 36, iy + 30)
            ctx.textAlign = 'left'

            ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px monospace'
            ctx.fillText(cfg.name, px + 56, iy + 18)
            ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'
            ctx.fillText(cfg.description, px + 56, iy + 32)

            // Zone info
            ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'
            const zoneNames = cfg.zones.map(z => z.name).join(' → ')
            ctx.fillText(`Khu vực: ${zoneNames}`, px + 56, iy + 44)
        } else {
            ctx.font = '20px monospace'; ctx.textAlign = 'center'
            ctx.fillStyle = '#374151'
            ctx.fillText('🔒', px + 36, iy + 30)
            ctx.textAlign = 'left'
            ctx.fillStyle = '#4b5563'; ctx.font = '10px monospace'
            ctx.fillText('Chưa mở khóa', px + 56, iy + 22)
            ctx.fillStyle = '#374151'; ctx.font = '8px monospace'
            ctx.fillText(`Cần clear map trước`, px + 56, iy + 36)
        }
    })

    ctx.fillStyle = '#64748b'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
    ctx.fillText('↑↓ Chọn | Enter Vào | B Đóng', px + panelW / 2, py + panelH - 8)
    ctx.textAlign = 'left'
}

// Draw "Return to Hub" hint when near portal in battle map
export function drawReturnHint(ctx: CanvasRenderingContext2D, x: number, y: number, cameraX: number) {
    const dx = x - cameraX
    ctx.fillStyle = '#818cf8'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'
    ctx.fillText('🌀 Về Làng', dx, y - 20)
    ctx.fillStyle = '#c7d2fe'; ctx.font = '8px monospace'
    ctx.fillText('Nhấn ↑', dx, y - 8)
    ctx.textAlign = 'left'
}
