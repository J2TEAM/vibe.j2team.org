import type { Particle, Projectile, Star, Tank } from './types'

// ============ STARS ============
export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[]) {
  for (const star of stars) {
    const twinkle = star.brightness + Math.sin(Date.now() * 0.003 + star.x) * 0.2
    // Lower opacity since it's daytime now
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.3})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ============ SKY ============
export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
  skyGrad.addColorStop(0, '#60a5fa') // soft blue
  skyGrad.addColorStop(0.5, '#93c5fd') // light pastel blue
  skyGrad.addColorStop(0.8, '#e0f2fe') // very soft pale blue
  skyGrad.addColorStop(1, '#fdf4ff') // slightly warm mist at bottom
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h)
}

// ============ TERRAIN (WORMS-STYLE PIXEL TERRAIN) ============
// terrainBitmap is a 2D array: terrainBitmap[y * width + x] = 0 (air) or 1 (solid)
// We render it with layered textures: grass on top, earth in middle, rock at depth

let terrainCanvas: OffscreenCanvas | null = null
let terrainDirty = true
let surfaceMap = new Int32Array(0)

const SPORES = Array.from({ length: 40 }).map(() => ({
  x: Math.random() * 2000,
  y: Math.random() * 1000,
  speedX: -0.5 + Math.random(),
  speedY: -0.5 + Math.random(),
  size: 1 + Math.random() * 2,
  phase: Math.random() * Math.PI * 2,
}))

const WIND_PARTICLES = Array.from({ length: 30 }).map(() => ({
  x: Math.random() * 2000,
  y: Math.random() * 1000,
  speed: 1 + Math.random() * 3,
  length: 10 + Math.random() * 30,
}))

export function markTerrainDirty() {
  terrainDirty = true
}

export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  terrainBitmap: Uint8Array,
  w: number,
  h: number,
) {
  // Only rebuild terrain texture when terrain changes (explosion, etc.)
  if (terrainDirty || !terrainCanvas || terrainCanvas.width !== w || terrainCanvas.height !== h) {
    terrainCanvas = new OffscreenCanvas(w, h)
    const tctx = terrainCanvas.getContext('2d')!
    const imageData = tctx.createImageData(w, h)
    const data = imageData.data

    // Ready the array for the exact width
    if (surfaceMap.length !== w) {
      surfaceMap = new Int32Array(w)
    }
    surfaceMap.fill(-1)

    for (let x = 0; x < w; x++) {
      let currentDepth = 1000 // Start with high depth in case the top of screen is rock

      for (let y = 0; y < h; y++) {
        const idx = (y * w + x) * 4
        if (terrainBitmap[y * w + x] === 0) {
          // Air - transparent
          data[idx] = 0
          data[idx + 1] = 0
          data[idx + 2] = 0
          data[idx + 3] = 0
          currentDepth = 0 // Next solid pixel will be surface
          continue
        }

        if (currentDepth === 0 && surfaceMap[x] === -1) {
          surfaceMap[x] = y // Record the topmost surface
        }

        // Solid terrain - apply texture based on depth from surface
        const depthFromSurface = currentDepth
        currentDepth++

        // Subtle noise for organic look (grainy, random instead of diagonal stripes)
        const noise = (Math.random() - 0.5) * 15
        const geoNoise = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 20

        if (depthFromSurface <= 3) {
          // Vibrant grass top layer (Bright Neon/Teal Green)
          data[idx] = Math.min(255, Math.max(0, 50 + noise * 2))
          data[idx + 1] = Math.min(255, Math.max(0, 230 + noise * 2))
          data[idx + 2] = Math.min(255, Math.max(0, 110 + noise))
          data[idx + 3] = 255
        } else if (depthFromSurface <= 8) {
          // Teal sub-grass transition
          data[idx] = Math.min(255, Math.max(0, 20 + noise))
          data[idx + 1] = Math.min(255, Math.max(0, 170 + noise))
          data[idx + 2] = Math.min(255, Math.max(0, 150 + noise))
          data[idx + 3] = 255
        } else {
          if (depthFromSurface <= 60 + geoNoise) {
            // Rich purple/crimson earth layer
            const t = (depthFromSurface - 8) / (52 + geoNoise) // 0..1
            const r = 160 - t * 100 + noise
            const g = 60 - t * 40 + noise
            const b = 130 - t * 60 + noise
            data[idx] = Math.min(255, Math.max(0, r))
            data[idx + 1] = Math.min(255, Math.max(0, g))
            data[idx + 2] = Math.min(255, Math.max(0, b))
            data[idx + 3] = 255
          } else {
            // Deep rock layer - dark indigo/navy with slight color variations
            const r = 30 + Math.sin(x * 0.01) * 10 + noise * 0.5
            const g = 20 + Math.cos(y * 0.02) * 5 + noise * 0.5
            const b = 60 + Math.sin(x * 0.02) * 15 + noise * 0.8
            data[idx] = Math.min(255, Math.max(0, r))
            data[idx + 1] = Math.min(255, Math.max(0, g))
            data[idx + 2] = Math.min(255, Math.max(0, b))
            data[idx + 3] = 255
          }
        }
      }
    }

    tctx.putImageData(imageData, 0, 0)
    terrainDirty = false
  }

  ctx.drawImage(terrainCanvas, 0, 0)

  // ============ ANIMATED ELEMENTS ============
  const time = Date.now()
  const globalWind = Math.sin(time * 0.001) * 2 // global wind swaying

  // 1. Draw solid grassy surface edge line & Swaying grass blades
  ctx.strokeStyle = 'rgba(134, 239, 172, 0.7)' // Original grass edge color
  ctx.lineWidth = 1
  ctx.beginPath()

  let drawing = false
  let prevSurfaceY = -1

  for (let x = 0; x < w; x++) {
    const surfaceY = surfaceMap[x] ?? -1
    if (surfaceY >= 0) {
      // Connect surface top line
      if (!drawing) {
        ctx.moveTo(x, surfaceY)
        drawing = true
      } else {
        if (Math.abs(surfaceY - prevSurfaceY) > 5) {
          ctx.moveTo(x, surfaceY)
        } else {
          ctx.lineTo(x, surfaceY)
        }
      }
      prevSurfaceY = surfaceY

      // Draw swaying grass blade every 4 pixels
      if (x % 4 === 0) {
        // pseudo-random variations based on x
        const grassHeight = 6 + Math.sin(x * 123.45) * 4
        const localWind = Math.sin(time * 0.002 + x * 0.05) * 1.5
        const totalWind = globalWind + localWind

        ctx.moveTo(x, surfaceY)
        // Curve to simulate bending grass
        ctx.quadraticCurveTo(
          x + totalWind * 0.5,
          surfaceY - grassHeight * 0.5,
          x + totalWind,
          surfaceY - grassHeight,
        )
      }
    } else {
      drawing = false
    }
  }
  ctx.stroke()

  // 2. Glowing Spores / Dust
  for (const s of SPORES) {
    s.x += s.speedX + globalWind * 0.1
    s.y += s.speedY - 0.1 // slow rising
    s.phase += Math.abs(s.speedX) * 0.05

    // Wrap around
    if (s.x > w + 50) s.x = -50
    else if (s.x < -50) s.x = w + 50
    if (s.y > h + 50) s.y = -50
    else if (s.y < -50) s.y = h + 50

    // original opacity and color for spores
    const alpha = (Math.sin(s.phase) + 1) * 0.4 + 0.1
    ctx.fillStyle = `rgba(180, 255, 100, ${alpha})`
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. Fast Wind Particles
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)' // original wind opacity
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (const p of WIND_PARTICLES) {
    p.x += p.speed + Math.max(0, globalWind)
    p.y += Math.sin(time * 0.001 + p.x * 0.01) * 0.5

    if (p.x > w + p.length) {
      p.x = -p.length
      p.y = Math.random() * h
    }

    ctx.moveTo(p.x, p.y)
    // Draw streak backwards based on its speed
    ctx.lineTo(p.x - p.length, p.y)
  }
  ctx.stroke()
}

// ============ TANK ============
export function drawTank(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  isPlayer: boolean,
  slopeAngle = 0,
) {
  const { x, y, width: tw, height: th, color, barrelColor, angle } = tank
  const time = Date.now()

  ctx.save()

  // Translate to tank center, rotate by terrain slope, then draw relative to origin
  ctx.translate(x, y)
  ctx.rotate(slopeAngle)

  // Idle engine vibration animation
  const idleY = Math.sin(time * 0.015) * 0.5
  ctx.translate(0, idleY)

  // Tank base shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.beginPath()
  ctx.ellipse(0, th / 2 + 4, tw * 0.7, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // --- Tank Tracks (tread) ---
  ctx.fillStyle = '#1e293b' // dark slate for tread body
  ctx.beginPath()
  ctx.roundRect(-tw / 2 - 4, th / 6, tw + 8, th / 2.2, 8)
  ctx.fill()

  // Track lines (animated conveyor effect)
  ctx.strokeStyle = '#020617'
  ctx.lineWidth = 1.5
  // Speed of wheels rotating/track moving
  const trackOffset = (time * 0.02) % 6
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(-tw / 2 - 4, th / 6, tw + 8, th / 2.2, 8)
  ctx.clip() // clip track lines inside the tread
  for (let i = -tw / 2 - 10 + trackOffset; i <= tw / 2 + 10; i += 6) {
    ctx.beginPath()
    ctx.moveTo(i, th / 6)
    ctx.lineTo(i, th / 6 + th / 2.2)
    ctx.stroke()
  }
  ctx.restore()

  // --- Wheels inside tracks ---
  ctx.fillStyle = '#334155' // wheel color
  ctx.strokeStyle = '#020617'
  ctx.lineWidth = 2
  const wheelRadius = th / 5.5
  const wheelYPos = th / 6 + th / 4.5

  // Three main wheels
  for (let i = -1; i <= 1; i++) {
    const wx = i * (tw * 0.35)
    ctx.beginPath()
    ctx.arc(wx, wheelYPos, wheelRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Inner hubcap
    ctx.fillStyle = '#64748b'
    ctx.beginPath()
    ctx.arc(wx, wheelYPos, wheelRadius * 0.4, 0, Math.PI * 2)
    ctx.fill()

    // Spinning lines on wheels
    ctx.save()
    ctx.translate(wx, wheelYPos)
    ctx.rotate(-time * 0.003 * (tank.facingRight ? 1 : -1)) // Slow idle wheel spin
    ctx.strokeStyle = '#020617'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-wheelRadius, 0)
    ctx.lineTo(wheelRadius, 0)
    ctx.moveTo(0, -wheelRadius)
    ctx.lineTo(0, wheelRadius)
    ctx.stroke()
    ctx.restore()
  }

  // --- Tank Chassis ---
  // Create a vibrant gradient for the chassis based on the base team color
  const chassisGrad = ctx.createLinearGradient(0, -th / 2, 0, th / 2)
  chassisGrad.addColorStop(0, '#ffffff') // subtle top highlight
  chassisGrad.addColorStop(0.2, color)
  chassisGrad.addColorStop(1, '#0f172a')

  ctx.fillStyle = chassisGrad
  ctx.strokeStyle = '#0f172a' // dark outline
  ctx.lineWidth = 2

  // Lower chassis
  ctx.beginPath()
  ctx.moveTo(-tw / 2, th / 6)
  ctx.lineTo(tw / 2, th / 6)
  ctx.lineTo(tw / 2 + 6, -th / 4)
  ctx.lineTo(-tw / 2 - 6, -th / 4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Vibrant neon accent line along chassis edge
  ctx.strokeStyle = isPlayer ? '#2dd4bf' : '#fbbf24' // player cyan, bot gold
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-tw / 2, th / 6 - 2)
  ctx.lineTo(tw / 2, th / 6 - 2)
  ctx.stroke()
  ctx.strokeStyle = '#0f172a'

  // Upper chassis (turret base)
  ctx.beginPath()
  ctx.moveTo(-tw / 2 + 4, -th / 4)
  ctx.lineTo(tw / 2 - 4, -th / 4)
  ctx.lineTo(tw / 2 - 8, -th / 2)
  ctx.lineTo(-tw / 2 + 8, -th / 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Decorative body element (vents on the side)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
  ctx.fillRect(-tw / 4, -th / 4 + 2, tw / 2, 4)
  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.fillRect(-tw / 2 + 8, -th / 2 + 2, tw - 16, 2)

  // --- Turret Dome ---
  const domeRadius = tw * 0.25
  const domeGrad = ctx.createRadialGradient(0, -th / 2, 0, 0, -th / 2, domeRadius)
  domeGrad.addColorStop(0, '#ffffff')
  domeGrad.addColorStop(0.3, barrelColor)
  domeGrad.addColorStop(1, '#020617')
  ctx.fillStyle = domeGrad
  ctx.beginPath()
  ctx.arc(0, -th / 2 + 2, domeRadius, Math.PI, 0)
  ctx.fill()
  ctx.stroke()

  // Turret hatch open/detail
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.ellipse(0, -th / 2 - domeRadius + 3, domeRadius * 0.6, 2, 0, 0, Math.PI * 2)
  ctx.fill()

  // --- Antenna (animated wiggling) ---
  const antennaWiggle = Math.sin(time * 0.005) * 0.15
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  // Attach opposite to facing dir
  const antStartX = tank.facingRight ? -domeRadius * 0.8 : domeRadius * 0.8
  const antStartY = -th / 2 - domeRadius * 0.6
  ctx.moveTo(antStartX, antStartY)
  ctx.quadraticCurveTo(
    antStartX + (tank.facingRight ? -5 : 5),
    antStartY - 12,
    antStartX + Math.sin(antennaWiggle) * 15,
    antStartY - 22,
  )
  ctx.stroke()

  // Antenna tip (blinking light)
  const isBlinking = time % 1500 < 750
  ctx.fillStyle = isBlinking ? (isPlayer ? '#4ade80' : '#f87171') : '#1e293b'
  ctx.beginPath()
  ctx.arc(antStartX + Math.sin(antennaWiggle) * 15, antStartY - 22, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // --- Barrel Setup ---
  const barrelLen = tw * 0.9
  const barrelAngle = tank.facingRight ? -angle : -Math.PI + angle
  const pivotX = 0
  const pivotY = -th / 2 + 2

  ctx.save()
  ctx.translate(pivotX, pivotY)
  ctx.rotate(barrelAngle)

  // Tapered main barrel
  const barrelGrad = ctx.createLinearGradient(0, -4, 0, 4)
  barrelGrad.addColorStop(0, '#ffffff')
  barrelGrad.addColorStop(0.5, barrelColor)
  barrelGrad.addColorStop(1, '#020617')

  ctx.fillStyle = barrelGrad
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -4)
  ctx.lineTo(barrelLen - 8, -2.5)
  ctx.lineTo(barrelLen - 8, 2.5)
  ctx.lineTo(0, 4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Neon ring on barrel
  ctx.strokeStyle = isPlayer ? '#06b6d4' : '#f59e0b' // cyan / amber
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(barrelLen / 2, -3.25)
  ctx.lineTo(barrelLen / 2, 3.25)
  ctx.stroke()
  ctx.strokeStyle = '#0f172a'

  // Muzzle brake (end of barrel)
  ctx.fillStyle = '#334155'
  ctx.fillRect(barrelLen - 8, -4, 10, 8)
  ctx.strokeRect(barrelLen - 8, -4, 10, 8)

  // Base joint of barrel
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(0, 0, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.restore()

  // --- Exhaust particles (animated smoke) ---
  const exhaustX = tank.facingRight ? -tw / 2 - 8 : tw / 2 + 8
  const exhaustY = th / 6 - 2

  // Small exhaust pipe
  ctx.fillStyle = '#334155'
  ctx.fillRect(tank.facingRight ? exhaustX : exhaustX - 4, exhaustY, 4, 6)
  ctx.strokeRect(tank.facingRight ? exhaustX : exhaustX - 4, exhaustY, 4, 6)

  // Smoke puffs
  for (let i = 0; i < 3; i++) {
    const smokePeriod = 1200
    const smokeTime = (time + i * (smokePeriod / 3)) % smokePeriod
    const smokeProgress = smokeTime / smokePeriod // 0 to 1

    // Smoke drifts up and slightly backward
    const dir = tank.facingRight ? -1 : 1
    const smokeXOffset = dir * smokeProgress * 20 + Math.sin(time * 0.003 + i) * 3
    const smokeYOffset = -smokeProgress * 25

    const alpha = 0.6 * (1 - smokeProgress)
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`
    ctx.beginPath()
    const rs = 2 + smokeProgress * 8 // scaling radius
    ctx.arc(
      exhaustX + (tank.facingRight ? 2 : -2) + smokeXOffset,
      exhaustY + smokeYOffset,
      rs,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // --- Undo idle Y shift before drawing UI ---
  ctx.translate(0, -idleY)

  // Counter-rotate so text/UI stays horizontal
  ctx.rotate(-slopeAngle)

  // --- HP Bar (below tank) ---
  const hpBarWidth = tw * 1.5
  const hpBarHeight = 6
  const hpBarY = th / 2 + 10
  const hpPct = Math.max(0, Math.min(100, tank.hp)) / 100

  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 4

  // HP Bar Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.beginPath()
  ctx.roundRect(-hpBarWidth / 2, hpBarY, hpBarWidth, hpBarHeight, 3)
  ctx.fill()

  ctx.shadowBlur = 0

  // HP Bar Fill
  if (tank.hp > 0) {
    ctx.fillStyle = isPlayer ? '#4ade80' : '#f87171'
    ctx.beginPath()
    ctx.roundRect(-hpBarWidth / 2, hpBarY, hpBarWidth * hpPct, hpBarHeight, 3)
    ctx.fill()
  }

  // --- HP Text (above tank) ---
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'center'

  ctx.shadowColor = '#000'
  ctx.shadowBlur = 3
  ctx.fillText(`${Math.round(tank.hp)} HP`, 0, -th - 16)
  ctx.shadowBlur = 0

  // Draw arrow pointing at player if it's player's turn or just to identify player?
  // isPlayer is true if it's the current local player
  if (isPlayer) {
    const arrowBounce = Math.sin(time * 0.01) * 3
    ctx.fillStyle = '#4ade80'
    ctx.beginPath()
    ctx.moveTo(-4, -th - 32 + arrowBounce)
    ctx.lineTo(4, -th - 32 + arrowBounce)
    ctx.lineTo(0, -th - 26 + arrowBounce)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

// ============ PROJECTILE ============
export function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  const sizeMult = Math.pow(proj.explosionRadiusMultiplier, 0.5) // scale slightly

  let trailColors = ['rgba(255, 200, 50', 'rgba(255, 255, 100', 'rgba(255, 50, 0']
  if (proj.weaponId === 'plus1') {
    trailColors = ['rgba(50, 200, 255', 'rgba(100, 255, 255', 'rgba(0, 50, 255']
  } else if (proj.weaponId === 'plus2') {
    trailColors = ['rgba(200, 50, 255', 'rgba(255, 100, 255', 'rgba(100, 0, 255']
  }

  // Trail
  for (let i = 0; i < proj.trail.length; i++) {
    const alpha = i / proj.trail.length
    const point = proj.trail[i]
    if (!point) continue
    ctx.fillStyle = `${trailColors[0]}, ${alpha * 0.6})`
    ctx.beginPath()
    ctx.arc(point.x, point.y, (2 + alpha * 2) * sizeMult, 0, Math.PI * 2)
    ctx.fill()
  }

  // Projectile glow
  const glowGrad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 8 * sizeMult)
  glowGrad.addColorStop(0, `${trailColors[1]}, 1)`)
  glowGrad.addColorStop(0.5, `${trailColors[0]}, 0.6)`)
  glowGrad.addColorStop(1, `${trailColors[2]}, 0)`)
  ctx.fillStyle = glowGrad
  ctx.beginPath()
  ctx.arc(proj.x, proj.y, 8 * sizeMult, 0, Math.PI * 2)
  ctx.fill()

  // Projectile core
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  if (proj.weaponId === 'plus1') {
    ctx.rect(proj.x - 3 * sizeMult, proj.y - 3 * sizeMult, 6 * sizeMult, 6 * sizeMult)
  } else if (proj.weaponId === 'plus2') {
    ctx.moveTo(proj.x, proj.y - 4 * sizeMult)
    ctx.lineTo(proj.x + 4 * sizeMult, proj.y + 3 * sizeMult)
    ctx.lineTo(proj.x - 4 * sizeMult, proj.y + 3 * sizeMult)
    ctx.closePath()
  } else {
    ctx.arc(proj.x, proj.y, 3 * sizeMult, 0, Math.PI * 2)
  }
  ctx.fill()
}

// ============ PARTICLES ============
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.fillStyle = p.color.replace('1)', `${alpha})`)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ============ ANGLE CONE (LOCAL PROTRACTOR) ============
export function drawAngleCone(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  currentAngleDeg: number,
  minAngleDeg: number,
  maxAngleDeg: number,
  _isFacingRight: boolean,
  slopeAngle = 0,
) {
  const coneRadius = 90

  // Local angles: min=0, max=90
  const minRad = (minAngleDeg * Math.PI) / 180
  const maxRad = (maxAngleDeg * Math.PI) / 180
  const currentRad = (currentAngleDeg * Math.PI) / 180

  ctx.save()

  // Translate to turret position (center-top of tank body)
  // Then rotate by terrain slope so the cone's X-axis = tank floor
  ctx.translate(tank.x, tank.y - tank.height / 2)
  ctx.rotate(slopeAngle)

  // Flip horizontally if facing left so that local 0 points forward left!
  if (!tank.facingRight) {
    ctx.scale(-1, 1)
  }

  // Now draw everything relative to origin (0,0) = turret center

  // ---- Cone fill (full angle range) ----
  ctx.beginPath()
  ctx.moveTo(0, 0)

  const steps = 40
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = minRad + (maxRad - minRad) * t
    ctx.lineTo(Math.cos(a) * coneRadius, -Math.sin(a) * coneRadius)
  }
  ctx.closePath()

  const coneGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coneRadius)
  coneGrad.addColorStop(0, 'rgba(255, 255, 100, 0.08)')
  coneGrad.addColorStop(0.7, 'rgba(255, 255, 100, 0.03)')
  coneGrad.addColorStop(1, 'rgba(255, 255, 100, 0)')
  ctx.fillStyle = coneGrad
  ctx.fill()

  // ---- Cone border edges (dashed) ----
  ctx.strokeStyle = 'rgba(255, 255, 100, 0.12)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  // Lower edge (min angle = near 0°/right)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(Math.cos(minRad) * coneRadius, -Math.sin(minRad) * coneRadius)
  ctx.stroke()

  // Upper edge (max angle = near 180°/left)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(Math.cos(maxRad) * coneRadius, -Math.sin(maxRad) * coneRadius)
  ctx.stroke()

  ctx.setLineDash([])

  // ---- Arc edge ----
  ctx.strokeStyle = 'rgba(255, 255, 100, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = minRad + (maxRad - minRad) * t
    const px = Math.cos(a) * coneRadius
    const py = -Math.sin(a) * coneRadius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // ---- 90° reference line (vertical, subtle) ----
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 6])
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -coneRadius)
  ctx.stroke()
  ctx.setLineDash([])

  // ---- Current barrel line (bold, bright) ----
  const selEndX = Math.cos(currentRad) * coneRadius
  const selEndY = -Math.sin(currentRad) * coneRadius

  // Glow
  ctx.strokeStyle = 'rgba(255, 255, 100, 0.25)'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(selEndX, selEndY)
  ctx.stroke()

  // Main line
  ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(selEndX, selEndY)
  ctx.stroke()

  // Arrow tip
  const arrowSize = 8
  const tipDirX = Math.cos(currentRad)
  const tipDirY = -Math.sin(currentRad)
  const perpX = tipDirY
  const perpY = -tipDirX
  ctx.fillStyle = 'rgba(255, 255, 100, 0.8)'
  ctx.beginPath()
  ctx.moveTo(selEndX + tipDirX * 3, selEndY + tipDirY * 3)
  ctx.lineTo(
    selEndX - tipDirX * arrowSize + perpX * arrowSize * 0.4,
    selEndY - tipDirY * arrowSize + perpY * arrowSize * 0.4,
  )
  ctx.lineTo(
    selEndX - tipDirX * arrowSize - perpX * arrowSize * 0.4,
    selEndY - tipDirY * arrowSize - perpY * arrowSize * 0.4,
  )
  ctx.closePath()
  ctx.fill()

  // Angle label (counter-rotate so text stays horizontal)
  // Wait: if we scaled(-1, 1), we MUST unscale first for text to be readable!
  if (!tank.facingRight) {
    ctx.scale(-1, 1)
    // If scaled, the `selEndX` we drew earlier was implicitly flipped
    // We compute the unscaled visual coords before rotating:
  }

  ctx.rotate(-slopeAngle)
  // Re-calculate label absolute position in unrotated space
  // Base visual coords inside `drawTank` turret center:
  const textVisX = tank.facingRight ? selEndX : -selEndX
  const textVisY = selEndY

  const cosS = Math.cos(slopeAngle)
  const sinS = Math.sin(slopeAngle)
  const labelX = textVisX * cosS - textVisY * sinS
  const labelY = textVisX * sinS + textVisY * cosS
  ctx.fillStyle = 'rgba(255, 255, 100, 0.9)'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.round(currentAngleDeg)}°`, labelX, labelY - 12)

  ctx.restore()
}
