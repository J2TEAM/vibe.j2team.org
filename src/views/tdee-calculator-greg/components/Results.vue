<template>
  <div class="animate-fade-up animate-delay-4 h-full flex flex-col gap-6">
    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="border border-border-default bg-bg-surface p-4">
        <p class="text-[9px] text-text-dim font-display tracking-widest mb-1 uppercase">Hiện tại</p>
        <p class="text-3xl font-display font-bold text-accent-sky">
          {{ todayWeight !== null ? todayWeight.toFixed(1) : '---' }}<span class="text-xs">kg</span>
        </p>
        <p class="text-[8px] text-text-dim font-display mt-0.5 tracking-wide">Hôm nay</p>
      </div>

      <div class="border border-border-default bg-bg-surface p-4 relative overflow-hidden">
        <p class="text-[9px] text-text-dim font-display tracking-widest mb-1 uppercase">
          Chỉ số TDEE
        </p>
        <p class="text-3xl font-display font-bold text-accent-coral">
          {{ gregCalc.tdee !== null ? gregCalc.tdee : '---' }}
          <span class="text-[10px] text-text-dim ml-1">kcal</span>
        </p>
        <div class="absolute top-0 right-0 w-1 h-full bg-accent-coral/10"></div>
      </div>

      <div class="border border-border-default bg-bg-surface p-4">
        <p class="text-[9px] text-text-dim font-display tracking-widest mb-1 uppercase">
          Chênh lệch
        </p>
        <p
          class="text-3xl font-display font-bold"
          :class="
            (gregCalc.weekDiff || 0) > 0
              ? 'text-accent-coral'
              : (gregCalc.weekDiff || 0) < 0
                ? 'text-accent-sky'
                : 'text-text-secondary'
          "
        >
          {{
            gregCalc.weekDiff !== null
              ? (gregCalc.weekDiff > 0 ? '+' : '') + gregCalc.weekDiff.toFixed(2)
              : '---'
          }}
        </p>
        <p class="text-[8px] text-text-dim font-display mt-0.5 tracking-wide">kg (cuối − đầu kỳ)</p>
      </div>
    </div>

    <!-- Chart panel -->
    <div
      class="border border-border-default bg-bg-surface p-6 relative flex-grow min-h-[420px] print:border-black"
    >
      <!-- Header + timeframe controls -->
      <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <h4
          class="font-display text-[10px] font-bold text-text-primary uppercase tracking-[0.2em] mt-1"
        >
          <span class="text-accent-sky font-display">//</span> Cân nặng
        </h4>
        <div class="flex flex-wrap items-center gap-2 print:hidden">
          <button
            v-for="t in PRESETS"
            :key="t"
            @click="selectPreset(t)"
            :class="
              activePreset === t && !isCustom
                ? 'bg-accent-sky text-bg-deep'
                : 'text-text-dim border border-border-default hover:border-accent-sky hover:text-text-primary'
            "
            class="text-[9px] px-2.5 py-1 font-display transition-all"
          >
            {{ t }}D
          </button>
          <button
            @click="toggleCustom"
            :class="
              isCustom
                ? 'bg-accent-amber text-bg-deep'
                : 'text-text-dim border border-border-default hover:border-accent-amber hover:text-text-primary'
            "
            class="text-[9px] px-2.5 py-1 font-display transition-all"
          >
            CUSTOM
          </button>
        </div>
      </div>

      <!-- Custom date range inputs -->
      <transition name="slide-down">
        <div
          v-if="isCustom"
          class="mb-6 flex flex-wrap gap-4 items-end border border-border-default bg-bg-elevated p-4 border-l-4 border-l-accent-amber"
        >
          <div class="flex flex-col gap-1.5">
            <label class="text-[8px] font-display tracking-widest text-text-dim uppercase"
              >Từ ngày</label
            >
            <input
              type="date"
              v-model="customStart"
              :max="customEnd || todayStr"
              class="bg-bg-deep border border-border-default text-text-primary text-xs font-display px-3 py-1.5 focus:outline-none focus:border-accent-amber transition-colors"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[8px] font-display tracking-widest text-text-dim uppercase"
              >Đến ngày</label
            >
            <input
              type="date"
              v-model="customEnd"
              :min="customStart"
              :max="todayStr"
              class="bg-bg-deep border border-border-default text-text-primary text-xs font-display px-3 py-1.5 focus:outline-none focus:border-accent-amber transition-colors"
            />
          </div>
          <p class="text-[9px] text-text-dim font-display tracking-wide self-end pb-1.5">
            {{ chartData.length }} ngày có dữ liệu
          </p>
        </div>
      </transition>

      <!-- Chart -->
      <div v-if="chartData.length >= 2" class="relative">
        <div
          class="absolute left-0 top-0 h-[180px] flex flex-col justify-between text-[8px] text-text-dim font-display leading-none select-none"
        >
          <span>{{ yAxis.max }}</span>
          <span>{{ yAxis.mid }}</span>
          <span>{{ yAxis.min }}</span>
        </div>
        <div class="pl-7 pr-2">
          <svg
            class="w-full"
            viewBox="0 0 600 180"
            preserveAspectRatio="xMidYMid meet"
            style="display: block"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#38BDF8" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line
              v-for="y in [0, 90, 180]"
              :key="'h' + y"
              x1="0"
              :y1="y"
              x2="600"
              :y2="y"
              stroke="#253549"
              stroke-width="1"
            />
            <line
              v-for="x in [0, 150, 300, 450, 600]"
              :key="'v' + x"
              :x1="x"
              y1="0"
              :x2="x"
              y2="180"
              stroke="#253549"
              stroke-width="0.5"
              stroke-dasharray="4,4"
            />
            <path v-if="areaPath" :d="areaPath" fill="url(#areaGradient)" opacity="0.4" />
            <path
              v-if="linePath"
              :d="linePath"
              fill="none"
              stroke="#38BDF8"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle
              v-for="(p, i) in chartPoints"
              :key="i"
              :cx="p.x"
              :cy="p.y"
              r="2.5"
              fill="#162232"
              stroke="#38BDF8"
              stroke-width="1.5"
            />
          </svg>
        </div>
        <div
          class="pl-7 pr-2 flex justify-between text-[8px] text-text-dim font-display uppercase tracking-tighter mt-1.5"
        >
          <span>{{ chartData[0]?.date }}</span>
          <span>{{ chartData[Math.floor(chartData.length / 2)]?.date }}</span>
          <span>{{ chartData[chartData.length - 1]?.date }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center h-40 gap-2 text-text-dim font-display"
      >
        <span class="text-xs tracking-widest">KHÔNG ĐỦ DỮ LIỆU</span>
        <span class="text-[9px] text-text-dim/50">
          {{ isCustom ? 'Không có log trong khoảng ngày đã chọn' : 'Cần ít nhất 2 ngày' }}
        </span>
      </div>

      <!-- Breakdown + BMR -->
      <div class="mt-8 grid gap-3">
        <!-- Calculation breakdown -->
        <div
          v-if="gregCalc.tdee !== null"
          class="bg-bg-elevated border border-border-default p-4 border-l-4 border-l-accent-sky text-[10px] text-text-secondary font-display leading-relaxed space-y-0.5"
        >
          <p class="text-accent-sky tracking-widest text-[8px] mb-2 uppercase">
            // Công thức Coach Greg
          </p>
          <p>
            Median cân đầu kỳ:
            <span class="text-text-primary">{{ gregCalc.weekStartMedian.toFixed(2) }} kg</span>
          </p>
          <p>
            Median cân cuối kỳ:
            <span class="text-text-primary">{{ gregCalc.weekEndMedian.toFixed(2) }} kg</span>
          </p>
          <p>
            Chênh lệch cân:
            <span class="text-text-primary"
              >{{ (gregCalc.weekDiff! > 0 ? '+' : '') + gregCalc.weekDiff!.toFixed(2) }} kg</span
            >
          </p>
          <p>
            Calo thặng dư/thiếu hụt:
            <span class="text-text-primary"
              >{{ gregCalc.calSurplus > 0 ? '+' : ''
              }}{{ gregCalc.calSurplus.toFixed(0) }} kcal</span
            >
          </p>
          <p>
            Tổng calo nạp ({{ gregCalc.periodDays }} ngày):
            <span class="text-text-primary">{{ gregCalc.totalCal.toFixed(0) }} kcal</span>
          </p>
          <p>
            TDEE = ({{ gregCalc.totalCal.toFixed(0) }} − {{ gregCalc.calSurplus.toFixed(0) }}) /
            {{ gregCalc.periodDays }} =
            <span class="text-accent-coral font-bold">{{ gregCalc.tdee }} kcal/ngày</span>
          </p>
        </div>

        <!-- BMR Bayes -->
        <div
          class="bg-bg-elevated border border-border-default p-4 border-l-4 border-l-accent-amber"
        >
          <h4
            class="font-display text-[9px] font-bold text-accent-amber uppercase tracking-widest mb-2"
          >
            Chỉ số BMR tương đối:
          </h4>
          <div
            v-if="predictedBmr.bmr !== null"
            class="space-y-0.5 text-[10px] font-display text-text-secondary leading-relaxed"
          >
            <p>
              Hệ số hoạt động trung bình ({{ predictedBmr.periodDays }} ngày):
              <span class="text-text-primary">×{{ predictedBmr.avgFactor.toFixed(3) }}</span>
              <span class="text-text-dim ml-2 text-[8px]"
                >({{ predictedBmr.factorBreakdown }})</span
              >
            </p>
            <p>
              BMR = TDEE / hệ số = {{ gregCalc.tdee }} / {{ predictedBmr.avgFactor.toFixed(3) }} =
              <span class="text-accent-amber font-bold">{{ predictedBmr.bmr }} kcal/ngày</span>
            </p>
          </div>
          <p v-else class="text-[11px] text-text-secondary">
            Cần ít nhất 2 ngày dữ liệu để tính BMR.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTdeeStore } from '../store'

defineOptions({ name: 'TdeeResults' })

const store = useTdeeStore()

// ─── Timeframe state ──────────────────────────────────────────────────────────

const PRESETS = [7, 14, 30, 90] as const
const activePreset = ref<number>(30)
const isCustom = ref(false)
const todayStr: string = new Date().toISOString().split('T')[0] ?? ''
const customStart = ref('')
const customEnd = ref(todayStr)

function selectPreset(days: number) {
  isCustom.value = false
  activePreset.value = days
}

function toggleCustom() {
  isCustom.value = !isCustom.value
  if (isCustom.value && !customStart.value) {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    customStart.value = d.toISOString().split('T')[0] ?? ''
  }
}

// ─── Filtered data ────────────────────────────────────────────────────────────

const chartData = computed(() => {
  if (isCustom.value) {
    if (!customStart.value || !customEnd.value) return []
    const start = new Date(customStart.value)
    const end = new Date(customEnd.value)
    const MS90 = 90 * 24 * 3600 * 1000
    const clampedStart =
      end.getTime() - start.getTime() > MS90 ? new Date(end.getTime() - MS90) : start
    return [...store.logs]
      .filter((l) => {
        const d = new Date(l.date)
        return d >= clampedStart && d <= end
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
  return store.filteredLogs(activePreset.value)
})

// ─── Today's weight (always from today's date, ignores timeframe) ─────────────

const todayWeight = computed<number | null>(() => {
  const log = store.logs.find((l) => l.date === todayStr)
  return log ? Number(log.weight) : null
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 !== 0) return sorted[mid] as number
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}

// ─── Coach Greg adaptive TDEE ─────────────────────────────────────────────────

const gregCalc = computed<{
  tdee: number | null
  weekDiff: number | null
  weekStartMedian: number
  weekEndMedian: number
  calSurplus: number
  totalCal: number
  periodDays: number
}>(() => {
  const data = chartData.value
  const empty = {
    tdee: null,
    weekDiff: null,
    weekStartMedian: 0,
    weekEndMedian: 0,
    calSurplus: 0,
    totalCal: 0,
    periodDays: 0,
  }

  if (data.length < 2) return empty

  const periodDays = data.length
  const windowSize = periodDays >= 14 ? 7 : Math.floor(periodDays / 2)
  if (windowSize < 1) return empty

  const firstWindow = data.slice(0, windowSize)
  const lastWindow = data.slice(data.length - windowSize)

  const weekStartMedian = median(firstWindow.map((l) => Number(l.weight)))
  const weekEndMedian = median(lastWindow.map((l) => Number(l.weight)))
  const weekDiff = weekEndMedian - weekStartMedian
  const calSurplus = weekDiff * 7700
  const totalCal = data.reduce((s, l) => s + (Number(l.calories) || 0), 0)
  const tdee = Math.round((totalCal - calSurplus) / periodDays)

  return { tdee, weekDiff, weekStartMedian, weekEndMedian, calSurplus, totalCal, periodDays }
})

// ─── BMR Bayes: uses period-averaged activity factor ─────────────────────────
/**
 * Because each day now has a distinct activity level (1.2 / 1.375 / 1.725),
 * we average all activityFactor values in the period to get a representative
 * multiplier, then: BMR = TDEE / avgFactor
 *
 * A breakdown of how many days were in each activity tier is shown to the user.
 */
const predictedBmr = computed<{
  bmr: number | null
  avgFactor: number
  periodDays: number
  factorBreakdown: string
}>(() => {
  const data = chartData.value
  const tdee = gregCalc.value.tdee

  if (!tdee || data.length < 2) {
    return { bmr: null, avgFactor: 0, periodDays: 0, factorBreakdown: '' }
  }

  const factors = data.map((l) => Number(l.activityFactor) || 1.375)
  const avgFactor = factors.reduce((s, f) => s + f, 0) / factors.length

  // Count days per tier for the breakdown label
  const sit = factors.filter((f) => f <= 1.2).length
  const light = factors.filter((f) => f > 1.2 && f < 1.6).length
  const heavy = factors.filter((f) => f >= 1.6).length
  const parts: string[] = []
  if (sit) parts.push(`🪑×${sit}`)
  if (light) parts.push(`🚶×${light}`)
  if (heavy) parts.push(`🏋️×${heavy}`)
  const factorBreakdown = parts.join(' ')

  return {
    bmr: Math.round(tdee / avgFactor),
    avgFactor,
    periodDays: data.length,
    factorBreakdown,
  }
})

// ─── Chart geometry ───────────────────────────────────────────────────────────

const CHART_W = 600,
  CHART_H = 180,
  PAD = 6

const yAxis = computed(() => {
  const w = chartData.value.map((l) => Number(l.weight))
  if (!w.length) return { min: 0, max: 100, mid: '50' }
  let min = Math.floor(Math.min(...w) - 1)
  let max = Math.ceil(Math.max(...w) + 1)
  if (max === min) {
    max += 2
    min -= 2
  }
  return { min, max, mid: ((min + max) / 2).toFixed(1) }
})

const chartPoints = computed(() => {
  const data = chartData.value
  if (!data.length) return []
  const { min, max } = yAxis.value
  const range = max - min || 1
  return data.map((log, i) => ({
    x: data.length > 1 ? PAD + (i / (data.length - 1)) * (CHART_W - PAD * 2) : CHART_W / 2,
    y: PAD + (1 - (Number(log.weight) - min) / range) * (CHART_H - PAD * 2),
  }))
})

const linePath = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
})

const areaPath = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2) return ''
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  const line = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
  return `${line} L${last.x.toFixed(1)},${CHART_H} L${first.x.toFixed(1)},${CHART_H} Z`
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
