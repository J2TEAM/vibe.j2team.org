<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import { useAudio } from './composables/use-audio'
import type { MatterAPI, MatterBody } from './types'
import { getMatter } from './types'
import { DEFAULT_CONFIG } from './config'
import type { DifficultyConfig, GameConfig } from './config'

const MATTER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const menuVisible = ref(true)
const p1Score = ref('0m')
const p2Score = ref('')
const p2Visible = ref(false)
const gameMessage = ref('')
const gameMessageColor = ref('#fff')
const gameMessageVisible = ref(false)
const biomeText = ref('')
const biomeVisible = ref(false)
const difficultyLevel = ref(1)
const selectedSkinIndex = ref(0)
const comboCount = ref(0)
const comboVisible = ref(false)
const activeSkills = ref<{ name: string; pct: number; color: string }[]>([])
const activeSkills2 = ref<{ name: string; pct: number; color: string }[]>([])
const matterLoaded = ref(false)
const balanceEnabled = ref(true)
const splitMode = ref<'auto' | 'vertical' | 'horizontal'>('auto')
const cfg: GameConfig = DEFAULT_CONFIG

const { width: winW, height: winH } = useWindowSize()
const audio = useAudio()

// We will store the cleanup function
let cleanupGame: (() => void) | null = null

const SKINS = [
  { body: '#3498db', cap: '#2980b9', glow: 'rgba(52,152,219,0.4)' },
  { body: '#e74c3c', cap: '#c0392b', glow: 'rgba(231,76,60,0.4)' },
  { body: '#2ecc71', cap: '#27ae60', glow: 'rgba(46,204,113,0.4)' },
  { body: '#f1c40f', cap: '#f39c12', glow: 'rgba(241,196,15,0.4)' },
  { body: '#9b59b6', cap: '#8e44ad', glow: 'rgba(155,89,182,0.4)' },
  { body: '#FF6B4A', cap: '#e05a3a', glow: 'rgba(255,107,74,0.4)' },
]

function selectSkin(idx: number) {
  selectedSkinIndex.value = idx
}

function setDiff(level: number) {
  difficultyLevel.value = level
}

const diffDescs = ['Thử thách thực sự cho Pro.', 'Cân bằng chuẩn.', 'Hỗ trợ tối đa. Item x3.']

function loadMatterJS(): Promise<void> {
  if (matterLoaded.value) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = MATTER_CDN
    s.onload = () => {
      matterLoaded.value = true
      resolve()
    }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function startGame(mode: number) {
  await loadMatterJS()
  menuVisible.value = false
  p2Visible.value = mode === 2
  comboCount.value = 0
  comboVisible.value = false
  if (cleanupGame) cleanupGame()
  cleanupGame = initGame(mode)
}

function showMsg(text: string, color: string) {
  gameMessage.value = text
  gameMessageColor.value = color
  gameMessageVisible.value = true
  setTimeout(() => {
    gameMessageVisible.value = false
  }, 1500)
}

function showBiome(name: string) {
  biomeText.value = `ZONE: ${name}`
  biomeVisible.value = true
  setTimeout(() => {
    biomeVisible.value = false
  }, 2000)
}

function showCombo(count: number) {
  comboCount.value = count
  comboVisible.value = true
  setTimeout(() => {
    comboVisible.value = false
  }, 1200)
}

/* ───────────── GAME ENGINE ───────────── */

function initGame(gameMode: number): () => void {
  const M: MatterAPI = getMatter()
  const { Engine, Bodies, Body, Composite, Events, Vector } = M

  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  canvas.width = winW.value
  canvas.height = winH.value

  const engine = Engine.create()
  const world = engine.world

  const FINISH_LINE_X = cfg.finishLineX
  const SKILL_DURATION = cfg.skillDuration
  function dc(): DifficultyConfig {
    return cfg.difficulty[difficultyLevel.value as 0 | 1 | 2]
  }

  const BIOMES = {
    HOUSE: {
      name: 'NHÀ Ở',
      gravity: 1.2,
      friction: 1.0,
      restitution: 0.0,
      platColor: '#27ae60',
      bgTop: '#2c3e50',
      bgBot: '#4ca1af',
      starCount: 0,
      hillColors: ['rgba(30,50,60,0.5)', 'rgba(40,65,75,0.35)', 'rgba(50,80,90,0.2)'],
    },
    SPACE: {
      name: 'VŨ TRỤ',
      gravity: 0.5,
      friction: 0.8,
      restitution: 0.15,
      platColor: '#7f8c8d',
      bgTop: '#0a0a2e',
      bgBot: '#1a1a4e',
      starCount: 80,
      hillColors: ['rgba(10,10,50,0.6)', 'rgba(15,15,60,0.4)', 'rgba(20,20,70,0.25)'],
    },
    ICE: {
      name: 'BĂNG GIÁ',
      gravity: 1.2,
      friction: 0.3,
      restitution: 0.05,
      platColor: '#a8dadc',
      bgTop: '#83a4d4',
      bgBot: '#b6fbff',
      starCount: 0,
      hillColors: ['rgba(100,140,170,0.45)', 'rgba(120,160,190,0.3)', 'rgba(140,180,210,0.18)'],
    },
    BOUNCY: {
      name: 'KẸO DẺO',
      gravity: 1.2,
      friction: 0.8,
      restitution: 0.8,
      platColor: '#fd79a8',
      bgTop: '#ff9a9e',
      bgBot: '#fecfef',
      starCount: 0,
      hillColors: ['rgba(200,100,130,0.45)', 'rgba(210,120,150,0.3)', 'rgba(220,140,170,0.18)'],
    },
  }

  type BiomeKey = keyof typeof BIOMES
  type Biome = (typeof BIOMES)[BiomeKey]

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    type: string
    size?: number
    shape?: 'square' | 'triangle' | 'circle'
    rotation?: number
    rotSpeed?: number
  }
  interface TextFX {
    x: number
    y: number
    text: string
    color: string
    life: number
    vy: number
    scale: number
  }
  interface ItemObj {
    body: MatterBody
    type: string
    removed: boolean
  }
  interface Star {
    x: number
    y: number
    r: number
    speed: number
  }

  const particles: Particle[] = []
  const items: ItemObj[] = []
  const platforms: MatterBody[] = []
  const movingPlatforms: MatterBody[] = []
  const obstacles: MatterBody[] = []
  const textEffects: TextFX[] = []
  const projectiles: MatterBody[] = []
  const bananas: MatterBody[] = []
  const portals: MatterBody[] = []
  const blackholes: MatterBody[] = []
  const glasses: MatterBody[] = []
  const camera1 = { x: 0, y: 0 }
  const camera2 = { x: 0, y: 0 }
  let shake = 0
  let lastGeneratedX = 200
  let winner: number | null = null
  let currentBiome: Biome = BIOMES.HOUSE
  let globalGravityTimer = 0
  let animId = 0
  let running = true

  // Parallax stars
  let stars: Star[] = []
  function generateStars(count: number) {
    stars = []
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * 3000,
        y: Math.random() * winH.value,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
      })
    }
  }

  const keys: Record<string, boolean> = {}
  let mousePressed = false
  // Per-player touch state for 2P mobile: left half = P1, right half = P2
  let touchP1 = false
  let touchP2 = false

  function onKeyDown(e: KeyboardEvent) {
    keys[e.code] = true
  }
  function onKeyUp(e: KeyboardEvent) {
    keys[e.code] = false
  }
  function onMouseDown() {
    mousePressed = true
  }
  function onMouseUp() {
    mousePressed = false
  }
  function updateTouchState(e: TouchEvent) {
    e.preventDefault()
    touchP1 = false
    touchP2 = false
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i]!
      if (gameMode === 2) {
        // 2P touch: split based on current split mode
        const useVertical =
          splitMode.value === 'vertical' || (splitMode.value === 'auto' && canvas.width < 768)
        if (useVertical) {
          if (t.clientY < canvas.height / 2) touchP1 = true
          else touchP2 = true
        } else {
          if (t.clientX < canvas.width / 2) touchP1 = true
          else touchP2 = true
        }
      } else {
        // 1P: any touch = P1
        touchP1 = true
      }
    }
    mousePressed = touchP1
  }
  function onTouchStart(e: TouchEvent) {
    updateTouchState(e)
  }
  function onTouchEnd(e: TouchEvent) {
    updateTouchState(e)
  }
  function onResize() {
    canvas.width = winW.value
    canvas.height = winH.value
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd, { passive: false })
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })
  window.addEventListener('resize', onResize)

  // ─── Player ───
  class Player {
    id: number
    skin: (typeof SKINS)[0]
    keyCodes: string[]
    isCharging = false
    chargeStartTime = 0
    chargeLevel = 0
    hasLanded = true
    lastStablePos: { x: number; y: number }
    checkpointHistory: { x: number; y: number }[]
    respawnTimer: ReturnType<typeof setTimeout> | null = null
    canAirDash = false
    airDashCooldown = 0
    deathsAtCheckpoint = 0
    frozenTimer = 0
    blindTimer = 0
    idleTimer = 0
    slipTimer = 0
    drunkTimer = 0
    trail: { x: number; y: number; alpha: number }[] = []
    jetpackTimer = 0
    giantTimer = 0
    shieldTimer = 0
    hasSuperJump = false
    body!: MatterBody
    combo = 0
    wasPressedLastFrame = false

    constructor(id: number, x: number, y: number, skin: (typeof SKINS)[0], keyCodes: string[]) {
      this.id = id
      this.skin = skin
      this.keyCodes = keyCodes
      this.lastStablePos = { x, y }
      this.checkpointHistory = [{ x, y }]
      this.createBottle(x, y, 1.0)
    }

    createBottle(x: number, y: number, scale: number) {
      if (this.body) Composite.remove(world, this.body)
      const w = 25 * scale
      const h = 60 * scale
      const capW = 15 * scale
      const capH = 10 * scale
      const bottomDensity = dc().bottomDensity

      const heavyBottom = Bodies.rectangle(x, y + h / 2 - 5 * scale, w, 12 * scale, {
        density: bottomDensity,
        render: { visible: false },
      })
      const mainBody = Bodies.rectangle(x, y, w, h, {
        render: { fillStyle: this.skin.body },
      })
      const cap = Bodies.rectangle(x, y - h / 2 - capH / 2, capW, capH, {
        render: { fillStyle: this.skin.cap },
      })

      const fAir = dc().frictionAir

      this.body = Body.create({
        parts: [mainBody, cap, heavyBottom],
        friction: cfg.bodyFriction,
        restitution: 0.0,
        frictionAir: fAir,
        label: 'player',
      })
      ;(this.body as Record<string, unknown>).playerRef = this
      Composite.add(world, this.body)
    }

    respawn() {
      if (this.respawnTimer) clearTimeout(this.respawnTimer)
      this.respawnTimer = null
      this.deathsAtCheckpoint++

      // If dying 3+ times at same checkpoint, fall back to an earlier one
      if (this.deathsAtCheckpoint >= 3 && this.checkpointHistory.length > 1) {
        this.checkpointHistory.pop()
        const prev = this.checkpointHistory[this.checkpointHistory.length - 1]!
        this.lastStablePos = { ...prev }
        this.deathsAtCheckpoint = 0
        showMsg('CHECKPOINT LÙI!', '#e67e22')
      }

      createConfetti(this.body.position.x, this.body.position.y)
      Body.setPosition(this.body, { x: this.lastStablePos.x, y: this.lastStablePos.y - 150 })
      Body.setVelocity(this.body, { x: 0, y: 0 })
      Body.setAngularVelocity(this.body, 0)
      Body.setAngle(this.body, 0)
      this.hasLanded = true
      this.isCharging = false
      this.frozenTimer = 0
      this.blindTimer = 0
      this.slipTimer = 0
      this.drunkTimer = 0
      this.combo = 0
      audio.fail()
      if (this.deathsAtCheckpoint < 3) showMsg('THỬ LẠI!', '#bdc3c7')
    }

    rewindRespawn() {
      const idx = Math.max(0, this.checkpointHistory.length - 3)
      const target = this.checkpointHistory[idx]!
      this.lastStablePos = { ...target }
      this.checkpointHistory = this.checkpointHistory.slice(0, idx + 1)
      Body.setPosition(this.body, { x: target.x, y: target.y - 150 })
      Body.setVelocity(this.body, { x: 0, y: 0 })
      Body.setAngularVelocity(this.body, 0)
      Body.setAngle(this.body, 0)
      this.frozenTimer = 60
      createExplosion(target.x, target.y, '#e84393')
      audio.explosion()
      showMsg('BỊ BẮN LÙI!', '#e84393')
    }

    updateInput() {
      if (this.body.speed > 5) {
        this.trail.push({ x: this.body.position.x, y: this.body.position.y, alpha: 1 })
        if (this.trail.length > 12) this.trail.shift()
      } else if (this.trail.length > 0) {
        this.trail.shift()
      }

      if (this.frozenTimer > 0) {
        this.frozenTimer--
        return
      }
      if (this.blindTimer > 0) this.blindTimer--
      if (this.drunkTimer > 0) this.drunkTimer--

      if (this.slipTimer > 0) {
        this.slipTimer--
        Body.setAngularVelocity(this.body, 0.3)
        return
      }

      if (Math.abs(this.body.velocity.x) < 0.1 && Math.abs(this.body.velocity.y) < 0.1) {
        this.idleTimer++
        if (this.idleTimer > 240) {
          this.idleTimer = 0
          spawnItemDrop(this.body.position.x + 120, this.body.position.y - 250)
          createTextEffect(
            this.body.position.x,
            this.body.position.y - 100,
            'GIAO HÀNG!',
            '#f1c40f',
          )
        }
      } else {
        this.idleTimer = 0
      }

      let isPressed = false
      // 1P: mouse/touch controls P1
      if (this.id === 1 && gameMode === 1 && mousePressed) isPressed = true
      // 2P: split touch zones (left=P1, right=P2) + keyboard
      if (gameMode === 2 && this.id === 1 && touchP1) isPressed = true
      if (gameMode === 2 && this.id === 2 && touchP2) isPressed = true
      for (const code of this.keyCodes) if (keys[code]) isPressed = true

      if (isPressed) {
        if (this.hasLanded && this.jetpackTimer > 0) {
          // Jetpack active on ground: auto-launch upward
          this.hasLanded = false
          this.isCharging = false
          const yDir = globalGravityTimer > 0 ? 0.3 : -0.3
          Body.applyForce(this.body, this.body.position, { x: 0.05, y: yDir })
          audio.jump(0.5)
        } else if (this.hasLanded) {
          if (!this.isCharging) {
            this.isCharging = true
            this.chargeStartTime = Date.now()
          }
          const duration = Date.now() - this.chargeStartTime
          const rate = this.drunkTimer > 0 ? Math.random() * 3 + 0.5 : 1.0
          this.chargeLevel = Math.min((duration / 500) * rate, 1.0)
        } else {
          if (this.jetpackTimer > 0) {
            const scale = this.giantTimer > 0 ? 2.5 : 1
            const upForce = globalGravityTimer > 0 ? 0.035 : -0.035
            Body.applyForce(this.body, this.body.position, {
              x: 0.01 * scale,
              y: upForce * scale,
            })
            // Stabilize angle while jetpacking
            const angleDiff = this.body.angle % (Math.PI * 2)
            Body.setAngularVelocity(this.body, this.body.angularVelocity * 0.9 - angleDiff * 0.02)
            if (Math.random() > 0.3) createParticle(this.body.position.x, this.body.position.y)
          } else if (this.canAirDash && this.airDashCooldown <= 0 && !this.wasPressedLastFrame) {
            // Double jump: tap while airborne (new press required)
            const scale = this.giantTimer > 0 ? 3 : 1
            const yForce = globalGravityTimer > 0 ? 0.25 : -0.25
            Body.applyForce(this.body, this.body.position, {
              x: 0.2 * scale,
              y: yForce * scale,
            })
            Body.setAngularVelocity(this.body, this.body.angularVelocity + 0.15)
            createExplosion(this.body.position.x, this.body.position.y, '#fff')
            createTextEffect(
              this.body.position.x,
              this.body.position.y - 60,
              'DOUBLE JUMP!',
              '#3498db',
            )
            audio.jump(0.8)
            this.canAirDash = false
          }
        }
      } else {
        if (this.isCharging && this.hasLanded) {
          this.jump()
        }
        // Reset air dash cooldown faster when not pressing (so next tap triggers it)
        if (this.airDashCooldown > 0) this.airDashCooldown = 0
      }
      this.wasPressedLastFrame = isPressed
    }

    jump() {
      this.hasLanded = false
      this.isCharging = false
      this.canAirDash = true
      this.airDashCooldown = 10 // 10 frames grace before air dash is available

      let forceBase = dc().forceBase
      let forceAdd = dc().forceAdd
      if (this.giantTimer > 0) {
        forceBase *= cfg.giantForceMult
        forceAdd *= cfg.giantForceMult
      }
      if (this.hasSuperJump) {
        forceBase *= cfg.superJumpMult
        forceAdd *= cfg.superJumpMult
        this.hasSuperJump = false
        createExplosion(this.body.position.x, this.body.position.y, '#3498db')
      }

      let actualCharge = this.chargeLevel
      if (this.drunkTimer > 0) actualCharge = Math.random()

      const power = forceBase + actualCharge * forceAdd
      const yDir = globalGravityTimer > 0 ? 1.6 : -1.6
      let xDir = 0.75
      if (this.drunkTimer > 0) xDir = 0.75 + (Math.random() - 0.5)

      Body.applyForce(this.body, this.body.position, { x: power * xDir, y: power * yDir })
      const spinSpeed = (cfg.spinBase + actualCharge * cfg.spinCharge) * dc().spinMult
      Body.setAngularVelocity(this.body, spinSpeed)
      this.chargeLevel = 0
      audio.jump(actualCharge)
    }

    checkState() {
      if (this.airDashCooldown > 0) this.airDashCooldown--
      if (this.jetpackTimer > 0) this.jetpackTimer -= 0.8
      if (this.shieldTimer > 0) this.shieldTimer--
      if (this.giantTimer > 0) {
        this.giantTimer--
        if (this.giantTimer === 0) {
          const pos = { ...this.body.position }
          const vel = { ...this.body.velocity }
          const ang = this.body.angle
          this.createBottle(pos.x, pos.y, 1.0)
          Body.setVelocity(this.body, vel)
          Body.setAngle(this.body, ang)
          createExplosion(pos.x, pos.y, '#2ecc71')
        }
      }

      // Banana check
      for (let i = bananas.length - 1; i >= 0; i--) {
        const b = bananas[i]!
        if (M.Bounds.overlaps(this.body.bounds, b.bounds)) {
          this.slipTimer = 120
          createTextEffect(this.body.position.x, this.body.position.y - 50, 'TRƯỢT!', '#f1c40f')
          audio.slide()
          Composite.remove(world, b)
          bananas.splice(i, 1)
        }
      }

      // Glass platform check
      for (let i = glasses.length - 1; i >= 0; i--) {
        const g = glasses[i]! as MatterBody & { hp: number; startPos: { x: number; y: number } }
        if (M.Bounds.overlaps(this.body.bounds, g.bounds) && this.body.velocity.y >= 0) {
          g.hp--
          if (g.hp <= 0) {
            createExplosion(g.position.x, g.position.y, '#a8dadc')
            createTextEffect(g.position.x, g.position.y, 'CRACK!', '#a8dadc')
            Composite.remove(world, g)
            glasses.splice(i, 1)
          } else {
            Body.setPosition(g, {
              x: g.startPos.x + (Math.random() - 0.5) * 2,
              y: g.startPos.y,
            })
          }
        }
      }

      // Item collection
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i]!
        if (item.removed) continue
        const hitDist = this.giantTimer > 0 ? 80 : 50
        if (Vector.magnitude(Vector.sub(this.body.position, item.body.position)) < hitDist) {
          applyItem(this, item)
          Composite.remove(world, item.body)
          item.removed = true
          createConfetti(item.body.position.x, item.body.position.y)
          audio.collectItem()
        }
      }

      // Finish line check (2P)
      if (gameMode === 2 && this.body.position.x > FINISH_LINE_X && !winner) {
        winner = this.id
        showMsg(`PLAYER ${this.id} THẮNG!`, '#f1c40f')
        createExplosion(this.body.position.x, this.body.position.y, '#f1c40f')
        audio.win()
        setTimeout(() => {
          menuVisible.value = true
          running = false
        }, 3000)
      }

      const speed = this.body.speed
      const angularSpeed = Math.abs(this.body.angularVelocity)

      if (speed < 0.15 && angularSpeed < 0.15 && this.slipTimer <= 0) {
        let angle = this.body.angle % (Math.PI * 2)
        if (angle < 0) angle += Math.PI * 2
        const tolerance = this.giantTimer > 0 ? dc().uprightToleranceGiant : dc().uprightTolerance

        const isUpright = angle < tolerance || angle > Math.PI * 2 - tolerance

        if (!this.hasLanded) {
          if (isUpright) {
            this.hasLanded = true
            if (
              this.body.position.y < 1200 &&
              this.body.position.y > -1000 &&
              isOnSolidGround(this.body.position)
            ) {
              this.lastStablePos = { ...this.body.position }
              this.deathsAtCheckpoint = 0
              const last = this.checkpointHistory[this.checkpointHistory.length - 1]!
              if (Vector.magnitude(Vector.sub(last, this.body.position)) > 200) {
                this.checkpointHistory.push({ ...this.body.position })
              }
            }
            this.combo++
            if (this.combo > 1) {
              audio.landCombo(this.combo)
              showCombo(this.combo)
              createTextEffect(
                this.body.position.x,
                this.body.position.y - 80,
                `x${this.combo} COMBO!`,
                comboColor(this.combo),
              )
            } else {
              audio.land()
            }
            createConfetti(this.body.position.x, this.body.position.y)
          } else {
            if (this.shieldTimer > 0) {
              this.shieldTimer = 0
              showMsg('KHIÊN!', '#8e44ad')
              Body.setVelocity(this.body, { x: 0, y: -5 })
              Body.setAngularVelocity(this.body, 0)
              Body.setAngle(this.body, 0)
              createExplosion(this.body.position.x, this.body.position.y, '#8e44ad')
            } else {
              this.combo = 0
              if (!this.respawnTimer)
                this.respawnTimer = setTimeout(() => this.respawn(), cfg.respawnDelay)
            }
          }
        } else if (!isUpright && !this.respawnTimer) {
          this.combo = 0
          this.respawnTimer = setTimeout(() => this.respawn(), cfg.respawnDelay)
        }
      }

      if (this.body.position.y > 1500) {
        this.combo = 0
        this.respawn()
        shake = 5
      }

      // Auto-stabilize: apply corrective torque to help bottle land upright
      if (
        balanceEnabled.value &&
        !this.hasLanded &&
        this.slipTimer === 0 &&
        globalGravityTimer === 0
      ) {
        const d = dc()
        if (d.skipStabilizeAboveSpeed3 && speed > 3.0) return
        let angle = this.body.angle % (Math.PI * 2)
        if (angle < 0) angle += Math.PI * 2

        const isSlowing = speed < cfg.stabilizeSpeedMax
        const isFlying = speed >= cfg.stabilizeSpeedMax && speed < cfg.flyingSpeedMax

        if (isSlowing) {
          const baseTorque = this.giantTimer > 0 ? d.landTorqueGiant : d.landTorque

          if (angle < d.landThresh || angle > Math.PI * 2 - d.landThresh) {
            let torque = angle > Math.PI ? baseTorque : -baseTorque
            if (angle < 0.05 || angle > Math.PI * 2 - 0.05) torque = 0
            const damping = speed < 2.0 ? d.landDampingSlow : d.landDampingFast
            Body.setAngularVelocity(this.body, this.body.angularVelocity * damping + torque)
          }
        } else if (isFlying && d.airCorrectionEnabled && speed < d.airCorrectionMaxSpeed) {
          let airTorque = d.airTorque
          if (this.giantTimer > 0) airTorque *= 2

          if (angle < d.airThresh || angle > Math.PI * 2 - d.airThresh) {
            let torque = angle > Math.PI ? airTorque : -airTorque
            if (angle < 0.1 || angle > Math.PI * 2 - 0.1) torque = 0
            Body.setAngularVelocity(this.body, this.body.angularVelocity * d.airDamping + torque)
          }
        }
      }
    }
  }

  function comboColor(c: number): string {
    if (c >= 5) return '#f1c40f'
    if (c >= 3) return '#e67e22'
    return '#2ecc71'
  }

  /** Check if a position has a solid static platform below it (within range) */
  function isOnSolidGround(pos: { x: number; y: number }): boolean {
    const checkRange = 80
    for (const p of platforms) {
      const pw = (p as Record<string, unknown>).w as number
      if (
        !(p as Record<string, unknown>).isTrampoline &&
        Math.abs(pos.x - p.position.x) < pw / 2 + 20 &&
        pos.y < p.position.y + checkRange &&
        pos.y > p.position.y - checkRange
      ) {
        return true
      }
    }
    return false
  }

  const players: Player[] = []

  function shootRewindBullet(shooter: Player, target: Player) {
    const p = Bodies.circle(shooter.body.position.x, shooter.body.position.y - 20, 10, {
      render: { fillStyle: '#e84393' },
      isSensor: true,
      label: 'bullet',
    })
    ;(p as Record<string, unknown>).targetId = target.id
    ;(p as Record<string, unknown>).life = 100
    const force = Vector.normalise(Vector.sub(target.body.position, shooter.body.position))
    Composite.add(world, p)
    projectiles.push(p)
    Body.setVelocity(p, { x: force.x * 25, y: force.y * 25 })
  }

  function applyItem(player: Player, item: ItemObj) {
    const texts: Record<string, string> = {
      jump: 'POWER!',
      jetpack: 'JETPACK!',
      shield: 'KHIÊN!',
      giant: 'KHỔNG LỒ!',
      swap: 'HOÁN ĐỔI!',
      blind: 'MÙ!',
      bomb: 'BOOM!',
      freeze: 'BĂNG!',
      rewind: 'SÚNG HỒI QUY!',
      gravity: 'ĐẢO TRỌNG LỰC!',
      drunk: 'SAY RƯỢU!',
    }

    if (item.type === 'jump') player.hasSuperJump = true
    else if (item.type === 'jetpack') player.jetpackTimer = 300
    else if (item.type === 'shield') player.shieldTimer = SKILL_DURATION
    else if (item.type === 'giant') {
      if (player.giantTimer === 0) {
        player.giantTimer = SKILL_DURATION
        const pos = { ...player.body.position }
        const vel = { ...player.body.velocity }
        player.createBottle(pos.x, pos.y, 2.0)
        Body.setVelocity(player.body, vel)
      } else player.giantTimer = SKILL_DURATION
    } else if (item.type === 'gravity') {
      globalGravityTimer = 300
      engine.gravity.y = -currentBiome.gravity
      showMsg('TRỌNG LỰC ĐẢO!', '#8e44ad')
      audio.explosion()
      return
    } else if (item.type === 'drunk') {
      player.drunkTimer = 300
    } else if (item.type === 'rewind') {
      const other = players.find((p) => p.id !== player.id)
      if (other) shootRewindBullet(player, other)
    } else if (item.type === 'swap') {
      const other = players.find((p) => p.id !== player.id)
      if (other) {
        const tempPos = { ...player.body.position }
        const tempVel = { ...player.body.velocity }
        Body.setPosition(player.body, other.body.position)
        Body.setVelocity(player.body, other.body.velocity)
        Body.setPosition(other.body, tempPos)
        Body.setVelocity(other.body, tempVel)
        createExplosion(player.body.position.x, player.body.position.y, '#ff7675')
        audio.warp()
      }
    } else if (item.type === 'blind') {
      const other = players.find((p) => p.id !== player.id)
      if (other) other.blindTimer = 180
    } else if (item.type === 'bomb') {
      const other = players.find((p) => p.id !== player.id)
      if (other) {
        Body.applyForce(other.body, other.body.position, { x: -0.1, y: -0.2 })
        createExplosion(other.body.position.x, other.body.position.y, '#2c3e50')
        audio.explosion()
      }
    } else if (item.type === 'freeze') {
      const other = players.find((p) => p.id !== player.id)
      if (other) {
        other.frozenTimer = 180
        Body.setVelocity(other.body, { x: 0, y: 0 })
      }
    }

    showMsg(texts[item.type] ?? 'ITEM!', '#fff')
  }

  // ─── World Creation ───
  function changeBiome(biome: Biome) {
    currentBiome = biome
    if (globalGravityTimer === 0) engine.gravity.y = biome.gravity
    generateStars(biome.starCount)
    showBiome(biome.name)
    audio.biomeChange()
  }

  function createPlatform(x: number, y: number, w: number, h: number) {
    const body = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      friction: currentBiome.friction,
      restitution: currentBiome.restitution,
      render: { fillStyle: currentBiome.platColor },
      chamfer: { radius: 8 },
    })
    ;(body as Record<string, unknown>).w = w
    ;(body as Record<string, unknown>).h = h
    Composite.add(world, body)
    platforms.push(body)
    return body
  }

  function createMovingPlatform(x: number, y: number) {
    const w = 150
    const h = 20
    const body = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      friction: 1.0,
      render: { fillStyle: '#e67e22' },
      chamfer: { radius: 8 },
    })
    ;(body as Record<string, unknown>).w = w
    ;(body as Record<string, unknown>).h = h
    ;(body as Record<string, unknown>).startPos = { x, y }
    ;(body as Record<string, unknown>).moveSpeed = 0.03 + Math.random() * 0.02
    ;(body as Record<string, unknown>).moveRange = 100
    ;(body as Record<string, unknown>).offset = Math.random() * 100
    Composite.add(world, body)
    movingPlatforms.push(body)
    return body
  }

  function createTrampoline(x: number, y: number) {
    const body = Bodies.rectangle(x, y, 120, 20, {
      isStatic: true,
      render: { fillStyle: '#e74c3c' },
      restitution: 1.6,
      chamfer: { radius: 8 },
    })
    ;(body as Record<string, unknown>).w = 120
    ;(body as Record<string, unknown>).h = 20
    ;(body as Record<string, unknown>).isTrampoline = true
    Composite.add(world, body)
    platforms.push(body)
    return body
  }

  // Spinner removed — was too disruptive

  function createGlassPlatform(x: number, y: number) {
    const glass = Bodies.rectangle(x, y, 120, 20, {
      isStatic: true,
      render: { fillStyle: 'rgba(200, 240, 255, 0.4)' },
      friction: 0.1,
    })
    ;(glass as Record<string, unknown>).hp = 60
    ;(glass as Record<string, unknown>).startPos = { x, y }
    Composite.add(world, glass)
    glasses.push(glass)
  }

  function createPortalPair(x: number, y: number) {
    const inP = Bodies.circle(x, y - 50, 30, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: '#00cec9' },
    })
    ;(inP as Record<string, unknown>).isPortal = true
    const outP = Bodies.circle(x + 400 + Math.random() * 200, y - 100 - Math.random() * 100, 30, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: '#e67e22' },
    })
    ;(outP as Record<string, unknown>).isPortal = true
    ;(inP as Record<string, unknown>).target = outP
    ;(outP as Record<string, unknown>).target = inP
    Composite.add(world, [inP, outP])
    portals.push(inP, outP)
  }

  function createBlackHole(x: number, y: number) {
    const bh = Bodies.circle(x, y - 150, 20, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: '#2d3436' },
    })
    ;(bh as Record<string, unknown>).isBlackHole = true
    Composite.add(world, bh)
    blackholes.push(bh)
  }

  function createBanana(x: number, y: number) {
    const banana = Bodies.circle(x, y, 12, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: '#f1c40f' },
    })
    Composite.add(world, banana)
    bananas.push(banana)
  }

  function createItem(x: number, y: number, type: string) {
    const colorMap: Record<string, string> = {
      jump: '#3498db',
      jetpack: '#e67e22',
      shield: '#8e44ad',
      giant: '#27ae60',
      bomb: '#2c3e50',
      freeze: '#00cec9',
      swap: '#ff7675',
      blind: '#b2bec3',
      rewind: '#e84393',
      gravity: '#8e44ad',
      drunk: '#e17055',
    }
    const color = colorMap[type] ?? '#3498db'
    const item = Bodies.polygon(x, y, 3, 22, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: color },
    })
    const obj: ItemObj = { body: item, type, removed: false }
    Composite.add(world, item)
    items.push(obj)
    return obj
  }

  function createFinishLine(x: number, y: number) {
    const pole = Bodies.rectangle(x, y - 100, 10, 200, {
      isStatic: true,
      render: { fillStyle: '#fff' },
    })
    const flag = Bodies.rectangle(x + 40, y - 180, 80, 40, {
      isStatic: true,
      render: { fillStyle: '#f1c40f' },
    })
    ;(pole as Record<string, unknown>).w = 10
    ;(pole as Record<string, unknown>).h = 200
    ;(flag as Record<string, unknown>).w = 80
    ;(flag as Record<string, unknown>).h = 40
    platforms.push(pole, flag)
    Composite.add(world, [pole, flag])
  }

  function spawnItemDrop(x: number, y: number) {
    const ir = Math.random()
    let type = 'jump'
    if (ir > 0.3) type = 'shield'
    if (ir > 0.5) type = 'giant'
    if (ir > 0.7) type = 'jetpack'
    if (ir > 0.85) type = 'gravity'
    if (ir > 0.95) type = 'drunk'

    if (gameMode === 2 && ir > 0.8) {
      const r = Math.random()
      if (r < 0.25) type = 'bomb'
      else if (r < 0.5) type = 'rewind'
      else type = 'swap'
    }
    createItem(x, y, type)
  }

  function spawnAirplane() {
    const y = cfg.planeMinY + Math.random() * 250
    const pX = players[0]!.body.position.x
    const fromLeft = Math.random() > 0.5
    const x = fromLeft ? pX - 600 : pX + 1200
    const dir = fromLeft ? 1 : -1

    const body = Bodies.rectangle(x, y, 60, 20, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: '#ecf0f1' },
      chamfer: { radius: 5 },
    })
    ;(body as Record<string, unknown>).isObstacle = true
    ;(body as Record<string, unknown>).velocityVec = {
      x: dir * (cfg.planeSpeedMin + Math.random() * cfg.planeSpeedRand),
      y: 0,
    }
    Composite.add(world, body)
    obstacles.push(body)
  }

  function generateLevelChunk(count: number) {
    let cx = lastGeneratedX
    let cy = 500
    const biomeKeys = Object.keys(BIOMES) as BiomeKey[]
    const newBiomeKey = biomeKeys[Math.floor(Math.random() * biomeKeys.length)]!
    changeBiome(BIOMES[newBiomeKey])

    // Track whether last platform was fragile/hazard so we force a solid one next
    let lastWasFragile = false

    for (let i = 0; i < count; i++) {
      const gap = 130 + Math.random() * 80
      cx += gap
      cy = 450 + Math.random() * 150

      if (gameMode === 2 && cx > FINISH_LINE_X && cx < FINISH_LINE_X + 500) {
        createFinishLine(cx, cy)
        cx += 500
        lastWasFragile = false
      } else {
        const r = Math.random() * dc().obstacleRollMult

        let spawnItem = Math.random() > 0.3
        if (dc().alwaysSpawnItems) spawnItem = true

        // Force a solid platform after any fragile/hazard one
        if (lastWasFragile || r < 0.3) {
          createPlatform(cx, cy, 150 + Math.random() * 50, 20)
          lastWasFragile = false
        } else if (r < 0.45) {
          createMovingPlatform(cx, cy)
          lastWasFragile = false
        } else if (r < 0.55) {
          createTrampoline(cx, cy)
          lastWasFragile = false
        } else if (r < 0.65) {
          createPlatform(cx, cy, 130 + Math.random() * 40, 20)
          lastWasFragile = false
        } else if (r < 0.75) {
          // Glass platform: also place a small solid platform nearby as safety net
          createGlassPlatform(cx, cy)
          createPlatform(cx, cy + 80, 80, 15)
          lastWasFragile = false
        } else {
          createPlatform(cx, cy, 120, 20)
          spawnItem = true
          lastWasFragile = false
        }

        if (Math.random() > 0.85) createBanana(cx, cy - 20)
        if (Math.random() > 0.9) createPortalPair(cx, cy)
        if (Math.random() > 0.95) createBlackHole(cx, cy)

        if (spawnItem) {
          const ir = Math.random()
          let type = 'jump'
          if (ir > 0.3) type = 'shield'
          if (ir > 0.5) type = 'giant'
          if (ir > 0.7) type = 'jetpack'
          if (ir > 0.9) type = 'gravity'
          if (ir > 0.95) type = 'drunk'
          if (gameMode === 2 && ir > 0.6) {
            const pr = Math.random()
            if (pr < 0.2) type = 'bomb'
            else if (pr < 0.4) type = 'freeze'
            else if (pr < 0.6) type = 'swap'
            else if (pr < 0.8) type = 'rewind'
            else type = 'blind'
          }
          if (dc().safeItems && (type === 'bomb' || type === 'freeze')) type = 'shield'
          createItem(cx, cy - 60, type)
        }
      }
    }
    lastGeneratedX = cx
  }

  // ─── Particles & FX ───
  function createConfetti(x: number, y: number) {
    const shapes: ('square' | 'triangle' | 'circle')[] = ['square', 'triangle', 'circle']
    for (let i = 0; i < 18; i++)
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 1) * 14,
        life: 1.0,
        color: `hsl(${Math.random() * 360},90%,60%)`,
        type: 'c',
        size: 3 + Math.random() * 5,
        shape: shapes[Math.floor(Math.random() * 3)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
      })
  }
  function createParticle(x: number, y: number) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 5,
      life: 0.5,
      color: '#f39c12',
      type: 'f',
    })
  }
  function createExplosion(x: number, y: number, c: string) {
    for (let i = 0; i < 35; i++)
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 22,
        vy: (Math.random() - 0.5) * 22,
        life: 1.0,
        color: c,
        type: 'f',
        size: 2 + Math.random() * 6,
      })
    shake = 10
  }
  function createTextEffect(x: number, y: number, text: string, color: string) {
    textEffects.push({ x, y, text, color, life: 1.0, vy: -2.5, scale: 1.5 })
  }

  // ─── Collision events ───
  Events.on(
    engine,
    'collisionStart',
    (event: { pairs: { bodyA: MatterBody; bodyB: MatterBody }[] }) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA
        const bodyB = pair.bodyB

        // Bullet
        if (bodyA.label === 'bullet' || bodyB.label === 'bullet') {
          const bullet = bodyA.label === 'bullet' ? bodyA : bodyB
          const rawTarget = bodyA.label === 'bullet' ? bodyB : bodyA
          const target = ((rawTarget as Record<string, unknown>).parent as MatterBody) || rawTarget
          if (target.label === 'player') {
            const p = players.find(
              (pl) =>
                pl.body === target &&
                pl.id === (bullet as unknown as Record<string, number>).targetId,
            )
            if (p) {
              p.rewindRespawn()
              Composite.remove(world, bullet)
              const pIdx = projectiles.indexOf(bullet)
              if (pIdx > -1) projectiles.splice(pIdx, 1)
            }
          } else if (!target.isSensor) {
            createParticle(bullet.position.x, bullet.position.y)
            Composite.remove(world, bullet)
            const pIdx = projectiles.indexOf(bullet)
            if (pIdx > -1) projectiles.splice(pIdx, 1)
          }
        }

        // Portals
        if (
          (bodyA as Record<string, unknown>).isPortal ||
          (bodyB as Record<string, unknown>).isPortal
        ) {
          const portal = (bodyA as Record<string, unknown>).isPortal ? bodyA : bodyB
          const rawObj = (bodyA as Record<string, unknown>).isPortal ? bodyB : bodyA
          // Compound bodies: collision part may be a sub-part, resolve to parent
          const obj = ((rawObj as Record<string, unknown>).parent as MatterBody) || rawObj
          if (obj.label === 'player' && !(obj as Record<string, unknown>).justTeleported) {
            const targetPortal = (portal as Record<string, unknown>).target as MatterBody
            Body.setPosition(obj, targetPortal.position)
            Body.setVelocity(obj, { x: 10, y: -5 })
            ;(obj as Record<string, unknown>).justTeleported = true
            setTimeout(() => {
              ;(obj as Record<string, unknown>).justTeleported = false
            }, 1000)
            createExplosion(portal.position.x, portal.position.y, portal.render.fillStyle as string)
            createTextEffect(portal.position.x, portal.position.y - 50, 'WARP!', '#fff')
            audio.warp()
          }
        }

        // Impact Text
        const speedA = bodyA.speed || 0
        const speedB = bodyB.speed || 0
        if (speedA + speedB > 18) {
          const words = ['BONK!', 'OOF!', 'BAM!', 'POW!', 'YEET!']
          const word = words[Math.floor(Math.random() * words.length)]!
          createTextEffect(bodyA.position.x, bodyA.position.y, word, '#e74c3c')
        }
      })
    },
  )

  // ─── Draw ───
  function drawBackground(cx: number) {
    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, currentBiome.bgTop)
    grad.addColorStop(1, currentBiome.bgBot)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Stars parallax
    ctx.fillStyle = '#fff'
    for (const star of stars) {
      const sx = (((star.x - cx * star.speed) % canvas.width) + canvas.width) % canvas.width
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.003 + star.x) * 0.3
      ctx.beginPath()
      ctx.arc(sx, star.y, star.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Parallax mountain/hill silhouettes (3 layers)
    const hillSpeeds = [0.05, 0.1, 0.18]
    const hillBaseY = [canvas.height * 0.55, canvas.height * 0.65, canvas.height * 0.75]
    const hillAmplitudes = [80, 55, 35]
    const hillFreqs = [0.0015, 0.003, 0.005]
    const hillColors = currentBiome.hillColors
    for (let layer = 0; layer < 3; layer++) {
      const offset = cx * hillSpeeds[layer]!
      ctx.fillStyle = hillColors[layer]!
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)
      for (let x = 0; x <= canvas.width; x += 4) {
        const worldX = x + offset
        const freq = hillFreqs[layer]!
        const amp = hillAmplitudes[layer]!
        const base = hillBaseY[layer]!
        const y =
          base +
          Math.sin(worldX * freq) * amp +
          Math.sin(worldX * freq * 2.3 + 1.5) * amp * 0.4 +
          Math.sin(worldX * freq * 0.7 + 3.0) * amp * 0.6
        ctx.lineTo(x, y)
      }
      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      ctx.fill()
    }

    // Ground hint line
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let y = 200; y < canvas.height; y += 80) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  function drawWorld(camX: number, camY: number, isBlind: boolean) {
    if (isBlind) {
      ctx.fillStyle = 'rgba(0,0,0,0.95)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 40px "Be Vietnam Pro", Arial'
      ctx.textAlign = 'center'
      ctx.fillText('ĐANG MÙ', canvas.width / 4, canvas.height / 2)
      return
    }

    ctx.save()
    ctx.translate(-camX, -camY)

    if (gameMode === 2) {
      // Checkered flag pattern
      const flagW = 100
      const flagH = 60
      const flagX = FINISH_LINE_X - flagW / 2
      const flagY = 170
      const cellSize = 10
      for (let row = 0; row < Math.ceil(flagH / cellSize); row++) {
        for (let col = 0; col < Math.ceil(flagW / cellSize); col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#111'
          ctx.fillRect(flagX + col * cellSize, flagY + row * cellSize, cellSize, cellSize)
        }
      }
      ctx.strokeStyle = '#f1c40f'
      ctx.lineWidth = 3
      ctx.strokeRect(flagX, flagY, flagW, flagH)
      ctx.fillStyle = '#f1c40f'
      ctx.font = 'bold 24px "Be Vietnam Pro", Arial'
      ctx.textAlign = 'center'
      ctx.fillText('FINISH', FINISH_LINE_X, flagY - 10)
    }

    const time = Date.now()

    // Portals with glow
    portals.forEach((p) => {
      const radius = 35 + Math.sin(time * 0.005) * 5
      ctx.save()
      ctx.shadowColor = p.render.fillStyle as string
      ctx.shadowBlur = 25
      ctx.beginPath()
      ctx.arc(p.position.x, p.position.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = p.render.fillStyle as string
      ctx.globalAlpha = 0.6
      ctx.fill()
      ctx.restore()
      // Inner spiral
      ctx.save()
      ctx.translate(p.position.x, p.position.y)
      ctx.rotate(time * 0.005)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let a = 0; a < Math.PI * 4; a += 0.2) {
        const r = a * 3
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      ctx.stroke()
      ctx.restore()
    })

    // Black Holes with aura
    blackholes.forEach((bh) => {
      // Outer ring
      for (let r = 60; r > 20; r -= 10) {
        ctx.beginPath()
        ctx.arc(bh.position.x, bh.position.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(108, 92, 231, ${0.1 + (60 - r) / 100})`
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(bh.position.x, bh.position.y, 20, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()
      ctx.strokeStyle = '#6c5ce7'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Platforms with shadow + texture
    platforms.forEach((p) => {
      const pos = p.position
      const pw = (p as Record<string, unknown>).w as number
      const ph = (p as Record<string, unknown>).h as number
      ctx.save()
      ctx.translate(pos.x, pos.y)
      ctx.rotate(p.angle)
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.roundRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph, 8)
      ctx.fill()
      // Body
      ctx.fillStyle = p.render.fillStyle as string
      ctx.beginPath()
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8)
      ctx.fill()
      // Diagonal stripe texture
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8)
      ctx.clip()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 2
      for (let d = -pw; d < pw + ph; d += 8) {
        ctx.beginPath()
        ctx.moveTo(-pw / 2 + d, -ph / 2)
        ctx.lineTo(-pw / 2 + d - ph, ph / 2)
        ctx.stroke()
      }
      ctx.restore()
      // Bottom edge shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.beginPath()
      ctx.roundRect(-pw / 2, ph / 2 - 4, pw, 4, [0, 0, 8, 8])
      ctx.fill()
      // Highlight gradient on top
      const hlGrad = ctx.createLinearGradient(0, -ph / 2, 0, -ph / 2 + 6)
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.25)')
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = hlGrad
      ctx.beginPath()
      ctx.roundRect(-pw / 2 + 2, -ph / 2 + 1, pw - 4, 6, [8, 8, 0, 0])
      ctx.fill()
      if ((p as Record<string, unknown>).isTrampoline) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        for (let xi = -pw / 2 + 10; xi < pw / 2 - 10; xi += 15) {
          ctx.beginPath()
          ctx.moveTo(xi, -3)
          ctx.lineTo(xi + 7, 3)
          ctx.lineTo(xi + 14, -3)
          ctx.strokeStyle = 'rgba(255,255,255,0.4)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
      ctx.restore()
    })

    // Moving platforms with glow + bobbing arrows
    movingPlatforms.forEach((p) => {
      const pos = p.position
      const pw = (p as Record<string, unknown>).w as number
      const ph = (p as Record<string, unknown>).h as number
      const glowPulse = 0.3 + Math.sin(time * 0.006) * 0.15
      ctx.save()
      ctx.translate(pos.x, pos.y)
      // Glow aura
      ctx.shadowColor = '#e67e22'
      ctx.shadowBlur = 12 + Math.sin(time * 0.008) * 6
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.roundRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph, 8)
      ctx.fill()
      ctx.fillStyle = '#e67e22'
      ctx.beginPath()
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8)
      ctx.fill()
      ctx.shadowBlur = 0
      // Glow overlay
      ctx.fillStyle = `rgba(255,200,100,${glowPulse})`
      ctx.beginPath()
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8)
      ctx.fill()
      // Bobbing arrows
      const arrowBob = Math.sin(time * 0.008) * 3
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.moveTo(-12 - arrowBob, 0)
      ctx.lineTo(-4 - arrowBob, -6)
      ctx.lineTo(-4 - arrowBob, 6)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(12 + arrowBob, 0)
      ctx.lineTo(4 + arrowBob, -6)
      ctx.lineTo(4 + arrowBob, 6)
      ctx.fill()
      ctx.restore()
    })

    // Glass Platforms with shimmer + branching cracks
    glasses.forEach((g) => {
      const gg = g as MatterBody & { hp: number }
      ctx.save()
      ctx.translate(g.position.x, g.position.y)
      ctx.fillStyle = `rgba(200, 240, 255, ${0.15 + (gg.hp / 60) * 0.25})`
      ctx.fillRect(-60, -10, 120, 20)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(-60, -10, 120, 20)
      // Shimmer reflection moving across surface
      const shimmerX = ((time * 0.04) % 180) - 90
      const shimmerGrad = ctx.createLinearGradient(shimmerX - 20, 0, shimmerX + 20, 0)
      shimmerGrad.addColorStop(0, 'rgba(255,255,255,0)')
      shimmerGrad.addColorStop(0.5, 'rgba(255,255,255,0.25)')
      shimmerGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = shimmerGrad
      ctx.save()
      ctx.beginPath()
      ctx.rect(-60, -10, 120, 20)
      ctx.clip()
      ctx.fillRect(shimmerX - 20, -10, 40, 20)
      ctx.restore()
      // Branching cracks based on hp
      if (gg.hp < 40) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(-30, -5)
        ctx.lineTo(-15, 2)
        ctx.lineTo(0, 5)
        ctx.lineTo(20, -3)
        ctx.stroke()
        // Branch 1
        ctx.beginPath()
        ctx.moveTo(-15, 2)
        ctx.lineTo(-20, 8)
        ctx.stroke()
        // Branch 2
        ctx.beginPath()
        ctx.moveTo(0, 5)
        ctx.lineTo(5, 9)
        ctx.stroke()
      }
      if (gg.hp < 20) {
        ctx.beginPath()
        ctx.moveTo(10, -8)
        ctx.lineTo(0, -2)
        ctx.lineTo(-10, 3)
        ctx.lineTo(-5, 8)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, -2)
        ctx.lineTo(15, 0)
        ctx.lineTo(30, 7)
        ctx.stroke()
        // Extra branch
        ctx.beginPath()
        ctx.moveTo(15, 0)
        ctx.lineTo(20, -7)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-10, 3)
        ctx.lineTo(-25, 6)
        ctx.stroke()
      }
      ctx.restore()
    })

    // Obstacles (airplanes)
    obstacles.forEach((o) => {
      ctx.save()
      ctx.translate(o.position.x, o.position.y)
      ctx.fillStyle = '#ecf0f1'
      ctx.fillRect(-30, -10, 60, 20)
      ctx.fillStyle = '#bdc3c7'
      ctx.beginPath()
      ctx.moveTo(0, -10)
      ctx.lineTo(10, -25)
      ctx.lineTo(20, -10)
      ctx.fill()
      ctx.restore()
    })

    // Bananas
    bananas.forEach((b) => {
      ctx.save()
      ctx.translate(b.position.x, b.position.y)
      ctx.fillStyle = '#f1c40f'
      ctx.font = '20px "Segoe UI Emoji"'
      ctx.textAlign = 'center'
      ctx.fillText('\u{1F34C}', 0, 7)
      ctx.restore()
    })

    // Projectiles
    projectiles.forEach((p) => {
      ctx.save()
      ctx.shadowColor = '#e84393'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(p.position.x, p.position.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = p.render.fillStyle as string
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(p.position.x, p.position.y)
      ctx.lineTo(p.position.x - p.velocity.x * 3, p.position.y - p.velocity.y * 3)
      ctx.strokeStyle = p.render.fillStyle as string
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
    })

    // Items with glow + pulsing ring + sparkle orbits
    items.forEach((obj) => {
      if (obj.removed) return
      const pos = obj.body.position
      const floatY = Math.sin(time * 0.005) * 6
      ctx.save()
      ctx.translate(pos.x, pos.y + floatY)

      const iconMap: Record<string, string> = {
        jump: '\u26A1',
        shield: '\u{1F6E1}\uFE0F',
        giant: '\u{1F4AA}',
        bomb: '\u{1F4A3}',
        freeze: '\u2744\uFE0F',
        jetpack: '\u{1F680}',
        swap: '\u{1F504}',
        blind: '\u2601\uFE0F',
        rewind: '\u23EE\uFE0F',
        gravity: '\u{1F643}',
        drunk: '\u{1F92A}',
      }
      const icon = iconMap[obj.type] ?? '\u2B50'
      const itemColor = obj.body.render.fillStyle as string

      // Pulsing ring
      const ringRadius = 28 + Math.sin(time * 0.008) * 4
      const ringAlpha = 0.3 + Math.sin(time * 0.006) * 0.15
      ctx.beginPath()
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2)
      ctx.strokeStyle = itemColor
      ctx.globalAlpha = ringAlpha
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.globalAlpha = 1

      // Sparkle particles orbiting
      for (let s = 0; s < 3; s++) {
        const sparkAngle = time * 0.004 + (s * Math.PI * 2) / 3
        const sparkR = 26
        const sx = Math.cos(sparkAngle) * sparkR
        const sy = Math.sin(sparkAngle) * sparkR
        const sparkSize = 2 + Math.sin(time * 0.01 + s)
        ctx.fillStyle = '#fff'
        ctx.globalAlpha = 0.6 + Math.sin(time * 0.012 + s * 2) * 0.3
        ctx.beginPath()
        // 4-point star sparkle
        ctx.moveTo(sx, sy - sparkSize)
        ctx.lineTo(sx + sparkSize * 0.3, sy)
        ctx.lineTo(sx, sy + sparkSize)
        ctx.lineTo(sx - sparkSize * 0.3, sy)
        ctx.closePath()
        ctx.fill()
      }
      ctx.globalAlpha = 1

      ctx.save()
      ctx.rotate(time * 0.003)

      // Glow
      ctx.shadowColor = itemColor
      ctx.shadowBlur = 15

      ctx.fillStyle = itemColor
      ctx.beginPath()
      if (obj.type === 'jump') {
        ctx.moveTo(0, -18)
        ctx.lineTo(15, 12)
        ctx.lineTo(-15, 12)
      } else {
        ctx.arc(0, 0, 18, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = 'white'
      ctx.font = '20px "Segoe UI Emoji"'
      ctx.textAlign = 'center'
      ctx.fillText(icon, 0, 7)
      ctx.restore()

      ctx.restore()
    })

    // Players
    players.forEach((p) => {
      // Trail with skin glow color
      if (p.trail.length > 1) {
        // Parse glow color for trail (extract r,g,b from skin.glow)
        const glowMatch = p.skin.glow.match(/rgba?\((\d+),(\d+),(\d+)/)
        const tr = glowMatch ? glowMatch[1] : '255'
        const tg = glowMatch ? glowMatch[2] : '255'
        const tb = glowMatch ? glowMatch[3] : '255'
        for (let i = 1; i < p.trail.length; i++) {
          const prev = p.trail[i - 1]!
          const cur = p.trail[i]!
          const alpha = i / p.trail.length
          ctx.strokeStyle = `rgba(${tr},${tg},${tb},${alpha * 0.4})`
          ctx.lineWidth = 8 + alpha * 8
          ctx.beginPath()
          ctx.moveTo(prev.x, prev.y)
          ctx.lineTo(cur.x, cur.y)
          ctx.stroke()
        }
      }

      // Motion blur lines when speed > 12
      if (p.body.speed > 12) {
        const vx = p.body.velocity.x
        const vy = p.body.velocity.y
        const speed = p.body.speed
        const normX = -vx / speed
        const normY = -vy / speed
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 2
        for (let ml = 0; ml < 5; ml++) {
          const offsetX = (Math.random() - 0.5) * 30
          const offsetY = (Math.random() - 0.5) * 50
          const sx = p.body.position.x + offsetX
          const sy = p.body.position.y + offsetY
          const len = 15 + Math.random() * 20
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(sx + normX * len, sy + normY * len)
          ctx.stroke()
        }
      }

      // Charge bar
      if (p.isCharging) {
        const pos = p.body.position
        const w = 60
        const h = 10
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.beginPath()
        ctx.roundRect(pos.x - w / 2, pos.y - 120, w, h, 4)
        ctx.fill()
        const hue = 120 - p.chargeLevel * 120
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
        ctx.beginPath()
        ctx.roundRect(pos.x - w / 2, pos.y - 120, w * p.chargeLevel, h, 4)
        ctx.fill()
      }

      // Status icons
      const icons: string[] = []
      if (p.frozenTimer > 0) icons.push('\u2744\uFE0F')
      if (p.blindTimer > 0) icons.push('\u2601\uFE0F')
      if (p.slipTimer > 0) icons.push('\u{1F34C}')
      if (p.drunkTimer > 0) icons.push('\u{1F92A}')
      if (icons.length > 0) {
        ctx.fillStyle = 'white'
        ctx.font = '20px "Segoe UI Emoji"'
        ctx.textAlign = 'center'
        ctx.fillText(icons.join(' '), p.body.position.x, p.body.position.y - 105)
      }

      // Shield aura
      if (p.shieldTimer > 0) {
        ctx.beginPath()
        ctx.arc(p.body.position.x, p.body.position.y, 50, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(142, 68, 173, ${0.5 + Math.sin(time * 0.01) * 0.3})`
        ctx.lineWidth = 4
        ctx.stroke()
        // Inner glow
        ctx.beginPath()
        ctx.arc(p.body.position.x, p.body.position.y, 45, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(142, 68, 173, ${0.2 + Math.sin(time * 0.02) * 0.1})`
        ctx.lineWidth = 8
        ctx.stroke()
      }

      // Bottle body with glow
      ctx.save()
      if (p.body.speed > 10) {
        ctx.shadowColor = p.skin.glow
        ctx.shadowBlur = 20
      }
      // Collect main body part vertices for liquid fill
      let mainPartIdx = -1
      p.body.parts.forEach((part, i) => {
        if (i === 0 || !part.render.visible) return
        ctx.beginPath()
        const v = part.vertices
        ctx.moveTo(v[0]!.x, v[0]!.y)
        for (let k = 1; k < v.length; k++) ctx.lineTo(v[k]!.x, v[k]!.y)
        ctx.closePath()
        ctx.fillStyle = p.frozenTimer > 0 ? '#00cec9' : (part.render.fillStyle as string)
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.stroke()
        // Track the main body part (largest visible part, index 1)
        if (i === 1) mainPartIdx = i
      })
      ctx.restore()

      // Liquid fill inside the bottle (on main body part)
      if (mainPartIdx >= 0) {
        const mainPart = p.body.parts[mainPartIdx]!
        const verts = mainPart.vertices
        // Find bounding box of the main body part
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity
        for (const v of verts) {
          if (v.x < minX) minX = v.x
          if (v.x > maxX) maxX = v.x
          if (v.y < minY) minY = v.y
          if (v.y > maxY) maxY = v.y
        }
        const bodyH = maxY - minY
        const liquidLevel = minY + bodyH * 0.4 // ~60% fill from bottom
        const sloshOffset = p.body.velocity.x * 1.5
        ctx.save()
        // Clip to bottle body shape
        ctx.beginPath()
        ctx.moveTo(verts[0]!.x, verts[0]!.y)
        for (let k = 1; k < verts.length; k++) ctx.lineTo(verts[k]!.x, verts[k]!.y)
        ctx.closePath()
        ctx.clip()
        // Draw liquid with wavy top
        ctx.fillStyle = p.frozenTimer > 0 ? 'rgba(0,206,201,0.35)' : 'rgba(255,255,255,0.12)'
        ctx.beginPath()
        ctx.moveTo(minX - 5, maxY + 5)
        for (let lx = minX - 5; lx <= maxX + 5; lx += 3) {
          const waveY = liquidLevel + Math.sin(lx * 0.08 + time * 0.005 + sloshOffset * 0.1) * 3
          ctx.lineTo(lx, waveY)
        }
        ctx.lineTo(maxX + 5, maxY + 5)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Shine/reflection highlight on left side of bottle
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(verts[0]!.x, verts[0]!.y)
        for (let k = 1; k < verts.length; k++) ctx.lineTo(verts[k]!.x, verts[k]!.y)
        ctx.closePath()
        ctx.clip()
        const shineCx = minX + (maxX - minX) * 0.25
        const shineCy = minY + bodyH * 0.3
        const shineH = bodyH * 0.5
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(shineCx, shineCy - shineH * 0.4)
        ctx.quadraticCurveTo(shineCx - 3, shineCy, shineCx, shineCy + shineH * 0.4)
        ctx.stroke()
        ctx.restore()
      }

      // Eyes
      ctx.save()
      ctx.translate(p.body.position.x, p.body.position.y)
      ctx.rotate(p.body.angle)
      const isScared = p.body.speed > 15 || p.slipTimer > 0
      const eyeSize = p.giantTimer > 0 ? 8 : isScared ? 7 : 5
      // Eye whites
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(-6, -15, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6, -15, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      // Pupils
      ctx.fillStyle = 'black'
      const eyeOffset = Math.min(Math.max(p.body.velocity.x * 0.5, -2), 2)
      const pupilSize = isScared ? 1 : 2
      ctx.beginPath()
      ctx.arc(-6 + eyeOffset, -15, pupilSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(6 + eyeOffset, -15, pupilSize, 0, Math.PI * 2)
      ctx.fill()
      // Mouth
      if (p.drunkTimer > 0) {
        ctx.strokeStyle = '#c0392b'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, -5, 4, 0, Math.PI)
        ctx.stroke()
      } else if (isScared) {
        ctx.strokeStyle = '#c0392b'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(0, -5, 3, 0, Math.PI)
        ctx.stroke()
      }
      ctx.restore()
    })

    // Particles with varied shapes
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      if (p.type === 'c') {
        const sz = p.size ?? 4
        const rot = p.rotation ?? 0
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(rot)
        if (p.shape === 'triangle') {
          ctx.beginPath()
          ctx.moveTo(0, -sz)
          ctx.lineTo(sz * 0.87, sz * 0.5)
          ctx.lineTo(-sz * 0.87, sz * 0.5)
          ctx.closePath()
          ctx.fill()
        } else if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, sz / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-sz / 2, -sz / 2, sz, sz)
        }
        ctx.restore()
      } else if (p.type === 'sparkle') {
        // 4-point star sparkle
        const ss = (p.size ?? 3) * p.life
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.moveTo(0, -ss)
        ctx.lineTo(ss * 0.25, -ss * 0.25)
        ctx.lineTo(ss, 0)
        ctx.lineTo(ss * 0.25, ss * 0.25)
        ctx.lineTo(0, ss)
        ctx.lineTo(-ss * 0.25, ss * 0.25)
        ctx.lineTo(-ss, 0)
        ctx.lineTo(-ss * 0.25, -ss * 0.25)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, (p.size ?? 4) + p.life * 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Text effects
    for (const t of textEffects) {
      ctx.globalAlpha = t.life
      ctx.font = `bold ${Math.floor(22 * t.scale)}px "Be Vietnam Pro", Arial`
      ctx.textAlign = 'center'
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 3
      ctx.strokeText(t.text, t.x, t.y)
      ctx.fillStyle = t.color
      ctx.fillText(t.text, t.x, t.y)
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // ─── Update HUD ───
  function updateHUD() {
    p1Score.value = `${Math.floor(players[0]!.body.position.x / 10)}m`

    const skills1: { name: string; pct: number; color: string }[] = []
    if (players[0]!.jetpackTimer > 0)
      skills1.push({
        name: 'Jetpack',
        pct: players[0]!.jetpackTimer / SKILL_DURATION,
        color: '#e67e22',
      })
    if (players[0]!.giantTimer > 0)
      skills1.push({
        name: 'Giant',
        pct: players[0]!.giantTimer / SKILL_DURATION,
        color: '#27ae60',
      })
    if (players[0]!.shieldTimer > 0)
      skills1.push({
        name: 'Shield',
        pct: players[0]!.shieldTimer / SKILL_DURATION,
        color: '#8e44ad',
      })
    activeSkills.value = skills1

    if (players[1]) {
      p2Score.value = `${Math.floor(players[1].body.position.x / 10)}m`
      const skills2: { name: string; pct: number; color: string }[] = []
      if (players[1].jetpackTimer > 0)
        skills2.push({
          name: 'Jetpack',
          pct: players[1].jetpackTimer / SKILL_DURATION,
          color: '#e67e22',
        })
      if (players[1].giantTimer > 0)
        skills2.push({
          name: 'Giant',
          pct: players[1].giantTimer / SKILL_DURATION,
          color: '#27ae60',
        })
      if (players[1].shieldTimer > 0)
        skills2.push({
          name: 'Shield',
          pct: players[1].shieldTimer / SKILL_DURATION,
          color: '#8e44ad',
        })
      activeSkills2.value = skills2
    }
  }

  // ─── Main Loop ───
  function gameLoop() {
    if (!running) return
    animId = requestAnimationFrame(gameLoop)

    Engine.update(engine, 1000 / 60)

    const time = Date.now()
    if (Math.random() < cfg.planeSpawnChance) spawnAirplane()

    if (globalGravityTimer > 0) {
      globalGravityTimer--
      if (globalGravityTimer === 0) {
        engine.gravity.y = currentBiome.gravity
        showMsg('HẾT ĐẢO NGƯỢC!', '#fff')
      }
    }

    // Black Hole pull
    blackholes.forEach((bh) => {
      players.forEach((p) => {
        const dir = Vector.sub(bh.position, p.body.position)
        const dist = Vector.magnitude(dir)
        if (dist < 300) {
          const force = Vector.mult(Vector.normalise(dir), 0.005)
          Body.applyForce(p.body, p.body.position, force)
        }
      })
    })

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]!
      const vel = (o as Record<string, unknown>).velocityVec as { x: number; y: number }
      Body.setPosition(o, Vector.add(o.position, vel))
      players.forEach((p) => {
        if (M.Bounds.overlaps(o.bounds, p.body.bounds)) {
          // Only knock airborne bottles — skip if charging on a platform
          if (!p.hasLanded) {
            Body.applyForce(p.body, p.body.position, {
              x: vel.x * cfg.planeKnockback,
              y: -0.05,
            })
            Body.setAngularVelocity(
              p.body,
              p.body.angularVelocity + (Math.random() - 0.5) * cfg.planeSpin,
            )
            createTextEffect(p.body.position.x, p.body.position.y, 'CRASH!', '#e74c3c')
          }
        }
      })
      if (Math.abs(o.position.x - players[0]!.body.position.x) > 2000) {
        Composite.remove(world, o)
        obstacles.splice(i, 1)
      }
    }

    // Moving platforms
    movingPlatforms.forEach((p) => {
      const sp = (p as Record<string, unknown>).startPos as { x: number; y: number }
      const offset = (p as Record<string, unknown>).offset as number
      const moveRange = (p as Record<string, unknown>).moveRange as number
      const prevX = p.position.x
      const prevY = p.position.y
      const newX = sp.x + Math.sin(time * 0.002 + offset) * moveRange
      Body.setPosition(p, { x: newX, y: sp.y })
      Body.setVelocity(p, { x: newX - prevX, y: sp.y - prevY })
    })

    // Projectile lifetime
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]! as MatterBody & { life: number }
      p.life--
      if (p.life <= 0) {
        Composite.remove(world, p)
        projectiles.splice(i, 1)
      }
    }

    let maxDist = 0
    players.forEach((p) => {
      p.updateInput()
      p.checkState()
      if (p.body.position.x > maxDist) maxDist = p.body.position.x
    })
    if (maxDist > lastGeneratedX - 1500) generateLevelChunk(10)

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.02
      if (p.type === 'c') {
        p.vy += 0.2
        if (p.rotation !== undefined && p.rotSpeed !== undefined) p.rotation += p.rotSpeed
      }
      if (p.life <= 0) particles.splice(i, 1)
    }

    // Sparkle particles near items
    items.forEach((obj) => {
      if (obj.removed) return
      if (Math.random() > 0.92) {
        particles.push({
          x: obj.body.position.x + (Math.random() - 0.5) * 40,
          y: obj.body.position.y + (Math.random() - 0.5) * 40,
          vx: Math.random() - 0.5,
          vy: Math.random() - 0.5,
          life: 0.6,
          color: '#fff',
          type: 'sparkle',
          size: 2 + Math.random() * 2,
        })
      }
    })

    // Update text effects
    for (let i = textEffects.length - 1; i >= 0; i--) {
      const t = textEffects[i]!
      t.y += t.vy
      t.life -= 0.02
      t.scale = Math.max(1, t.scale - 0.02)
      if (t.life <= 0) textEffects.splice(i, 1)
    }

    updateHUD()

    // ─── Render ───
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (shake > 0) shake *= 0.9
    const shakeX = (Math.random() - 0.5) * shake
    const shakeY = (Math.random() - 0.5) * shake

    // Responsive zoom: zoom out on mobile so more world is visible
    const isMobile = canvas.width < 768
    const zoom = isMobile ? 0.55 : 1.0
    const camSmooth = 0.08
    // Compute virtual (unscaled) viewport size for camera targeting
    const vw = canvas.width / zoom
    const vh = canvas.height / zoom
    const lookAheadX1P = isMobile ? 150 : 350
    const lookAheadX2P = isMobile ? 100 : 200

    if (gameMode === 1) {
      const targetX = players[0]!.body.position.x + lookAheadX1P
      const targetY = players[0]!.body.position.y - vh * 0.4
      camera1.x += (targetX - camera1.x - vw / 2) * camSmooth
      camera1.y += (targetY - camera1.y) * camSmooth

      ctx.save()
      ctx.scale(zoom, zoom)
      drawBackground(camera1.x)
      drawWorld(camera1.x - shakeX, camera1.y - shakeY, false)
      ctx.restore()
    } else {
      // Determine split direction: auto = vertical on mobile, horizontal on desktop
      const useVertical = splitMode.value === 'vertical' || (splitMode.value === 'auto' && isMobile)

      if (useVertical) {
        // Top/bottom split
        const halfH = canvas.height / 2
        const vhHalf = halfH / zoom
        const targetX1 = players[0]!.body.position.x + lookAheadX2P
        const targetY1 = players[0]!.body.position.y - vhHalf * 0.4
        camera1.x += (targetX1 - camera1.x - vw / 2) * camSmooth
        camera1.y += (targetY1 - camera1.y) * camSmooth
        const targetX2 = players[1]!.body.position.x + lookAheadX2P
        const targetY2 = players[1]!.body.position.y - vhHalf * 0.4
        camera2.x += (targetX2 - camera2.x - vw / 2) * camSmooth
        camera2.y += (targetY2 - camera2.y) * camSmooth

        // P1 viewport (top half)
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, canvas.width, halfH)
        ctx.clip()
        ctx.scale(zoom, zoom)
        drawBackground(camera1.x)
        drawWorld(camera1.x - shakeX, camera1.y - shakeY, players[0]!.blindTimer > 0)
        ctx.restore()

        // P2 viewport (bottom half)
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, halfH, canvas.width, halfH)
        ctx.clip()
        ctx.translate(0, halfH)
        ctx.scale(zoom, zoom)
        drawBackground(camera2.x)
        drawWorld(camera2.x - shakeX, camera2.y - shakeY, players[1]!.blindTimer > 0)
        ctx.restore()

        // Divider
        ctx.beginPath()
        ctx.moveTo(0, halfH)
        ctx.lineTo(canvas.width, halfH)
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.stroke()

        // Touch zone labels
        ctx.fillStyle = 'rgba(255,255,255,0.15)'
        ctx.font = '12px "Be Vietnam Pro", Arial'
        ctx.textAlign = 'center'
        ctx.fillText('P1 — Chạm đây', canvas.width / 2, 16)
        ctx.fillText('P2 — Chạm đây', canvas.width / 2, halfH + 16)
      } else {
        // Left/right split
        const w = canvas.width / 2
        const vwHalf = w / zoom
        const targetX1 = players[0]!.body.position.x + lookAheadX2P
        const targetY1 = players[0]!.body.position.y - vh * 0.4
        camera1.x += (targetX1 - camera1.x - vwHalf / 2) * camSmooth
        camera1.y += (targetY1 - camera1.y) * camSmooth
        const targetX2 = players[1]!.body.position.x + lookAheadX2P
        const targetY2 = players[1]!.body.position.y - vh * 0.4
        camera2.x += (targetX2 - camera2.x - vwHalf / 2) * camSmooth
        camera2.y += (targetY2 - camera2.y) * camSmooth

        // P1 viewport (left)
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, w, canvas.height)
        ctx.clip()
        ctx.scale(zoom, zoom)
        drawBackground(camera1.x)
        drawWorld(camera1.x - shakeX, camera1.y - shakeY, players[0]!.blindTimer > 0)
        ctx.restore()

        // P2 viewport (right)
        ctx.save()
        ctx.beginPath()
        ctx.rect(w, 0, w, canvas.height)
        ctx.clip()
        ctx.translate(w, 0)
        ctx.scale(zoom, zoom)
        drawBackground(camera2.x)
        drawWorld(camera2.x - shakeX, camera2.y - shakeY, players[1]!.blindTimer > 0)
        ctx.restore()

        // Divider
        ctx.beginPath()
        ctx.moveTo(w, 0)
        ctx.lineTo(w, canvas.height)
        ctx.lineWidth = 4
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.stroke()
      }
    }
  }

  // ─── Initialize ───
  changeBiome(BIOMES.HOUSE)
  createPlatform(200, 500, 400, 40)
  generateLevelChunk(20)

  players.push(new Player(1, 200, 400, SKINS[selectedSkinIndex.value]!, ['Space', 'KeyA']))
  if (gameMode === 2) {
    const p2Skin = selectedSkinIndex.value === 1 ? SKINS[0]! : SKINS[1]!
    players.push(new Player(2, 250, 400, p2Skin, ['ArrowUp', 'Enter']))
  }

  animId = requestAnimationFrame(gameLoop)

  // Return cleanup
  return () => {
    running = false
    cancelAnimationFrame(animId)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mouseup', onMouseUp)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('touchcancel', onTouchEnd)
    window.removeEventListener('resize', onResize)
    Composite.clear(world, false)
    Engine.clear(engine)
  }
}

onMounted(() => {
  // Preload Matter.js in background
  loadMatterJS()
})

onUnmounted(() => {
  if (cleanupGame) cleanupGame()
})
</script>

<template>
  <div
    class="relative w-screen h-screen overflow-hidden bg-bg-deep select-none"
    style="touch-action: none"
  >
    <canvas ref="canvasRef" class="block w-full h-full" style="touch-action: none" />

    <!--     Home button -->
    <RouterLink
      to="/"
      class="rounded-md absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 border border-border-default bg-bg-surface/80 backdrop-blur-sm text-text-secondary hover:border-accent-coral hover:text-accent-coral transition-all duration-200"
      title="Về trang chủ"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </RouterLink>

    <!-- HUD Layer -->
    <div
      v-if="!menuVisible"
      class="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-5"
    >
      <!-- Biome notification -->
      <div
        v-if="biomeVisible"
        class="absolute top-[15%] w-full text-center font-display text-3xl sm:text-5xl font-black text-white tracking-widest animate-fade-in"
        style="text-shadow: 0 0 20px rgba(0, 0, 0, 0.6)"
      >
        {{ biomeText }}
      </div>

      <!-- P1 Score (top-left, always) -->
      <div
        class="text-left px-3 py-2 rounded-lg border border-white/10"
        style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px)"
      >
        <div
          class="font-display text-lg sm:text-xl font-bold tracking-wide"
          style="color: #38bdf8; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8)"
        >
          P1: {{ p1Score }}
        </div>
        <div class="flex flex-col gap-1 mt-1">
          <div
            v-for="skill in activeSkills"
            :key="skill.name"
            class="w-28 h-1.5 rounded-full"
            style="background: #333"
          >
            <div
              class="h-full rounded-full transition-all duration-100"
              :style="{ width: `${skill.pct * 100}%`, backgroundColor: skill.color }"
            />
          </div>
        </div>
      </div>

      <!-- P2 Score: desktop=top-right, mobile=bottom-left of screen (in bottom viewport) -->
      <div
        v-if="p2Visible"
        class="absolute right-4 top-4 sm:right-5 sm:top-5 md:right-5 md:top-5 px-3 py-2 rounded-lg border border-white/10"
        style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px)"
        :class="
          p2Visible
            ? 'max-sm:top-auto! max-sm:bottom-[calc(50%-2rem)]! max-sm:left-4! max-sm:right-auto!'
            : ''
        "
      >
        <div
          class="font-display text-lg sm:text-xl font-bold tracking-wide"
          :class="p2Visible ? 'sm:text-right' : ''"
          style="color: #e74c3c; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8)"
        >
          P2: {{ p2Score }}
        </div>
        <div class="flex flex-col gap-1 mt-1" :class="p2Visible ? 'sm:items-end' : ''">
          <div
            v-for="skill in activeSkills2"
            :key="skill.name"
            class="w-28 h-1.5 rounded-full"
            style="background: #333"
          >
            <div
              class="h-full rounded-full transition-all duration-100"
              :style="{ width: `${skill.pct * 100}%`, backgroundColor: skill.color }"
            />
          </div>
        </div>
      </div>

      <!-- Combo display -->
      <div
        v-if="comboVisible && comboCount > 1"
        class="absolute top-1/4 w-full text-center font-display text-4xl sm:text-6xl font-black animate-pop-in"
        :style="{
          color: comboCount >= 5 ? '#f1c40f' : comboCount >= 3 ? '#e67e22' : '#2ecc71',
          textShadow: '0 0 30px rgba(0,0,0,0.8)',
        }"
      >
        x{{ comboCount }} COMBO!
      </div>

      <!-- Game message -->
      <div
        v-if="gameMessageVisible"
        class="absolute top-[30%] w-full text-center font-display text-4xl sm:text-6xl font-black animate-pop-in"
        :style="{
          color: gameMessageColor,
          textShadow: '0 0 20px rgba(0,0,0,0.8)',
        }"
      >
        {{ gameMessage }}
      </div>
    </div>

    <!-- Main Menu -->
    <div
      v-if="menuVisible"
      class="absolute inset-0 flex flex-col items-center z-50 pointer-events-auto px-4 py-6 overflow-y-auto justify-start sm:justify-center animate-fade-in"
      style="background: rgba(15, 25, 35, 0.95)"
    >
      <h1
        class="font-display text-4xl sm:text-6xl font-black tracking-tight mb-2"
        style="color: #ff6b4a; text-shadow: 4px 4px 0 #c0392b"
      >
        DIMENSION BREAKER
      </h1>
      <p class="text-text-secondary text-sm mb-4 font-display tracking-widest">
        FLIP BOTTLE ULTIMATE
      </p>

      <div class="text-text-secondary text-sm leading-relaxed text-center max-w-lg mb-6 space-y-1">
        <p><span class="text-accent-sky font-semibold">Portal:</span> Nhảy vào Xanh, ra Cam</p>
        <p><span class="text-accent-sky font-semibold">Hố Đen:</span> Hút mọi thứ vào tâm</p>
        <p><span class="text-accent-sky font-semibold">Sàn Kính:</span> Vỡ sau 1 giây đứng</p>
        <p><span class="text-accent-sky font-semibold">Say Rượu:</span> Đảo ngược điều khiển</p>
      </div>

      <!-- Difficulty -->
      <div class="text-center mb-4">
        <p class="text-text-dim text-xs font-display tracking-widest mb-2">ĐỘ KHÓ</p>
        <div class="flex gap-2">
          <button
            v-for="(label, idx) in ['KHÓ', 'THƯỜNG', 'DỄ']"
            :key="idx"
            class="px-4! py-1.5! text-sm! rounded-none! m-0!"
            :class="
              difficultyLevel === idx
                ? 'bg-accent-coral! text-white! border border-accent-coral'
                : 'bg-bg-surface! text-text-secondary! border border-border-default hover:border-accent-coral'
            "
            @click="setDiff(idx)"
          >
            {{ label }}
          </button>
        </div>
        <p class="text-text-dim text-xs mt-1 italic">{{ diffDescs[difficultyLevel] }}</p>
      </div>

      <!-- Balance toggle -->
      <div class="text-center mb-4">
        <button
          class="px-4! py-1.5! text-sm! rounded-none! m-0!"
          :class="
            balanceEnabled
              ? 'bg-accent-coral! text-white! border border-accent-coral'
              : 'bg-bg-surface! text-text-secondary! border border-border-default hover:border-accent-coral'
          "
          @click="balanceEnabled = !balanceEnabled"
        >
          {{ balanceEnabled ? 'TỰ CÂN BẰNG: BẬT' : 'TỰ CÂN BẰNG: TẮT' }}
        </button>
        <p class="text-text-dim text-xs mt-1 italic">
          {{ balanceEnabled ? 'Chai tự chỉnh đứng khi hạ cánh.' : 'Không hỗ trợ — thuần kỹ năng.' }}
        </p>
      </div>

      <!-- 2P Split mode -->
      <div class="text-center mb-4">
        <p class="text-text-dim text-xs font-display tracking-widest mb-2">
          CHẾ ĐỘ CHIA MÀN HÌNH 2P
        </p>
        <div class="flex gap-2 justify-center">
          <button
            v-for="opt in [
              { val: 'auto', label: 'TỰ ĐỘNG' },
              { val: 'vertical', label: 'TRÊN/DƯỚI' },
              { val: 'horizontal', label: 'TRÁI/PHẢI' },
            ] as const"
            :key="opt.val"
            class="px-3! py-1.5! text-xs! rounded-none! m-0!"
            :class="
              splitMode === opt.val
                ? 'bg-accent-coral! text-white! border border-accent-coral'
                : 'bg-bg-surface! text-text-secondary! border border-border-default hover:border-accent-coral'
            "
            @click="splitMode = opt.val"
          >
            {{ opt.label }}
          </button>
        </div>
        <p class="text-text-dim text-xs mt-1 italic">
          {{
            splitMode === 'auto'
              ? 'Tự chọn theo kích thước màn hình.'
              : splitMode === 'vertical'
                ? 'P1 trên, P2 dưới. Chạm nửa trên/dưới.'
                : 'P1 trái, P2 phải. Chạm nửa trái/phải.'
          }}
        </p>
      </div>

      <!-- Skin selector -->
      <div class="text-center mb-6">
        <p class="text-text-dim text-xs font-display tracking-widest mb-2">SKIN</p>
        <div class="flex gap-3 justify-center">
          <button
            v-for="(skin, idx) in SKINS"
            :key="idx"
            class="w-10! h-10! rounded-full! p-0! m-0! transition-transform shadow-none!"
            :style="{
              backgroundColor: skin.body,
              border:
                selectedSkinIndex === idx ? '3px solid white' : '3px solid rgba(255,255,255,0.3)',
              transform: selectedSkinIndex === idx ? 'scale(1.2)' : 'scale(1)',
              boxShadow: selectedSkinIndex === idx ? `0 0 15px ${skin.glow}` : 'none',
            }"
            @click="selectSkin(idx)"
          />
        </div>
      </div>

      <!-- Play buttons -->
      <div class="flex gap-3">
        <button
          class="bg-accent-coral! hover:bg-accent-coral/80! rounded-none! border border-accent-coral text-base! px-6! py-2.5!"
          @click="startGame(1)"
        >
          1 PLAYER
        </button>
        <button
          class="bg-bg-surface! hover:bg-bg-elevated! rounded-none! border border-border-default hover:border-accent-coral text-base! px-6! py-2.5!"
          @click="startGame(2)"
        >
          2 PLAYERS
        </button>
      </div>

      <!-- Controls hint -->
      <div class="mt-4 text-text-dim text-xs text-center space-y-1">
        <p>
          P1:
          <span
            class="inline-block px-1.5 py-0.5 border border-border-default font-mono text-text-secondary"
            >Space</span
          >
          /
          <span
            class="inline-block px-1.5 py-0.5 border border-border-default font-mono text-text-secondary"
            >A</span
          >
          / Tap
        </p>
        <p>
          P2:
          <span
            class="inline-block px-1.5 py-0.5 border border-border-default font-mono text-text-secondary"
            >↑</span
          >
          /
          <span
            class="inline-block px-1.5 py-0.5 border border-border-default font-mono text-text-secondary"
            >Enter</span
          >
        </p>
        <p class="text-text-dim/60">Mobile 2P: Chạm nửa trên = P1, chạm nửa dưới = P2</p>
      </div>

      <!-- Home link -->
      <RouterLink
        to="/"
        class="mt-6 inline-flex items-center gap-2 text-text-dim text-xs hover:text-accent-coral transition-colors font-display tracking-wide"
      >
        &larr; Về trang chủ
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* Animations */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in {
  animation: fade-in 0.4s ease;
}
.animate-pop-in {
  animation: pop-in 0.2s ease;
}
/* Override button styles for design system */
button {
  font-family: 'Anybody', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
}
</style>
