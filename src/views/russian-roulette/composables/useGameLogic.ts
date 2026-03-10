import { ref, watch } from 'vue'

import { createAudioController } from './useAudio'

export function useGameLogic() {
  const audio = createAudioController()

  const playerHp = ref(3)
  const aiHp = ref(3)
  const isIntro = ref(true)
  const showSettingsModal = ref(false)
  const isSoundOn = ref(true)
  const sfxVolume = ref(100)

  watch(sfxVolume, (val) => audio.setSfxVolume(Number(val)))
  watch(isSoundOn, (val) => audio.toggleSfx(val))

  const cylinder = ref<boolean[]>([])
  const isPlayerTurn = ref(true)
  const isBlackout = ref(false)
  const gameOver = ref(false)
  const winner = ref<string | null>(null)
  const turnMessage = ref('Đang chuẩn bị...')
  const liveAtReload = ref(0)
  const blankAtReload = ref(0)

  const isActionDisabled = ref(false)

  function shuffle(array: boolean[]) {
    let currentIndex = array.length,
      randomIndex
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--
      const temp = array[currentIndex]!
      array[currentIndex] = array[randomIndex]!
      array[randomIndex] = temp
    }
    return array
  }

  const reload = async () => {
    isActionDisabled.value = true
    turnMessage.value = 'Furina đang nạp đạn...'
    audio.playReloading()
    await new Promise((r) => setTimeout(r, 1500))

    const live = Math.floor(Math.random() * 3) + 1 // 1 to 3 live
    const blanks = Math.floor(Math.random() * 3) + 1 // 1 to 3 blanks
    liveAtReload.value = live
    blankAtReload.value = blanks

    const arr: boolean[] = []
    for (let i = 0; i < live; i++) arr.push(true)
    for (let i = 0; i < blanks; i++) arr.push(false)
    cylinder.value = shuffle(arr)

    turnMessage.value = `Đã nạp ${live} đạn thật, ${blanks} đạn rỗng.`
    await new Promise((r) => setTimeout(r, 2000))

    turnMessage.value = `Lượt của ${isPlayerTurn.value ? 'bạn' : 'Furina'}`
    isActionDisabled.value = false

    if (!isPlayerTurn.value && !gameOver.value) {
      setTimeout(aiTurn, 2500)
    }
  }

  const checkGameOver = () => {
    if (playerHp.value <= 0) {
      gameOver.value = true
      winner.value = 'AI'
      turnMessage.value = 'Bạn đã mất mạng...'
      return true
    } else if (aiHp.value <= 0) {
      gameOver.value = true
      winner.value = 'Player'
      turnMessage.value = 'Furina đã bị tiêu diệt!'
      return true
    }
    return false
  }

  const handleShoot = async (shooter: 'player' | 'ai', target: 'player' | 'ai') => {
    isActionDisabled.value = true

    const shooterName = shooter === 'player' ? 'Bạn' : 'Furina'
    let targetName = ''
    if (shooter === 'player') {
      targetName = target === 'player' ? 'bản thân mình' : 'Furina'
    } else {
      targetName = target === 'ai' ? 'bản thân nó' : 'bạn'
    }

    turnMessage.value = `${shooterName} đang chĩa súng vào ${targetName}...`
    await new Promise((r) => setTimeout(r, 1500))

    if (cylinder.value.length === 0) return

    const isLive = cylinder.value.pop()

    if (isLive) {
      // Đạn thật
      await audio.playPump()

      isBlackout.value = true
      turnMessage.value = 'ĐOÀNG! ĐẠN THẬT!'

      await new Promise((r) => setTimeout(r, 2500))

      await audio.playDefibrillator()

      if (target === 'player') playerHp.value -= 1
      else aiHp.value -= 1

      isBlackout.value = false

      // Bắn đạn thật thì lượt luôn được chuyển cho người kia
      isPlayerTurn.value = shooter === 'ai'
    } else {
      // Đạn rỗng
      await audio.playOutOfAmmo()
      turnMessage.value = 'CẠCH... Đạn rỗng.'
      await new Promise((r) => setTimeout(r, 1500))

      if (shooter === target) {
        // Bắn bản thân bằng đạn rỗng -> giữ lượt
        isPlayerTurn.value = shooter === 'player'
      } else {
        // Bắn đối thủ bằng đạn rỗng -> mất lượt
        isPlayerTurn.value = shooter === 'ai'
      }
    }

    if (checkGameOver()) return

    if (cylinder.value.length === 0) {
      await reload()
    } else {
      if (!gameOver.value) {
        turnMessage.value = `Lượt của ${isPlayerTurn.value ? 'bạn' : 'Furina'}`
        isActionDisabled.value = false
        if (!isPlayerTurn.value) {
          setTimeout(aiTurn, 2500)
        }
      }
    }
  }

  const playerShootSelf = async () => {
    if (!isPlayerTurn.value || isActionDisabled.value || gameOver.value) return
    await handleShoot('player', 'player')
  }

  const playerShootAI = async () => {
    if (!isPlayerTurn.value || isActionDisabled.value || gameOver.value) return
    await handleShoot('player', 'ai')
  }

  const aiTurn = async () => {
    if (gameOver.value || isPlayerTurn.value || cylinder.value.length === 0) return

    isActionDisabled.value = true
    turnMessage.value = 'Furina đang suy nghĩ...'
    await new Promise((r) => setTimeout(r, 2000))

    const target = Math.random() < 0.5 ? 'ai' : 'player'
    await handleShoot('ai', target)
  }

  const initIntro = async () => {
    await audio.warmUp()
    audio.setSfxVolume(sfxVolume.value)
    audio.toggleSfx(isSoundOn.value)
    audio.playIntroBgm()
  }

  const enterGame = async () => {
    // Đánh dấu đã qua màn hình intro
    isIntro.value = false
    // Dừng nhạc nền intro
    audio.stopBgm()

    await startNewGame()
  }

  const startNewGame = async () => {
    // Decode tất cả audio buffer sẵn để phát không bị trễ
    await audio.warmUp()

    playerHp.value = 3
    aiHp.value = 3
    isPlayerTurn.value = true
    gameOver.value = false
    winner.value = null
    cylinder.value = []

    await reload()
  }

  return {
    playerHp,
    aiHp,
    cylinder,
    isPlayerTurn,
    isBlackout,
    gameOver,
    winner,
    turnMessage,
    isActionDisabled,
    playerShootSelf,
    playerShootAI,
    isIntro,
    showSettingsModal,
    isSoundOn,
    sfxVolume,
    initIntro,
    enterGame,
    startNewGame,
    liveAtReload,
    blankAtReload,
    disposeAudio: audio.dispose,
  }
}
