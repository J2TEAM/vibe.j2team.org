import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useMousePressed, useMagicKeys } from '@vueuse/core'
import { GAME_WIDTH, GAME_HEIGHT, SHIP_SPEED, FIRE_RATE, WEAPON_TYPES } from './config'

export interface GameObject {
  x: number
  y: number
  width: number
  height: number
}
export interface Bullet extends GameObject {
  id: string | number
  dx: number
  dy: number
  color: string
  shape: string
  damage: number
  rotation: number
  hitTargets: Set<string | number>
  isAttached?: boolean
  attachedId?: number
  lastTick?: number
}
export interface Enemy extends GameObject {
  id: string | number
  hp: number
  maxHp: number
  isMeteor?: boolean
  isFallingChicken?: boolean
  isHazard?: boolean
  isStash?: boolean
  hue?: number
  targetY?: number
  dx?: number
  dy?: number
  targetOffsetX?: number
  targetOffsetY?: number
}
export interface Boss extends Enemy {
  bossType: number
  direction: number
  state: 'idle' | 'dash' | 'burst' | 'laser_warning' | 'laser_firing'
  stateTimer: number
  burstCount?: number
  laserTimer?: number
  laserX?: number
}
export interface Egg extends GameObject {
  id: string | number
  isBossEgg?: boolean
  isMeteor?: boolean
  dx?: number
  dy?: number
}
export interface PowerUp extends GameObject {
  id: string | number
  wType: number
}
export interface ActiveDot {
  targetId: string | number
  damagePerTick: number
  endTime: number
  lastTick: number
}

class RetroAudio {
  ctx: AudioContext | null = null
  isMuted = false
  init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }
  playTone(freqStart: number, freqEnd: number, type: OscillatorType, dur: number, vol: number) {
    if (this.isMuted || !this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime)
    if (freqStart !== freqEnd)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur)
    gain.gain.setValueAtTime(vol, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + dur)
  }
  shoot() {
    this.playTone(800, 200, 'square', 0.1, 0.05)
  }
  hit() {
    this.playTone(300, 100, 'sawtooth', 0.1, 0.05)
  }
  explode() {
    this.playTone(150, 40, 'square', 0.4, 0.1)
  }
  damage() {
    this.playTone(200, 50, 'sawtooth', 0.5, 0.3)
  }
  powerup() {
    this.playTone(400, 400, 'sine', 0.1, 0.1)
    setTimeout(() => this.playTone(600, 600, 'sine', 0.1, 0.1), 100)
    setTimeout(() => this.playTone(800, 800, 'sine', 0.2, 0.1), 200)
  }
}
export const sfx = new RetroAudio()

export function useGame() {
  const gameState = ref<'menu' | 'starting' | 'playing' | 'gameover' | 'paused' | 'resuming'>(
    'menu',
  )
  const gamePhase = ref<'minions' | 'meteors' | 'boss'>('minions')
  const currentWave = ref(1)
  const weaponType = ref(0)
  const weaponLevel = ref(1)
  const bgHue = ref(0)

  const boardRotation = ref(0)
  const isRotating = ref(false)
  const activeWidth = ref(GAME_WIDTH)
  const activeHeight = ref(GAME_HEIGHT)

  const isMuted = ref(false)
  const hiddenEventWavesLeft = ref(0)

  const resumingCountdown = ref(0)
  let resumeInterval: ReturnType<typeof setInterval> | null = null

  const player = ref({
    x: activeWidth.value / 2 - 30,
    y: activeHeight.value - 90,
    width: 60,
    height: 60,
    invulnerable: 0,
  })
  const score = ref(0)
  const lives = ref(3)

  const bullets = ref<Bullet[]>([])
  const enemyBullets = ref<Egg[]>([])
  const enemies = ref<Enemy[]>([])
  const powerUps = ref<PowerUp[]>([])

  const bosses = ref<Boss[]>([])
  const waveAnnouncement = ref('')

  const activeDots = ref<ActiveDot[]>([])
  const mobileKeys = ref({ left: false, right: false, fire: false })

  const pointerState = ref({ isDown: false })
  const setPointerState = (clientX?: number, clientY?: number, isDown?: boolean) => {
    if (isDown !== undefined) pointerState.value.isDown = isDown
    if (gameState.value !== 'playing' && gameState.value !== 'starting') return

    if (clientX !== undefined && clientY !== undefined && clientX !== -1) {
      const boardEl = document.getElementById('touch-layer')
      if (!boardEl) return
      const rect = boardEl.getBoundingClientRect()

      const localX = ((clientX - rect.left) / rect.width) * GAME_WIDTH
      const localY = ((clientY - rect.top) / rect.height) * GAME_HEIGHT

      const cx = GAME_WIDTH / 2
      const cy = GAME_HEIGHT / 2
      const dx = localX - cx
      const dy = localY - cy

      const theta = (boardRotation.value * Math.PI) / 180
      const local_dx = dx * Math.cos(-theta) - dy * Math.sin(-theta)
      const local_dy = dx * Math.sin(-theta) + dy * Math.cos(-theta)

      const logical_cx = activeWidth.value / 2
      const logical_cy = activeHeight.value / 2

      player.value.x = Math.max(
        0,
        Math.min(
          logical_cx + local_dx - player.value.width / 2,
          activeWidth.value - player.value.width,
        ),
      )
      player.value.y = Math.max(
        0,
        Math.min(
          logical_cy + local_dy - player.value.height / 2,
          activeHeight.value - player.value.height,
        ),
      )
    }
  }

  let pendingSpawns: Enemy[] = []
  let hazardSpawnCooldown = 0
  const formationCenter = { x: GAME_WIDTH / 2, y: 150, dx: 1 }
  let formationTimer = 0
  let formationType = 0
  let objCounter = 0
  let lastFireTime = 0
  let animationFrameId: number
  let enemyDirection = 1
  let wasSpaceDown = false
  let isTransitioningWave = false
  let waveEnemySpeed = 1.5
  let waveEggFireRate = 0.005
  const EGG_SPEED = 2.0 // Đã đổi thành 2.0

  const { w, a, s, d, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, space, Escape } = useMagicKeys()
  const { pressed: mousePressed } = useMousePressed()

  const resumeGame = () => {
    if (gameState.value !== 'paused') return
    gameState.value = 'resuming'
    resumingCountdown.value = 3
    sfx.playTone(600, 600, 'square', 0.1, 0.1)

    resumeInterval = setInterval(() => {
      resumingCountdown.value--
      if (resumingCountdown.value > 0) {
        sfx.playTone(600, 600, 'square', 0.1, 0.1)
      } else {
        if (resumeInterval) clearInterval(resumeInterval)
        sfx.playTone(800, 800, 'square', 0.3, 0.1)
        gameState.value = 'playing'
        lastFireTime = Date.now()
      }
    }, 1000)
  }

  const togglePause = () => {
    sfx.init()
    if (gameState.value === 'playing') {
      gameState.value = 'paused'
    } else if (gameState.value === 'paused') {
      resumeGame()
    } else if (gameState.value === 'resuming') {
      if (resumeInterval) clearInterval(resumeInterval)
      gameState.value = 'paused'
    }
  }

  const toggleMute = () => {
    isMuted.value = !isMuted.value
    sfx.isMuted = isMuted.value
    sfx.init()
  }

  watch(
    () => Escape?.value,
    (isPressed) => {
      if (isPressed) {
        if (gameState.value === 'playing') togglePause()
        else if (gameState.value === 'paused') resumeGame()
      }
    },
  )

  watch(
    () => space?.value,
    (isPressed) => {
      if (isPressed && gameState.value === 'paused') resumeGame()
    },
  )

  const handleBoardPointerDown = (e: PointerEvent) => {
    if (gameState.value === 'paused' && e.pointerType === 'mouse') {
      resumeGame()
    } else {
      setPointerState(e.clientX, e.clientY, true)
    }
  }

  const checkCollision = (rect1?: GameObject, rect2?: GameObject) => {
    if (!rect1 || !rect2) return false
    const padding = 5
    return (
      rect1.x < rect2.x + rect2.width - padding &&
      rect1.x + rect1.width > rect2.x + padding &&
      rect1.y < rect2.y + rect2.height - padding &&
      rect1.y + rect1.height > rect2.y + padding
    )
  }

  const addScore = (pts: number) => {
    const oldMilestone = Math.floor(score.value / 10000)
    score.value += pts
    const newMilestone = Math.floor(score.value / 10000)
    if (newMilestone > oldMilestone) {
      lives.value += newMilestone - oldMilestone
      sfx.powerup()
    }
  }

  const takeDamage = () => {
    if (player.value.invulnerable > 0) return
    sfx.damage()
    lives.value -= 1
    weaponLevel.value = Math.max(1, weaponLevel.value - 1)
    player.value.invulnerable = 120
    if (lives.value <= 0) gameState.value = 'gameover'
  }

  const getWeaponStats = (typeId: number, level: number) => {
    let rays = 1,
      damage = 10
    if (typeId === 0) {
      rays = 1
      damage = 15 + level * 5
    } else if (typeId === 1) {
      rays = Math.min(1 + Math.floor(level / 2), 20)
      damage = 8 + level * 3
    } else if (typeId === 2) {
      rays = Math.min(1 + Math.floor(level / 2), 7)
      damage = 15 + level * 5
    } else if (typeId === 3) {
      rays = Math.min(level, 5)
      damage = 12 + level * 4
    } else if (typeId === 4) {
      rays = Math.min(1 + Math.floor(level / 3), 10)
      damage = 25 + level * 7
    } else if (typeId === 5) {
      rays = level < 10 ? 1 : level < 20 ? 2 : 3
      damage = 12 + level * 3
    } else if (typeId === 6) {
      rays = 1
      damage = 15 + level * 4
    } else if (typeId === 7) {
      rays = Math.min(1 + Math.floor(level / 4), 6)
      damage = 14 + level * 5
    } else if (typeId === 8) {
      rays = 1
      damage = 40 + level * 15
    }
    return { rays, damage }
  }

  const arrangeFormation = (list: Enemy[], type: number) => {
    if (type === 0) {
      let idx = 0
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c <= r; c++) {
          const enemy = list[idx]
          if (enemy) {
            enemy.targetOffsetX = (c - r / 2) * 55
            enemy.targetOffsetY = r * 45 - 60
          }
          idx++
        }
      }
    } else if (type === 1) {
      list.forEach((e, i) => {
        const angle = (Math.PI * 2 * i) / list.length
        e.targetOffsetX = Math.cos(angle) * 120
        e.targetOffsetY = Math.sin(angle) * 120
      })
    } else if (type === 2) {
      list.forEach((e, i) => {
        if (i === 0) {
          e.targetOffsetX = 0
          e.targetOffsetY = -100
        } else if (i <= 7) {
          e.targetOffsetX = -i * 35
          e.targetOffsetY = -100 + i * 35
        } else {
          const j = i - 7
          e.targetOffsetX = j * 35
          e.targetOffsetY = -100 + j * 35
        }
      })
    }
  }

  const getRotationForWave = (wave: number) => {
    const h = Math.floor((wave - 1) / 100)
    const t = ((wave - 1) % 100) + 1
    if ((h - 3) % 5 === 0) return 180
    if (h % 2 === 1 && t >= 51 && t <= 60) return 180
    if (t >= 21 && t <= 30) return -90
    if (t >= 81 && t <= 90) return 90
    return 0
  }

  const startWave = (wave: number) => {
    bullets.value = []
    enemyBullets.value = []
    activeDots.value = []
    bgHue.value = (Math.floor((wave - 1) / 10) * 45) % 360
    waveEnemySpeed = Math.min(1.2 + wave * 0.02, 4.0)
    waveEggFireRate = Math.min(0.005 + wave * 0.0002, 0.02)
    const numColors = Math.min(1 + Math.floor((wave - 1) / 10), 6)

    if (hiddenEventWavesLeft.value > 0) hiddenEventWavesLeft.value--
    if (hiddenEventWavesLeft.value === 0 && wave > 30 && wave % 10 === 6 && Math.random() < 0.1) {
      hiddenEventWavesLeft.value = 4
    }

    const isMeteorZone = wave % 100 >= 71 && wave % 100 <= 79
    const isFallingChickenZone = wave % 10 === 8 && !isMeteorZone
    const isNormalMeteorZone = wave % 10 === 5 && !isMeteorZone

    pendingSpawns = []
    enemies.value = []

    if (wave % 10 === 0) {
      gamePhase.value = 'boss'
      bosses.value = []
      let bType = 0
      if (wave % 100 === 80) bType = 4
      else if (wave >= 100) bType = Math.floor(Math.random() * 4)
      else if (wave >= 40) bType = Math.floor(Math.random() * 3)
      else if (wave >= 20) bType = Math.random() > 0.5 ? 1 : 0
      else bType = 0
      const baseHp = 1000 + wave * 400

      if (bType === 1) {
        bosses.value.push({
          id: `boss-${objCounter++}`,
          bossType: 1,
          x: activeWidth.value / 4 - 60,
          y: -200,
          targetY: 60,
          width: 120,
          height: 120,
          hp: baseHp * 0.6,
          maxHp: baseHp * 0.6,
          direction: 1,
          state: 'idle',
          stateTimer: 0,
        })
        bosses.value.push({
          id: `boss-${objCounter++}`,
          bossType: 1,
          x: (activeWidth.value / 4) * 3 - 60,
          y: -200,
          targetY: 60,
          width: 120,
          height: 120,
          hp: baseHp * 0.6,
          maxHp: baseHp * 0.6,
          direction: -1,
          state: 'idle',
          stateTimer: 0,
        })
      } else {
        bosses.value.push({
          id: `boss-${objCounter++}`,
          bossType: bType,
          x: activeWidth.value / 2 - 80,
          y: -200,
          targetY: 40,
          width: 160,
          height: 160,
          hp: baseHp,
          maxHp: baseHp,
          direction: 1,
          state: 'idle',
          stateTimer: 60,
          laserTimer: 200,
          burstCount: 0,
        })
      }
      return
    }

    if (isMeteorZone || isFallingChickenZone || isNormalMeteorZone) {
      gamePhase.value = 'meteors'
      hazardSpawnCooldown = 0
      let count = 0
      if (isMeteorZone) count = Math.floor(Math.random() * 31) + 50
      else if (isFallingChickenZone) count = 20 + Math.floor(wave / 2)
      else count = Math.floor(Math.random() * 31) + 50

      for (let i = 0; i < count; i++) {
        const size = isFallingChickenZone ? 45 : 40 + Math.random() * 40
        let dx = 0
        let dy = waveEnemySpeed * 1.4
        if (isMeteorZone) {
          const rand = Math.random()
          if (rand < 0.33) dx = -(waveEnemySpeed * 1.0)
          else if (rand < 0.66) dx = waveEnemySpeed * 1.0
          dy = waveEnemySpeed * 1.6
        } else if (isFallingChickenZone) {
          dy = EGG_SPEED * 0.7
        }

        const startX = isMeteorZone
          ? Math.random() * (activeWidth.value * 2) - activeWidth.value / 2
          : Math.random() * (activeWidth.value - size)
        pendingSpawns.push({
          id: `falling-${objCounter++}`,
          x: startX,
          y: -100 - Math.random() * 50,
          width: size,
          height: size,
          hp: 40 + wave * 5,
          maxHp: 40 + wave * 5,
          isMeteor: !isFallingChickenZone,
          isFallingChicken: isFallingChickenZone,
          hue: isFallingChickenZone ? Math.floor(Math.random() * numColors) * 60 : 0,
          dx,
          dy,
        })
      }
      return
    }

    gamePhase.value = 'minions'
    enemyDirection = 1
    const minionHp = wave === 1 ? 10 : 15 + wave * 10
    const generatedMinions: Enemy[] = []

    if (wave % 10 === 6) {
      const count = 15
      for (let i = 0; i < count; i++) {
        generatedMinions.push({
          id: `dyn-${objCounter++}`,
          x: activeWidth.value / 2,
          y: -200,
          width: 40,
          height: 40,
          hp: minionHp,
          maxHp: minionHp,
          isStash: i === 0,
          hue: Math.floor(Math.random() * numColors) * 60,
          targetOffsetX: 0,
          targetOffsetY: 0,
        })
      }
      formationType = 0
      formationTimer = 200
      formationCenter.x = activeWidth.value / 2
      formationCenter.y = 150
      formationCenter.dx = 1
      arrangeFormation(generatedMinions, formationType)
    } else if (wave % 10 === 4 || wave % 10 === 9) {
      const isX = wave % 10 === 4
      const size = 5
      const startX = activeWidth.value / 2
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (isX) {
            if (r === c || r + c === size - 1) {
              generatedMinions.push({
                id: `enemy-${objCounter++}`,
                x: startX + (c - size / 2) * 60,
                y: -200 - r * 60,
                targetY: 80 + r * 50,
                width: 40,
                height: 40,
                hp: minionHp,
                maxHp: minionHp,
                hue: Math.floor(Math.random() * numColors) * 60,
              })
            }
          } else {
            if (
              Math.abs(r - Math.floor(size / 2)) + Math.abs(c - Math.floor(size / 2)) <=
              Math.floor(size / 2) + 1
            ) {
              generatedMinions.push({
                id: `enemy-${objCounter++}`,
                x: startX + (c - size / 2) * 60,
                y: -200 - r * 60,
                targetY: 80 + r * 50,
                width: 40,
                height: 40,
                hp: minionHp,
                maxHp: minionHp,
                hue: Math.floor(Math.random() * numColors) * 60,
              })
            }
          }
        }
      }
      const firstMinion = generatedMinions[0]
      if (firstMinion) firstMinion.isStash = true
    } else if (wave % 10 === 3) {
      const isCircle = Math.random() > 0.5
      if (isCircle) {
        const r = 160
        for (let i = 0; i < 14; i++) {
          const angle = (Math.PI * 2 * i) / 14
          generatedMinions.push({
            id: `enemy-${objCounter++}`,
            x: activeWidth.value / 2 - 20 + r * Math.cos(angle),
            y: -200 - i * 30,
            targetY: 240 + r * Math.sin(angle),
            width: 40,
            height: 40,
            hp: minionHp,
            maxHp: minionHp,
            hue: Math.floor(Math.random() * numColors) * 60,
          })
        }
      } else {
        for (let i = 0; i < 11; i++) {
          generatedMinions.push({
            id: `enemy-${objCounter++}`,
            x: activeWidth.value / 2 - 20 + (i - 5) * 65,
            y: -100 - Math.abs(i - 5) * 60,
            targetY: 80 + Math.abs(i - 5) * 55,
            width: 40,
            height: 40,
            hp: minionHp,
            maxHp: minionHp,
            hue: Math.floor(Math.random() * numColors) * 60,
          })
        }
      }
    } else {
      const rows = Math.min(3 + Math.floor(wave / 4), 5)
      const cols = Math.min(8 + Math.floor(wave / 3), 12)
      const startX = (activeWidth.value - cols * 50) / 2
      const centerRow = Math.floor(rows / 2)
      const centerCol = Math.floor(cols / 2)

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (wave % 10 === 7 && row === centerRow && col === centerCol) {
            generatedMinions.push({
              id: `stash-${objCounter++}`,
              x: startX + col * 50,
              y: -100 - (rows - row) * 80,
              targetY: 60 + row * 45,
              width: 90,
              height: 85,
              hp: minionHp * 15,
              maxHp: minionHp * 15,
              isStash: true,
              hue: 0,
            })
            continue
          }
          if (
            wave % 10 === 7 &&
            (row === centerRow || row === centerRow + 1) &&
            (col === centerCol || col === centerCol + 1)
          )
            continue
          generatedMinions.push({
            id: `enemy-${objCounter++}`,
            x: startX + col * 50,
            y: -100 - (rows - row) * 80,
            targetY: 60 + row * 45,
            width: 40,
            height: 40,
            hp: minionHp,
            maxHp: minionHp,
            isStash: false,
            hue: Math.floor(Math.random() * numColors) * 60,
          })
        }
      }
    }
    pendingSpawns = generatedMinions
  }

  const startGame = () => {
    sfx.init()
    gameState.value = 'starting'
    isTransitioningWave = true
    waveAnnouncement.value = 'WAVE 1'
    setTimeout(() => {
      gameState.value = 'playing'
      startWave(1)
      waveAnnouncement.value = ''
      isTransitioningWave = false
    }, 2000)
  }

  const initGame = () => {
    currentWave.value = 1
    weaponType.value = 0
    weaponLevel.value = 1
    score.value = 0
    lives.value = 3
    bullets.value = []
    enemyBullets.value = []
    powerUps.value = []
    pendingSpawns = []

    isRotating.value = false
    boardRotation.value = getRotationForWave(1)
    activeWidth.value = GAME_WIDTH
    activeHeight.value = GAME_HEIGHT

    player.value.x = activeWidth.value / 2 - 30
    player.value.y = activeHeight.value - 90
    player.value.invulnerable = 0

    isTransitioningWave = false
    waveAnnouncement.value = ''
    hiddenEventWavesLeft.value = 0
    activeDots.value = []

    startGame()
  }

  const fireBullets = () => {
    const isFiring =
      space?.value === true ||
      mobileKeys.value.fire ||
      pointerState.value.isDown ||
      mousePressed.value
    if (!isFiring) return
    sfx.init()

    const isTap = isFiring && !wasSpaceDown
    const wType = weaponType.value
    if (wType === 6 || wType === 5) return

    let currentFireRate = FIRE_RATE
    if (wType === 0 || wType === 3) currentFireRate = isTap ? 80 : 350
    if (wType === 8) currentFireRate = 800

    if (Date.now() - lastFireTime < currentFireRate) return

    sfx.shoot()
    const cx = player.value.x + player.value.width / 2
    const cy = player.value.y
    const w = WEAPON_TYPES[wType]
    if (!w) return

    const { rays, damage } = getWeaponStats(wType, weaponLevel.value)

    for (let i = 0; i < rays; i++) {
      const offsetIndex = i - (rays - 1) / 2
      let dx = 0,
        dy = -(w.speed || 10),
        offsetX = 0,
        bulletWidth = w.size || 10,
        bulletHeight = 20,
        bulletY = cy,
        rotation = 0

      switch (w.type) {
        case 'yellow':
          dx = 0
          offsetX = 0
          bulletWidth = 10 + Math.min(weaponLevel.value, 20) * 2
          bulletHeight = activeHeight.value
          bulletY = cy - activeHeight.value + 20
          break
        case 'blue':
          dx = 0
          offsetX = offsetIndex * 8
          bulletHeight = 35
          break
        case 'red':
          rotation = offsetIndex * 6
          dx = offsetIndex * 1.5
          offsetX = offsetIndex * 6
          bulletHeight = (w.size || 10) * 2
          break
        case 'green':
          dx = 0
          offsetX = offsetIndex * 15
          bulletHeight = 35
          break
        case 'purple':
          dx = offsetIndex * 0.5
          offsetX = offsetIndex * 4
          bulletHeight = 30
          break
        case 'lightning':
          dx = offsetIndex * 0.5
          offsetX = offsetIndex * 25
          bulletHeight = 70
          break
        case 'lime':
          dx = (Math.random() - 0.5) * 1.5
          offsetX = offsetIndex * 15
          bulletHeight = 18
          break
        case 'orange':
          dx = 0
          offsetX = 0
          bulletWidth = 50 + Math.min(weaponLevel.value, 20) * 5
          bulletHeight = bulletWidth
          bulletY = cy - bulletHeight / 2
          dy = -3
          break
      }
      bullets.value.push({
        id: `b-${objCounter++}-${Math.random()}`,
        x: cx + offsetX - bulletWidth / 2,
        y: bulletY,
        width: bulletWidth,
        height: bulletHeight,
        dx,
        dy,
        color: w.color || '',
        shape: w.shape || '',
        damage,
        rotation,
        hitTargets: new Set(),
      })
      if (w.type === 'yellow' || w.type === 'orange') break
    }
    lastFireTime = Date.now()
  }

  const handleEnemyDeath = (enemy: Enemy, ptMult: number) => {
    sfx.explode()
    if (enemy.isStash) {
      powerUps.value.push({
        id: objCounter++,
        x: enemy.x + 25,
        y: enemy.y + 25,
        width: 32,
        height: 32,
        wType: -1,
      })
    } else if (!enemy.isHazard) {
      const dropRate = enemy.isMeteor ? 0.012 : 0.12
      if (Math.random() < dropRate) {
        powerUps.value.push({
          id: objCounter++,
          x: enemy.x,
          y: enemy.y,
          width: 32,
          height: 32,
          wType: Math.random() < 0.4 ? -1 : Math.floor(Math.random() * WEAPON_TYPES.length),
        })
      }
    }
    const idx = enemies.value.findIndex((e) => e.id === enemy.id)
    if (idx !== -1) enemies.value.splice(idx, 1)
    addScore((enemy.isStash ? 100 : enemy.isMeteor ? 20 : 10) * ptMult)
  }

  const gameLoop = () => {
    if (gameState.value !== 'playing' && gameState.value !== 'starting') {
      animationFrameId = requestAnimationFrame(gameLoop)
      return
    }

    if (player.value.invulnerable > 0) player.value.invulnerable--

    let vvx = 0,
      vvy = 0
    if (a?.value || ArrowLeft?.value || mobileKeys.value.left) vvx -= SHIP_SPEED
    if (d?.value || ArrowRight?.value || mobileKeys.value.right) vvx += SHIP_SPEED
    if (w?.value || ArrowUp?.value) vvy -= SHIP_SPEED
    if (s?.value || ArrowDown?.value) vvy += SHIP_SPEED

    const theta = (boardRotation.value * Math.PI) / 180
    const local_vx = vvx * Math.cos(-theta) - vvy * Math.sin(-theta)
    const local_vy = vvx * Math.sin(-theta) + vvy * Math.cos(-theta)

    player.value.x = Math.max(
      0,
      Math.min(player.value.x + local_vx, activeWidth.value - player.value.width),
    )
    player.value.y = Math.max(
      0,
      Math.min(player.value.y + local_vy, activeHeight.value - player.value.height),
    )

    const isFiring =
      space?.value === true ||
      mobileKeys.value.fire ||
      pointerState.value.isDown ||
      mousePressed.value
    const ptMult = hiddenEventWavesLeft.value > 0 ? 2 : 1

    if (isFiring && (weaponType.value === 6 || weaponType.value === 5)) {
      sfx.init()
      if (!wasSpaceDown) sfx.shoot()
      const w = WEAPON_TYPES[weaponType.value]
      if (w) {
        const { rays, damage } = getWeaponStats(weaponType.value, weaponLevel.value)
        const currentAttached = bullets.value.filter((b) => b.isAttached)
        if (
          currentAttached.length > 0 &&
          (currentAttached.length !== rays || currentAttached[0]?.shape !== w.shape)
        ) {
          bullets.value = bullets.value.filter((b) => !b.isAttached)
        }

        for (let i = 0; i < rays; i++) {
          const offsetIndex = i - (rays - 1) / 2
          const bw = (w.size || 10) + Math.min(weaponLevel.value, 20) * (w.type === 'pink' ? 2 : 1)
          const offsetX = offsetIndex * (w.type === 'lightning' ? 30 : 0)
          const rotation = offsetIndex * (w.type === 'lightning' ? 8 : 0)

          const beamX = player.value.x + player.value.width / 2 + offsetX - bw / 2
          let targetY = -100

          if (w.type === 'lightning') {
            const hitBoxX = beamX - Math.abs(rotation) * 2
            const hitBoxW = bw + Math.abs(rotation) * 4
            const checkBlock = (target: Enemy | Boss) => {
              if (
                target.hp > 0 &&
                target.y + target.height < player.value.y &&
                target.x + target.width > hitBoxX &&
                target.x < hitBoxX + hitBoxW
              ) {
                if (target.y + target.height / 2 > targetY) targetY = target.y + target.height / 2
              }
            }
            enemies.value.forEach(checkBlock)
            if (gamePhase.value === 'boss') bosses.value.forEach(checkBlock)
          } else {
            targetY = player.value.y - activeHeight.value + 20
          }

          const beamHeight = player.value.y - targetY + 20
          const beamY = targetY

          const existingBeam = bullets.value.find((b) => b.isAttached && b.attachedId === i)
          if (!existingBeam) {
            bullets.value.push({
              id: `b-${objCounter++}-${Math.random()}`,
              attachedId: i,
              x: beamX,
              y: beamY,
              width: bw,
              height: beamHeight,
              dx: 0,
              dy: 0,
              color: w.color || '',
              shape: w.shape || '',
              damage,
              rotation,
              hitTargets: new Set(),
              isAttached: true,
              lastTick: Date.now(),
            })
          } else {
            existingBeam.x = beamX
            existingBeam.y = beamY
            existingBeam.width = bw
            existingBeam.height = beamHeight
            existingBeam.rotation = rotation
            if (Date.now() - (existingBeam.lastTick ?? 0) > 100) {
              existingBeam.hitTargets.clear()
              existingBeam.lastTick = Date.now()
            }
          }
        }
      }
    } else {
      for (let i = bullets.value.length - 1; i >= 0; i--) {
        const b = bullets.value[i]
        if (b && b.isAttached) {
          if (b.shape === 'bolt') bullets.value.splice(i, 1)
          else {
            b.isAttached = false
            b.dy = -(WEAPON_TYPES[6]?.speed || 40)
          }
        }
      }
    }

    fireBullets()
    wasSpaceDown = isFiring

    const now = Date.now()
    for (let i = activeDots.value.length - 1; i >= 0; i--) {
      const dot = activeDots.value[i]
      if (!dot) continue
      if (now > dot.endTime) {
        activeDots.value.splice(i, 1)
        continue
      }
      if (now - dot.lastTick > 150) {
        let target: Enemy | Boss | undefined | null = enemies.value.find(
          (e) => e.id === dot.targetId,
        )
        if (!target && gamePhase.value === 'boss')
          target = bosses.value.find((b) => b.id === dot.targetId)

        if (target && target.hp > 0) {
          target.hp -= dot.damagePerTick
          dot.lastTick = now
          if (target.hp <= 0 && !bosses.value.some((b) => b.id === target?.id)) {
            handleEnemyDeath(target as Enemy, ptMult)
          }
        } else {
          activeDots.value.splice(i, 1)
        }
      }
    }

    for (let i = bullets.value.length - 1; i >= 0; i--) {
      const b = bullets.value[i]
      if (!b) continue
      b.y += b.dy
      b.x += b.dx
      if (
        b.y + b.height < -500 ||
        b.y > activeHeight.value + 100 ||
        b.x < -100 ||
        b.x > activeWidth.value + 100
      )
        bullets.value.splice(i, 1)
    }

    for (let i = powerUps.value.length - 1; i >= 0; i--) {
      const pu = powerUps.value[i]
      if (!pu) continue
      pu.y += 2.5
      if (checkCollision(pu, player.value)) {
        sfx.powerup()
        if (pu.wType === -1) weaponLevel.value++
        else {
          if (weaponType.value === pu.wType) weaponLevel.value++
          else weaponType.value = pu.wType
        }
        addScore(50)
        powerUps.value.splice(i, 1)
      } else if (pu.y > activeHeight.value) {
        powerUps.value.splice(i, 1)
      }
    }

    for (let i = enemyBullets.value.length - 1; i >= 0; i--) {
      const egg = enemyBullets.value[i]
      if (!egg) continue
      egg.y += egg.dy !== undefined ? egg.dy : EGG_SPEED
      egg.x += egg.dx || 0

      if (checkCollision(egg, player.value)) {
        enemyBullets.value.splice(i, 1)
        takeDamage()
      } else if (egg.y > activeHeight.value || egg.x < -100 || egg.x > activeWidth.value + 100) {
        enemyBullets.value.splice(i, 1)
      }
    }

    if (gamePhase.value === 'minions' || gamePhase.value === 'meteors') {
      if (pendingSpawns.length > 0 && gameState.value !== 'starting') {
        if (gamePhase.value === 'minions') {
          const chunk = pendingSpawns.splice(0, 10)
          enemies.value.push(...chunk)
        } else {
          if (hazardSpawnCooldown <= 0) {
            const isMeteorZ = currentWave.value % 100 >= 71 && currentWave.value % 100 <= 79
            const spawns = isMeteorZ && Math.random() < 0.4 ? 2 : 1
            for (let s = 0; s < spawns; s++) {
              const nextHazard = pendingSpawns.pop()
              if (nextHazard) enemies.value.push(nextHazard)
            }
            if (isMeteorZ) {
              hazardSpawnCooldown = 15 + Math.random() * 10
            } else if (currentWave.value % 10 === 8) {
              hazardSpawnCooldown = 35 + Math.random() * 25
            } else {
              hazardSpawnCooldown = 25 + Math.random() * 20
            }
          } else {
            hazardSpawnCooldown--
          }
        }
      }

      if (gamePhase.value === 'minions') {
        const isDynamicWave = currentWave.value % 10 === 6

        if (isDynamicWave) {
          formationCenter.x += formationCenter.dx * waveEnemySpeed
          if (formationCenter.x < 150 || formationCenter.x > activeWidth.value - 150)
            formationCenter.dx *= -1

          formationTimer--
          if (formationTimer <= 0) {
            formationTimer = 250
            formationType = (formationType + 1) % 3
            arrangeFormation(enemies.value, formationType)
            arrangeFormation(pendingSpawns, formationType)
          }

          enemies.value.forEach((enemy) => {
            if (
              !enemy.isHazard &&
              enemy.targetOffsetX !== undefined &&
              enemy.targetOffsetY !== undefined
            ) {
              const tx = formationCenter.x + enemy.targetOffsetX
              const ty = formationCenter.y + enemy.targetOffsetY
              enemy.x += (tx - enemy.x) * 0.05
              enemy.y += (ty - enemy.y) * 0.05
            } else if (enemy.isHazard) {
              enemy.y += enemy.dy || 5
              if (enemy.dx) enemy.x += enemy.dx
            }
          })

          if (
            Math.random() < waveEggFireRate &&
            enemies.value.length > 0 &&
            gameState.value === 'playing'
          ) {
            const shootingEnemies = enemies.value.filter(
              (e) => !e.isStash && !e.isHazard && e.y >= 0,
            )
            if (shootingEnemies.length > 0) {
              const randomEnemy =
                shootingEnemies[Math.floor(Math.random() * shootingEnemies.length)]
              if (randomEnemy)
                enemyBullets.value.push({
                  id: objCounter++,
                  x: randomEnemy.x + randomEnemy.width / 2 - 8,
                  y: randomEnemy.y + randomEnemy.height,
                  width: 20,
                  height: 25,
                  isBossEgg: false,
                })
            }
          }
        } else {
          let isSpawning = false
          enemies.value.forEach((enemy) => {
            if (enemy.isHazard) {
              enemy.y += enemy.dy || 5
              if (enemy.dx) enemy.x += enemy.dx
            } else {
              if (enemy.targetY !== undefined && enemy.y < enemy.targetY) {
                enemy.y += 4
                isSpawning = true
                if (enemy.y > enemy.targetY) enemy.y = enemy.targetY
              }
            }
          })
          if (!isSpawning) {
            let hitWall = false
            enemies.value.forEach((enemy) => {
              if (!enemy.isHazard) {
                enemy.x += waveEnemySpeed * enemyDirection
                if (enemy.x <= 0 || enemy.x + enemy.width >= activeWidth.value) hitWall = true
              }
            })
            if (hitWall) {
              enemyDirection *= -1
              enemies.value.forEach((enemy) => {
                // Yêu cầu 2: Đổi 20 thành 10
                if (!enemy.isHazard) {
                  enemy.y += 10
                  if (enemy.targetY !== undefined) enemy.targetY += 10
                }
              })
            }
            if (
              Math.random() < waveEggFireRate &&
              enemies.value.length > 0 &&
              gameState.value === 'playing'
            ) {
              const shootingEnemies = enemies.value.filter(
                (e) => !e.isStash && !e.isHazard && e.y >= 0,
              )
              if (shootingEnemies.length > 0) {
                const randomEnemy =
                  shootingEnemies[Math.floor(Math.random() * shootingEnemies.length)]
                if (randomEnemy)
                  enemyBullets.value.push({
                    id: objCounter++,
                    x: randomEnemy.x + randomEnemy.width / 2 - 8,
                    y: randomEnemy.y + randomEnemy.height,
                    width: 20,
                    height: 25,
                    isBossEgg: false,
                  })
              }
            }
          }
        }

        if (
          hiddenEventWavesLeft.value > 0 &&
          Math.random() < 0.02 &&
          gameState.value === 'playing'
        ) {
          const size = 30 + Math.random() * 30
          enemies.value.push({
            id: `hazard-${objCounter++}`,
            x: Math.random() * activeWidth.value,
            y: -100,
            width: size,
            height: size,
            hp: 20 + currentWave.value * 2,
            maxHp: 20 + currentWave.value * 2,
            isMeteor: true,
            isHazard: true,
            dy: waveEnemySpeed * 2,
            dx: (Math.random() - 0.5) * 2,
          })
        }
      } else {
        enemies.value.forEach((meteor) => {
          meteor.y += meteor.dy || waveEnemySpeed * 1.5
          if (meteor.dx) meteor.x += meteor.dx
        })

        if (
          Math.random() < waveEggFireRate * 1.5 &&
          enemies.value.length > 0 &&
          gameState.value === 'playing'
        ) {
          const fallingChickens = enemies.value.filter(
            (e) => e.isFallingChicken && e.y >= 0 && e.y < activeHeight.value - 100,
          )
          if (fallingChickens.length > 0) {
            const randomChicken =
              fallingChickens[Math.floor(Math.random() * fallingChickens.length)]
            if (randomChicken) {
              enemyBullets.value.push({
                id: `falling-egg-${objCounter++}`,
                x: randomChicken.x + randomChicken.width / 2 - 8,
                y: randomChicken.y + randomChicken.height,
                width: 20,
                height: 25,
                isBossEgg: false,
                dy: EGG_SPEED,
              })
            }
          }
        }
      }

      for (let bIndex = bullets.value.length - 1; bIndex >= 0; bIndex--) {
        let bulletHit = false
        const bullet = bullets.value[bIndex]
        if (!bullet) continue

        for (let eIndex = enemies.value.length - 1; eIndex >= 0; eIndex--) {
          const enemy = enemies.value[eIndex]
          if (!enemy) continue

          if (checkCollision(bullet, enemy)) {
            if (bullet.hitTargets.has(enemy.id)) continue
            enemy.hp -= bullet.damage
            sfx.hit()

            if (bullet.shape === 'blob') {
              const existingDot = activeDots.value.find((d) => d.targetId === enemy.id)
              const dotDamage = bullet.damage * 0.4
              if (existingDot) {
                existingDot.endTime = Date.now() + 2000
                existingDot.damagePerTick = dotDamage
              } else {
                activeDots.value.push({
                  targetId: enemy.id,
                  damagePerTick: dotDamage,
                  endTime: Date.now() + 2000,
                  lastTick: Date.now(),
                })
              }
            }

            if (['beam', 'wavy-beam', 'shard', 'bolt'].includes(bullet.shape)) {
              bullet.hitTargets.add(enemy.id)
            } else {
              bulletHit = true
            }

            if (enemy.hp <= 0) {
              handleEnemyDeath(enemy, ptMult)
            }
            if (bulletHit) break
          }
        }
        if (bulletHit) bullets.value.splice(bIndex, 1)
      }

      for (let i = enemies.value.length - 1; i >= 0; i--) {
        const enemy = enemies.value[i]
        if (!enemy) continue

        if (checkCollision(enemy, player.value)) {
          takeDamage()
          enemies.value.splice(i, 1)
        } else if (
          enemy.y > activeHeight.value ||
          enemy.x < -200 ||
          enemy.x > activeWidth.value + 200
        ) {
          if (gamePhase.value === 'minions' && !enemy.isHazard) {
            takeDamage()
            enemies.value.splice(i, 1)
          } else enemies.value.splice(i, 1)
        }
      }

      const activeEnemies = enemies.value.filter((e) => !e.isHazard)

      if (activeEnemies.length === 0 && pendingSpawns.length === 0 && !isTransitioningWave) {
        isTransitioningWave = true
        addScore(1000 * ptMult)

        const nextW = currentWave.value + 1
        const nextRot = getRotationForWave(nextW)
        const willRotate = boardRotation.value !== nextRot
        waveAnnouncement.value = `WAVE ${nextW}${hiddenEventWavesLeft.value > 0 ? '\n☄️ x2 ĐIỂM ☄️' : ''}`

        if (willRotate) {
          bullets.value = []
          enemyBullets.value = []
          powerUps.value = []
          activeDots.value = []
          enemies.value = []

          isRotating.value = true
          boardRotation.value = nextRot
          if (Math.abs(nextRot % 180) === 90) {
            activeWidth.value = GAME_HEIGHT
            activeHeight.value = GAME_WIDTH
          } else {
            activeWidth.value = GAME_WIDTH
            activeHeight.value = GAME_HEIGHT
          }
          player.value.x = activeWidth.value / 2 - player.value.width / 2
          player.value.y = activeHeight.value - 90

          setTimeout(() => {
            isRotating.value = false
            setTimeout(() => {
              currentWave.value++
              startWave(currentWave.value)
              waveAnnouncement.value = ''
              isTransitioningWave = false
            }, 1000)
          }, 1000)
        } else {
          setTimeout(() => {
            currentWave.value++
            startWave(currentWave.value)
            waveAnnouncement.value = ''
            isTransitioningWave = false
          }, 2000)
        }
      }
    } else if (gamePhase.value === 'boss') {
      bosses.value.forEach((b) => {
        if (b.hp <= 0) return
        if (checkCollision(b, player.value)) {
          takeDamage()
        }

        if (b.targetY !== undefined && b.y < b.targetY) {
          b.y += 4
        } else if (gameState.value === 'playing') {
          if (b.bossType === 1) {
            b.x += (waveEnemySpeed + 2) * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1
            b.y = b.targetY! + Math.sin(Date.now() / 300) * 30
            if (Math.random() < waveEggFireRate * 1.5) {
              enemyBullets.value.push({
                id: `boss-egg-${objCounter++}`,
                x: b.x + b.width / 2 - 12,
                y: b.y + b.height,
                width: 30,
                height: 35,
                isBossEgg: true,
              })
            }
          } else if (b.bossType === 2) {
            b.x += waveEnemySpeed * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1
            if (b.laserTimer !== undefined && b.laserTimer > 0) {
              b.laserTimer--
            } else {
              if (b.state === 'idle') {
                b.state = 'laser_warning'
                b.laserTimer = 50
                b.laserX = b.x + b.width / 2 - 40
              } else if (b.state === 'laser_warning') {
                b.state = 'laser_firing'
                b.laserTimer = 15
              } else {
                b.state = 'idle'
                b.laserTimer = 200
              }
            }
            if (b.state === 'laser_firing' && b.laserX !== undefined) {
              const laserHitbox = {
                x: b.laserX,
                y: b.y + b.height,
                width: 80,
                height: activeHeight.value,
              }
              if (checkCollision(player.value, laserHitbox)) takeDamage()
            }
          } else if (b.bossType === 3) {
            if (b.stateTimer !== undefined) b.stateTimer -= 1
            if (b.stateTimer !== undefined && b.stateTimer <= 0) {
              const r = Math.random()
              if (r < 0.3) {
                b.state = 'dash'
                b.stateTimer = 80
                b.direction *= -1
              } else if (r < 0.6) {
                b.state = 'burst'
                b.stateTimer = 120
                b.burstCount = 4
              } else {
                b.state = 'idle'
                b.stateTimer = 100
              }
            }
            let bSpeed = waveEnemySpeed * 0.8
            if (b.state === 'dash') bSpeed = waveEnemySpeed + 3
            if (b.state === 'burst') bSpeed = waveEnemySpeed * 0.2

            b.x += bSpeed * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) {
              b.direction *= -1
              b.x = Math.max(0, Math.min(b.x, activeWidth.value - b.width))
            }

            if (
              b.state === 'burst' &&
              b.burstCount !== undefined &&
              b.burstCount > 0 &&
              b.stateTimer !== undefined &&
              b.stateTimer % 40 === 0
            ) {
              ;[-4, 0, 4].forEach((eggDx) => {
                enemyBullets.value.push({
                  id: `boss-egg-${objCounter++}`,
                  x: b.x + b.width / 2 - 12,
                  y: b.y + b.height - 20,
                  width: 30,
                  height: 35,
                  isBossEgg: true,
                  dx: eggDx,
                  dy: 6,
                })
              })
              b.burstCount--
            }
            if (Math.random() < waveEggFireRate * 1.0 && b.state !== 'burst') {
              enemyBullets.value.push({
                id: `boss-egg-${objCounter++}`,
                x: b.x + b.width / 2 - 12,
                y: b.y + b.height - 20,
                width: 30,
                height: 35,
                isBossEgg: true,
              })
            }
            if (b.laserTimer !== undefined && b.laserTimer > 0) {
              b.laserTimer--
            } else {
              if (b.state === 'idle' || b.state === 'dash') {
                b.state = 'laser_warning'
                b.laserTimer = 60
                b.laserX = b.x + b.width / 2 - 40
              } else if (b.state === 'laser_warning') {
                b.state = 'laser_firing'
                b.laserTimer = 15
              } else {
                b.state = 'idle'
                b.laserTimer = 300
              }
            }
            if (b.state === 'laser_firing' && b.laserX !== undefined) {
              const laserHitbox = {
                x: b.laserX,
                y: b.y + b.height,
                width: 80,
                height: activeHeight.value,
              }
              if (checkCollision(player.value, laserHitbox)) takeDamage()
            }
          } else if (b.bossType === 4) {
            b.x += (waveEnemySpeed + 1) * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1
            if (Math.random() < waveEggFireRate * 1.5) {
              enemyBullets.value.push({
                id: `boss-meteor-${objCounter++}`,
                x: b.x + b.width / 2 - 20,
                y: b.y + b.height - 10,
                width: 40,
                height: 40,
                isBossEgg: true,
                isMeteor: true,
                dy: EGG_SPEED + 1,
                dx: (Math.random() - 0.5) * 2,
              })
            }
          } else {
            b.x += (waveEnemySpeed + 1) * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1
            if (Math.random() < waveEggFireRate * 1.0) {
              enemyBullets.value.push({
                id: `boss-egg-${objCounter++}`,
                x: b.x + b.width / 2 - 12,
                y: b.y + b.height - 20,
                width: 30,
                height: 35,
                isBossEgg: true,
              })
            }
            if (b.laserTimer !== undefined && b.laserTimer > 0) {
              b.laserTimer--
            } else {
              if (b.state === 'idle') {
                b.state = 'laser_warning'
                b.laserTimer = 60
                b.laserX = b.x + b.width / 2 - 40
              } else if (b.state === 'laser_warning') {
                b.state = 'laser_firing'
                b.laserTimer = 15
              } else {
                b.state = 'idle'
                b.laserTimer = 300
              }
            }
            if (b.state === 'laser_firing' && b.laserX !== undefined) {
              const laserHitbox = {
                x: b.laserX,
                y: b.y + b.height,
                width: 80,
                height: activeHeight.value,
              }
              if (checkCollision(player.value, laserHitbox)) takeDamage()
            }
          }
        }
      })

      for (let bIndex = bullets.value.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets.value[bIndex]
        if (!bullet) continue

        for (let i = 0; i < bosses.value.length; i++) {
          const b = bosses.value[i]
          if ((b && b.hp <= 0) || !b) continue

          if (checkCollision(bullet, b)) {
            if (bullet.hitTargets.has(b.id)) continue
            b.hp -= bullet.damage
            sfx.hit()

            if (bullet.shape === 'blob') {
              const existingDot = activeDots.value.find((d) => d.targetId === b.id)
              const dotDamage = bullet.damage * 0.4
              if (existingDot) {
                existingDot.endTime = Date.now() + 2000
                existingDot.damagePerTick = dotDamage
              } else {
                activeDots.value.push({
                  targetId: b.id,
                  damagePerTick: dotDamage,
                  endTime: Date.now() + 2000,
                  lastTick: Date.now(),
                })
              }
            }

            if (['beam', 'wavy-beam', 'shard', 'bolt'].includes(bullet.shape)) {
              bullet.hitTargets.add(b.id)
            } else {
              bullets.value.splice(bIndex, 1)
              break
            }
          }
        }
      }

      const allBossesDead = bosses.value.length > 0 && bosses.value.every((b) => b.hp <= 0)

      if (allBossesDead && !isTransitioningWave) {
        sfx.explode()
        isTransitioningWave = true
        addScore(1000 * ptMult)

        const nextW = currentWave.value + 1
        const nextRot = getRotationForWave(nextW)
        const willRotate = boardRotation.value !== nextRot
        waveAnnouncement.value = `WAVE ${nextW}${hiddenEventWavesLeft.value > 0 ? '\n☄️ x2 ĐIỂM ☄️' : ''}`

        if (willRotate) {
          bullets.value = []
          enemyBullets.value = []
          powerUps.value = []
          activeDots.value = []
          enemies.value = []

          isRotating.value = true
          boardRotation.value = nextRot
          if (Math.abs(nextRot % 180) === 90) {
            activeWidth.value = GAME_HEIGHT
            activeHeight.value = GAME_WIDTH
          } else {
            activeWidth.value = GAME_WIDTH
            activeHeight.value = GAME_HEIGHT
          }
          player.value.x = activeWidth.value / 2 - player.value.width / 2
          player.value.y = activeHeight.value - 90

          setTimeout(() => {
            isRotating.value = false
            setTimeout(() => {
              currentWave.value++
              startWave(currentWave.value)
              waveAnnouncement.value = ''
              isTransitioningWave = false
            }, 1000)
          }, 1000)
        } else {
          setTimeout(() => {
            currentWave.value++
            startWave(currentWave.value)
            waveAnnouncement.value = ''
            isTransitioningWave = false
          }, 2000)
        }
      }
    }
    animationFrameId = requestAnimationFrame(gameLoop)
  }

  onMounted(() => {
    gameLoop()
  })
  onUnmounted(() => {
    if (resumeInterval) clearInterval(resumeInterval)
    cancelAnimationFrame(animationFrameId)
  })

  return {
    gameState,
    gamePhase,
    currentWave,
    weaponType,
    weaponLevel,
    mobileKeys,
    togglePause,
    bgHue,
    isMuted,
    toggleMute,
    boardRotation,
    activeWidth,
    activeHeight,
    setPointerState,
    isRotating,
    startGame,
    resumingCountdown,
    handleBoardPointerDown,
    player,
    score,
    lives,
    bullets,
    enemyBullets,
    enemies,
    powerUps,
    bosses,
    waveAnnouncement,
    initGame,
  }
}
