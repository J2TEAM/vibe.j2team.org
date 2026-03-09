import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import bgmTrack from '../res/BGM/BGM.mp3'
import {
  AUTO_RECOVER_RESHUFFLE_LIMIT,
  DEFAULT_RECORDS,
  GRAVITY_UNLOCKED_STORAGE_KEY,
  STORY_GRID_SIZE,
  STORY_TOTAL_LEVELS,
  STORAGE_KEY,
  difficultyOptions,
  iconSet,
  gridPresetMap,
  sizeOptions,
} from '../constants'
import type {
  DisplayCell,
  GameMode,
  GridSize,
  LeaderboardCategory,
  LeaderboardStep,
  MainMode,
  Point,
  RecordItem,
  Tile,
} from '../types'
import {
  applyGravityToBoard,
  buildBoard as buildBoardGrid,
  findConnectionPath as findBoardConnectionPath,
  findHintPath as findBoardHintPath,
  hasAnyValidMove as hasAnyBoardMove,
  reshuffleVisibleBoard as reshuffleBoardTiles,
} from './modules/board'
import { createAudioController } from './modules/audio'
import { loadRecordsFromStorage, persistRecordsToStorage } from './modules/storage'

export function usePikachuGame() {
  const appliedSize = ref<GridSize>(STORY_GRID_SIZE)
  const appliedDifficulty = ref(0)
  const appliedMode = ref<GameMode>('story')

  const pendingSize = ref<GridSize>('10x10')
  const pendingDifficulty = ref(0)
  const pendingMainMode = ref<MainMode>('story')
  const pendingCustomMode = ref<Exclude<GameMode, 'story' | 'gravity'>>('classic')

  const grid = ref<Tile[][]>([])
  const firstSelected = ref<Tile | null>(null)
  const secondSelected = ref<Tile | null>(null)
  const failedPairIds = ref<number[]>([])
  const flashPath = ref<Point[]>([])
  const isHintVisible = ref(false)
  const score = ref(0)
  const assistsLeft = ref(0)
  const timeLeft = ref(180)
  const storyElapsedSeconds = ref(0)
  const storyLevel = ref(1)
  const message = ref('Sẵn sàng bắt đầu ván mới.')

  const isPaused = ref(false)
  const isResolvingPair = ref(false)
  const isLightMode = ref(false)
  const isMobilePortrait = ref(false)
  const isSoundOn = ref(true)
  const isBgmOn = ref(true)
  const sfxVolume = ref(50)
  const bgmVolume = ref(50)

  const showNewGameModal = ref(false)
  const showSettingsModal = ref(false)
  const showRecordPrompt = ref(false)
  const showLeaderboardModal = ref(false)
  const showCreditsModal = ref(false)
  const leaderboardStep = ref<LeaderboardStep>('pick')
  const leaderboardCategory = ref<LeaderboardCategory>('story')
  const leaderboardDifficulty = ref(0)
  const playerName = ref('')
  const gravityUnlocked = ref(false)
  const easterMessage = ref('')
  const isCreditsBoosted = ref(false)
  const creditsContainerRef = ref<HTMLElement | null>(null)
  const creditsContentRef = ref<HTMLElement | null>(null)
  const creditsEasterButtonRef = ref<HTMLElement | null>(null)
  const creditsOffsetY = ref(0)
  const isCreditsAutoStopped = ref(false)

  const records = ref<RecordItem[]>([])
  const autoRecoverAttempts = ref(0)
  const audio = createAudioController(bgmTrack)

  let timerId: ReturnType<typeof setInterval> | null = null
  let creditsRafId: number | null = null
  let creditsLastFrame = 0

  const activeGridPreset = computed(() => gridPresetMap[appliedSize.value])
  const boardRows = computed(() => activeGridPreset.value.rows)
  const boardCols = computed(() => activeGridPreset.value.cols)
  const extRows = computed(() => boardRows.value + 2)
  const extCols = computed(() => boardCols.value + 2)
  const largestBoardEdge = computed(() => Math.max(boardRows.value, boardCols.value))
  const totalBoardCells = computed(() => boardRows.value * boardCols.value)

  const visibleIconsLeft = computed(() => {
    return grid.value.reduce((acc, row) => {
      return acc + row.filter((tile) => tile.kind === 'icon' && tile.isVisible).length
    }, 0)
  })

  const isCleared = computed(() => visibleIconsLeft.value === 0 && grid.value.length > 0)
  const isStoryMode = computed(
    () => appliedMode.value === 'story' || appliedMode.value === 'gravity',
  )
  const isTimeUp = computed(() => appliedMode.value === 'timed' && timeLeft.value <= 0)
  const isGameOver = computed(() => isCleared.value || isTimeUp.value)

  const startTimeBySetup = computed(() => {
    const base = Math.floor(totalBoardCells.value / 2.2)
    if (appliedMode.value === 'timed') {
      return Math.max(75, base) * 3
    }
    return Math.max(75, base)
  })

  const totalAssists = computed(() => {
    const divider = Math.max(1, appliedDifficulty.value)
    return Math.max(1, Math.floor(largestBoardEdge.value / divider))
  })

  const timeLabel = computed(() => {
    const total =
      appliedMode.value === 'story' || appliedMode.value === 'gravity'
        ? Math.max(storyElapsedSeconds.value, 0)
        : Math.max(timeLeft.value, 0)
    const minute = Math.floor(total / 60)
    const second = total % 60
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  })

  const playedSeconds = computed(() => {
    if (appliedMode.value === 'timed') {
      return Math.max(0, startTimeBySetup.value - timeLeft.value)
    }
    if (appliedMode.value === 'classic') {
      return 0
    }
    return storyElapsedSeconds.value
  })

  const timeProgress = computed(() => {
    if (appliedMode.value !== 'timed') {
      return 100
    }
    return Math.max(0, Math.min(100, Math.round((timeLeft.value / startTimeBySetup.value) * 100)))
  })

  const cellSizeClass = computed(() => {
    if (largestBoardEdge.value <= 10) {
      return 'h-12 w-12 text-[28px] sm:h-[53px] sm:w-[53px] sm:text-[31px]'
    }
    if (largestBoardEdge.value <= 20) {
      return 'h-[26px] w-[26px] text-[17px] sm:h-[31px] sm:w-[31px] sm:text-[20px]'
    }
    return 'h-5 w-5 text-[13px] sm:h-[22px] sm:w-[22px] sm:text-[15px]'
  })

  const portraitCellSizeClass = computed(() => {
    if (!isMobilePortrait.value) {
      return cellSizeClass.value
    }

    if (largestBoardEdge.value <= 10) {
      return 'h-9 w-9 text-xl'
    }
    if (largestBoardEdge.value <= 20) {
      return 'h-5 w-5 text-sm'
    }
    return 'h-4 w-4 text-xs'
  })

  const pathPolylinePoints = computed(() => {
    return flashPath.value.map((point) => `${point.x + 0.5},${point.y + 0.5}`).join(' ')
  })

  const wrapperClass = computed(() => {
    return isLightMode.value ? 'bg-text-primary text-bg-deep' : 'bg-bg-deep text-text-primary'
  })

  const surfaceClass = computed(() => {
    return isLightMode.value
      ? 'bg-text-primary border-border-default'
      : 'bg-bg-surface border-border-default'
  })

  const panelInnerClass = computed(() => {
    return isLightMode.value
      ? 'bg-text-primary border-border-default'
      : 'bg-bg-deep border-border-default'
  })

  const textMutedClass = computed(() => {
    return isLightMode.value ? 'text-bg-elevated' : 'text-text-secondary'
  })

  const classicBoard = computed(() => leaderboardBy(leaderboardDifficulty.value, 'classic'))
  const timedBoard = computed(() => leaderboardBy(leaderboardDifficulty.value, 'timed'))
  const storyBoard = computed(() => {
    return records.value
      .filter((item) => item.mode === 'story')
      .sort((a, b) => a.timeSpent - b.timeSpent || b.score - a.score)
      .slice(0, 10)
  })
  const gravityBoard = computed(() => {
    return records.value
      .filter((item) => item.mode === 'gravity')
      .sort((a, b) => a.timeSpent - b.timeSpent || b.score - a.score)
      .slice(0, 10)
  })
  const creditsTransformStyle = computed(() => {
    return { transform: `translateY(${creditsOffsetY.value}px)` }
  })

  function storyDifficultyByLevel(level: number): number {
    const ratio = (level - 1) / Math.max(1, STORY_TOTAL_LEVELS - 1)
    return Math.max(0, Math.min(8, Math.round(ratio * 8)))
  }

  function getTile(y: number, x: number): Tile | null {
    const row = grid.value[y]
    if (!row) {
      return null
    }
    return row[x] ?? null
  }

  const displayCells = computed<DisplayCell[]>(() => {
    const cells: DisplayCell[] = []
    for (let y = 0; y < extRows.value; y++) {
      for (let x = 0; x < extCols.value; x++) {
        const isOuter = y === 0 || y === extRows.value - 1 || x === 0 || x === extCols.value - 1
        cells.push({
          key: `${x}-${y}`,
          x,
          y,
          tile: isOuter ? null : getTile(y - 1, x - 1),
          isOuter,
        })
      }
    }
    return cells
  })

  function loadRecords(): void {
    records.value = loadRecordsFromStorage(STORAGE_KEY, DEFAULT_RECORDS)
    persistRecords()
  }

  function persistRecords(): void {
    persistRecordsToStorage(STORAGE_KEY, records.value)
  }

  function loadGravityUnlockState(): void {
    gravityUnlocked.value = localStorage.getItem(GRAVITY_UNLOCKED_STORAGE_KEY) === '1'
  }

  function persistGravityUnlockState(): void {
    localStorage.setItem(GRAVITY_UNLOCKED_STORAGE_KEY, gravityUnlocked.value ? '1' : '0')
  }

  function leaderboardBy(difficulty: number, mode: 'classic' | 'timed'): RecordItem[] {
    return records.value
      .filter((item) => item.difficulty === difficulty && item.mode === mode)
      .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
      .slice(0, 10)
  }

  function playSelectSound(): void {
    audio.playSelectSound(isSoundOn.value, sfxVolume.value)
  }

  function playMatchSound(): void {
    audio.playMatchSound(isSoundOn.value, sfxVolume.value)
  }

  function playFailSound(): void {
    audio.playFailSound(isSoundOn.value, sfxVolume.value)
  }

  function playHintSound(): void {
    audio.playHintSound(isSoundOn.value, sfxVolume.value)
  }

  function playPauseSound(paused: boolean): void {
    audio.playPauseSound(isSoundOn.value, sfxVolume.value, paused)
  }

  function playWinSound(): void {
    audio.playWinSound(isSoundOn.value, sfxVolume.value)
  }

  function syncBgmState(): void {
    audio.syncBgmState(isBgmOn.value, bgmVolume.value)
  }

  async function ensureBgmPlayback(): Promise<void> {
    await audio.ensureBgmPlayback(isBgmOn.value, bgmVolume.value)
  }

  function stopTimer(): void {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function startTimerIfNeeded(): void {
    stopTimer()
    if (isPaused.value || isGameOver.value) {
      return
    }

    timerId = setInterval(() => {
      if (isPaused.value || isGameOver.value) {
        return
      }

      if (appliedMode.value === 'timed') {
        timeLeft.value = Math.max(0, timeLeft.value - 1)
        if (timeLeft.value === 0) {
          message.value = 'Hết giờ!'
          stopTimer()
        }
        return
      }

      if (appliedMode.value === 'classic') {
        return
      }

      storyElapsedSeconds.value += 1
    }, 1000)
  }

  function buildBoard(): void {
    grid.value = buildBoardGrid(boardRows.value, boardCols.value, appliedDifficulty.value, iconSet)
  }

  function findConnectionPath(from: Tile, to: Tile): Point[] | null {
    return findBoardConnectionPath(from, to, grid.value, boardRows.value, boardCols.value)
  }

  function applyNewGameSettings(): void {
    if (pendingMainMode.value === 'gravity' && !gravityUnlocked.value) {
      message.value = 'Mode Trọng lực đang bị khóa. Hãy tìm Easter Egg để mở khóa.'
      return
    }

    appliedMode.value =
      pendingMainMode.value === 'story'
        ? 'story'
        : pendingMainMode.value === 'gravity'
          ? 'gravity'
          : pendingCustomMode.value

    storyLevel.value = 1
    storyElapsedSeconds.value = 0

    if (pendingMainMode.value === 'story' || pendingMainMode.value === 'gravity') {
      appliedSize.value = STORY_GRID_SIZE
      appliedDifficulty.value = storyDifficultyByLevel(1)
    } else {
      appliedSize.value = pendingSize.value
      appliedDifficulty.value = pendingDifficulty.value
    }

    score.value = 0
    timeLeft.value = startTimeBySetup.value
    assistsLeft.value = Math.max(1, totalAssists.value)
    message.value =
      appliedMode.value === 'gravity'
        ? 'Gravity mode: quân sẽ rơi xuống sau mỗi cặp hợp lệ!'
        : 'Chọn 2 hình giống nhau!'
    isPaused.value = false
    isResolvingPair.value = false
    firstSelected.value = null
    secondSelected.value = null
    flashPath.value = []
    isHintVisible.value = false
    showRecordPrompt.value = false
    playerName.value = ''

    buildBoard()
    autoRecoverAttempts.value = 0
    autoRecoverNoMoveIfNeeded()
    startTimerIfNeeded()
    void ensureBgmPlayback()
    showNewGameModal.value = false
  }

  function togglePause(): void {
    if (isGameOver.value) {
      return
    }

    isPaused.value = !isPaused.value
    if (isPaused.value) {
      stopTimer()
      message.value = 'Đã tạm dừng.'
    } else {
      message.value = 'Tiếp tục nào!'
      startTimerIfNeeded()
    }
    void ensureBgmPlayback()
    playPauseSound(isPaused.value)
  }

  function finishWithWin(): void {
    stopTimer()
    playWinSound()
    if (appliedMode.value === 'story' || appliedMode.value === 'gravity') {
      const modeLabel = appliedMode.value === 'gravity' ? 'Gravity' : 'Story'
      message.value = `Hoàn thành ${modeLabel} ${STORY_TOTAL_LEVELS} level trong ${timeLabel.value}.`
    } else {
      message.value = 'Bạn chiến thắng!'
    }
    showRecordPrompt.value = true
  }

  function advanceStoryLevel(): void {
    const nextLevel = storyLevel.value + 1
    storyLevel.value = nextLevel
    appliedDifficulty.value = storyDifficultyByLevel(nextLevel)
    assistsLeft.value = Math.max(1, totalAssists.value)
    firstSelected.value = null
    secondSelected.value = null
    flashPath.value = []
    isResolvingPair.value = false
    buildBoard()
    autoRecoverAttempts.value = 0
    autoRecoverNoMoveIfNeeded()
    message.value = `Qua level ${nextLevel - 1}. Sang level ${nextLevel}/${STORY_TOTAL_LEVELS}.`
  }

  function resolveMatchedPair(first: Tile, second: Tile, path: Point[]): void {
    isResolvingPair.value = true
    flashPath.value = path

    setTimeout(() => {
      first.isVisible = false
      first.type = -1
      first.icon = ''

      second.isVisible = false
      second.type = -1
      second.icon = ''

      if (appliedMode.value === 'gravity') {
        applyGravityToBoard(grid.value)
      }

      score.value += 10
      flashPath.value = []
      isResolvingPair.value = false

      if (isCleared.value) {
        if (
          (appliedMode.value === 'story' || appliedMode.value === 'gravity') &&
          storyLevel.value < STORY_TOTAL_LEVELS
        ) {
          advanceStoryLevel()
        } else {
          finishWithWin()
        }
      } else {
        autoRecoverAttempts.value = 0
        autoRecoverNoMoveIfNeeded()
        if (!message.value.includes('Bàn kẹt')) {
          message.value = 'Nối thành công!'
        }
      }
    }, 260)
  }

  function selectTile(tile: Tile): void {
    if (isPaused.value || isGameOver.value || isResolvingPair.value) {
      return
    }
    if (tile.kind !== 'icon' || !tile.isVisible || tile.type < 0) {
      return
    }

    if (!firstSelected.value) {
      firstSelected.value = tile
      void ensureBgmPlayback()
      playSelectSound()
      return
    }

    if (firstSelected.value.id === tile.id) {
      firstSelected.value = null
      return
    }

    const first = firstSelected.value
    const second = tile
    if (isHintVisible.value) {
      flashPath.value = []
      isHintVisible.value = false
    }
    const path = findConnectionPath(first, second)

    if (path !== null) {
      secondSelected.value = second
      playMatchSound()
      resolveMatchedPair(first, second, path)
    } else {
      message.value = 'Không nối được!'
      playFailSound()
      failedPairIds.value = [first.id, second.id]
      firstSelected.value = null
      secondSelected.value = null
      setTimeout(() => {
        failedPairIds.value = []
      }, 280)
      return
    }

    setTimeout(() => {
      firstSelected.value = null
      secondSelected.value = null
    }, 300)
  }

  function consumeAssist(): boolean {
    if (assistsLeft.value <= 0) {
      message.value = 'Hết lượt trợ giúp.'
      return false
    }
    assistsLeft.value -= 1
    return true
  }

  function findHintPath(): { first: Tile; second: Tile; path: Point[] } | null {
    return findBoardHintPath(grid.value)
  }

  function hasAnyValidMove(): boolean {
    return hasAnyBoardMove(grid.value)
  }

  function reshuffleVisibleBoard(): void {
    reshuffleBoardTiles(grid.value)
    firstSelected.value = null
    secondSelected.value = null
    flashPath.value = []
    isHintVisible.value = false
  }

  function spawnCurrentLayoutWithFallback(): void {
    let recovered = false
    for (let attempt = 0; attempt < 12; attempt++) {
      buildBoard()
      if (hasAnyValidMove()) {
        recovered = true
        break
      }
    }

    if (recovered) {
      message.value = 'Bàn kẹt quá lâu, đã tạo layout mới cùng màn chơi.'
    } else {
      message.value = 'Bàn kẹt, đã tạo layout mới. Hãy dùng tải lại nếu vẫn chưa có nước đi.'
    }
  }

  function autoRecoverNoMoveIfNeeded(): void {
    if (isGameOver.value || isPaused.value || isResolvingPair.value) {
      return
    }
    if (hasAnyValidMove()) {
      autoRecoverAttempts.value = 0
      return
    }

    for (; autoRecoverAttempts.value < AUTO_RECOVER_RESHUFFLE_LIMIT; autoRecoverAttempts.value++) {
      reshuffleVisibleBoard()
      if (hasAnyValidMove()) {
        const attemptCount = autoRecoverAttempts.value + 1
        autoRecoverAttempts.value = 0
        message.value = `Bàn kẹt, hệ thống tự tải lại lần ${attemptCount}.`
        return
      }
    }

    autoRecoverAttempts.value = 0
    spawnCurrentLayoutWithFallback()
  }

  function useHint(): void {
    if (isPaused.value || isGameOver.value || isResolvingPair.value) {
      return
    }
    if (!consumeAssist()) {
      return
    }

    const hint = findHintPath()
    if (!hint) {
      message.value = 'Không có đường đi an toàn.'
      return
    }

    flashPath.value = hint.path
    isHintVisible.value = true
    message.value = 'Gợi ý đã hiển thị.'
    void ensureBgmPlayback()
    playHintSound()
  }

  function useReload(): void {
    if (isPaused.value || isGameOver.value || isResolvingPair.value) {
      return
    }
    if (!consumeAssist()) {
      return
    }

    autoRecoverAttempts.value = 0
    reshuffleVisibleBoard()
    message.value = 'Đã tải lại bàn chơi.'
  }

  function saveRecord(): void {
    const name = playerName.value.trim()
    if (!name) {
      return
    }

    const record: RecordItem = {
      name,
      score: score.value,
      difficulty: appliedDifficulty.value,
      mode: appliedMode.value,
      timeSpent: playedSeconds.value,
      createdAt: new Date().toISOString(),
    }

    records.value = [...records.value, record].slice(-400)

    persistRecords()
    showRecordPrompt.value = false
    playerName.value = ''
    message.value = 'Đã lưu điểm cao.'
  }

  function openLeaderboardFlow(): void {
    leaderboardDifficulty.value = appliedDifficulty.value
    leaderboardCategory.value = appliedMode.value === 'gravity' ? 'gravity' : 'story'
    leaderboardStep.value = 'pick'
    showLeaderboardModal.value = true
  }

  function unlockEasterEgg(): void {
    if (!gravityUnlocked.value) {
      gravityUnlocked.value = true
      persistGravityUnlockState()
      easterMessage.value = 'Đã mở khóa Gravity mode. Giờ bạn có thể chọn trong Tạo ván mới.'
      message.value = 'Bạn đã mở khóa Gravity mode!'
      return
    }

    easterMessage.value = 'Gravity mode đã được mở khóa từ trước.'
  }

  function startCreditsBoost(): void {
    isCreditsBoosted.value = true
  }

  function stopCreditsBoost(): void {
    isCreditsBoosted.value = false
  }

  function resetCreditsPosition(): void {
    const container = creditsContainerRef.value
    if (!container) {
      return
    }
    creditsOffsetY.value = container.clientHeight * 0.35
  }

  function stopCreditsLoop(): void {
    if (creditsRafId !== null) {
      cancelAnimationFrame(creditsRafId)
      creditsRafId = null
    }
    creditsLastFrame = 0
  }

  function tickCredits(timestamp: number): void {
    const container = creditsContainerRef.value
    const content = creditsContentRef.value
    const easterButton = creditsEasterButtonRef.value
    if (!showCreditsModal.value || !container || !content) {
      stopCreditsLoop()
      return
    }

    if (creditsLastFrame === 0) {
      creditsLastFrame = timestamp
    }

    const delta = (timestamp - creditsLastFrame) / 1000
    creditsLastFrame = timestamp
    if (!isCreditsAutoStopped.value) {
      const speed = isCreditsBoosted.value ? 56 : 28
      creditsOffsetY.value -= speed * delta

      if (creditsOffsetY.value < -content.clientHeight - 24) {
        creditsOffsetY.value = container.clientHeight * 0.35
      }

      if (easterButton) {
        const buttonTop = creditsOffsetY.value + easterButton.offsetTop
        const buttonCenter = buttonTop + easterButton.clientHeight / 2
        if (buttonCenter <= container.clientHeight / 2) {
          isCreditsAutoStopped.value = true
          stopCreditsBoost()
          stopCreditsLoop()
          return
        }
      }
    }

    creditsRafId = requestAnimationFrame(tickCredits)
  }

  function startCreditsLoop(): void {
    if (creditsRafId !== null) {
      return
    }
    creditsRafId = requestAnimationFrame(tickCredits)
  }

  function updateViewportMode(): void {
    isMobilePortrait.value = window.innerWidth < 768 && window.innerHeight > window.innerWidth
  }

  onMounted(() => {
    loadRecords()
    loadGravityUnlockState()
    showNewGameModal.value = true
    updateViewportMode()
    window.addEventListener('resize', updateViewportMode)
    void ensureBgmPlayback()
  })

  watch(
    () => [isBgmOn.value, bgmVolume.value],
    () => {
      syncBgmState()
      if (isBgmOn.value) {
        void ensureBgmPlayback()
        return
      }
      audio.pauseBgm()
    },
  )

  watch(
    () => showCreditsModal.value,
    async (opened) => {
      if (!opened) {
        stopCreditsLoop()
        stopCreditsBoost()
        isCreditsAutoStopped.value = false
        return
      }

      await nextTick()
      resetCreditsPosition()
      isCreditsAutoStopped.value = false
      startCreditsLoop()
    },
  )

  onUnmounted(() => {
    stopTimer()
    stopCreditsLoop()
    window.removeEventListener('resize', updateViewportMode)
    audio.dispose()
  })

  return {
    sizeOptions,
    difficultyOptions,
    STORY_TOTAL_LEVELS,

    appliedSize,
    appliedDifficulty,
    appliedMode,
    pendingSize,
    pendingDifficulty,
    pendingMainMode,
    pendingCustomMode,

    grid,
    firstSelected,
    secondSelected,
    failedPairIds,
    flashPath,
    score,
    assistsLeft,
    timeLeft,
    storyElapsedSeconds,
    storyLevel,
    message,

    isPaused,
    isResolvingPair,
    isLightMode,
    isMobilePortrait,
    isSoundOn,
    isBgmOn,
    sfxVolume,
    bgmVolume,

    showNewGameModal,
    showSettingsModal,
    showRecordPrompt,
    showLeaderboardModal,
    showCreditsModal,

    leaderboardStep,
    leaderboardCategory,
    leaderboardDifficulty,
    playerName,
    gravityUnlocked,
    easterMessage,

    creditsContainerRef,
    creditsContentRef,
    creditsEasterButtonRef,

    extRows,
    extCols,
    displayCells,
    isStoryMode,
    isGameOver,
    timeLabel,
    timeProgress,
    portraitCellSizeClass,
    pathPolylinePoints,
    wrapperClass,
    surfaceClass,
    panelInnerClass,
    textMutedClass,
    classicBoard,
    timedBoard,
    storyBoard,
    gravityBoard,
    creditsTransformStyle,

    applyNewGameSettings,
    togglePause,
    selectTile,
    useHint,
    useReload,
    openLeaderboardFlow,
    saveRecord,
    unlockEasterEgg,
    startCreditsBoost,
    stopCreditsBoost,
  }
}
