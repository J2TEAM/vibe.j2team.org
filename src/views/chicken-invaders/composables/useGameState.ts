import { ref, reactive } from 'vue'
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/config'
import type { Bullet, Enemy, Boss, Egg, PowerUp, ActiveDot } from '../utils/types'

export function useGameState() {
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
  const resumeInterval = ref<ReturnType<typeof setInterval> | null>(null)

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

  // CÁC BIẾN NỘI BỘ CỦA ENGINE (Gom lại để share giữa các file Actions và Loop)
  const engine = reactive({
    pendingSpawns: [] as Enemy[],
    hazardSpawnCooldown: 0,
    formationCenter: { x: GAME_WIDTH / 2, y: 150, dx: 1 },
    formationTimer: 0,
    formationType: 0,
    objCounter: 0,
    lastFireTime: 0,
    enemyDirection: 1,
    wasSpaceDown: false,
    isTransitioningWave: false,
    waveEnemySpeed: 1.5,
    waveEggFireRate: 0.005,
  })

  return {
    gameState,
    gamePhase,
    currentWave,
    weaponType,
    weaponLevel,
    bgHue,
    boardRotation,
    isRotating,
    activeWidth,
    activeHeight,
    isMuted,
    hiddenEventWavesLeft,
    resumingCountdown,
    resumeInterval,
    player,
    score,
    lives,
    bullets,
    enemyBullets,
    enemies,
    powerUps,
    bosses,
    waveAnnouncement,
    activeDots,
    engine,
  }
}

export type GameState = ReturnType<typeof useGameState>
