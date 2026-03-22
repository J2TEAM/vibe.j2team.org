import { watch } from 'vue'
import { sfx } from '../utils/audio'
import { GAME_WIDTH, GAME_HEIGHT, WEAPON_TYPES, FIRE_RATE } from '../utils/config'
import { getWeaponStats, arrangeFormation, getRotationForWave } from '../utils/utils'
import { getCampaignBosses } from '../utils/campaign'
import type { GameState } from './useGameState'
import type { useControls } from './useControls'
import type { Enemy, SaveSlot } from '../utils/types'
import { vfx } from '../utils/vfx'

export function useGameActions(state: GameState, controls: ReturnType<typeof useControls>) {
  const {
    gameState,
    gamePhase,
    gameMode,
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
    saves,
    currentSaveId,
    showNotification,
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
    let mult = 1,
      milestone = 10000
    if (difficulty.value === 'normal') {
      mult = 1.5
      milestone = 25000
    } else if (difficulty.value === 'hard') {
      mult = 2
      milestone = 50000
    } else if (difficulty.value === 'hardcore') {
      mult = 3
      milestone = Infinity
    }

    const actualPts = pts * mult
    const oldMilestone = Math.floor(score.value / milestone)
    score.value += actualPts
    const newMilestone = Math.floor(score.value / milestone)

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
      leaderboard.value.push({
        score: score.value,
        wave: currentWave.value,
        difficulty: difficulty.value,
        mode: gameMode.value,
        date: Date.now(),
      })
      leaderboard.value.sort((a, b) => b.score - a.score)
      leaderboard.value = leaderboard.value.slice(0, 100)

      localStorage.setItem('chicken_invaders_leaderboard', JSON.stringify(leaderboard.value))

      if (currentSaveId.value) {
        saves.value = saves.value.filter((s) => s.id !== currentSaveId.value)
        localStorage.setItem('chicken_invaders_saves', JSON.stringify(saves.value))
        currentSaveId.value = null
      }
    }
  }

  const startWave = (wave: number) => {
    // Luôn giữ background scale là 1 (không dùng CSS transform nữa)
    globalScale.value = 1.0

    // CHỈ THU NHỎ KÍCH THƯỚC PHI THUYỀN (PLAYER) XUỐNG CÒN 30x30 Ở MÀN 120
    if (gameMode.value === 'campaign' && wave === 120) {
      player.value.width = 30
      player.value.height = 30
    } else {
      player.value.width = 60
      player.value.height = 60
    }

    bullets.value = []
    enemyBullets.value = []
    activeDots.value = []
    bgHue.value = (Math.floor((wave - 1) / 10) * 45) % 360
    engine.hasSpawnedBoss = false

    let hpMult = 1,
      eggRateMult = 1
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

    if (hiddenEventWavesLeft.value > 0) hiddenEventWavesLeft.value--
    if (hiddenEventWavesLeft.value === 0 && wave > 30 && wave % 10 === 6 && Math.random() < 0.1)
      hiddenEventWavesLeft.value = 4

    const isMeteorZone = wave % 100 >= 71 && wave % 100 <= 79
    const isFallingChickenZone = wave % 10 === 8 && !isMeteorZone
    const isNormalMeteorZone = wave % 10 === 5 && !isMeteorZone

    engine.pendingSpawns = []
    enemies.value = []

    // XỬ LÝ BOSS
    if (wave % 10 === 0) {
      gamePhase.value = 'boss'
      engine.hasSpawnedBoss = true

      if (gameMode.value === 'campaign') {
        bosses.value = getCampaignBosses(wave, activeWidth.value, hpMult, engine)
      } else {
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
      }
      return
    }

    if (isMeteorZone || isFallingChickenZone || isNormalMeteorZone) {
      gamePhase.value = 'meteors'
      engine.hazardSpawnCooldown = 0
      const count = isMeteorZone
        ? Math.floor(Math.random() * 31) + 50
        : isFallingChickenZone
          ? 20 + Math.floor(wave / 2)
          : Math.floor(Math.random() * 31) + 50

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
        const SHIRT_COLORS = [
          '#ef4444',
          '#3b82f6',
          '#22c55e',
          '#a855f7',
          '#facc15',
          '#ec4899',
          '#06b6d4',
        ]
        const availableColors = SHIRT_COLORS.slice(
          0,
          Math.min(1 + Math.floor((wave - 1) / 10), SHIRT_COLORS.length),
        )

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
          shirtColor: isFallingChickenZone
            ? availableColors[Math.floor(Math.random() * availableColors.length)]
            : undefined,
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
        if (wave % 10 === 4) generatedMinions[0].isStash = true
        else if (wave % 10 === 9) {
          if (difficulty.value === 'easy') generatedMinions[0].isStash = true
          else if (weaponLevel.value <= Math.floor(wave / 10) + 1)
            generatedMinions[0].isStash = true
        }
      }
    } else if (wave % 10 === 3) {
      if (Math.random() > 0.5) {
        const radius = activeWidth.value < 800 ? 120 : 160
        for (let i = 0; i < 14; i++)
          generatedMinions.push({
            id: `enemy-${engine.objCounter++}`,
            x: activeWidth.value / 2 - 20 + radius * Math.cos((Math.PI * 2 * i) / 14),
            y: -200 - i * 30,
            targetY: 240 + radius * Math.sin((Math.PI * 2 * i) / 14),
            width: 40,
            height: 40,
            hp: minionHp,
            maxHp: minionHp,
            shirtColor: getRandomColor(),
          })
      } else {
        const spacingX = activeWidth.value < 800 ? 45 : 65
        for (let i = 0; i < 11; i++)
          generatedMinions.push({
            id: `enemy-${engine.objCounter++}`,
            x: activeWidth.value / 2 - 20 + (i - 5) * spacingX,
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
      const maxCols = activeWidth.value < 800 ? 10 : 12
      const cols = Math.min(8 + Math.floor(wave / 3), maxCols)
      const spacingX = activeWidth.value < 800 ? 45 : 50

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (wave % 10 === 7 && row === Math.floor(rows / 2) && col === Math.floor(cols / 2)) {
            generatedMinions.push({
              id: `stash-${engine.objCounter++}`,
              x: (activeWidth.value - cols * spacingX) / 2 + col * spacingX,
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
            x: (activeWidth.value - cols * spacingX) / 2 + col * spacingX,
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

    function getRandomColor() {
      const SHIRT_COLORS = [
        '#ef4444',
        '#3b82f6',
        '#22c55e',
        '#a855f7',
        '#facc15',
        '#ec4899',
        '#06b6d4',
      ]
      const availableColors = SHIRT_COLORS.slice(
        0,
        Math.min(1 + Math.floor((wave - 1) / 10), SHIRT_COLORS.length),
      )
      return availableColors[Math.floor(Math.random() * availableColors.length)]
    }
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

  const initGame = (isLoading = false) => {
    if (!isLoading) {
      currentWave.value = 1
      weaponType.value = 0
      weaponLevel.value = 1
      score.value = 0
      currentSaveId.value = null

      if (difficulty.value === 'hardcore') lives.value = 1
      else lives.value = 3
    }

    bullets.value = []
    enemyBullets.value = []
    powerUps.value = []
    engine.pendingSpawns = []
    activeDots.value = []
    enemies.value = []
    bosses.value = []

    isRotating.value = false
    boardRotation.value = getRotationForWave(currentWave.value)
    if (Math.abs(boardRotation.value % 180) === 90) {
      activeWidth.value = GAME_HEIGHT
      activeHeight.value = GAME_WIDTH
    } else {
      activeWidth.value = GAME_WIDTH
      activeHeight.value = GAME_HEIGHT
    }
    player.value.x = activeWidth.value / 2 - 30
    player.value.y = activeHeight.value - 90
    player.value.invulnerable = 0
    engine.isTransitioningWave = false
    engine.hasSpawnedBoss = false
    waveAnnouncement.value = ''
    hiddenEventWavesLeft.value = 0

    if (!isLoading) startGame()
  }

  const saveCurrentGame = () => {
    const newSave: SaveSlot = {
      id: currentSaveId.value || Date.now().toString(),
      name: `Wave ${currentWave.value} - ${difficulty.value.toUpperCase()} [${gameMode.value === 'campaign' ? 'CD' : 'VT'}]`,
      date: Date.now(),
      score: score.value,
      lives: lives.value,
      currentWave: currentWave.value,
      weaponType: weaponType.value,
      weaponLevel: weaponLevel.value,
      difficulty: difficulty.value,
      gameMode: gameMode.value, // LƯU MODE
    }
    const idx = saves.value.findIndex((s) => s.id === newSave.id)
    if (idx !== -1) saves.value[idx] = newSave
    else {
      if (saves.value.length >= 10) {
        saves.value.sort((a, b) => a.date - b.date)
        saves.value.shift()
      }
      saves.value.push(newSave)
    }
    currentSaveId.value = newSave.id
    localStorage.setItem('chicken_invaders_saves', JSON.stringify(saves.value))
    showNotification('✅ ĐÃ LƯU GAME THÀNH CÔNG!')
  }

  const surrenderGame = () => {
    lives.value = 0
    gameState.value = 'gameover'

    leaderboard.value.push({
      score: score.value,
      wave: currentWave.value,
      difficulty: difficulty.value,
      mode: gameMode.value,
      date: Date.now(),
    })
    leaderboard.value.sort((a, b) => b.score - a.score)
    leaderboard.value = leaderboard.value.slice(0, 100)

    localStorage.setItem('chicken_invaders_leaderboard', JSON.stringify(leaderboard.value))

    if (currentSaveId.value) {
      saves.value = saves.value.filter((s) => s.id !== currentSaveId.value)
      localStorage.setItem('chicken_invaders_saves', JSON.stringify(saves.value))
      currentSaveId.value = null
    }

    if (gameMode.value === 'campaign') {
      showNotification('🏳️ BẠN ĐÃ ĐẦU HÀNG!')
    } else {
      showNotification('🛑 ĐÃ KẾT THÚC LƯỢT CHƠI!')
    }
  }

  const loadGame = (save: SaveSlot) => {
    currentSaveId.value = save.id
    difficulty.value = save.difficulty
    currentWave.value = save.currentWave
    gameMode.value = save.gameMode || 'endless'

    initGame(true)
    score.value = save.score
    lives.value = save.lives
    weaponType.value = save.weaponType
    weaponLevel.value = save.weaponLevel

    sfx.init()
    gameState.value = 'starting'
    engine.isTransitioningWave = true
    waveAnnouncement.value = `WAVE ${currentWave.value}`
    showNotification('✅ ĐÃ TẢI GAME THÀNH CÔNG!')

    setTimeout(() => {
      gameState.value = 'playing'
      startWave(currentWave.value)
      waveAnnouncement.value = ''
      engine.isTransitioningWave = false
      engine.lastFireTime = Date.now()
    }, 2000)
  }

  const deleteSave = (id: string) => {
    saves.value = saves.value.filter((s) => s.id !== id)
    localStorage.setItem('chicken_invaders_saves', JSON.stringify(saves.value))
    if (currentSaveId.value === id) currentSaveId.value = null
    showNotification('🗑️ ĐÃ XOÁ BẢN LƯU VĨNH VIỄN!')
  }

  const exportSaves = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(saves.value))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', 'chicken_invaders_saves.json')
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const importSaves = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    if (file.size > 100 * 1024) {
      showNotification('❌ FILE QUÁ LỚN! TỐI ĐA 100KB.')
      target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedSaves = JSON.parse(content)

        if (Array.isArray(importedSaves)) {
          let merged = [...saves.value]

          importedSaves.forEach((imported) => {
            if (
              imported &&
              typeof imported.id === 'string' &&
              typeof imported.name === 'string' &&
              typeof imported.date === 'number' &&
              typeof imported.score === 'number' &&
              typeof imported.lives === 'number' &&
              typeof imported.currentWave === 'number' &&
              typeof imported.weaponType === 'number' &&
              typeof imported.weaponLevel === 'number' &&
              ['easy', 'normal', 'hard', 'hardcore'].includes(imported.difficulty)
            ) {
              const safeName = imported.name
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .substring(0, 40)
              const safeSave: SaveSlot = {
                id: imported.id,
                name: safeName,
                date: imported.date,
                score: Math.max(0, imported.score),
                lives: Math.max(1, imported.lives),
                currentWave: Math.max(1, imported.currentWave),
                weaponType: Math.min(Math.max(0, imported.weaponType), WEAPON_TYPES.length - 1),
                weaponLevel: Math.max(1, imported.weaponLevel),
                difficulty: imported.difficulty as 'easy' | 'normal' | 'hard' | 'hardcore',
                gameMode: imported.gameMode === 'campaign' ? 'campaign' : 'endless', // Giữ mode
              }
              const idx = merged.findIndex((s) => s.id === safeSave.id)
              if (idx !== -1) merged[idx] = safeSave
              else merged.push(safeSave)
            }
          })

          merged.sort((a, b) => b.date - a.date)
          merged = merged.slice(0, 10)
          saves.value = merged
          localStorage.setItem('chicken_invaders_saves', JSON.stringify(saves.value))
          showNotification('✅ ĐÃ NẠP DỮ LIỆU LƯU TRỮ THÀNH CÔNG!')
        } else {
          showNotification('❌ FILE KHÔNG ĐÚNG ĐỊNH DẠNG!')
        }
      } catch {
        showNotification('❌ LỖI ĐỌC FILE DỮ LIỆU!')
      }
      target.value = ''
    }
    reader.readAsText(file)
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
    if (wType === 9) currentFireRate = isTap ? 250 : 500

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

    let dropRate = enemy.isMeteor ? 0.012 : 0.12
    if (difficulty.value === 'normal') dropRate *= 0.4
    else if (difficulty.value === 'hard' || difficulty.value === 'hardcore') dropRate *= 0.2

    if (enemy.isStash)
      powerUps.value.push({
        id: engine.objCounter++,
        x: enemy.x + enemy.width / 2 - 18,
        y: enemy.y + enemy.height / 2 - 18,
        width: 36,
        height: 36,
        wType: -1,
      })
    else if (!enemy.isHazard) {
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
    saveCurrentGame,
    loadGame,
    deleteSave,
    exportSaves,
    importSaves,
    surrenderGame,
  }
}

export type GameActions = ReturnType<typeof useGameActions>
