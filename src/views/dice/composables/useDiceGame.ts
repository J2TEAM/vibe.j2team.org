import { ref, computed } from 'vue'
import { uuid, sha512hex, deriveRoll } from '../utils/crypto'
import type { RevealedPair, HistoryEntry } from '../types'

export function useDiceGame() {
  // -- Seed State (Quản lý Hash và Seed để đảm bảo tính minh bạch) --
  const activeClientSeed = ref(uuid())
  const activeServerSeed = ref(uuid())
  const activeServerSeedHash = ref('')
  const nonce = ref(0) // Số lần đã roll với cặp seed hiện tại
  const prevSeed = ref<RevealedPair | null>(null) // Lưu seed cũ sau khi đổi để người dùng kiểm tra
  const newClientSeedInput = ref('')

  // Khởi tạo hash cho server seed khi bắt đầu
  async function initHash() {
    activeServerSeedHash.value = await sha512hex(activeServerSeed.value)
  }
  initHash()

  // Đổi seed mới (Rotate)
  async function rotateSeeds() {
    prevSeed.value = {
      clientSeed: activeClientSeed.value,
      serverSeed: activeServerSeed.value,
      serverSeedHash: activeServerSeedHash.value,
      rolls: nonce.value,
    }
    const nc = newClientSeedInput.value.trim() || uuid()
    const ns = uuid()
    activeClientSeed.value = nc
    activeServerSeed.value = ns
    activeServerSeedHash.value = await sha512hex(ns)
    newClientSeedInput.value = ''
    nonce.value = 0
  }

  // -- Balance State with Persistence --
  const savedBalance = localStorage.getItem('dice_balance')
  const balance = ref(savedBalance ? parseFloat(savedBalance) : 1000)

  function setBalance(newVal: number) {
    balance.value = Math.round(newVal * 100) / 100
    localStorage.setItem('dice_balance', balance.value.toString())
  }

  // -- Auto Bet State --
  const isAutoMode = ref(false)
  const isAutoRunning = ref(false)
  const autoSettings = ref({
    onWin: 'reset' as 'reset' | 'increase',
    onWinValue: 0,
    onLose: 'reset' as 'reset' | 'increase',
    onLoseValue: 0,
    stopOnProfit: 0,
    stopOnLoss: 0,
    totalRolls: 0, // 0 means infinite
  })
  const autoRollCount = ref(0)
  const startBalance = ref(balance.value)

  // -- Game State (Trạng thái trò chơi) --
  const prediction = ref(50) // Ngưỡng dự đoán
  const mode = ref<'under' | 'over'>('under') // Chế độ Roll Under hay Over
  const luckyNumber = ref<number | null>(null) // Kết quả số may mắn
  const isRolling = ref(false) // Trạng thái đang quay xúc xắc
  const playAmount = ref(10) // Số tiền cược mỗi ván
  const lastResult = ref<'win' | 'lose' | null>(null) // Kết quả thắng/thua ván cuối
  const isBigWin = ref(false) // Trạng thái thắng lớn (tỉ lệ thấp)
  const history = ref<HistoryEntry[]>([]) // Lịch sử các ván chơi

  // -- Computed (Các giá trị tính toán tự động) --
  // Tính xác suất thắng thực tế dựa trên số lượng kết quả thắng (0-99)
  const chanceToWin = computed(() => {
    // Under X: thắng nếu kết quả < X (tức là từ 0 đến X-1) => có đúng X kết quả thắng
    // Over X: thắng nếu kết quả > X (tức là từ X+1 đến 99) => có 99 - (X+1) + 1 = 99 - X kết quả thắng
    return mode.value === 'under' ? prediction.value : 100 - (prediction.value + 1)
  })

  // Multiplier = (100 - HouseEdge) / Chance. Ví dụ: 50/50 thì ăn 1.98x (phí 1%)
  const multiplier = computed(() => {
    const chance = chanceToWin.value
    if (chance <= 0) return '0.0000'
    return (99 / chance).toFixed(4)
  })

  // Tính lợi nhuận dự kiến nếu thắng
  const profitOnWin = computed(() => {
    const m = parseFloat(multiplier.value)
    return Math.max(0, playAmount.value * m - playAmount.value).toFixed(2)
  })

  // Tính % vị trí của slider
  const sliderPct = computed(() => ((prediction.value - 2) / 96) * 100)
  const isGameOver = computed(() => balance.value <= 0)
  const houseEdge = computed(() => 1.0) // Nhà cái thu phí 1% cố định
  const winCount = computed(() => history.value.filter((h) => h.won).length)
  const loseCount = computed(() => history.value.filter((h) => !h.won).length)

  // -- Actions (Các hàm xử lý tương tác) --
  // Kiểm tra và giới hạn số tiền cược không vượt quá số dư
  function clamp() {
    if (playAmount.value > Math.floor(balance.value))
      playAmount.value = Math.max(1, Math.floor(balance.value))
  }
  const halfPlay = () => (playAmount.value = Math.max(1, Math.floor(playAmount.value / 2)))
  const doublePlay = () =>
    (playAmount.value = Math.min(Math.floor(balance.value), playAmount.value * 2))
  const maxPlay = () => (playAmount.value = Math.floor(balance.value))

  // Hàm thực hiện Roll xúc xắc
  async function roll() {
    if (isRolling.value || (isGameOver.value && !isAutoRunning.value)) return
    clamp()
    if (playAmount.value <= 0 || playAmount.value > balance.value) {
      if (isAutoRunning.value) stopAuto()
      return
    }

    isRolling.value = true
    luckyNumber.value = null
    lastResult.value = null

    const thisNonce = nonce.value
    // Lấy kết quả ngẫu nhiên minh bạch từ thuật toán Provably Fair
    const result = await deriveRoll(activeServerSeed.value, activeClientSeed.value, thisNonce)
    nonce.value++

    // Giả lập thời gian chờ quay xúc xắc (chạy nhanh hơn trong mode auto)
    await new Promise((r) => setTimeout(r, isAutoRunning.value ? 200 : 500))

    luckyNumber.value = result
    const won = mode.value === 'under' ? result < prediction.value : result > prediction.value
    const profit = parseFloat(profitOnWin.value)
    const delta = won ? profit : -playAmount.value

    // Lưu vào lịch sử
    history.value = [
      {
        nonce: thisNonce,
        result,
        mode: mode.value,
        prediction: prediction.value,
        won,
        delta,
        clientSeed: activeClientSeed.value,
        serverSeedHash: activeServerSeedHash.value,
      },
      ...history.value,
    ].slice(0, 100)

    // Cập nhật số dư
    setBalance(balance.value + delta)
    lastResult.value = won ? 'win' : 'lose'

    // Kích hoạt hiệu ứng thắng lớn nếu tỉ lệ thắng <= 10%
    if (won && chanceToWin.value <= 10) {
      isBigWin.value = true
      setTimeout(() => {
        isBigWin.value = false
      }, 3000)
    }

    // Logic cho Auto Bet
    if (isAutoRunning.value) {
      autoRollCount.value++

      // Stop conditions
      const currentProfit = balance.value - startBalance.value
      if (autoSettings.value.stopOnProfit > 0 && currentProfit >= autoSettings.value.stopOnProfit) {
        stopAuto()
      } else if (
        autoSettings.value.stopOnLoss > 0 &&
        currentProfit <= -autoSettings.value.stopOnLoss
      ) {
        stopAuto()
      } else if (
        autoSettings.value.totalRolls > 0 &&
        autoRollCount.value >= autoSettings.value.totalRolls
      ) {
        stopAuto()
      } else {
        // Adjust bet amount
        if (won) {
          if (autoSettings.value.onWin === 'increase') {
            playAmount.value = playAmount.value * (1 + autoSettings.value.onWinValue / 100)
          } else {
            // reset or default
            // keep playAmount as is if configured to reset to base (we don't save base yet, so let's assume current is base or reset manually)
          }
        } else {
          if (autoSettings.value.onLose === 'increase') {
            playAmount.value = playAmount.value * (1 + autoSettings.value.onLoseValue / 100)
          }
        }
        clamp()

        // Next roll
        setTimeout(() => {
          if (isAutoRunning.value) roll()
        }, 100)
      }
    }

    clamp()
    isRolling.value = false
  }

  function startAuto() {
    if (isRolling.value || isAutoRunning.value) return
    isAutoRunning.value = true
    autoRollCount.value = 0
    startBalance.value = balance.value
    roll()
  }

  function stopAuto() {
    isAutoRunning.value = false
  }

  // Khởi tạo lại trò chơi về trạng thái ban đầu
  function resetGame() {
    setBalance(1000)
    playAmount.value = 10
    luckyNumber.value = null
    lastResult.value = null
    history.value = []
    stopAuto()
  }

  return {
    activeClientSeed,
    activeServerSeed,
    activeServerSeedHash,
    nonce,
    prevSeed,
    newClientSeedInput,
    rotateSeeds,
    prediction,
    mode,
    luckyNumber,
    isRolling,
    balance,
    playAmount,
    lastResult,
    history,
    chanceToWin,
    multiplier,
    profitOnWin,
    sliderPct,
    isGameOver,
    winCount,
    loseCount,
    halfPlay,
    doublePlay,
    maxPlay,
    roll,
    resetGame,
    clamp,
    houseEdge,
    isBigWin,
    isAutoMode,
    isAutoRunning,
    autoSettings,
    autoRollCount,
    startAuto,
    stopAuto,
  }
}
