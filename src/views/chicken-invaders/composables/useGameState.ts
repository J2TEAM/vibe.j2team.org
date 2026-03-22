import { ref, reactive } from 'vue'
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/config'
import type {
  Bullet,
  Enemy,
  Boss,
  Egg,
  PowerUp,
  ActiveDot,
  LeaderboardEntry,
  SaveSlot,
  GameEngine,
} from '../utils/types'

export type GameStatus =
  | 'menu'
  | 'starting'
  | 'playing'
  | 'gameover'
  | 'paused'
  | 'resuming'
  | 'leaderboard'
  | 'saves'
  | 'victory'

export function useGameState() {
  const gameState = ref<GameStatus>('menu')
  const previousGameState = ref<GameStatus>('menu')

  const gameMode = ref<'endless' | 'campaign'>('endless') // <-- CHẾ ĐỘ CHƠI
  const gamePhase = ref<'minions' | 'meteors' | 'boss'>('minions')
  const difficulty = ref<'easy' | 'normal' | 'hard' | 'hardcore'>('easy')
  const currentWave = ref(1)
  const weaponType = ref(0)
  const weaponLevel = ref(1)
  const bgHue = ref(0)

  const boardRotation = ref(0)
  const isRotating = ref(false)
  const activeWidth = ref(GAME_WIDTH)
  const activeHeight = ref(GAME_HEIGHT)

  const globalScale = ref(1)

  const isMuted = ref(false)
  const hiddenEventWavesLeft = ref(0)
  const resumingCountdown = ref(0)
  const resumeInterval = ref<ReturnType<typeof setInterval> | null>(null)

  const notification = ref('')
  let notifTimeout: ReturnType<typeof setTimeout> | null = null
  const showNotification = (msg: string) => {
    notification.value = msg
    if (notifTimeout) clearTimeout(notifTimeout)
    notifTimeout = setTimeout(() => (notification.value = ''), 3000)
  }

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

  const leaderboard = ref<LeaderboardEntry[]>([])
  try {
    const stored = localStorage.getItem('chicken_invaders_leaderboard')
    if (stored) leaderboard.value = JSON.parse(stored)
  } catch {}

  const saves = ref<SaveSlot[]>([])
  const currentSaveId = ref<string | null>(null)
  try {
    const storedSaves = localStorage.getItem('chicken_invaders_saves')
    if (storedSaves) saves.value = JSON.parse(storedSaves)
  } catch {}

  const engine = reactive<GameEngine>({
    pendingSpawns: [],
    hazardSpawnCooldown: 0,
    formationCenter: { x: GAME_WIDTH / 2, y: 150, dx: 1 },
    formationTimer: 0,
    formationType: 0,
    objCounter: 0,
    lastFireTime: 0,
    enemyDirection: 1,
    wasSpaceDown: false,
    isTransitioningWave: false,
    hasSpawnedBoss: false,
    waveEnemySpeed: 1.5,
    waveEggFireRate: 0.005,
  })

  return {
    gameState,
    previousGameState,
    gameMode,
    gamePhase,
    difficulty,
    currentWave,
    weaponType,
    weaponLevel,
    bgHue,
    boardRotation,
    isRotating,
    activeWidth,
    activeHeight,
    globalScale,
    isMuted,
    hiddenEventWavesLeft,
    resumingCountdown,
    resumeInterval,
    notification,
    showNotification,
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
    leaderboard,
    saves,
    currentSaveId,
  }
}

export type GameState = ReturnType<typeof useGameState>
