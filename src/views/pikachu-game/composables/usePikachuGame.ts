import { computed, ref } from 'vue'
import seedRecordsRaw from '../records.json'
import { STORAGE_KEY, directions, difficultyOptions, iconSet, sizeOptions, storyLevels } from '../constants'
import type {
  Direction,
  DisplayCell,
  GameMode,
  GridSize,
  LeaderboardStep,
  Point,
  RankedMode,
  RecordItem,
  SearchNode,
  Tile,
} from '../types'

interface HintResult {
  first: Tile
  second: Tile
  path: Point[]
}

interface PackedTile {
  type: number
  icon: string
}

export function usePikachuGame() {
  const appliedSize = ref<GridSize>(10)
  const appliedDifficulty = ref(0)
  const appliedMode = ref<GameMode>('classic')
  const storyLevelIndex = ref(0)

  const pendingSize = ref<GridSize>(10)
  const pendingDifficulty = ref(0)
  const pendingMode = ref<GameMode>('classic')

  const grid = ref<Tile[][]>([])
  const firstSelected = ref<Tile | null>(null)
  const secondSelected = ref<Tile | null>(null)
  const flashPath = ref<Point[]>([])
  const score = ref(0)
  const assistsLeft = ref(0)
  const timeLeft = ref(180)
  const message = ref('S?n sàng b?t d?u ván m?i.')

  const isPaused = ref(false)
  const isResolvingPair = ref(false)

  const showNewGameModal = ref(false)
  const showSettingsModal = ref(false)
  const showRecordPrompt = ref(false)
  const showLeaderboardModal = ref(false)
  const leaderboardStep = ref<LeaderboardStep>('pick')
  const leaderboardDifficulty = ref(0)
  const playerName = ref('')

  const records = ref<RecordItem[]>([])

  let timerId: ReturnType<typeof setInterval> | null = null

  const boardRows = computed(() => appliedSize.value)
  const boardCols = computed(() => appliedSize.value)
  const extRows = computed(() => boardRows.value + 2)
  const extCols = computed(() => boardCols.value + 2)

  const visibleIconsLeft = computed(() => {
    return grid.value.reduce((acc, row) => acc + row.filter((tile) => tile.kind === 'icon' && tile.isVisible).length, 0)
  })

  const isCleared = computed(() => visibleIconsLeft.value === 0 && grid.value.length > 0)
  const isTimeUp = computed(() => appliedMode.value === 'timed' && timeLeft.value <= 0)
  const isGameOver = computed(() => isCleared.value || isTimeUp.value)

  const startTimeBySetup = computed(() => {
    const base = Math.floor((appliedSize.value * appliedSize.value) / 2.15)
    return Math.max(80, base - appliedDifficulty.value * 8)
  })

  const timerTickMs = computed(() => {
    if (appliedMode.value === 'story') return 1000
    return Math.max(250, 1000 - appliedDifficulty.value * 120)
  })

  const totalAssists = computed(() => {
    const divider = Math.max(1, appliedDifficulty.value)
    return Math.max(1, Math.floor(appliedSize.value / divider))
  })

  const timeLabel = computed(() => {
    const minute = Math.floor(Math.max(timeLeft.value, 0) / 60)
    const second = Math.max(timeLeft.value, 0) % 60
    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
  })

  const playedSeconds = computed(() => {
    if (appliedMode.value === 'timed') return Math.max(0, startTimeBySetup.value - timeLeft.value)
    if (appliedMode.value === 'story') return timeLeft.value
    return 0
  })

  const timeProgress = computed(() => {
    if (appliedMode.value !== 'timed') return 100
    return Math.max(0, Math.min(100, Math.round((timeLeft.value / startTimeBySetup.value) * 100)))
  })

  const cellSizeClass = computed(() => {
    if (appliedSize.value === 10) return 'h-9 w-9 text-lg sm:h-11 sm:w-11 sm:text-2xl'
    if (appliedSize.value === 20) return 'h-5 w-5 text-sm sm:h-6 sm:w-6 sm:text-base'
    return 'h-3.5 w-3.5 text-[10px] sm:h-4 sm:w-4 sm:text-xs'
  })

  const pathPolylinePoints = computed(() => flashPath.value.map((p) => `${p.x + 0.5},${p.y + 0.5}`).join(' '))

  const classicBoard = computed(() => leaderboardBy(leaderboardDifficulty.value, 'classic'))
  const timedBoard = computed(() => leaderboardBy(leaderboardDifficulty.value, 'timed'))

  const displayCells = computed<DisplayCell[]>(() => {
    const cells: DisplayCell[] = []
    for (let y = 0; y < extRows.value; y++) {
      for (let x = 0; x < extCols.value; x++) {
        const isOuter = y === 0 || y === extRows.value - 1 || x === 0 || x === extCols.value - 1
        cells.push({ key: `${x}-${y}`, x, y, tile: isOuter ? null : getTile(y - 1, x - 1), isOuter })
      }
    }
    return cells
  })

  function loadRecords(): void {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        records.value = JSON.parse(cached) as RecordItem[]
        return
      }
    } catch {
      // fallback to seed data
    }
    records.value = seedRecordsRaw as RecordItem[]
  }

  function persistRecords(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  }

  function leaderboardBy(difficulty: number, mode: RankedMode): RecordItem[] {
    return records.value
      .filter((item) => item.difficulty === difficulty && item.mode === mode)
      .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
      .slice(0, 10)
  }

  function stopTimer(): void {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function startTimerIfNeeded(): void {
    stopTimer()
    if (appliedMode.value === 'classic' || isPaused.value || isGameOver.value) return

    timerId = setInterval(() => {
      if (isPaused.value || isGameOver.value) return

      if (appliedMode.value === 'timed') {
        timeLeft.value = Math.max(0, timeLeft.value - 1)
        if (timeLeft.value === 0) {
          message.value = 'H?t gi?!'
          stopTimer()
        }
        return
      }

      timeLeft.value += 1
    }, timerTickMs.value)
  }

  function getTile(y: number, x: number): Tile | null {
    const row = grid.value[y]
    if (!row) return null
    return row[x] ?? null
  }

  function inBounds(x: number, y: number): boolean {
    return x >= 0 && x < boardCols.value && y >= 0 && y < boardRows.value
  }

  function inExtendedBounds(x: number, y: number): boolean {
    return x >= -1 && x <= boardCols.value && y >= -1 && y <= boardRows.value
  }

  function shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = result[i] as T
      result[i] = result[j] as T
      result[j] = temp
    }
    return result
  }

  function obstacleCountByDifficulty(size: number, level: number): number {
    if (level <= 0) return 0
    const density = Math.min(0.025 + level * 0.012, 0.12)
    return Math.floor(size * size * density)
  }

  function iconVarietyByDifficulty(level: number, size: number): number {
    const base = Math.floor(size / 5) + 4
    const scaled = base + level * 2
    return Math.min(iconSet.length, Math.max(4, scaled))
  }

  function buildBoard(): void {
    const size = appliedSize.value
    const totalCells = size * size
    let obstacles = Math.min(obstacleCountByDifficulty(size, appliedDifficulty.value), Math.max(0, totalCells - 2))
    if ((totalCells - obstacles) % 2 !== 0) obstacles = Math.max(0, obstacles - 1)

    let playableCells = totalCells - obstacles
    if (playableCells < 2) {
      playableCells = 2
      obstacles = totalCells - playableCells
    }

    const pairs = playableCells / 2
    const iconTypes: number[] = []
    const iconChoices = iconVarietyByDifficulty(appliedDifficulty.value, size)

    for (let i = 0; i < pairs; i++) {
      const type = Math.floor(Math.random() * iconChoices)
      iconTypes.push(type, type)
    }

    const pool: Array<{ kind: 'icon' | 'wall'; type: number; icon: string }> = []
    for (let i = 0; i < obstacles; i++) pool.push({ kind: 'wall', type: -1, icon: '' })
    iconTypes.forEach((type) => pool.push({ kind: 'icon', type, icon: iconSet[type] as string }))

    const shuffled = shuffle(pool)
    const next: Tile[][] = []
    let index = 0

    for (let y = 0; y < size; y++) {
      const row: Tile[] = []
      for (let x = 0; x < size; x++) {
        const item = shuffled[index]
        row.push({
          id: index,
          kind: item?.kind ?? 'icon',
          type: item?.type ?? -1,
          icon: item?.icon ?? '',
          x,
          y,
          isVisible: true,
        })
        index++
      }
      next.push(row)
    }

    grid.value = next
  }

  function isWalkable(x: number, y: number, from: Tile, to: Tile): boolean {
    if ((x === from.x && y === from.y) || (x === to.x && y === to.y)) return true
    if (!inBounds(x, y)) return true
    const tile = getTile(y, x)
    if (!tile || tile.kind === 'wall') return false
    return !tile.isVisible
  }

  function reconstructPath(nodes: SearchNode[], endIndex: number): Point[] {
    const points: Point[] = []
    let cursor = endIndex
    while (cursor >= 0) {
      const node = nodes[cursor]
      if (!node) break
      points.push({ x: node.x + 1, y: node.y + 1 })
      cursor = node.parent
    }
    return points.reverse()
  }

  function compressPath(points: Point[]): Point[] {
    if (points.length <= 2) return points
    const compact: Point[] = [points[0] as Point]

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1] as Point
      const cur = points[i] as Point
      const next = points[i + 1] as Point
      const dx1 = cur.x - prev.x
      const dy1 = cur.y - prev.y
      const dx2 = next.x - cur.x
      const dy2 = next.y - cur.y
      if (dx1 * dy2 !== dy1 * dx2) compact.push(cur)
    }

    compact.push(points[points.length - 1] as Point)
    return compact
  }

  function findConnectionPath(from: Tile, to: Tile): Point[] | null {
    if (from.kind !== 'icon' || to.kind !== 'icon' || from.type < 0 || to.type < 0 || from.type !== to.type || from.id === to.id) return null

    const queue: SearchNode[] = [{ x: from.x, y: from.y, dir: -1, turns: 0, parent: -1 }]
    const visited = new Map<string, number>()
    let head = 0

    while (head < queue.length) {
      const current = queue[head]
      if (!current) break
      const currentIndex = head
      head++

      for (let i = 0; i < directions.length; i++) {
        const dir = i as Direction
        const vector = directions[dir] as readonly [number, number]
        const nextTurns = current.dir === -1 || current.dir === dir ? current.turns : current.turns + 1
        if (nextTurns > 2) continue

        let nx = current.x + vector[0]
        let ny = current.y + vector[1]

        while (inExtendedBounds(nx, ny) && isWalkable(nx, ny, from, to)) {
          const key = `${nx},${ny},${dir}`
          const seenTurns = visited.get(key)
          if (seenTurns === undefined || seenTurns > nextTurns) {
            visited.set(key, nextTurns)
            queue.push({ x: nx, y: ny, dir, turns: nextTurns, parent: currentIndex })
            const nodeIndex = queue.length - 1
            if (nx === to.x && ny === to.y) return compressPath(reconstructPath(queue, nodeIndex))
          }
          nx += vector[0]
          ny += vector[1]
        }
      }
    }

    return null
  }

  function groupedVisibleIcons(): Map<number, Tile[]> {
    const grouped = new Map<number, Tile[]>()
    for (const row of grid.value) {
      for (const tile of row) {
        if (tile.kind !== 'icon' || !tile.isVisible || tile.type < 0) continue
        const list = grouped.get(tile.type)
        if (list) list.push(tile)
        else grouped.set(tile.type, [tile])
      }
    }
    return grouped
  }

  function hasAnyValidMove(): boolean {
    const grouped = groupedVisibleIcons()
    for (const [, list] of grouped) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i] as Tile
          const b = list[j] as Tile
          if (findConnectionPath(a, b) !== null) return true
        }
      }
    }
    return false
  }

  function findHintPath(): HintResult | null {
    const grouped = groupedVisibleIcons()
    for (const [, list] of grouped) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i] as Tile
          const b = list[j] as Tile
          const path = findConnectionPath(a, b)
          if (path !== null) return { first: a, second: b, path }
        }
      }
    }
    return null
  }

  function ensureBoardHasMove(maxRetry = 20): void {
    let tries = 0
    while (tries < maxRetry && !hasAnyValidMove()) {
      buildBoard()
      tries++
    }
  }

  function reshuffleRemainingIcons(maxRetry = 20): boolean {
    const activeTiles: Tile[] = []
    const packed: PackedTile[] = []

    for (const row of grid.value) {
      for (const tile of row) {
        if (tile.kind === 'icon' && tile.isVisible && tile.type >= 0) {
          activeTiles.push(tile)
          packed.push({ type: tile.type, icon: tile.icon })
        }
      }
    }

    if (activeTiles.length < 2) return true

    for (let attempt = 0; attempt < maxRetry; attempt++) {
      const shuffled = shuffle(packed)
      for (let i = 0; i < activeTiles.length; i++) {
        const tile = activeTiles[i] as Tile
        const item = shuffled[i]
        tile.type = item?.type ?? tile.type
        tile.icon = item?.icon ?? tile.icon
        tile.isVisible = true
      }
      if (hasAnyValidMove()) return true
    }

    return false
  }

  function recoverBoardIfNoMove(): void {
    firstSelected.value = null
    secondSelected.value = null
    flashPath.value = []

    if (reshuffleRemainingIcons()) {
      message.value = 'Bàn h?t nu?c di. Ðã t? d?ng xáo l?i.'
      return
    }

    buildBoard()
    ensureBoardHasMove()
    message.value = 'Bàn h?t nu?c di. Ðã t? d?ng reset bàn m?i.'
  }

  function startStoryNextLevel(): void {
    const nextIndex = storyLevelIndex.value + 1
    if (nextIndex >= storyLevels.length) {
      finishWithWin()
      return
    }

    storyLevelIndex.value = nextIndex
    appliedDifficulty.value = storyLevels[nextIndex] as number
    assistsLeft.value = Math.max(1, totalAssists.value)
    firstSelected.value = null
    secondSelected.value = null
    flashPath.value = []
    buildBoard()
    ensureBoardHasMove()
    message.value = `Story Level ${nextIndex + 1}/${storyLevels.length}`
  }

  function startFreshBoard(): void {
    score.value = 0
    assistsLeft.value = Math.max(1, totalAssists.value)
    isPaused.value = false
    isResolvingPair.value = false
    firstSelected.value = null
    secondSelected.value = null
    flashPath.value = []
    showRecordPrompt.value = false
    playerName.value = ''

    buildBoard()
    ensureBoardHasMove()
    startTimerIfNeeded()
  }

  function applyNewGameSettings(): void {
    if (pendingMode.value === 'story') {
      appliedMode.value = 'story'
      appliedSize.value = 20
      storyLevelIndex.value = 0
      appliedDifficulty.value = storyLevels[0] as number
      timeLeft.value = 0
      message.value = 'Story Level 1 b?t d?u!'
    } else {
      appliedMode.value = pendingMode.value
      appliedSize.value = pendingSize.value
      appliedDifficulty.value = pendingDifficulty.value
      storyLevelIndex.value = 0
      timeLeft.value = startTimeBySetup.value
      message.value = 'Ch?n 2 hình gi?ng nhau!'
    }

    startFreshBoard()
    showNewGameModal.value = false
  }

  function applyCurrentSettings(): void {
    if (pendingMode.value === 'story') {
      pendingSize.value = 20
    }
    appliedMode.value = pendingMode.value
    appliedSize.value = pendingMode.value === 'story' ? 20 : pendingSize.value
    appliedDifficulty.value = pendingDifficulty.value
    if (appliedMode.value === 'story') {
      storyLevelIndex.value = 0
      timeLeft.value = 0
    } else {
      timeLeft.value = startTimeBySetup.value
    }
    message.value = 'Ðã áp d?ng setting. B?t d?u ván m?i.'
    startFreshBoard()
    showSettingsModal.value = false
  }

  function togglePause(): void {
    if (isGameOver.value) return
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      stopTimer()
      message.value = 'Ðã t?m d?ng.'
      return
    }
    message.value = 'Ti?p t?c nào!'
    startTimerIfNeeded()
  }

  function finishWithWin(): void {
    stopTimer()
    message.value = appliedMode.value === 'story' ? 'Hoàn thành toàn b? Story!' : 'B?n chi?n th?ng!'
    showRecordPrompt.value = true
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

      score.value += 10
      flashPath.value = []
      isResolvingPair.value = false

      if (isCleared.value) {
        if (appliedMode.value === 'story') startStoryNextLevel()
        else finishWithWin()
        return
      }

      if (!hasAnyValidMove()) {
        recoverBoardIfNoMove()
      } else {
        message.value = 'N?i thành công!'
      }
    }, 250)
  }

  function selectTile(tile: Tile): void {
    if (isPaused.value || isGameOver.value || isResolvingPair.value) return
    if (tile.kind !== 'icon' || !tile.isVisible || tile.type < 0) return

    if (!firstSelected.value) {
      firstSelected.value = tile
      return
    }

    if (firstSelected.value.id === tile.id) {
      firstSelected.value = null
      return
    }

    secondSelected.value = tile
    const path = findConnectionPath(firstSelected.value, secondSelected.value)

    if (path !== null) {
      resolveMatchedPair(firstSelected.value, secondSelected.value, path)
    } else {
      message.value = 'Không n?i du?c!'
      if (!hasAnyValidMove()) recoverBoardIfNoMove()
    }

    setTimeout(() => {
      firstSelected.value = null
      secondSelected.value = null
    }, 280)
  }

  function consumeAssist(): boolean {
    if (assistsLeft.value <= 0) {
      message.value = 'H?t lu?t tr? giúp.'
      return false
    }
    assistsLeft.value -= 1
    return true
  }

  function useHint(): void {
    if (isPaused.value || isGameOver.value || isResolvingPair.value) return
    if (!consumeAssist()) return

    const hint = findHintPath()
    if (!hint) {
      recoverBoardIfNoMove()
      return
    }

    firstSelected.value = hint.first
    secondSelected.value = hint.second
    flashPath.value = hint.path
    message.value = 'G?i ý dã hi?n th?.'

    setTimeout(() => {
      firstSelected.value = null
      secondSelected.value = null
      flashPath.value = []
    }, 700)
  }

  function useReload(): void {
    if (isPaused.value || isGameOver.value || isResolvingPair.value) return
    if (!consumeAssist()) return

    if (!reshuffleRemainingIcons()) {
      buildBoard()
      ensureBoardHasMove()
      message.value = 'Ðã reset bàn do không th? xáo an toàn.'
      return
    }

    firstSelected.value = null
    secondSelected.value = null
    flashPath.value = []
    message.value = 'Ðã xáo l?i các icon còn l?i.'
  }

  function saveRecord(): void {
    const name = playerName.value.trim()
    if (!name) return

    const record: RecordItem = {
      name,
      score: score.value,
      difficulty: appliedDifficulty.value,
      mode: appliedMode.value,
      timeSpent: playedSeconds.value,
      createdAt: new Date().toISOString(),
    }

    records.value = [...records.value, record]
      .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
      .slice(0, 400)

    persistRecords()
    showRecordPrompt.value = false
    playerName.value = ''
    message.value = 'Ðã luu di?m cao.'
  }

  function openLeaderboardFlow(): void {
    leaderboardDifficulty.value = appliedDifficulty.value
    leaderboardStep.value = 'pick'
    showLeaderboardModal.value = true
  }

  function prepareNewGameModal(): void {
    pendingMode.value = appliedMode.value
    pendingSize.value = appliedSize.value
    pendingDifficulty.value = appliedDifficulty.value
    showNewGameModal.value = true
  }

  function prepareSettingsModal(): void {
    pendingMode.value = appliedMode.value
    pendingSize.value = appliedSize.value
    pendingDifficulty.value = appliedDifficulty.value
    showSettingsModal.value = true
  }

  function closeAllModals(): void {
    showNewGameModal.value = false
    showSettingsModal.value = false
    showRecordPrompt.value = false
    showLeaderboardModal.value = false
  }

  return {
    difficultyOptions,
    sizeOptions,
    storyLevels,

    appliedSize,
    appliedDifficulty,
    appliedMode,
    storyLevelIndex,

    pendingSize,
    pendingDifficulty,
    pendingMode,

    grid,
    firstSelected,
    secondSelected,
    flashPath,
    score,
    assistsLeft,
    timeLeft,
    message,

    isPaused,
    isResolvingPair,

    showNewGameModal,
    showSettingsModal,
    showRecordPrompt,
    showLeaderboardModal,
    leaderboardStep,
    leaderboardDifficulty,
    playerName,

    records,

    extRows,
    extCols,
    isCleared,
    isTimeUp,
    isGameOver,
    startTimeBySetup,
    timerTickMs,
    totalAssists,
    timeLabel,
    playedSeconds,
    timeProgress,
    cellSizeClass,
    pathPolylinePoints,
    classicBoard,
    timedBoard,
    displayCells,

    loadRecords,
    stopTimer,
    startTimerIfNeeded,
    applyNewGameSettings,
    applyCurrentSettings,
    togglePause,
    selectTile,
    useHint,
    useReload,
    saveRecord,
    openLeaderboardFlow,
    prepareNewGameModal,
    prepareSettingsModal,
    closeAllModals,
  }
}

