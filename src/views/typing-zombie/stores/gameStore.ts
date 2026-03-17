import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GameStatus, PixelEffect, PowerUpType, Zombie, ZombieType } from '../types'
import { getRandomWord } from '../wordList'
import { getSfx } from '../utils/sfx'

let nextZombieId = 0
let nextEffectId = 0

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickWord(difficulty: number, minLen: number, maxLen: number) {
  for (let i = 0; i < 12; i++) {
    const word = getRandomWord(difficulty).toLowerCase()
    if (word.length >= minLen && word.length <= maxLen) return word
  }
  return getRandomWord(difficulty).toLowerCase()
}

function pickLaneY() {
  const lanes = [18, 28, 38, 48, 58, 68, 78]
  const lane = lanes[randomInt(0, lanes.length - 1)] ?? 48
  return lane + (Math.random() * 2 - 1) * 1.5
}

export const useGameStore = defineStore('typing-zombie', () => {
  const sfx = getSfx()

  const score = ref(0)
  const highScore = useLocalStorage<number>('typing-zombie:highScore', 0)

  const health = ref(3)
  const maxHealth = ref(3)
  const shield = ref(0)

  const zombies = ref<Zombie[]>([])
  const effects = ref<PixelEffect[]>([])
  const typedText = ref('')

  const status = ref<GameStatus>('idle')
  const difficulty = ref(1)
  const level = ref(1)

  const combo = ref(0)
  const highestCombo = ref(0)
  const multiplier = ref(1)
  const streak = ref('')

  const powerUps = ref<PowerUpType[]>([])
  const zombieTypes = ref<ZombieType[]>(['normal', 'fast', 'tank', 'boss'])
  const slowUntilMs = ref(0)
  const doubleUntilMs = ref(0)
  const gameSpeed = ref(1)

  const elapsedMs = ref(0)
  const spawnAccumulatorMs = ref(0)
  const nextBossAtMs = ref(randomInt(30_000, 60_000))

  const shakeTimeMs = ref(0)
  const shakeX = ref(0)
  const shakeY = ref(0)

  const scorePulse = ref(0)
  const comboPulse = ref(0)
  const levelPulse = ref(0)
  const mistakePulse = ref(0)
  const hitPulse = ref(0)
  const killPulse = ref(0)
  const powerPulse = ref(0)

  const effectTimeouts = new Set<number>()

  const isPlaying = computed(() => status.value === 'playing')
  const isPaused = computed(() => status.value === 'paused')
  const isGameOver = computed(() => status.value === 'gameover')

  const isSlowActive = computed(() => elapsedMs.value < slowUntilMs.value)
  const isDoubleActive = computed(() => elapsedMs.value < doubleUntilMs.value)

  const powerUpActive = computed<PowerUpType | null>(() => {
    if (isSlowActive.value) return 'slow'
    if (isDoubleActive.value) return 'double'
    return null
  })

  const maxZombies = 18
  const playerHitX = 8

  function clearEffectTimers() {
    for (const t of effectTimeouts) window.clearTimeout(t)
    effectTimeouts.clear()
  }

  function pushEffect(kind: PixelEffect['kind'], x: number, y: number, value?: string, ttl = 900) {
    const id = `e-${nextEffectId++}`
    effects.value.push({ id, kind, x, y, value })
    const t = window.setTimeout(() => {
      effects.value = effects.value.filter((e) => e.id !== id)
      effectTimeouts.delete(t)
    }, ttl)
    effectTimeouts.add(t)
  }

  function spawnExplosion(x: number, y: number) {
    pushEffect('explode', x, y, undefined, 240)
  }

  function spawnFloatingScore(points: number, x: number, y: number) {
    pushEffect('score', x, y, `+${points}`, 900)
  }

  function spawnComboText(x: number, y: number, nextMultiplier: number) {
    pushEffect('combo', x, y, `x${nextMultiplier}`, 900)
  }

  function spawnStreakText(text: string) {
    pushEffect('streak', 50, 22, text, 950)
  }

  function spawnPowerText(text: string) {
    pushEffect('powerup', 50, 30, text, 1100)
  }

  function resetCombo() {
    combo.value = 0
    multiplier.value = 1
    streak.value = ''
    comboPulse.value++
  }

  function updateStreakFeedback() {
    const prev = streak.value
    if (combo.value >= 30) streak.value = 'Unstoppable!'
    else if (combo.value >= 20) streak.value = 'Insane!'
    else if (combo.value >= 10) streak.value = 'Great!'
    else if (combo.value >= 5) streak.value = 'Nice!'
    else streak.value = ''

    if (streak.value && streak.value !== prev) spawnStreakText(streak.value)
  }

  function computeMultiplier(nextCombo: number) {
    return clamp(1 + Math.floor(nextCombo / 5), 1, 8)
  }

  function increaseCombo() {
    const next = combo.value + 1
    combo.value = next
    highestCombo.value = Math.max(highestCombo.value, next)

    const nextMult = computeMultiplier(next)
    const prevMult = multiplier.value
    multiplier.value = nextMult
    if (nextMult > prevMult) {
      spawnComboText(14, 44, nextMult)
      sfx.play('combo')
    }

    updateStreakFeedback()
    comboPulse.value++
  }

  function checkLevelUp() {
    while (score.value >= level.value * 250) {
      level.value++
      difficulty.value++
      levelPulse.value++

      // Grant a shield every few levels (absorbs 1 hit)
      if (level.value % 3 === 0) {
        shield.value = clamp(shield.value + 1, 0, 3)
        spawnPowerText('Shield +1')
      }
    }
  }

  function addScore(base: number, x: number, y: number) {
    const doubled = isDoubleActive.value ? 2 : 1
    const points = Math.max(1, Math.round(base * multiplier.value * doubled))
    score.value += points
    scorePulse.value++
    spawnFloatingScore(points, x, y)
    checkLevelUp()
  }

  function setOnlyActiveZombie(id: string) {
    for (const z of zombies.value) z.active = z.id === id
  }

  function registerMistake() {
    if (combo.value > 0) resetCombo()
    mistakePulse.value++
    sfx.play('mistake')
  }

  function handleInput(text: string) {
    typedText.value = text
    if (!isPlaying.value) return

    if (text === '') return

    const activeZombie = zombies.value.find((z) => z.active)
    if (activeZombie) {
      if (activeZombie.word === text) {
        if (activeZombie.remainingWords.length > 0) {
          const next = activeZombie.remainingWords.shift()
          if (next) activeZombie.word = next
          typedText.value = ''
          sfx.play('hit')
          return
        }
        killZombie(activeZombie.id)
        return
      }

      if (!activeZombie.word.startsWith(text)) registerMistake()
      else sfx.play('type')
      return
    }

    // Acquire target: nearest zombie that matches prefix
    let target: Zombie | undefined
    for (const z of zombies.value) {
      if (!z.word.startsWith(text)) continue
      if (!target || z.x < target.x) target = z
    }

    if (target) {
      setOnlyActiveZombie(target.id)
      sfx.play('type')
      return
    }

    registerMistake()
  }

  function maybeDropPowerUp() {
    if (powerUps.value.length >= 3) return

    const chance = clamp(0.08 + level.value * 0.01, 0.08, 0.18)
    if (Math.random() > chance) return

    const pool: PowerUpType[] = ['slow', 'auto', 'bomb', 'double']
    const pick = pool[randomInt(0, pool.length - 1)]
    if (!pick) return
    powerUps.value.push(pick)
    powerPulse.value++
    spawnPowerText(
      pick === 'slow'
        ? 'Slow Time!'
        : pick === 'auto'
          ? 'Auto-Type!'
          : pick === 'bomb'
            ? 'Bomb!'
            : 'Double Score!',
    )
    sfx.play('power')
  }

  function activatePowerUp(type: PowerUpType) {
    if (!isPlaying.value) return
    const idx = powerUps.value.indexOf(type)
    if (idx < 0) return

    powerUps.value.splice(idx, 1)
    powerPulse.value++

    if (type === 'slow') {
      slowUntilMs.value = Math.max(slowUntilMs.value, elapsedMs.value + 6000)
      spawnPowerText('Slow Time!')
      sfx.play('power')
      return
    }

    if (type === 'double') {
      doubleUntilMs.value = Math.max(doubleUntilMs.value, elapsedMs.value + 7000)
      spawnPowerText('Double Score!')
      sfx.play('power')
      return
    }

    if (type === 'auto') {
      spawnPowerText('Auto-Type!')
      autoTypeZombie()
      sfx.play('power')
      return
    }

    spawnPowerText('Bomb!')
    clearAllZombies()
    sfx.play('power')
  }

  function completeOneWord(z: Zombie) {
    if (z.remainingWords.length > 0) {
      const next = z.remainingWords.shift()
      if (next) z.word = next
      typedText.value = ''
      sfx.play('hit')
      return
    }

    killZombie(z.id, true)
  }

  function autoTypeZombie() {
    const active = zombies.value.find((z) => z.active)
    if (active) {
      completeOneWord(active)
      return
    }
    const nearest = zombies.value.reduce<Zombie | undefined>((best, z) => {
      if (!best || z.x < best.x) return z
      return best
    }, undefined)
    if (nearest) completeOneWord(nearest)
  }

  function clearAllZombies() {
    for (const z of zombies.value) spawnExplosion(z.x, z.y)
    zombies.value = []
    typedText.value = ''
  }

  function killZombie(id: string, auto = false) {
    const z = zombies.value.find((zz) => zz.id === id)
    if (!z) return

    spawnExplosion(z.x, z.y)
    killPulse.value++
    addScore(z.rewardBase, z.x, z.y)
    zombies.value = zombies.value.filter((zz) => zz.id !== id)
    typedText.value = ''

    increaseCombo()
    maybeDropPowerUp()

    if (!auto) sfx.play('kill')
  }

  function applyHit() {
    hitPulse.value++
    shakeTimeMs.value = 240

    if (shield.value > 0) {
      shield.value--
      spawnPowerText('Shield hit!')
      sfx.play('shield')
      return
    }

    health.value = Math.max(0, health.value - 1)
    resetCombo()
    sfx.play('hurt')

    if (health.value <= 0) gameOver()
  }

  function removeZombie(id: string) {
    zombies.value = zombies.value.filter((z) => z.id !== id)
  }

  function zombieReachedPlayer(id: string) {
    removeZombie(id)
    typedText.value = ''
    applyHit()
  }

  function pickZombieType() {
    const r = Math.random()
    const intensity = Math.max(level.value, difficulty.value)

    if (intensity >= 6 && r > 0.92) return 'tank' satisfies ZombieType
    if (intensity >= 3 && r > 0.72) return 'fast' satisfies ZombieType
    return 'normal' satisfies ZombieType
  }

  function spawnZombie(type?: ZombieType) {
    if (zombies.value.length >= maxZombies) return
    const chosen = type ?? pickZombieType()
    const intensity = Math.max(level.value, difficulty.value)
    const speedScale = 1 + (intensity - 1) * 0.045

    let maxWords = 1
    let remainingWords: string[] = []
    let word = pickWord(intensity, 3, 8)
    let size = 1
    let speed = 10
    let rewardBase = 10

    if (chosen === 'fast') {
      maxWords = 1
      word = pickWord(intensity + 1, 5, 12)
      speed = 15
      rewardBase = 12
      size = 0.95
    }

    if (chosen === 'tank') {
      maxWords = 2
      word = pickWord(intensity + 1, 5, 12)
      remainingWords = [pickWord(intensity + 1, 5, 12)]
      speed = 8.2
      rewardBase = 25
      size = 1.18
    }

    if (chosen === 'boss') {
      maxWords = 3
      word = pickWord(intensity + 2, 8, 18)
      remainingWords = [pickWord(intensity + 2, 8, 18), pickWord(intensity + 2, 8, 18)]
      speed = 6.8
      rewardBase = 80
      size = 1.6
    }

    const zombie: Zombie = {
      id: `z-${nextZombieId++}`,
      type: chosen,
      x: 100,
      y: pickLaneY(),
      speed: speed * speedScale,
      size,
      active: false,
      word,
      remainingWords,
      maxWords,
      rewardBase,
    }
    zombies.value.push(zombie)
  }

  function updateShake(dtMs: number) {
    if (shakeTimeMs.value <= 0) {
      shakeX.value = 0
      shakeY.value = 0
      return
    }

    shakeTimeMs.value = Math.max(0, shakeTimeMs.value - dtMs)
    const amp = clamp(shakeTimeMs.value / 240, 0, 1) * 0.9
    shakeX.value = (Math.random() * 2 - 1) * amp
    shakeY.value = (Math.random() * 2 - 1) * amp
  }

  function updateDifficulty() {
    const timeBased = 1 + Math.floor(elapsedMs.value / 25_000)
    difficulty.value = Math.max(difficulty.value, timeBased, level.value)
    gameSpeed.value = 1 + (difficulty.value - 1) * 0.03 + (level.value - 1) * 0.045
  }

  function spawnController(dtMs: number) {
    const intensity = Math.max(level.value, difficulty.value)
    const spawnEvery = clamp(1700 - intensity * 85 - level.value * 35, 420, 1700)
    spawnAccumulatorMs.value += dtMs

    let spawns = 0
    while (spawnAccumulatorMs.value >= spawnEvery && spawns < 3) {
      spawnAccumulatorMs.value -= spawnEvery
      spawnZombie()
      spawns++

      // Burst spawns at higher intensity
      if (intensity >= 7 && Math.random() > 0.88 && zombies.value.length < maxZombies) spawnZombie()
    }

    if (elapsedMs.value >= nextBossAtMs.value) {
      const hasBoss = zombies.value.some((z) => z.type === 'boss')
      if (!hasBoss && zombies.value.length <= maxZombies - 2) spawnZombie('boss')
      nextBossAtMs.value = elapsedMs.value + randomInt(30_000, 60_000)
    }
  }

  function updateZombiePositions(dtMs: number) {
    const slowFactor = isSlowActive.value ? 0.55 : 1
    const dt = dtMs / 1000
    const factor = gameSpeed.value * slowFactor

    for (const zombie of zombies.value) zombie.x -= zombie.speed * dt * factor

    const reached: string[] = []
    for (const z of zombies.value) {
      if (z.x <= playerHitX) reached.push(z.id)
    }
    for (const id of reached) zombieReachedPlayer(id)
  }

  function tick(dtMs: number) {
    if (!isPlaying.value) return
    elapsedMs.value += dtMs

    updateShake(dtMs)
    updateDifficulty()
    updateZombiePositions(dtMs)
    spawnController(dtMs)
  }

  function gameOver() {
    status.value = 'gameover'
    if (score.value > highScore.value) highScore.value = score.value
    sfx.play('gameover')
  }

  function resetRunState() {
    score.value = 0
    health.value = 3
    maxHealth.value = 3
    shield.value = 0

    zombies.value = []
    effects.value = []
    typedText.value = ''

    difficulty.value = 1
    level.value = 1

    combo.value = 0
    highestCombo.value = 0
    multiplier.value = 1
    streak.value = ''

    powerUps.value = []
    slowUntilMs.value = 0
    doubleUntilMs.value = 0
    gameSpeed.value = 1

    elapsedMs.value = 0
    spawnAccumulatorMs.value = 0
    nextBossAtMs.value = randomInt(30_000, 60_000)

    shakeTimeMs.value = 0
    shakeX.value = 0
    shakeY.value = 0

    nextZombieId = 0
    nextEffectId = 0
    clearEffectTimers()
  }

  function startGame() {
    resetRunState()
    status.value = 'playing'
    spawnZombie('normal')
  }

  function unlockAudio() {
    sfx.unlock()
  }

  function pauseGame() {
    if (status.value !== 'playing') return
    status.value = 'paused'
  }

  function resumeGame() {
    if (status.value !== 'paused') return
    status.value = 'playing'
  }

  function returnToMenu() {
    resetRunState()
    status.value = 'idle'
  }

  function levelUpCheat() {
    level.value++
    difficulty.value++
    levelPulse.value++
  }

  return {
    score,
    highScore,
    health,
    maxHealth,
    shield,
    zombies,
    effects,
    typedText,
    status,
    difficulty,
    level,
    combo,
    multiplier,
    streak,
    highestCombo,
    powerUps,
    zombieTypes,
    gameSpeed,
    shakeX,
    shakeY,
    scorePulse,
    comboPulse,
    levelPulse,
    mistakePulse,
    hitPulse,
    killPulse,
    powerPulse,
    isSlowActive,
    isDoubleActive,
    powerUpActive,
    isPlaying,
    isPaused,
    isGameOver,
    tick,
    spawnZombie,
    handleInput,
    activatePowerUp,
    clearAllZombies,
    autoTypeZombie,
    startGame,
    unlockAudio,
    pauseGame,
    resumeGame,
    returnToMenu,
    gameOver,
    levelUpCheat,
  }
})
