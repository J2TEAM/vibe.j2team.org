<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'

interface Assumptions {
  openingBalance: number
  monthlyExpense: number
  taxRate: number
  emergencyMonths: number
  horizonMonths: number
  baseDelayChance: number
  maxDelayMonths: number
}

interface InvoiceInput {
  id: string
  title: string
  expectedMonth: number
  amount: number
  risk: number
}

interface InvoiceResolution {
  id: string
  title: string
  expectedMonth: number
  actualMonth: number | null
  amount: number
  delayedBy: number
}

interface MonthResult {
  month: number
  openingBalance: number
  plannedIncome: number
  receivedIncome: number
  taxReserve: number
  monthlyExpense: number
  netChange: number
  endingBalance: number
  emergencyRatio: number
}

interface SimulationSummary {
  totalPlannedIncome: number
  totalReceivedIncome: number
  delayedInvoices: number
  delayedAmount: number
  pendingAmount: number
  endingBalance: number
  minBalance: number
  monthsNegative: number
  monthsBelowEmergency: number
}

interface SimulationResult {
  assumptions: Assumptions
  months: MonthResult[]
  resolvedInvoices: InvoiceResolution[]
  summary: SimulationSummary
}

const defaultAssumptions: Assumptions = {
  openingBalance: 40,
  monthlyExpense: 18,
  taxRate: 10,
  emergencyMonths: 6,
  horizonMonths: 12,
  baseDelayChance: 20,
  maxDelayMonths: 2,
}

let idSeed = 0

function createId(): string {
  idSeed += 1
  return `invoice-${Date.now()}-${idSeed}`
}

function createDefaultInvoices(): InvoiceInput[] {
  return [
    { id: createId(), title: 'Website redesign', expectedMonth: 1, amount: 25, risk: 15 },
    { id: createId(), title: 'SEO monthly retainer', expectedMonth: 2, amount: 12, risk: 10 },
    { id: createId(), title: 'Landing page sprint', expectedMonth: 4, amount: 18, risk: 25 },
    { id: createId(), title: 'E-commerce maintenance', expectedMonth: 6, amount: 20, risk: 30 },
    { id: createId(), title: 'Campaign dashboard', expectedMonth: 9, amount: 28, risk: 35 },
  ]
}

const assumptions = useLocalStorage<Assumptions>(
  'freelance-cashflow-sandbox:assumptions:v1',
  defaultAssumptions,
)

const invoices = useLocalStorage<InvoiceInput[]>(
  'freelance-cashflow-sandbox:invoices:v1',
  createDefaultInvoices(),
)

const simulationSeed = ref<number>(Date.now())

const simulation = computed(() =>
  runSimulation(simulationSeed.value, assumptions.value, invoices.value),
)

const stressTest = computed(() => {
  const rounds = 160
  let bankruptcyRuns = 0
  let lowBufferRuns = 0
  let totalEnding = 0

  for (let i = 0; i < rounds; i += 1) {
    const sample = runSimulation(simulationSeed.value + i * 7919, assumptions.value, invoices.value)

    if (sample.summary.monthsNegative > 0) {
      bankruptcyRuns += 1
    }

    if (sample.summary.monthsBelowEmergency > 0) {
      lowBufferRuns += 1
    }

    totalEnding += sample.summary.endingBalance
  }

  return {
    rounds,
    bankruptcyRate: (bankruptcyRuns / rounds) * 100,
    lowBufferRate: (lowBufferRuns / rounds) * 100,
    avgEndingBalance: totalEnding / rounds,
  }
})

const delayedEvents = computed(() =>
  simulation.value.resolvedInvoices.filter((item) => item.delayedBy > 0),
)

function runSimulation(
  seed: number,
  assumptionsInput: Assumptions,
  invoiceInput: InvoiceInput[],
): SimulationResult {
  const normalizedAssumptions = normalizeAssumptions(assumptionsInput)

  const normalizedInvoices = invoiceInput
    .map((item) => normalizeInvoice(item, normalizedAssumptions.horizonMonths))
    .filter((item) => item.title.trim().length > 0 && item.amount > 0)

  const resolvedInvoices = resolveInvoices(seed, normalizedAssumptions, normalizedInvoices)
  const plannedIncomeByMonth = Array.from(
    { length: normalizedAssumptions.horizonMonths + 1 },
    () => 0,
  )
  const receivedIncomeByMonth = Array.from(
    { length: normalizedAssumptions.horizonMonths + 1 },
    () => 0,
  )

  let delayedAmount = 0
  let pendingAmount = 0
  let delayedInvoices = 0

  for (const invoice of resolvedInvoices) {
    const plannedMonth = invoice.expectedMonth
    plannedIncomeByMonth[plannedMonth] = (plannedIncomeByMonth[plannedMonth] ?? 0) + invoice.amount

    if (invoice.delayedBy > 0) {
      delayedInvoices += 1
      delayedAmount += invoice.amount
    }

    if (invoice.actualMonth === null) {
      pendingAmount += invoice.amount
    } else {
      const actualMonth = invoice.actualMonth
      receivedIncomeByMonth[actualMonth] =
        (receivedIncomeByMonth[actualMonth] ?? 0) + invoice.amount
    }
  }

  const emergencyTarget =
    normalizedAssumptions.monthlyExpense * normalizedAssumptions.emergencyMonths
  const months: MonthResult[] = []

  let runningBalance = normalizedAssumptions.openingBalance
  let minBalance = runningBalance
  let monthsNegative = 0
  let monthsBelowEmergency = 0
  let totalPlannedIncome = 0
  let totalReceivedIncome = 0

  for (let month = 1; month <= normalizedAssumptions.horizonMonths; month += 1) {
    const openingBalance = runningBalance
    const plannedIncome = plannedIncomeByMonth[month] ?? 0
    const receivedIncome = receivedIncomeByMonth[month] ?? 0
    const taxReserve = (receivedIncome * normalizedAssumptions.taxRate) / 100
    const netChange = receivedIncome - normalizedAssumptions.monthlyExpense - taxReserve
    const endingBalance = openingBalance + netChange
    const emergencyRatio = emergencyTarget > 0 ? endingBalance / emergencyTarget : 0

    months.push({
      month,
      openingBalance,
      plannedIncome,
      receivedIncome,
      taxReserve,
      monthlyExpense: normalizedAssumptions.monthlyExpense,
      netChange,
      endingBalance,
      emergencyRatio,
    })

    if (endingBalance < 0) {
      monthsNegative += 1
    }

    if (endingBalance < emergencyTarget) {
      monthsBelowEmergency += 1
    }

    totalPlannedIncome += plannedIncome
    totalReceivedIncome += receivedIncome
    minBalance = Math.min(minBalance, endingBalance)
    runningBalance = endingBalance
  }

  return {
    assumptions: normalizedAssumptions,
    months,
    resolvedInvoices,
    summary: {
      totalPlannedIncome,
      totalReceivedIncome,
      delayedInvoices,
      delayedAmount,
      pendingAmount,
      endingBalance: runningBalance,
      minBalance,
      monthsNegative,
      monthsBelowEmergency,
    },
  }
}

function normalizeAssumptions(input: Assumptions): Assumptions {
  return {
    openingBalance: clampNumber(input.openingBalance, 0, 100000),
    monthlyExpense: clampNumber(input.monthlyExpense, 1, 100000),
    taxRate: clampNumber(input.taxRate, 0, 45),
    emergencyMonths: clampNumber(input.emergencyMonths, 1, 24),
    horizonMonths: Math.round(clampNumber(input.horizonMonths, 3, 36)),
    baseDelayChance: clampNumber(input.baseDelayChance, 0, 90),
    maxDelayMonths: Math.round(clampNumber(input.maxDelayMonths, 1, 6)),
  }
}

function normalizeInvoice(input: InvoiceInput, horizonMonths: number): InvoiceInput {
  return {
    id: input.id,
    title: input.title,
    expectedMonth: Math.round(clampNumber(input.expectedMonth, 1, horizonMonths)),
    amount: clampNumber(input.amount, 0, 100000),
    risk: clampNumber(input.risk, 0, 90),
  }
}

function resolveInvoices(
  seed: number,
  assumptionsInput: Assumptions,
  invoiceInput: InvoiceInput[],
): InvoiceResolution[] {
  const rng = createSeededRng(seed)

  return invoiceInput.map((invoice) => {
    const probability = clampNumber(
      (assumptionsInput.baseDelayChance + invoice.risk) / 100,
      0,
      0.95,
    )
    const isDelayed = rng() < probability
    const delayedBy = isDelayed
      ? Math.round(1 + Math.floor(rng() * assumptionsInput.maxDelayMonths))
      : 0
    const shiftedMonth = invoice.expectedMonth + delayedBy
    const actualMonth = shiftedMonth > assumptionsInput.horizonMonths ? null : shiftedMonth

    return {
      id: invoice.id,
      title: invoice.title,
      expectedMonth: invoice.expectedMonth,
      actualMonth,
      amount: invoice.amount,
      delayedBy,
    }
  })
}

function rerollDelays() {
  simulationSeed.value = Math.floor(Math.random() * 2147483647)
}

function addInvoice() {
  const month = Math.min(assumptions.value.horizonMonths, invoices.value.length + 1)

  invoices.value.push({
    id: createId(),
    title: `Client invoice #${invoices.value.length + 1}`,
    expectedMonth: month,
    amount: 12,
    risk: 20,
  })
}

function removeInvoice(id: string) {
  invoices.value = invoices.value.filter((item) => item.id !== id)
}

function resetScenario() {
  assumptions.value = {
    ...defaultAssumptions,
  }
  invoices.value = createDefaultInvoices()
  rerollDelays()
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

function formatMoney(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(2)} tỷ`
  }

  return `${sign}${abs.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatMonth(value: number): string {
  return `Th${value}`
}

function riskLabel(risk: number): string {
  if (risk < 15) {
    return 'Thấp'
  }

  if (risk < 35) {
    return 'Vừa'
  }

  return 'Cao'
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0 || 1

  return () => {
    state += 0x6d2b79f5
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-8 font-body text-text-primary sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <AppBreadcrumb :items="[{ label: 'Freelance Cashflow Sandbox' }]" />

      <header class="animate-fade-up border border-border-default bg-bg-surface p-6">
        <p
          class="mb-2 inline-flex items-center gap-2 font-display text-xs tracking-wider text-accent-amber"
        >
          <Icon icon="lucide:wallet" class="size-4" />
          FINANCE SANDBOX
        </p>
        <h1 class="font-display text-3xl font-bold tracking-tight text-accent-coral sm:text-4xl">
          Freelance Cashflow Sandbox
        </h1>
        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
          Mô phỏng dòng tiền freelancer theo tháng với thu nhập không đều, quỹ thuế và các tình
          huống khách thanh toán trễ.
        </p>

        <div class="mt-5 flex flex-wrap gap-3">
          <button
            class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral px-4 py-2 text-sm font-display text-bg-deep transition hover:brightness-95"
            @click="rerollDelays"
          >
            <Icon icon="lucide:dices" class="size-4" />
            Random lại delay
          </button>
          <button
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm font-display text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            @click="resetScenario"
          >
            <Icon icon="lucide:rotate-ccw" class="size-4" />
            Reset mặc định
          </button>
        </div>
      </header>

      <div class="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section class="space-y-6">
          <article
            class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-6"
          >
            <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold">
              <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
              Giả định tài chính
            </h2>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="space-y-1">
                <span class="text-xs font-display tracking-wide text-text-secondary"
                  >Số dư ban đầu (triệu)</span
                >
                <input
                  v-model.number="assumptions.openingBalance"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-display tracking-wide text-text-secondary"
                  >Chi phí cố định / tháng (triệu)</span
                >
                <input
                  v-model.number="assumptions.monthlyExpense"
                  type="number"
                  min="1"
                  step="1"
                  class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-display tracking-wide text-text-secondary"
                  >Tỷ lệ trích thuế (%)</span
                >
                <input
                  v-model.number="assumptions.taxRate"
                  type="number"
                  min="0"
                  max="45"
                  step="1"
                  class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-display tracking-wide text-text-secondary"
                  >Mục tiêu quỹ khẩn cấp (tháng)</span
                >
                <input
                  v-model.number="assumptions.emergencyMonths"
                  type="number"
                  min="1"
                  max="24"
                  step="1"
                  class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-display tracking-wide text-text-secondary"
                  >Thời gian mô phỏng (tháng)</span
                >
                <input
                  v-model.number="assumptions.horizonMonths"
                  type="number"
                  min="3"
                  max="36"
                  step="1"
                  class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-display tracking-wide text-text-secondary"
                  >Delay cơ bản (%)</span
                >
                <input
                  v-model.number="assumptions.baseDelayChance"
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
                />
              </label>

              <label class="space-y-1 sm:col-span-2">
                <span class="text-xs font-display tracking-wide text-text-secondary"
                  >Số tháng có thể trễ tối đa</span
                >
                <input
                  v-model.number="assumptions.maxDelayMonths"
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  class="w-full accent-accent-amber"
                />
                <p class="text-xs text-text-dim">
                  Hiện tại: {{ assumptions.maxDelayMonths }} tháng
                </p>
              </label>
            </div>
          </article>

          <article
            class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-6"
          >
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 class="flex items-center gap-3 font-display text-xl font-semibold">
                <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
                Invoice Planner
              </h2>

              <button
                class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-xs font-display text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                @click="addInvoice"
              >
                <Icon icon="lucide:plus" class="size-4" />
                Thêm invoice
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="item in invoices"
                :key="item.id"
                class="grid gap-2 border border-border-default bg-bg-elevated p-3 md:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_auto] md:items-center"
              >
                <label class="space-y-1">
                  <span class="text-[11px] font-display tracking-wide text-text-dim"
                    >Tên hợp đồng</span
                  >
                  <input
                    v-model="item.title"
                    type="text"
                    class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none"
                    placeholder="Ví dụ: App landing page"
                  />
                </label>

                <label class="space-y-1">
                  <span class="text-[11px] font-display tracking-wide text-text-dim"
                    >Tháng dự kiến</span
                  >
                  <input
                    v-model.number="item.expectedMonth"
                    type="number"
                    min="1"
                    :max="assumptions.horizonMonths"
                    class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none"
                  />
                </label>

                <label class="space-y-1">
                  <span class="text-[11px] font-display tracking-wide text-text-dim"
                    >Giá trị (triệu)</span
                  >
                  <input
                    v-model.number="item.amount"
                    type="number"
                    min="0"
                    step="0.5"
                    class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none"
                  />
                </label>

                <label class="space-y-1">
                  <span class="text-[11px] font-display tracking-wide text-text-dim"
                    >Risk delay (%)</span
                  >
                  <input
                    v-model.number="item.risk"
                    type="number"
                    min="0"
                    max="90"
                    step="1"
                    class="w-full border border-border-default bg-bg-surface px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none"
                  />
                  <span class="text-[11px] text-text-dim">{{ riskLabel(item.risk) }}</span>
                </label>

                <button
                  class="inline-flex h-8 items-center justify-center border border-border-default bg-bg-surface px-2 text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
                  @click="removeInvoice(item.id)"
                >
                  <Icon icon="lucide:trash-2" class="size-4" />
                </button>
              </div>
            </div>
          </article>

          <article
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-6"
          >
            <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold">
              <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
              Timeline theo tháng
            </h2>

            <div class="overflow-x-auto">
              <table class="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr
                    class="border-b border-border-default text-xs uppercase tracking-wide text-text-dim"
                  >
                    <th class="px-2 py-2 font-display">Tháng</th>
                    <th class="px-2 py-2 font-display">Số dư đầu</th>
                    <th class="px-2 py-2 font-display">Planned</th>
                    <th class="px-2 py-2 font-display">Received</th>
                    <th class="px-2 py-2 font-display">Thuế giữ lại</th>
                    <th class="px-2 py-2 font-display">Chi phí</th>
                    <th class="px-2 py-2 font-display">Net</th>
                    <th class="px-2 py-2 font-display">Số dư cuối</th>
                    <th class="px-2 py-2 font-display">Buffer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in simulation.months"
                    :key="row.month"
                    class="border-b border-border-default/80 text-text-secondary"
                  >
                    <td class="px-2 py-2 font-display text-xs text-text-dim">
                      {{ formatMonth(row.month) }}
                    </td>
                    <td class="px-2 py-2">{{ formatMoney(row.openingBalance) }}</td>
                    <td class="px-2 py-2 text-accent-amber">
                      {{ formatMoney(row.plannedIncome) }}
                    </td>
                    <td class="px-2 py-2 text-accent-sky">{{ formatMoney(row.receivedIncome) }}</td>
                    <td class="px-2 py-2">{{ formatMoney(row.taxReserve) }}</td>
                    <td class="px-2 py-2">{{ formatMoney(row.monthlyExpense) }}</td>
                    <td
                      class="px-2 py-2"
                      :class="row.netChange >= 0 ? 'text-accent-amber' : 'text-red-300'"
                    >
                      {{ formatMoney(row.netChange) }}
                    </td>
                    <td
                      class="px-2 py-2 font-medium"
                      :class="row.endingBalance >= 0 ? 'text-text-primary' : 'text-red-300'"
                    >
                      {{ formatMoney(row.endingBalance) }}
                    </td>
                    <td
                      class="px-2 py-2"
                      :class="row.emergencyRatio >= 1 ? 'text-accent-amber' : 'text-red-300'"
                    >
                      {{ formatPercent(row.emergencyRatio * 100) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <aside class="space-y-6">
          <article
            class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-6"
          >
            <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
              <Icon icon="lucide:line-chart" class="size-4 text-accent-coral" />
              Tổng quan kết quả
            </h2>

            <dl class="space-y-3 text-sm">
              <div
                class="flex items-center justify-between gap-3 border-b border-border-default/60 pb-2"
              >
                <dt class="text-text-dim">Tổng planned income</dt>
                <dd class="font-medium text-accent-amber">
                  {{ formatMoney(simulation.summary.totalPlannedIncome) }}
                </dd>
              </div>
              <div
                class="flex items-center justify-between gap-3 border-b border-border-default/60 pb-2"
              >
                <dt class="text-text-dim">Tổng received income</dt>
                <dd class="font-medium text-accent-sky">
                  {{ formatMoney(simulation.summary.totalReceivedIncome) }}
                </dd>
              </div>
              <div
                class="flex items-center justify-between gap-3 border-b border-border-default/60 pb-2"
              >
                <dt class="text-text-dim">Số dư cuối kỳ</dt>
                <dd
                  class="font-medium"
                  :class="
                    simulation.summary.endingBalance >= 0 ? 'text-text-primary' : 'text-red-300'
                  "
                >
                  {{ formatMoney(simulation.summary.endingBalance) }}
                </dd>
              </div>
              <div
                class="flex items-center justify-between gap-3 border-b border-border-default/60 pb-2"
              >
                <dt class="text-text-dim">Số dư thấp nhất</dt>
                <dd
                  class="font-medium"
                  :class="simulation.summary.minBalance >= 0 ? 'text-text-primary' : 'text-red-300'"
                >
                  {{ formatMoney(simulation.summary.minBalance) }}
                </dd>
              </div>
              <div
                class="flex items-center justify-between gap-3 border-b border-border-default/60 pb-2"
              >
                <dt class="text-text-dim">Invoice bị delay</dt>
                <dd class="font-medium text-text-primary">
                  {{ simulation.summary.delayedInvoices }}
                  <span class="text-text-dim"
                    >({{ formatMoney(simulation.summary.delayedAmount) }})</span
                  >
                </dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-text-dim">Tiền treo ngoài kỳ</dt>
                <dd class="font-medium text-red-300">
                  {{ formatMoney(simulation.summary.pendingAmount) }}
                </dd>
              </div>
            </dl>
          </article>

          <article
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-6"
          >
            <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
              <Icon icon="lucide:shield-alert" class="size-4 text-accent-amber" />
              Monte Carlo risk
            </h2>

            <div class="space-y-3 text-sm">
              <p class="text-text-secondary">
                Chạy {{ stressTest.rounds }} lần với seed khác nhau để ước tính rủi ro biến động
                dòng tiền.
              </p>

              <div class="border border-border-default bg-bg-elevated p-3">
                <p class="text-xs text-text-dim">Xác suất âm quỹ trong kỳ</p>
                <p class="mt-1 font-display text-xl text-red-300">
                  {{ formatPercent(stressTest.bankruptcyRate) }}
                </p>
              </div>

              <div class="border border-border-default bg-bg-elevated p-3">
                <p class="text-xs text-text-dim">Xác suất xuống dưới quỹ khẩn cấp</p>
                <p class="mt-1 font-display text-xl text-accent-amber">
                  {{ formatPercent(stressTest.lowBufferRate) }}
                </p>
              </div>

              <div class="border border-border-default bg-bg-elevated p-3">
                <p class="text-xs text-text-dim">Số dư cuối kỳ trung bình</p>
                <p class="mt-1 font-display text-xl text-text-primary">
                  {{ formatMoney(stressTest.avgEndingBalance) }}
                </p>
              </div>
            </div>
          </article>

          <article
            class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-6"
          >
            <h2 class="mb-4 flex items-center gap-3 font-display text-lg font-semibold">
              <Icon icon="lucide:clock-3" class="size-4 text-accent-sky" />
              Delayed payment events
            </h2>

            <div
              v-if="delayedEvents.length === 0"
              class="border border-border-default bg-bg-elevated p-3 text-sm text-text-dim"
            >
              Seed hiện tại chưa tạo delay event nào.
            </div>

            <ul v-else class="space-y-2 text-sm">
              <li
                v-for="event in delayedEvents"
                :key="event.id"
                class="border border-border-default bg-bg-elevated p-3"
              >
                <p class="font-medium text-text-primary">{{ event.title }}</p>
                <p class="mt-1 text-xs text-text-dim">
                  {{ formatMonth(event.expectedMonth) }}
                  <span class="px-1 text-text-dim/70">→</span>
                  <template v-if="event.actualMonth !== null">
                    {{ formatMonth(event.actualMonth) }} (trễ {{ event.delayedBy }} tháng)
                  </template>
                  <template v-else>
                    Sau kỳ mô phỏng (treo {{ formatMoney(event.amount) }})
                  </template>
                </p>
              </li>
            </ul>
          </article>
        </aside>
      </div>
    </div>
  </div>
</template>
