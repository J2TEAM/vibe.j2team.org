<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { Platform, Particle, FloatingText, Monster, MonsterType, Player, Chest, ItemType, ItemEffect, WeaponType, WeaponDrop } from './types'
import { getBiomeConfig, getBiomeForLevel } from './biomes'
import { createChest, drawChest, ITEM_COLORS, ITEM_NAMES, ITEM_DURATIONS } from './items'
import { saveScore, isHighScore, drawLeaderboard } from './leaderboard'
import { sfxAttack, sfxHit, sfxKill, sfxPlayerHurt, sfxJump, sfxLevelUp, sfxChestOpen, sfxItem, sfxGameOver, sfxMenuSelect, initAudio } from './sound'
import { WEAPONS, createWeaponDrop, drawWeaponDrop, drawInventory } from './weapons'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameState = ref<'menu' | 'playing' | 'gameover'>('menu')
const score = ref(0)
const level = ref(1)
const playerHp = ref(100)
const playerMaxHp = ref(100)
const playerExp = ref(0)
const playerExpMax = ref(50)
const combo = ref(0)
const killCount = ref(0)
const showInventory = ref(false)

let animationId = 0
let ctx: CanvasRenderingContext2D | null = null
let W = 960
let H = 540

const keys: Record<string, boolean> = {}
const keyJustPressed: Record<string, boolean> = {}
function onKeyDown(e: KeyboardEvent) {
  if (!keys[e.code]) keyJustPressed[e.code] = true
  keys[e.code] = true
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
  if (e.code === 'Enter' || e.code === 'Space') initAudio()
  // Inventory toggle
  if (e.code === 'KeyB' && gameState.value === 'playing') showInventory.value = !showInventory.value
  // Quick equip 1-6
  if (gameState.value === 'playing') {
    const weaponKeys: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']
    for (let i = 0; i < 6; i++) {
      if (e.code === `Digit${i + 1}` && inventory.includes(weaponKeys[i])) {
        player.weapon = weaponKeys[i]
        sfxItem()
        spawnFloatingText(player.x + player.w / 2, player.y - 20, WEAPONS[weaponKeys[i]].name, WEAPONS[weaponKeys[i]].color, 14)
      }
    }
  }
}
function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }

const camera = { x: 0, y: 0 }
const GRAVITY = 0.5
const MAP_WIDTH = 3200
const particles: Particle[] = []
const floatingTexts: FloatingText[] = []
const platforms: Platform[] = []
const monsters: Monster[] = []
const chests: Chest[] = []
const weaponDrops: WeaponDrop[] = []
const inventory: WeaponType[] = ['sword']
const activeEffects: ItemEffect[] = []

let spawnTimer = 0
let spawnRate = 200
let maxMonsters = 5
let chestSpawnTimer = 0
let scoreSaved = false
let menuReady = 0
let invSelectedIdx = 0

// ===== PLAYER =====
const player: Player = {
  x: 100, y: H - 100, vx: 0, vy: 0, w: 28, h: 40,
  speed: 3.5, jumpPower: -10, onGround: false, facing: 1,
  attacking: false, attackTimer: 0, attackCooldown: 0, attackFrame: 0,
  invincible: 0, animFrame: 0, animTimer: 0, state: 'idle',
  baseAtk: 15, atkBoost: 0, speedBoost: 0, shield: 0,
  jumpCount: 0, maxJumps: 2, weapon: 'sword',
}

function resetPlayer() {
  Object.assign(player, {
    x: 100, y: H - 100, vx: 0, vy: 0, onGround: false,
    attacking: false, attackTimer: 0, attackCooldown: 0,
    invincible: 180, state: 'idle', facing: 1,
    baseAtk: 15, atkBoost: 0, speedBoost: 0, shield: 0,
    speed: 3.5, animFrame: 0, jumpCount: 0, weapon: 'sword',
  })
  playerHp.value = 100; playerMaxHp.value = 100
  playerExp.value = 0; level.value = 1
  score.value = 0; combo.value = 0; killCount.value = 0
  playerExpMax.value = 50
  inventory.length = 0; inventory.push('sword')
  weaponDrops.length = 0
  showInventory.value = false
}

function spawnParticles(x: number, y: number, color: string, count: number, spread = 3) {
  for (let i = 0; i < count; i++)
    particles.push({ x, y, vx: (Math.random() - 0.5) * spread, vy: (Math.random() - 0.8) * spread, life: 30 + Math.random() * 20, maxLife: 50, color, size: 2 + Math.random() * 3 })
}
function spawnFloatingText(x: number, y: number, text: string, color: string, size = 16) {
  floatingTexts.push({ x, y, text, color, life: 60, vy: -1.5, size })
}

// ===== MAP =====
function generateMap() {
  platforms.length = 0
  platforms.push({ x: 0, y: H - 48, w: MAP_WIDTH, h: 48, type: 'ground' })
  for (let i = 1; i < 8; i++)
    platforms.push({ x: 200 + i * 350 + Math.random() * 100, y: H - 140 - Math.random() * 80, w: 96 + Math.random() * 64, h: 16, type: 'floating' })
  for (let i = 0; i < 4; i++)
    platforms.push({ x: 400 + i * 700 + Math.random() * 100, y: H - 240 - Math.random() * 60, w: 80 + Math.random() * 48, h: 16, type: 'floating' })
}

// ===== MONSTERS =====
function createMonster(type: MonsterType, x: number): Monster {
  const cfg: Record<MonsterType, { w: number; h: number; hp: number; speed: number; damage: number; exp: number; score: number; color: string; flying: boolean }> = {
    slime: { w: 24, h: 20, hp: 30, speed: 1, damage: 8, exp: 15, score: 100, color: '#4ade80', flying: false },
    skeleton: { w: 26, h: 38, hp: 60, speed: 1.8, damage: 15, exp: 30, score: 200, color: '#e2e8f0', flying: false },
    demon: { w: 30, h: 42, hp: 100, speed: 2.2, damage: 25, exp: 50, score: 350, color: '#f87171', flying: false },
    boss: { w: 48, h: 56, hp: 300, speed: 1.5, damage: 40, exp: 150, score: 1000, color: '#a855f7', flying: false },
    bat: { w: 22, h: 18, hp: 25, speed: 2.5, damage: 10, exp: 20, score: 150, color: '#8b5cf6', flying: true },
    ghost: { w: 26, h: 30, hp: 45, speed: 1.6, damage: 18, exp: 35, score: 250, color: '#c4b5fd', flying: true },
  }
  const biome = getBiomeForLevel(level.value)
  const c = cfg[type]
  if (biome === 'desert' && type === 'slime') c.color = '#d4a44a'
  else if (biome === 'ice' && type === 'slime') c.color = '#93c5fd'
  else if (biome === 'volcano' && type === 'slime') c.color = '#fb923c'

  const isFlying = c.flying
  return {
    x, y: isFlying ? H - 200 - Math.random() * 120 : H - 100,
    vx: 0, vy: 0, w: c.w, h: c.h,
    hp: c.hp + level.value * 5, maxHp: c.hp + level.value * 5,
    type, speed: c.speed + level.value * 0.1,
    damage: c.damage + level.value * 2,
    exp: c.exp, scoreValue: c.score,
    onGround: false, facing: -1,
    animFrame: 0, animTimer: 0,
    attackTimer: 0, attackCooldown: 60,
    state: 'chase', hurtTimer: 0,
    color: c.color, dead: false, flying: isFlying,
  }
}

function spawnMonster() {
  if (monsters.length >= maxMonsters) return
  const types: MonsterType[] = ['slime', 'slime', 'slime']
  if (level.value >= 2) types.push('skeleton', 'bat')
  if (level.value >= 3) types.push('skeleton', 'demon', 'bat', 'bat')
  if (level.value >= 4) types.push('ghost', 'ghost')
  if (level.value >= 5) types.push('demon', 'demon', 'ghost')
  if (level.value >= 7 && !monsters.some(m => m.type === 'boss')) types.push('boss')
  const type = types[Math.floor(Math.random() * types.length)]
  const side = Math.random() > 0.5 ? 1 : -1
  monsters.push(createMonster(type, side > 0 ? camera.x + W + 100 : camera.x - 100))
}

// ===== COLLISION =====
function rectCollide(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
function resolveGravity(e: { x: number; y: number; vx: number; vy: number; w: number; h: number; onGround: boolean }) {
  e.vy += GRAVITY; e.y += e.vy; e.x += e.vx; e.onGround = false
  for (const p of platforms) {
    if (e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h > p.y && e.y + e.h < p.y + p.h + 10 && e.vy >= 0) {
      e.y = p.y - e.h; e.vy = 0; e.onGround = true
    }
  }
  if (e.x < 0) e.x = 0
  if (e.x + e.w > MAP_WIDTH) e.x = MAP_WIDTH - e.w
}

// ===== DRAW CHARACTER (improved) =====
function drawPixelChar(x: number, y: number, f: 1 | -1, state: string, frame: number, isInv: boolean) {
  if (!ctx) return
  if (isInv && Math.floor(Date.now() / 80) % 2 === 0) return
  const cx = x - camera.x, cy = y - camera.y, w = player.w, h = player.h
  ctx.save()
  if (f < 0) { ctx.translate(cx + w, cy); ctx.scale(-1, 1) } else { ctx.translate(cx, cy) }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(w / 2, h + 2, 12, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Cape/scarf flowing
  const capeWave = Math.sin(Date.now() * 0.008 + frame * 0.3) * 4
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.moveTo(8, 12)
  ctx.quadraticCurveTo(4 + capeWave, 26, 2 + capeWave * 1.5, h - 4)
  ctx.lineTo(12, h - 8)
  ctx.lineTo(14, 12)
  ctx.fill()

  // Body
  const bodyColor = player.shield > 0 ? '#7c3aed' : '#2563eb'
  ctx.fillStyle = bodyColor
  ctx.fillRect(6, 14, w - 12, h - 22)
  // Belt
  ctx.fillStyle = '#92400e'
  ctx.fillRect(6, 24, w - 12, 3)
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(w / 2 - 2, 23, 4, 5) // buckle

  // Arms
  const armSwing = state === 'run' ? Math.sin(frame * 0.4) * 6 : 0
  ctx.fillStyle = '#1d4ed8'
  ctx.fillRect(2, 16 + armSwing, 5, 10)
  ctx.fillRect(w - 7, 16 - armSwing, 5, 10)
  // Hands (skin)
  ctx.fillStyle = '#fcd9b6'
  ctx.fillRect(1, 24 + armSwing, 5, 4)
  ctx.fillRect(w - 6, 24 - armSwing, 5, 4)

  // Head
  ctx.fillStyle = '#fcd9b6'
  ctx.fillRect(6, 0, w - 12, 14)
  // Hair
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(6, 0, w - 12, 4)
  ctx.fillRect(4, 2, 3, 3)
  // Headband
  ctx.fillStyle = '#ef4444'
  ctx.fillRect(4, 4, w - 8, 3)
  // Headband tail (flowing)
  const tailWave = Math.sin(Date.now() * 0.01) * 3
  ctx.fillRect(-3, 4, 7, 2)
  ctx.fillRect(-6 + tailWave, 5, 5, 2)
  ctx.fillRect(-8 + tailWave * 1.3, 6, 4, 1)

  // Eyes
  const blinkOpen = Math.floor(Date.now() / 3000) % 15 !== 0
  ctx.fillStyle = '#1a1a2e'
  if (blinkOpen) {
    ctx.fillRect(9, 8, 3, 3)
    ctx.fillRect(16, 8, 3, 3)
    // Eye shine
    ctx.fillStyle = '#fff'
    ctx.fillRect(10, 8, 1, 1)
    ctx.fillRect(17, 8, 1, 1)
  } else {
    ctx.fillRect(9, 9, 3, 1)
    ctx.fillRect(16, 9, 3, 1)
  }
  // Mouth
  ctx.fillStyle = '#b45a3a'
  ctx.fillRect(12, 12, 4, 1)

  // Legs
  const legOff = state === 'run' ? Math.sin(frame * 0.5) * 5 : 0
  ctx.fillStyle = '#1e3a5f'
  ctx.fillRect(8, h - 10, 5, 10 + legOff)
  ctx.fillRect(w - 13, h - 10, 5, 10 - legOff)
  // Shoes
  ctx.fillStyle = '#3b2a1a'
  ctx.fillRect(7, h - 2 + legOff, 7, 3)
  ctx.fillRect(w - 14, h - 2 - legOff, 7, 3)

  // Weapon
  if (state === 'attack') {
    ctx.save()
    ctx.translate(w - 2, 14)
    ctx.rotate(-0.8 + frame * 0.35)
    // Blade
    const bladGrad = ctx.createLinearGradient(0, 0, 32, 0)
    bladGrad.addColorStop(0, '#94a3b8')
    bladGrad.addColorStop(0.5, '#e2e8f0')
    bladGrad.addColorStop(1, '#94a3b8')
    ctx.fillStyle = bladGrad
    ctx.fillRect(0, -2, 32, 3)
    // Edge glow
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillRect(4, -2, 28, 1)
    // Guard
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(-3, -4, 7, 7)
    // Handle
    ctx.fillStyle = '#92400e'
    ctx.fillRect(-8, -2, 6, 3)
    ctx.restore()
    // Slash trail effect
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(w + 8, 16, 20 + frame * 2, -1.2, 0.8)
    ctx.stroke()
  } else {
    // Sword on back
    ctx.fillStyle = '#64748b'
    ctx.fillRect(w - 4, -6, 2, 22)
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(w - 5, 14, 4, 3)
  }

  // Shield glow
  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(168,85,247,${0.3 + Math.sin(Date.now() * 0.005) * 0.2})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, w / 2 + 6, h / 2 + 4, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

function drawMonster(m: Monster) {
  if (!ctx) return
  const cx = m.x - camera.x, cy = m.y - camera.y
  if (cx + m.w < -50 || cx > W + 50) return
  ctx.save()
  if (m.facing < 0) { ctx.translate(cx + m.w, cy); ctx.scale(-1, 1) } else { ctx.translate(cx, cy) }
  if (m.hurtTimer > 0) ctx.globalAlpha = 0.6 + Math.sin(m.hurtTimer) * 0.4

  if (m.type === 'slime') {
    const squash = 1 + Math.sin(m.animFrame * 0.15) * 0.1
    ctx.fillStyle = m.color
    ctx.beginPath()
    ctx.ellipse(m.w / 2, m.h - 4, m.w / 2 * squash, m.h / 2 / squash, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(6, m.h / 2 - 6, 3, 4)
    ctx.fillRect(m.w - 10, m.h / 2 - 6, 3, 4)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(8, m.h / 2 - 10, 4, 3)
  } else if (m.type === 'skeleton') {
    ctx.fillStyle = m.color
    ctx.fillRect(6, 6, m.w - 12, 14)
    ctx.fillRect(8, 20, m.w - 16, 12)
    ctx.fillStyle = '#94a3b8'
    for (let i = 0; i < 3; i++) ctx.fillRect(9, 22 + i * 3, m.w - 18, 1)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(9, 10, 3, 3); ctx.fillRect(m.w - 13, 10, 3, 3)
    const lOff = Math.sin(m.animFrame * 0.2) * 3
    ctx.fillStyle = m.color
    ctx.fillRect(8, 32, 4, 6 + lOff); ctx.fillRect(m.w - 12, 32, 4, 6 - lOff)
    ctx.fillStyle = '#64748b'
    ctx.fillRect(m.w - 4, 14, 3, 20)
  } else if (m.type === 'demon') {
    ctx.fillStyle = m.color; ctx.fillRect(4, 8, m.w - 8, m.h - 12)
    ctx.fillStyle = '#7f1d1d'; ctx.fillRect(4, 0, 4, 10); ctx.fillRect(m.w - 8, 0, 4, 10)
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(10, 14, 4, 4); ctx.fillRect(m.w - 14, 14, 4, 4)
    ctx.fillStyle = 'rgba(248,113,113,0.5)'; ctx.fillRect(-8, 12, 12, 16); ctx.fillRect(m.w - 4, 12, 12, 16)
    ctx.fillStyle = '#991b1b'; ctx.fillRect(8, m.h - 6, 6, 6); ctx.fillRect(m.w - 14, m.h - 6, 6, 6)
  } else if (m.type === 'boss') {
    ctx.fillStyle = m.color; ctx.fillRect(6, 10, m.w - 12, m.h - 16)
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(10, 0, m.w - 20, 6); ctx.fillRect(10, -4, 4, 6)
    ctx.fillRect(m.w / 2 - 2, -6, 4, 8); ctx.fillRect(m.w - 14, -4, 4, 6)
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(14, 18, 6, 6); ctx.fillRect(m.w - 20, 18, 6, 6)
    ctx.fillStyle = '#ef4444'; ctx.fillRect(16, 30, m.w - 32, 4)
    ctx.strokeStyle = 'rgba(168,85,247,0.4)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2, m.w / 2 + 6 + Math.sin(Date.now() * 0.005) * 4, m.h / 2 + 4, 0, 0, Math.PI * 2); ctx.stroke()
  } else if (m.type === 'bat') {
    // Bat body
    ctx.fillStyle = m.color
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + 2, 6, 5, 0, 0, Math.PI * 2); ctx.fill()
    // Wings flapping
    const wingAngle = Math.sin(m.animFrame * 0.3) * 0.6
    ctx.save(); ctx.translate(m.w / 2 - 5, m.h / 2)
    ctx.rotate(-wingAngle)
    ctx.fillStyle = m.color; ctx.fillRect(-12, -3, 12, 6)
    ctx.restore()
    ctx.save(); ctx.translate(m.w / 2 + 5, m.h / 2)
    ctx.rotate(wingAngle)
    ctx.fillStyle = m.color; ctx.fillRect(0, -3, 12, 6)
    ctx.restore()
    // Eyes
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(m.w / 2 - 4, m.h / 2 - 2, 2, 2); ctx.fillRect(m.w / 2 + 2, m.h / 2 - 2, 2, 2)
    // Fangs
    ctx.fillStyle = '#fff'; ctx.fillRect(m.w / 2 - 2, m.h / 2 + 4, 1, 2); ctx.fillRect(m.w / 2 + 1, m.h / 2 + 4, 1, 2)
  } else if (m.type === 'ghost') {
    // Ghost - transparent wavy
    const wave = Math.sin(Date.now() * 0.003 + m.x * 0.01) * 3
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.004) * 0.15
    ctx.fillStyle = m.color
    ctx.beginPath()
    ctx.ellipse(m.w / 2, m.h / 3, m.w / 2, m.h / 3, 0, Math.PI, 0)
    ctx.rect(0, m.h / 3, m.w, m.h / 2)
    ctx.fill()
    // Wavy bottom
    ctx.beginPath()
    for (let i = 0; i <= m.w; i += 4) {
      const yy = m.h - 2 + Math.sin(i * 0.5 + Date.now() * 0.005) * 3
      if (i === 0) ctx.moveTo(i, yy); else ctx.lineTo(i, yy)
    }
    ctx.lineTo(m.w, m.h / 2); ctx.lineTo(0, m.h / 2); ctx.fill()
    // Eyes
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath(); ctx.ellipse(m.w / 3, m.h / 3 + 2 + wave * 0.3, 3, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(m.w * 2 / 3, m.h / 3 + 2 + wave * 0.3, 3, 4, 0, 0, Math.PI * 2); ctx.fill()
    // Mouth
    ctx.beginPath(); ctx.ellipse(m.w / 2, m.h / 2 + wave * 0.3, 4, 3, 0, 0, Math.PI); ctx.fill()
    ctx.globalAlpha = 1
  }
  ctx.restore()

  // HP bar
  if (m.hp < m.maxHp) {
    const bw = m.w + 8
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(cx - 4, cy - 10, bw, 4)
    ctx.fillStyle = m.hp > m.maxHp * 0.3 ? '#ef4444' : '#fbbf24'
    ctx.fillRect(cx - 4, cy - 10, bw * (m.hp / m.maxHp), 4)
  }
}

// ===== BACKGROUND =====
const stars: { x: number; y: number; s: number; b: number }[] = []
const bgTrees: { x: number; h: number; w: number }[] = []
const bgMountains: { x: number; h: number; w: number }[] = []

function generateBackground() {
  stars.length = 0; bgTrees.length = 0; bgMountains.length = 0
  for (let i = 0; i < 80; i++) stars.push({ x: Math.random() * W, y: Math.random() * (H * 0.6), s: 1 + Math.random() * 2, b: Math.random() })
  for (let i = 0; i < 20; i++) bgMountains.push({ x: i * 200 - 100, h: 80 + Math.random() * 120, w: 160 + Math.random() * 100 })
  for (let i = 0; i < 30; i++) bgTrees.push({ x: i * 120 + Math.random() * 60, h: 40 + Math.random() * 50, w: 20 + Math.random() * 15 })
}

function drawBackground() {
  if (!ctx) return
  const biome = getBiomeConfig(level.value)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
  biome.skyColors.forEach((c, i) => skyGrad.addColorStop(i / (biome.skyColors.length - 1), c))
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H)

  for (const s of stars) {
    const tw = 0.5 + Math.sin(Date.now() * 0.003 + s.b * 10) * 0.5
    ctx.fillStyle = `rgba(255,255,255,${tw * 0.8})`; ctx.fillRect(s.x, s.y, s.s, s.s)
  }
  // Moon
  ctx.fillStyle = biome.moonColor; ctx.beginPath(); ctx.arc(W - 120, 80, 35, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = biome.skyColors[0]; ctx.beginPath(); ctx.arc(W - 108, 72, 30, 0, Math.PI * 2); ctx.fill()

  // Mountains
  const mOff = camera.x * 0.15
  ctx.fillStyle = biome.mountainColor
  for (const m of bgMountains) {
    const mx = m.x - mOff % 4000
    ctx.beginPath(); ctx.moveTo(mx, H - 48); ctx.lineTo(mx + m.w / 2, H - 48 - m.h); ctx.lineTo(mx + m.w, H - 48); ctx.fill()
  }
  // Trees
  const tOff = camera.x * 0.3
  for (const t of bgTrees) {
    const tx = t.x - tOff % 3600
    ctx.fillStyle = biome.treeTrunk; ctx.fillRect(tx + t.w / 2 - 3, H - 48 - t.h * 0.4, 6, t.h * 0.4)
    ctx.fillStyle = biome.treeColor
    ctx.beginPath(); ctx.moveTo(tx, H - 48 - t.h * 0.3); ctx.lineTo(tx + t.w / 2, H - 48 - t.h); ctx.lineTo(tx + t.w, H - 48 - t.h * 0.3); ctx.fill()
  }
  // Biome ambient particles
  if (getBiomeForLevel(level.value) === 'ice') {
    for (let i = 0; i < 5; i++) {
      const sx = (Date.now() * 0.02 + i * 200) % W
      const sy = (Date.now() * 0.03 + i * 150) % (H - 60)
      ctx.fillStyle = 'rgba(200,230,255,0.5)'; ctx.fillRect(sx, sy, 2, 2)
    }
  } else if (getBiomeForLevel(level.value) === 'volcano') {
    for (let i = 0; i < 3; i++) {
      const sx = (Date.now() * 0.01 + i * 300) % W
      const sy = H - 60 - ((Date.now() * 0.02 + i * 200) % 80)
      ctx.fillStyle = `rgba(239,68,68,${0.3 + Math.sin(Date.now() * 0.005 + i) * 0.2})`; ctx.fillRect(sx, sy, 3, 3)
    }
  }
}

function drawPlatforms() {
  if (!ctx) return
  const biome = getBiomeConfig(level.value)
  for (const p of platforms) {
    const px = p.x - camera.x, py = p.y - camera.y
    if (px + p.w < -10 || px > W + 10) continue
    if (p.type === 'ground') {
      ctx.fillStyle = biome.groundColor; ctx.fillRect(px, py, Math.min(p.w, W + 20), p.h)
      ctx.fillStyle = biome.grassColor; ctx.fillRect(px, py, Math.min(p.w, W + 20), 4)
      ctx.fillStyle = biome.grassColor2; ctx.fillRect(px, py + 4, Math.min(p.w, W + 20), 2)
    } else {
      ctx.fillStyle = biome.platformColor; ctx.fillRect(px, py, p.w, p.h)
      ctx.fillStyle = biome.platformTop; ctx.fillRect(px, py, p.w, 3)
    }
  }
}

// ===== UPDATES =====
function updatePlayer() {
  if (showInventory.value) return // freeze game when inventory open

  const spd = player.speed + player.speedBoost * 0.5
  let moving = false
  if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -spd; player.facing = -1; moving = true }
  else if (keys['ArrowRight'] || keys['KeyD']) { player.vx = spd; player.facing = 1; moving = true }
  else { player.vx *= 0.7; if (Math.abs(player.vx) < 0.1) player.vx = 0 }

  // Double jump
  if (keyJustPressed['ArrowUp'] || keyJustPressed['KeyW'] || keyJustPressed['Space']) {
    if (player.jumpCount < player.maxJumps && !player.attacking) {
      player.vy = player.jumpPower
      player.onGround = false
      player.jumpCount++
      sfxJump()
      if (player.jumpCount === 2) {
        spawnParticles(player.x + player.w / 2, player.y + player.h, '#94a3b8', 5, 2)
      }
    }
  }
  // Clear just pressed flags
  for (const k in keyJustPressed) delete keyJustPressed[k]

  // Reset jump count when on ground
  if (player.onGround) player.jumpCount = 0

  // Attack with weapon stats
  const wCfg = WEAPONS[player.weapon]
  const atkCooldown = Math.max(10, 25 + wCfg.speed)
  if ((keys['KeyZ'] || keys['KeyJ']) && player.attackCooldown <= 0 && !player.attacking) {
    player.attacking = true; player.attackTimer = 18; player.attackCooldown = atkCooldown; player.attackFrame = 0; sfxAttack()
  }

  if (player.attacking) {
    player.attackTimer--; player.attackFrame++
    if (player.attackTimer <= 0) player.attacking = false
    const range = wCfg.range
    const atkBox = { x: player.facing > 0 ? player.x + player.w : player.x - range, y: player.y - 4, w: range, h: player.h + 8 }
    for (const m of monsters) {
      if (m.dead || m.hurtTimer > 0) continue
      if (rectCollide(atkBox, m)) {
        const dmg = Math.floor(wCfg.damage + player.baseAtk + level.value * 2 + player.atkBoost * 5 + Math.random() * 5)
        m.hp -= dmg; m.hurtTimer = 15; m.vx = player.facing * 4; m.vy = m.flying ? -2 : -3
        spawnParticles(m.x + m.w / 2, m.y + m.h / 2, wCfg.color, 8, 4)
        spawnFloatingText(m.x + m.w / 2, m.y - 10, `-${dmg}`, '#fbbf24', 14)
        combo.value++; sfxHit()
        if (combo.value > 1) spawnFloatingText(player.x + player.w / 2, player.y - 30, `${combo.value} HIT!`, '#f97316', 12 + Math.min(combo.value, 10))
        if (m.hp <= 0) {
          m.dead = true; killCount.value++
          const sc = Math.floor(m.scoreValue * (1 + combo.value * 0.1))
          score.value += sc; playerExp.value += m.exp; sfxKill()
          spawnFloatingText(m.x + m.w / 2, m.y - 20, `+${sc}`, '#4ade80', 16)
          spawnParticles(m.x + m.w / 2, m.y + m.h / 2, m.color, 20, 6)
          // Drop item or weapon
          if (Math.random() < 0.2) chests.push(createChest(m.x, m.y + m.h))
          if (Math.random() < 0.12) weaponDrops.push(createWeaponDrop(m.x + m.w / 2 - 10, m.y))
          if (playerExp.value >= playerExpMax.value) levelUp()
        }
      }
    }
  }

  if (player.attackCooldown > 0) player.attackCooldown--
  if (player.invincible > 0) player.invincible--
  if (!player.attacking && player.attackCooldown <= 0) combo.value = 0

  // Effects decay
  if (player.atkBoost > 0) player.atkBoost -= 1 / 60
  if (player.speedBoost > 0) player.speedBoost -= 1 / 60
  if (player.shield > 0) player.shield -= 1 / 60
  if (player.atkBoost < 0) player.atkBoost = 0
  if (player.speedBoost < 0) player.speedBoost = 0
  if (player.shield < 0) player.shield = 0

  player.state = player.attacking ? 'attack' : !player.onGround ? 'jump' : moving ? 'run' : 'idle'
  player.animTimer++
  if (player.animTimer >= 6) { player.animTimer = 0; player.animFrame++ }
  resolveGravity(player)

  // Pick up weapon drops
  for (let i = weaponDrops.length - 1; i >= 0; i--) {
    const d = weaponDrops[i]
    if (rectCollide(player, d)) {
      if (!inventory.includes(d.weapon)) {
        inventory.push(d.weapon)
        spawnFloatingText(d.x + d.w / 2, d.y - 20, `${WEAPONS[d.weapon].icon} ${WEAPONS[d.weapon].name}!`, WEAPONS[d.weapon].color, 16)
        sfxChestOpen()
      } else {
        spawnFloatingText(d.x + d.w / 2, d.y - 20, 'Đã có!', '#94a3b8', 12)
        sfxItem()
      }
      spawnParticles(d.x + d.w / 2, d.y + d.h / 2, WEAPONS[d.weapon].color, 12, 4)
      weaponDrops.splice(i, 1)
    }
  }
}

function updateMonsters() {
  spawnTimer++
  if (spawnTimer >= spawnRate) { spawnTimer = 0; spawnMonster() }
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i]
    if (m.dead) { monsters.splice(i, 1); continue }
    const dx = player.x - m.x
    const dy = player.y - m.y
    const distX = Math.abs(dx)
    const distY = Math.abs(dy)
    m.facing = dx > 0 ? 1 : -1

    if (m.hurtTimer > 0) { m.hurtTimer--; m.state = 'hurt'; m.vx *= 0.85 }
    else if (m.attackTimer > 0) { m.attackTimer--; m.state = 'attack'; m.vx = 0 }
    else if (distX < 35 && distY < 30) {
      // FIX: check BOTH horizontal AND vertical distance before attacking
      if (m.attackCooldown <= 0 && player.invincible <= 0) {
        m.attackTimer = 20; m.attackCooldown = m.type === 'boss' ? 40 : 60
        const dmg = player.shield > 0 ? Math.floor(m.damage * 0.3) : m.damage
        playerHp.value -= dmg; player.invincible = 30; player.vx = -m.facing * 5; player.vy = -4
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ef4444', 10, 5)
        spawnFloatingText(player.x + player.w / 2, player.y - 10, `-${dmg}`, player.shield > 0 ? '#a855f7' : '#ef4444', 16)
        sfxPlayerHurt()
        if (playerHp.value <= 0) { playerHp.value = 0; gameState.value = 'gameover'; sfxGameOver(); handleGameOver() }
      }
    } else {
      // Chase - flying vs ground
      if (m.flying) {
        m.state = 'chase'
        m.vx = m.facing * m.speed
        // Fly towards player Y
        const targetY = player.y - 10
        if (m.y > targetY + 5) m.vy = -m.speed * 0.6
        else if (m.y < targetY - 5) m.vy = m.speed * 0.6
        else m.vy *= 0.9
        // Slight wave motion
        m.vy += Math.sin(Date.now() * 0.003 + m.x * 0.01) * 0.1
      } else {
        m.state = 'chase'; m.vx = m.facing * m.speed
      }
    }
    if (m.attackCooldown > 0) m.attackCooldown--
    m.animTimer++; if (m.animTimer >= 8) { m.animTimer = 0; m.animFrame++ }
    // Flying monsters skip gravity
    if (m.flying) {
      m.y += m.vy; m.x += m.vx
      if (m.x < 0) m.x = 0
      if (m.x + m.w > MAP_WIDTH) m.x = MAP_WIDTH - m.w
      if (m.y < 40) m.y = 40
      if (m.y > H - 80) m.y = H - 80
    } else {
      resolveGravity(m)
    }
    if (Math.abs(m.x - player.x) > W * 2) monsters.splice(i, 1)
  }
}

function updateChests() {
  chestSpawnTimer++
  // Spawn chest on platforms periodically
  if (chestSpawnTimer >= 600 && chests.length < 3) {
    chestSpawnTimer = 0
    const validPlatforms = platforms.filter(p => p.type === 'floating')
    if (validPlatforms.length > 0) {
      const p = validPlatforms[Math.floor(Math.random() * validPlatforms.length)]
      chests.push(createChest(p.x + p.w / 2 - 12, p.y))
    }
  }
  for (let i = chests.length - 1; i >= 0; i--) {
    const c = chests[i]
    c.animFrame++
    if (c.opened) {
      c.openTimer--
      if (c.openTimer <= 0) { chests.splice(i, 1); continue }
    } else if (rectCollide(player, c)) {
      c.opened = true; c.openTimer = 60; sfxChestOpen()
      applyItem(c.item)
      spawnFloatingText(c.x + c.w / 2, c.y - 10, ITEM_NAMES[c.item], ITEM_COLORS[c.item], 14)
      spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ITEM_COLORS[c.item], 15, 5)
    }
  }
}

function applyItem(item: ItemType) {
  sfxItem()
  switch (item) {
    case 'hp_potion':
      playerHp.value = Math.min(playerHp.value + 30, playerMaxHp.value)
      spawnFloatingText(player.x + player.w / 2, player.y - 20, '+30 HP', '#ef4444', 16)
      break
    case 'atk_boost': player.atkBoost = ITEM_DURATIONS.atk_boost / 60; break
    case 'speed_boost': player.speedBoost = ITEM_DURATIONS.speed_boost / 60; break
    case 'shield': player.shield = ITEM_DURATIONS.shield / 60; break
    case 'exp_gem':
      const expGain = 20 + level.value * 5
      playerExp.value += expGain
      spawnFloatingText(player.x + player.w / 2, player.y - 20, `+${expGain} EXP`, '#10b981', 16)
      if (playerExp.value >= playerExpMax.value) levelUp()
      break
  }
}

function levelUp() {
  level.value++; playerExp.value = 0; playerExpMax.value = Math.floor(playerExpMax.value * 1.5)
  playerMaxHp.value += 15; playerHp.value = Math.min(playerHp.value + 30, playerMaxHp.value)
  player.speed += 0.15; player.baseAtk += 2; sfxLevelUp()
  spawnFloatingText(player.x + player.w / 2, player.y - 40, 'LEVEL UP!', '#e879f9', 24)
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#e879f9', 30, 8)
  // Biome change notification
  const newBiome = getBiomeConfig(level.value)
  const prevBiome = getBiomeConfig(level.value - 1)
  if (newBiome.name !== prevBiome.name) {
    setTimeout(() => spawnFloatingText(player.x + player.w / 2, player.y - 60, `🗺️ ${newBiome.name}`, '#fbbf24', 20), 500)
  }
  if (spawnRate > 60) spawnRate -= 10
  if (maxMonsters < 12) maxMonsters++
}

function handleGameOver() {
  if (!scoreSaved && score.value > 0) {
    saveScore({ name: 'NINJA', score: score.value, level: level.value, kills: killCount.value, date: new Date().toLocaleDateString() })
    scoreSaved = true
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--
    if (p.life <= 0) particles.splice(i, 1)
  }
}
function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i]; t.y += t.vy; t.life--
    if (t.life <= 0) floatingTexts.splice(i, 1)
  }
}
function updateCamera() {
  camera.x += (player.x - W / 3 - camera.x) * 0.08
  camera.x = Math.max(0, Math.min(MAP_WIDTH - W, camera.x))
}

function updateWeaponDrops() {
  for (let i = weaponDrops.length - 1; i >= 0; i--) {
    const d = weaponDrops[i]
    d.life--; d.animFrame++
    if (d.life <= 0) { weaponDrops.splice(i, 1); continue }
    // Gravity for drops
    if (!d.onGround) {
      d.vy += 0.3
      d.y += d.vy
      for (const p of platforms) {
        if (d.x + d.w > p.x && d.x < p.x + p.w && d.y + d.h > p.y && d.y + d.h < p.y + p.h + 10 && d.vy >= 0) {
          d.y = p.y - d.h; d.vy = 0; d.onGround = true
        }
      }
    }
  }
}

// ===== DRAW UI =====
function drawUI() {
  if (!ctx) return
  const biome = getBiomeConfig(level.value)

  // Player panel
  ctx.fillStyle = 'rgba(15,15,35,0.85)'; ctx.fillRect(12, 12, 208, 84)
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1; ctx.strokeRect(12, 12, 208, 84)

  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px monospace'; ctx.fillText('NINJA', 18, 28)
  ctx.fillStyle = '#fbbf24'; ctx.font = '10px monospace'; ctx.fillText(`Lv.${level.value}`, 110, 28)
  ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'; ctx.fillText(biome.name, 140, 28)

  // HP
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(18, 34, 196, 16)
  const hpR = playerHp.value / playerMaxHp.value
  const hpG = ctx.createLinearGradient(18, 0, 18 + 196 * hpR, 0)
  hpG.addColorStop(0, hpR > 0.3 ? '#22c55e' : '#ef4444')
  hpG.addColorStop(1, hpR > 0.3 ? '#4ade80' : '#fbbf24')
  ctx.fillStyle = hpG; ctx.fillRect(18, 34, 196 * hpR, 16)
  ctx.fillStyle = '#fff'; ctx.font = '10px monospace'
  ctx.fillText(`HP ${playerHp.value}/${playerMaxHp.value}`, 22, 46)

  // EXP
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(18, 54, 196, 8)
  ctx.fillStyle = '#818cf8'; ctx.fillRect(18, 54, 196 * (playerExp.value / playerExpMax.value), 8)
  ctx.fillStyle = '#c7d2fe'; ctx.font = '8px monospace'
  ctx.fillText(`EXP ${playerExp.value}/${playerExpMax.value}`, 22, 62)

  // Active effects
  let effX = 18
  if (player.atkBoost > 0) { ctx.fillStyle = '#f97316'; ctx.font = '9px monospace'; ctx.fillText(`⚔${Math.ceil(player.atkBoost)}s`, effX, 80); effX += 40 }
  if (player.speedBoost > 0) { ctx.fillStyle = '#3b82f6'; ctx.fillText(`💨${Math.ceil(player.speedBoost)}s`, effX, 80); effX += 40 }
  if (player.shield > 0) { ctx.fillStyle = '#a855f7'; ctx.fillText(`🛡${Math.ceil(player.shield)}s`, effX, 80); effX += 40 }

  // Equipped weapon indicator
  const wCfg = WEAPONS[player.weapon]
  ctx.fillStyle = 'rgba(15,15,35,0.85)'; ctx.fillRect(12, 100, 100, 24)
  ctx.strokeStyle = wCfg.color; ctx.lineWidth = 1; ctx.strokeRect(12, 100, 100, 24)
  ctx.fillStyle = wCfg.color; ctx.font = 'bold 10px monospace'
  ctx.fillText(`${wCfg.icon} ${wCfg.name}`, 18, 116)

  // Weapon hotbar (bottom center)
  const allW: WeaponType[] = ['sword', 'dual_swords', 'axe', 'bow', 'shuriken', 'hammer']
  const hbW = 28, hbGap = 3, hbTotal = allW.length * (hbW + hbGap)
  const hbX = (W - hbTotal) / 2, hbY = H - 36
  allW.forEach((wt, i) => {
    const sx = hbX + i * (hbW + hbGap)
    const owned = inventory.includes(wt)
    const equipped = player.weapon === wt
    ctx.fillStyle = equipped ? 'rgba(251,191,36,0.3)' : owned ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)'
    ctx.fillRect(sx, hbY, hbW, hbW)
    ctx.strokeStyle = equipped ? '#fbbf24' : owned ? '#4b5563' : '#1f2937'
    ctx.lineWidth = equipped ? 2 : 1
    ctx.strokeRect(sx, hbY, hbW, hbW)
    ctx.fillStyle = owned ? '#e2e8f0' : '#374151'
    ctx.font = '12px monospace'; ctx.textAlign = 'center'
    ctx.fillText(WEAPONS[wt].icon, sx + hbW / 2, hbY + 18)
    ctx.fillStyle = '#64748b'; ctx.font = '7px monospace'
    ctx.fillText(`${i + 1}`, sx + hbW / 2, hbY - 2)
    ctx.textAlign = 'left'
  })

  // Score panel
  ctx.fillStyle = 'rgba(15,15,35,0.85)'; ctx.fillRect(W - 170, 12, 158, 48)
  ctx.strokeStyle = '#f97316'; ctx.strokeRect(W - 170, 12, 158, 48)
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'right'
  ctx.fillText(`SCORE: ${score.value}`, W - 20, 32)
  ctx.fillStyle = '#f97316'; ctx.font = '10px monospace'
  ctx.fillText(`KILLS: ${killCount.value}`, W - 20, 48)
  ctx.textAlign = 'left'

  // Combo
  if (combo.value > 1) {
    ctx.fillStyle = '#f97316'; ctx.font = `bold ${16 + Math.min(combo.value * 2, 20)}px monospace`
    ctx.textAlign = 'center'; ctx.fillText(`${combo.value} COMBO!`, W / 2, 40); ctx.textAlign = 'left'
  }

  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '8px monospace'
  ctx.fillText('← → Di chuyển | ↑ Nhảy (x2) | Z/J Tấn công | B Túi đồ | 1-6 Đổi vũ khí', 16, H - 42)
}

function drawParticles() {
  if (!ctx) return
  for (const p of particles) {
    ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife
    ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size)
  }
  ctx.globalAlpha = 1
}
function drawFloatingTexts() {
  if (!ctx) return
  for (const t of floatingTexts) {
    ctx.globalAlpha = t.life / 60; ctx.fillStyle = t.color
    ctx.font = `bold ${t.size}px monospace`; ctx.textAlign = 'center'
    ctx.fillText(t.text, t.x - camera.x, t.y - camera.y); ctx.textAlign = 'left'
  }
  ctx.globalAlpha = 1
}

function drawMenu() {
  if (!ctx) return
  drawBackground()
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center'
  ctx.fillText('NINJA QUEST', W / 2, H / 2 - 100)
  ctx.fillStyle = '#fbbf24'; ctx.font = '14px monospace'
  ctx.fillText('⚔ Tiêu diệt quái vật • Thu thập điểm • Nâng cấp ⚔', W / 2, H / 2 - 65)
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px monospace'
  ctx.fillText('🗺️ 4 Biomes: Rừng → Sa Mạc → Băng Giá → Núi Lửa', W / 2, H / 2 - 40)

  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 20px monospace'
    ctx.fillText('Nhấn ENTER để bắt đầu', W / 2, H / 2 + 10)
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px monospace'
  ctx.fillText('← → / A D : Di chuyển  |  ↑ / W / Space : Nhảy  |  Z / J : Tấn công', W / 2, H / 2 + 50)

  // Leaderboard
  drawLeaderboard(ctx, W / 2 - 140, H / 2 + 70, 280)

  ctx.fillStyle = '#64748b'; ctx.font = '10px monospace'
  ctx.fillText('by nmdung.dev | J2TEAM Community', W / 2, H - 16)
  ctx.textAlign = 'left'
}

function drawGameOver() {
  if (!ctx) return
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 48px monospace'; ctx.fillText('GAME OVER', W / 2, H / 2 - 80)
  ctx.fillStyle = '#fbbf24'; ctx.font = '20px monospace'; ctx.fillText(`Score: ${score.value}`, W / 2, H / 2 - 30)
  ctx.fillStyle = '#94a3b8'; ctx.font = '14px monospace'
  ctx.fillText(`Level: ${level.value} | Kills: ${killCount.value} | Biome: ${getBiomeConfig(level.value).name}`, W / 2, H / 2)
  if (isHighScore(score.value)) {
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 16px monospace'; ctx.fillText('🏆 NEW HIGH SCORE! 🏆', W / 2, H / 2 + 30)
  }
  drawLeaderboard(ctx, W / 2 - 140, H / 2 + 50, 280)
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 18px monospace'
    ctx.fillText('Nhấn ENTER để chơi lại', W / 2, H - 30)
  }
  ctx.textAlign = 'left'
}

// ===== GAME LOOP =====
function startGame() {
  gameState.value = 'playing'; scoreSaved = false
  resetPlayer(); generateMap(); monsters.length = 0; particles.length = 0
  floatingTexts.length = 0; chests.length = 0; spawnTimer = 0; spawnRate = 200; maxMonsters = 5
  sfxMenuSelect()
}

function gameLoop() {
  if (!ctx) return
  if (gameState.value === 'menu') {
    drawMenu()
    menuReady++
    if (keys['Enter'] && menuReady > 30) { keys['Enter'] = false; startGame() }
  } else if (gameState.value === 'playing') {
    if (!showInventory.value) {
      updatePlayer(); updateMonsters(); updateChests(); updateWeaponDrops(); updateParticles(); updateFloatingTexts(); updateCamera()
    }
    drawBackground(); drawPlatforms()
    for (const c of chests) drawChest(ctx!, c, camera.x)
    for (const d of weaponDrops) drawWeaponDrop(ctx!, d, camera.x)
    for (const m of monsters) drawMonster(m)
    drawPixelChar(player.x, player.y, player.facing, player.state, player.animFrame, player.invincible > 0)
    drawParticles(); drawFloatingTexts(); drawUI()
    // Inventory overlay
    if (showInventory.value) {
      drawInventory(ctx!, W, H, inventory, player.weapon, invSelectedIdx)
    }
  } else if (gameState.value === 'gameover') {
    drawBackground(); drawPlatforms(); drawGameOver()
    if (keys['Enter']) { keys['Enter'] = false; startGame() }
  }
  animationId = requestAnimationFrame(gameLoop)
}

function resizeCanvas() {
  if (!canvasRef.value) return
  const container = canvasRef.value.parentElement
  if (!container) return
  const maxW = Math.min(container.clientWidth - 32, 960)
  W = maxW; H = Math.floor(maxW / (960 / 540))
  canvasRef.value.width = W; canvasRef.value.height = H
  if (gameState.value !== 'playing') generateMap()
}

onMounted(() => {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  resizeCanvas(); generateBackground(); generateMap()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('resize', resizeCanvas)
  animationId = requestAnimationFrame(gameLoop)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <div class="min-h-screen bg-[#0f0f23] text-white font-mono flex flex-col items-center justify-center px-4 py-6 relative">
    <RouterLink to="/"
      class="absolute top-4 left-4 z-10 inline-flex items-center gap-2 border border-gray-700 bg-gray-900/80 px-4 py-2 text-xs text-gray-400 transition hover:border-red-500 hover:text-white rounded">
      &larr; Về trang chủ
    </RouterLink>
    <div class="relative w-full max-w-[960px]">
      <canvas ref="canvasRef" tabindex="0"
        class="w-full border-2 border-gray-700 rounded-lg shadow-2xl shadow-purple-900/30 cursor-crosshair"
        :class="{ 'border-red-500/50': gameState === 'gameover', 'border-green-500/30': gameState === 'playing' }"
        @click="($event.target as HTMLCanvasElement)?.focus()" />
    </div>
    <div class="mt-4 flex gap-3 sm:hidden">
      <button class="w-14 h-14 bg-gray-800 border border-gray-600 rounded-lg text-2xl active:bg-gray-700 active:scale-95 transition"
        @touchstart.prevent="keys['ArrowLeft'] = true" @touchend.prevent="keys['ArrowLeft'] = false">←</button>
      <button class="w-14 h-14 bg-gray-800 border border-gray-600 rounded-lg text-2xl active:bg-gray-700 active:scale-95 transition"
        @touchstart.prevent="keys['ArrowRight'] = true" @touchend.prevent="keys['ArrowRight'] = false">→</button>
      <button class="w-14 h-14 bg-blue-800 border border-blue-600 rounded-lg text-lg active:bg-blue-700 active:scale-95 transition"
        @touchstart.prevent="keys['Space'] = true" @touchend.prevent="keys['Space'] = false">⬆</button>
      <button class="w-14 h-14 bg-red-800 border border-red-600 rounded-lg text-lg active:bg-red-700 active:scale-95 transition"
        @touchstart.prevent="keys['KeyZ'] = true" @touchend.prevent="keys['KeyZ'] = false">⚔</button>
    </div>
  </div>
</template>
