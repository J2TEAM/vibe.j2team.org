<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

const MILESTONES = [5, 10, 15, 20, 25, 30] as const

const housePrice = ref('3,000,000,000')
const downPaymentPercent = ref(30)
const interestRate = ref(8.5)
const loanTerm = ref(20)
const monthlyRent = ref('8,000,000')
const rentInflation = ref(5)
const appreciation = ref(6)
const investReturn = ref(10)
const maintenanceRate = ref(1)
const showResults = ref(false)

function parseNum(val: string): number {
  return parseInt(val.replace(/\D/g, '')) || 0
}

function formatInput(val: string): string {
  const raw = val.replace(/\D/g, '')
  if (raw === '') return ''
  return parseInt(raw).toLocaleString('en-US')
}

function onHousePriceInput() {
  housePrice.value = formatInput(housePrice.value)
}

function onRentInput() {
  monthlyRent.value = formatInput(monthlyRent.value)
}

function fmtCurrency(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + ' tỷ'
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + ' triệu'
  }
  return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' đ'
}

function calcMonthlyMortgage(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0
  if (annualRate <= 0) return principal / (years * 12)
  const r = annualRate / 100 / 12
  const n = years * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function calcRemainingLoan(
  principal: number,
  annualRate: number,
  totalYears: number,
  paidYears: number,
): number {
  if (principal <= 0 || paidYears >= totalYears) return 0
  if (annualRate <= 0) return principal * (1 - paidYears / totalYears)
  const r = annualRate / 100 / 12
  const n = totalYears * 12
  const p = paidYears * 12
  const monthlyPmt = calcMonthlyMortgage(principal, annualRate, totalYears)
  return (monthlyPmt * (1 - Math.pow(1 + r, -(n - p)))) / r
}

interface YearlyData {
  year: number
  totalBuyCost: number
  totalRentCost: number
  houseValue: number
  equity: number
  remainingLoan: number
  investmentValue: number
  netBuyCost: number
  netRentCost: number
  buyAdvantage: number
  monthlyMortgage: number
  yearlyRent: number
}

const result = computed(() => {
  const hp = parseNum(housePrice.value)
  const mr = parseNum(monthlyRent.value)
  if (hp <= 0 || mr <= 0) return null

  const dp = hp * (downPaymentPercent.value / 100)
  const loanAmount = hp - dp
  const monthly = calcMonthlyMortgage(loanAmount, interestRate.value, loanTerm.value)
  const maxYears = Math.max(loanTerm.value, 30)

  const yearly: YearlyData[] = []
  let cumBuy = dp
  let cumRent = 0

  for (let y = 1; y <= maxYears; y++) {
    const yearlyMortgage = y <= loanTerm.value ? monthly * 12 : 0
    const yearlyMaintenance =
      hp * Math.pow(1 + appreciation.value / 100, y - 1) * (maintenanceRate.value / 100)
    cumBuy += yearlyMortgage + yearlyMaintenance

    const yearRent = mr * 12 * Math.pow(1 + rentInflation.value / 100, y - 1)
    cumRent += yearRent

    const hv = hp * Math.pow(1 + appreciation.value / 100, y)
    const remaining = calcRemainingLoan(loanAmount, interestRate.value, loanTerm.value, y)
    const eq = hv - remaining
    const inv = dp * Math.pow(1 + investReturn.value / 100, y)

    const netBuy = cumBuy - eq
    const netRent = cumRent - inv + dp

    yearly.push({
      year: y,
      totalBuyCost: cumBuy,
      totalRentCost: cumRent,
      houseValue: hv,
      equity: eq,
      remainingLoan: remaining,
      investmentValue: inv,
      netBuyCost: netBuy,
      netRentCost: netRent,
      buyAdvantage: netRent - netBuy,
      monthlyMortgage: y <= loanTerm.value ? monthly : 0,
      yearlyRent: yearRent,
    })
  }

  let breakEven: number | null = null
  for (const d of yearly) {
    if (d.buyAdvantage > 0) {
      breakEven = d.year
      break
    }
  }

  const milestoneData = MILESTONES.filter((m) => m <= maxYears)
    .map((m) => {
      const d = yearly[m - 1]
      return d ? { ...d, isBuyBetter: d.buyAdvantage > 0 } : null
    })
    .filter((d): d is YearlyData & { isBuyBetter: boolean } => d !== null)

  return {
    downPayment: dp,
    loanAmount,
    monthlyMortgage: monthly,
    yearly,
    breakEven,
    milestoneData,
    maxYears,
  }
})

const chartMaxYear = computed(() => {
  if (!result.value) return 20
  return Math.min(result.value.maxYears, 30)
})

const chartData = computed(() => {
  if (!result.value) return []
  return result.value.yearly.slice(0, chartMaxYear.value)
})

const chartMaxVal = computed(() => {
  if (!chartData.value.length) return 1
  let max = 0
  for (const d of chartData.value) {
    max = Math.max(max, Math.abs(d.netBuyCost), Math.abs(d.netRentCost))
  }
  return max || 1
})

const showDetailTable = ref(false)

watch(
  () => [
    housePrice.value,
    downPaymentPercent.value,
    interestRate.value,
    loanTerm.value,
    monthlyRent.value,
    rentInflation.value,
    appreciation.value,
    investReturn.value,
    maintenanceRate.value,
  ],
  () => {
    showResults.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <nav class="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2 animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>
    </nav>

    <header
      class="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 animate-fade-up animate-delay-1"
    >
      <h1 class="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-accent-coral">
        So Sánh Mua Nhà vs Thuê Nhà
      </h1>
      <p class="mt-1.5 text-text-secondary text-xs sm:text-sm">
        Phân tích tài chính chi tiết để quyết định nên mua hay thuê nhà dựa trên lạm phát, lãi suất
        và lợi nhuận đầu tư
      </p>
    </header>

    <main class="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pb-8">
      <div
        class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-4 animate-fade-up animate-delay-2"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
          <span class="text-text-secondary font-display font-semibold text-sm">Thông tin nhà</span>
        </div>
        <div class="space-y-4">
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Giá nhà
            </label>
            <div class="relative">
              <input
                v-model="housePrice"
                type="text"
                inputmode="numeric"
                class="w-full px-4 pr-12 py-3 text-lg sm:text-xl font-bold bg-bg-elevated border border-border-default text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none transition"
                placeholder="Nhập giá nhà..."
                @input="onHousePriceInput"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim font-semibold"
                >₫</span
              >
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
              >
                Trả trước ({{ downPaymentPercent }}%)
              </label>
              <input
                v-model.number="downPaymentPercent"
                type="range"
                min="0"
                max="100"
                class="w-full accent-coral"
              />
              <div class="flex justify-between text-xs text-text-dim mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <label
                class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
              >
                Lãi suất vay (%/năm)
              </label>
              <input
                v-model.number="interestRate"
                type="number"
                step="0.1"
                min="0"
                max="30"
                class="w-full px-4 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
              />
            </div>
          </div>
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Thời hạn vay (năm)
            </label>
            <div class="flex gap-1 flex-wrap">
              <button
                v-for="y in [5, 10, 15, 20, 25, 30]"
                :key="y"
                class="px-4 py-2 text-sm font-display font-semibold border transition"
                :class="
                  loanTerm === y
                    ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                    : 'border-border-default text-text-dim hover:text-text-secondary hover:border-text-secondary'
                "
                @click="loanTerm = y"
              >
                {{ y }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-4 animate-fade-up animate-delay-3"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="text-accent-amber font-display text-xs tracking-widest">//</span>
          <span class="text-text-secondary font-display font-semibold text-sm"
            >Thông tin thuê nhà</span
          >
        </div>
        <div class="space-y-4">
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Tiền thuê hàng tháng
            </label>
            <div class="relative">
              <input
                v-model="monthlyRent"
                type="text"
                inputmode="numeric"
                class="w-full px-4 pr-12 py-3 text-lg sm:text-xl font-bold bg-bg-elevated border border-border-default text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none transition"
                placeholder="Nhập tiền thuê..."
                @input="onRentInput"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim font-semibold"
                >₫</span
              >
            </div>
          </div>
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Tốc độ tăng giá thuê ({{ rentInflation }}%/năm)
            </label>
            <input
              v-model.number="rentInflation"
              type="range"
              min="0"
              max="20"
              step="0.5"
              class="w-full accent-amber"
            />
            <div class="flex justify-between text-xs text-text-dim mt-1">
              <span>0%</span>
              <span>20%</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-6 animate-fade-up animate-delay-4"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="text-accent-sky font-display text-xs tracking-widest">//</span>
          <span class="text-text-secondary font-display font-semibold text-sm"
            >Giả định kỳ vọng</span
          >
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Tăng giá nhà (%/năm)
            </label>
            <input
              v-model.number="appreciation"
              type="number"
              step="0.5"
              min="0"
              max="30"
              class="w-full px-4 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
            />
          </div>
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Lợi suất đầu tư (%/năm)
            </label>
            <input
              v-model.number="investReturn"
              type="number"
              step="0.5"
              min="0"
              max="50"
              class="w-full px-4 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
            />
          </div>
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Chi phí bảo trì (%/năm)
            </label>
            <input
              v-model.number="maintenanceRate"
              type="number"
              step="0.1"
              min="0"
              max="10"
              class="w-full px-4 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      <button
        class="w-full py-3.5 font-display font-bold text-sm tracking-wider uppercase border-2 border-accent-coral text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep animate-fade-up animate-delay-5 mb-6"
        @click="showResults = true"
      >
        <Icon icon="lucide:calculator" class="inline size-4 mr-2 -mt-0.5" />
        So sánh ngay
      </button>

      <template v-if="showResults && result">
        <div class="bg-bg-elevated border-2 border-accent-coral p-4 sm:p-6 mb-6 animate-fade-up">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
            <span class="text-text-dim text-sm font-display">Điểm hòa vốn</span>
          </div>
          <div v-if="result.breakEven" class="mt-2">
            <h2 class="font-display text-3xl sm:text-4xl font-bold text-accent-coral">
              Năm thứ {{ result.breakEven }}
            </h2>
            <p class="text-text-secondary text-sm mt-1">
              Sau {{ result.breakEven }} năm, mua nhà bắt đầu có lợi hơn thuê nhà về mặt tài chính
            </p>
          </div>
          <div v-else class="mt-2">
            <h2 class="font-display text-2xl sm:text-3xl font-bold text-accent-amber">
              Thuê nhà có lợi hơn
            </h2>
            <p class="text-text-secondary text-sm mt-1">
              Trong {{ result.maxYears }} năm phân tích, thuê nhà luôn có lợi hơn về mặt tài chính
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div class="border border-border-default bg-bg-deep p-3">
              <div class="text-xs text-text-dim">Trả trước</div>
              <div class="font-display font-bold text-text-primary mt-1">
                {{ fmtCurrency(result.downPayment) }}
              </div>
            </div>
            <div class="border border-border-default bg-bg-deep p-3">
              <div class="text-xs text-text-dim">Trả góp/tháng</div>
              <div class="font-display font-bold text-accent-coral mt-1">
                {{ fmtCurrency(result.monthlyMortgage) }}
              </div>
            </div>
          </div>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 animate-fade-up animate-delay-1"
        >
          <div
            v-for="ms in result.milestoneData"
            :key="ms.year"
            class="border bg-bg-surface p-4"
            :class="ms.isBuyBetter ? 'border-accent-coral' : 'border-border-default'"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="font-display font-bold text-lg text-text-primary"
                >{{ ms.year }} năm</span
              >
              <span
                class="text-xs font-display font-semibold px-2 py-1 border"
                :class="
                  ms.isBuyBetter
                    ? 'text-accent-coral border-accent-coral'
                    : 'text-accent-amber border-accent-amber'
                "
              >
                {{ ms.isBuyBetter ? 'Nên mua' : 'Nên thuê' }}
              </span>
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-text-dim">Chi phí ròng mua</span>
                <span class="font-display font-semibold text-accent-coral">{{
                  fmtCurrency(ms.netBuyCost)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-dim">Chi phí ròng thuê</span>
                <span class="font-display font-semibold text-accent-amber">{{
                  fmtCurrency(ms.netRentCost)
                }}</span>
              </div>
              <div class="border-t border-border-default pt-2 flex justify-between">
                <span class="text-text-dim">Chênh lệch</span>
                <span
                  class="font-display font-bold"
                  :class="ms.buyAdvantage > 0 ? 'text-accent-coral' : 'text-accent-amber'"
                  >{{ ms.buyAdvantage > 0 ? '+' : '' }}{{ fmtCurrency(ms.buyAdvantage) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-6 animate-fade-up animate-delay-2"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-accent-sky font-display text-xs tracking-widest">//</span>
            <span class="text-text-secondary font-display font-semibold text-sm"
              >Chi phí ròng theo thời gian</span
            >
          </div>
          <div class="space-y-2">
            <div v-for="d in chartData" :key="d.year" class="flex items-center gap-2 text-xs">
              <span class="w-8 text-right font-display font-semibold text-text-dim shrink-0">{{
                d.year
              }}</span>
              <div class="flex-1 flex flex-col gap-0.5">
                <div class="flex items-center gap-1">
                  <div
                    class="h-3 bg-accent-coral/70 transition-all duration-300"
                    :style="{
                      width: Math.max(1, (Math.abs(d.netBuyCost) / chartMaxVal) * 100) + '%',
                    }"
                  />
                  <span
                    v-if="d.year % 5 === 0"
                    class="text-accent-coral font-display shrink-0 hidden sm:inline"
                    >{{ fmtCurrency(d.netBuyCost) }}</span
                  >
                </div>
                <div class="flex items-center gap-1">
                  <div
                    class="h-3 bg-accent-amber/70 transition-all duration-300"
                    :style="{
                      width: Math.max(1, (Math.abs(d.netRentCost) / chartMaxVal) * 100) + '%',
                    }"
                  />
                  <span
                    v-if="d.year % 5 === 0"
                    class="text-accent-amber font-display shrink-0 hidden sm:inline"
                    >{{ fmtCurrency(d.netRentCost) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-4 mt-4 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-accent-coral/70" />
              <span class="text-text-secondary">Chi phí ròng mua nhà</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-accent-amber/70" />
              <span class="text-text-secondary">Chi phí ròng thuê nhà</span>
            </div>
          </div>
        </div>

        <div class="animate-fade-up animate-delay-3">
          <button
            class="w-full py-3 font-display font-semibold text-sm border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-coral hover:text-text-primary flex items-center justify-center gap-2"
            @click="showDetailTable = !showDetailTable"
          >
            <Icon
              :icon="showDetailTable ? 'lucide:chevron-up' : 'lucide:chevron-down'"
              class="size-4"
            />
            {{ showDetailTable ? 'Ẩn bảng chi tiết' : 'Xem bảng chi tiết theo năm' }}
          </button>

          <div
            v-if="showDetailTable && result"
            class="border border-border-default border-t-0 bg-bg-surface overflow-x-auto"
          >
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-bg-elevated text-text-dim font-display">
                  <th class="px-3 py-2 text-left sticky left-0 bg-bg-elevated z-10">Năm</th>
                  <th class="px-3 py-2 text-right">Giá trị nhà</th>
                  <th class="px-3 py-2 text-right">Vốn sở hữu</th>
                  <th class="px-3 py-2 text-right">Tổng trả (mua)</th>
                  <th class="px-3 py-2 text-right">Tổng trả (thuê)</th>
                  <th class="px-3 py-2 text-right">Đầu tư tích lũy</th>
                  <th class="px-3 py-2 text-right">Ròng (mua)</th>
                  <th class="px-3 py-2 text-right">Ròng (thuê)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="d in result.yearly.filter((_, i) => i < 5 || (i + 1) % 5 === 0)"
                  :key="d.year"
                  class="border-t border-border-default hover:bg-bg-elevated/50 transition"
                >
                  <td
                    class="px-3 py-2 font-display font-semibold text-text-primary sticky left-0 bg-bg-surface z-10"
                  >
                    {{ d.year }}
                  </td>
                  <td class="px-3 py-2 text-right text-text-secondary">
                    {{ fmtCurrency(d.houseValue) }}
                  </td>
                  <td class="px-3 py-2 text-right text-accent-sky">{{ fmtCurrency(d.equity) }}</td>
                  <td class="px-3 py-2 text-right text-text-secondary">
                    {{ fmtCurrency(d.totalBuyCost) }}
                  </td>
                  <td class="px-3 py-2 text-right text-text-secondary">
                    {{ fmtCurrency(d.totalRentCost) }}
                  </td>
                  <td class="px-3 py-2 text-right text-accent-sky">
                    {{ fmtCurrency(d.investmentValue) }}
                  </td>
                  <td class="px-3 py-2 text-right font-display font-semibold text-accent-coral">
                    {{ fmtCurrency(d.netBuyCost) }}
                  </td>
                  <td class="px-3 py-2 text-right font-display font-semibold text-accent-amber">
                    {{ fmtCurrency(d.netRentCost) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-fade-up animate-delay-4">
          <div class="border border-border-default bg-bg-surface p-4">
            <h3
              class="font-display font-semibold text-text-primary text-sm mb-3 flex items-center gap-2"
            >
              <span class="text-accent-sky text-xs tracking-widest">//</span>
              Giải thích
            </h3>
            <ul class="text-xs text-text-secondary space-y-2 list-none">
              <li class="flex gap-2">
                <span class="text-text-dim shrink-0">&bull;</span>
                <span
                  ><strong class="text-text-primary">Chi phí ròng mua</strong> = Tổng tiền bỏ ra
                  (trả trước + gốc lãi + bảo trì) trừ đi giá trị tài sản ròng (vốn sở hữu)</span
                >
              </li>
              <li class="flex gap-2">
                <span class="text-text-dim shrink-0">&bull;</span>
                <span
                  ><strong class="text-text-primary">Chi phí ròng thuê</strong> = Tổng tiền thuê
                  tích lũy trừ đi lợi nhuận đầu tư (nếu đem tiền trả trước đi đầu tư) + tiền trả
                  trước</span
                >
              </li>
              <li class="flex gap-2">
                <span class="text-text-dim shrink-0">&bull;</span>
                <span
                  ><strong class="text-text-primary">Điểm hòa vốn</strong> = Thời điểm mua nhà có
                  lợi hơn thuê nhà (chi phí ròng mua thấp hơn)</span
                >
              </li>
            </ul>
          </div>

          <div class="border border-border-default bg-bg-surface p-4">
            <div class="flex items-start gap-2">
              <span class="text-accent-amber font-display text-xs tracking-widest shrink-0 mt-0.5"
                >//</span
              >
              <div class="text-xs text-text-dim leading-relaxed">
                <p>
                  <span class="text-text-secondary font-semibold">Lưu ý:</span>
                  Kết quả chỉ mang tính chất tham khảo dựa trên giả định đầu vào. Thực tế có nhiều
                  yếu tố khác như: chi phí giao dịch, thuế chuyển nhượng, chi phí cơ hội thời gian,
                  nhu cầu cá nhân, v.v. Vui lòng cân nhắc kỹ trước khi quyết định.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <footer
      class="text-center py-4 text-xs text-text-dim font-display tracking-wide animate-fade-up animate-delay-6"
    >
      Made with love by
      <a
        href="https://www.facebook.com/William.2418/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent-coral font-semibold link-underline"
        >Thành Long</a
      >
    </footer>
  </div>
</template>

<style scoped>
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--color-border-default);
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  cursor: pointer;
  border: 2px solid var(--color-bg-deep);
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  cursor: pointer;
  border: 2px solid var(--color-bg-deep);
  border-radius: 0;
}

.accent-coral::-webkit-slider-thumb {
  background: var(--color-accent-coral);
}

.accent-coral::-moz-range-thumb {
  background: var(--color-accent-coral);
}

.accent-amber::-webkit-slider-thumb {
  background: var(--color-accent-amber);
}

.accent-amber::-moz-range-thumb {
  background: var(--color-accent-amber);
}
</style>
