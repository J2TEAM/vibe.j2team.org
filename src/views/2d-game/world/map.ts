import type { Platform } from '../types'
import { MAP_WIDTH, CANVAS_HEIGHT } from '../engine/constants'

/** Generate platforms for the map */
export function generateMap(platforms: Platform[], H: number = CANVAS_HEIGHT): void {
    platforms.length = 0
    // Ground
    platforms.push({ x: 0, y: H - 48, w: MAP_WIDTH, h: 48, type: 'ground' })
    // Mid-level platforms
    for (let i = 1; i < 8; i++) {
        platforms.push({
            x: 200 + i * 350 + Math.random() * 100,
            y: H - 140 - Math.random() * 80,
            w: 96 + Math.random() * 64,
            h: 16,
            type: 'floating',
        })
    }
    // High platforms
    for (let i = 0; i < 4; i++) {
        platforms.push({
            x: 400 + i * 700 + Math.random() * 100,
            y: H - 240 - Math.random() * 60,
            w: 80 + Math.random() * 48,
            h: 16,
            type: 'floating',
        })
    }
}

// === Background elements ===
export interface StarData { x: number; y: number; s: number; b: number }
export interface TreeData { x: number; h: number; w: number }
export interface MountainData { x: number; h: number; w: number }

export interface BackgroundData {
    stars: StarData[]
    bgTrees: TreeData[]
    bgMountains: MountainData[]
}

export function generateBackground(W: number, H: number): BackgroundData {
    const stars: StarData[] = []
    const bgTrees: TreeData[] = []
    const bgMountains: MountainData[] = []

    for (let i = 0; i < 100; i++) {
        stars.push({ x: Math.random() * W * 3, y: Math.random() * H * 0.6, s: 1 + Math.random() * 2, b: Math.random() })
    }
    for (let i = 0; i < 30; i++) {
        bgTrees.push({ x: Math.random() * MAP_WIDTH * 1.2, h: 60 + Math.random() * 80, w: 30 + Math.random() * 20 })
    }
    for (let i = 0; i < 8; i++) {
        bgMountains.push({ x: i * 400 + Math.random() * 100, h: 80 + Math.random() * 120, w: 200 + Math.random() * 150 })
    }

    return { stars, bgTrees, bgMountains }
}
