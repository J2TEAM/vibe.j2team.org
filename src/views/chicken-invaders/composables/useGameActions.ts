import { watch } from 'vue'
import { sfx } from '../utils/audio'
import { GAME_WIDTH, GAME_HEIGHT, WEAPON_TYPES, FIRE_RATE } from '../utils/config'
import { getWeaponStats, arrangeFormation, getRotationForWave } from '../utils/utils'
import type { GameState } from './useGameState'
import type { useControls } from './useControls'
import type { Enemy } from '../utils/types'
import { vfx } from '../utils/vfx'

export function useGameActions(state: GameState, controls: ReturnType<typeof useControls>) {
  const {
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
    difficulty,
    leaderboard,
  } = state

  const { space, mousePressed, mobileKeys, pointerState, Escape } = controls

  const resumeGame = () => {
    if (gameState.value !== 'paused') return
    gameState.value = 'resuming'
    resumingCountdown.value = 3
    sfx.playTone(600, 600, 'square', 0.1, 0.1)

    resumeInterval.value = setInterval(() => {
      resumingCountdown.value--
      if (resumingCountdown.value > 0) {
        sfx.playTone(600, 600, 'square', 0.1, 0.1)
      } else {
        if (resumeInterval.value) clearInterval(resumeInterval.value)
        sfx.playTone(800, 800, 'square', 0.3, 0.1)
        gameState.value = 'playing'
        engine.lastFireTime = Date.now()
      }
    }, 1000)
  }

  const togglePause = () => {
    sfx.init()
    if (gameState.value === 'playing') gameState.value = 'paused'
    else if (gameState.value === 'paused') resumeGame()
    else if (gameState.value === 'resuming') {
      if (resumeInterval.value) clearInterval(resumeInterval.value)
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

  const addScore = (pts: number) => {
    // 1. ÁP DỤNG HỆ SỐ ĐIỂM THEO ĐỘ KHÓ (Cập nhật mốc 25k và 50k)
    let mult = 1
    let milestone = 10000

    if (difficulty.value === 'normal') {
      mult = 1.5
      milestone = 25000 // Đã sửa thành 25000
    } else if (difficulty.value === 'hard') {
      mult = 2
      milestone = 50000 // Đã sửa thành 50000
    } else if (difficulty.value === 'hardcore') {
      mult = 3
      milestone = Infinity
    }

    const actualPts = pts * mult
    const oldMilestone = Math.floor(score.value / milestone)
    score.value += actualPts
    const newMilestone = Math.floor(score.value / milestone)

    // CỘNG MẠNG NẾU QUA MỐC
    if (newMilestone > oldMilestone && difficulty.value !== 'hardcore') {
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
    if (lives.value <= 0) {
      gameState.value = 'gameover'

      // ---> LƯU LEADERBOARD KHI CHẾT <---
      leaderboard.value.push({
        score: score.value,
        wave: currentWave.value,
        difficulty: difficulty.value,
        date: Date.now(),
      })
      // Sắp xếp điểm từ cao xuống thấp và lấy top 10
      leaderboard.value.sort((a, b) => b.score - a.score)
      leaderboard.value = leaderboard.value.slice(0, 10)
      localStorage.setItem('chicken_invaders_leaderboard', JSON.stringify(leaderboard.value))
    }
  }

  const startWave = (wave: number) => {
    bullets.value = []
    enemyBullets.value = []
    activeDots.value = []
    bgHue.value = (Math.floor((wave - 1) / 10) * 45) % 360

    // TÍNH TOÁN HP VÀ TỐC ĐỘ BẮN THEO ĐỘ KHÓ
    let hpMult = 1
    let eggRateMult = 1
    if (difficulty.value === 'normal') {
      hpMult = 1.5
      eggRateMult = 1.5
    } else if (difficulty.value === 'hard' || difficulty.value === 'hardcore') {
      hpMult = 2
      eggRateMult = 2
    }

    engine.waveEnemySpeed =
      Math.min(1.2 + wave * 0.02, 4.0) * (difficulty.value !== 'easy' ? 1.2 : 1)
    engine.waveEggFireRate = Math.min(0.005 + wave * 0.0002, 0.02) * eggRateMult

    const SHIRT_COLORS = [
      '#ef4444',
      '#3b82f6',
      '#22c55e',
      '#a855f7',
      '#facc15',
      '#ec4899',
      '#06b6d4',
    ]
    const unlockedCount = Math.min(1 + Math.floor((wave - 1) / 10), SHIRT_COLORS.length)
    const availableColors = SHIRT_COLORS.slice(0, unlockedCount)
    const getRandomColor = () => availableColors[Math.floor(Math.random() * availableColors.length)]

    if (hiddenEventWavesLeft.value > 0) hiddenEventWavesLeft.value--
    if (hiddenEventWavesLeft.value === 0 && wave > 30 && wave % 10 === 6 && Math.random() < 0.1)
      hiddenEventWavesLeft.value = 4

    const isMeteorZone = wave % 100 >= 71 && wave % 100 <= 79
    const isFallingChickenZone = wave % 10 === 8 && !isMeteorZone
    const isNormalMeteorZone = wave % 10 === 5 && !isMeteorZone

    engine.pendingSpawns = []
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

      const baseHp = (1000 + wave * 400) * hpMult

      if (bType === 1) {
        bosses.value.push({
          id: `boss-${engine.objCounter++}`,
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
          id: `boss-${engine.objCounter++}`,
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
          id: `boss-${engine.objCounter++}`,
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
      engine.hazardSpawnCooldown = 0
      let count = 0
      if (isMeteorZone) count = Math.floor(Math.random() * 31) + 50
      else if (isFallingChickenZone) count = 20 + Math.floor(wave / 2)
      else count = Math.floor(Math.random() * 31) + 50

      for (let i = 0; i < count; i++) {
        const size = isFallingChickenZone ? 45 : 40 + Math.random() * 40
        let dx = 0,
          dy = engine.waveEnemySpeed * 1.4
        if (isMeteorZone) {
          const rand = Math.random()
          if (rand < 0.33) dx = -(engine.waveEnemySpeed * 1.0)
          else if (rand < 0.66) dx = engine.waveEnemySpeed * 1.0
          dy = engine.waveEnemySpeed * 1.6
        } else if (isFallingChickenZone) {
          dy = 2.0 * 0.7
        }

        const startX = isMeteorZone
          ? Math.random() * (activeWidth.value * 2) - activeWidth.value / 2
          : Math.random() * (activeWidth.value - size)
        engine.pendingSpawns.push({
          id: `falling-${engine.objCounter++}`,
          x: startX,
          y: -100 - Math.random() * 50,
          width: size,
          height: size,
          hp: (40 + wave * 5) * hpMult,
          maxHp: (40 + wave * 5) * hpMult,
          isMeteor: !isFallingChickenZone,
          isFallingChicken: isFallingChickenZone,
          shirtColor: isFallingChickenZone ? getRandomColor() : undefined,
          dx,
          dy,
        })
      }
      return
    }

    gamePhase.value = 'minions'
    engine.enemyDirection = 1
    const minionHp = (wave === 1 ? 10 : 15 + wave * 10) * hpMult
    const generatedMinions: Enemy[] = []

    if (wave % 10 === 6) {
      for (let i = 0; i < 15; i++)
        generatedMinions.push({
          id: `dyn-${engine.objCounter++}`,
          x: activeWidth.value / 2,
          y: -200,
          width: 40,
          height: 40,
          hp: minionHp,
          maxHp: minionHp,
          isStash: i === 0,
          shirtColor: getRandomColor(),
          targetOffsetX: 0,
          targetOffsetY: 0,
        })
      engine.formationType = 0
      engine.formationTimer = 200
      engine.formationCenter.x = activeWidth.value / 2
      engine.formationCenter.y = 150
      engine.formationCenter.dx = 1
      arrangeFormation(generatedMinions, engine.formationType)
    } else if (wave % 10 === 4 || wave % 10 === 9) {
      const isX = wave % 10 === 4
      const size = 5
      const startX = activeWidth.value / 2
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (isX) {
            if (r === c || r + c === size - 1)
              generatedMinions.push({
                id: `enemy-${engine.objCounter++}`,
                x: startX + (c - size / 2) * 60,
                y: -200 - r * 60,
                targetY: 80 + r * 50,
                width: 40,
                height: 40,
                hp: minionHp,
                maxHp: minionHp,
                shirtColor: getRandomColor(),
              })
          } else {
            if (
              Math.abs(r - Math.floor(size / 2)) + Math.abs(c - Math.floor(size / 2)) <=
              Math.floor(size / 2) + 1
            )
              generatedMinions.push({
                id: `enemy-${engine.objCounter++}`,
                x: startX + (c - size / 2) * 60,
                y: -200 - r * 60,
                targetY: 80 + r * 50,
                width: 40,
                height: 40,
                hp: minionHp,
                maxHp: minionHp,
                shirtColor: getRandomColor(),
              })
          }
        }
      }

      if (generatedMinions[0]) {
        if (wave % 10 === 4) {
          generatedMinions[0].isStash = true
        } else if (wave % 10 === 9) {
          if (difficulty.value === 'easy') {
            generatedMinions[0].isStash = true
          } else {
            const bossTier = Math.floor(wave / 10) + 1
            if (weaponLevel.value <= bossTier) {
              generatedMinions[0].isStash = true
            }
          }
        }
      }
    } else if (wave % 10 === 3) {
      if (Math.random() > 0.5) {
        for (let i = 0; i < 14; i++)
          generatedMinions.push({
            id: `enemy-${engine.objCounter++}`,
            x: activeWidth.value / 2 - 20 + 160 * Math.cos((Math.PI * 2 * i) / 14),
            y: -200 - i * 30,
            targetY: 240 + 160 * Math.sin((Math.PI * 2 * i) / 14),
            width: 40,
            height: 40,
            hp: minionHp,
            maxHp: minionHp,
            shirtColor: getRandomColor(),
          })
      } else {
        for (let i = 0; i < 11; i++)
          generatedMinions.push({
            id: `enemy-${engine.objCounter++}`,
            x: activeWidth.value / 2 - 20 + (i - 5) * 65,
            y: -100 - Math.abs(i - 5) * 60,
            targetY: 80 + Math.abs(i - 5) * 55,
            width: 40,
            height: 40,
            hp: minionHp,
            maxHp: minionHp,
            shirtColor: getRandomColor(),
          })
      }
    } else {
      const rows = Math.min(3 + Math.floor(wave / 4), 5)
      const cols = Math.min(8 + Math.floor(wave / 3), 12)
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (wave % 10 === 7 && row === Math.floor(rows / 2) && col === Math.floor(cols / 2)) {
            generatedMinions.push({
              id: `stash-${engine.objCounter++}`,
              x: (activeWidth.value - cols * 50) / 2 + col * 50,
              y: -100 - (rows - row) * 80,
              targetY: 60 + row * 45,
              width: 90,
              height: 85,
              hp: minionHp * 15,
              maxHp: minionHp * 15,
              isStash: true,
            })
            continue
          }
          if (
            wave % 10 === 7 &&
            (row === Math.floor(rows / 2) || row === Math.floor(rows / 2) + 1) &&
            (col === Math.floor(cols / 2) || col === Math.floor(cols / 2) + 1)
          )
            continue
          generatedMinions.push({
            id: `enemy-${engine.objCounter++}`,
            x: (activeWidth.value - cols * 50) / 2 + col * 50,
            y: -100 - (rows - row) * 80,
            targetY: 60 + row * 45,
            width: 40,
            height: 40,
            hp: minionHp,
            maxHp: minionHp,
            isStash: false,
            shirtColor: getRandomColor(),
          })
        }
      }
    }
    engine.pendingSpawns = generatedMinions
  }

  const startGame = () => {
    sfx.init()
    gameState.value = 'starting'
    engine.isTransitioningWave = true
    waveAnnouncement.value = 'WAVE 1'
    setTimeout(() => {
      gameState.value = 'playing'
      startWave(1)
      waveAnnouncement.value = ''
      engine.isTransitioningWave = false
    }, 2000)
  }

  const initGame = () => {
    currentWave.value = 1
    weaponType.value = 0
    weaponLevel.value = 1
    score.value = 0

    // MẠNG KHỞI ĐẦU THEO ĐỘ KHÓ
    if (difficulty.value === 'hardcore') lives.value = 1
    else lives.value = 3

    bullets.value = []
    enemyBullets.value = []
    powerUps.value = []
    engine.pendingSpawns = []
    activeDots.value = []
    enemies.value = []
    bosses.value = []

    isRotating.value = false
    boardRotation.value = getRotationForWave(1)
    activeWidth.value = GAME_WIDTH
    activeHeight.value = GAME_HEIGHT
    player.value.x = activeWidth.value / 2 - 30
    player.value.y = activeHeight.value - 90
    player.value.invulnerable = 0
    engine.isTransitioningWave = false
    waveAnnouncement.value = ''
    hiddenEventWavesLeft.value = 0

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

    const isTap = isFiring && !engine.wasSpaceDown
    const wType = weaponType.value
    if (wType === 6 || wType === 5) return

    let currentFireRate = FIRE_RATE
    if (wType === 0 || wType === 3) currentFireRate = isTap ? 80 : 350
    if (wType === 8) currentFireRate = 800

    if (Date.now() - engine.lastFireTime < currentFireRate) return

    sfx.shoot()
    const cx = player.value.x + player.value.width / 2
    const cy = player.value.y
    const wConfig = WEAPON_TYPES[wType]
    if (!wConfig) return

    const { rays, damage } = getWeaponStats(wType, weaponLevel.value)

    for (let i = 0; i < rays; i++) {
      const offsetIndex = i - (rays - 1) / 2
      let dx = 0,
        dy = -(wConfig.speed || 10),
        offsetX = 0,
        bulletWidth = wConfig.size || 10,
        bulletHeight = 20,
        bulletY = cy,
        rotation = 0

      switch (wConfig.type) {
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
          bulletHeight = (wConfig.size || 10) * 2
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
        case 'gray':
          rotation = offsetIndex * 4 + (Math.random() - 0.5) * 10
          dx = offsetIndex * 1.5 + (Math.random() - 0.5) * 2
          dy = -(wConfig.speed || 15) + Math.random() * 4
          offsetX = offsetIndex * 8
          bulletHeight = 16
          bulletWidth = wConfig.size || 8
          break
      }
      bullets.value.push({
        id: `b-${engine.objCounter++}-${Math.random()}`,
        x: cx + offsetX - bulletWidth / 2,
        y: bulletY,
        width: bulletWidth,
        height: bulletHeight,
        dx,
        dy,
        color: wConfig.color || '',
        shape: wConfig.shape || '',
        damage,
        rotation,
        hitTargets: new Set(),
      })
      if (wConfig.type === 'yellow' || wConfig.type === 'orange') break
    }
    engine.lastFireTime = Date.now()
  }

  const handleEnemyDeath = (enemy: Enemy, ptMult: number) => {
    const cx = enemy.x + enemy.width / 2
    const cy = enemy.y + enemy.height / 2
    if (enemy.isMeteor) vfx.spawnDebris(cx, cy, '#ea580c')
    else if (enemy.isStash) vfx.spawnExplosion(cx, cy, '#cbd5e1')
    else vfx.spawnFeathers(cx, cy, enemy.shirtColor || '#ef4444')

    sfx.explode()

    // GIẢM TỶ LỆ RỚT VŨ KHÍ TÙY THEO ĐỘ KHÓ
    let dropRate = enemy.isMeteor ? 0.012 : 0.12
    if (difficulty.value === 'normal')
      dropRate *= 0.4 // Đã giảm từ 0.6 xuống 0.4
    else if (difficulty.value === 'hard' || difficulty.value === 'hardcore') dropRate *= 0.2 // Giảm Khó xuống 0.2 cho gắt

    if (enemy.isStash) {
      powerUps.value.push({
        id: engine.objCounter++,
        x: enemy.x + enemy.width / 2 - 18,
        y: enemy.y + enemy.height / 2 - 18,
        width: 36,
        height: 36,
        wType: -1,
      })
    } else if (!enemy.isHazard) {
      if (Math.random() < dropRate)
        powerUps.value.push({
          id: engine.objCounter++,
          x: enemy.x + enemy.width / 2 - 18,
          y: enemy.y + enemy.height / 2 - 18,
          width: 36,
          height: 36,
          wType: Math.random() < 0.4 ? -1 : Math.floor(Math.random() * WEAPON_TYPES.length),
        })
    }

    const idx = enemies.value.findIndex((e) => e.id === enemy.id)
    if (idx !== -1) enemies.value.splice(idx, 1)

    addScore((enemy.isStash ? 100 : enemy.isMeteor ? 20 : 10) * ptMult)
  }

  return {
    togglePause,
    toggleMute,
    resumeGame,
    addScore,
    takeDamage,
    startWave,
    startGame,
    initGame,
    fireBullets,
    handleEnemyDeath,
  }
}

export type GameActions = ReturnType<typeof useGameActions>
