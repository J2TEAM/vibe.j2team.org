<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, watchEffect } from 'vue'
import { useScriptTag } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import type {
  CostReport,
  ChartType,
  Granularity,
  SortField,
  SortDir,
  ChartJsConstructor,
  ChartJsInstance,
  XLSXLibrary,
} from '../types'
import { buildChartConfig, CHART_COLORS } from '../utils/chartUtils'
import { downloadCsv, downloadXlsx } from '../utils/exportUtils'

const props = defineProps<{
  report: CostReport
  isDemoMode: boolean
  hasCredentials: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  refresh: [
    start: string,
    end: string,
    granularity: Granularity,
    services: string[],
    useReal: boolean,
  ]
  disconnect: []
  cliOutput: [json: string, granularity: Granularity, services: string[]]
}>()

// ─── Paste CLI output ─────────────────────────────────────────────────────────

const showCliPaste = ref(false)
const cliPasteText = ref('')
const cliPasteError = ref('')

function handleCliSubmit(): void {
  cliPasteError.value = ''
  if (!cliPasteText.value.trim()) {
    cliPasteError.value = 'Paste the JSON output from the AWS CLI command above.'
    return
  }
  emit('cliOutput', cliPasteText.value, granularity.value, [...selectedServices.value])
  showCliPaste.value = false
  cliPasteText.value = ''
}

function handleCliCancel(): void {
  showCliPaste.value = false
  cliPasteText.value = ''
  cliPasteError.value = ''
}

// ─── Filters ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

const dateStart = ref('2026-01-01')
const dateEnd = ref(today)
const granularity = ref<Granularity>('MONTHLY')
const chartType = ref<ChartType>('stacked')

// Use real data when credentials are available; sync whenever credentials state changes
const useRealData = ref(props.hasCredentials)
watchEffect(() => {
  useRealData.value = props.hasCredentials
})

// Services available in the current report (real or demo)
const availableServices = computed(() => props.report.serviceBreakdown.map((s) => s.service))

// Keep selectedServices in sync when the report changes (e.g. switching real↔demo)
const selectedServices = ref<string[]>(availableServices.value)
watch(availableServices, (next) => {
  selectedServices.value = [...next]
})

// ─── Table sort ──────────────────────────────────────────────────────────────

const sortField = ref<SortField>('cost')
const sortDir = ref<SortDir>('desc')

const sortedBreakdown = computed(() => {
  const rows = [...props.report.serviceBreakdown]
  rows.sort((a, b) => {
    let cmp = 0
    if (sortField.value === 'service') cmp = a.service.localeCompare(b.service)
    else if (sortField.value === 'cost') cmp = a.cost - b.cost
    else cmp = a.percentage - b.percentage
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return rows
})

function setSort(field: SortField): void {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'desc'
  }
}

// ─── Summary cards ─────────────────────────────────────────────────────────

const costTrend = computed(() => {
  const { totalCost, previousTotalCost } = props.report
  if (!previousTotalCost) return null
  const delta = ((totalCost - previousTotalCost) / previousTotalCost) * 100
  return { delta, up: delta >= 0 }
})

const topService = computed(() => props.report.serviceBreakdown[0] ?? null)

const avgPeriodCost = computed(() => {
  const count = props.report.timeSeries.length
  return count > 0 ? props.report.totalCost / count : 0
})

// ─── Chart.js ────────────────────────────────────────────────────────────────

const chartRef = ref<HTMLCanvasElement | null>(null)
const isChartReady = ref(false)
let chartInstance: ChartJsInstance | null = null

useScriptTag('https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js', () => {
  isChartReady.value = true
})

function initChart(): void {
  if (!chartRef.value || !isChartReady.value) return
  const ChartJs = (window as Window & { Chart?: ChartJsConstructor }).Chart
  if (!ChartJs) return

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const visibleServices = selectedServices.value
  const filteredReport: CostReport = {
    ...props.report,
    serviceBreakdown: props.report.serviceBreakdown.filter((s) =>
      visibleServices.includes(s.service),
    ),
    timeSeries: props.report.timeSeries.map((p) => {
      const filtered: Record<string, number> = {}
      visibleServices.forEach((svc) => {
        if (p.services[svc] !== undefined) filtered[svc] = p.services[svc] ?? 0
      })
      return { ...p, services: filtered }
    }),
  }

  const config = buildChartConfig(filteredReport, chartType.value)
  chartInstance = new ChartJs(chartRef.value, config)
}

watch([isChartReady, chartType, () => props.report, selectedServices], initChart, { deep: false })

onMounted(() => {
  if (isChartReady.value) initChart()
})

onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})

// ─── Service filter ───────────────────────────────────────────────────────────

function toggleService(svc: string): void {
  const idx = selectedServices.value.indexOf(svc)
  if (idx >= 0) {
    selectedServices.value = selectedServices.value.filter((s) => s !== svc)
  } else {
    selectedServices.value = [...selectedServices.value, svc]
  }
}

function selectAllServices(): void {
  selectedServices.value = [...availableServices.value]
}

function clearServices(): void {
  selectedServices.value = []
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

function handleRefresh(): void {
  emit(
    'refresh',
    dateStart.value,
    dateEnd.value,
    granularity.value,
    [...selectedServices.value],
    useRealData.value,
  )
}

function handleDisconnect(): void {
  emit('disconnect')
}

function handleToggleGranularity(g: Granularity): void {
  granularity.value = g
}

function handleChartType(t: ChartType): void {
  chartType.value = t
}

function handleToggleRealData(): void {
  useRealData.value = !useRealData.value
}

// ─── Export ──────────────────────────────────────────────────────────────────

const isExporting = ref(false)
const isXlsxLoaded = ref(false)

const { load: loadXlsxScript } = useScriptTag(
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  () => {
    isXlsxLoaded.value = true
  },
  { manual: true },
)

async function handleDownloadCsv(): Promise<void> {
  downloadCsv(props.report)
}

async function handleDownloadXlsx(): Promise<void> {
  isExporting.value = true
  try {
    if (!isXlsxLoaded.value) await loadXlsxScript(true)
    const xlsx = (window as Window & { XLSX?: XLSXLibrary }).XLSX
    if (!xlsx) throw new Error('XLSX library did not load')
    await downloadXlsx(props.report, xlsx)
  } finally {
    isExporting.value = false
  }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function serviceColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? '#FF6B4A'
}

function getSortIcon(field: SortField): string {
  if (sortField.value !== field) return 'lucide:chevrons-up-down'
  return sortDir.value === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down'
}

const chartTypeOptions: { type: ChartType; icon: string; label: string }[] = [
  { type: 'bar', icon: 'lucide:bar-chart-2', label: 'Grouped Bar' },
  { type: 'stacked', icon: 'lucide:layers', label: 'Stacked Bar' },
  { type: 'line', icon: 'lucide:line-chart', label: 'Line Chart' },
  { type: 'pie', icon: 'lucide:pie-chart', label: 'Donut Chart' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Status Banners -->
    <div
      v-if="isDemoMode"
      class="flex items-center gap-3 border border-accent-sky/30 bg-accent-sky/5 px-4 py-3"
    >
      <Icon icon="lucide:info" class="size-4 shrink-0 text-accent-sky" />
      <p class="text-sm text-text-secondary">
        <span class="font-semibold text-accent-sky">Demo Mode</span> — Showing simulated AWS cost
        data. Connect your AWS account to see real billing information.
      </p>
    </div>

    <div v-if="errorMessage" class="border border-red-500/30 bg-red-500/5">
      <!-- Error header -->
      <div class="flex items-start gap-3 px-4 py-3">
        <Icon icon="lucide:alert-triangle" class="mt-0.5 size-4 shrink-0 text-red-400" />
        <div class="min-w-0 flex-1">
          <p class="text-sm text-red-400">{{ errorMessage }}</p>
          <!-- Cost Explorer not activated guidance -->
          <p
            v-if="
              errorMessage.includes('UnknownOperation') ||
              errorMessage.includes('not been activated')
            "
            class="mt-2 text-xs text-text-secondary"
          >
            <Icon icon="lucide:external-link" class="mr-1 inline size-3" />
            Enable Cost Explorer:
            <a
              href="https://console.aws.amazon.com/cost-management/home#/cost-explorer"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent-sky underline hover:text-accent-sky/80"
            >
              AWS Billing Console → Cost Explorer
            </a>
          </p>

          <!-- CLI command to copy -->
          <p class="mt-2 text-xs text-text-dim">Run in your terminal to get real data:</p>
          <code
            class="mt-1 block break-all rounded bg-bg-deep px-2 py-1.5 font-mono text-xs text-accent-amber"
          >
            aws ce get-cost-and-usage --time-period Start={{ report.dateRange.start }},End={{
              report.dateRange.end
            }}
            --granularity {{ report.granularity }} --group-by Type=DIMENSION,Key=SERVICE --metrics
            BlendedCost
          </code>

          <!-- Paste output CTA -->
          <button
            v-if="!showCliPaste"
            type="button"
            class="mt-3 flex items-center gap-1.5 border border-accent-sky/40 bg-accent-sky/10 px-3 py-1.5 font-display text-xs font-semibold text-accent-sky transition-colors hover:bg-accent-sky/20"
            @click="showCliPaste = true"
          >
            <Icon icon="lucide:clipboard-paste" class="size-3.5" />
            Paste CLI output to load real data
          </button>
        </div>
      </div>

      <!-- Paste panel -->
      <div v-if="showCliPaste" class="border-t border-red-500/20 px-4 py-3">
        <p class="mb-2 font-display text-xs font-semibold text-text-secondary">
          Paste AWS CLI JSON output:
        </p>
        <textarea
          v-model="cliPasteText"
          rows="6"
          spellcheck="false"
          autocomplete="off"
          placeholder='{ "ResultsByTime": [ ... ] }'
          class="w-full resize-y border border-border-default bg-bg-deep px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-dim focus:border-accent-sky focus:outline-none"
        />
        <p v-if="cliPasteError" class="mt-1 text-xs text-red-400">{{ cliPasteError }}</p>
        <div class="mt-2 flex gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 bg-accent-sky px-3 py-1.5 font-display text-xs font-semibold text-bg-deep transition-opacity hover:opacity-90"
            @click="handleCliSubmit"
          >
            <Icon icon="lucide:check" class="size-3.5" />
            Load Data
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 border border-border-default px-3 py-1.5 font-display text-xs text-text-dim hover:text-text-secondary"
            @click="handleCliCancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="border border-border-default bg-bg-surface p-4">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Date Range -->
        <div class="flex flex-wrap gap-3">
          <div>
            <label class="mb-1.5 block font-display text-xs tracking-wide text-text-dim"
              >FROM</label
            >
            <input
              v-model="dateStart"
              type="date"
              :max="dateEnd"
              class="border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1.5 block font-display text-xs tracking-wide text-text-dim">TO</label>
            <input
              v-model="dateEnd"
              type="date"
              :min="dateStart"
              :max="today"
              class="border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
            />
          </div>
        </div>

        <!-- Granularity -->
        <div>
          <label class="mb-1.5 block font-display text-xs tracking-wide text-text-dim"
            >GRANULARITY</label
          >
          <div class="flex border border-border-default">
            <button
              v-for="g in ['DAILY', 'MONTHLY'] as Granularity[]"
              :key="g"
              type="button"
              class="px-4 py-2 font-display text-xs font-semibold transition-colors"
              :class="
                granularity === g
                  ? 'bg-accent-coral text-bg-deep'
                  : 'bg-bg-deep text-text-secondary hover:text-text-primary'
              "
              @click="handleToggleGranularity(g)"
            >
              {{ g.charAt(0) + g.slice(1).toLowerCase() }}
            </button>
          </div>
        </div>

        <!-- Real Data toggle -->
        <div v-if="hasCredentials">
          <label class="mb-1.5 block font-display text-xs tracking-wide text-text-dim"
            >DATA SOURCE</label
          >
          <button
            type="button"
            class="flex items-center gap-2 border px-3 py-2 font-display text-xs font-semibold transition-colors"
            :class="
              useRealData
                ? 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky'
                : 'border-border-default bg-bg-deep text-text-secondary hover:border-border-default hover:text-text-primary'
            "
            @click="handleToggleRealData"
          >
            <Icon :icon="useRealData ? 'lucide:cloud' : 'lucide:database'" class="size-3.5" />
            {{ useRealData ? 'Live AWS' : 'Demo Data' }}
          </button>
        </div>

        <!-- Apply + Disconnect -->
        <div class="ml-auto flex gap-2">
          <button
            v-if="hasCredentials"
            type="button"
            class="flex items-center gap-1.5 border border-border-default bg-bg-elevated px-3 py-2 font-display text-xs text-text-dim transition-colors hover:border-red-500/50 hover:text-red-400"
            @click="handleDisconnect"
          >
            <Icon icon="lucide:unplug" class="size-3.5" />
            Disconnect
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 bg-accent-coral px-4 py-2 font-display text-xs font-semibold text-bg-deep transition-opacity hover:opacity-90"
            @click="handleRefresh"
          >
            <Icon icon="lucide:refresh-cw" class="size-3.5" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <!-- Total Cost -->
      <div
        class="border border-border-default bg-bg-surface p-4 hover:border-accent-coral/50 transition-colors"
      >
        <p class="mb-1 font-display text-xs tracking-wide text-text-dim">TOTAL COST</p>
        <p class="font-display text-2xl font-bold text-text-primary">
          {{ formatUSD(report.totalCost) }}
        </p>
        <div v-if="costTrend" class="mt-2 flex items-center gap-1">
          <Icon
            :icon="costTrend.up ? 'lucide:trending-up' : 'lucide:trending-down'"
            class="size-3.5"
            :class="costTrend.up ? 'text-red-400' : 'text-emerald-400'"
          />
          <span
            class="font-display text-xs"
            :class="costTrend.up ? 'text-red-400' : 'text-emerald-400'"
          >
            {{ costTrend.up ? '+' : '' }}{{ costTrend.delta.toFixed(1) }}% vs prev period
          </span>
        </div>
      </div>

      <!-- Top Service -->
      <div
        class="border border-border-default bg-bg-surface p-4 hover:border-accent-amber/50 transition-colors"
      >
        <p class="mb-1 font-display text-xs tracking-wide text-text-dim">TOP SERVICE</p>
        <p
          class="font-display text-lg font-bold text-accent-amber truncate"
          :title="topService?.service"
        >
          {{ topService?.service ?? '—' }}
        </p>
        <p class="mt-1 font-display text-sm text-text-secondary">
          {{ topService ? formatUSD(topService.cost) : '' }}
          <span v-if="topService" class="text-text-dim">({{ topService.percentage }}%)</span>
        </p>
      </div>

      <!-- Avg per Period -->
      <div
        class="border border-border-default bg-bg-surface p-4 hover:border-accent-sky/50 transition-colors"
      >
        <p class="mb-1 font-display text-xs tracking-wide text-text-dim">
          AVG PER {{ granularity === 'MONTHLY' ? 'MONTH' : 'DAY' }}
        </p>
        <p class="font-display text-2xl font-bold text-text-primary">
          {{ formatUSD(avgPeriodCost) }}
        </p>
        <p class="mt-1 font-display text-xs text-text-dim">
          over {{ report.timeSeries.length }}
          {{ granularity === 'MONTHLY' ? 'months' : 'days' }}
        </p>
      </div>

      <!-- Services Count -->
      <div
        class="border border-border-default bg-bg-surface p-4 hover:border-border-default transition-colors"
      >
        <p class="mb-1 font-display text-xs tracking-wide text-text-dim">SERVICES</p>
        <p class="font-display text-2xl font-bold text-text-primary">
          {{ report.serviceBreakdown.length }}
        </p>
        <p class="mt-1 font-display text-xs text-text-dim">active AWS services</p>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="border border-border-default bg-bg-surface">
      <!-- Chart Toolbar -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3"
      >
        <h2 class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
          <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
          Cost Over Time
        </h2>

        <!-- Chart type selector -->
        <div class="flex gap-1">
          <button
            v-for="opt in chartTypeOptions"
            :key="opt.type"
            type="button"
            :title="opt.label"
            class="flex items-center gap-1.5 border px-2.5 py-1.5 font-display text-xs transition-colors"
            :class="
              chartType === opt.type
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default bg-bg-deep text-text-dim hover:text-text-secondary'
            "
            @click="handleChartType(opt.type)"
          >
            <Icon :icon="opt.icon" class="size-3.5" />
            <span class="hidden sm:inline">{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- Canvas -->
      <div class="relative px-4 pb-4 pt-2" style="height: 380px">
        <canvas ref="chartRef" />
        <div
          v-if="!isChartReady"
          class="absolute inset-0 flex items-center justify-center bg-bg-surface"
        >
          <div class="flex flex-col items-center gap-3">
            <Icon icon="lucide:loader-circle" class="size-8 animate-spin text-accent-coral" />
            <p class="font-display text-xs text-text-dim">Loading chart engine…</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Breakdown Table + Filter -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Service Filter -->
      <div class="border border-border-default bg-bg-surface p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
            <span class="text-accent-amber font-display text-xs tracking-widest">//</span>
            Services
          </h3>
          <div class="flex gap-2">
            <button
              type="button"
              class="font-display text-xs text-accent-sky hover:underline"
              @click="selectAllServices"
            >
              All
            </button>
            <span class="text-text-dim">/</span>
            <button
              type="button"
              class="font-display text-xs text-text-dim hover:text-text-secondary hover:underline"
              @click="clearServices"
            >
              None
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <label
            v-for="(svc, i) in availableServices"
            :key="svc"
            class="flex cursor-pointer items-center gap-2.5 py-1.5 group"
          >
            <span
              class="flex size-3.5 shrink-0 items-center justify-center border transition-colors"
              :style="{
                borderColor: selectedServices.includes(svc) ? serviceColor(i) : '#253549',
                backgroundColor: selectedServices.includes(svc)
                  ? serviceColor(i) + '20'
                  : 'transparent',
              }"
            >
              <Icon
                v-if="selectedServices.includes(svc)"
                icon="lucide:check"
                class="size-2.5"
                :style="{ color: serviceColor(i) }"
              />
            </span>
            <input
              type="checkbox"
              class="sr-only"
              :checked="selectedServices.includes(svc)"
              @change="toggleService(svc)"
            />
            <span class="truncate text-xs text-text-secondary group-hover:text-text-primary">
              {{ svc }}
            </span>
          </label>
        </div>
      </div>

      <!-- Breakdown Table -->
      <div class="border border-border-default bg-bg-surface lg:col-span-2">
        <div class="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h3 class="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
            <span class="text-accent-coral font-display text-xs tracking-widest">//</span>
            Service Breakdown
          </h3>

          <!-- Export Buttons -->
          <div class="flex gap-2">
            <button
              type="button"
              class="flex items-center gap-1.5 border border-border-default bg-bg-elevated px-2.5 py-1.5 font-display text-xs text-text-secondary transition-colors hover:border-accent-sky/50 hover:text-accent-sky"
              @click="handleDownloadCsv"
            >
              <Icon icon="lucide:file-text" class="size-3.5" />
              CSV
            </button>
            <button
              type="button"
              :disabled="isExporting"
              class="flex items-center gap-1.5 border border-border-default bg-bg-elevated px-2.5 py-1.5 font-display text-xs text-text-secondary transition-colors hover:border-accent-amber/50 hover:text-accent-amber disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleDownloadXlsx"
            >
              <Icon
                :icon="isExporting ? 'lucide:loader-circle' : 'lucide:file-spreadsheet'"
                class="size-3.5"
                :class="{ 'animate-spin': isExporting }"
              />
              XLSX
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border-default">
                <th class="px-4 py-3 text-left">
                  <button
                    type="button"
                    class="flex items-center gap-1 font-display text-xs tracking-wide text-text-dim hover:text-text-secondary"
                    @click="setSort('service')"
                  >
                    SERVICE
                    <Icon :icon="getSortIcon('service')" class="size-3" />
                  </button>
                </th>
                <th class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="ml-auto flex items-center gap-1 font-display text-xs tracking-wide text-text-dim hover:text-text-secondary"
                    @click="setSort('cost')"
                  >
                    COST
                    <Icon :icon="getSortIcon('cost')" class="size-3" />
                  </button>
                </th>
                <th class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="ml-auto flex items-center gap-1 font-display text-xs tracking-wide text-text-dim hover:text-text-secondary"
                    @click="setSort('percentage')"
                  >
                    %
                    <Icon :icon="getSortIcon('percentage')" class="size-3" />
                  </button>
                </th>
                <th class="w-32 px-4 py-3 text-left">
                  <span class="font-display text-xs tracking-wide text-text-dim">SHARE</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(entry, i) in sortedBreakdown"
                :key="entry.service"
                class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="size-2.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: serviceColor(i) }"
                    />
                    <span class="text-text-primary">{{ entry.service }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-mono text-text-primary">
                  {{ formatUSD(entry.cost) }}
                </td>
                <td class="px-4 py-3 text-right font-display text-xs text-text-secondary">
                  {{ entry.percentage }}%
                </td>
                <td class="px-4 py-3">
                  <div class="h-1.5 w-full bg-bg-deep">
                    <div
                      class="h-full transition-all duration-500"
                      :style="{
                        width: `${entry.percentage}%`,
                        backgroundColor: serviceColor(i),
                      }"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t border-border-default bg-bg-elevated">
                <td class="px-4 py-3 font-display text-xs font-semibold text-text-secondary">
                  TOTAL
                </td>
                <td class="px-4 py-3 text-right font-mono font-semibold text-accent-coral">
                  {{ formatUSD(report.totalCost) }}
                </td>
                <td class="px-4 py-3 text-right font-display text-xs text-text-dim">100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
