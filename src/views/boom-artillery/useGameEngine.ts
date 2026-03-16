import { computed, ref } from 'vue'
import {
  ANGLE_STEP,
  CANVAS_ASPECT,
  DAMAGE_DIRECT,
  DAMAGE_SPLASH,
  DIFFICULTIES,
  EXPLOSION_RADIUS,
  GRAVITY,
  MAX_ANGLE,
  MAX_POWER,
  MAX_STAMINA,
  MIN_ANGLE,
  MOVE_SPEED,
  POWER_CHARGE_RATE,
  STAMINA_PER_MOVE,
  TANK_HEIGHT,
  TANK_WIDTH,
  TERRAIN_SLOPE_MAX_OFFSET,
  TERRAIN_SLOPE_RANGE,
  WEAPONS,
} from './constants'
import {
  drawAngleCone,
  drawParticles,
  drawProjectile,
  drawSky,
  drawStars,
  drawTank,
  drawTerrain,
  markTerrainDirty,
} from './renderer'
import type { GameState, Particle, Projectile, Star, Tank, Turn, Weapon, Winner } from './types'

export function useGameEngine() {
  // ============ REACTIVE STATE ============
  const gameState = ref<GameState>('menu')
  const difficulty = ref('medium')
  const currentTurn = ref<Turn>('player')
  const isFiring = ref(false)
  const winner = ref<Winner>('player')

  const gameMode = ref<'pve' | 'pvp'>('pve')
  const inactiveState = {
    angle: 135,
    power: 10,
  }

  const playerAngle = ref(45)
  const playerPower = ref(10)
  const playerHP = ref(100)
  const botHP = ref(100)
  const wind = ref(0)
  const playerStamina = ref(MAX_STAMINA)

  const totalShots = ref(0)
  const totalHits = ref(0)

  // Charging state
  const isCharging = ref(false)

  // Facing direction (reactive for HUD)
  const isFacingRight = ref(true)
  const playerSlopeRad = ref(0)

  const selectedWeaponIds = ref<string[]>([])
  const remainingShots = ref(0)

  const diffLabel = computed(() => {
    const d = DIFFICULTIES.find((d) => d.id === difficulty.value)
    return d ? d.icon : ''
  })

  const accuracy = computed(() => {
    if (totalShots.value === 0) return 0
    return Math.round((totalHits.value / totalShots.value) * 100)
  })

  // ============ INTERNAL STATE ============
  // WORMS-STYLE: Pixel-based terrain bitmap
  // terrainBitmap[y * canvasWidth + x] = 0 (air) or 1 (solid)
  let terrainBitmap: Uint8Array = new Uint8Array(0)

  // Surface cache: surfaceY[x] = topmost solid pixel Y in column x (for fast lookups)
  let surfaceCache: Int32Array = new Int32Array(0)

  let playerTank: Tank | null = null
  let botTank: Tank | null = null
  let projectiles: Projectile[] = []
  let particles: Particle[] = []
  let stars: Star[] = []
  let animFrameId = 0
  let canvasWidth = 800
  let canvasHeight = 450

  // Movement & input state
  let moveDirection: 'left' | 'right' | null = null
  let _angleDirection: 'up' | 'down' | null = null
  let chargingInternal = false
  let facingDirection: 'left' | 'right' = 'right' // barrel faces this direction

  // Key state tracking
  const keysDown = new Set<string>()

  // Single-press angle tracking (1 press = 1 degree, hold for continuous)
  let angleKeyHeld: 'up' | 'down' | null = null
  let _angleKeyFirstFired = false
  let angleKeyHoldTimer: ReturnType<typeof setTimeout> | null = null
  let angleKeyRepeatInterval: ReturnType<typeof setInterval> | null = null
  const ANGLE_HOLD_DELAY = 300 // ms before continuous mode kicks in
  const ANGLE_REPEAT_RATE = 50 // ms between angle changes in continuous mode

  // ============ SURFACE CACHE ============
  function rebuildSurfaceCache() {
    surfaceCache = new Int32Array(canvasWidth)
    for (let x = 0; x < canvasWidth; x++) {
      surfaceCache[x] = getSurfaceY(x)
    }
  }

  function getSurfaceY(x: number): number {
    if (x < 0 || x >= canvasWidth) return canvasHeight
    for (let y = 0; y < canvasHeight; y++) {
      if (terrainBitmap[y * canvasWidth + x] === 1) {
        return y
      }
    }
    return canvasHeight // no solid pixel in this column
  }

  function updateSurfaceCacheRange(startX: number, endX: number) {
    const sx = Math.max(0, startX)
    const ex = Math.min(canvasWidth - 1, endX)
    for (let x = sx; x <= ex; x++) {
      surfaceCache[x] = getSurfaceY(x)
    }
  }

  // ============ TERRAIN SLOPE ============
  function getTerrainSlope(tankX: number): number {
    // Sample surface heights to the left and right of tank position
    const leftX = Math.max(0, Math.floor(tankX - TERRAIN_SLOPE_RANGE))
    const rightX = Math.min(canvasWidth - 1, Math.floor(tankX + TERRAIN_SLOPE_RANGE))
    if (leftX >= rightX) return 0

    const leftY = surfaceCache[leftX] ?? canvasHeight
    const rightY = surfaceCache[rightX] ?? canvasHeight
    // Positive slope = terrain goes DOWN to the right (tank tilts right)
    // Negative slope = terrain goes UP to the right (tank tilts left)
    const slopeRad = Math.atan2(rightY - leftY, rightX - leftX)
    const slopeDeg = (slopeRad * 180) / Math.PI

    // Clamp to max offset
    return Math.max(-TERRAIN_SLOPE_MAX_OFFSET, Math.min(TERRAIN_SLOPE_MAX_OFFSET, slopeDeg))
  }

  const terrainSlopeOffset = ref(0)

  function getActiveTank() {
    return currentTurn.value === 'player' ? playerTank : botTank
  }

  function updateSlopeOffset() {
    const activeTank = getActiveTank()
    if (!activeTank) {
      terrainSlopeOffset.value = 0
      return
    }
    terrainSlopeOffset.value = getTerrainSlope(activeTank.x)
  }

  // ============ TERRAIN GENERATION (WORMS-STYLE) ============
  function generateTerrain(width: number, height: number): Uint8Array {
    const bitmap = new Uint8Array(width * height)

    // Step 1: Generate surface profile using multi-octave noise
    const surface: number[] = Array.from<number>({ length: width })
    const baseHeight = height * 0.5
    const amplitude = height * 0.28

    // Octave 1: Large mountains/valleys (2-4 features across the map)
    const freq1 = 2 + Math.random() * 2
    const phase1 = Math.random() * Math.PI * 2
    // Octave 2: Medium hills
    const freq2 = 5 + Math.random() * 4
    const phase2 = Math.random() * Math.PI * 2
    // Octave 3: Small bumps (Worms-style roughness)
    const freq3 = 12 + Math.random() * 8
    const phase3 = Math.random() * Math.PI * 2
    // Octave 4: Micro detail (pixel-level roughness)
    const freq4 = 30 + Math.random() * 20
    const phase4 = Math.random() * Math.PI * 2

    for (let x = 0; x < width; x++) {
      const nx = x / width
      const h1 = Math.sin(nx * Math.PI * freq1 + phase1) * amplitude * 0.5
      const h2 = Math.sin(nx * Math.PI * freq2 + phase2) * amplitude * 0.2
      const h3 = Math.sin(nx * Math.PI * freq3 + phase3) * amplitude * 0.08
      const h4 = Math.sin(nx * Math.PI * freq4 + phase4) * amplitude * 0.03
      surface[x] = baseHeight + h1 + h2 + h3 + h4
    }

    // Clamp surface heights
    for (let x = 0; x < width; x++) {
      surface[x] = Math.max(height * 0.15, Math.min(height * 0.82, surface[x]!))
    }

    // Light smoothing (2 passes - keep some roughness unlike the old terrain)
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < width - 1; i++) {
        surface[i] = surface[i]! * 0.6 + (surface[i - 1]! + surface[i + 1]!) * 0.2
      }
    }

    // Step 2: Fill bitmap - everything below surface = solid
    for (let x = 0; x < width; x++) {
      const sy = Math.floor(surface[x]!)
      for (let y = sy; y < height; y++) {
        bitmap[y * width + x] = 1
      }
    }

    // Step 3: Add some random "holes" and rough edges for natural look
    // Small pockmarks on the surface
    for (let i = 0; i < Math.floor(width * 0.03); i++) {
      const cx = Math.floor(Math.random() * width)
      const sy = Math.floor(surface[cx]!)
      const r = 2 + Math.random() * 4
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r * 0.7) {
            const px = cx + dx
            const py = sy + dy
            if (px >= 0 && px < width && py >= 0 && py < height) {
              bitmap[py * width + px] = 0
            }
          }
        }
      }
    }

    return bitmap
  }

  function initStars() {
    stars = []
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight * 0.5,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
      })
    }
  }

  // ============ TANK PLACEMENT ============
  function placeTanks() {
    isFacingRight.value = true
    facingDirection = 'right'
    const leftX = Math.floor(canvasWidth * 0.1 + Math.random() * canvasWidth * 0.1)
    const rightX = Math.floor(canvasWidth * 0.8 + Math.random() * canvasWidth * 0.1)

    const leftSurface = surfaceCache[leftX] ?? canvasHeight
    const rightSurface = surfaceCache[rightX] ?? canvasHeight

    playerTank = {
      x: leftX,
      y: leftSurface - TANK_HEIGHT / 2,
      width: TANK_WIDTH,
      height: TANK_HEIGHT,
      color: '#22c55e',
      barrelColor: '#16a34a',
      angle: (playerAngle.value * Math.PI) / 180,
      facingRight: true,
      hp: 100,
    }

    botTank = {
      x: rightX,
      y: rightSurface - TANK_HEIGHT / 2,
      width: TANK_WIDTH,
      height: TANK_HEIGHT,
      color: '#ef4444',
      barrelColor: '#dc2626',
      angle: (45 * Math.PI) / 180,
      facingRight: false,
      hp: 100,
    }
  }

  // ============ TANK MOVEMENT (WORMS-STYLE) ============
  function isTooSteep(currentX: number, direction: 'left' | 'right'): boolean {
    const currentFloorX = Math.floor(currentX)
    const checkDist = 4
    const targetX =
      direction === 'left'
        ? Math.max(0, currentFloorX - checkDist)
        : Math.min(canvasWidth - 1, currentFloorX + checkDist)

    if (targetX === currentFloorX) return true // At edge of map

    const actualDist = Math.abs(targetX - currentFloorX)
    const currentSurface = surfaceCache[currentFloorX] ?? canvasHeight
    const targetSurface = surfaceCache[targetX] ?? canvasHeight

    if (targetSurface >= canvasHeight) return true // Hole in the ground

    const rise = currentSurface - targetSurface

    if (rise > actualDist * 1.2) return true // Too steep up
    // Allow going down steep slopes (cliffs)

    return false
  }

  function moveTank(direction: 'left' | 'right') {
    const activeTank = getActiveTank()
    if (!activeTank || isFiring.value) return
    if (gameState.value !== 'playing') return
    if (currentTurn.value === 'bot' && gameMode.value === 'pve') return

    // Worms-style: moving flips the tank (but now keeps local angle same)
    facingDirection = direction
    isFacingRight.value = direction === 'right'
    activeTank.facingRight = direction === 'right'

    syncBarrelAngle()

    if (playerStamina.value < STAMINA_PER_MOVE) return // not enough stamina to move
    if (isTooSteep(activeTank.x, direction)) return // steep terrain

    const dx = direction === 'left' ? -MOVE_SPEED : MOVE_SPEED
    const newX = activeTank.x + dx

    // Boundary check - restrict player movement limits
    const minX = TANK_WIDTH
    const maxX = gameMode.value === 'pvp' ? canvasWidth - TANK_WIDTH : canvasWidth * 0.45
    if (newX < minX || newX > maxX) return

    // Check terrain exists at that position
    const floorX = Math.floor(newX)
    if (floorX < 0 || floorX >= canvasWidth) return

    const newSurface = surfaceCache[floorX] ?? canvasHeight
    if (newSurface >= canvasHeight) return // no ground

    activeTank.x = newX
    activeTank.y = newSurface - TANK_HEIGHT / 2
    playerStamina.value = Math.max(0, playerStamina.value - STAMINA_PER_MOVE)
  }

  function adjustAngle(direction: 'up' | 'down') {
    if (isFiring.value) return
    if (gameState.value !== 'playing') return
    if (currentTurn.value === 'bot' && gameMode.value === 'pve') return

    const delta = direction === 'up' ? ANGLE_STEP : -ANGLE_STEP
    const newAngle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, playerAngle.value + delta))
    playerAngle.value = newAngle

    syncBarrelAngle()
  }

  // ============ CHARGING ============
  function startCharging() {
    if (isFiring.value) return
    if (gameState.value !== 'playing') return
    if (currentTurn.value === 'bot' && gameMode.value === 'pve') return

    chargingInternal = true
    isCharging.value = true
    playerPower.value = 10 // reset power when starting a new charge
  }

  function updateCharging() {
    if (!chargingInternal) return
    playerPower.value = Math.min(100, playerPower.value + POWER_CHARGE_RATE)
  }

  function releaseCharge() {
    if (!chargingInternal) return
    chargingInternal = false
    isCharging.value = false

    // Fire with current power
    playerFire()
  }

  // ============ EXPLOSIONS (WORMS-STYLE CIRCULAR CRATER) ============
  function createExplosion(
    x: number,
    y: number,
    radiusMultiplier: number,
    weaponId: string = 'standard',
  ) {
    const explosionRadius = EXPLOSION_RADIUS * radiusMultiplier
    let colors = [
      'rgba(255, 200, 50, 1)',
      'rgba(255, 100, 0, 1)',
      'rgba(255, 50, 0, 1)',
      'rgba(255, 255, 100, 1)',
      'rgba(200, 200, 200, 1)',
    ]

    if (weaponId.includes('plus1')) {
      colors = [
        'rgba(50, 200, 255, 1)',
        'rgba(0, 100, 255, 1)',
        'rgba(0, 50, 255, 1)',
        'rgba(100, 255, 255, 1)',
        'rgba(200, 220, 255, 1)',
      ]
    } else if (weaponId.includes('plus2')) {
      colors = [
        'rgba(200, 50, 255, 1)',
        'rgba(150, 0, 255, 1)',
        'rgba(100, 0, 200, 1)',
        'rgba(255, 150, 255, 1)',
        'rgba(220, 200, 255, 1)',
      ]
    }

    const particleCount = Math.floor(40 * radiusMultiplier)
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 4 * radiusMultiplier + 1
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        size: Math.random() * 5 * radiusMultiplier + 2,
      })
    }

    // Add dirt/terrain debris particles
    const debrisCount = Math.floor(20 * radiusMultiplier)
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 3 + 0.5
      particles.push({
        x: x + (Math.random() - 0.5) * explosionRadius,
        y: y + (Math.random() - 0.5) * explosionRadius * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 30 + Math.random() * 30,
        maxLife: 60,
        color: `rgba(${100 + Math.random() * 50}, ${70 + Math.random() * 30}, ${30 + Math.random() * 20}, 1)`,
        size: Math.random() * 3 + 1,
      })
    }

    // ========== WORMS-STYLE TERRAIN DESTRUCTION ==========
    // Remove all pixels within the explosion radius (circular crater)
    const R = Math.round(explosionRadius)
    const cx = Math.round(x)
    const cy = Math.round(y)

    const startX = Math.max(0, cx - R)
    const endX = Math.min(canvasWidth - 1, cx + R)
    const startY = Math.max(0, cy - R)
    const endY = Math.min(canvasHeight - 1, cy + R)

    for (let py = startY; py <= endY; py++) {
      for (let px = startX; px <= endX; px++) {
        const dx = px - x
        const dy = py - y
        if (dx * dx + dy * dy <= R * R) {
          terrainBitmap[py * canvasWidth + px] = 0 // remove terrain pixel
        }
      }
    }

    // Update surface cache for affected columns
    updateSurfaceCacheRange(startX, endX)

    // Mark terrain as dirty for re-rendering
    markTerrainDirty()

    // Apply tank gravity (tanks fall if terrain removed under them)
    applyTankGravity(playerTank)
    applyTankGravity(botTank)
  }

  // ============ TANK GRAVITY ============
  function applyTankGravity(tank: Tank | null) {
    if (!tank) return
    const floorX = Math.max(0, Math.min(canvasWidth - 1, Math.floor(tank.x)))
    const newSurface = surfaceCache[floorX] ?? canvasHeight

    // Tank should sit on the surface
    const targetY = newSurface - TANK_HEIGHT / 2

    // If tank is above the surface (ground was removed), snap to new surface
    if (tank.y < targetY) {
      tank.y = targetY
    }
  }

  // ============ DAMAGE ============
  function applyDamage(target: 'player' | 'bot', damage: number) {
    if (target === 'player') {
      const newHP = Math.max(0, playerHP.value - damage)
      playerHP.value = newHP
      if (playerTank) playerTank.hp = newHP
      if (currentTurn.value === 'bot' && gameMode.value === 'pvp') totalHits.value++
    } else {
      const newHP = Math.max(0, botHP.value - damage)
      botHP.value = newHP
      if (botTank) botTank.hp = newHP
      if (currentTurn.value === 'player') totalHits.value++
    }
  }

  function checkSplashDamage(ex: number, ey: number, damageMult: number, radiusMult: number) {
    const explosionRadius = EXPLOSION_RADIUS * radiusMult
    const targets = [
      { tank: playerTank, key: 'player' as const },
      { tank: botTank, key: 'bot' as const },
    ]

    for (const { tank, key } of targets) {
      if (!tank) continue
      const dist = Math.sqrt((ex - tank.x) ** 2 + (ey - tank.y) ** 2)
      if (dist < explosionRadius * 1.5) {
        const dmg = Math.round(DAMAGE_SPLASH * damageMult * (1 - dist / (explosionRadius * 1.5)))
        if (dmg > 0) applyDamage(key, dmg)
      }
    }
  }

  function hitTest(proj: Projectile, tank: Tank): boolean {
    return (
      proj.x > tank.x - tank.width / 2 &&
      proj.x < tank.x + tank.width / 2 &&
      proj.y > tank.y - tank.height &&
      proj.y < tank.y + tank.height / 2
    )
  }

  function getCombinedWeaponStats(weaponIds: string[] = selectedWeaponIds.value) {
    const base = { ...WEAPONS.find((w) => w.id === 'standard')! }
    for (const wId of weaponIds) {
      const wp = WEAPONS.find((w) => w.id === wId)
      if (wp) {
        base.damageMultiplier *= wp.damageMultiplier
        base.explosionRadiusMultiplier *= wp.explosionRadiusMultiplier
        base.projectilesCount = Math.max(base.projectilesCount, wp.projectilesCount)
        base.shotsPerTurn += wp.shotsPerTurn - 1
        base.spreadAngle = Math.max(base.spreadAngle, wp.spreadAngle)
      }
    }
    base.id = weaponIds.length ? weaponIds.join('+') : 'standard'
    return base
  }

  // ============ WEAPONS ============
  function toggleWeapon(id: string) {
    if (isFiring.value || gameState.value !== 'playing') return
    if (currentTurn.value === 'bot' && gameMode.value === 'pve') return

    if (id === 'standard') {
      for (const wId of selectedWeaponIds.value) {
        const wp = WEAPONS.find((w) => w.id === wId)
        if (wp) playerStamina.value += wp.staminaCost
      }
      playerStamina.value = Math.min(MAX_STAMINA, playerStamina.value)
      selectedWeaponIds.value = []
      return
    }

    const wp = WEAPONS.find((w) => w.id === id)
    if (!wp) return

    if (selectedWeaponIds.value.includes(id)) {
      selectedWeaponIds.value = selectedWeaponIds.value.filter((wId) => wId !== id)
      playerStamina.value = Math.min(MAX_STAMINA, playerStamina.value + wp.staminaCost)
    } else {
      if (playerStamina.value >= wp.staminaCost) {
        playerStamina.value -= wp.staminaCost
        selectedWeaponIds.value.push(id)
      }
    }
  }

  // ============ PROJECTILE ============
  function fireProjectile(tank: Tank, angleDeg: number, power: number, weapon: Weapon) {
    // Exact barrel tip and absolute angle alignment
    const localAngleRad = (angleDeg * Math.PI) / 180
    const speed = (power / 100) * MAX_POWER

    const slopeRad = getTerrainSlopeRad(tank.x)
    const absBarrelAngle = slopeRad + (tank.facingRight ? -localAngleRad : -Math.PI + localAngleRad)

    const th = tank.height
    const tw = tank.width
    const barrelLen = tw * 0.7

    const turretCenterAbsX = Math.sin(slopeRad) * (th / 2)
    const turretCenterAbsY = -Math.cos(slopeRad) * (th / 2)

    for (let i = 0; i < weapon.projectilesCount; i++) {
      let angleOffset = 0
      if (weapon.projectilesCount > 1) {
        const spreadRad = (weapon.spreadAngle * Math.PI) / 180
        angleOffset = -spreadRad / 2 + (spreadRad / (weapon.projectilesCount - 1)) * i
        if (!tank.facingRight) angleOffset = -angleOffset
      }

      const projAngle = absBarrelAngle + angleOffset
      const vx = Math.cos(projAngle) * speed
      const vy = Math.sin(projAngle) * speed

      projectiles.push({
        x: tank.x + turretCenterAbsX + Math.cos(absBarrelAngle) * barrelLen,
        y: tank.y + turretCenterAbsY + Math.sin(absBarrelAngle) * barrelLen,
        vx,
        vy,
        trail: [],
        active: true,
        damageMultiplier: weapon.damageMultiplier,
        explosionRadiusMultiplier: weapon.explosionRadiusMultiplier,
        weaponId: weapon.id,
      })
    }
  }

  function updateProjectile(proj: Projectile): boolean {
    if (!proj.active) return false

    proj.vx += wind.value * 0.002
    proj.vy += GRAVITY
    proj.x += proj.vx
    proj.y += proj.vy

    proj.trail.push({ x: proj.x, y: proj.y })
    if (proj.trail.length > 30) proj.trail.shift()

    // Out of bounds
    if (proj.x < -50 || proj.x > canvasWidth + 50 || proj.y > canvasHeight + 50) {
      proj.active = false
      return true
    }

    // WORMS-STYLE: Pixel-perfect terrain collision
    const px = Math.floor(proj.x)
    const py = Math.floor(proj.y)
    if (
      px >= 0 &&
      px < canvasWidth &&
      py >= 0 &&
      py < canvasHeight &&
      terrainBitmap[py * canvasWidth + px] === 1
    ) {
      createExplosion(proj.x, proj.y, proj.explosionRadiusMultiplier, proj.weaponId)
      checkSplashDamage(proj.x, proj.y, proj.damageMultiplier, proj.explosionRadiusMultiplier)
      proj.active = false
      return true
    }

    // Tank collision
    if (playerTank && hitTest(proj, playerTank)) {
      createExplosion(proj.x, proj.y, proj.explosionRadiusMultiplier, proj.weaponId)
      applyDamage('player', Math.round(DAMAGE_DIRECT * proj.damageMultiplier))
      proj.active = false
      return true
    }
    if (botTank && hitTest(proj, botTank)) {
      createExplosion(proj.x, proj.y, proj.explosionRadiusMultiplier, proj.weaponId)
      applyDamage('bot', Math.round(DAMAGE_DIRECT * proj.damageMultiplier))
      proj.active = false
      return true
    }

    return false
  }

  // ============ TURN MANAGEMENT ============
  function switchTurn() {
    wind.value = (Math.random() - 0.5) * 10

    // Save active state into inactiveState and load from it
    const tempAngle = playerAngle.value
    const tempPower = playerPower.value

    playerAngle.value = inactiveState.angle
    playerPower.value = inactiveState.power

    inactiveState.angle = tempAngle
    inactiveState.power = tempPower

    // Reset stamina and weapons at start of turn
    playerStamina.value = MAX_STAMINA
    selectedWeaponIds.value = []

    remainingShots.value = 0

    if (currentTurn.value === 'player') {
      currentTurn.value = 'bot'

      isFacingRight.value = botTank?.facingRight ?? false
      facingDirection = isFacingRight.value ? 'right' : 'left'

      if (gameMode.value === 'pve') {
        setTimeout(botTurn, 1200)
      }
    } else {
      currentTurn.value = 'player'
      isFacingRight.value = playerTank?.facingRight ?? true
      facingDirection = isFacingRight.value ? 'right' : 'left'
    }

    // Ensure the visual barrel of the newly active tank matches the loaded angle
    syncBarrelAngle()
  }

  // ============ PLAYER FIRE (WORMS-STYLE) ============
  function playerFire() {
    const activeTank = getActiveTank()
    if (!activeTank) return
    if (isFiring.value) return
    if (currentTurn.value === 'bot' && gameMode.value === 'pve') return

    const weapon = getCombinedWeaponStats()
    isFiring.value = true
    remainingShots.value = weapon.shotsPerTurn

    // Worms-style: playerAngle IS the world angle, fire exactly at that angle
    syncBarrelAngle()
    const powerToFire = playerPower.value
    const angleToFire = playerAngle.value

    let shotsFired = 0

    const fireNext = () => {
      if (gameState.value !== 'playing' || !activeTank) return

      fireProjectile(activeTank, angleToFire, powerToFire, weapon)
      totalShots.value++
      shotsFired++
      remainingShots.value = weapon.shotsPerTurn - shotsFired

      if (shotsFired < weapon.shotsPerTurn) {
        setTimeout(fireNext, 300)
      }
    }

    fireNext()
  }

  function simulateShotFrom(x: number, y: number, facingRight: boolean) {
    let bestTheta = Math.PI / 4
    let bestPower = 95
    let minMissDist = Infinity
    const tryPowers = [100, 95, 90, 85, 80, 75, 70, 60, 50, 40, 30, 20]
    let foundHit = false

    const botSlopeRad = getTerrainSlopeRad(x)
    const th = TANK_HEIGHT
    const tw = TANK_WIDTH
    const turretCenterAbsX = Math.sin(botSlopeRad) * (th / 2)
    const turretCenterAbsY = -Math.cos(botSlopeRad) * (th / 2)
    const barrelLen = tw * 0.7

    // Prioritize highest trajectory by checking from 89 deg down to 5
    for (let deg = 89; deg >= 5; deg -= 1) {
      const theta = (deg * Math.PI) / 180

      for (const p of tryPowers) {
        const testSpeed = (p / 100) * MAX_POWER
        const projAngle = botSlopeRad + (facingRight ? -theta : -Math.PI + theta)
        let vx = Math.cos(projAngle) * testSpeed
        let vy = Math.sin(projAngle) * testSpeed

        let simX = x + turretCenterAbsX + Math.cos(projAngle) * barrelLen
        let simY = y + turretCenterAbsY + Math.sin(projAngle) * barrelLen

        let closest = Infinity
        for (let i = 0; i < 400; i++) {
          vx += wind.value * 0.002
          vy += GRAVITY
          simX += vx
          simY += vy

          const dist = Math.sqrt((simX - playerTank!.x) ** 2 + (simY - playerTank!.y) ** 2)
          if (dist < closest) closest = dist

          const px = Math.floor(simX)
          const py = Math.floor(simY)
          if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
            if (terrainBitmap[py * canvasWidth + px] === 1) break
          }
          if (simY > canvasHeight + 50) break
        }

        if (closest < TANK_WIDTH / 2 + 10) {
          bestTheta = theta
          bestPower = p
          foundHit = true
          break
        } else if (closest < minMissDist) {
          minMissDist = closest
          bestTheta = theta
          bestPower = p
        }
      }
      if (foundHit) break
    }
    return { foundHit, bestTheta, bestPower, minMissDist }
  }

  // ============ BOT AI ============
  function botTurn() {
    if (!botTank || !playerTank || gameState.value !== 'playing') return

    const diff = DIFFICULTIES.find((d) => d.id === difficulty.value)!
    const acc = diff.accuracy

    // Bot picks weapons based on difficulty
    let botStam = MAX_STAMINA
    const botWeapons: string[] = []
    const useSpecialChance = diff.id === 'easy' ? 0.3 : diff.id === 'medium' ? 0.6 : 0.9

    for (let i = 0; i < 3; i++) {
      if (Math.random() < useSpecialChance) {
        const affordables = WEAPONS.filter((w) => w.id !== 'standard' && w.staminaCost <= botStam)
        if (affordables.length > 0) {
          const wp = affordables[Math.floor(Math.random() * affordables.length)]
          if (!wp) continue
          botWeapons.push(wp.id)
          botStam -= wp.staminaCost
        }
      }
    }

    const weapon = getCombinedWeaponStats(botWeapons)

    const dx = playerTank.x - botTank.x
    botTank.facingRight = dx > 0

    const result = simulateShotFrom(botTank.x, botTank.y, botTank.facingRight)
    let targetX = botTank.x

    // Simulate movement to find a better shot if needed
    if (!result.foundHit) {
      const maxDist = Math.floor((botStam / STAMINA_PER_MOVE) * MOVE_SPEED)
      let minMiss = result.minMissDist

      // Incremental search outward
      for (let d = 5; d <= maxDist; d += 5) {
        let foundAny = false
        for (const dir of [1, -1]) {
          const testX = Math.floor(botTank.x + d * dir)
          // Bounds: limit bot territory
          if (testX < canvasWidth * 0.5 || testX > canvasWidth - TANK_WIDTH) continue

          const floorX = Math.floor(testX)
          if (floorX < 0 || floorX >= canvasWidth) continue
          const testY = (surfaceCache[floorX] ?? canvasHeight) - TANK_HEIGHT / 2
          if (testY >= canvasHeight) continue

          const testFacing = playerTank.x > testX
          const testResult = simulateShotFrom(testX, testY, testFacing)

          if (testResult.foundHit) {
            targetX = testX
            foundAny = true
            break
          } else if (testResult.minMissDist < minMiss) {
            minMiss = testResult.minMissDist
            targetX = testX
          }
        }
        if (foundAny) break
      }
    }

    const moveAndFire = () => {
      if (gameState.value !== 'playing' || !botTank) return

      if (Math.abs(botTank.x - targetX) > MOVE_SPEED) {
        const dir = targetX > botTank.x ? 'right' : 'left'

        if (isTooSteep(botTank.x, dir)) {
          targetX = botTank.x // stop moving
          setTimeout(moveAndFire, 20)
          return
        }

        const dxStep = dir === 'right' ? MOVE_SPEED : -MOVE_SPEED
        botTank.x += dxStep
        const floorX = Math.floor(botTank.x)
        botTank.y = (surfaceCache[floorX] ?? canvasHeight) - TANK_HEIGHT / 2
        botTank.facingRight = dir === 'right'
        setTimeout(moveAndFire, 20) // Smooth movement
      } else {
        botTank.x = targetX
        const finalDx = playerTank!.x - botTank.x
        botTank.facingRight = finalDx > 0

        const finalResult = simulateShotFrom(botTank.x, botTank.y, botTank.facingRight)

        // Apply error spread based on accuracy
        const maxAngleError = (1 - acc) * 20 * (Math.PI / 180)
        const maxPowerError = (1 - acc) * 20

        let finalTheta = finalResult.bestTheta + (Math.random() - 0.5) * maxAngleError
        finalTheta = Math.max(
          (MIN_ANGLE * Math.PI) / 180,
          Math.min((MAX_ANGLE * Math.PI) / 180, finalTheta),
        )

        let finalPower = finalResult.bestPower + (Math.random() - 0.5) * maxPowerError
        finalPower = Math.max(10, Math.min(100, finalPower))

        botTank.angle = finalTheta
        isFiring.value = true
        remainingShots.value = weapon.shotsPerTurn

        // Simulate thinking delay then fire
        setTimeout(() => {
          let shotsFired = 0

          const fireNext = () => {
            if (gameState.value !== 'playing' || !botTank) return

            fireProjectile(botTank, finalTheta * (180 / Math.PI), finalPower, weapon)
            shotsFired++
            remainingShots.value = weapon.shotsPerTurn - shotsFired

            if (shotsFired < weapon.shotsPerTurn) {
              setTimeout(fireNext, 300)
            }
          }

          fireNext()
        }, 500)
      } // Closes else block
    }

    // Kickoff the sequence
    moveAndFire()
  }

  // ============ DRAWING ============
  function getTerrainSlopeRad(tankX: number): number {
    // Raw slope in radians for visual rotation (not clamped like getTerrainSlope)
    const leftX = Math.max(0, Math.floor(tankX - TERRAIN_SLOPE_RANGE))
    const rightX = Math.min(canvasWidth - 1, Math.floor(tankX + TERRAIN_SLOPE_RANGE))
    if (leftX >= rightX) return 0
    const leftY = surfaceCache[leftX] ?? canvasHeight
    const rightY = surfaceCache[rightX] ?? canvasHeight
    return Math.atan2(rightY - leftY, rightX - leftX)
  }

  function draw(ctx: CanvasRenderingContext2D) {
    drawSky(ctx, canvasWidth, canvasHeight)
    drawStars(ctx, stars)
    drawTerrain(ctx, terrainBitmap, canvasWidth, canvasHeight)

    if (playerTank) {
      const playerSlopeRad = getTerrainSlopeRad(playerTank.x)
      drawTank(ctx, playerTank, true, playerSlopeRad)
    }
    if (botTank) {
      const botSlopeRad = getTerrainSlopeRad(botTank.x)
      drawTank(ctx, botTank, false, botSlopeRad)
    }

    for (const proj of projectiles) {
      if (proj.active) drawProjectile(ctx, proj)
    }

    drawParticles(ctx, particles)

    const activeTank = getActiveTank()
    if (
      !isFiring.value &&
      activeTank &&
      gameState.value === 'playing' &&
      (currentTurn.value === 'player' || gameMode.value === 'pvp')
    ) {
      // Show angle cone: full range (MIN_ANGLE → MAX_ANGLE), barrel as current aim
      // Pass terrain slope so cone rotates with the ground surface (tank floor = X axis)
      const coneSlopeRad = getTerrainSlopeRad(activeTank.x)
      drawAngleCone(
        ctx,
        activeTank,
        playerAngle.value,
        MIN_ANGLE,
        MAX_ANGLE,
        facingDirection === 'right',
        coneSlopeRad,
      )
    }
  }

  // ============ KEYBOARD HANDLER ============
  function clearAngleKeyTimers() {
    if (angleKeyHoldTimer) {
      clearTimeout(angleKeyHoldTimer)
      angleKeyHoldTimer = null
    }
    if (angleKeyRepeatInterval) {
      clearInterval(angleKeyRepeatInterval)
      angleKeyRepeatInterval = null
    }
    angleKeyHeld = null
    _angleKeyFirstFired = false
  }

  function onKeyDown(e: KeyboardEvent) {
    if (gameState.value !== 'playing') return
    if (isFiring.value) return

    keysDown.add(e.code)

    // Space → start charging (only on player's turn)
    if (
      e.code === 'Space' &&
      !chargingInternal &&
      (currentTurn.value === 'player' || gameMode.value === 'pvp')
    ) {
      e.preventDefault()
      startCharging()
    }

    // ArrowUp/ArrowDown → single-press angle (1 degree), hold for continuous
    // Allowed even when not player's turn
    if ((e.code === 'ArrowUp' || e.code === 'ArrowDown') && !e.repeat) {
      e.preventDefault()
      const dir = e.code === 'ArrowUp' ? ('up' as const) : ('down' as const)

      // Fire once immediately
      adjustAngle(dir)
      angleKeyHeld = dir
      _angleKeyFirstFired = true

      // After hold delay, start continuous adjustment
      angleKeyHoldTimer = setTimeout(() => {
        angleKeyRepeatInterval = setInterval(() => {
          if (angleKeyHeld) adjustAngle(angleKeyHeld)
        }, ANGLE_REPEAT_RATE)
      }, ANGLE_HOLD_DELAY)
    }

    // Prevent default for arrow keys to avoid page scrolling
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault()
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    keysDown.delete(e.code)

    // Space → release charge and fire
    if (e.code === 'Space' && chargingInternal) {
      e.preventDefault()
      releaseCharge()
    }

    // Clear angle hold timers
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      clearAngleKeyTimers()
    }
  }

  function processKeys() {
    if (gameState.value === 'playing') {
      if (isFiring.value) return // If firing, ignore all other key inputs

      // Keyboard movement and angle adjustment (Arrow keys or WASD)
      if (currentTurn.value === 'player' || gameMode.value === 'pvp') {
        if (keysDown.has('ArrowLeft') || keysDown.has('KeyA')) {
          moveTank('left')
        }
        if (keysDown.has('ArrowRight') || keysDown.has('KeyD')) {
          moveTank('right')
        }
        // Angle adjustments via keyboard are handled by onKeyDown for single press and repeat
        // but we can also allow continuous hold here for WASD if desired, though ArrowUp/Down has its own logic.
        // For now, let's keep ArrowUp/Down to onKeyDown's timer logic.
        // If we wanted WASD to be continuous here:
        // if (keysDown.has("ArrowUp") || keysDown.has("KeyW")) {
        //   adjustAngle("up");
        // }
        // if (keysDown.has("ArrowDown") || keysDown.has("KeyS")) {
        //   adjustAngle("down");
        // }
      }

      // Movement from UI buttons
      if (moveDirection) {
        moveTank(moveDirection)
      }

      // Charging - only on player's turn
      if (chargingInternal && (currentTurn.value === 'player' || gameMode.value === 'pvp')) {
        updateCharging()
      }

      // Update slope offset for UI display
      updateSlopeOffset()

      // Update player slope rad for HUD angle widget
      const activeTank = getActiveTank()
      if (activeTank) {
        playerSlopeRad.value = getTerrainSlopeRad(activeTank.x)
      }
    }
  }

  // ============ GAME LOOP ============
  function gameLoop(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Process continuous inputs
    processKeys()

    // Update particles
    particles = particles.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life--
      return p.life > 0
    })

    // Update projectile
    if (projectiles.length > 0) {
      let anyActive = false

      for (const proj of projectiles) {
        if (proj.active) {
          anyActive = true
          updateProjectile(proj)
        }
      }

      if (!anyActive && remainingShots.value === 0) {
        projectiles = []
        setTimeout(() => {
          if (playerHP.value <= 0) {
            winner.value = 'bot'
            gameState.value = 'gameover'
            return
          }
          if (botHP.value <= 0) {
            winner.value = 'player'
            gameState.value = 'gameover'
            return
          }
          if (isFiring.value) {
            isFiring.value = false
            switchTurn()
          }
        }, 800)
      }
    }

    draw(ctx)
    animFrameId = requestAnimationFrame(() => gameLoop(canvas))
  }

  // ============ RESIZE ============
  function resizeCanvas(canvas: HTMLCanvasElement) {
    const container = canvas.parentElement
    if (!container) return

    const padding = 16
    const maxW = container.clientWidth - padding
    const hudAndControlsEstimate = 200
    const maxH = window.innerHeight - hudAndControlsEstimate

    let w = maxW
    let h = w / CANVAS_ASPECT

    if (h > maxH) {
      h = maxH
      w = h * CANVAS_ASPECT
    }

    const sizeChanged = Math.abs(canvasWidth - w) > 10

    canvasWidth = Math.floor(w)
    canvasHeight = Math.floor(h)

    canvas.width = canvasWidth
    canvas.height = canvasHeight
    canvas.style.width = canvasWidth + 'px'
    canvas.style.height = canvasHeight + 'px'

    if (sizeChanged && gameState.value === 'playing') {
      terrainBitmap = generateTerrain(canvasWidth, canvasHeight)
      rebuildSurfaceCache()
      markTerrainDirty()
      initStars()
      placeTanks()
    }
  }

  // ============ INIT / CLEANUP ============
  /** Step 1: Reset all reactive state (call this BEFORE nextTick) */
  function prepareGame() {
    gameState.value = 'playing'
    currentTurn.value = 'player'
    isFiring.value = false
    isCharging.value = false
    chargingInternal = false
    playerHP.value = 100
    botHP.value = 100
    playerAngle.value = 45
    playerPower.value = 10
    playerStamina.value = MAX_STAMINA
    inactiveState.angle = 135
    inactiveState.power = 10
    wind.value = (Math.random() - 0.5) * 10
    totalShots.value = 0
    totalHits.value = 0
    projectiles = []
    particles = []
    moveDirection = null
    selectedWeaponIds.value = []
    remainingShots.value = 0
    _angleDirection = null
    facingDirection = 'right'
    isFacingRight.value = true
    keysDown.clear()
  }

  /** Step 2: Init canvas, terrain, tanks and start game loop (call AFTER nextTick when canvas is available) */
  function initCanvas(canvas: HTMLCanvasElement) {
    resizeCanvas(canvas)
    terrainBitmap = generateTerrain(canvasWidth, canvasHeight)
    rebuildSurfaceCache()
    markTerrainDirty()
    initStars()
    placeTanks()

    cancelAnimationFrame(animFrameId)
    gameLoop(canvas)
  }

  function stopGame() {
    cancelAnimationFrame(animFrameId)
    keysDown.clear()
    chargingInternal = false
    isCharging.value = false
    moveDirection = null
    _angleDirection = null
    clearAngleKeyTimers()
  }

  /** Sync barrel angle based on playerAngle (Worms-style: angle IS world angle) */
  function syncBarrelAngle() {
    const activeTank = getActiveTank()
    if (!activeTank) return
    activeTank.angle = (playerAngle.value * Math.PI) / 180
  }

  function updateBarrelAngle(val: number) {
    const activeTank = getActiveTank()
    if (activeTank) {
      playerAngle.value = val
      syncBarrelAngle()
    }
  }

  // Movement control from UI buttons
  function startMove(dir: 'left' | 'right') {
    moveDirection = dir
  }

  function stopMove() {
    moveDirection = null
  }

  // Angle control from UI buttons
  function startAngleAdjust(dir: 'up' | 'down') {
    _angleDirection = dir
  }

  function stopAngleAdjust() {
    _angleDirection = null
  }

  // Skip turn without firing
  function skipTurn() {
    if (isFiring.value) return
    if (gameState.value !== 'playing') return
    if (currentTurn.value === 'bot' && gameMode.value === 'pve') return
    switchTurn()
  }

  // Exit to menu
  function exitToMenu() {
    stopGame()
    gameState.value = 'menu'
  }

  return {
    // State
    gameState,
    gameMode,
    difficulty,
    currentTurn,
    isFiring,
    winner,
    playerAngle,
    playerPower,
    playerHP,
    botHP,
    wind,
    totalShots,
    totalHits,
    diffLabel,
    accuracy,
    isCharging,
    terrainSlopeOffset,
    playerStamina,
    isFacingRight,
    playerSlopeRad,
    selectedWeaponIds,
    remainingShots,

    // Actions
    prepareGame,
    initCanvas,
    stopGame,
    playerFire,
    resizeCanvas,
    updateBarrelAngle,

    // New features
    startCharging,
    releaseCharge,
    startMove,
    stopMove,
    startAngleAdjust,
    stopAngleAdjust,
    toggleWeapon,
    exitToMenu,
    skipTurn,
    onKeyDown,
    onKeyUp,
  }
}
