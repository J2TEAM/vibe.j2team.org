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
          <span class="text-accent-amber font-display text-lg tracking-widest">//</span>
          Nhật Ký Biết Ơn
        </h1>
        <p class="text-text-secondary text-sm mt-1">
          Mỗi ngày 3 điều tốt đẹp — nuôi dưỡng tâm hồn tích cực
        </p>
      </div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
      >
        &larr; Trang chủ
      </RouterLink>
    </header>

    <!-- Stats Bar -->
    <div class="w-full max-w-2xl grid grid-cols-3 gap-3 mb-6 animate-fade-up animate-delay-1">
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <div class="font-display text-2xl font-bold text-accent-amber">{{ totalEntries }}</div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">TỔNG SỐ NGÀY</div>
      </div>
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <div class="font-display text-2xl font-bold text-accent-coral">{{ currentStreak }}</div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">STREAK HIỆN TẠI</div>
      </div>
      <div class="border border-border-default bg-bg-surface p-4 text-center">
        <div class="font-display text-2xl font-bold text-accent-sky">{{ longestStreak }}</div>
        <div class="text-text-dim text-xs font-display tracking-wide mt-1">KỶ LỤC STREAK</div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div
      class="w-full max-w-2xl flex border-b border-border-default mb-6 animate-fade-up animate-delay-2"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex items-center gap-2 px-4 py-3 text-sm font-display tracking-wide transition-colors border-b-2 -mb-px"
        :class="
          activeTab === tab.id
            ? 'border-accent-amber text-accent-amber'
            : 'border-transparent text-text-dim hover:text-text-secondary'
        "
        @click="activeTab = tab.id"
      >
        <Icon :icon="tab.icon" class="size-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="w-full max-w-2xl animate-fade-up animate-delay-3">
      <!-- Write Tab -->
      <div v-if="activeTab === 'write'">
        <div class="border border-border-default bg-bg-surface p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-display text-lg font-semibold flex items-center gap-2">
              <Icon icon="lucide:pencil" class="size-5 text-accent-amber" />
              {{ isEditing ? 'Chỉnh sửa' : 'Viết nhật ký' }} — {{ formatDateDisplay(selectedDate) }}
            </h2>
            <button
              v-if="!isToday"
              class="text-xs text-accent-sky hover:text-accent-amber transition-colors font-display"
              @click="goToToday"
            >
              Về hôm nay
            </button>
          </div>

          <!-- Mood Selector -->
          <div class="mb-6">
            <label class="text-text-secondary text-sm mb-3 block">Tâm trạng hôm nay:</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="mood in MOOD_OPTIONS"
                :key="mood.value"
                class="flex items-center gap-2 px-3 py-2 border transition-all text-sm"
                :class="
                  selectedMood === mood.value
                    ? 'border-accent-amber bg-bg-elevated text-text-primary'
                    : 'border-border-default bg-bg-deep text-text-dim hover:border-border-default hover:text-text-secondary'
                "
                @click="selectedMood = mood.value"
              >
                <Icon :icon="mood.icon" class="size-4" :style="{ color: mood.color }" />
                {{ mood.label }}
              </button>
            </div>
          </div>

          <!-- Gratitude Items -->
          <div class="space-y-4 mb-6">
            <div v-for="(_, index) in gratitudeItems" :key="index">
              <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block">
                ĐIỀU THỨ {{ index + 1 }}
              </label>
              <div class="relative">
                <textarea
                  v-model="gratitudeItems[index]"
                  rows="2"
                  class="w-full bg-bg-deep border border-border-default px-4 py-3 text-text-primary text-sm resize-none focus:outline-none focus:border-accent-amber transition-colors placeholder:text-text-dim/50"
                  :placeholder="placeholders[index]"
                />
              </div>
            </div>
          </div>

          <!-- Prompt Button -->
          <div class="flex items-center gap-3 mb-6">
            <button
              class="flex items-center gap-2 text-xs text-accent-sky hover:text-accent-amber transition-colors font-display tracking-wide"
              @click="getRandomPrompt"
            >
              <Icon icon="lucide:sparkles" class="size-3.5" />
              GỢI Ý NGẪU NHIÊN
            </button>
            <span v-if="currentPrompt" class="text-text-secondary text-sm italic">
              "{{ currentPrompt }}"
            </span>
          </div>

          <!-- Save Button -->
          <button
            class="w-full py-3 font-display font-semibold tracking-wide text-sm transition-all"
            :class="
              canSave
                ? 'bg-accent-amber text-bg-deep hover:bg-accent-amber/90'
                : 'bg-bg-elevated text-text-dim cursor-not-allowed'
            "
            :disabled="!canSave"
            @click="handleSave"
          >
            <Icon :icon="isEditing ? 'lucide:save' : 'lucide:check'" class="size-4 inline mr-2" />
            {{ isEditing ? 'CẬP NHẬT' : 'LƯU NHẬT KÝ' }}
          </button>

          <!-- Existing Entry Preview -->
          <div
            v-if="existingEntry && !isEditing"
            class="mt-4 p-4 border border-accent-amber/20 bg-accent-amber/5"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-accent-amber font-display tracking-wide"
                >ĐÃ VIẾT HÔM NAY</span
              >
              <button
                class="text-xs text-text-dim hover:text-accent-coral transition-colors"
                @click="startEditing"
              >
                Chỉnh sửa
              </button>
            </div>
            <div
              v-for="(item, i) in existingEntry.items"
              :key="i"
              class="text-text-secondary text-sm mb-1"
            >
              {{ i + 1 }}. {{ item }}
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar Tab -->
      <div v-if="activeTab === 'calendar'">
        <div class="border border-border-default bg-bg-surface p-6">
          <!-- Month Navigation -->
          <div class="flex items-center justify-between mb-6">
            <button
              class="text-text-dim hover:text-text-primary transition-colors p-1"
              @click="prevMonth"
            >
              <Icon icon="lucide:chevron-left" class="size-5" />
            </button>
            <h2 class="font-display text-lg font-semibold">
              Tháng {{ calendarMonth + 1 }} / {{ calendarYear }}
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
                :class="getCellClass(cell)"
                @click="selectDate(cell.dateStr)"
              >
                <span class="font-display">{{ cell.day }}</span>
                <Icon
                  v-if="cell.entry"
                  :icon="getMoodIcon(cell.entry.mood)"
                  class="size-3 mt-0.5"
                  :style="{ color: getMoodColor(cell.entry.mood) }"
                />
              </button>
              <div v-else class="w-full aspect-square" />
            </div>
          </div>
        </div>

        <!-- Selected Day Detail -->
        <div
          v-if="calendarSelectedEntry"
          class="mt-4 border border-border-default bg-bg-surface p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display text-base font-semibold flex items-center gap-2">
              <Icon
                :icon="getMoodIcon(calendarSelectedEntry.mood)"
                class="size-5"
                :style="{ color: getMoodColor(calendarSelectedEntry.mood) }"
              />
              {{ formatDateDisplay(calendarSelectedDate) }}
            </h3>
            <button
              class="text-xs text-text-dim hover:text-accent-coral transition-colors flex items-center gap-1"
              @click="handleDeleteEntry(calendarSelectedDate)"
            >
              <Icon icon="lucide:trash-2" class="size-3" />
              Xóa
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, i) in calendarSelectedEntry.items"
              :key="i"
              class="flex gap-3 text-sm"
            >
              <span class="text-accent-amber font-display font-bold text-xs mt-0.5"
                >{{ i + 1 }}.</span
              >
              <span class="text-text-secondary">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Tab -->
      <div v-if="activeTab === 'stats'">
        <!-- Mood Distribution -->
        <div class="border border-border-default bg-bg-surface p-6 mb-4">
          <h2 class="font-display text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="lucide:bar-chart-3" class="size-5 text-accent-sky" />
            Thống kê tâm trạng
          </h2>

          <!-- Period Selector -->
          <div class="flex gap-2 mb-6">
            <button
              v-for="period in statsPeriods"
              :key="period.value"
              class="px-3 py-1.5 text-xs font-display tracking-wide border transition-all"
              :class="
                statsPeriod === period.value
                  ? 'border-accent-sky bg-bg-elevated text-accent-sky'
                  : 'border-border-default text-text-dim hover:text-text-secondary'
              "
              @click="statsPeriod = period.value"
            >
              {{ period.label }}
            </button>
          </div>

          <!-- Mood Bars -->
          <div v-if="moodStatsData.total > 0" class="space-y-3">
            <div v-for="mood in MOOD_OPTIONS" :key="mood.value" class="flex items-center gap-3">
              <div class="w-20 flex items-center gap-1.5">
                <Icon :icon="mood.icon" class="size-4" :style="{ color: mood.color }" />
                <span class="text-xs text-text-dim">{{ mood.label }}</span>
              </div>
              <div class="flex-1 bg-bg-deep h-6 relative">
                <div
                  class="h-full transition-all duration-500"
                  :style="{
                    width:
                      moodStatsData.total > 0
                        ? `${(moodStatsData.counts[mood.value] / moodStatsData.total) * 100}%`
                        : '0%',
                    backgroundColor: mood.color + '40',
                  }"
                />
                <span
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-dim font-display"
                >
                  {{ moodStatsData.counts[mood.value] }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-text-dim text-sm text-center py-8">
            Chưa có dữ liệu — hãy bắt đầu viết nhật ký!
          </p>
        </div>

        <!-- Recent Entries -->
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-lg font-semibold mb-6 flex items-center gap-2">
            <Icon icon="lucide:history" class="size-5 text-accent-coral" />
            Nhật ký gần đây
          </h2>

          <div v-if="recentEntries.length > 0" class="space-y-4">
            <div
              v-for="entry in recentEntries"
              :key="entry.date"
              class="p-4 border border-border-default bg-bg-deep hover:border-accent-amber/30 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-dim font-display tracking-wide">
                  {{ formatDateDisplay(entry.date) }}
                </span>
                <Icon
                  :icon="getMoodIcon(entry.mood)"
                  class="size-4"
                  :style="{ color: getMoodColor(entry.mood) }"
                />
              </div>
              <div class="space-y-1">
                <div
                  v-for="(item, i) in entry.items"
                  :key="i"
                  class="text-text-secondary text-sm flex gap-2"
                >
                  <span class="text-accent-amber/60 font-display text-xs mt-0.5">{{ i + 1 }}.</span>
                  {{ item }}
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-text-dim text-sm text-center py-8">
            Chưa có nhật ký nào — hãy bắt đầu viết!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { MOOD_OPTIONS, GRATITUDE_PROMPTS } from './types'
import type { MoodType, GratitudeEntry } from './types'
import { useGratitudeStore } from './composables/useGratitudeStore'

const store = useGratitudeStore()
const {
  totalEntries,
  currentStreak,
  longestStreak,
  getToday,
  getEntryByDate,
  saveEntry,
  deleteEntry,
  getMoodStats,
  getEntriesForMonth,
  entries,
} = store

// === Tabs ===
const tabs = [
  { id: 'write' as const, label: 'Viết', icon: 'lucide:pencil' },
  { id: 'calendar' as const, label: 'Lịch', icon: 'lucide:calendar' },
  { id: 'stats' as const, label: 'Thống kê', icon: 'lucide:bar-chart-3' },
]
type TabId = 'write' | 'calendar' | 'stats'
const activeTab = ref<TabId>('write')

// === Write Tab ===
const selectedDate = ref(getToday())
const selectedMood = ref<MoodType>('good')
const gratitudeItems = ref<string[]>(['', '', ''])
const currentPrompt = ref('')
const isEditing = ref(false)

const isToday = computed(() => selectedDate.value === getToday())
const existingEntry = computed(() => getEntryByDate(selectedDate.value))

const placeholders = computed(() => {
  return ['Tôi biết ơn vì...', 'Tôi cảm thấy vui khi...', 'Điều tốt đẹp hôm nay là...']
})

const canSave = computed(() => {
  return selectedMood.value && gratitudeItems.value.some((item) => item.trim().length > 0)
})

function goToToday() {
  selectedDate.value = getToday()
  loadExistingEntry()
}

function loadExistingEntry() {
  const entry = getEntryByDate(selectedDate.value)
  if (entry) {
    gratitudeItems.value = [...entry.items]
    while (gratitudeItems.value.length < 3) gratitudeItems.value.push('')
    selectedMood.value = entry.mood
    isEditing.value = false
  } else {
    gratitudeItems.value = ['', '', '']
    selectedMood.value = 'good'
    isEditing.value = false
  }
}

function startEditing() {
  const entry = existingEntry.value
  if (entry) {
    gratitudeItems.value = [...entry.items]
    while (gratitudeItems.value.length < 3) gratitudeItems.value.push('')
    selectedMood.value = entry.mood
    isEditing.value = true
  }
}

function handleSave() {
  if (!canSave.value) return
  const items = gratitudeItems.value.filter((item) => item.trim().length > 0)
  saveEntry(selectedDate.value, items, selectedMood.value)
  isEditing.value = false
  gratitudeItems.value = ['', '', '']
  loadExistingEntry()
}

function getRandomPrompt() {
  const randomIndex = Math.floor(Math.random() * GRATITUDE_PROMPTS.length)
  currentPrompt.value = GRATITUDE_PROMPTS[randomIndex]!
}

// === Calendar Tab ===
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const calendarSelectedDate = ref('')

interface CalendarCell {
  day: number | null
  dateStr: string
  entry?: GratitudeEntry
  isToday: boolean
}

const calendarCells = computed<CalendarCell[]>(() => {
  const cells: CalendarCell[] = []
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1)
  let dayOfWeek = firstDay.getDay()
  if (dayOfWeek === 0) dayOfWeek = 7
  dayOfWeek -= 1

  const monthEntries = getEntriesForMonth(calendarYear.value, calendarMonth.value + 1)
  const today = getToday()

  for (let i = 0; i < dayOfWeek; i++) {
    cells.push({ day: null, dateStr: '', isToday: false })
  }

  const daysInMonth = new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear.value}-${String(calendarMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const entry = monthEntries.find((e) => e.date === dateStr)
    cells.push({
      day: d,
      dateStr,
      entry,
      isToday: dateStr === today,
    })
  }

  return cells
})

const calendarSelectedEntry = computed(() => {
  if (!calendarSelectedDate.value) return null
  return getEntryByDate(calendarSelectedDate.value) ?? null
})

function getCellClass(cell: CalendarCell) {
  const classes: string[] = []
  if (cell.isToday) {
    classes.push('border-accent-amber')
  } else if (cell.entry) {
    classes.push('border-accent-amber/30')
  } else {
    classes.push('border-border-default')
  }

  if (cell.entry) {
    classes.push('bg-bg-elevated')
  } else {
    classes.push('bg-bg-deep hover:bg-bg-elevated')
  }

  if (calendarSelectedDate.value === cell.dateStr) {
    classes.push('ring-1 ring-accent-amber')
  }

  return classes.join(' ')
}

function selectDate(dateStr: string) {
  calendarSelectedDate.value = dateStr
}

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

function handleDeleteEntry(date: string) {
  if (confirm('Bạn có chắc muốn xóa nhật ký này?')) {
    deleteEntry(date)
    calendarSelectedDate.value = ''
  }
}

// === Stats Tab ===
type StatsPeriod = '7d' | '30d' | 'all'
const statsPeriod = ref<StatsPeriod>('all')

const statsPeriods = [
  { value: '7d' as const, label: '7 ngày' },
  { value: '30d' as const, label: '30 ngày' },
  { value: 'all' as const, label: 'Tất cả' },
]

const moodStatsData = computed(() => {
  const today = new Date()
  let startDate: string | undefined

  if (statsPeriod.value === '7d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 7)
    startDate = d.toISOString().split('T')[0]
  } else if (statsPeriod.value === '30d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 30)
    startDate = d.toISOString().split('T')[0]
  }

  return getMoodStats(startDate)
})

const recentEntries = computed(() => {
  return [...entries.value].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
})

// === Helpers ===
function getMoodIcon(mood: MoodType): string {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.icon ?? 'lucide:meh'
}

function getMoodColor(mood: MoodType): string {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.color ?? '#8B9DB5'
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  const dayName = days[d.getDay()]
  return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`
}

onMounted(() => {
  loadExistingEntry()
})
</script>
