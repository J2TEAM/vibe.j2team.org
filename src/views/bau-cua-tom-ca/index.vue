<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'

interface Animal {
  id: string
  name: string
  emoji: string
}

interface Bet {
  animalId: string
  amount: number
}

interface HistoryItem {
  results: string[]
  bets: Bet[]
  payout: number
  timestamp: number
}

// Danh sách 6 linh vật
const animals: Animal[] = [
  { id: 'bau', name: 'Bầu', emoji: '🎃' },
  { id: 'cua', name: 'Cua', emoji: '🦀' },
  { id: 'tom', name: 'Tôm', emoji: '🦐' },
  { id: 'ca', name: 'Cá', emoji: '🐟' },
  { id: 'ga', name: 'Gà', emoji: '🐓' },
  { id: 'nai', name: 'Nai', emoji: '🦌' },
]

// State management
const balance = useLocalStorage('bau-cua-balance', 1000)
const bets = ref<Bet[]>([])
const results = ref<string[]>([])
const history = useLocalStorage<HistoryItem[]>('bau-cua-history', [])
const isShaking = ref(false)
const betAmount = ref(50)
const lastPayout = ref(0)

// Computed
const totalBet = computed(() => bets.value.reduce((sum, bet) => sum + bet.amount, 0))

const canPlay = computed(
  () => totalBet.value > 0 && totalBet.value <= balance.value && !isShaking.value,
)

// Hàm shaking: chọn ngẫu nhiên 3 linh vật
function shaking(): string[] {
  const result: string[] = []
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * animals.length)
    result.push(animals[randomIndex]!.id)
  }
  return result
}

// Hàm payout: tính toán tiền thắng/thua
function calculatePayout(diceResults: string[], playerBets: Bet[]): number {
  let totalPayout = 0

  for (const bet of playerBets) {
    // Đếm số lần linh vật xuất hiện trong kết quả
    const matchCount = diceResults.filter((r) => r === bet.animalId).length

    if (matchCount > 0) {
      // Nhận lại tiền cược + thắng n × tiền cược
      totalPayout += bet.amount + matchCount * bet.amount
    }
  }

  return totalPayout
}

// Đặt cược vào 1 linh vật
function placeBet(animalId: string) {
  if (isShaking.value) return

  const existingBet = bets.value.find((b) => b.animalId === animalId)

  if (existingBet) {
    existingBet.amount += betAmount.value
  } else {
    bets.value.push({ animalId, amount: betAmount.value })
  }
}

// Xóa cược của 1 linh vật
function removeBet(animalId: string) {
  bets.value = bets.value.filter((b) => b.animalId !== animalId)
}

// Xóa tất cả cược
function clearAllBets() {
  bets.value = []
}

// Lắc xúc xắc và tính kết quả
async function play() {
  if (!canPlay.value) return

  isShaking.value = true
  results.value = []
  lastPayout.value = 0

  // Trừ tiền đặt cược
  balance.value -= totalBet.value

  // Animation lắc (hiệu ứng random trong 2 giây)
  const shakeDuration = 2000
  const shakeInterval = 100
  let elapsed = 0

  const shakeTimer = setInterval(() => {
    results.value = shaking()
    elapsed += shakeInterval

    if (elapsed >= shakeDuration) {
      clearInterval(shakeTimer)
      finishGame()
    }
  }, shakeInterval)
}

function finishGame() {
  // Kết quả cuối cùng
  const finalResults = shaking()
  results.value = finalResults

  // Tính toán tiền thắng
  const payout = calculatePayout(finalResults, bets.value)
  lastPayout.value = payout
  balance.value += payout

  // Lưu lịch sử
  history.value.unshift({
    results: finalResults,
    bets: [...bets.value],
    payout: payout - totalBet.value, // Lợi nhuận thực
    timestamp: Date.now(),
  })

  // Giới hạn lịch sử 10 ván gần nhất
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }

  // Reset cược
  bets.value = []
  isShaking.value = false
}

// Reset game
function resetGame() {
  balance.value = 1000
  bets.value = []
  results.value = []
  history.value = []
  lastPayout.value = 0
}

// Lấy emoji của linh vật theo id
function getAnimalEmoji(id: string): string {
  return animals.find((a) => a.id === id)?.emoji || '❓'
}

// Lấy số tiền đã đặt vào linh vật
function getBetAmount(animalId: string): number {
  return bets.value.find((b) => b.animalId === animalId)?.amount || 0
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body py-8 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8 animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold text-accent-coral mb-4">
          Bầu Cua Tôm Cá
        </h1>
        <p class="text-text-secondary text-lg max-w-2xl mx-auto">
          Game xúc xắc truyền thống Việt Nam. Đặt cược vào các linh vật, nếu trúng
          <span class="text-accent-amber font-semibold">n</span> mặt, bạn nhận lại tiền cược + thắng
          <span class="text-accent-amber font-semibold">n × tiền cược</span>
        </p>
        <div
          class="mt-4 inline-flex items-center gap-2 bg-accent-amber/10 border border-accent-amber/30 px-4 py-2 text-sm text-accent-amber rounded-sm"
        >
          <Icon icon="lucide:info" class="flex-shrink-0" />
          <span>Trò chơi giải trí, sử dụng xu ảo — không liên quan tiền thật</span>
        </div>
      </div>

      <!-- Số dư -->
      <div
        class="bg-bg-surface border border-border-default p-6 mb-8 animate-fade-up animate-delay-1"
      >
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="text-text-dim text-sm font-display tracking-wide uppercase mb-1">Số dư</div>
            <div class="font-display text-3xl font-bold text-accent-amber">
              {{ balance.toLocaleString() }} xu
            </div>
          </div>

          <div v-if="totalBet > 0" class="text-right">
            <div class="text-text-dim text-sm font-display tracking-wide uppercase mb-1">
              Tổng cược
            </div>
            <div class="font-display text-2xl font-semibold text-accent-coral">
              {{ totalBet.toLocaleString() }} xu
            </div>
          </div>

          <button
            @click="resetGame"
            class="border border-border-default bg-bg-elevated px-4 py-2 text-sm transition hover:border-accent-sky hover:text-accent-sky"
          >
            <Icon icon="lucide:rotate-ccw" class="inline-block mr-2" />
            Reset
          </button>
        </div>
      </div>

      <!-- Khu vực kết quả -->
      <div
        v-if="results.length > 0"
        class="bg-bg-surface border-2 border-accent-amber p-8 mb-8 text-center animate-fade-up animate-delay-2"
      >
        <div class="text-text-dim text-sm font-display tracking-widest uppercase mb-4">Kết quả</div>
        <div class="flex items-center justify-center gap-4 mb-6">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="text-8xl transition-transform"
            :class="isShaking ? 'animate-spin' : 'scale-110'"
          >
            {{ getAnimalEmoji(result) }}
          </div>
        </div>

        <div v-if="!isShaking && lastPayout > 0" class="mb-4">
          <div
            class="inline-block font-display text-2xl font-bold px-6 py-3"
            :class="
              lastPayout >= totalBet
                ? 'text-accent-amber bg-accent-amber/10'
                : 'text-accent-coral bg-accent-coral/10'
            "
          >
            {{ lastPayout >= totalBet ? '🎉 Thắng' : '💸 Thua' }}
            {{ (lastPayout - totalBet).toLocaleString() }} xu
          </div>
        </div>

        <div
          v-if="isShaking"
          class="text-accent-amber font-display text-lg tracking-wider animate-pulse"
        >
          Đang lắc...
        </div>
      </div>

      <!-- Chọn số tiền đặt cược -->
      <div
        class="bg-bg-surface border border-border-default p-6 mb-8 animate-fade-up animate-delay-3"
      >
        <div class="text-text-primary text-lg font-display mb-4 flex items-center gap-3">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Chọn mức cược
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <button
            v-for="amount in [10, 50, 100, 500, 1000]"
            :key="amount"
            @click="betAmount = amount"
            class="border px-4 py-3 font-display font-semibold transition"
            :class="
              betAmount === amount
                ? 'border-accent-coral bg-accent-coral text-bg-deep'
                : 'border-border-default bg-bg-elevated hover:border-accent-coral hover:text-accent-coral'
            "
          >
            {{ amount.toLocaleString() }} xu
          </button>
        </div>
      </div>

      <!-- Bàn cược - 6 linh vật -->
      <div class="mb-8 animate-fade-up animate-delay-4">
        <div class="text-text-primary text-lg font-display mb-4 flex items-center gap-3">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Đặt cược vào linh vật
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            v-for="animal in animals"
            :key="animal.id"
            @click="placeBet(animal.id)"
            :disabled="isShaking"
            class="relative border bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/10 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              getBetAmount(animal.id) > 0 ? 'border-accent-coral border-2' : 'border-border-default'
            "
          >
            <div class="text-6xl mb-3">{{ animal.emoji }}</div>
            <div class="font-display text-xl font-semibold mb-2">{{ animal.name }}</div>

            <div
              v-if="getBetAmount(animal.id) > 0"
              class="mt-3 pt-3 border-t border-border-default"
            >
              <div class="text-accent-coral font-display font-bold text-lg mb-2">
                {{ getBetAmount(animal.id).toLocaleString() }} xu
              </div>
              <button
                @click.stop="removeBet(animal.id)"
                class="text-xs text-text-dim hover:text-accent-coral transition"
              >
                <Icon icon="lucide:x" class="inline-block mr-1" />
                Xóa cược
              </button>
            </div>
          </button>
        </div>
      </div>

      <!-- Nút điều khiển -->
      <div class="flex items-center justify-center gap-4 mb-8 animate-fade-up animate-delay-5">
        <button
          v-if="bets.length > 0"
          @click="clearAllBets"
          :disabled="isShaking"
          class="border border-border-default bg-bg-surface px-6 py-3 text-sm transition hover:border-accent-sky hover:text-accent-sky disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="lucide:trash-2" class="inline-block mr-2" />
          Xóa tất cả cược
        </button>

        <button
          @click="play"
          :disabled="!canPlay"
          class="border-2 px-8 py-3 font-display text-lg font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="
            canPlay
              ? 'border-accent-amber bg-accent-amber text-bg-deep hover:bg-accent-amber/90 hover:shadow-lg hover:shadow-accent-amber/20'
              : 'border-border-default bg-bg-elevated text-text-dim'
          "
        >
          <Icon icon="lucide:dices" class="inline-block mr-2" />
          {{ isShaking ? 'Đang lắc...' : 'Lắc xúc xắc' }}
        </button>
      </div>

      <!-- Lịch sử -->
      <div
        v-if="history.length > 0"
        class="bg-bg-surface border border-border-default p-6 mb-8 animate-fade-up animate-delay-6"
      >
        <div class="text-text-primary text-lg font-display mb-4 flex items-center gap-3">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Lịch sử ({{ history.length }} ván gần nhất)
        </div>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="border border-border-default bg-bg-elevated p-4 hover:border-accent-coral/50 transition"
          >
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-3">
                <div class="text-3xl">
                  {{ item.results.map((r) => getAnimalEmoji(r)).join(' ') }}
                </div>
                <div class="text-text-dim text-xs">
                  {{ new Date(item.timestamp).toLocaleTimeString('vi-VN') }}
                </div>
              </div>

              <div
                class="font-display font-bold"
                :class="item.payout >= 0 ? 'text-accent-amber' : 'text-accent-coral'"
              >
                {{ item.payout >= 0 ? '+' : '' }}{{ item.payout.toLocaleString() }} xu
              </div>
            </div>

            <div class="mt-2 text-text-secondary text-sm">
              Đã cược:
              <span v-for="(bet, i) in item.bets" :key="i" class="mr-2">
                {{ getAnimalEmoji(bet.animalId) }} {{ bet.amount.toLocaleString() }} xu
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Back to home -->
      <div class="text-center animate-fade-up animate-delay-7">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
