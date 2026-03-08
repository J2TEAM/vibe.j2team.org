import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type {
  Bullet,
  EnemyTank,
  Tank,
  Direction,
  GameState,
  Wall,
  Particle,
  PowerUp,
} from './types'
import { generateMap } from './mapGenerator'
import { LEVELS } from './levels'

const TILE = 40
const COLS = 20
const ROWS = 15
export const MAP_W = COLS * TILE
export const MAP_H = ROWS * TILE
const BULLET_SPEED = 6
const BULLET_SIZE = 7
const PLAYER_SPEED = 2.2
const ENEMY_CONFIGS = {
  scout: { speed: 1.8, health: 1, shotInterval: 2200, color: '#dc2626', turret: '#f87171' },
  heavy: { speed: 1.0, health: 3, shotInterval: 3000, color: '#7c2d12', turret: '#ea580c' },
  sniper: { speed: 1.3, health: 1, shotInterval: 1500, color: '#4c1d95', turret: '#a78bfa' },
}
const PLAYER_SHOT_COOLDOWN = 350
const RAPID_FIRE_COOLDOWN = 150
const HIGH_SCORE_KEY = 'tank-rescue-highscore'

export function useGameEngine(canvas: () => HTMLCanvasElement | null) {
  const gameState = ref<GameState>('menu')
  const score = ref(0)
  const playerHealth = ref(3)
  const playerMaxHealth = ref(3)
  const enemiesLeft = ref(0)
  const currentLevel = ref(0)
  const levelName = ref('')
  const hasShield = ref(false)
  const hasRapidFire = ref(false)
  const shieldPercent = ref(0)
  const rapidFirePercent = ref(0)
  const highScore = ref(0)

  let ctx: CanvasRenderingContext2D | null = null
  let animFrame = 0
  const keys = new Set<string>()
  let touchDir: Direction | null = null
  let touchShooting = false

  let princess = { x: 0, y: 0, width: TILE, height: TILE }
  let player: Tank = createPlayer(TILE, TILE)
  let enemies: EnemyTank[] = []
  let bullets: Bullet[] = []
  let walls: Wall[] = []
  let particles: Particle[] = []
  let powerUps: PowerUp[] = []
  let lastShotTime = 0
  let shakeIntensity = 0
  let shakeTimer = 0
  let rapidFireTimer = 0
  let rapidFireMax = 500
  let shieldTimer = 0
  let shieldMax = 400
  let gameTime = 0
  let lastFrameTime = 0
  let transitionTimer = 0
  let princessBob = 0

  // Load high score
  try {
    highScore.value = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    /* ignore */
  }

  function saveHighScore() {
    try {
      if (score.value > highScore.value) {
        highScore.value = score.value
        localStorage.setItem(HIGH_SCORE_KEY, String(score.value))
      }
    } catch {
      /* ignore */
    }
  }

  function createPlayer(px: number, py: number): Tank {
    return {
      x: px,
      y: py,
      width: TILE - 4,
      height: TILE - 4,
      direction: 'up',
      speed: PLAYER_SPEED,
      health: 3,
      maxHealth: 3,
      lastShot: 0,
      shotInterval: PLAYER_SHOT_COOLDOWN,
    }
  }

  function levelMultiplier() {
    return 1 + currentLevel.value * 0.2
  }

  function createEnemy(id: number, x: number, y: number, type: EnemyTank['type']): EnemyTank {
    const cfg = ENEMY_CONFIGS[type]
    const mult = levelMultiplier()
    return {
      id,
      x,
      y,
      width: TILE - 4,
      height: TILE - 4,
      direction: 'down',
      speed: cfg.speed * (0.9 + currentLevel.value * 0.15),
      health: type === 'heavy' ? cfg.health + currentLevel.value : cfg.health,
      maxHealth: type === 'heavy' ? cfg.health + currentLevel.value : cfg.health,
      lastShot: Date.now() + Math.random() * 1000,
      shotInterval: Math.max(800, cfg.shotInterval / mult),
      alive: true,
      pathTimer: 0,
      type,
      flashTimer: 0,
    }
  }

  function spawnParticles(x: number, y: number, count: number, color: string, spread = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * spread
      particles.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  function spawnExplosion(x: number, y: number) {
    spawnParticles(x, y, 20, '#facc15', 4)
    spawnParticles(x, y, 15, '#f97316', 3)
    spawnParticles(x, y, 10, '#ef4444', 2)
    triggerShake(6, 15)
  }

  function triggerShake(intensity: number, duration: number) {
    shakeIntensity = intensity
    shakeTimer = duration
  }

  function maybeDropPowerUp(x: number, y: number) {
    if (Math.random() > 0.45) return
    const types: PowerUp['type'][] = ['health', 'rapid_fire', 'shield']
    const type = types[Math.floor(Math.random() * types.length)]!
    powerUps.push({ x, y, type, timer: 600 })
  }

  function loadLevel(levelIndex: number) {
    const lvl = LEVELS[levelIndex]!
    princess = { x: lvl.princessPos.x, y: lvl.princessPos.y, width: TILE, height: TILE }
    player = createPlayer(lvl.playerPos.x, lvl.playerPos.y)
    playerHealth.value = player.health
    playerMaxHealth.value = player.maxHealth
    enemies = lvl.enemies.map((e, i) => createEnemy(i, e.x, e.y, e.type))
    bullets = []
    particles = []
    powerUps = []
    walls = generateMap(
      COLS,
      ROWS,
      TILE,
      lvl.princessPos,
      lvl.playerPos,
      lvl.enemies.map((e) => ({ x: e.x, y: e.y })),
      levelIndex,
    )
    enemiesLeft.value = enemies.length
    levelName.value = lvl.name
    currentLevel.value = levelIndex
    lastShotTime = 0
    shakeIntensity = 0
    shakeTimer = 0
    rapidFireTimer = 0
    shieldTimer = 0
    hasShield.value = false
    hasRapidFire.value = false
    shieldPercent.value = 0
    rapidFirePercent.value = 0
  }

  function startGame() {
    score.value = 0
    gameTime = 0
    loadLevel(0)
    gameState.value = 'playing'
  }

  function nextLevel() {
    const next = currentLevel.value + 1
    if (next >= LEVELS.length) {
      score.value += 1000
      saveHighScore()
      gameState.value = 'won'
    } else {
      loadLevel(next)
      gameState.value = 'level_transition'
      transitionTimer = 120
    }
  }

  function togglePause() {
    if (gameState.value === 'playing') {
      gameState.value = 'paused'
    } else if (gameState.value === 'paused') {
      gameState.value = 'playing'
      lastFrameTime = performance.now()
      animFrame = requestAnimationFrame(gameLoop)
    }
  }

  function collidesWithWalls(x: number, y: number, w: number, h: number): boolean {
    for (const wall of walls) {
      if (x < wall.x + wall.width && x + w > wall.x && y < wall.y + wall.height && y + h > wall.y)
        return true
    }
    return false
  }

  function collidesWithEnemies(
    x: number,
    y: number,
    w: number,
    h: number,
    excludeId?: number,
  ): boolean {
    for (const e of enemies) {
      if (!e.alive || e.id === excludeId) continue
      if (x < e.x + e.width && x + w > e.x && y < e.y + e.height && y + h > e.y) return true
    }
    return false
  }

  function rectsCollide(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
  ) {
    return (
      a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    )
  }

  function moveTank(tank: Tank, dir: Direction, excludeEnemyId?: number): boolean {
    let nx = tank.x
    let ny = tank.y
    tank.direction = dir
    const s = tank.speed
    switch (dir) {
      case 'up':
        ny -= s
        break
      case 'down':
        ny += s
        break
      case 'left':
        nx -= s
        break
      case 'right':
        nx += s
        break
    }
    if (nx < 0 || ny < 0 || nx + tank.width > MAP_W || ny + tank.height > MAP_H) return false
    if (collidesWithWalls(nx, ny, tank.width, tank.height)) return false
    if (collidesWithEnemies(nx, ny, tank.width, tank.height, excludeEnemyId)) return false
    if (excludeEnemyId !== undefined) {
      if (
        nx < player.x + player.width &&
        nx + tank.width > player.x &&
        ny < player.y + player.height &&
        ny + tank.height > player.y
      )
        return false
    }
    tank.x = nx
    tank.y = ny
    return true
  }

  function shoot(tank: Tank, owner: 'player' | 'enemy') {
    const now = Date.now()
    if (now - tank.lastShot < tank.shotInterval) return
    tank.lastShot = now
    let dx = 0,
      dy = 0
    switch (tank.direction) {
      case 'up':
        dy = -BULLET_SPEED
        break
      case 'down':
        dy = BULLET_SPEED
        break
      case 'left':
        dx = -BULLET_SPEED
        break
      case 'right':
        dx = BULLET_SPEED
        break
    }
    bullets.push({
      x: tank.x + tank.width / 2 - 3,
      y: tank.y + tank.height / 2 - 3,
      dx,
      dy,
      owner,
    })
    if (owner === 'player') {
      spawnParticles(tank.x + tank.width / 2, tank.y + tank.height / 2, 4, '#facc15', 1.5)
    }
  }

  function updatePlayer() {
    let dir: Direction | null = touchDir
    if (!dir) {
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dir = 'up'
      else if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dir = 'down'
      else if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dir = 'left'
      else if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dir = 'right'
    }
    if (dir) {
      moveTank(player, dir)
      if (Math.random() > 0.6) {
        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 1, '#555', 0.5)
      }
    }

    const cooldown = rapidFireTimer > 0 ? RAPID_FIRE_COOLDOWN : PLAYER_SHOT_COOLDOWN
    if (keys.has(' ') || touchShooting) {
      const now = Date.now()
      if (now - lastShotTime >= cooldown) {
        shoot(player, 'player')
        lastShotTime = now
      }
    }

    // Collect power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i]!
      const pr = { x: p.x, y: p.y, width: TILE * 0.6, height: TILE * 0.6 }
      if (rectsCollide(player, pr)) {
        switch (p.type) {
          case 'health':
            player.health = Math.min(player.health + 1, player.maxHealth)
            playerHealth.value = player.health
            spawnParticles(p.x, p.y, 8, '#4ade80', 2)
            break
          case 'rapid_fire':
            rapidFireMax = 500
            rapidFireTimer = rapidFireMax
            hasRapidFire.value = true
            spawnParticles(p.x, p.y, 8, '#facc15', 2)
            break
          case 'shield':
            shieldMax = 400
            shieldTimer = shieldMax
            hasShield.value = true
            spawnParticles(p.x, p.y, 8, '#60a5fa', 2)
            break
        }
        powerUps.splice(i, 1)
      }
    }
  }

  function updateEnemies() {
    const now = Date.now()
    for (const e of enemies) {
      if (!e.alive) continue
      if (e.flashTimer > 0) e.flashTimer--

      e.pathTimer--
      if (e.pathTimer <= 0) {
        const dx = player.x - e.x
        const dy = player.y - e.y

        if (e.type === 'sniper') {
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < TILE * 4) {
            // Retreat perpendicular or away
            if (Math.random() > 0.4) {
              e.direction =
                Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 'up' : 'down') : dx > 0 ? 'left' : 'right'
            } else {
              e.direction = dx > 0 ? 'left' : 'right'
            }
          } else if (Math.abs(dx) < TILE) {
            e.direction = dy > 0 ? 'down' : 'up'
          } else if (Math.abs(dy) < TILE) {
            e.direction = dx > 0 ? 'right' : 'left'
          } else {
            e.direction =
              Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
          }
          e.pathTimer = 35 + Math.floor(Math.random() * 25)
        } else if (e.type === 'heavy') {
          if (Math.abs(dx) > Math.abs(dy)) {
            e.direction = dx > 0 ? 'right' : 'left'
          } else {
            e.direction = dy > 0 ? 'down' : 'up'
          }
          e.pathTimer = 20 + Math.floor(Math.random() * 20)
        } else {
          // Scout: alternate between flanking and direct approach
          const flankChance = Math.abs(dx) > TILE * 3 ? 0.6 : 0.3
          if (Math.random() < flankChance) {
            // Flank perpendicular
            e.direction = dy > 0 ? 'down' : 'up'
            if (Math.abs(dy) < TILE * 2) {
              e.direction = dx > 0 ? 'right' : 'left'
            }
          } else {
            if (Math.abs(dx) > Math.abs(dy)) {
              e.direction = dx > 0 ? 'right' : 'left'
            } else {
              e.direction = dy > 0 ? 'down' : 'up'
            }
          }
          e.pathTimer = 20 + Math.floor(Math.random() * 30)
        }
      }

      if (!moveTank(e, e.direction, e.id)) {
        // Try all 4 directions to escape stuck state
        const dirs: Direction[] = ['up', 'down', 'left', 'right']
        // Shuffle to avoid always picking same fallback
        for (let i = dirs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[dirs[i]!, dirs[j]!] = [dirs[j]!, dirs[i]!]
        }
        let escaped = false
        for (const d of dirs) {
          if (d !== e.direction && moveTank(e, d, e.id)) {
            escaped = true
            break
          }
        }
        if (!escaped) {
          e.pathTimer = 5 // Retry soon
        } else {
          e.pathTimer = 15
        }
      }

      if (now - e.lastShot > e.shotInterval) {
        const dx = player.x - e.x
        const dy = player.y - e.y
        if (Math.abs(dx) > Math.abs(dy)) {
          e.direction = dx > 0 ? 'right' : 'left'
        } else {
          e.direction = dy > 0 ? 'down' : 'up'
        }
        shoot(e, 'enemy')
      }
    }
  }

  function updateBullets() {
    const remaining: Bullet[] = []
    for (const b of bullets) {
      b.x += b.dx
      b.y += b.dy

      if (b.x < 0 || b.y < 0 || b.x > MAP_W || b.y > MAP_H) continue

      let hitWall = false
      for (let w = walls.length - 1; w >= 0; w--) {
        const wall = walls[w]!
        if (
          b.x < wall.x + wall.width &&
          b.x + BULLET_SIZE > wall.x &&
          b.y < wall.y + wall.height &&
          b.y + BULLET_SIZE > wall.y
        ) {
          if (wall.destructible) {
            wall.health--
            spawnParticles(b.x, b.y, 5, '#8B6914', 1.5)
            if (wall.health <= 0) {
              spawnParticles(wall.x + wall.width / 2, wall.y + wall.height / 2, 10, '#6B4914', 2)
              walls.splice(w, 1)
            }
          } else {
            spawnParticles(b.x, b.y, 3, '#999', 1)
          }
          hitWall = true
          break
        }
      }
      if (hitWall) continue

      if (b.owner === 'enemy') {
        if (
          b.x < player.x + player.width &&
          b.x + BULLET_SIZE > player.x &&
          b.y < player.y + player.height &&
          b.y + BULLET_SIZE > player.y
        ) {
          if (shieldTimer > 0) {
            // Shield blocks damage, bullet consumed
            spawnParticles(b.x, b.y, 8, '#60a5fa', 2)
          } else {
            player.health--
            playerHealth.value = player.health
            triggerShake(4, 10)
            spawnParticles(
              player.x + player.width / 2,
              player.y + player.height / 2,
              10,
              '#ef4444',
              2,
            )
            if (player.health <= 0) {
              spawnExplosion(player.x + player.width / 2, player.y + player.height / 2)
              saveHighScore()
              gameState.value = 'lost'
            }
          }
          continue
        }
      }

      let hitEnemy = false
      if (b.owner === 'player') {
        for (const e of enemies) {
          if (!e.alive) continue
          if (
            b.x < e.x + e.width &&
            b.x + BULLET_SIZE > e.x &&
            b.y < e.y + e.height &&
            b.y + BULLET_SIZE > e.y
          ) {
            e.health--
            e.flashTimer = 6
            spawnParticles(b.x, b.y, 6, ENEMY_CONFIGS[e.type].turret, 2)
            if (e.health <= 0) {
              e.alive = false
              const pointMap = { scout: 100, heavy: 250, sniper: 200 }
              score.value += pointMap[e.type]
              enemiesLeft.value = enemies.filter((en) => en.alive).length
              spawnExplosion(e.x + e.width / 2, e.y + e.height / 2)
              maybeDropPowerUp(e.x, e.y)
            }
            hitEnemy = true
            break
          }
        }
      }
      if (hitEnemy) continue

      remaining.push(b)
    }
    bullets = remaining
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      p.x += p.dx
      p.y += p.dy
      p.dx *= 0.96
      p.dy *= 0.96
      p.life--
      if (p.life <= 0) particles.splice(i, 1)
    }
  }

  function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i]!
      p.timer--
      if (p.timer <= 0) powerUps.splice(i, 1)
    }
    if (rapidFireTimer > 0) {
      rapidFireTimer--
      rapidFirePercent.value = Math.round((rapidFireTimer / rapidFireMax) * 100)
      if (rapidFireTimer <= 0) {
        hasRapidFire.value = false
        rapidFirePercent.value = 0
      }
    }
    if (shieldTimer > 0) {
      shieldTimer--
      shieldPercent.value = Math.round((shieldTimer / shieldMax) * 100)
      if (shieldTimer <= 0) {
        hasShield.value = false
        shieldPercent.value = 0
      }
    }
  }

  function checkWin() {
    if (enemies.every((e) => !e.alive) && rectsCollide(player, princess)) {
      score.value += 300
      nextLevel()
    }
  }

  // ── Rendering ──────────────────────────────────────────────

  function drawTank(t: Tank, bodyColor: string, turretColor: string, isPlayer = false) {
    if (!ctx) return

    ctx.fillStyle = '#333'
    const treadW = 5
    switch (t.direction) {
      case 'up':
      case 'down':
        ctx.fillRect(t.x - 1, t.y + 2, treadW, t.height - 4)
        ctx.fillRect(t.x + t.width - treadW + 1, t.y + 2, treadW, t.height - 4)
        break
      case 'left':
      case 'right':
        ctx.fillRect(t.x + 2, t.y - 1, t.width - 4, treadW)
        ctx.fillRect(t.x + 2, t.y + t.height - treadW + 1, t.width - 4, treadW)
        break
    }

    ctx.fillStyle = bodyColor
    ctx.fillRect(t.x + 3, t.y + 3, t.width - 6, t.height - 6)
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(t.x + 4, t.y + 4, t.width - 8, (t.height - 8) / 2)

    const cx = t.x + t.width / 2
    const cy = t.y + t.height / 2

    ctx.beginPath()
    ctx.arc(cx, cy, t.width / 3.5, 0, Math.PI * 2)
    ctx.fillStyle = turretColor
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    const barrelLen = t.width / 2 + 6
    const barrelW = 7
    ctx.save()
    ctx.translate(cx, cy)
    let angle = 0
    switch (t.direction) {
      case 'up':
        angle = -Math.PI / 2
        break
      case 'down':
        angle = Math.PI / 2
        break
      case 'left':
        angle = Math.PI
        break
      case 'right':
        angle = 0
        break
    }
    ctx.rotate(angle)
    ctx.fillStyle = turretColor
    ctx.fillRect(4, -barrelW / 2, barrelLen - 4, barrelW)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(barrelLen - 6, -barrelW / 2, 4, barrelW)
    ctx.restore()

    if (isPlayer && shieldTimer > 0) {
      ctx.save()
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.15
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, t.width / 2 + 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.restore()
    }

    if (!isPlayer && t.health < t.maxHealth) {
      const barW = t.width - 4
      const barH = 3
      const barX = t.x + 2
      const barY = t.y - 6
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2)
      ctx.fillStyle = t.health > 1 ? '#4ade80' : '#ef4444'
      ctx.fillRect(barX, barY, (t.health / t.maxHealth) * barW, barH)
    }
  }

  function drawPrincess(unlocked: boolean) {
    if (!ctx) return
    const px = princess.x
    const bob = unlocked ? Math.sin(princessBob) * 2 : 0
    const py = princess.y + bob

    if (unlocked) {
      ctx.save()
      ctx.globalAlpha = 0.3 + Math.sin(princessBob * 2) * 0.15
      const grd = ctx.createRadialGradient(
        px + princess.width / 2,
        py + princess.height / 2,
        5,
        px + princess.width / 2,
        py + princess.height / 2,
        TILE,
      )
      grd.addColorStop(0, '#f8b4c8')
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.fillRect(px - TILE / 2, py - TILE / 2, TILE * 2, TILE * 2)
      ctx.restore()
    }

    ctx.fillStyle = unlocked ? '#f8b4c8' : '#555'
    ctx.fillRect(px + 6, py + 10, princess.width - 12, princess.height - 10)
    ctx.fillStyle = unlocked ? '#e91e8c' : '#333'
    ctx.fillRect(px + 12, py + 16, 6, 6)
    ctx.fillRect(px + princess.width - 18, py + 16, 6, 6)

    ctx.fillStyle = unlocked ? '#e91e8c' : '#888'
    ctx.beginPath()
    ctx.moveTo(px + 3, py + 14)
    ctx.lineTo(px + princess.width / 2, py + 2)
    ctx.lineTo(px + princess.width - 3, py + 14)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = unlocked ? '#ff1493' : '#666'
    ctx.fillRect(px + princess.width / 2 - 1, py, 2, 6)
    ctx.beginPath()
    ctx.moveTo(px + princess.width / 2 + 1, py)
    ctx.lineTo(px + princess.width / 2 + 8, py + 3)
    ctx.lineTo(px + princess.width / 2 + 1, py + 6)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = unlocked ? '#ff1493' : '#aaa'
    ctx.font = 'bold 12px serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      unlocked ? '\u2665' : '\uD83D\uDD12',
      px + princess.width / 2,
      py + princess.height - 2,
    )
  }

  function drawPowerUp(p: PowerUp) {
    if (!ctx) return
    const bob = Math.sin(Date.now() / 200 + p.x) * 3
    const cx = p.x + TILE * 0.3
    const cy = p.y + TILE * 0.3 + bob

    ctx.save()
    ctx.globalAlpha = 0.4
    const colors = { health: '#4ade80', rapid_fire: '#facc15', shield: '#60a5fa' }
    const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14)
    grd.addColorStop(0, colors[p.type])
    grd.addColorStop(1, 'transparent')
    ctx.fillStyle = grd
    ctx.fillRect(cx - 14, cy - 14, 28, 28)
    ctx.restore()

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = colors[p.type]
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const icons = { health: '+', rapid_fire: 'F', shield: 'S' }
    ctx.fillText(icons[p.type], cx, cy + 1)
    ctx.textBaseline = 'alphabetic'
  }

  function render() {
    if (!ctx) return

    ctx.save()

    if (shakeTimer > 0) {
      shakeTimer--
      const sx = (Math.random() - 0.5) * shakeIntensity
      const sy = (Math.random() - 0.5) * shakeIntensity
      ctx.translate(sx, sy)
    }

    const bgGrad = ctx.createLinearGradient(0, 0, 0, MAP_H)
    bgGrad.addColorStop(0, '#0f172a')
    bgGrad.addColorStop(1, '#1e293b')
    ctx.fillStyle = bgGrad
    ctx.fillRect(-5, -5, MAP_W + 10, MAP_H + 10)

    ctx.strokeStyle = 'rgba(255,255,255,0.025)'
    ctx.lineWidth = 1
    for (let x = 0; x <= MAP_W; x += TILE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, MAP_H)
      ctx.stroke()
    }
    for (let y = 0; y <= MAP_H; y += TILE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(MAP_W, y)
      ctx.stroke()
    }

    for (const wall of walls) {
      if (wall.destructible) {
        ctx.globalAlpha = wall.health > 1 ? 1 : 0.7
        ctx.fillStyle = '#92640f'
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height)
        ctx.strokeStyle = '#6b4a0a'
        ctx.lineWidth = 1
        ctx.strokeRect(wall.x + 1, wall.y + 1, wall.width - 2, wall.height - 2)
        ctx.beginPath()
        ctx.moveTo(wall.x, wall.y + wall.height / 2)
        ctx.lineTo(wall.x + wall.width, wall.y + wall.height / 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(wall.x + wall.width / 2, wall.y)
        ctx.lineTo(wall.x + wall.width / 2, wall.y + wall.height / 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(wall.x + wall.width / 4, wall.y + wall.height / 2)
        ctx.lineTo(wall.x + wall.width / 4, wall.y + wall.height)
        ctx.stroke()
        ctx.globalAlpha = 1
      } else {
        ctx.fillStyle = '#334155'
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height)
        ctx.fillStyle = '#475569'
        ctx.fillRect(wall.x + 2, wall.y + 2, wall.width - 4, wall.height - 4)
        ctx.fillStyle = '#334155'
        ctx.fillRect(wall.x + 4, wall.y + 4, wall.width - 8, wall.height - 8)
        ctx.fillStyle = '#64748b'
        const r = 2
        ctx.beginPath()
        ctx.arc(wall.x + 5, wall.y + 5, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(wall.x + wall.width - 5, wall.y + 5, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(wall.x + 5, wall.y + wall.height - 5, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(wall.x + wall.width - 5, wall.y + wall.height - 5, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (const p of powerUps) drawPowerUp(p)

    const allDead = enemies.every((e) => !e.alive)
    drawPrincess(allDead)

    for (const e of enemies) {
      if (!e.alive) continue
      const cfg = ENEMY_CONFIGS[e.type]
      if (e.flashTimer > 0 && e.flashTimer % 2 === 0) {
        drawTank(e, '#fff', '#fff')
      } else {
        drawTank(e, cfg.color, cfg.turret)
      }
    }

    drawTank(player, '#166534', '#4ade80', true)

    for (const b of bullets) {
      if (b.owner === 'player') {
        ctx.fillStyle = '#facc15'
        ctx.shadowColor = '#facc15'
        ctx.shadowBlur = 6
      } else {
        ctx.fillStyle = '#f97316'
        ctx.shadowColor = '#f97316'
        ctx.shadowBlur = 6
      }
      ctx.beginPath()
      ctx.arc(b.x + 3, b.y + 3, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    for (const p of particles) {
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1

    if (allDead) {
      const dx = princess.x + princess.width / 2 - (player.x + player.width / 2)
      const dy = princess.y + princess.height / 2 - (player.y + player.height / 2)
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > TILE * 3) {
        const ax = player.x + player.width / 2 + (dx / dist) * TILE
        const ay = player.y + player.height / 2 + (dy / dist) * TILE
        ctx.fillStyle = '#ff69b4'
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.3
        ctx.beginPath()
        ctx.arc(ax, ay, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    ctx.restore()
  }

  function gameLoop() {
    const now = performance.now()
    lastFrameTime = now

    if (gameState.value === 'level_transition') {
      transitionTimer--
      render()
      if (transitionTimer <= 0) {
        gameState.value = 'playing'
      }
      animFrame = requestAnimationFrame(gameLoop)
      return
    }

    if (gameState.value !== 'playing') return

    gameTime += now - lastFrameTime

    princessBob += 0.05

    updatePlayer()
    updateEnemies()
    updateBullets()
    updateParticles()
    updatePowerUps()
    checkWin()
    render()

    animFrame = requestAnimationFrame(gameLoop)
  }

  function handleKeydown(e: KeyboardEvent) {
    keys.add(e.key)
    if (e.key === ' ') e.preventDefault()
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      togglePause()
    }
  }

  function handleKeyup(e: KeyboardEvent) {
    keys.delete(e.key)
  }

  function setTouchDir(dir: Direction | null) {
    touchDir = dir
  }

  function setTouchShoot(shooting: boolean) {
    touchShooting = shooting
  }

  function initCanvas() {
    const c = canvas()
    if (!c) return
    c.width = MAP_W
    c.height = MAP_H
    ctx = c.getContext('2d')
  }

  async function start() {
    startGame()
    await nextTick()
    initCanvas()
    lastFrameTime = performance.now()
    animFrame = requestAnimationFrame(gameLoop)
  }

  function resume() {
    if (gameState.value === 'paused') {
      togglePause()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
    cancelAnimationFrame(animFrame)
  })

  return {
    gameState,
    score,
    playerHealth,
    playerMaxHealth,
    enemiesLeft,
    currentLevel,
    levelName,
    hasShield,
    hasRapidFire,
    shieldPercent,
    rapidFirePercent,
    highScore,
    start,
    resume,
    togglePause,
    setTouchDir,
    setTouchShoot,
  }
}
