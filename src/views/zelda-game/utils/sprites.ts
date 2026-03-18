import type { AnimationDef, AnimationMap, CachedSprite, Direction, SpriteFrame } from './types'
import {
  SPRITE_SIZE,
  WALK_FRAME_DURATION,
  ARROW_SIZE,
  SWORD_SWING_DURATION,
  SWORD_RANGE,
  LYNEL_SPRITE_SIZE,
  GANON_SPRITE_SIZE,
  GANON_DARK_SLASH_ARC,
  GROUND_SLAM_RADIUS,
  PILLAR_SHOCKWAVE_RADIUS,
} from './constants'

// --- Link color palette ---
const LINK_COLORS = {
  hat: '#2D8B2D',
  hatDark: '#1E6B1E',
  tunic: '#3CB43C',
  tunicDark: '#2D8B2D',
  skin: '#FFD1A3',
  skinDark: '#E6B88A',
  hair: '#B8860B',
  boots: '#5C4033',
  belt: '#8B6914',
  eyes: '#1A1A1A',
} as const

// --- Bokoblin color palette ---
const BOKOBLIN_COLORS = {
  R: '#C0392B', // skin (dark red)
  r: '#E74C3C', // belly (lighter red)
  B: '#6D4C41', // cloth (brown)
  H: '#F5DEB3', // horn (tan/wheat)
  W: '#FFFFFF', // eyes (white)
  P: '#1A1A1A', // pupil (dark)
  C: '#5D4037', // club (brown)
  b: '#4E342E', // dark brown (outline/shadow)
} as const

// Pixel-art character → color lookup
const PIXEL_MAP: Record<string, string> = {
  D: LINK_COLORS.hat,
  K: LINK_COLORS.hatDark,
  G: LINK_COLORS.tunic,
  g: LINK_COLORS.tunicDark,
  S: LINK_COLORS.skin,
  s: LINK_COLORS.skinDark,
  H: LINK_COLORS.hair,
  B: LINK_COLORS.boots,
  L: LINK_COLORS.belt,
  E: LINK_COLORS.eyes,
}

const SCALE = 2 // 16-logical-px grid × 2 = 32 canvas px

// ────────────────────────────────────────────────────────────────────
// Pixel-art grids — 16×16 logical pixels, rendered at 2× scale.
// Each row is exactly 16 characters.  '.' = transparent.
// ────────────────────────────────────────────────────────────────────

// --- PLAYER: DOWN (front view) ---

const DOWN_IDLE: readonly string[] = [
  '................', // 0
  '......DD........', // 1  hat tip
  '.....DDDD.......', // 2  hat
  '....DDDDDD......', // 3  hat wide
  '....DDDDDD......', // 4  hat base
  '....SSSSSS......', // 5  face
  '....SESSES......', // 6  eyes
  '.....SSSS.......', // 7  chin
  '....GGGGGG......', // 8  tunic
  '...sGGGGGGs.....', // 9  tunic + arms
  '...sGGGGGGs.....', // 10 tunic + arms
  '....GGGGGG......', // 11 tunic
  '....LLLLLL......', // 12 belt
  '....GG..GG......', // 13 legs
  '....BB..BB......', // 14 boots
  '................', // 15
]

const DOWN_WALK1: readonly string[] = [
  '................',
  '......DD........',
  '.....DDDD.......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....SSSSSS......',
  '....SESSES......',
  '.....SSSS.......',
  '....GGGGGG......',
  '...sGGGGGGs.....',
  '...sGGGGGGs.....',
  '....GGGGGG......',
  '....LLLLLL......',
  '...GG..GG.......',
  '...BB..BB.......',
  '................',
]

const DOWN_WALK2: readonly string[] = [
  '................',
  '......DD........',
  '.....DDDD.......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....SSSSSS......',
  '....SESSES......',
  '.....SSSS.......',
  '....GGGGGG......',
  '...sGGGGGGs.....',
  '...sGGGGGGs.....',
  '....GGGGGG......',
  '....LLLLLL......',
  '.....GG..GG.....',
  '.....BB..BB.....',
  '................',
]

// --- PLAYER: UP (back view) ---

const UP_IDLE: readonly string[] = [
  '................',
  '......DD........',
  '.....DDDD.......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....HHHHHH......',
  '.....HHHH.......',
  '....GGGGGG......',
  '...sGGGGGGs.....',
  '...sGGGGGGs.....',
  '....GGGGGG......',
  '....LLLLLL......',
  '....GG..GG......',
  '....BB..BB......',
  '................',
]

const UP_WALK1: readonly string[] = [
  '................',
  '......DD........',
  '.....DDDD.......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....HHHHHH......',
  '.....HHHH.......',
  '....GGGGGG......',
  '...sGGGGGGs.....',
  '...sGGGGGGs.....',
  '....GGGGGG......',
  '....LLLLLL......',
  '...GG..GG.......',
  '...BB..BB.......',
  '................',
]

const UP_WALK2: readonly string[] = [
  '................',
  '......DD........',
  '.....DDDD.......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....DDDDDD......',
  '....HHHHHH......',
  '.....HHHH.......',
  '....GGGGGG......',
  '...sGGGGGGs.....',
  '...sGGGGGGs.....',
  '....GGGGGG......',
  '....LLLLLL......',
  '.....GG..GG.....',
  '.....BB..BB.....',
  '................',
]

// --- PLAYER: LEFT (side view) ---

const LEFT_IDLE: readonly string[] = [
  '................',
  '....DDD.........',
  '...DDDDD........',
  '...DDDDDD.......',
  '....DDDDD.......',
  '....HSSSS.......',
  '....ESSSS.......',
  '.....SSS........',
  '....GGGGG.......',
  '....GGGGGs......',
  '....GGGGGs......',
  '....GGGGG.......',
  '....LLLLL.......',
  '....GG.GG.......',
  '....BB.BB.......',
  '................',
]

const LEFT_WALK1: readonly string[] = [
  '................',
  '....DDD.........',
  '...DDDDD........',
  '...DDDDDD.......',
  '....DDDDD.......',
  '....HSSSS.......',
  '....ESSSS.......',
  '.....SSS........',
  '....GGGGG.......',
  '....GGGGGs......',
  '....GGGGGs......',
  '....GGGGG.......',
  '....LLLLL.......',
  '...GG..GG.......',
  '...BB..BB.......',
  '................',
]

const LEFT_WALK2: readonly string[] = [
  '................',
  '....DDD.........',
  '...DDDDD........',
  '...DDDDDD.......',
  '....DDDDD.......',
  '....HSSSS.......',
  '....ESSSS.......',
  '.....SSS........',
  '....GGGGG.......',
  '....GGGGGs......',
  '....GGGGGs......',
  '....GGGGG.......',
  '....LLLLL.......',
  '.....GGGG.......',
  '.....BBBB.......',
  '................',
]

// --- BOKOBLIN: DOWN (front view) ---

const BOKOBLIN_DOWN_IDLE: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RWRRRWRR.....',
  '...RPRRRPRR.....',
  '...RRRRRRRR.....',
  '....RRrrRR......',
  '....RRRRRR......',
  '...RRrrrRRC.....',
  '...RRrrrRRC.....',
  '...RRBBBRRR.....',
  '....RBBBR.......',
  '....RR.RR.......',
  '....Rb.bR.......',
  '................',
  '................',
]

const BOKOBLIN_DOWN_WALK: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RWRRRWRR.....',
  '...RPRRRPRR.....',
  '...RRRRRRRR.....',
  '....RRrrRR......',
  '....RRRRRR......',
  '...RRrrrRRC.....',
  '...RRrrrRRC.....',
  '...RRBBBRRR.....',
  '....RBBBR.......',
  '....RR..RR......',
  '...Rb...bR......',
  '................',
  '................',
]

// --- BOKOBLIN: UP (back view) ---

const BOKOBLIN_UP_IDLE: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '....RRRRRR......',
  '....RRRRRR......',
  '...RRrrrRR......',
  '...RRrrrRRC.....',
  '...RRBBBRRC.....',
  '....RBBBR.......',
  '....RR.RR.......',
  '....Rb.bR.......',
  '................',
  '................',
]

const BOKOBLIN_UP_WALK: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '....RRRRRR......',
  '....RRRRRR......',
  '...RRrrrRR......',
  '...RRrrrRRC.....',
  '...RRBBBRRC.....',
  '....RBBBR.......',
  '....RR..RR......',
  '...Rb...bR......',
  '................',
  '................',
]

// --- BOKOBLIN: LEFT (side view) ---

const BOKOBLIN_LEFT_IDLE: readonly string[] = [
  '................',
  '......HH........',
  '....RRRRR.......',
  '...RWRRRR.......',
  '...RPRRRR.......',
  '...RRRRRR.......',
  '....RRrrR.......',
  '....RRRRR.......',
  '...CRRRRR.......',
  '...CRRRrr.......',
  '...RRBBBR.......',
  '....RBBBR.......',
  '....RR.RR.......',
  '....Rb.bR.......',
  '................',
  '................',
]

const BOKOBLIN_LEFT_WALK: readonly string[] = [
  '................',
  '......HH........',
  '....RRRRR.......',
  '...RWRRRR.......',
  '...RPRRRR.......',
  '...RRRRRR.......',
  '....RRrrR.......',
  '....RRRRR.......',
  '...CRRRRR.......',
  '...CRRRrr.......',
  '...RRBBBR.......',
  '....RBBBR.......',
  '....RR..RR......',
  '...Rb...bR......',
  '................',
  '................',
]

// --- BOKOBLIN: SLEEPING (key carrier) ---

const BOKOBLIN_SLEEPING: readonly string[] = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......H..H.....',
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '....RRrrrRRR....',
  '...RRRBBBBRR....',
  '...RRRRRRRRR....',
  '................',
  '................',
  '................',
]


// ────────────────────────────────────────────────────────────────────
// Canvas helpers
// ────────────────────────────────────────────────────────────────────

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SPRITE_SIZE
  canvas.height = SPRITE_SIZE
  return canvas
}

function drawPixelArt(ctx: CanvasRenderingContext2D, data: readonly string[], colorMap: Record<string, string> = PIXEL_MAP): void {
  for (let y = 0; y < data.length; y++) {
    const row = data[y]!
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.') continue
      const color = colorMap[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE)
    }
  }
}

function renderSprite(data: readonly string[]): CachedSprite {
  const canvas = createCanvas()
  const ctx = canvas.getContext('2d')!
  drawPixelArt(ctx, data)
  return canvas
}

// Special renderer for Bokoblins using their palette
function renderBokoblinSprite(data: readonly string[]): CachedSprite {
  const canvas = createCanvas()
  const ctx = canvas.getContext('2d')!
  drawPixelArt(ctx, data, BOKOBLIN_COLORS)
  return canvas
}

function flipHorizontal(sprite: CachedSprite): CachedSprite {
  const canvas = createCanvas()
  const ctx = canvas.getContext('2d')!
  ctx.save()
  ctx.translate(SPRITE_SIZE, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(sprite, 0, 0)
  ctx.restore()
  return canvas
}

/** Wrap a CachedSprite in a SpriteFrame that honours the `size` param (red-team fix #1). */
function toSpriteFrame(sprite: CachedSprite): SpriteFrame {
  return {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.drawImage(sprite, x, y, size, size)
    },
  }
}

// ────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────

export interface PlayerSprites {
  idle: Record<Direction, CachedSprite>
  walk: Record<Direction, [CachedSprite, CachedSprite]>
}

export interface BokoblinSprites {
  idle: Record<Direction, CachedSprite>
  walk: Record<Direction, [CachedSprite, CachedSprite]>
}

// Module-level singletons (red-team fix #10)
let cachedSprites: PlayerSprites | null = null
let cachedAnimations: AnimationMap | null = null

let bokoblinSpritesCache: BokoblinSprites | null = null
let bokoblinAnimsCache: AnimationMap | null = null
let bokoblinKeySpriteCache: CachedSprite | null = null

function createPlayerSprites(): PlayerSprites {
  const downIdle = renderSprite(DOWN_IDLE)
  const downWalk1 = renderSprite(DOWN_WALK1)
  const downWalk2 = renderSprite(DOWN_WALK2)

  const upIdle = renderSprite(UP_IDLE)
  const upWalk1 = renderSprite(UP_WALK1)
  const upWalk2 = renderSprite(UP_WALK2)

  const leftIdle = renderSprite(LEFT_IDLE)
  const leftWalk1 = renderSprite(LEFT_WALK1)
  const leftWalk2 = renderSprite(LEFT_WALK2)

  // Right = horizontal flip of left
  const rightIdle = flipHorizontal(leftIdle)
  const rightWalk1 = flipHorizontal(leftWalk1)
  const rightWalk2 = flipHorizontal(leftWalk2)

  return {
    idle: { down: downIdle, up: upIdle, left: leftIdle, right: rightIdle },
    walk: {
      down: [downWalk1, downWalk2],
      up: [upWalk1, upWalk2],
      left: [leftWalk1, leftWalk2],
      right: [rightWalk1, rightWalk2],
    },
  }
}

/** Draw sword arc visual — call after drawing player sprite. x,y = sprite draw origin (pos - SPRITE_OFFSET). */
export function drawSwordArc(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction): void {
  ctx.save()
  ctx.strokeStyle = '#E0E8FF'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'

  const cx = x + SPRITE_SIZE / 2
  const cy = y + SPRITE_SIZE / 2
  const r = SWORD_RANGE

  ctx.beginPath()
  switch (direction) {
    case 'right':
      ctx.arc(cx, cy, r, -Math.PI / 4, Math.PI / 4)
      break
    case 'left':
      ctx.arc(cx, cy, r, Math.PI * 3 / 4, Math.PI * 5 / 4)
      break
    case 'up':
      ctx.arc(cx, cy, r, -Math.PI * 3 / 4, -Math.PI / 4)
      break
    case 'down':
      ctx.arc(cx, cy, r, Math.PI / 4, Math.PI * 3 / 4)
      break
  }
  ctx.stroke()
  ctx.restore()
}


export function getPlayerSprites(): PlayerSprites {
  if (!cachedSprites) {
    cachedSprites = createPlayerSprites()
  }
  return cachedSprites
}

/** Get player animations as an AnimationMap (lazy singleton — red-team fix #10). */
export function getPlayerAnimations(): AnimationMap {
  if (!cachedAnimations) {
    const sprites = getPlayerSprites()
    const directions: Direction[] = ['up', 'down', 'left', 'right']

    const idle: Partial<Record<Direction, AnimationDef>> = {}
    const walk: Partial<Record<Direction, AnimationDef>> = {}

    for (const dir of directions) {
      idle[dir] = {
        frames: [toSpriteFrame(sprites.idle[dir])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
      walk[dir] = {
        frames: [toSpriteFrame(sprites.walk[dir][0]), toSpriteFrame(sprites.walk[dir][1])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
    }

    // 'shoot' reuses idle frames but plays once (non-looping) over 0.3s (2 frames × 0.15s)
    const shoot: Partial<Record<Direction, AnimationDef>> = {}
    for (const dir of directions) {
      shoot[dir] = {
        frames: [toSpriteFrame(sprites.idle[dir]), toSpriteFrame(sprites.idle[dir])],
        frameDuration: 0.15,
        loop: false,
      }
    }

    // 'attack' reuses idle frames (arc drawn separately), non-looping, 2 frames × (SWORD_SWING_DURATION/2) each
    const attack: Partial<Record<Direction, AnimationDef>> = {}
    for (const dir of directions) {
      attack[dir] = {
        frames: [toSpriteFrame(sprites.idle[dir]), toSpriteFrame(sprites.idle[dir])],
        frameDuration: SWORD_SWING_DURATION / 2,
        loop: false,
      }
    }

    cachedAnimations = { idle, walk, shoot, attack }
  }
  return cachedAnimations
}

function createBokoblinSprites(): BokoblinSprites {
  const downIdle = renderBokoblinSprite(BOKOBLIN_DOWN_IDLE)
  const downWalk = renderBokoblinSprite(BOKOBLIN_DOWN_WALK)

  const upIdle = renderBokoblinSprite(BOKOBLIN_UP_IDLE)
  const upWalk = renderBokoblinSprite(BOKOBLIN_UP_WALK)

  const leftIdle = renderBokoblinSprite(BOKOBLIN_LEFT_IDLE)
  const leftWalk = renderBokoblinSprite(BOKOBLIN_LEFT_WALK)

  const rightIdle = flipHorizontal(leftIdle)
  const rightWalk = flipHorizontal(leftWalk)

  return {
    idle: { down: downIdle, up: upIdle, left: leftIdle, right: rightIdle },
    walk: {
      down: [downIdle, downWalk], // 2-frame walk cycle
      up: [upIdle, upWalk],
      left: [leftIdle, leftWalk],
      right: [rightIdle, rightWalk],
    },
  }
}

export function getBokoblinSprites(): BokoblinSprites {
  if (!bokoblinSpritesCache) {
    bokoblinSpritesCache = createBokoblinSprites()
  }
  return bokoblinSpritesCache
}

export function getBokoblinAnimations(): AnimationMap {
  if (!bokoblinAnimsCache) {
    const sprites = getBokoblinSprites()
    const directions: Direction[] = ['up', 'down', 'left', 'right']

    const idle: Partial<Record<Direction, AnimationDef>> = {}
    const walk: Partial<Record<Direction, AnimationDef>> = {}

    for (const dir of directions) {
      idle[dir] = {
        frames: [toSpriteFrame(sprites.idle[dir])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
      walk[dir] = {
        frames: [toSpriteFrame(sprites.walk[dir][0]), toSpriteFrame(sprites.walk[dir][1])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
    }

    bokoblinAnimsCache = { idle, walk }
  }
  return bokoblinAnimsCache
}

export function getBokoblinKeySprite(): CachedSprite {
  if (!bokoblinKeySpriteCache) {
    bokoblinKeySpriteCache = renderBokoblinSprite(BOKOBLIN_SLEEPING)
  }
  return bokoblinKeySpriteCache
}

/** Clear cached sprites for SPA navigation cleanup (red-team fix #13). */
export function clearSpriteCache(): void {
  cachedSprites = null
  cachedAnimations = null
  bokoblinSpritesCache = null
  bokoblinAnimsCache = null
  bokoblinKeySpriteCache = null
}

/**
 * Draw a glowing arrow projectile at world position (x, y).
 * Gold/glowing for player arrows, red for enemy arrows.
 */
export function drawArrowSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  source: string,
): void {
  const cx = x + ARROW_SIZE / 2
  const cy = y + ARROW_SIZE / 2

  ctx.save()

  // Glow halo
  ctx.fillStyle = source === 'player' ? '#fffacd' : '#ff6b6b'
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.arc(cx, cy, ARROW_SIZE, 0, Math.PI * 2)
  ctx.fill()

  // Arrow line (tip-to-tail in travel direction)
  ctx.globalAlpha = 1
  ctx.strokeStyle = source === 'player' ? '#ffd700' : '#cc0000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - dirX * ARROW_SIZE, cy - dirY * ARROW_SIZE)
  ctx.lineTo(cx + dirX * ARROW_SIZE, cy + dirY * ARROW_SIZE)
  ctx.stroke()

  ctx.restore()
}

/**
 * Draw a small Hylian Shield indicator in front of the player based on facing direction.
 * Shield is ~12×16px blue rectangle with yellow trim, offset from the player center.
 */
export function drawShieldIndicator(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
  direction: Direction,
): void {
  const SHIELD_W = 10
  const SHIELD_H = 14
  const OFFSET = 6 // px in front of player edge

  let sx: number
  let sy: number

  const cx = playerX + playerW / 2
  const cy = playerY + playerH / 2

  switch (direction) {
    case 'right':
      sx = playerX + playerW + OFFSET - SHIELD_W / 2
      sy = cy - SHIELD_H / 2
      break
    case 'left':
      sx = playerX - OFFSET - SHIELD_W / 2
      sy = cy - SHIELD_H / 2
      break
    case 'down':
      sx = cx - SHIELD_W / 2
      sy = playerY + playerH + OFFSET - SHIELD_H / 2
      break
    case 'up':
      sx = cx - SHIELD_W / 2
      sy = playerY - OFFSET - SHIELD_H / 2
      break
  }

  ctx.save()
  ctx.globalAlpha = 0.85

  // Shield body — royal blue
  ctx.fillStyle = '#1E40AF'
  ctx.fillRect(sx, sy, SHIELD_W, SHIELD_H)

  // Yellow trim border
  ctx.strokeStyle = '#FCD34D'
  ctx.lineWidth = 1.5
  ctx.strokeRect(sx + 0.75, sy + 0.75, SHIELD_W - 1.5, SHIELD_H - 1.5)

  // Triforce dot — amber
  ctx.fillStyle = '#F59E0B'
  ctx.fillRect(sx + SHIELD_W / 2 - 1, sy + 3, 2, 2)

  ctx.restore()
}

/**
 * Draw enemy death poof animation (expanding particles)
 */
export function drawDeathPoof(ctx: CanvasRenderingContext2D, cx: number, cy: number, progress: number): void {
  // Expanding circle of particles
  const numParticles = 8
  const maxRadius = 24
  const radius = progress * maxRadius

  ctx.save()
  ctx.globalAlpha = (1 - progress) * 0.8

  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2
    const px = cx + Math.cos(angle) * radius
    const py = cy + Math.sin(angle) * radius
    const size = 4 * (1 - progress)  // shrink as they expand

    // Alternating orange/yellow particles
    ctx.fillStyle = i % 2 === 0 ? '#ffaa00' : '#ff6600'
    ctx.fillRect(px - size/2, py - size/2, size, size)
  }

  // Central flash
  if (progress < 0.3) {
    ctx.globalAlpha = (0.3 - progress) * 3
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, 8 * (1 - progress * 2), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

// ────────────────────────────────────────────────────────────────────
// Stage 2 — Lynel Boss & Bokoblin Archer Sprites
// ────────────────────────────────────────────────────────────────────

// --- Lynel color palette ---
const LYNEL_PIXEL_COLORS: Record<string, string> = {
  A: '#8B2500',  // dark red body
  a: '#C0392B',  // lighter red accent
  M: '#D2691E',  // mane (orange-brown)
  H: '#A0522D',  // horse body (sienna)
  W: '#FFFFFF',  // eye white
  p: '#1A1A1A',  // pupil
  S: '#C0C0C0',  // sword silver
  G: '#D4A017',  // gold armor trim
}

// Lynel pixel art — 16×16 logical px rendered at 3× scale = 48px

const LYNEL_DOWN_IDLE: readonly string[] = [
  '................', // 0
  '....SSSSS.......',  // 1 horns/sword
  '....AAAAA.......',  // 2 head top
  '...AAAAAaA......',  // 3 head wide
  '...AWpWpAA......',  // 4 eyes
  '...AAAAAaA......',  // 5 face
  '..GAAAAAaAG.....',  // 6 shoulders + gold trim
  '..AAAAAAAAa.....',  // 7 upper body
  '..HHHHHHHH......',  // 8 horse body top
  '.HHHHHHHHHa.....',  // 9 horse body
  '.HHHHHHHHHa.....',  // 10 horse belly
  '.HH..HHHH.......',  // 11 legs
  '.HH..HHHH.......',  // 12 legs
  '..H...HH........',  // 13 hooves
  '................',  // 14
  '................',  // 15
]

const LYNEL_DOWN_WALK: readonly string[] = [
  '................',
  '....SSSSS.......',
  '....AAAAA.......',
  '...AAAAAaA......',
  '...AWpWpAA......',
  '...AAAAAaA......',
  '..GAAAAAaAG.....',
  '..AAAAAAAAa.....',
  '..HHHHHHHH......',
  '.HHHHHHHHHa.....',
  '.HHHHHHHHHa.....',
  '..HH.HHHH.......',  // legs shifted
  '.HH...HHH.......',  // legs shifted
  '..H...HH........',
  '................',
  '................',
]

const LYNEL_UP_IDLE: readonly string[] = [
  '................',
  '....MMMMM.......',  // mane top
  '....AAAAA.......',  // head back
  '...AAAAAAAAA....',  // wider
  '...AAAAAAAA.....',  // upper
  '....MMMMM.......',  // mane at neck
  '..GAAAAAaAG.....',  // shoulders
  '..AAAAAAAAa.....',  // upper body
  '..HHHHHHHH......',  // horse body
  '.HHHHHHHHHa.....',
  '.HHHHHHHHHa.....',
  '.HH..HHHH.......',
  '.HH..HHHH.......',
  '..H...HH........',
  '................',
  '................',
]

const LYNEL_UP_WALK: readonly string[] = [
  '................',
  '....MMMMM.......',
  '....AAAAA.......',
  '...AAAAAAAAA....',
  '...AAAAAAAA.....',
  '....MMMMM.......',
  '..GAAAAAaAG.....',
  '..AAAAAAAAa.....',
  '..HHHHHHHH......',
  '.HHHHHHHHHa.....',
  '.HHHHHHHHHa.....',
  '..HH.HHHH.......',
  '.HH...HHH.......',
  '..H...HH........',
  '................',
  '................',
]

const LYNEL_LEFT_IDLE: readonly string[] = [
  '................',
  '...MMMMM........',  // mane
  '...AAAAA........',  // head profile
  '...AAWPA........',  // eye (W=white, P=pupil)
  '...AAAAA........',  // face
  '..SAAAAAa.......',  // sword in front + body
  '..AAAAAAAAa.....',  // body
  '..HHHHHHH.......',  // horse body
  '.HHHHHHHHa......',  // horse body wide
  '.HHHHHHHHa......',  // belly
  '.HH..HHH........',  // legs
  '.HH..HHH........',  // legs
  '..H...H.........',  // hooves
  '................',
  '................',
  '................',
]

const LYNEL_LEFT_WALK: readonly string[] = [
  '................',
  '...MMMMM........',
  '...AAAAA........',
  '...AAWPA........',
  '...AAAAA........',
  '..SAAAAAa.......',
  '..AAAAAAAAa.....',
  '..HHHHHHH.......',
  '.HHHHHHHHa......',
  '.HHHHHHHHa......',
  '..HH.HHH........',  // leg shifted
  '.HH...HH........',  // leg shifted
  '..H...H.........',
  '................',
  '................',
  '................',
]

// --- Bokoblin Archer color palette (extends Bokoblin with bow color) ---
const ARCHER_COLORS: Record<string, string> = {
  ...BOKOBLIN_COLORS,
  A: '#8B6914',  // bow (lighter brown/gold)
}

const ARCHER_DOWN_IDLE: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RWRRRWRR.....',
  '...RPRRRPRR.....',
  '...RRRRRRRR.....',
  '....RRrrRR......',
  '....RRRRRR......',
  '..AARRRRRRAA....',  // bow held horizontally (A=bow)
  '...RRrrrRRR.....',
  '...RRBBBRRR.....',
  '....RBBBR.......',
  '....RR..RR......',
  '...Rb...bR......',
  '................',
  '................',
]

const ARCHER_DOWN_WALK: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RWRRRWRR.....',
  '...RPRRRPRR.....',
  '...RRRRRRRR.....',
  '....RRrrRR......',
  '....RRRRRR......',
  '..AARRRRRRAA....',
  '...RRrrrRRR.....',
  '...RRBBBRRR.....',
  '....RBBBR.......',
  '....RR..RR......',
  '...Rb...bR......',
  '................',
  '................',
]

const ARCHER_UP_IDLE: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '....RRRRRR......',
  '....RRRRRR......',
  '...RRrrrRRA.....',  // bow on right side
  '...RRrrrRRA.....',
  '...RRBBBRRA.....',
  '....RBBBR.......',
  '....RR.RR.......',
  '....Rb.bR.......',
  '................',
  '................',
]

const ARCHER_UP_WALK: readonly string[] = [
  '................',
  '....HH..HH......',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '...RRRRRRRR.....',
  '....RRRRRR......',
  '....RRRRRR......',
  '...RRrrrRRA.....',
  '...RRrrrRRA.....',
  '...RRBBBRRA.....',
  '....RBBBR.......',
  '....RR..RR......',
  '...Rb...bR......',
  '................',
  '................',
]

const ARCHER_LEFT_IDLE: readonly string[] = [
  '................',
  '......HH........',
  '....RRRRR.......',
  '...RWRRRR.......',
  '...RPRRRR.......',
  '..ARRRRRR.......',  // bow arc (A) at front
  '..ARRRRRRR......',  // bow curve
  '..ARRRRRR.......',  // bow arc
  '..ARRRRRR.......',  // bow arc
  '..ARRRrrr.......',  // bow base
  '...RRBBBR.......',
  '....RBBBR.......',
  '....RR.RR.......',
  '....Rb.bR.......',
  '................',
  '................',
]

const ARCHER_LEFT_WALK: readonly string[] = [
  '................',
  '......HH........',
  '....RRRRR.......',
  '...RWRRRR.......',
  '...RPRRRR.......',
  '..ARRRRRR.......',
  '..ARRRRRRR......',
  '..ARRRRRR.......',
  '..ARRRRRR.......',
  '..ARRRrrr.......',
  '...RRBBBR.......',
  '....RBBBR.......',
  '....RR..RR......',
  '...Rb...bR......',
  '................',
  '................',
]

// --- Lynel canvas helpers ---

function createSizedCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function drawPixelArtScaled(
  ctx: CanvasRenderingContext2D,
  data: readonly string[],
  colorMap: Record<string, string>,
  scale: number,
): void {
  for (let y = 0; y < data.length; y++) {
    const row = data[y]!
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.') continue
      const color = colorMap[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
}

const LYNEL_RENDER_SCALE = 3  // 16×16 grid × 3 = 48px

function renderLynelSprite(data: readonly string[]): CachedSprite {
  const canvas = createSizedCanvas(LYNEL_SPRITE_SIZE)
  const ctx = canvas.getContext('2d')!
  drawPixelArtScaled(ctx, data, LYNEL_PIXEL_COLORS, LYNEL_RENDER_SCALE)
  return canvas
}

function renderArcherSprite(data: readonly string[]): CachedSprite {
  const canvas = createCanvas()
  const ctx = canvas.getContext('2d')!
  drawPixelArtScaled(ctx, data, ARCHER_COLORS, SCALE)
  return canvas
}

function flipHorizontalSized(sprite: CachedSprite, size: number): CachedSprite {
  const canvas = createSizedCanvas(size)
  const ctx = canvas.getContext('2d')!
  ctx.save()
  ctx.translate(size, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(sprite, 0, 0)
  ctx.restore()
  return canvas
}

// --- Lynel sprite cache ---

export interface LynelSprites {
  idle: Record<Direction, CachedSprite>
  walk: Record<Direction, [CachedSprite, CachedSprite]>
}

export interface ArcherSprites {
  idle: Record<Direction, CachedSprite>
  walk: Record<Direction, [CachedSprite, CachedSprite]>
}

let lynelSpritesCache: LynelSprites | null = null
let lynelAnimsCache: AnimationMap | null = null
let archerSpritesCache: ArcherSprites | null = null
let archerAnimsCache: AnimationMap | null = null

function createLynelSprites(): LynelSprites {
  const downIdle = renderLynelSprite(LYNEL_DOWN_IDLE)
  const downWalk = renderLynelSprite(LYNEL_DOWN_WALK)
  const upIdle = renderLynelSprite(LYNEL_UP_IDLE)
  const upWalk = renderLynelSprite(LYNEL_UP_WALK)
  const leftIdle = renderLynelSprite(LYNEL_LEFT_IDLE)
  const leftWalk = renderLynelSprite(LYNEL_LEFT_WALK)
  const rightIdle = flipHorizontalSized(leftIdle, LYNEL_SPRITE_SIZE)
  const rightWalk = flipHorizontalSized(leftWalk, LYNEL_SPRITE_SIZE)

  return {
    idle: { down: downIdle, up: upIdle, left: leftIdle, right: rightIdle },
    walk: {
      down: [downIdle, downWalk],
      up: [upIdle, upWalk],
      left: [leftIdle, leftWalk],
      right: [rightIdle, rightWalk],
    },
  }
}

export function getLynelSprites(): LynelSprites {
  if (!lynelSpritesCache) {
    lynelSpritesCache = createLynelSprites()
  }
  return lynelSpritesCache
}

export function getLynelAnimations(): AnimationMap {
  if (!lynelAnimsCache) {
    const sprites = getLynelSprites()
    const directions: Direction[] = ['up', 'down', 'left', 'right']

    const idle: Partial<Record<Direction, AnimationDef>> = {}
    const walk: Partial<Record<Direction, AnimationDef>> = {}

    for (const dir of directions) {
      idle[dir] = {
        frames: [toSpriteFrame(sprites.idle[dir])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
      walk[dir] = {
        frames: [toSpriteFrame(sprites.walk[dir][0]), toSpriteFrame(sprites.walk[dir][1])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
    }

    lynelAnimsCache = { idle, walk }
  }
  return lynelAnimsCache
}

function createArcherSprites(): ArcherSprites {
  const downIdle = renderArcherSprite(ARCHER_DOWN_IDLE)
  const downWalk = renderArcherSprite(ARCHER_DOWN_WALK)
  const upIdle = renderArcherSprite(ARCHER_UP_IDLE)
  const upWalk = renderArcherSprite(ARCHER_UP_WALK)
  const leftIdle = renderArcherSprite(ARCHER_LEFT_IDLE)
  const leftWalk = renderArcherSprite(ARCHER_LEFT_WALK)
  const rightIdle = flipHorizontal(leftIdle)
  const rightWalk = flipHorizontal(leftWalk)

  return {
    idle: { down: downIdle, up: upIdle, left: leftIdle, right: rightIdle },
    walk: {
      down: [downIdle, downWalk],
      up: [upIdle, upWalk],
      left: [leftIdle, leftWalk],
      right: [rightIdle, rightWalk],
    },
  }
}

export function getBokoblinArcherSprites(): ArcherSprites {
  if (!archerSpritesCache) {
    archerSpritesCache = createArcherSprites()
  }
  return archerSpritesCache
}

export function getBokoblinArcherAnimations(): AnimationMap {
  if (!archerAnimsCache) {
    const sprites = getBokoblinArcherSprites()
    const directions: Direction[] = ['up', 'down', 'left', 'right']

    const idle: Partial<Record<Direction, AnimationDef>> = {}
    const walk: Partial<Record<Direction, AnimationDef>> = {}

    for (const dir of directions) {
      idle[dir] = {
        frames: [toSpriteFrame(sprites.idle[dir])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
      walk[dir] = {
        frames: [toSpriteFrame(sprites.walk[dir][0]), toSpriteFrame(sprites.walk[dir][1])],
        frameDuration: WALK_FRAME_DURATION,
        loop: true,
      }
    }

    archerAnimsCache = { idle, walk }
  }
  return archerAnimsCache
}

// ────────────────────────────────────────────────────────────────────
// Stage 2 — Effect Drawing Functions
// ────────────────────────────────────────────────────────────────────

/**
 * Draw a lingering fire tile at world position (x, y).
 * progress: 0 = fresh fire (full alpha), 1 = nearly expired (transparent).
 */
export function drawFireTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
): void {
  const alpha = 0.85 * (1 - progress * 0.6)
  ctx.save()
  ctx.globalAlpha = alpha

  // Outer glow — large orange
  const cx = x + 16
  const cy = y + 16
  const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18)
  gradient.addColorStop(0, '#FF6600')
  gradient.addColorStop(0.5, '#FF3300')
  gradient.addColorStop(1, 'rgba(255,100,0,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, Math.PI * 2)
  ctx.fill()

  // Inner bright core
  ctx.globalAlpha = alpha * 0.8
  ctx.fillStyle = '#FFEE00'
  ctx.beginPath()
  ctx.arc(cx, cy + 2, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * Draw a floating heart pickup at world position (x, y).
 * floatOffset: a value (e.g. sin of floatTimer) that offsets y for bobbing animation.
 */
export function drawHeartPickup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  floatOffset: number,
): void {
  const cx = x + 16
  const cy = y + 16 + floatOffset * 4

  ctx.save()

  // Shadow
  ctx.globalAlpha = 0.25
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.ellipse(cx, y + 30, 8, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1

  // Heart shape using bezier curves
  ctx.fillStyle = '#EF4444'
  ctx.beginPath()
  ctx.moveTo(cx, cy + 7)
  ctx.bezierCurveTo(cx, cy + 4, cx - 4, cy - 2, cx - 8, cy - 2)
  ctx.bezierCurveTo(cx - 12, cy - 2, cx - 12, cy + 4, cx - 12, cy + 4)
  ctx.bezierCurveTo(cx - 12, cy + 8, cx - 8, cy + 12, cx, cy + 16)
  ctx.bezierCurveTo(cx + 8, cy + 12, cx + 12, cy + 8, cx + 12, cy + 4)
  ctx.bezierCurveTo(cx + 12, cy + 4, cx + 12, cy - 2, cx + 8, cy - 2)
  ctx.bezierCurveTo(cx + 4, cy - 2, cx, cy + 4, cx, cy + 7)
  ctx.fill()

  // Highlight
  ctx.fillStyle = '#FFFFFF'
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.ellipse(cx - 4, cy + 2, 3, 2, -0.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * Draw a charge windup telegraph effect around the Lynel (x, y = center).
 * progress: 0 = just started, 1 = charge imminent.
 */
export function drawChargeWindup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
): void {
  const numParticles = 6
  const radius = 28 + progress * 12

  ctx.save()
  ctx.globalAlpha = progress * 0.8

  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2 + progress * Math.PI * 2
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    const size = 3 + progress * 3

    ctx.fillStyle = i % 2 === 0 ? '#FFB830' : '#FF6B4A'
    ctx.beginPath()
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Inner ring pulsing
  ctx.globalAlpha = progress * 0.4
  ctx.strokeStyle = '#FF6B4A'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, radius - 6, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

/**
 * Draw Lynel fire breath cone.
 * cx, cy: Lynel center position. angle: direction in radians. range: cone reach. halfAngle: half cone width in radians.
 */
export function drawFireBreathCone(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  range: number,
  halfAngle: number,
): void {
  ctx.save()

  // Clip to the cone shape
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, range, angle - halfAngle, angle + halfAngle)
  ctx.closePath()
  ctx.clip()

  // Fire gradient filling the cone
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, range)
  gradient.addColorStop(0, 'rgba(255,230,100,0.95)')
  gradient.addColorStop(0.3, 'rgba(255,120,0,0.85)')
  gradient.addColorStop(0.7, 'rgba(220,50,0,0.6)')
  gradient.addColorStop(1, 'rgba(180,30,0,0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, range, angle - halfAngle, angle + halfAngle)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

/**
 * Draw the Lynel boss health bar at the bottom-center of the canvas.
 * hp: current HP. maxHP: maximum HP. name: displayed boss name.
 */
export function drawBossHealthBar(
  ctx: CanvasRenderingContext2D,
  hp: number,
  maxHP: number,
  name: string,
): void {
  const canvasW = ctx.canvas.width
  const canvasH = ctx.canvas.height

  const barW = Math.min(360, canvasW * 0.6)
  const barH = 14
  const barX = (canvasW - barW) / 2
  const barY = canvasH - 36

  ctx.save()

  // Dark backdrop
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(barX - 8, barY - 24, barW + 16, barH + 34)

  // Boss name
  ctx.fillStyle = '#FFB830'
  ctx.font = 'bold 13px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(name, canvasW / 2, barY - 8)

  // Bar background
  ctx.fillStyle = '#374151'
  ctx.fillRect(barX, barY, barW, barH)

  // HP fill — colour shifts red as HP drops
  const ratio = Math.max(0, hp / maxHP)
  const r = Math.round(220 - ratio * 40)
  const g = Math.round(ratio * 80)
  ctx.fillStyle = `rgb(${r},${g},0)`
  ctx.fillRect(barX, barY, barW * ratio, barH)

  // Border
  ctx.strokeStyle = '#F0EDE6'
  ctx.lineWidth = 1.5
  ctx.strokeRect(barX, barY, barW, barH)

  // HP text
  ctx.fillStyle = '#F0EDE6'
  ctx.font = '11px monospace'
  ctx.fillText(`${hp} / ${maxHP}`, canvasW / 2, barY + barH + 12)

  ctx.textAlign = 'start'
  ctx.restore()
}

// ────────────────────────────────────────────────────────────────────
// Stage 3 — Ganon Sprites & Effects
// ────────────────────────────────────────────────────────────────────

function directionToAngle(dir: Direction): number {
  switch (dir) {
    case 'right': return 0
    case 'down': return Math.PI / 2
    case 'left': return Math.PI
    case 'up': return -Math.PI / 2
  }
}

export interface GanonSprites {
  idle: Record<Direction, CachedSprite>
  walk: Record<Direction, [CachedSprite, CachedSprite]>
}

let ganonSpritesCache: GanonSprites | null = null
let ganonAnimsCache: AnimationMap | null = null

function createGanonSprite(direction: Direction, frameIndex: number): CachedSprite {
  const canvas = document.createElement('canvas')
  canvas.width = GANON_SPRITE_SIZE
  canvas.height = GANON_SPRITE_SIZE
  const ctx = canvas.getContext('2d')!

  const cx = GANON_SPRITE_SIZE / 2
  const cy = GANON_SPRITE_SIZE / 2
  const bob = frameIndex % 2 === 0 ? 0 : 2

  ctx.save()

  // Cape (Behind)
  if (direction !== 'down') {
    ctx.fillStyle = '#1A0A2E' // Deep purple
    ctx.beginPath()
    if (direction === 'up') {
      ctx.moveTo(cx - 14, cy + 10)
      ctx.lineTo(cx + 14, cy + 10)
      ctx.lineTo(cx + 18, cy + 24)
      ctx.lineTo(cx - 18, cy + 24)
    } else {
      // Side view cape
      ctx.moveTo(cx - 6, cy + 10)
      ctx.lineTo(cx + 6, cy + 10)
      ctx.lineTo(cx + 10, cy + 24)
      ctx.lineTo(cx - 8, cy + 24)
    }
    ctx.fill()
  }

  // Body / Armor
  ctx.fillStyle = '#1E1E2E' // Charcoal
  ctx.fillRect(cx - 10, cy - 4 + bob, 20, 24)

  // Shoulders
  ctx.fillStyle = '#2D1B4E'
  ctx.fillRect(cx - 14, cy - 8 + bob, 28, 8)

  // Head / Helmet
  ctx.fillStyle = '#2D1B4E' // Dark purple
  ctx.fillRect(cx - 10, cy - 20 + bob, 20, 18)

  // Horns (Gold)
  ctx.fillStyle = '#D4A574'
  if (direction === 'left' || direction === 'right') {
    const dir = direction === 'left' ? -1 : 1
    ctx.beginPath()
    ctx.moveTo(cx + 4 * dir, cy - 18 + bob)
    ctx.quadraticCurveTo(cx + 12 * dir, cy - 26 + bob, cx + 16 * dir, cy - 22 + bob)
    ctx.lineTo(cx + 8 * dir, cy - 14 + bob)
    ctx.fill()
  } else {
    // Front/Back horns
    ctx.beginPath()
    ctx.moveTo(cx - 8, cy - 18 + bob)
    ctx.quadraticCurveTo(cx - 16, cy - 26 + bob, cx - 20, cy - 22 + bob)
    ctx.lineTo(cx - 10, cy - 14 + bob)
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(cx + 8, cy - 18 + bob)
    ctx.quadraticCurveTo(cx + 16, cy - 26 + bob, cx + 20, cy - 22 + bob)
    ctx.lineTo(cx + 10, cy - 14 + bob)
    ctx.fill()
  }

  // Face / Eyes
  if (direction !== 'up') {
    ctx.fillStyle = '#FF3333' // Red glowing eyes
    if (direction === 'down') {
      ctx.fillRect(cx - 6, cy - 14 + bob, 4, 2)
      ctx.fillRect(cx + 2, cy - 14 + bob, 4, 2)
    } else { // side
      const dir = direction === 'left' ? -1 : 1
      ctx.fillRect(cx + 4 * dir, cy - 14 + bob, 4, 2)
    }
  }

  // Cape (Front - for Down view)
  if (direction === 'down') {
    ctx.fillStyle = '#1A0A2E'
    ctx.fillRect(cx - 8, cy + 4 + bob, 16, 20)
    // Gold clasp
    ctx.fillStyle = '#D4A574'
    ctx.beginPath()
    ctx.arc(cx, cy + 4 + bob, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
  return canvas
}

function createGanonSprites(): GanonSprites {
  return {
    idle: {
      down: createGanonSprite('down', 0),
      up: createGanonSprite('up', 0),
      left: createGanonSprite('left', 0),
      right: createGanonSprite('right', 0),
    },
    walk: {
      down: [createGanonSprite('down', 0), createGanonSprite('down', 1)],
      up: [createGanonSprite('up', 0), createGanonSprite('up', 1)],
      left: [createGanonSprite('left', 0), createGanonSprite('left', 1)],
      right: [createGanonSprite('right', 0), createGanonSprite('right', 1)],
    },
  }
}

export function getGanonSprites(): GanonSprites {
  if (!ganonSpritesCache) {
    ganonSpritesCache = createGanonSprites()
  }
  return ganonSpritesCache
}

export function getGanonAnimations(): AnimationMap {
  if (!ganonAnimsCache) {
    const sprites = getGanonSprites()
    const directions: Direction[] = ['up', 'down', 'left', 'right']

    const idle: Partial<Record<Direction, AnimationDef>> = {}
    const walk: Partial<Record<Direction, AnimationDef>> = {}

    for (const dir of directions) {
      idle[dir] = {
        frames: [toSpriteFrame(sprites.idle[dir])],
        frameDuration: 0.5,
        loop: true,
      }
      walk[dir] = {
        frames: [toSpriteFrame(sprites.walk[dir][0]), toSpriteFrame(sprites.walk[dir][1])],
        frameDuration: 0.2,
        loop: true,
      }
    }
    ganonAnimsCache = { idle, walk }
  }
  return ganonAnimsCache
}

export function drawDarkOrb(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number,
  reflected: boolean,
): void {
  ctx.save()
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
  gradient.addColorStop(0, reflected ? 'rgba(147, 197, 253, 0.8)' : 'rgba(91, 33, 182, 0.8)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4)
  
  ctx.fillStyle = reflected ? '#93C5FD' : '#7C3AED'
  ctx.beginPath()
  ctx.arc(x, y, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawDarkSlashArc(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  direction: Direction,
  progress: number,
  range: number,
): void {
  const baseAngle = directionToAngle(direction)
  const halfArc = (GANON_DARK_SLASH_ARC / 2) * (Math.PI / 180)
  const startAngle = baseAngle - halfArc
  const endAngle = baseAngle + halfArc
  const alpha = 1 - progress * 0.7

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#9333EA'
  ctx.lineWidth = 4 + progress * 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, range * progress, startAngle, endAngle)
  ctx.stroke()
  ctx.restore()
}

export function drawGroundSlamCharge(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  maxRadius: number,
  progress: number,
): void {
  const radius = maxRadius * progress
  const pulseAlpha = 0.2 + Math.sin(progress * Math.PI * 6) * 0.1

  ctx.save()
  ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + pulseAlpha})`
  ctx.lineWidth = 2
  ctx.stroke()
  
  ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * progress})`
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawGroundSlamImpact(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  progress: number,
): void {
  const radius = GROUND_SLAM_RADIUS * 1.5 * progress
  const alpha = 1 - progress

  ctx.save()
  ctx.strokeStyle = `rgba(255, ${Math.floor(200 * (1 - progress))}, ${Math.floor(100 * (1 - progress))}, ${alpha})`
  ctx.lineWidth = 3 * (1 - progress) + 1
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function drawTeleportSmoke(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  progress: number,
  entitySize: number,
): void {
  const particleCount = 10
  const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2

  ctx.save()
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const dist = entitySize * 0.5 * progress + Math.sin(i * 1.7) * 8
    const px = x + Math.cos(angle) * dist
    const py = y + Math.sin(angle) * dist
    const size = 3 + Math.sin(i * 2.3) * 2

    ctx.fillStyle = `rgba(76, 29, 149, ${alpha * 0.7})`
    ctx.beginPath()
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function drawPillarShockwave(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  progress: number,
): void {
  const radius = PILLAR_SHOCKWAVE_RADIUS * progress
  const alpha = 1 - progress

  ctx.save()
  ctx.strokeStyle = `rgba(100, 100, 120, ${alpha})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + progress * 0.5
    const dist = radius * 0.8
    const px = x + Math.cos(angle) * dist
    const py = y + Math.sin(angle) * dist
    ctx.fillStyle = `rgba(61, 61, 80, ${alpha})`
    ctx.fillRect(px - 2, py - 2, 4, 4)
  }
  ctx.restore()
}

export function drawCrystalPrison(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
): void {
  ctx.save()
  ctx.fillStyle = '#6366F1'
  ctx.beginPath()
  ctx.moveTo(x, y - 16)
  ctx.lineTo(x + 12, y)
  ctx.lineTo(x, y + 16)
  ctx.lineTo(x - 12, y)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(147, 197, 253, 0.4)'
  ctx.beginPath()
  ctx.moveTo(x, y - 10)
  ctx.lineTo(x + 7, y)
  ctx.lineTo(x, y + 10)
  ctx.lineTo(x - 7, y)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#312E81'
  ctx.fillRect(x - 2, y - 6, 4, 8)
  ctx.fillRect(x - 3, y - 8, 6, 4)
  ctx.restore()
}

export function drawCrystalShatter(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  progress: number,
): void {
  const fragmentCount = 8
  const colors = ['#3B82F6', '#7C3AED', '#A78BFA', '#93C5FD', '#6366F1', '#818CF8', '#C4B5FD', '#DBEAFE']

  ctx.save()
  for (let i = 0; i < fragmentCount; i++) {
    const angle = (i / fragmentCount) * Math.PI * 2
    const dist = progress * 80
    const px = x + Math.cos(angle) * dist
    const py = y + Math.sin(angle) * dist - progress * 20
    const size = 4 * (1 - progress * 0.5)
    const alpha = 1 - progress

    ctx.fillStyle = colors[i]!
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(px, py - size)
    ctx.lineTo(px + size, py + size)
    ctx.lineTo(px - size, py + size)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

export function drawGanonDissolve(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  entitySize: number,
  progress: number,
): void {
  if (progress < 0.7) {
    ctx.save()
    ctx.globalAlpha = 1 - progress * 1.2
    ctx.restore()
  }

  const particleCount = Math.floor(progress * 30)
  ctx.save()
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 73.13
    const angle = (seed % (Math.PI * 2))
    const dist = progress * 60 * (0.5 + (seed % 1))
    const px = x + Math.cos(angle) * dist * 0.5
    const py = y - progress * 40 + Math.sin(angle) * dist * 0.3
    const size = 3 * (1 - progress * 0.5)
    const alpha = (1 - progress) * 0.8

    ctx.fillStyle = `rgba(45, 27, 78, ${alpha})`
    ctx.fillRect(px - size / 2, py - size / 2, size, size)
  }
  ctx.restore()
}

export function drawDarkEnergyParticles(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number },
  time: number,
): void {
  const particleCount = 18
  ctx.save()
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.508
    const px = bounds.x + (Math.sin(seed) * 0.5 + 0.5) * bounds.width
    const py = bounds.y + ((seed * 0.618 + time * 10) % bounds.height)
    const size = 2 + Math.sin(seed + time) * 1
    const alpha = 0.2 + Math.sin(seed * 2 + time * 0.5) * 0.15

    ctx.fillStyle = `rgba(76, 29, 149, ${alpha})`
    ctx.fillRect(px - size / 2, py - size / 2, size, size)
  }
  ctx.restore()
}
