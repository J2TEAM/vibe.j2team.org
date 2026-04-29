<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-8 px-4"
  >
    <!-- Header -->
    <header class="w-full max-w-2xl flex justify-between items-center mb-8 animate-fade-up">
      <div>
        <h1
          class="font-display text-3xl sm:text-4xl font-bold text-text-primary flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-lg tracking-widest">//</span>
          Theo Dõi Chu Kỳ
        </h1>
        <p class="text-text-secondary text-sm mt-1">Dự đoán chu kỳ & rụng trứng, ghi triệu chứng</p>
      </div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Trang chủ
      </RouterLink>
    </header>

    <!-- Prediction Cards -->
    <div
      class="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up animate-delay-1"
    >
      <div class="border border-border-default bg-bg-surface p-3 text-center">
        <div class="font-display text-lg font-bold text-accent-coral">
          {{ nextPeriodDate ? formatDisplay(nextPeriodDate) : '—' }}
        </div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">KỲ TIẾP THEO</div>
      </div>
      <div class="border border-border-default bg-bg-surface p-3 text-center">
        <div class="font-display text-lg font-bold" style="color: #22c55e">
          {{ nextOvulationDate ? formatDisplay(nextOvulationDate) : '—' }}
        </div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">RỤNG TRỨNG</div>
      </div>
      <div class="border border-border-default bg-bg-surface p-3 text-center">
        <div class="font-display text-lg font-bold text-accent-sky">{{ avgCycleLength }}</div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">CHU KỲ TB (NGÀY)</div>
      </div>
      <div class="border border-border-default bg-bg-surface p-3 text-center">
        <div class="font-display text-lg font-bold text-accent-amber">{{ avgPeriodLength }}</div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">KỲ KINH TB (NGÀY)</div>
      </div>
    </div>

    <!-- Current Phase -->
    <div
      v-if="todayPhase"
      class="w-full max-w-2xl border p-4 mb-6 animate-fade-up animate-delay-2"
      :style="{
        borderColor: todayPhaseInfo.color + '50',
        backgroundColor: todayPhaseInfo.color + '08',
      }"
    >
      <div class="flex items-center gap-2 mb-1">
        <div class="w-2.5 h-2.5" :style="{ backgroundColor: todayPhaseInfo.color }" />
        <span class="font-display text-sm font-semibold" :style="{ color: todayPhaseInfo.color }">
          Hôm nay: {{ todayPhaseInfo.label }}
        </span>
      </div>
      <p class="text-text-secondary text-xs">{{ todayPhaseInfo.description }}</p>
    </div>

    <!-- Tab Navigation -->
    <div
      class="w-full max-w-2xl flex border-b border-border-default mb-6 animate-fade-up animate-delay-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex items-center gap-2 px-4 py-3 text-sm font-display tracking-wide transition-colors border-b-2 -mb-px"
        :class="
          activeTab === tab.id
            ? 'border-accent-coral text-accent-coral'
            : 'border-transparent text-text-dim hover:text-text-secondary'
        "
        @click="activeTab = tab.id"
      >
        <Icon :icon="tab.icon" class="size-4" />
        {{ tab.label }}
      </button>
    </div>

    <div class="w-full max-w-2xl">
      <!-- Calendar Tab -->
      <div v-if="activeTab === 'calendar'">
        <div class="border border-border-default bg-bg-surface p-6">
          <!-- Month Nav -->
          <div class="flex items-center justify-between mb-6">
            <button
              class="text-text-dim hover:text-text-primary transition-colors p-1"
              @click="prevMonth"
            >
              <Icon icon="lucide:chevron-left" class="size-5" />
            </button>
            <h2 class="font-display text-lg font-semibold">
              Tháng {{ calMonth + 1 }} / {{ calYear }}
            </h2>
            <button
              class="text-text-dim hover:text-text-primary transition-colors p-1"
              @click="nextMonth"
            >
              <Icon icon="lucide:chevron-right" class="size-5" />
            </button>
          </div>

          <!-- Day Labels -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div
              v-for="day in ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']"
              :key="day"
              class="text-center text-xs text-text-dim font-display tracking-wide py-1"
            >
              {{ day }}
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-1">
            <div v-for="(cell, i) in calendarCells" :key="i">
              <button
                v-if="cell.day"
                class="w-full aspect-square flex flex-col items-center justify-center text-sm transition-all border relative"
                :class="getCalCellClass(cell)"
                @click="selectCalDay(cell.dateStr)"
              >
                <span class="font-display text-xs">{{ cell.day }}</span>
                <div
                  v-if="cell.phase"
                  class="w-1.5 h-1.5 mt-0.5"
                  :style="{ backgroundColor: getPhaseColor(cell.phase) }"
                />
              </button>
              <div v-else class="w-full aspect-square" />
            </div>
          </div>

          <!-- Phase Legend -->
          <div class="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border-default">
            <div
              v-for="p in PHASE_INFO"
              :key="p.key"
              class="flex items-center gap-1.5 text-xs text-text-dim"
            >
              <div class="w-2 h-2" :style="{ backgroundColor: p.color }" />
              {{ p.label }}
            </div>
            <div class="flex items-center gap-1.5 text-xs text-text-dim">
              <div class="w-2 h-2 border border-accent-amber" />
              Dự đoán
            </div>
          </div>
        </div>

        <!-- Selected Day Log -->
        <div v-if="selectedDate" class="mt-4 border border-border-default bg-bg-surface p-6">
          <h3 class="font-display text-base font-semibold mb-4">
            {{ formatDisplay(selectedDate) }} — Ghi chú
          </h3>

          <!-- Flow -->
          <div class="mb-4">
            <label class="text-text-dim text-xs font-display tracking-wide mb-2 block"
              >LƯỢNG KINH:</label
            >
            <div class="flex gap-2">
              <button
                v-for="f in FLOW_OPTIONS"
                :key="f.value"
                class="px-3 py-1.5 text-xs font-display border transition-all"
                :class="
                  logFlow === f.value
                    ? 'text-bg-deep'
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                :style="
                  logFlow === f.value ? { backgroundColor: f.color, borderColor: f.color } : {}
                "
                @click="logFlow = logFlow === f.value ? null : f.value"
              >
                {{ f.label }}
              </button>
            </div>
          </div>

          <!-- Symptoms -->
          <div class="mb-4">
            <label class="text-text-dim text-xs font-display tracking-wide mb-2 block"
              >TRIỆU CHỨNG:</label
            >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in SYMPTOM_OPTIONS"
                :key="s.value"
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-display border transition-all"
                :class="
                  logSymptoms.includes(s.value)
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-dim hover:text-text-secondary'
                "
                @click="toggleSymptom(s.value)"
              >
                <Icon :icon="s.icon" class="size-3" />
                {{ s.label }}
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-4">
            <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
              >GHI CHÚ:</label
            >
            <textarea
              v-model="logNotes"
              rows="2"
              placeholder="Ghi chú thêm..."
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm resize-none focus:outline-none focus:border-accent-coral transition-colors placeholder:text-text-dim/50"
            />
          </div>

          <button
            class="w-full py-2.5 bg-accent-coral text-bg-deep font-display font-semibold tracking-wide text-sm hover:bg-accent-coral/90 transition-all"
            @click="saveDayLogHandler"
          >
            LƯU GHI CHÚ
          </button>
        </div>
      </div>

      <!-- Add Cycle Tab -->
      <div v-if="activeTab === 'add'">
        <div class="border border-border-default bg-bg-surface p-6 mb-4">
          <h2 class="font-display text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="lucide:plus-circle" class="size-5 text-accent-coral" />
            Ghi nhận chu kỳ mới
          </h2>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
                >NGÀY BẮT ĐẦU</label
              >
              <input
                v-model="newStart"
                type="date"
                class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-coral transition-colors"
              />
            </div>
            <div>
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
                >NGÀY KẾT THÚC</label
              >
              <input
                v-model="newEnd"
                type="date"
                class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-coral transition-colors"
              />
            </div>
          </div>

          <button
            class="w-full py-3 font-display font-semibold tracking-wide text-sm transition-all"
            :class="
              canAddCycle
                ? 'bg-accent-coral text-bg-deep hover:bg-accent-coral/90'
                : 'bg-bg-elevated text-text-dim cursor-not-allowed'
            "
            :disabled="!canAddCycle"
            @click="handleAddCycle"
          >
            GHI NHẬN CHU KỲ
          </button>
        </div>

        <!-- Cycle History -->
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Icon icon="lucide:history" class="size-5 text-accent-amber" />
            Lịch sử chu kỳ
          </h2>

          <div v-if="sortedCycles.length > 0" class="space-y-2">
            <div
              v-for="cycle in sortedCycles"
              :key="cycle.id"
              class="flex items-center justify-between p-3 border border-border-default bg-bg-deep"
            >
              <div>
                <span class="text-sm font-display">
                  {{ formatDisplay(cycle.startDate) }} → {{ formatDisplay(cycle.endDate) }}
                </span>
                <span class="text-text-dim text-xs ml-2">({{ cycle.length }} ngày)</span>
              </div>
              <div class="flex items-center gap-3">
                <span v-if="cycle.cycleLength > 0" class="text-xs text-accent-sky font-display">
                  Chu kỳ: {{ cycle.cycleLength }} ngày
                </span>
                <button
                  class="text-text-dim hover:text-accent-coral transition-colors"
                  @click="handleDeleteCycle(cycle.id)"
                >
                  <Icon icon="lucide:trash-2" class="size-3.5" />
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-text-dim text-sm text-center py-8">
            Chưa có dữ liệu — hãy ghi nhận chu kỳ đầu tiên!
          </p>
        </div>
      </div>

      <!-- Stats Tab -->
      <div v-if="activeTab === 'stats'">
        <!-- Symptom Stats -->
        <div class="border border-border-default bg-bg-surface p-6 mb-4">
          <h2 class="font-display text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="lucide:bar-chart-3" class="size-5 text-accent-sky" />
            Triệu chứng thường gặp
          </h2>

          <div v-if="hasSymptomData" class="space-y-3">
            <div v-for="s in sortedSymptoms" :key="s.type" class="flex items-center gap-3">
              <div class="w-28 flex items-center gap-1.5">
                <Icon :icon="getSymptomIcon(s.type)" class="size-3.5 text-text-dim" />
                <span class="text-xs text-text-dim">{{ getSymptomLabel(s.type) }}</span>
              </div>
              <div class="flex-1 bg-bg-deep h-5 relative">
                <div
                  class="h-full bg-accent-coral/30 transition-all duration-500"
                  :style="{ width: `${(s.count / maxSymptomCount) * 100}%` }"
                />
                <span
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-dim font-display"
                >
                  {{ s.count }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-text-dim text-sm text-center py-8">Chưa có dữ liệu triệu chứng</p>
        </div>

        <!-- Cycle Phases Info -->
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Icon icon="lucide:info" class="size-5 text-accent-amber" />
            Các giai đoạn chu kỳ
          </h2>
          <div class="space-y-3">
            <div
              v-for="p in PHASE_INFO"
              :key="p.key"
              class="p-3 border border-border-default bg-bg-deep"
            >
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2.5 h-2.5" :style="{ backgroundColor: p.color }" />
                <span class="font-display text-sm font-semibold" :style="{ color: p.color }">{{
                  p.label
                }}</span>
              </div>
              <p class="text-text-secondary text-xs">{{ p.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { FLOW_OPTIONS, SYMPTOM_OPTIONS, PHASE_INFO } from './types'
import type { SymptomType, FlowLevel, CyclePhase } from './types'
import { usePeriodStore } from './composables/usePeriodStore'

const store = usePeriodStore()
const {
  sortedCycles,
  avgCycleLength,
  avgPeriodLength,
  nextPeriodDate,
  nextOvulationDate,
  getToday,
  addCycle,
  deleteCycle,
  getDayPhase,
  saveDayLog,
  getDayLog,
  getSymptomStats,
} = store

// === Today Phase ===
const todayPhase = computed(() => getDayPhase(getToday()))
const todayPhaseInfo = computed(() => {
  const phase = todayPhase.value
  if (!phase) return PHASE_INFO[0]!
  return PHASE_INFO.find((p) => p.key === phase) ?? PHASE_INFO[0]!
})

// === Tabs ===
const tabs = [
  { id: 'calendar' as const, label: 'Lịch', icon: 'lucide:calendar' },
  { id: 'add' as const, label: 'Ghi nhận', icon: 'lucide:plus-circle' },
  { id: 'stats' as const, label: 'Thống kê', icon: 'lucide:bar-chart-3' },
]
type TabId = 'calendar' | 'add' | 'stats'
const activeTab = ref<TabId>('calendar')

// === Calendar ===
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())
const selectedDate = ref('')

// Day log form
const logFlow = ref<FlowLevel | null>(null)
const logSymptoms = ref<SymptomType[]>([])
const logNotes = ref('')

interface CalCell {
  day: number | null
  dateStr: string
  phase: CyclePhase | null
  isToday: boolean
  isPrediction: boolean
}

const calendarCells = computed<CalCell[]>(() => {
  const cells: CalCell[] = []
  const firstDay = new Date(calYear.value, calMonth.value, 1)
  let dow = firstDay.getDay()
  if (dow === 0) dow = 7
  dow -= 1

  const today = getToday()
  for (let i = 0; i < dow; i++) {
    cells.push({ day: null, dateStr: '', phase: null, isToday: false, isPrediction: false })
  }

  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear.value}-${String(calMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const phase = getDayPhase(dateStr)
    const isFuture = dateStr > today
    cells.push({
      day: d,
      dateStr,
      phase,
      isToday: dateStr === today,
      isPrediction: isFuture && phase !== null,
    })
  }

  return cells
})

function getCalCellClass(cell: CalCell) {
  const classes: string[] = []
  if (cell.isToday) {
    classes.push('border-accent-amber')
  } else if (cell.isPrediction) {
    classes.push('border-dashed border-accent-amber/40')
  } else if (cell.phase) {
    classes.push('border-border-default')
  } else {
    classes.push('border-border-default')
  }

  if (cell.phase && !cell.isPrediction) {
    classes.push('bg-bg-elevated')
  } else {
    classes.push('bg-bg-deep hover:bg-bg-elevated')
  }

  if (selectedDate.value === cell.dateStr) {
    classes.push('ring-1 ring-accent-coral')
  }

  return classes.join(' ')
}

function getPhaseColor(phase: CyclePhase): string {
  return PHASE_INFO.find((p) => p.key === phase)?.color ?? '#4A6180'
}

function selectCalDay(dateStr: string) {
  selectedDate.value = dateStr
  const log = getDayLog(dateStr)
  if (log) {
    logFlow.value = log.flow
    logSymptoms.value = [...log.symptoms]
    logNotes.value = log.notes
  } else {
    logFlow.value = null
    logSymptoms.value = []
    logNotes.value = ''
  }
}

function toggleSymptom(s: SymptomType) {
  if (logSymptoms.value.includes(s)) {
    logSymptoms.value = logSymptoms.value.filter((x) => x !== s)
  } else {
    logSymptoms.value = [...logSymptoms.value, s]
  }
}

function saveDayLogHandler() {
  if (!selectedDate.value) return
  saveDayLog(selectedDate.value, logSymptoms.value, logFlow.value, logNotes.value)
}

function prevMonth() {
  if (calMonth.value === 0) {
    calMonth.value = 11
    calYear.value--
  } else calMonth.value--
}

function nextMonth() {
  if (calMonth.value === 11) {
    calMonth.value = 0
    calYear.value++
  } else calMonth.value++
}

// === Add Cycle ===
const newStart = ref('')
const newEnd = ref('')

const canAddCycle = computed(() => newStart.value && newEnd.value && newEnd.value >= newStart.value)

function handleAddCycle() {
  if (!canAddCycle.value) return
  addCycle(newStart.value, newEnd.value)
  newStart.value = ''
  newEnd.value = ''
}

function handleDeleteCycle(id: string) {
  if (confirm('Xóa chu kỳ này?')) deleteCycle(id)
}

// === Stats ===
const symptomStats = computed(() => getSymptomStats())

const sortedSymptoms = computed(() => {
  return SYMPTOM_OPTIONS.map((s) => ({ type: s.value, count: symptomStats.value[s.value] }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
})

const hasSymptomData = computed(() => sortedSymptoms.value.length > 0)
const maxSymptomCount = computed(() => {
  if (sortedSymptoms.value.length === 0) return 1
  return sortedSymptoms.value[0]!.count
})

function getSymptomIcon(type: SymptomType): string {
  return SYMPTOM_OPTIONS.find((s) => s.value === type)?.icon ?? 'lucide:circle'
}

function getSymptomLabel(type: SymptomType): string {
  return SYMPTOM_OPTIONS.find((s) => s.value === type)?.label ?? type
}

// === Helpers ===
function formatDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}`
}
</script>
