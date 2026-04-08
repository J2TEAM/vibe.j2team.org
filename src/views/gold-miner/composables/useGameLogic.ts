import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRafFn, useIntervalFn } from '@vueuse/core'
import type { GameItem, HookState, Position, GameMode } from '../types'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TOP_BAR_HEIGHT,
  HOOK_SPEED,
  ROTATION_SPEED,
  MAX_ANGLE,
  ITEM_CONFIGS,
  RETRACT_SPEED_CLICK,
  MANUAL_PULL_DECAY,
  LINE_STRENGTH_BASE,
  MAX_LIVES,
  LEVEL_CONFIGS,
  EXPLOSION_RADIUS,
} from '../constants'

export function useGameLogic() {
  const mode = ref<GameMode>('level')
  const level = ref(1)
  const lives = ref(MAX_LIVES)
  const score = ref(0)
  const timeLeft = ref(60)
  const isGameOver = ref(false)
  const isBroken = ref(false)
  const isStarted = ref(false)
  const isRecentlyStarted = ref(false)
  const showInstructions = ref(false)

  // Penalty system
  const isShowPenalty = ref<boolean>(false)
  const hasAppliedPenalty = ref(false)

  const startLevelScore = ref(0)

  const hookAngle = ref(0)
  const hookPos = ref<Position>({ x: GAME_WIDTH / 2, y: TOP_BAR_HEIGHT })
  const hookLength = ref(40)
  const hookState = ref<HookState>('IDLE')
  const rotationDirection = ref(1)

  const items = ref<GameItem[]>([])
  const caughtItem = ref<GameItem | null>(null)

  const pullMomentum = ref(0)

  const targetScore = computed(() => {
    if (mode.value === 'classic') return Infinity
    const config = LEVEL_CONFIGS[level.value - 1]
    return config ? config.target : level.value * 5000
  })

  function initLevel(isNextLevel = false) {
    if (!isNextLevel) {
      score.value = 0
      level.value = 1
      lives.value = MAX_LIVES
      startLevelScore.value = 0
    } else {
      // Update startLevelScore when progression to next level
      startLevelScore.value = score.value
    }

    isBroken.value = false
    isGameOver.value = false
    hookLength.value = 40
    hookState.value = 'IDLE'
    caughtItem.value = null
    pullMomentum.value = 0
    hasAppliedPenalty.value = false
    isShowPenalty.value = false

    if (mode.value === 'level') {
      const config = LEVEL_CONFIGS[level.value - 1] || LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1]
      timeLeft.value = config && config.time ? config.time : 60
    }

    items.value = []
    const categories = Object.keys(ITEM_CONFIGS) as (keyof typeof ITEM_CONFIGS)[]
    const itemCount = 15 + level.value * 2

    for (let i = 0; i < itemCount; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]!
      const variants = ITEM_CONFIGS[category]
      const config = variants[Math.floor(Math.random() * variants.length)]!

      let x: number, y: number, tooClose: boolean
      let attempts = 0
      do {
        x = Math.random() * (GAME_WIDTH - config.radius * 2) + config.radius
        y =
          Math.random() * (GAME_HEIGHT - TOP_BAR_HEIGHT - config.radius - 20) +
          TOP_BAR_HEIGHT +
          config.radius +
          10
        tooClose = items.value.some((item) => {
          const dist = Math.sqrt((x - item.x) ** 2 + (y - item.y) ** 2)
          return dist < config.radius + item.radius + 15
        })
        attempts++
      } while (tooClose && attempts < 20)

      if (!tooClose) {
        items.value.push({
          id: `item-${i}-${Date.now()}`,
          type: category,
          x,
          y,
          radius: config.radius,
          value: config.value,
          weight: config.weight,
          isCollected: false,
        })
      }
    }
  }

  const { pause: stopTimer, resume: startTimer } = useIntervalFn(() => {
    if (!isStarted.value || mode.value === 'classic' || isGameOver.value) return

    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      checkEndLevel()
    }
  }, 1000)

  function checkEndLevel() {
    if (score.value >= targetScore.value) {
      level.value++
      initLevel(true)
    } else {
      isGameOver.value = true
      stopTimer()
    }
  }

  function shoot() {
    if (!isStarted.value || showInstructions.value || isRecentlyStarted.value) return
    if (hookState.value === 'IDLE' && !isGameOver.value && !isBroken.value) {
      hookState.value = 'SHOOTING'
      hasAppliedPenalty.value = false // Reset for new shot
    } else if (hookState.value === 'RETRACTING' && !isBroken.value) {
      pullMomentum.value += RETRACT_SPEED_CLICK

      if (caughtItem.value && caughtItem.value.weight > 5) {
        const breakChance = (caughtItem.value.weight / LINE_STRENGTH_BASE) * 0.1
        if (Math.random() < breakChance) {
          breakLine()
        }
      }
    }
  }

  function breakLine() {
    isBroken.value = true
    hookState.value = 'RETRACTING'
    if (caughtItem.value) {
      caughtItem.value.isCollected = false
      caughtItem.value = null
    }
    lives.value--
    if (lives.value <= 0) {
      isGameOver.value = true
    }

    setTimeout(() => {
      if (!isGameOver.value) {
        isBroken.value = false
        hookLength.value = 40
        hookState.value = 'IDLE'
      }
    }, 1500)
  }

  function update() {
    if (!isStarted.value || isGameOver.value || showInstructions.value) return

    if (hookState.value === 'IDLE') {
      hookAngle.value += ROTATION_SPEED * rotationDirection.value
      if (Math.abs(hookAngle.value) > MAX_ANGLE) {
        rotationDirection.value *= -1
      }
    } else if (hookState.value === 'SHOOTING') {
      hookLength.value += HOOK_SPEED

      const hookX = hookPos.value.x + Math.sin(hookAngle.value) * hookLength.value
      const hookY = hookPos.value.y + Math.cos(hookAngle.value) * hookLength.value

      let itemCaught = false
      for (const item of items.value) {
        if (!item.isCollected) {
          const dist = Math.sqrt((hookX - item.x) ** 2 + (hookY - item.y) ** 2)
          if (dist < item.radius + 15) {
            if (item.type === 'tnt') {
              // EXPLOSION LOGIC
              item.isCollected = true
              hookState.value = 'RETRACTING'

              // Explode nearby items
              items.value.forEach((otherItem) => {
                if (!otherItem.isCollected) {
                  const explodeDist = Math.sqrt(
                    (item.x - otherItem.x) ** 2 + (item.y - otherItem.y) ** 2,
                  )
                  if (explodeDist < EXPLOSION_RADIUS) {
                    otherItem.isCollected = true
                  }
                }
              })
            } else {
              caughtItem.value = item
              item.isCollected = true
              hookState.value = 'RETRACTING'
            }
            itemCaught = true
            break
          }
        }
      }

      if (!itemCaught && (hookX < 0 || hookX > GAME_WIDTH || hookY > GAME_HEIGHT)) {
        hookState.value = 'RETRACTING'
        if (mode.value === 'level' && !hasAppliedPenalty.value) {
          hasAppliedPenalty.value = true
          timeLeft.value = Math.max(0, timeLeft.value - 2)

          isShowPenalty.value = true

          setTimeout(() => {
            isShowPenalty.value = false
          }, 1000)
        }
      }
    } else if (hookState.value === 'RETRACTING') {
      let speed = isBroken.value ? 10 : pullMomentum.value / (caughtItem.value?.weight || 1)
      // Empty hook retracts 20% faster than extension speed (HOOK_SPEED)
      const minSpeed = caughtItem.value ? 2 / caughtItem.value.weight : HOOK_SPEED * 1.2
      speed = Math.max(speed, minSpeed)

      hookLength.value -= speed
      pullMomentum.value *= 1 - MANUAL_PULL_DECAY

      if (caughtItem.value) {
        caughtItem.value.x = hookPos.value.x + Math.sin(hookAngle.value) * hookLength.value
        caughtItem.value.y = hookPos.value.y + Math.cos(hookAngle.value) * hookLength.value
      }

      if (hookLength.value <= 40) {
        hookLength.value = 40
        if (!isBroken.value) {
          hookState.value = 'IDLE'
          if (caughtItem.value) {
            if (caughtItem.value.type === 'mystery') {
              // Random value between 50 and 800
              const randomVal = Math.floor(Math.random() * 750) + 50
              score.value += randomVal
            } else {
              score.value += caughtItem.value.value
            }
            caughtItem.value = null
          }
        }
      }
    }
  }

  function selectMode(newMode: GameMode) {
    mode.value = newMode
    showInstructions.value = true
  }

  function confirmStart() {
    showInstructions.value = false
    isRecentlyStarted.value = true
    // Small cooldown to prevent click bubbling from meeting shoot() requirements
    setTimeout(() => {
      isRecentlyStarted.value = false
    }, 200)

    isStarted.value = true
    initLevel()
    if (mode.value === 'level') startTimer()
    resume()
  }

  function resetLevel() {
    initLevel()
    if (mode.value === 'level') startTimer()
  }

  function retryLevel() {
    score.value = startLevelScore.value
    lives.value = MAX_LIVES
    isRecentlyStarted.value = true
    setTimeout(() => {
      isRecentlyStarted.value = false
    }, 200)
    initLevel(true) // Reset items/time/etc for the CURRENT level
    if (mode.value === 'level') startTimer()
  }

  function quitGame() {
    isStarted.value = false
    showInstructions.value = false
    isGameOver.value = false
    isBroken.value = false
    caughtItem.value = null
    items.value = []
    hasAppliedPenalty.value = false
    isShowPenalty.value = false
    stopTimer()
    pause()
  }

  const { pause, resume } = useRafFn(update)

  onMounted(() => {
    pause() // Wait for start
  })

  onUnmounted(() => {
    pause()
    stopTimer()
  })

  return {
    mode,
    level,
    lives,
    score,
    targetScore,
    timeLeft,
    isGameOver,
    isBroken,
    isStarted,
    showInstructions,
    isShowPenalty,
    hookAngle,
    hookLength,
    hookPos,
    items,
    caughtItem,
    shoot,
    resetLevel,
    retryLevel,
    selectMode,
    confirmStart,
    quitGame,
  }
}
