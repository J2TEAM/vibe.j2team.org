import { ref, computed } from 'vue'

// --- Kiểu dữ liệu ---
export type BetType = 'chan' | 'le' // Chẵn hoặc Lẻ
export type CoinFace = 'up' | 'down' // Mặt ngửa hoặc mặt úp
export type GamePhase = 'betting' | 'shaking' | 'revealing' | 'result'

export interface GameResult {
  coins: CoinFace[] // 4 đồng xu
  upCount: number // Số mặt ngửa
  downCount: number // Số mặt úp
  isEven: boolean // Kết quả chẵn hay lẻ
  betType: BetType | null // Người chơi đặt gì
  betAmount: number // Số tiền đặt
  won: boolean // Thắng hay thua
  payout: number // Tiền thắng/thua
}

export interface GameStats {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  maxBalance: number
  currentStreak: number // Chuỗi thắng/thua hiện tại (dương = thắng, âm = thua)
  bestStreak: number // Chuỗi thắng dài nhất
}

// --- Hằng số ---
const INITIAL_BALANCE = 1000
const MIN_BET = 10
const MAX_BET = 500
const BET_PRESETS = [10, 50, 100, 200, 500]
const SHAKE_DURATION = 2000 // Thời gian xóc (ms)
const REVEAL_DELAY = 500 // Thời gian chờ trước khi mở (ms)

export function useXocDia() {
  // --- Trạng thái game ---
  const balance = ref(INITIAL_BALANCE)
  const betAmount = ref(MIN_BET)
  const betType = ref<BetType | null>(null)
  const gamePhase = ref<GamePhase>('betting')
  const coins = ref<CoinFace[]>(['up', 'up', 'up', 'up'])
  const lastResult = ref<GameResult | null>(null)
  const history = ref<GameResult[]>([])

  // --- Thống kê ---
  const stats = ref<GameStats>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    maxBalance: INITIAL_BALANCE,
    currentStreak: 0,
    bestStreak: 0,
  })

  // --- Computed ---
  const canBet = computed(() => {
    return (
      gamePhase.value === 'betting' &&
      betType.value !== null &&
      betAmount.value >= MIN_BET &&
      betAmount.value <= balance.value &&
      betAmount.value <= MAX_BET
    )
  })

  const isGameOver = computed(() => balance.value < MIN_BET)

  // --- Hàm tung đồng xu (random) ---
  function generateCoins(): CoinFace[] {
    return Array.from({ length: 4 }, () => (Math.random() < 0.5 ? 'up' : 'down'))
  }

  // --- Hàm đặt cược ---
  function placeBet(type: BetType) {
    if (gamePhase.value !== 'betting') return
    betType.value = type
  }

  // --- Hàm thay đổi số tiền cược ---
  function setBetAmount(amount: number) {
    if (gamePhase.value !== 'betting') return
    betAmount.value = Math.min(Math.max(amount, MIN_BET), Math.min(balance.value, MAX_BET))
  }

  // --- Hàm xóc đĩa chính ---
  async function shake(): Promise<GameResult> {
    if (!canBet.value) throw new Error('Không thể đặt cược')

    // Chuyển sang trạng thái xóc
    gamePhase.value = 'shaking'

    // Chờ animation xóc
    await delay(SHAKE_DURATION)

    // Tạo kết quả random
    const result = generateCoins()
    coins.value = result

    // Chuyển sang trạng thái mở
    gamePhase.value = 'revealing'
    await delay(REVEAL_DELAY)

    // Tính kết quả
    const upCount = result.filter((c) => c === 'up').length
    const downCount = result.filter((c) => c === 'down').length
    const isEven = upCount % 2 === 0 // 0, 2, 4 mặt ngửa = chẵn; 1, 3 = lẻ
    const won = (betType.value === 'chan' && isEven) || (betType.value === 'le' && !isEven)

    const payout = won ? betAmount.value : -betAmount.value

    // Cập nhật số dư
    balance.value += payout

    // Tạo bản ghi kết quả
    const gameResult: GameResult = {
      coins: [...result],
      upCount,
      downCount,
      isEven,
      betType: betType.value,
      betAmount: betAmount.value,
      won,
      payout,
    }

    // Cập nhật lịch sử & thống kê
    lastResult.value = gameResult
    history.value.unshift(gameResult)
    if (history.value.length > 20) history.value.pop()

    updateStats(won)

    // Chuyển sang trạng thái hiển thị kết quả
    gamePhase.value = 'result'

    return gameResult
  }

  // --- Cập nhật thống kê ---
  function updateStats(won: boolean) {
    stats.value.totalGames++
    if (won) {
      stats.value.wins++
      stats.value.currentStreak = stats.value.currentStreak > 0 ? stats.value.currentStreak + 1 : 1
    } else {
      stats.value.losses++
      stats.value.currentStreak = stats.value.currentStreak < 0 ? stats.value.currentStreak - 1 : -1
    }
    stats.value.winRate =
      stats.value.totalGames > 0 ? Math.round((stats.value.wins / stats.value.totalGames) * 100) : 0
    stats.value.maxBalance = Math.max(stats.value.maxBalance, balance.value)
    stats.value.bestStreak = Math.max(stats.value.bestStreak, stats.value.currentStreak)
  }

  // --- Reset ván mới ---
  function newRound() {
    gamePhase.value = 'betting'
    betType.value = null
    lastResult.value = null
  }

  // --- Reset toàn bộ game ---
  function resetGame() {
    balance.value = INITIAL_BALANCE
    betAmount.value = MIN_BET
    betType.value = null
    gamePhase.value = 'betting'
    coins.value = ['up', 'up', 'up', 'up']
    lastResult.value = null
    history.value = []
    stats.value = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      maxBalance: INITIAL_BALANCE,
      currentStreak: 0,
      bestStreak: 0,
    }
  }

  return {
    // Trạng thái
    balance,
    betAmount,
    betType,
    gamePhase,
    coins,
    lastResult,
    history,
    stats,

    // Computed
    canBet,
    isGameOver,

    // Hằng số
    MIN_BET,
    MAX_BET,
    BET_PRESETS,

    // Hành động
    placeBet,
    setBetAmount,
    shake,
    newRound,
    resetGame,
  }
}

// --- Hàm tiện ích ---
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
