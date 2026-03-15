<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

type VehicleType = 'car' | 'motorcycle'

const vehicleType = ref<VehicleType>('car')

const vehiclePrice = ref('800,000,000')
const downPaymentPercent = ref(30)
const registrationFee = ref('80,000,000')
const interestRate = ref(8.5)
const loanTerm = ref(7)
const insurancePerYear = ref('15,000,000')
const fuelPerMonth = ref('5,000,000')
const maintenancePerYear = ref('10,000,000')
const showResults = ref(false)
const amortView = ref<'year' | 'month'>('year')
const showAmortTable = ref(false)

const CAR_DEFAULTS = {
  vehiclePrice: '800,000,000',
  downPaymentPercent: 30,
  registrationFee: '80,000,000',
  interestRate: 8.5,
  loanTerm: 7,
  insurancePerYear: '15,000,000',
  fuelPerMonth: '5,000,000',
  maintenancePerYear: '10,000,000',
} as const

const BIKE_DEFAULTS = {
  vehiclePrice: '50,000,000',
  downPaymentPercent: 30,
  registrationFee: '2,500,000',
  interestRate: 8.5,
  loanTerm: 2,
  insurancePerYear: '1,000,000',
  fuelPerMonth: '1,500,000',
  maintenancePerYear: '2,000,000',
} as const

function applyDefaults(type: VehicleType) {
  const d = type === 'car' ? CAR_DEFAULTS : BIKE_DEFAULTS
  vehicleType.value = type
  vehiclePrice.value = d.vehiclePrice
  downPaymentPercent.value = d.downPaymentPercent
  registrationFee.value = d.registrationFee
  interestRate.value = d.interestRate
  loanTerm.value = d.loanTerm
  insurancePerYear.value = d.insurancePerYear
  fuelPerMonth.value = d.fuelPerMonth
  maintenancePerYear.value = d.maintenancePerYear
}

function parseNum(val: string): number {
  return parseInt(val.replace(/\D/g, '')) || 0
}

function formatInput(val: string): string {
  const raw = val.replace(/\D/g, '')
  if (raw === '') return ''
  return parseInt(raw).toLocaleString('en-US')
}

function onVehiclePriceInput() {
  vehiclePrice.value = formatInput(vehiclePrice.value)
}

function onRegistrationFeeInput() {
  registrationFee.value = formatInput(registrationFee.value)
}

function onInsuranceInput() {
  insurancePerYear.value = formatInput(insurancePerYear.value)
}

function onFuelInput() {
  fuelPerMonth.value = formatInput(fuelPerMonth.value)
}

function onMaintenanceInput() {
  maintenancePerYear.value = formatInput(maintenancePerYear.value)
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

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0
  if (annualRate <= 0) return principal / (years * 12)
  const r = annualRate / 100 / 12
  const n = years * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

interface AmortRow {
  period: number
  label: string
  payment: number
  principal: number
  interest: number
  balance: number
}

function buildAmortSchedule(
  principal: number,
  annualRate: number,
  years: number,
  byMonth: boolean,
): AmortRow[] {
  if (principal <= 0 || years <= 0) return []
  const monthly = calcMonthlyPayment(principal, annualRate, years)
  const r = annualRate / 100 / 12
  const rows: AmortRow[] = []
  let balance = principal
  const totalMonths = years * 12

  if (byMonth) {
    for (let m = 1; m <= totalMonths; m++) {
      const interest = balance * r
      const principalPaid = monthly - interest
      balance = Math.max(0, balance - principalPaid)
      rows.push({
        period: m,
        label: `T${m}`,
        payment: monthly,
        principal: principalPaid,
        interest,
        balance,
      })
    }
    return rows
  }

  for (let y = 1; y <= years; y++) {
    let totPrincipal = 0
    let totInterest = 0
    const monthsThisYear = y < years ? 12 : totalMonths - (years - 1) * 12
    for (let i = 0; i < monthsThisYear; i++) {
      const interest = balance * r
      const principalPaid = monthly - interest
      totPrincipal += principalPaid
      totInterest += interest
      balance = Math.max(0, balance - principalPaid)
    }
    rows.push({
      period: y,
      label: `Năm ${y}`,
      payment: monthly * monthsThisYear,
      principal: totPrincipal,
      interest: totInterest,
      balance,
    })
  }
  return rows
}

const result = computed(() => {
  const price = parseNum(vehiclePrice.value)
  if (price <= 0) return null

  const down = price * (downPaymentPercent.value / 100)
  const loanAmount = price - down
  const regFee = parseNum(registrationFee.value)
  const ins = parseNum(insurancePerYear.value)
  const fuel = parseNum(fuelPerMonth.value)
  const maint = parseNum(maintenancePerYear.value)
  const years = loanTerm.value
  const monthlyPmt = calcMonthlyPayment(loanAmount, interestRate.value, years)
  const totalRepayment = monthlyPmt * 12 * years
  const totalInterest = totalRepayment - loanAmount
  const upfrontCost = down + regFee
  const totalLoanCost = totalRepayment
  const totalInsurance = ins * years
  const totalFuel = fuel * 12 * years
  const totalMaintenance = maint * years
  const totalCostOfOwnership =
    upfrontCost + totalLoanCost + totalInsurance + totalFuel + totalMaintenance

  const costBreakdown = [
    { label: 'Vay (gốc + lãi)', value: totalLoanCost, color: 'accent-coral' },
    { label: 'Bảo hiểm', value: totalInsurance, color: 'accent-amber' },
    { label: 'Xăng', value: totalFuel, color: 'accent-sky' },
    { label: 'Bảo dưỡng', value: totalMaintenance, color: 'text-text-secondary' },
  ].filter((x) => x.value > 0)

  const annualCostRows = []
  for (let y = 1; y <= years; y++) {
    annualCostRows.push({
      year: y,
      loan: monthlyPmt * 12,
      insurance: ins,
      fuel: fuel * 12,
      maintenance: maint,
      total: monthlyPmt * 12 + ins + fuel * 12 + maint,
    })
  }

  const amortByYear = buildAmortSchedule(loanAmount, interestRate.value, years, false)
  const amortByMonth = buildAmortSchedule(loanAmount, interestRate.value, years, true)
  const chartMax = Math.max(totalLoanCost, totalInsurance, totalFuel, totalMaintenance, 1)

  return {
    downPayment: down,
    loanAmount,
    monthlyPayment: monthlyPmt,
    totalRepayment,
    totalInterest,
    upfrontCost,
    totalCostOfOwnership,
    costBreakdown,
    chartMax,
    annualCostRows,
    amortByYear,
    amortByMonth,
    years,
  }
})

watch(
  () => [
    vehiclePrice.value,
    downPaymentPercent.value,
    registrationFee.value,
    interestRate.value,
    loanTerm.value,
    insurancePerYear.value,
    fuelPerMonth.value,
    maintenancePerYear.value,
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
        Tính Tiền Vay Mua Xe
      </h1>
      <p class="mt-1.5 text-text-secondary text-xs sm:text-sm">
        Tính khoản trả góp hàng tháng, tổng lãi và tổng chi phí sở hữu xe (vay + bảo hiểm + xăng +
        bảo dưỡng)
      </p>
    </header>

    <main class="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pb-8">
      <div
        class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-4 animate-fade-up animate-delay-2"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
          <span class="text-text-secondary font-display font-semibold text-sm">Loại xe</span>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 py-3 px-4 font-display font-semibold text-sm border transition"
            :class="
              vehicleType === 'car'
                ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                : 'border-border-default text-text-dim hover:text-text-secondary hover:border-text-secondary'
            "
            @click="applyDefaults('car')"
          >
            <Icon icon="lucide:car" class="inline size-4 mr-2 -mt-0.5" />
            Ô tô
          </button>
          <button
            type="button"
            class="flex-1 py-3 px-4 font-display font-semibold text-sm border transition"
            :class="
              vehicleType === 'motorcycle'
                ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                : 'border-border-default text-text-dim hover:text-text-secondary hover:border-text-secondary'
            "
            @click="applyDefaults('motorcycle')"
          >
            <Icon icon="lucide:bike" class="inline size-4 mr-2 -mt-0.5" />
            Xe máy
          </button>
        </div>
      </div>

      <div
        class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-4 animate-fade-up animate-delay-2"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="text-accent-amber font-display text-xs tracking-widest">//</span>
          <span class="text-text-secondary font-display font-semibold text-sm"
            >Thông tin vay & xe</span
          >
        </div>
        <div class="space-y-4">
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Giá xe
            </label>
            <div class="relative">
              <input
                v-model="vehiclePrice"
                type="text"
                inputmode="numeric"
                class="w-full px-4 pr-12 py-3 text-lg sm:text-xl font-bold bg-bg-elevated border border-border-default text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none transition"
                placeholder="Nhập giá xe..."
                @input="onVehiclePriceInput"
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
                Phí trước bạ
              </label>
              <div class="relative">
                <input
                  v-model="registrationFee"
                  type="text"
                  inputmode="numeric"
                  class="w-full px-4 pr-10 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
                  @input="onRegistrationFeeInput"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim text-xs"
                  >₫</span
                >
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
              >
                Lãi suất (%/năm)
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
            <div>
              <label
                class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
              >
                Thời hạn vay (năm)
              </label>
              <select
                v-model.number="loanTerm"
                class="w-full px-4 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
              >
                <option v-for="y in vehicleType === 'car' ? 10 : 5" :key="y" :value="y">
                  {{ y }} năm
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div
        class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-6 animate-fade-up animate-delay-3"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="text-accent-sky font-display text-xs tracking-widest">//</span>
          <span class="text-text-secondary font-display font-semibold text-sm"
            >Chi phí vận hành (ước tính)</span
          >
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Bảo hiểm (/năm)
            </label>
            <div class="relative">
              <input
                v-model="insurancePerYear"
                type="text"
                inputmode="numeric"
                class="w-full px-4 pr-10 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
                @input="onInsuranceInput"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">₫</span>
            </div>
          </div>
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Xăng (/tháng)
            </label>
            <div class="relative">
              <input
                v-model="fuelPerMonth"
                type="text"
                inputmode="numeric"
                class="w-full px-4 pr-10 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
                @input="onFuelInput"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">₫</span>
            </div>
          </div>
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Bảo dưỡng (/năm)
            </label>
            <div class="relative">
              <input
                v-model="maintenancePerYear"
                type="text"
                inputmode="numeric"
                class="w-full px-4 pr-10 py-2.5 bg-bg-elevated border border-border-default text-text-primary focus:border-accent-coral focus:outline-none transition"
                @input="onMaintenanceInput"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim text-xs">₫</span>
            </div>
          </div>
        </div>
      </div>

      <button
        class="w-full py-3.5 font-display font-bold text-sm tracking-wider uppercase border-2 border-accent-coral text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep animate-fade-up animate-delay-5 mb-6"
        @click="showResults = true"
      >
        <Icon icon="lucide:calculator" class="inline size-4 mr-2 -mt-0.5" />
        Tính toán
      </button>

      <template v-if="showResults && result">
        <div class="bg-bg-elevated border-2 border-accent-coral p-4 sm:p-6 mb-6 animate-fade-up">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
            <span class="text-text-dim text-sm font-display">Khoản trả hàng tháng</span>
          </div>
          <div class="mt-2">
            <h2 class="font-display text-3xl sm:text-4xl font-bold text-accent-coral">
              {{ fmtCurrency(result.monthlyPayment) }}
            </h2>
            <p class="text-text-secondary text-sm mt-1">
              Trả góp trong {{ result.years }} năm (gốc + lãi)
            </p>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div class="border border-border-default bg-bg-deep p-3">
              <div class="text-xs text-text-dim">Tổng trả (gốc + lãi)</div>
              <div class="font-display font-bold text-text-primary mt-1">
                {{ fmtCurrency(result.totalRepayment) }}
              </div>
            </div>
            <div class="border border-border-default bg-bg-deep p-3">
              <div class="text-xs text-text-dim">Tổng lãi</div>
              <div class="font-display font-bold text-accent-amber mt-1">
                {{ fmtCurrency(result.totalInterest) }}
              </div>
            </div>
            <div class="border border-border-default bg-bg-deep p-3">
              <div class="text-xs text-text-dim">Chi phí ban đầu</div>
              <div class="font-display font-bold text-text-primary mt-1">
                {{ fmtCurrency(result.upfrontCost) }}
              </div>
            </div>
            <div class="border border-border-default bg-bg-deep p-3">
              <div class="text-xs text-text-dim">Tổng chi phí sở hữu</div>
              <div class="font-display font-bold text-accent-sky mt-1">
                {{ fmtCurrency(result.totalCostOfOwnership) }}
              </div>
            </div>
          </div>
        </div>

        <div
          class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-6 animate-fade-up animate-delay-1"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-accent-sky font-display text-xs tracking-widest">//</span>
            <span class="text-text-secondary font-display font-semibold text-sm"
              >Cơ cấu chi phí ({{ result.years }} năm)</span
            >
          </div>
          <div class="space-y-2">
            <div
              v-for="item in result.costBreakdown"
              :key="item.label"
              class="flex items-center gap-2 text-xs"
            >
              <span class="w-24 shrink-0 text-text-dim font-display">{{ item.label }}</span>
              <div class="flex-1 flex items-center gap-2">
                <div
                  class="h-6 transition-all duration-300"
                  :class="{
                    'bg-accent-coral/70': item.color === 'accent-coral',
                    'bg-accent-amber/70': item.color === 'accent-amber',
                    'bg-accent-sky/70': item.color === 'accent-sky',
                    'bg-text-secondary/70': item.color === 'text-text-secondary',
                  }"
                  :style="{
                    width: Math.max(4, (item.value / result.chartMax) * 100) + '%',
                  }"
                />
                <span class="font-display font-semibold shrink-0">{{
                  fmtCurrency(item.value)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-6 animate-fade-up animate-delay-2"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-accent-amber font-display text-xs tracking-widest">//</span>
            <span class="text-text-secondary font-display font-semibold text-sm"
              >Chi phí hàng năm</span
            >
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-bg-elevated text-text-dim font-display">
                  <th class="px-3 py-2 text-left">Năm</th>
                  <th class="px-3 py-2 text-right">Trả góp</th>
                  <th class="px-3 py-2 text-right">Bảo hiểm</th>
                  <th class="px-3 py-2 text-right">Xăng</th>
                  <th class="px-3 py-2 text-right">Bảo dưỡng</th>
                  <th class="px-3 py-2 text-right">Tổng/năm</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in result.annualCostRows"
                  :key="row.year"
                  class="border-t border-border-default hover:bg-bg-elevated/50 transition"
                >
                  <td class="px-3 py-2 font-display font-semibold text-text-primary">
                    {{ row.year }}
                  </td>
                  <td class="px-3 py-2 text-right text-text-secondary">
                    {{ fmtCurrency(row.loan) }}
                  </td>
                  <td class="px-3 py-2 text-right text-text-secondary">
                    {{ fmtCurrency(row.insurance) }}
                  </td>
                  <td class="px-3 py-2 text-right text-text-secondary">
                    {{ fmtCurrency(row.fuel) }}
                  </td>
                  <td class="px-3 py-2 text-right text-text-secondary">
                    {{ fmtCurrency(row.maintenance) }}
                  </td>
                  <td class="px-3 py-2 text-right font-display font-semibold text-accent-coral">
                    {{ fmtCurrency(row.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="animate-fade-up animate-delay-3">
          <button
            class="w-full py-3 font-display font-semibold text-sm border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-coral hover:text-text-primary flex items-center justify-center gap-2 mb-2"
            @click="showAmortTable = !showAmortTable"
          >
            <Icon
              :icon="showAmortTable ? 'lucide:chevron-up' : 'lucide:chevron-down'"
              class="size-4"
            />
            {{ showAmortTable ? 'Ẩn bảng khấu hao' : 'Xem bảng khấu hao khoản vay' }}
          </button>

          <template v-if="showAmortTable && result">
            <div class="flex gap-2 mb-2">
              <button
                type="button"
                class="px-4 py-2 text-sm font-display font-semibold border transition"
                :class="
                  amortView === 'year'
                    ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                @click="amortView = 'year'"
              >
                Theo năm
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-display font-semibold border transition"
                :class="
                  amortView === 'month'
                    ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                @click="amortView = 'month'"
              >
                Theo tháng
              </button>
            </div>
            <div
              class="border border-border-default border-t-0 bg-bg-surface overflow-x-auto max-h-64 overflow-y-auto"
            >
              <table class="w-full text-xs">
                <thead class="sticky top-0 bg-bg-elevated z-10">
                  <tr class="text-text-dim font-display">
                    <th class="px-3 py-2 text-left">
                      {{ amortView === 'year' ? 'Năm' : 'Tháng' }}
                    </th>
                    <th class="px-3 py-2 text-right">Trả</th>
                    <th class="px-3 py-2 text-right">Gốc</th>
                    <th class="px-3 py-2 text-right">Lãi</th>
                    <th class="px-3 py-2 text-right">Dư nợ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in amortView === 'year' ? result.amortByYear : result.amortByMonth"
                    :key="row.period"
                    class="border-t border-border-default hover:bg-bg-elevated/50 transition"
                  >
                    <td class="px-3 py-2 font-display font-semibold text-text-primary">
                      {{ row.label }}
                    </td>
                    <td class="px-3 py-2 text-right text-text-secondary">
                      {{ fmtCurrency(row.payment) }}
                    </td>
                    <td class="px-3 py-2 text-right text-accent-sky">
                      {{ fmtCurrency(row.principal) }}
                    </td>
                    <td class="px-3 py-2 text-right text-accent-amber">
                      {{ fmtCurrency(row.interest) }}
                    </td>
                    <td class="px-3 py-2 text-right text-text-secondary">
                      {{ fmtCurrency(row.balance) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <div
          class="border border-border-default bg-bg-surface p-4 mt-6 animate-fade-up animate-delay-4"
        >
          <div class="flex items-start gap-2">
            <span class="text-accent-amber font-display text-xs tracking-widest shrink-0 mt-0.5"
              >//</span
            >
            <div class="text-xs text-text-dim leading-relaxed">
              <p>
                <span class="text-text-secondary font-semibold">Lưu ý:</span>
                Kết quả chỉ mang tính chất tham khảo. Chi phí bảo hiểm, xăng, bảo dưỡng có thể thay
                đổi theo thực tế. Vui lòng tham khảo ngân hàng hoặc đại lý để có số liệu chính xác.
              </p>
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
</style>
