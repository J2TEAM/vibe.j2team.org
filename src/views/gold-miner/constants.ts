export const GAME_WIDTH = 1024
export const GAME_HEIGHT = 720
export const TOP_BAR_HEIGHT = 100

export const HOOK_SPEED = 5
export const RETRACT_SPEED_BASE = 5
export const ROTATION_SPEED = 0.03
export const MAX_ANGLE = Math.PI * 0.45 // Approx 80 degrees

export const RETRACT_SPEED_CLICK = 10 // Pixels per click
export const MANUAL_PULL_DECAY = 0.5 // Speed decay when not clicking
export const LINE_STRENGTH_BASE = 50 // Threshold for line breaking
export const MAX_LIVES = 3
export const EXPLOSION_RADIUS = 120

export const LEVEL_CONFIGS = [
  { target: 1000, time: 60 },
  { target: 2500, time: 60 },
  { target: 5000, time: 50 },
  { target: 8000, time: 45 },
  { target: 12000, time: 40 },
]

export const ITEM_CONFIGS = {
  gold: [
    { name: 'Gold Small', value: 100, weight: 1.2, radius: 15 },
    { name: 'Gold Medium', value: 250, weight: 2.0, radius: 25 },
    { name: 'Gold Large', value: 500, weight: 4.5, radius: 45 },
    { name: 'Gold Huge', value: 1000, weight: 8.0, radius: 65 },
  ],
  stone: [
    { name: 'Stone Small', value: 10, weight: 3.0, radius: 15 },
    { name: 'Stone Large', value: 30, weight: 8.0, radius: 35 },
    { name: 'Stone Huge', value: 50, weight: 15.0, radius: 60 },
  ],
  diamond: [{ name: 'Diamond', value: 500, weight: 0.5, radius: 12 }],
  tnt: [{ name: 'TNT', value: 0, weight: 1.0, radius: 15 }],
  mystery: [{ name: 'Mystery Bag', value: 150, weight: 1.5, radius: 18 }],
}
