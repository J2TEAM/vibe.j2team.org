<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  useEventListener,
  useMouseInElement,
  useRafFn,
  useStorage,
  useWindowSize,
} from '@vueuse/core'
import { onMounted, ref, watch } from 'vue'

// --- Game Logic State ---
class Vector {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

const PLAYER_SPEED = 200 // px per sec
const BULLET_SPEED = 600
const FIRE_RATE = 150 // ms between shots
const BOSS_INTERVAL = 5 // seconds
const WEAPON_DURATION = 15 // seconds

type BulletType = 'normal' | 'power' | 'boss'
type ItemType = 'spread' | 'power' | 'heal'

let player = {
  pos: new Vector(0, 0),
  angle: 0,
  hp: 100,
  maxHp: 100,
  lastFire: 0,
  weaponType: 'power' as ItemType | 'normal',
  weaponTimer: 0,
}

let bullets: {
  pos: Vector
  vel: Vector
  isPlayer: boolean
  damage: number
  type: BulletType
  life: number
  radius: number
}[] = []
let enemies: { pos: Vector; hp: number; maxHp: number; speed: number; radius: number }[] = []
let particles: { pos: Vector; vel: Vector; life: number; maxLife: number; color: string }[] = []
let items: { pos: Vector; type: ItemType; life: number; maxLife: number }[] = []

let boss: {
  pos: Vector
  targetPos: Vector
  hp: number
  maxHp: number
  radius: number
  speed: number
  lastFire: number
  phase: number
  active: boolean
} | null = null

let spawnRate = 2000
let lastEnemySpawn = 0
let gameTime = 0
let lastBossSpawn = 0
let lastItemSpawn = 0

// --- Vue Refs & Reactive UI state ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const highScore = useStorage('tank-shooter-high-score', 0)
const score = ref(0)
const isPlaying = ref(false)
const isGameOver = ref(false)

const { elementX: mouseX, elementY: mouseY } = useMouseInElement(canvasRef)
const { width: winW, height: winH } = useWindowSize()

// Colors from Design System
const COLORS = {
  bgDeep: '#0F1923',
  bgSurface: '#162232',
  bgElevated: '#1E2F42',
  coral: '#FF6B4A',
  amber: '#FFB830',
  sky: '#38BDF8',
  textPrimary: '#F0EDE6',
  textSecondary: '#8B9DB5',
  borderDefault: '#253549',
  healGreen: '#22c55e',
  bossGold: '#eab308',
}

// Input Handling
const keys = { w: false, a: false, s: false, d: false }
useEventListener('keydown', (e) => {
  const k = e.key.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(keys, k)) {
    keys[k as keyof typeof keys] = true
  }
})
useEventListener('keyup', (e) => {
  const k = e.key.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(keys, k)) {
    keys[k as keyof typeof keys] = false
  }
})

let isMouseDown = false
useEventListener('mousedown', () => (isMouseDown = true))
useEventListener('mouseup', () => (isMouseDown = false))
// Prevent context menu on right click to allow smooth gaming experience
useEventListener('contextmenu', (e) => e.preventDefault())

// --- Methods ---

function initGame() {
  const w = canvasRef.value!.width
  const h = canvasRef.value!.height

  player = {
    pos: new Vector(w / 2, h / 2),
    angle: 0,
    hp: 100,
    maxHp: 100,
    lastFire: 0,
    weaponType: 'normal',
    weaponTimer: 0,
  }

  bullets = []
  enemies = []
  particles = []
  items = []
  boss = null

  score.value = 0
  spawnRate = 2000
  lastEnemySpawn = performance.now()
  gameTime = 0
  lastBossSpawn = 0
  lastItemSpawn = 0

  isGameOver.value = false
  isPlaying.value = true
}

function endGame() {
  isPlaying.value = false
  isGameOver.value = true
  if (score.value > highScore.value) {
    highScore.value = score.value
  }
}

function spawnBullet(
  x: number,
  y: number,
  angle: number,
  isPlayer: boolean,
  type: BulletType = 'normal',
) {
  const speed = type === 'boss' ? 250 : isPlayer ? BULLET_SPEED : 300
  const damage = type === 'boss' ? 15 : type === 'power' ? 30 : 10
  const radius = type === 'power' ? 7 : type === 'boss' ? 6 : 4

  bullets.push({
    pos: new Vector(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30),
    vel: new Vector(Math.cos(angle) * speed, Math.sin(angle) * speed),
    isPlayer,
    damage,
    type,
    life: 2.0, // Bullets expire after 2s
    radius,
  })
}

function spawnEnemy() {
  if (!canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height

  let x = 0,
    y = 0
  const side = Math.floor(Math.random() * 4)
  const margin = 40

  if (side === 0) {
    x = Math.random() * w
    y = -margin
  } // Top
  else if (side === 1) {
    x = w + margin
    y = Math.random() * h
  } // Right
  else if (side === 2) {
    x = Math.random() * w
    y = h + margin
  } // Bottom
  else {
    x = -margin
    y = Math.random() * h
  } // Left

  enemies.push({
    pos: new Vector(x, y),
    hp: 20,
    maxHp: 20,
    radius: 16,
    speed: Math.random() * 60 + 50, // varied speeds
  })
}

function spawnBoss() {
  if (!canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height

  boss = {
    pos: new Vector(w / 2, -100), // starts top
    targetPos: new Vector(w / 2, h / 4), // moves to top center area
    hp: 800,
    maxHp: 800,
    radius: 40,
    speed: 80,
    lastFire: performance.now(),
    phase: 1,
    active: true,
  }
}

function spawnItem(x: number, y: number) {
  const rand = Math.random()
  let type: ItemType = 'heal'
  if (rand < 0.35) type = 'spread'
  else if (rand < 0.7) type = 'power'

  items.push({
    pos: new Vector(x, y),
    type,
    life: 12, // 12 seconds to pick up
    maxLife: 12,
  })
}

function createParticle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string,
  maxLife: number,
) {
  particles.push({
    pos: new Vector(x, y),
    vel: new Vector(vx, vy),
    color,
    life: maxLife,
    maxLife,
  })
}

function resizeCanvas() {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight
    if (!isPlaying.value) draw() // Ensure initial screen has bg
  }
}

function update(delta: number) {
  const dt = delta / 1000
  const now = performance.now()
  gameTime += dt

  // Movement
  let dx = 0,
    dy = 0
  if (keys.w) dy -= 1
  if (keys.s) dy += 1
  if (keys.a) dx -= 1
  if (keys.d) dx += 1

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy)
    player.pos.x += (dx / len) * PLAYER_SPEED * dt
    player.pos.y += (dy / len) * PLAYER_SPEED * dt
  }

  // Constrain player
  if (canvasRef.value) {
    const margin = 15
    player.pos.x = Math.max(margin, Math.min(canvasRef.value.width - margin, player.pos.x))
    player.pos.y = Math.max(margin, Math.min(canvasRef.value.height - margin, player.pos.y))
  }

  // Aiming
  player.angle = Math.atan2(mouseY.value - player.pos.y, mouseX.value - player.pos.x)

  // Weapon Update
  if (player.weaponType !== 'normal') {
    player.weaponTimer -= dt
    if (player.weaponTimer <= 0) {
      player.weaponType = 'normal'
    }
  }

  // Shooting
  if (isMouseDown && now - player.lastFire > FIRE_RATE) {
    player.lastFire = now

    if (player.weaponType === 'normal') {
      spawnBullet(player.pos.x, player.pos.y, player.angle, true, 'normal')
    } else if (player.weaponType === 'spread') {
      spawnBullet(player.pos.x, player.pos.y, player.angle, true, 'normal')
      spawnBullet(player.pos.x, player.pos.y, player.angle - 0.25, true, 'normal')
      spawnBullet(player.pos.x, player.pos.y, player.angle + 0.25, true, 'normal')
    } else if (player.weaponType === 'power') {
      spawnBullet(player.pos.x, player.pos.y, player.angle, true, 'power')
    }

    // Muzzle flash particles
    for (let i = 0; i < 4; i++) {
      const spread = player.angle + Math.PI + (Math.random() - 0.5) * 0.5
      const speed = Math.random() * 80 + 20
      createParticle(
        player.pos.x + Math.cos(player.angle) * 30,
        player.pos.y + Math.sin(player.angle) * 30,
        Math.cos(spread) * speed,
        Math.sin(spread) * speed,
        COLORS.amber,
        0.15,
      )
    }
  }

  // Boss Spawning (Every BOSS_INTERVAL seconds)
  if (gameTime - lastBossSpawn > BOSS_INTERVAL && !boss) {
    lastBossSpawn = gameTime
    spawnBoss()
  }

  // Periodic Item Spawning (Every 15s)
  if (gameTime - lastItemSpawn > 15 && canvasRef.value) {
    lastItemSpawn = gameTime
    const margin = 50
    const x = margin + Math.random() * (canvasRef.value.width - margin * 2)
    const y = margin + Math.random() * (canvasRef.value.height - margin * 2)
    spawnItem(x, y)
  }

  // Boss Logic
  if (boss) {
    const distToTarget = Math.hypot(boss.targetPos.x - boss.pos.x, boss.targetPos.y - boss.pos.y)
    if (distToTarget > 5) {
      const bAngle = Math.atan2(boss.targetPos.y - boss.pos.y, boss.targetPos.x - boss.pos.x)
      boss.pos.x += Math.cos(bAngle) * boss.speed * dt
      boss.pos.y += Math.sin(bAngle) * boss.speed * dt
    } else {
      // Wander randomly at top
      if (Math.random() < 0.02 && canvasRef.value) {
        boss.targetPos.x = Math.max(
          100,
          Math.min(canvasRef.value.width - 100, boss.pos.x + (Math.random() - 0.5) * 400),
        )
        boss.targetPos.y = Math.max(
          80,
          Math.min(canvasRef.value.height / 2, boss.pos.y + (Math.random() - 0.5) * 200),
        )
      }
    }

    // Phase shift
    if (boss.hp < boss.maxHp * 0.5) {
      boss.phase = 2
    }

    // Boss attack
    if (now - boss.lastFire > (boss.phase === 1 ? 800 : 500)) {
      boss.lastFire = now
      const angleToP = Math.atan2(player.pos.y - boss.pos.y, player.pos.x - boss.pos.x)
      if (boss.phase === 1) {
        spawnBullet(boss.pos.x, boss.pos.y, angleToP, false, 'boss')
        spawnBullet(boss.pos.x, boss.pos.y, angleToP + 0.4, false, 'boss')
        spawnBullet(boss.pos.x, boss.pos.y, angleToP - 0.4, false, 'boss')
      } else {
        // Ring burst + Aimed shot
        spawnBullet(boss.pos.x, boss.pos.y, angleToP, false, 'boss')
        for (let i = 0; i < 8; i++) {
          spawnBullet(boss.pos.x, boss.pos.y, (Math.PI / 4) * i + now * 0.001, false, 'boss')
        }
      }
    }

    // Boss vs Player bullet collision
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j]
      if (!b) continue
      if (b.isPlayer) {
        const dist = Math.hypot(boss.pos.x - b.pos.x, boss.pos.y - b.pos.y)
        if (dist < boss.radius + b.radius + 5) {
          boss.hp -= b.damage
          bullets.splice(j, 1)

          for (let k = 0; k < 6; k++) {
            createParticle(
              b.pos.x,
              b.pos.y,
              (Math.random() - 0.5) * 200,
              (Math.random() - 0.5) * 200,
              COLORS.coral,
              0.3,
            )
          }
        }
      }
    }

    // Boss Death
    if (boss.hp <= 0) {
      score.value += 500
      for (let k = 0; k < 100; k++) {
        createParticle(
          boss.pos.x,
          boss.pos.y,
          (Math.random() - 0.5) * 500,
          (Math.random() - 0.5) * 500,
          COLORS.bossGold,
          1.2,
        )
      }
      // Guaranteed drop on boss kill
      spawnItem(boss.pos.x - 40, boss.pos.y)
      spawnItem(boss.pos.x + 40, boss.pos.y)
      spawnItem(boss.pos.x, boss.pos.y + 40)

      boss = null
      gameTime = 0 // Reset period
      lastBossSpawn = 0
    }
  }

  // Bullets update & Enemy Hit
  for (let j = bullets.length - 1; j >= 0; j--) {
    const b = bullets[j]
    if (!b) continue
    b.pos.x += b.vel.x * dt
    b.pos.y += b.vel.y * dt
    b.life -= dt

    if (b.life <= 0) {
      bullets.splice(j, 1)
      continue
    }

    // Hit by enemy bullet
    if (!b.isPlayer) {
      const pDist = Math.hypot(player.pos.x - b.pos.x, player.pos.y - b.pos.y)
      if (pDist < 15 + b.radius) {
        player.hp -= b.damage
        bullets.splice(j, 1)
        for (let k = 0; k < 8; k++) {
          createParticle(
            b.pos.x,
            b.pos.y,
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 150,
            COLORS.coral,
            0.3,
          )
        }
        if (player.hp <= 0 && !isGameOver.value) {
          endGame()
        }
      }
    }
  }

  // Enemy spawning
  if (now - lastEnemySpawn > spawnRate && (!boss || Math.random() < 0.2)) {
    lastEnemySpawn = now
    spawnEnemy()
    if (spawnRate > 400) spawnRate -= 15 // Gradual speedup
  }

  // Enemies update
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    if (!e) continue

    // Move towards player
    const angleToPlayer = Math.atan2(player.pos.y - e.pos.y, player.pos.x - e.pos.x)
    e.pos.x += Math.cos(angleToPlayer) * e.speed * dt
    e.pos.y += Math.sin(angleToPlayer) * e.speed * dt

    // Bullet collision
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j]
      if (!b) continue
      if (b.isPlayer) {
        const dist = Math.hypot(e.pos.x - b.pos.x, e.pos.y - b.pos.y)
        if (dist < e.radius + b.radius) {
          // Hitbox check
          e.hp -= b.damage

          if (b.type !== 'power' || e.hp > 0) {
            bullets.splice(j, 1)
          }

          for (let k = 0; k < 6; k++) {
            createParticle(
              b.pos.x,
              b.pos.y,
              (Math.random() - 0.5) * 120,
              (Math.random() - 0.5) * 120,
              COLORS.coral,
              0.25,
            )
          }

          if (e.hp <= 0) break // Enemy dead, skip other bullets
        }
      }
    }

    // Enemy death
    if (e.hp <= 0) {
      score.value += 10
      for (let k = 0; k < 15; k++) {
        createParticle(
          e.pos.x,
          e.pos.y,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          COLORS.sky,
          0.5,
        )
      }

      // Random item drop 15%
      if (Math.random() < 0.15) {
        spawnItem(e.pos.x, e.pos.y)
      }

      enemies.splice(i, 1)
      continue
    }

    // Player collision with enemy (Kamikaze)
    const distToPlayer = Math.hypot(player.pos.x - e.pos.x, player.pos.y - e.pos.y)
    if (distToPlayer < 15 + e.radius) {
      player.hp -= 20
      e.hp = 0

      for (let k = 0; k < 20; k++) {
        createParticle(
          e.pos.x,
          e.pos.y,
          (Math.random() - 0.5) * 150,
          (Math.random() - 0.5) * 150,
          COLORS.coral,
          0.4,
        )
      }
      enemies.splice(i, 1)

      if (player.hp <= 0 && !isGameOver.value) {
        endGame()
      }
    }
  }

  // Items update
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    if (!item) continue
    item.life -= dt
    if (item.life <= 0) {
      items.splice(i, 1)
      continue
    }

    const dist = Math.hypot(player.pos.x - item.pos.x, player.pos.y - item.pos.y)
    if (dist < 15 + 12) {
      // Player radius + Item pickup range
      if (item.type === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + 50)
      } else {
        player.weaponType = item.type
        player.weaponTimer = WEAPON_DURATION
      }

      // Pickup particle burst
      for (let k = 0; k < 20; k++) {
        let pColor = COLORS.sky
        if (item.type === 'spread') pColor = COLORS.amber
        if (item.type === 'power') pColor = COLORS.coral
        if (item.type === 'heal') pColor = COLORS.healGreen

        createParticle(
          item.pos.x,
          item.pos.y,
          (Math.random() - 0.5) * 250,
          (Math.random() - 0.5) * 250,
          pColor,
          0.6,
        )
      }

      items.splice(i, 1)
    }
  }

  // Particles update
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    if (!p) continue
    p.pos.x += p.vel.x * dt
    p.pos.y += p.vel.y * dt
    p.life -= dt
    if (p.life <= 0) particles.splice(i, 1)
  }
}

function draw() {
  if (!ctx || !canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height

  // Background filling
  ctx.fillStyle = COLORS.bgDeep
  ctx.fillRect(0, 0, w, h)

  // Retro grid
  ctx.strokeStyle = COLORS.bgElevated
  ctx.lineWidth = 1
  for (let i = 0; i < w; i += 60) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, h)
    ctx.stroke()
  }
  for (let i = 0; i < h; i += 60) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(w, i)
    ctx.stroke()
  }

  // Crosshair
  if (isPlaying.value) {
    ctx.strokeStyle = `rgba(255, 107, 74, 0.4)` // Coral
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(mouseX.value, mouseY.value, 12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(mouseX.value, mouseY.value - 20)
    ctx.lineTo(mouseX.value, mouseY.value + 20)
    ctx.moveTo(mouseX.value - 20, mouseY.value)
    ctx.lineTo(mouseX.value + 20, mouseY.value)
    ctx.stroke()
  }

  // Draw Items
  items.forEach((item) => {
    ctx!.save()
    ctx!.translate(item.pos.x, item.pos.y)

    // Bobbing animation
    const bob = Math.sin(performance.now() * 0.005) * 4
    ctx!.translate(0, bob)

    let color = COLORS.sky
    if (item.type === 'spread') color = COLORS.amber
    if (item.type === 'power') color = COLORS.coral
    if (item.type === 'heal') color = COLORS.healGreen

    // Blink if about to expire
    if (item.life < 3 && Math.floor(item.life * 10) % 2 === 0) {
      ctx!.globalAlpha = 0.5
    } else {
      ctx!.shadowColor = color
      ctx!.shadowBlur = 10
    }

    ctx!.strokeStyle = color
    ctx!.lineWidth = 2
    ctx!.beginPath()
    ctx!.rect(-12, -12, 24, 24)
    ctx!.stroke()

    // Inner symbol
    ctx!.fillStyle = color
    ctx!.textAlign = 'center'
    ctx!.textBaseline = 'middle'
    ctx!.font = '900 12px Anybody, sans-serif'
    const symbol = item.type === 'spread' ? 'S' : item.type === 'power' ? 'P' : '+'
    ctx!.fillText(symbol, 0, 1) // center adjust

    ctx!.shadowBlur = 0
    ctx!.restore()
  })

  // Draw Particles
  particles.forEach((p) => {
    ctx!.fillStyle = p.color
    ctx!.globalAlpha = Math.max(0, p.life / p.maxLife)
    ctx!.beginPath()
    ctx!.arc(p.pos.x, p.pos.y, 2.5, 0, Math.PI * 2)
    ctx!.fill()
  })
  ctx.globalAlpha = 1.0

  // Draw Boss
  if (boss) {
    ctx!.save()
    ctx!.translate(boss.pos.x, boss.pos.y)
    ctx!.rotate((performance.now() * 0.0005) % (Math.PI * 2)) // Slow rot

    ctx!.shadowColor = COLORS.bossGold
    ctx!.shadowBlur = 15

    // Big Octagon
    ctx!.fillStyle = COLORS.bossGold + '20' // 20% opacity
    ctx!.strokeStyle = COLORS.bossGold
    ctx!.lineWidth = 3

    ctx!.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = ((Math.PI * 2) / 8) * i
      const r = boss.radius
      const bx = Math.cos(angle) * r
      const by = Math.sin(angle) * r
      if (i === 0) ctx!.moveTo(bx, by)
      else ctx!.lineTo(bx, by)
    }
    ctx!.closePath()
    ctx!.fill()
    ctx!.stroke()

    ctx!.shadowBlur = 0
    ctx!.restore()

    // Boss Health Bar UI at top center
    ctx!.fillStyle = COLORS.borderDefault
    ctx!.fillRect(w / 2 - 200, 30, 400, 12)
    ctx!.fillStyle = COLORS.bossGold
    ctx!.fillRect(w / 2 - 200, 30, 400 * (boss.hp / boss.maxHp), 12)
    ctx!.fillStyle = COLORS.textPrimary
    ctx!.font = 'bold 16px Anybody, sans-serif'
    ctx!.textAlign = 'center'
    ctx!.fillText('BOSS', w / 2, 20)
  }

  // Draw Enemies
  enemies.forEach((e) => {
    ctx!.save()
    ctx!.translate(e.pos.x, e.pos.y)
    ctx!.rotate((performance.now() * 0.001) % (Math.PI * 2))

    ctx!.shadowColor = COLORS.sky
    ctx!.shadowBlur = 8

    ctx!.fillStyle = COLORS.sky
    ctx!.strokeStyle = COLORS.borderDefault
    ctx!.lineWidth = 2
    ctx!.beginPath()
    ctx!.moveTo(0, -e.radius)
    ctx!.lineTo(e.radius, 0)
    ctx!.lineTo(0, e.radius)
    ctx!.lineTo(-e.radius, 0)
    ctx!.closePath()
    ctx!.fill()
    ctx!.stroke()
    ctx!.shadowBlur = 0
    ctx!.restore()

    // Draw Enemy Health
    if (e.hp < e.maxHp) {
      ctx!.fillStyle = COLORS.borderDefault
      ctx!.fillRect(e.pos.x - 15, e.pos.y - e.radius - 12, 30, 4)
      ctx!.fillStyle = COLORS.coral
      ctx!.fillRect(e.pos.x - 15, e.pos.y - e.radius - 12, 30 * (e.hp / e.maxHp), 4)
    }
  })

  // Draw Bullets
  bullets.forEach((b) => {
    ctx!.fillStyle = COLORS.sky
    if (b.isPlayer) ctx!.fillStyle = COLORS.coral
    if (b.type === 'power') ctx!.fillStyle = COLORS.amber
    if (b.type === 'boss') ctx!.fillStyle = COLORS.bossGold

    ctx!.shadowColor = ctx!.fillStyle
    ctx!.shadowBlur = b.type === 'power' ? 15 : 10
    ctx!.beginPath()
    ctx!.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2)
    ctx!.fill()
    ctx!.shadowBlur = 0
  })

  // Draw Player
  if (player.hp > 0 && isPlaying.value) {
    ctx!.save()
    ctx!.translate(player.pos.x, player.pos.y)
    ctx!.rotate(player.angle)

    // Barrel
    ctx!.fillStyle = COLORS.amber
    // Longer barrel for power shot
    ctx!.fillRect(10, -5, player.weaponType === 'power' ? 28 : 20, 10)

    // Body Box
    ctx!.fillStyle = COLORS.bgSurface
    ctx!.strokeStyle = COLORS.coral
    ctx!.lineWidth = 3
    ctx!.beginPath()
    ctx!.rect(-16, -16, 32, 32)
    ctx!.fill()
    ctx!.stroke()

    // Center glow
    ctx!.fillStyle = COLORS.coral
    ctx!.beginPath()
    ctx!.arc(0, 0, 8, 0, Math.PI * 2)
    ctx!.fill()

    ctx!.restore()

    // Player Health
    ctx!.fillStyle = COLORS.borderDefault
    ctx!.fillRect(player.pos.x - 20, player.pos.y - 32, 40, 5)
    ctx!.fillStyle = COLORS.coral
    ctx!.fillRect(player.pos.x - 20, player.pos.y - 32, 40 * (player.hp / player.maxHp), 5)

    // Weapon Timer
    if (player.weaponType !== 'normal') {
      ctx!.fillStyle = COLORS.amber
      ctx!.fillRect(
        player.pos.x - 20,
        player.pos.y + 24,
        40 * (player.weaponTimer / WEAPON_DURATION),
        3,
      )
    }
  }
}

// Global loop logic managed by useRafFn
useRafFn(({ delta }) => {
  if (isPlaying.value && !isGameOver.value) {
    update(delta)
  }
  draw()
})

watch([winW, winH], () => {
  resizeCanvas()
})

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    resizeCanvas()
    draw()
  }
})
</script>

<template>
  <div
    class="fixed inset-0 w-screen h-screen overflow-hidden bg-bg-deep font-body selection:bg-accent-coral/30 flex flex-col items-center"
  >
    <!-- Game Canvas -->
    <canvas
      ref="canvasRef"
      class="absolute inset-0 z-0 bg-transparent block"
      :class="{ 'cursor-none': isPlaying, 'cursor-auto': !isPlaying }"
    />

    <!-- UI Overlay container -->
    <div
      class="pointer-events-none absolute inset-0 z-10 flex flex-col p-4 md:p-6 w-full max-w-[1920px] mx-auto"
    >
      <!-- Top HUD -->
      <div v-show="isPlaying" class="flex justify-between items-start animate-fade-up">
        <RouterLink
          to="/"
          class="pointer-events-auto inline-flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors font-display text-sm tracking-wide bg-bg-surface/50 px-4 py-2 border border-border-default backdrop-blur-sm self-start"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          HOME
        </RouterLink>

        <!-- Score Counters -->
        <div class="flex gap-4">
          <div
            class="bg-bg-surface/80 backdrop-blur-md border border-border-default px-6 py-2 flex flex-col items-center shadow-lg shadow-accent-coral/5"
          >
            <span class="text-[10px] text-text-dim font-display tracking-widest uppercase"
              >Score</span
            >
            <span class="text-3xl font-display font-bold text-text-primary group"
              ><span class="text-accent-coral">// </span>{{ score }}</span
            >
          </div>
          <div
            class="bg-bg-surface/80 backdrop-blur-md border border-border-default px-6 py-2 flex flex-col items-center"
          >
            <span class="text-[10px] text-text-dim font-display tracking-widest uppercase"
              >High Score</span
            >
            <span class="text-3xl font-display font-bold text-text-primary"
              ><span class="text-accent-amber">// </span>{{ highScore }}</span
            >
          </div>
        </div>
      </div>

      <!-- Main/Death Screen Menu -->
      <div
        v-if="!isPlaying"
        class="pointer-events-auto flex items-center justify-center flex-1 h-full w-full backdrop-blur-[2px] bg-bg-deep/40"
      >
        <div
          class="bg-bg-surface border border-border-default p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden transition-all duration-300 shadow-2xl hover:border-accent-coral hover:-translate-y-1 hover:shadow-accent-coral/5 group"
        >
          <span
            class="absolute top-3 right-4 font-display text-7xl font-bold text-accent-amber/5 select-none pointer-events-none transition-all group-hover:text-accent-coral/5"
          >
            01
          </span>
          <div
            class="absolute top-0 left-0 w-1 h-full bg-accent-coral opacity-0 group-hover:opacity-100 transition-all duration-300"
          ></div>

          <h1 class="font-display text-5xl md:text-6xl font-bold text-text-primary mb-3 mt-4">
            TANK<span class="text-accent-coral">SHOOTER</span>
          </h1>

          <p
            v-if="!isGameOver"
            class="text-text-secondary text-base mb-10 relative z-10 max-w-sm mx-auto"
          >
            A retro-futuristic arcade shooter. Stay alive, collect power-ups, and destroy the giant
            boss!
          </p>
          <div v-else class="mb-10 relative z-10">
            <h2 class="font-display text-2xl font-semibold text-accent-coral mb-3 animate-pulse">
              GAME OVER
            </h2>
            <p class="text-text-secondary text-lg border-y border-border-default py-3">
              Final Score: <strong class="text-accent-amber text-2xl ml-2">{{ score }}</strong>
            </p>
          </div>

          <!-- Controls Info Box -->
          <div class="grid grid-cols-2 gap-4 mb-10 text-left relative z-10">
            <div class="bg-bg-elevated p-4 border border-border-default hidden sm:block">
              <span
                class="text-accent-amber text-xs font-display tracking-widest uppercase block mb-3"
                >Movement</span
              >
              <div class="flex gap-2 text-text-primary font-display items-center justify-center">
                <kbd class="px-2.5 py-1 bg-bg-deep border border-border-default text-sm shadow-sm"
                  >W</kbd
                >
                <kbd class="px-2.5 py-1 bg-bg-deep border border-border-default text-sm shadow-sm"
                  >A</kbd
                >
                <kbd class="px-2.5 py-1 bg-bg-deep border border-border-default text-sm shadow-sm"
                  >S</kbd
                >
                <kbd class="px-2.5 py-1 bg-bg-deep border border-border-default text-sm shadow-sm"
                  >D</kbd
                >
              </div>
            </div>
            <div class="bg-bg-elevated p-4 border border-border-default hidden sm:block">
              <span
                class="text-accent-coral text-xs font-display tracking-widest uppercase block mb-3"
                >Power-ups</span
              >
              <div class="text-text-primary flex items-center justify-center gap-3">
                <span class="font-display text-sm tracking-wide text-accent-amber">S</span>
                <span class="font-display text-sm tracking-wide text-accent-coral">P</span>
                <span class="font-display text-sm tracking-wide text-green-500">+</span>
              </div>
            </div>
          </div>

          <button
            @click="initGame"
            class="relative z-10 w-full py-4 bg-accent-coral text-bg-deep font-display font-bold text-xl tracking-wider transition-all duration-300 transform hover:bg-white flex items-center justify-center gap-3"
          >
            <!-- Start button arrow animation -->
            {{ isGameOver ? 'PLAY AGAIN' : 'START GAME' }}
            <Icon icon="lucide:rocket" class="size-5" />
          </button>

          <RouterLink
            v-if="!isGameOver"
            to="/"
            class="mt-8 inline-block text-[11px] text-text-dim hover:text-text-primary link-underline font-display tracking-widest uppercase relative z-10"
          >
            Return to Homepage
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
