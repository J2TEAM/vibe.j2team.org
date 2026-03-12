import { ref, watch } from 'vue'

import { createAudioController } from './useAudio'
import { getAIDecision, getAIItemDecision, type AIDifficulty } from './useAI'

// --- Kiểu vật phẩm ---
export type ItemType = 'cigarette' | 'beer' | 'magnifying_glass' | 'handcuffs' | 'handsaw'

// Tối đa 8 ô vật phẩm mỗi bên
const MAX_ITEMS = 6
const MAX_HP = 5

export function useGameLogic() {
  const audio = createAudioController()

  // Mức độ khó của AI
  const aiDifficulty = ref<AIDifficulty>('normal')

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

  // --- State vật phẩm ---
  const playerItems = ref<ItemType[]>([])
  const aiItems = ref<ItemType[]>([])

  // Còng tay: đối thủ bị mất lượt tiếp theo
  const isPlayerHandcuffed = ref(false)
  const isAiHandcuffed = ref(false)

  // Cưa sắt: viên đạn thật tiếp theo gây x2 sát thương
  const isSawedOff = ref(false)

  // Hiệu ứng kính lúp: hiển thị viên đạn tiếp theo trong 2 giây
  const peekedBullet = ref<boolean | null>(null) // true = đạn thật, false = đạn rỗng, null = chưa peek

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

  /**
   * Cấp ngẫu nhiên 1-3 vật phẩm cho một bên (nếu còn ô trống)
   * Số lượng giảm dần nếu đang có nhiều vật phẩm
   */
  function generateItems(currentItems: ItemType[]): ItemType[] {
    const slotsAvailable = MAX_ITEMS - currentItems.length
    if (slotsAvailable <= 0) return currentItems

    const maxPotential = Math.max(1, 3 - Math.floor(currentItems.length / 2))
    const count = Math.min(Math.floor(Math.random() * maxPotential) + 1, slotsAvailable)
    const newItems = [...currentItems]
    for (let i = 0; i < count; i++) {
      // Xác suất: Beer 30%, Glass 30%, Saw 10%, Còng tay 20%, Thuốc lá 10%
      const r = Math.random() * 100
      let randomItem: ItemType
      if (r < 30) {
        randomItem = 'beer'
      } else if (r < 60) {
        randomItem = 'magnifying_glass'
      } else if (r < 70) {
        randomItem = 'handsaw'
      } else if (r < 90) {
        randomItem = 'handcuffs'
      } else {
        randomItem = 'cigarette'
      }
      newItems.push(randomItem)
    }
    return newItems
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

    // Reset hiệu ứng cưa sắt mỗi lần reload
    isSawedOff.value = false
    peekedBullet.value = null

    // Cấp vật phẩm ngẫu nhiên cho cả hai bên
    playerItems.value = generateItems(playerItems.value)
    aiItems.value = generateItems(aiItems.value)

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

    // Reset peek khi bắn
    peekedBullet.value = null

    if (isLive) {
      // Đạn thật — dùng âm thanh super shotgun nếu đã cưa nòng
      if (isSawedOff.value) {
        await audio.playSuperShotgun()
        await new Promise((r) => setTimeout(r, 1500))
      } else {
        await audio.playPump()
      }

      isBlackout.value = true

      // Tính sát thương: nếu cưa sắt đang kích hoạt → x2
      const damage = isSawedOff.value ? 2 : 1
      const damageText = isSawedOff.value ? 'ĐOÀNG! ĐẠN THẬT! (x2 SÁT THƯƠNG!)' : 'ĐOÀNG! ĐẠN THẬT!'
      turnMessage.value = damageText

      await new Promise((r) => setTimeout(r, 2500))

      await audio.playDefibrillator()

      if (target === 'player') playerHp.value -= damage
      else aiHp.value -= damage

      isBlackout.value = false

      // Reset cưa sắt sau khi bắn đạn thật (đã dùng hiệu ứng)
      isSawedOff.value = false

      // Bắn đạn thật thì lượt luôn được chuyển cho người kia
      isPlayerTurn.value = shooter === 'ai'
    } else {
      // Đạn rỗng
      await audio.playOutOfAmmo()
      turnMessage.value = 'CẠCH... Đạn rỗng.'
      await new Promise((r) => setTimeout(r, 1500))

      // Reset cưa sắt khi bắn đạn rỗng (hiệu ứng mất tác dụng)
      isSawedOff.value = false

      if (shooter === target) {
        // Bắn bản thân bằng đạn rỗng -> giữ lượt
        isPlayerTurn.value = shooter === 'player'
      } else {
        // Bắn đối thủ bằng đạn rỗng -> mất lượt
        isPlayerTurn.value = shooter === 'ai'
      }
    }

    if (checkGameOver()) return

    // Xử lý còng tay: nếu người sắp được lượt đang bị còng → bỏ qua lượt
    if (isPlayerTurn.value && isPlayerHandcuffed.value) {
      isPlayerHandcuffed.value = false
      turnMessage.value = 'Bạn bị còng tay! Bỏ qua lượt...'
      await new Promise((r) => setTimeout(r, 1500))
      isPlayerTurn.value = false
    } else if (!isPlayerTurn.value && isAiHandcuffed.value) {
      isAiHandcuffed.value = false
      turnMessage.value = 'Furina bị còng tay! Bỏ qua lượt...'
      await new Promise((r) => setTimeout(r, 1500))
      isPlayerTurn.value = true
    }

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

  /**
   * Sử dụng vật phẩm
   * @param item Loại vật phẩm
   * @param user 'player' hoặc 'ai'
   */
  const useItem = async (item: ItemType, user: 'player' | 'ai') => {
    const items = user === 'player' ? playerItems : aiItems

    // Xác nhận vật phẩm tồn tại
    const idx = items.value.indexOf(item)
    if (idx === -1) return

    // Xóa vật phẩm khỏi inventory
    items.value.splice(idx, 1)

    switch (item) {
      case 'cigarette': {
        // Hồi 1 HP (có thể vượt quá mức)
        audio.playCigarette()
        if (user === 'player') {
          if (playerHp.value < MAX_HP) {
            playerHp.value += 1
            turnMessage.value = 'Bạn hút một điếu thuốc... Hồi 1 HP!'
          } else {
            turnMessage.value = 'Bạn hút thuốc... Nhưng máu đã đạt tối đa!'
          }
        } else {
          if (aiHp.value < MAX_HP) {
            aiHp.value += 1
            turnMessage.value = 'Furina hút thuốc... Hồi 1 HP!'
          } else {
            turnMessage.value = 'Furina hút thuốc... Nhưng máu đã đạt tối đa!'
          }
        }
        await new Promise((r) => setTimeout(r, 1500))
        break
      }

      case 'beer': {
        // Loại bỏ viên đạn hiện tại mà không bắn
        audio.playBeer()
        const ejected = cylinder.value.pop()
        const bulletType = ejected ? 'ĐẠN THẬT' : 'ĐẠN RỖNG'
        if (user === 'player') {
          turnMessage.value = `Bạn mở bia, viên ${bulletType} bị loại ra!`
        } else {
          turnMessage.value = `Furina dùng bia, viên ${bulletType} bị loại ra!`
        }
        await new Promise((r) => setTimeout(r, 1500))

        // Nếu hết đạn sau khi dùng bia → reload
        if (cylinder.value.length === 0) {
          await reload()
          return
        }
        break
      }

      case 'magnifying_glass': {
        // Xem viên đạn hiện tại (viên cuối mảng)
        audio.playGlass()
        if (cylinder.value.length > 0) {
          const nextBullet = cylinder.value[cylinder.value.length - 1]!
          if (user === 'player') {
            // Hiển thị cho người chơi bằng hiệu ứng visual
            peekedBullet.value = nextBullet
            turnMessage.value = `Bạn nhìn qua kính lúp... Viên tiếp theo là ${nextBullet ? 'ĐẠN THẬT!' : 'ĐẠN RỖNG.'}`
            // Tự động ẩn sau 2.5s
            setTimeout(() => {
              peekedBullet.value = null
            }, 2500)
          } else {
            // AI biết được viên đạn tiếp theo (sẽ ảnh hưởng quyết định)
            turnMessage.value = 'Furina dùng kính lúp xem viên đạn tiếp theo...'
          }
        }
        await new Promise((r) => setTimeout(r, 2000))
        break
      }

      case 'handcuffs': {
        // Khiến đối thủ mất lượt tiếp theo
        audio.playCuffs()
        if (user === 'player') {
          isAiHandcuffed.value = true
          turnMessage.value = 'Bạn còng tay Furina! Furina sẽ mất lượt tiếp theo.'
        } else {
          isPlayerHandcuffed.value = true
          turnMessage.value = 'Furina còng tay bạn! Bạn sẽ mất lượt tiếp theo.'
        }
        await new Promise((r) => setTimeout(r, 1500))
        break
      }

      case 'handsaw': {
        // Cưa nòng súng - viên đạn thật tiếp theo gây x2 sát thương
        audio.playSaw()
        isSawedOff.value = true
        if (user === 'player') {
          turnMessage.value = 'Bạn cưa ngắn nòng súng! Sát thương x2 nếu đạn thật!'
        } else {
          turnMessage.value = 'Furina cưa ngắn nòng súng! Sát thương x2!'
        }
        await new Promise((r) => setTimeout(r, 1500))
        break
      }
    }
  }

  /**
   * Người chơi sử dụng vật phẩm
   */
  const playerUseItem = async (item: ItemType) => {
    if (!isPlayerTurn.value || isActionDisabled.value || gameOver.value) return
    isActionDisabled.value = true
    await useItem(item, 'player')
    isActionDisabled.value = false
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

    let itemsUsed = 0
    const maxItemsPerTurn = 3

    // Sử dụng vòng lặp để Furina luôn "suy nghĩ" trước mỗi quyết định (dùng vật phẩm hoặc bắn)
    while (true) {
      turnMessage.value = 'Furina đang suy nghĩ...'

      // Delay suy nghĩ ngẫu nhiên từ 1.5s đến 3s cho mỗi hành động
      const thinkTime = 1500 + Math.random() * 1500
      await new Promise((r) => setTimeout(r, thinkTime))

      // Kiểm tra xem có nên dùng vật phẩm không
      if (itemsUsed < maxItemsPerTurn && aiItems.value.length > 0) {
        const itemDecision = getAIItemDecision(
          {
            cylinder: cylinder.value,
            liveAtReload: liveAtReload.value,
            blankAtReload: blankAtReload.value,
            aiHp: aiHp.value,
            playerHp: playerHp.value,
            aiItems: aiItems.value,
            isSawedOff: isSawedOff.value,
            isPlayerHandcuffed: isPlayerHandcuffed.value,
          },
          aiDifficulty.value,
        )

        // Nếu AI quyết định dùng vật phẩm
        if (itemDecision.item !== null) {
          // Hiển thị lý do và chờ 1.5s để người chơi kịp đọc
          turnMessage.value = itemDecision.reason
          await new Promise((r) => setTimeout(r, 1500))

          await useItem(itemDecision.item, 'ai')
          itemsUsed++

          // Nếu dùng Bia xong mà súng hết đạn thì dừng lượt
          if (cylinder.value.length === 0) return

          // Chờ thêm 1s sau khi hiệu ứng vật phẩm kết thúc rồi mới quay lại suy nghĩ tiếp
          await new Promise((r) => setTimeout(r, 1000))
          continue // Quay lại đầu vòng lặp để tiếp tục trạng thái "suy nghĩ"
        }
      }

      // Nếu AI không dùng vật phẩm nữa (hoặc đã dùng đủ giới hạn), thoát vòng lặp để tiến hành bắn
      break
    }

    // --- AI quyết định bắn ---
    // (Lúc này chữ "Furina đang suy nghĩ..." đã được hiển thị và delay từ đầu vòng lặp rồi)

    const decision = getAIDecision(
      {
        cylinder: cylinder.value,
        liveAtReload: liveAtReload.value,
        blankAtReload: blankAtReload.value,
        aiHp: aiHp.value,
        playerHp: playerHp.value,
        aiItems: aiItems.value,
        isSawedOff: isSawedOff.value,
        isPlayerHandcuffed: isPlayerHandcuffed.value,
      },
      aiDifficulty.value,
    )

    // Hiển thị lý do bắn và chờ 2s để người chơi đọc được sự giảo hoạt của AI
    turnMessage.value = `Furina: "${decision.reason}"`
    await new Promise((r) => setTimeout(r, 2000))

    await handleShoot('ai', decision.target)
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

    // Reset vật phẩm và trạng thái
    playerItems.value = []
    aiItems.value = []
    isPlayerHandcuffed.value = false
    isAiHandcuffed.value = false
    isSawedOff.value = false
    peekedBullet.value = null

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
    aiDifficulty,
    initIntro,
    enterGame,
    startNewGame,
    liveAtReload,
    blankAtReload,
    disposeAudio: audio.dispose,
    // Hệ thống vật phẩm
    playerItems,
    aiItems,
    playerUseItem,
    isSawedOff,
    peekedBullet,
    isPlayerHandcuffed,
    isAiHandcuffed,
  }
}
