<template>
  <div class="justify-center w-full">
    <div class="header-bar">
      <div class="round-info">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface/50 backdrop-blur-sm px-5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral z-10 rounded-full"
        >
          &larr; Về trang chủ
        </RouterLink>
        <span class="round-badge">{{ ROUND_DATA[currentRound - 1]?.type || 'PVP' }}</span>
        {{ ROUND_DATA[currentRound - 1]?.name || 'Vòng Đấu' }}
      </div>
      <div class="timer" :class="{ hurry: timeLeft <= 10 && gameState === 'planning' }">
        ⏳ {{ gameState === 'planning' ? timeLeft + 's' : 'ĐANG CHIẾN' }}
      </div>
      <div class="player-stats">
        <span class="hp-box" :class="{ danger: playerHp === 1 }">❤️ {{ playerHp }}/3</span>
        <span class="gold-box">💰 {{ gold }}</span>
      </div>
    </div>

    <div class="battlefield">
      <div class="enemy-side">
        <h4 class="side-title">
          Đội hình Địch (Tối đa {{ Math.min(9, currentRound + 4) }} tướng) | Giá trị: 🪙
          {{ enemyPower }}
        </h4>
        <div class="board-grid">
          <div
            v-for="unit in enemyBoard"
            :key="unit?.id"
            class="unit-card"
            :class="`cost-${unit?.cost ?? 1}`"
          >
            <div class="range-badge">{{ unit?.rangeType === 'Xa' ? '🏹' : '🗡️' }}</div>
            <span class="stars">{{ '⭐'.repeat(unit?.stars ?? 1) }}</span>
            <span class="name">{{ unit?.name ?? 'Trống' }}</span>
            <div class="stats-row">
              <span title="Máu">❤️{{ unit?.hp ?? 0 }}</span>
              <span title="Sát thương">⚔️{{ unit?.atk ?? 0 }}</span>
              <span title="Giáp">🛡️{{ unit?.def ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="divider">VS</div>

      <div class="player-side">
        <h4 class="side-title">
          Bàn Đấu ({{ playerBoard.length }}/{{ level }}) | Giá trị:
          <span class="power-highlight">🪙 {{ playerPower }}</span>
        </h4>
        <div class="board-grid player-board" :class="{ 'sell-active': sellMode }">
          <div
            v-for="(unit, index) in playerBoard"
            :key="unit?.id ?? index"
            class="unit-card pointer"
            :class="`cost-${unit?.cost ?? 1}`"
            @click="handleUnitClick('board', index)"
            :title="
              sellMode ? `Click để bán: nhận lại ${getSellValue(unit)} vàng` : 'Click để rút về'
            "
          >
            <div v-if="sellMode" class="sell-badge">💸+{{ getSellValue(unit) }}</div>
            <div v-else class="range-badge">{{ unit?.rangeType === 'Xa' ? '🏹' : '🗡️' }}</div>

            <span class="stars">{{ '⭐'.repeat(unit?.stars ?? 1) }}</span>
            <span class="name">{{ unit?.name ?? 'Lỗi' }}</span>
            <div class="stats-row">
              <span>❤️{{ unit?.hp ?? 0 }}</span>
              <span>⚔️{{ unit?.atk ?? 0 }}</span>
              <span>🛡️{{ unit?.def ?? 0 }}</span>
            </div>
          </div>
          <div
            v-for="n in Math.max(0, level - playerBoard.length)"
            :key="'empty-board-' + n"
            class="unit-card empty-slot"
          >
            Trống
          </div>
        </div>
      </div>

      <div class="bench-side">
        <div class="bench-header">
          <h4 class="side-title">Hàng Chờ</h4>
          <button
            class="btn-toggle-sell"
            :class="{ active: sellMode }"
            @click="sellMode = !sellMode"
          >
            {{ sellMode ? '🔴 ĐANG BẬT BÁN TƯỚNG (Click để tắt)' : 'Bán Tướng (Phím E)' }}
          </button>
        </div>

        <div class="board-grid bench-grid" :class="{ 'sell-active': sellMode }">
          <div
            v-for="(slot, index) in playerBench"
            :key="'bench-' + index"
            class="unit-card bench-slot"
            :class="[slot ? `cost-${slot?.cost ?? 1} pointer` : 'empty-slot']"
            @click="handleUnitClick('bench', index)"
            :title="slot && sellMode ? `Click để bán: nhận lại ${getSellValue(slot)} vàng` : ''"
          >
            <template v-if="slot">
              <div v-if="sellMode" class="sell-badge">💸+{{ getSellValue(slot) }}</div>
              <div v-else class="range-badge">{{ slot?.rangeType === 'Xa' ? '🏹' : '🗡️' }}</div>

              <span class="stars">{{ '⭐'.repeat(slot?.stars ?? 1) }}</span>
              <span class="name">{{ slot?.name ?? 'Lỗi' }}</span>
              <div class="stats-row">
                <span>❤️{{ slot?.hp ?? 0 }}</span>
                <span>⚔️{{ slot?.atk ?? 0 }}</span>
                <span>🛡️{{ slot?.def ?? 0 }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="shop-container" :class="{ disabled: gameState !== 'planning' }">
      <div class="shop-controls">
        <button
          class="btn-buy-xp"
          @click="buyXp"
          :disabled="gold < 4 || level >= 10 || gameState !== 'planning'"
        >
          <span class="btn-title">Mua XP (4đ)</span>
          <span class="btn-sub">Cấp {{ level }} | {{ currentXp }}/{{ xpNeeded }}</span>
        </button>

        <button
          class="btn-roll"
          @click="rollShop(false)"
          :disabled="gold < 2 || gameState !== 'planning'"
        >
          <span class="btn-title">Đổi Lại (2đ)</span>
          <span class="btn-sub">Tỉ lệ cấp {{ level }}</span>
        </button>
      </div>

      <div class="shop-cards">
        <div
          v-for="(champ, index) in shop"
          :key="'shop-' + index"
          class="shop-card"
          :class="[champ ? `cost-${champ?.cost ?? 1}` : 'bought']"
          @click="buyChampion(index)"
        >
          <template v-if="champ">
            <div class="cost-badge">🪙 {{ champ?.cost ?? 1 }}</div>
            <div class="champ-info">
              <span class="champ-name">{{ champ?.name ?? 'Vô Danh' }}</span>
              <span class="champ-range">{{ champ?.rangeType === 'Xa' ? '🏹 Xa' : '🗡️ Gần' }}</span>
            </div>
            <div class="shop-stats">
              <span>❤️ {{ champ?.hp ?? 0 }}</span> | <span>⚔️ {{ champ?.atk ?? 0 }}</span> |
              <span>🛡️ {{ champ?.def ?? 0 }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="gameState === 'combat' || gameState === 'end'" class="overlay">
      <div class="result-modal">
        <h2 v-if="playerHp <= 0" class="text-danger">💀 TRÒ CHƠI KẾT THÚC 💀</h2>
        <h2 v-else-if="gameState === 'end'">🎉 BẠN ĐÃ PHÁ ĐẢO THÀNH CÔNG! 🎉</h2>
        <h2 v-else>KẾT QUẢ VÒNG {{ currentRound }}</h2>

        <div class="combat-stats">
          <div class="stat-box" :class="{ winner: isPlayerWin, loser: !isPlayerWin }">
            <p>Đội hình Bạn</p>
            <h3>🪙 {{ playerPower }}</h3>
          </div>
          <div class="vs-text">VS</div>
          <div class="stat-box" :class="{ winner: !isPlayerWin, loser: isPlayerWin }">
            <p>Đội hình Địch</p>
            <h3>🪙 {{ enemyPower }}</h3>
          </div>
        </div>

        <div v-if="playerHp > 0 && gameState !== 'end'">
          <h3 :class="isPlayerWin ? 'text-win' : 'text-danger'">
            {{ isPlayerWin ? '🏆 THẮNG! Giữ nguyên lượng máu.' : '💔 THUA! Bị trừ 1 Máu.' }}
          </h3>
          <p class="reward-text">
            Phần thưởng qua ải:
            <strong>+{{ roundReward.rewardGold }} vàng, +{{ roundReward.rewardXp }} XP</strong>
          </p>
          <button class="btn-restart" @click="nextRound">
            Tiếp tục Vòng {{ currentRound + 1 }} ➡️
          </button>
        </div>

        <div v-else>
          <p style="color: #ccc; margin-bottom: 20px">
            Bạn đã hết máu hoặc đã hoàn thành toàn bộ chiến dịch.
          </p>
          <button class="btn-restart" @click="resetGame">Chơi lại từ đầu 🔄</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// --- 1. Định nghĩa Typescript ---
type RangeType = 'Gần' | 'Xa'

interface ChampionData {
  name: string
  cost: number
  rangeType: RangeType
  hp: number
  atk: number
  def: number
}
interface Champion extends ChampionData {
  id: string
  stars: number
}

// --- 2. Dữ liệu Hệ thống ---
const LEVEL_XP: Record<number, number> = { 5: 10, 6: 20, 7: 36, 8: 72, 9: 84, 10: 0 }
const SHOP_ODDS: Record<number, number[]> = {
  5: [45, 33, 20, 2, 0],
  6: [25, 40, 30, 5, 0],
  7: [19, 30, 35, 15, 1],
  8: [18, 25, 32, 22, 3],
  9: [10, 20, 25, 35, 10],
  10: [5, 10, 20, 40, 25],
}

const CHAMPIONS_POOL: Record<number, { name: string; range: RangeType }[]> = {
  1: [
    { name: 'Axe', range: 'Gần' },
    { name: 'Jox', range: 'Gần' },
    { name: 'Warwic', range: 'Gần' },
    { name: 'Zooi', range: 'Xa' },
  ],
  2: [
    { name: 'Ah-ri', range: 'Xa' },
    { name: 'Kassida', range: 'Gần' },
    { name: 'Syndro', range: 'Xa' },
    { name: 'Nilaz', range: 'Gần' },
  ],
  3: [
    { name: 'Hecari', range: 'Gần' },
    { name: 'Jinxie', range: 'Xa' },
    { name: 'Katarin', range: 'Gần' },
    { name: 'Neko', range: 'Xa' },
  ],
  4: [
    { name: 'Fioro', range: 'Gần' },
    { name: 'Karmac', range: 'Xa' },
    { name: 'Nasox', range: 'Gần' },
    { name: 'Tarik', range: 'Gần' },
  ],
  5: [
    { name: 'Dianna', range: 'Gần' },
    { name: 'Morgan', range: 'Xa' },
    { name: 'Xerathos', range: 'Xa' },
    { name: 'Mili', range: 'Xa' },
  ],
}

const ROUND_DATA = [
  { type: 'PVE', name: 'Bãi Quái Đá', time: 30, targetPower: 12, rewardGold: 10, rewardXp: 4 },
  { type: 'PVP', name: 'Kẻ Địch Khởi Động', time: 30, targetPower: 25, rewardGold: 5, rewardXp: 2 },
  { type: 'PVE', name: 'Bãi Quái Sói', time: 30, targetPower: 45, rewardGold: 15, rewardXp: 8 },
  {
    type: 'PVP',
    name: 'Kẻ Địch Hạng Nặng',
    time: 30,
    targetPower: 90,
    rewardGold: 10,
    rewardXp: 4,
  },
  { type: 'PVP', name: 'Boss Hư Không', time: 40, targetPower: 180, rewardGold: 0, rewardXp: 0 },
]

// --- 3. State của Game ---
const currentRound = ref(1)
const gameState = ref<'planning' | 'combat' | 'end'>('planning')
const timeLeft = ref(30)
const sellMode = ref(false)

const playerHp = ref(3) // Máu người chơi
const gold = ref(30)
const level = ref(5)
const currentXp = ref(0)
const playerBoard = ref<Champion[]>([])
const playerBench = ref<(Champion | null)[]>(Array(9).fill(null))
const shop = ref<(ChampionData | null)[]>(Array(5).fill(null))

const enemyBoard = ref<Champion[]>([])

let timerInterval: ReturnType<typeof setInterval> | null = null

// --- 4. Computed ---
const xpNeeded = computed(() => LEVEL_XP[level.value] || 100)

const calcBoardPower = (board: (Champion | null)[]) => {
  return board.reduce((sum, u) => {
    if (!u) return sum
    const baseCost = u.cost || 1
    const starMultiplier = Math.pow(3, (u.stars || 1) - 1)
    return (sum as number) + baseCost * starMultiplier
  }, 0) as number
}

const playerPower = computed(() => calcBoardPower(playerBoard.value))
const enemyPower = computed(() => calcBoardPower(enemyBoard.value))
const isPlayerWin = computed(() => playerPower.value >= enemyPower.value)
const roundReward = computed(
  () => ROUND_DATA[currentRound.value - 1] || { rewardGold: 0, rewardXp: 0 },
)

const getSellValue = (unit?: Champion | null) => {
  if (!unit) return 0
  const totalCost = (unit.cost || 1) * Math.pow(3, (unit.stars || 1) - 1)
  return unit.stars > 1 ? totalCost - 1 : totalCost
}

// --- 5. Core Logic Sinh Tướng ---
const generateBaseStats = (cost: number, range: RangeType) => {
  if (range === 'Gần') return { hp: 500 + cost * 200, atk: 40 + cost * 15, def: 30 + cost * 10 }
  return { hp: 350 + cost * 120, atk: 60 + cost * 25, def: 15 + cost * 5 }
}

const getRandomChampByLevel = (overrideLevel?: number): ChampionData => {
  const lvl = overrideLevel || level.value
  const odds = SHOP_ODDS[lvl] || [19, 30, 35, 15, 1]
  const roll = Math.random() * 100
  let cumulative = 0
  let selectedCost = 1
  for (let i = 0; i < odds.length; i++) {
    cumulative += odds[i] || 0
    if (roll <= cumulative) {
      selectedCost = i + 1
      break
    }
  }
  if (selectedCost < 1 || selectedCost > 5) selectedCost = 1
  const pool = CHAMPIONS_POOL[selectedCost] || [{ name: 'Lỗi', range: 'Gần' as RangeType }]
  const randomTarget = pool[Math.floor(Math.random() * pool.length)] || {
    name: 'Lỗi',
    range: 'Gần' as RangeType,
  }
  const stats = generateBaseStats(selectedCost, randomTarget.range || 'Gần')
  return {
    name: randomTarget.name || 'Vô danh',
    cost: selectedCost,
    rangeType: randomTarget.range || 'Gần',
    ...stats,
  }
}

const rollShop = (isFree: boolean = false) => {
  if (!isFree) {
    if (gold.value < 2) return
    gold.value -= 2
  }
  shop.value = Array.from({ length: 5 }, () => getRandomChampByLevel())
}

const buyXp = () => {
  if (gold.value < 4 || level.value >= 10) return
  gold.value -= 4
  currentXp.value += 4
  if (currentXp.value >= xpNeeded.value && level.value < 10) {
    currentXp.value -= xpNeeded.value
    level.value++
  }
}

// --- 6. Cơ Chế Bán / Mua / Gộp Sao Người Chơi ---
const handleUnitClick = (zone: 'board' | 'bench', index: number) => {
  const list = zone === 'board' ? playerBoard.value : playerBench.value
  const unit = list[index]
  if (!unit) return

  if (sellMode.value) {
    gold.value += getSellValue(unit as Champion)
    if (zone === 'board') playerBoard.value.splice(index, 1)
    else playerBench.value[index] = null
  } else {
    if (zone === 'board') moveToBench(index)
    else moveToBoard(index)
  }
}

const attemptCombine = () => {
  let checkAgain = true
  while (checkAgain) {
    checkAgain = false
    const allUnits: { champ: Champion; isBoard: boolean }[] = []
    playerBoard.value.forEach((c) => {
      if (c) allUnits.push({ champ: c, isBoard: true })
    })
    playerBench.value.forEach((c) => {
      if (c) allUnits.push({ champ: c, isBoard: false })
    })

    const groups: Record<string, Champion[]> = {}
    allUnits.forEach((u) => {
      if (!u?.champ) return
      const key = `${u.champ.name}-${u.champ.stars}`
      if (!groups[key]) groups[key] = []
      groups[key].push(u.champ)
    })

    for (const key in groups) {
      const group = groups[key] || []
      if (group.length >= 3 && group[0] && group[0].stars < 3) {
        checkAgain = true
        const toCombine = group.slice(0, 3)!
        const targetId = toCombine[0]?.id
        const upgradedChamp: Champion = { ...toCombine[0]!, stars: toCombine[0]!.stars + 1 }!

        const keys = ['hp', 'atk', 'def'] as const
        const shuffled = [...keys].sort(() => 0.5 - Math.random())
        const k1 = shuffled[0] || 'hp'
        const k2 = shuffled[1] || 'atk'

        upgradedChamp[k1] = Math.floor((upgradedChamp[k1] || 100) * 1.2)
        upgradedChamp[k2] = Math.floor((upgradedChamp[k2] || 50) * 1.2)

        const removeUnit = (id: string) => {
          const bIdx = playerBoard.value.findIndex((c) => c?.id === id)
          if (bIdx > -1) playerBoard.value.splice(bIdx, 1)
          const benchIdx = playerBench.value.findIndex((c) => c?.id === id)
          if (benchIdx > -1) playerBench.value[benchIdx] = null
        }
        removeUnit(toCombine[1]!.id!)
        removeUnit(toCombine[2]!.id!)

        const boardIdx = playerBoard.value.findIndex((c) => c?.id === targetId)
        if (boardIdx > -1) playerBoard.value[boardIdx] = upgradedChamp
        else {
          const benchIdx = playerBench.value.findIndex((c) => c?.id === targetId)
          if (benchIdx > -1) playerBench.value[benchIdx] = upgradedChamp
        }
        break
      }
    }
  }
}

const buyChampion = (index: number) => {
  const champData = shop.value[index]
  if (!champData || gold.value < (champData.cost || 1)) return
  const emptyBenchIndex = playerBench.value.findIndex((slot) => slot === null)
  if (emptyBenchIndex === -1) {
    alert('Hàng chờ đã đầy!')
    return
  }

  gold.value -= champData.cost || 1
  playerBench.value[emptyBenchIndex] = {
    ...champData,
    id: `champ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    stars: 1,
  }
  shop.value[index] = null
  attemptCombine()
}

const moveToBoard = (benchIdx: number) => {
  const c = playerBench.value[benchIdx]
  if (!c) return
  if (playerBoard.value.length >= level.value) {
    alert('Bàn đã đầy!')
    return
  }
  playerBoard.value.push(c)
  playerBench.value[benchIdx] = null
}
const moveToBench = (boardIdx: number) => {
  const c = playerBoard.value[boardIdx]
  if (!c) return
  const emptyBenchIndex = playerBench.value.findIndex((slot) => slot === null)
  if (emptyBenchIndex === -1) {
    alert('Hàng chờ đầy!')
    return
  }
  playerBench.value[emptyBenchIndex] = c
  playerBoard.value.splice(boardIdx, 1)
}

// --- 7. Quản lý Địch (Tự động gộp sao & giới hạn) ---
const createEnemyUnit = (data: ChampionData, stars: number): Champion => {
  const stats = generateBaseStats(data.cost, data.rangeType)
  const multiplier = stars === 3 ? 1.5 : stars === 2 ? 1.2 : 1
  return {
    id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    stars,
    ...data,
    hp: Math.floor((stats.hp || 500) * multiplier),
    atk: Math.floor((stats.atk || 50) * multiplier),
    def: Math.floor((stats.def || 30) * multiplier),
  }
}

const generateEnemyForRound = () => {
  const targetVal = ROUND_DATA[currentRound.value - 1]?.targetPower || 10
  const isPve = ROUND_DATA[currentRound.value - 1]?.type === 'PVE'
  enemyBoard.value = []

  if (isPve) {
    const count = currentRound.value === 1 ? 3 : 5
    const cost = currentRound.value === 1 ? 2 : 4
    for (let i = 0; i < count; i++) {
      enemyBoard.value.push(
        createEnemyUnit(
          {
            name: currentRound.value === 1 ? 'Quái Đá' : 'Sói Hắc Ám',
            cost: cost,
            rangeType: 'Gần',
            hp: 0,
            atk: 0,
            def: 0, // Base stats auto gen inside createEnemyUnit
          },
          1,
        ),
      )
    }
  } else {
    let currentVal = 0
    let loopGuard = 0
    const maxEnemyLevel = Math.min(9, currentRound.value + 4) // Giới hạn tướng địch trên sân

    // AI sẽ liên tục "mua" tướng cho đến khi đạt targetPower hoặc hết slot
    while (currentVal < targetVal && loopGuard < 100) {
      loopGuard++
      const unitData = getRandomChampByLevel(maxEnemyLevel)

      // Thuật toán: Tìm xem có sẵn tướng này 1 sao không để gộp
      const ones = enemyBoard.value.filter((u) => u.name === unitData.name && u.stars === 1) ?? []

      if (ones.length >= 2) {
        // Có 2 con 1 sao -> Lên 2 sao
        enemyBoard.value = enemyBoard.value.filter(
          (u) => u.id !== ones[0]?.id && u.id !== ones[1]?.id,
        )

        // Lên 2 sao xong, xem có 2 con 2 sao nào không để lên 3 sao luôn
        const twos = enemyBoard.value.filter((u) => u.name === unitData.name && u.stars === 2)
        if (twos.length >= 2) {
          enemyBoard.value = enemyBoard.value.filter(
            (u) => u.id !== twos[0]?.id && u.id !== twos[1]?.id,
          )
          enemyBoard.value.push(createEnemyUnit(unitData, 3))
          currentVal += unitData.cost * 9 - unitData.cost * 8 // Trừ lại tiền 2 con cũ
        } else {
          enemyBoard.value.push(createEnemyUnit(unitData, 2))
          currentVal += unitData.cost * 3 - unitData.cost * 2
        }
      } else {
        // Nếu không gộp được, chỉ được thêm nếu bàn địch chưa đầy
        if (enemyBoard.value.length < maxEnemyLevel) {
          enemyBoard.value.push(createEnemyUnit(unitData, 1))
          currentVal += unitData.cost
        }
      }
    }
  }
}

// --- 8. Vòng Lặp Trận Đấu ---
const resolveCombat = () => {
  if (!isPlayerWin.value) {
    playerHp.value -= 1 // Trừ máu nếu thua
  }

  if (playerHp.value <= 0) {
    gameState.value = 'end' // Hết máu -> Thua Game
  } else if (currentRound.value >= 5) {
    gameState.value = 'end' // Đánh xong boss -> Thắng Game
  } else {
    gameState.value = 'combat' // Chuyển cảnh chờ qua màn
  }
}

const nextRound = () => {
  gold.value += roundReward.value.rewardGold
  currentXp.value += roundReward.value.rewardXp
  while (currentXp.value >= xpNeeded.value && level.value < 10) {
    currentXp.value -= xpNeeded.value
    level.value++
  }

  currentRound.value++
  timeLeft.value = ROUND_DATA[currentRound.value - 1]?.time || 30
  sellMode.value = false
  gameState.value = 'planning'

  generateEnemyForRound()
  rollShop(true)
  startTimer()
}

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
    else {
      clearInterval(timerInterval!)
      resolveCombat()
    }
  }, 1000)
}

const resetGame = () => {
  if (timerInterval) clearInterval(timerInterval)
  currentRound.value = 1
  gameState.value = 'planning'
  sellMode.value = false
  playerHp.value = 3 // Khôi phục máu
  gold.value = 30
  level.value = 5
  currentXp.value = 0
  playerBoard.value = []
  playerBench.value = Array(9).fill(null)

  timeLeft.value = ROUND_DATA[0]?.time ?? 30
  generateEnemyForRound()
  rollShop(true)
  startTimer()
}

onMounted(() => resetGame())
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Phím tắt E
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && gameState.value === 'planning')
      sellMode.value = !sellMode.value
  })
})
</script>

<style scoped>
/* Toàn bộ style cũ giữ nguyên, tối ưu thêm màu sắc cho máu (HP) */
.tft-board {
  max-width: 900px;
  margin: 0 auto;
  background-color: #1a1c23;
  color: #f0e6d2;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  border: 4px solid #3e3222;
  border-radius: 12px;
  overflow: hidden;
  user-select: none;
  position: relative;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #111217;
  border-bottom: 2px solid #3e3222;
  font-size: 1.2rem;
  font-weight: bold;
}
.round-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.round-badge {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.timer {
  color: #a3c7c7;
  min-width: 80px;
  text-align: center;
}
.timer.hurry {
  color: #ff4d4d;
  animation: pulse 1s infinite;
}

.player-stats {
  display: flex;
  gap: 15px;
}
.hp-box {
  color: #2ecc71;
  transition: color 0.3s;
}
.hp-box.danger {
  color: #e74c3c;
  animation: pulse 1s infinite;
}
.gold-box {
  color: #f1c40f;
}

.battlefield {
  padding: 20px;
}
.side-title {
  margin: 0 0 10px 0;
  color: #a3c7c7;
  text-align: center;
  font-size: 1rem;
}
.power-highlight {
  color: #f1c40f;
  font-weight: bold;
}
.divider {
  text-align: center;
  color: #ff4d4d;
  font-weight: bold;
  margin: 10px 0;
  font-size: 1.2rem;
}

.board-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  min-height: 95px;
}

.sell-active .unit-card {
  cursor: crosshair;
  border-color: #e74c3c;
}
.sell-active .unit-card:hover {
  transform: scale(0.95);
  background-color: rgba(231, 76, 60, 0.2);
  border-color: #ff4d4d;
}
.sell-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background: #e74c3c;
  color: white;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.8rem;
  z-index: 2;
  border: 1px solid white;
}

.bench-side {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #3e3222;
}
.bench-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
}
.btn-toggle-sell {
  background: #333;
  color: white;
  border: 1px solid #666;
  padding: 5px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-toggle-sell.active {
  background: #e74c3c;
  border-color: #ff4d4d;
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

.bench-grid {
  background-color: #111217;
  padding: 10px;
  border-radius: 8px;
}

.unit-card {
  width: 82px;
  height: 95px;
  background-color: #2c3e50;
  border: 2px solid #555;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  font-size: 0.8rem;
  padding: 4px 2px;
  position: relative;
  transition:
    transform 0.1s,
    border-color 0.2s;
}
.unit-card.pointer {
  cursor: pointer;
}
.unit-card.pointer:hover:not(.sell-active) {
  transform: translateY(-3px);
  border-color: #f1c40f;
}
.empty-slot {
  background-color: transparent;
  border: 2px dashed #444;
  color: #666;
  justify-content: center;
}

.range-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  font-size: 1.1rem;
  background: #111;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #c8aa6e;
}
.stars {
  color: #f1c40f;
  font-size: 0.8rem;
  margin-bottom: 2px;
  height: 16px;
}
.name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.stats-row {
  display: flex;
  gap: 4px;
  font-size: 0.65rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 4px;
  border-radius: 4px;
  width: 90%;
  justify-content: space-between;
}

.shop-container {
  display: flex;
  padding: 15px;
  background-color: #0b0c10;
  border-top: 3px solid #c8aa6e;
  gap: 15px;
  transition: opacity 0.3s;
}
.shop-container.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.shop-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 140px;
}

button {
  border: none;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
}
button:active:not(:disabled) {
  transform: scale(0.95);
}
button:disabled {
  filter: grayscale(1);
  cursor: not-allowed;
}
.btn-buy-xp {
  background: linear-gradient(180deg, #2b5c7a, #1a3c54);
  color: white;
  border: 1px solid #4a8bb3;
}
.btn-roll {
  background: linear-gradient(180deg, #c8aa6e, #8b7344);
  color: #111;
  border: 1px solid #e2c78a;
}

.shop-cards {
  display: flex;
  gap: 10px;
  flex: 1;
}
.shop-card {
  flex: 1;
  background-color: #1e2328;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
  padding: 10px 5px;
  text-align: center;
}
.shop-card:hover:not(.bought) {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(200, 170, 110, 0.3);
}
.shop-card.bought {
  background-color: transparent;
  border: 2px dashed #333;
  cursor: default;
}

.cost-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.8rem;
}
.champ-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}
.champ-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: #f0e6d2;
}
.champ-range {
  font-size: 0.75rem;
  color: #a3c7c7;
}
.shop-stats {
  font-size: 0.75rem;
  color: #ccc;
}
.cost-1 {
  border-color: #8c92a0;
}
.cost-2 {
  border-color: #1abc9c;
}
.cost-3 {
  border-color: #3498db;
}
.cost-4 {
  border-color: #9b59b6;
}
.cost-5 {
  border-color: #f1c40f;
  box-shadow: inset 0 0 10px rgba(241, 196, 15, 0.2);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  animation: fadeIn 0.3s;
}
.result-modal {
  background: #1e2328;
  padding: 40px;
  border: 3px solid #c8aa6e;
  border-radius: 12px;
  text-align: center;
  min-width: 400px;
}
.result-modal h2 {
  margin-top: 0;
  color: #f0e6d2;
}
.combat-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 30px 0;
}
.stat-box {
  background: #111;
  padding: 15px 30px;
  border-radius: 8px;
  border: 2px solid #444;
}
.stat-box.winner {
  border-color: #f1c40f;
  box-shadow: 0 0 20px rgba(241, 196, 15, 0.3);
  transform: scale(1.1);
}
.stat-box.loser {
  border-color: #555;
  opacity: 0.7;
  filter: grayscale(0.8);
}
.stat-box p {
  margin: 0;
  color: #a3c7c7;
  font-size: 0.9rem;
}
.stat-box h3 {
  margin: 10px 0 0 0;
  font-size: 1.8rem;
  color: #f1c40f;
}
.vs-text {
  font-size: 1.5rem;
  color: #ff4d4d;
  font-weight: bold;
}
.text-win {
  color: #f1c40f;
  font-size: 1.5rem;
  margin: 20px 0;
}
.text-danger {
  color: #ff4d4d;
  font-size: 1.5rem;
  margin: 20px 0;
}
.reward-text {
  color: #2ecc71;
  font-size: 1.1rem;
  margin-bottom: 30px;
}
.btn-restart {
  background: linear-gradient(180deg, #c8aa6e, #8b7344);
  color: #000;
  padding: 12px 30px;
  font-size: 1.2rem;
  cursor: pointer;
  border: none;
  font-weight: bold;
  border-radius: 6px;
  transition: transform 0.1s;
}
.btn-restart:hover {
  transform: scale(1.05);
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
