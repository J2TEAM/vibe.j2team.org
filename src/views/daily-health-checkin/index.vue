<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'
import BackToTop from '@/components/BackToTop.vue'
import { useDailyHealthCheckin } from './composables/useDailyHealthCheckin'
import HealthDangerZone from './components/HealthDangerZone.vue'
import HealthReferencePopup from './components/HealthReferencePopup.vue'
import HealthWeeklyTrendPanel from './components/HealthWeeklyTrendPanel.vue'
import PulseBuddyFloatingWidget from './components/PulseBuddyFloatingWidget.vue'
import pulseBuddyGoodStreakSvg from './svg-animated/pulse-buddy-good-streak-v2.svg'
import pulseBuddyGreetTalkSvg from './svg-animated/pulse-buddy-greet-talk-v1.svg'
import pulseBuddyIdleSvg from './svg-animated/puslebuddy-idle-v2.svg'
import pulseBuddyReminderStateSvg from './svg-animated/pulse-buddy-reminder-v2.svg'
import pulseBuddySavedSvg from './svg-animated/pulse-buddy-saved-v2.svg'
import pulseBuddyDragStartSvg from './svg-animated/puslebuddy-drag-start.svg'
import pulseBuddyDraggingLoopSvg from './svg-animated/puslebuddy-dragging-loop.svg'
import pulseBuddyDragReleaseSvg from './svg-animated/puslebuddy-drag-release.svg'
import pulseBuddyHideContextSvg from './svg-animated/puslebuddy-hide-context.svg'
import pulseBuddyReappearSvg from './svg-animated/puslebuddy-reappear.svg'
import pulseBuddyClickAnnoyedSvg from './svg-animated/pulse-buddy-click-annoyed-v1.svg'

const {
  sleepHours,
  waterMl,
  moveMinutes,
  moodScore,
  entries,
  todayKey,
  todayEntry,
  yesterdayEntry,
  lastUpdatedAt,
  todayCompletion,
  totalEntries,
  sevenDaySeries,
  weeklyAverage,
  streakDays,
  suggestions,
  saveTodayEntry,
  loadTodayDraft,
  clearAllEntries,
} = useDailyHealthCheckin()

const saveState = ref<'idle' | 'saved'>('idle')
const isBuddyGreeting = ref(false)
const isBuddyVisible = useLocalStorage('daily-health-checkin.buddy-visible', true)
const saveToastVisible = ref(false)
const saveWarningVisible = ref(false)
const normalizeToastVisible = ref(false)
const exportToastVisible = ref(false)
const chartPulseActive = ref(false)
const weeklyRingSweepActive = ref(false)
const liftedHistoryDate = ref<string | null>(null)
const isAdvicePopupOpen = ref(false)
const focusedMetric = ref<'sleep' | 'water' | 'move' | 'mood' | null>(null)
const justCompletedMap = ref<Record<string, boolean>>({})
let greetToggleTimer: number | null = null
let saveToastTimer: number | null = null
let saveWarningTimer: number | null = null
let normalizeToastTimer: number | null = null
let exportToastTimer: number | null = null
let chartPulseTimer: number | null = null
let weeklyRingTimer: number | null = null
let historyLiftTimer: number | null = null
const checklistPulseTimers: number[] = []

function clearSaveUiTimers(): void {
  if (saveToastTimer !== null) {
    window.clearTimeout(saveToastTimer)
    saveToastTimer = null
  }
  if (chartPulseTimer !== null) {
    window.clearTimeout(chartPulseTimer)
    chartPulseTimer = null
  }
  if (saveWarningTimer !== null) {
    window.clearTimeout(saveWarningTimer)
    saveWarningTimer = null
  }
  if (normalizeToastTimer !== null) {
    window.clearTimeout(normalizeToastTimer)
    normalizeToastTimer = null
  }
  if (exportToastTimer !== null) {
    window.clearTimeout(exportToastTimer)
    exportToastTimer = null
  }
  if (weeklyRingTimer !== null) {
    window.clearTimeout(weeklyRingTimer)
    weeklyRingTimer = null
  }
  if (historyLiftTimer !== null) {
    window.clearTimeout(historyLiftTimer)
    historyLiftTimer = null
  }
}

function clearChecklistPulseTimers(): void {
  while (checklistPulseTimers.length > 0) {
    const timer = checklistPulseTimers.pop()
    if (timer !== undefined) {
      window.clearTimeout(timer)
    }
  }
}

function pulseChecklistItem(key: string): void {
  justCompletedMap.value = {
    ...justCompletedMap.value,
    [key]: true,
  }
  const timer = window.setTimeout(() => {
    justCompletedMap.value = {
      ...justCompletedMap.value,
      [key]: false,
    }
  }, 520)
  checklistPulseTimers.push(timer)
}

function clearGreetTimer(): void {
  if (greetToggleTimer !== null) {
    window.clearTimeout(greetToggleTimer)
    greetToggleTimer = null
  }
}

function scheduleBuddyGreeting(): void {
  clearGreetTimer()

  const nextDelayMs = Math.floor((25 + Math.random() * 20) * 1000)
  greetToggleTimer = window.setTimeout(() => {
    if (!isBuddyVisible.value || saveState.value === 'saved') {
      scheduleBuddyGreeting()
      return
    }

    isBuddyGreeting.value = true
    greetToggleTimer = window.setTimeout(() => {
      isBuddyGreeting.value = false
      scheduleBuddyGreeting()
    }, 5200)
  }, nextDelayMs)
}

const sleepPresets = [5.5, 6.5, 7.5, 8]
const waterPresets = [1200, 1500, 2000, 2500]
const movePresets = [10, 20, 30, 45]
const moodPresets: Array<{ value: number; label: string; emoji: string }> = [
  { value: 1, label: 'Rất thấp', emoji: '😵' },
  { value: 2, label: 'Thấp', emoji: '😕' },
  { value: 3, label: 'Ổn', emoji: '🙂' },
  { value: 4, label: 'Tốt', emoji: '😄' },
  { value: 5, label: 'Rất tốt', emoji: '🤩' },
]

const quickProfiles: Array<{
  id: string
  label: string
  note: string
  sleepHours: number
  waterMl: number
  moveMinutes: number
  moodScore: number
  accentClass: string
}> = [
  {
    id: 'busy-day',
    label: 'Ngày bận',
    note: 'Giữ baseline để không tụt năng lượng',
    sleepHours: 6.5,
    waterMl: 1500,
    moveMinutes: 10,
    moodScore: 3,
    accentClass: 'border-accent-amber text-accent-amber',
  },
  {
    id: 'balanced-day',
    label: 'Ngày cân bằng',
    note: 'Nhịp khỏe ổn định, dễ duy trì',
    sleepHours: 7.5,
    waterMl: 2000,
    moveMinutes: 20,
    moodScore: 4,
    accentClass: 'border-accent-sky text-accent-sky',
  },
  {
    id: 'high-energy',
    label: 'Ngày năng lượng cao',
    note: 'Đẩy nhẹ hiệu suất nhưng vẫn giữ recovery',
    sleepHours: 8,
    waterMl: 2500,
    moveMinutes: 45,
    moodScore: 5,
    accentClass: 'border-accent-coral text-accent-coral',
  },
]

const completionText = computed(() => `${todayCompletion.value}/4 chỉ số`)

const targetChecklist = computed(() => {
  return [
    {
      key: 'sleep',
      label: 'Ngủ đủ 7h+',
      done: (sleepHours.value ?? 0) >= 7,
      detail: sleepHours.value !== null ? `${sleepHours.value} giờ` : 'Chưa nhập',
      accent: 'text-accent-amber',
    },
    {
      key: 'water',
      label: 'Nước 1500ml+',
      done: (waterMl.value ?? 0) >= 1500,
      detail: waterMl.value !== null ? `${waterMl.value} ml` : 'Chưa nhập',
      accent: 'text-accent-sky',
    },
    {
      key: 'move',
      label: 'Vận động 20m+',
      done: (moveMinutes.value ?? 0) >= 20,
      detail: moveMinutes.value !== null ? `${moveMinutes.value} phút` : 'Chưa nhập',
      accent: 'text-accent-coral',
    },
    {
      key: 'mood',
      label: 'Mood >= 3',
      done: (moodScore.value ?? 0) >= 3,
      detail: moodScore.value !== null ? `${moodScore.value}/5` : 'Chưa nhập',
      accent: 'text-accent-amber',
    },
  ]
})

const historySummary = computed(() => {
  return [...sevenDaySeries.value].reverse()
})

const perfectDays = computed(() => {
  return sevenDaySeries.value.filter((point) => point.completion === 4).length
})

const activeDays = computed(() => {
  return sevenDaySeries.value.filter((point) => point.completion >= 2).length
})

const hydrationGapMl = computed(() => {
  return Math.max(0, 2000 - (waterMl.value ?? 0))
})

const recoveryGapHours = computed(() => {
  return Math.max(0, 7 - (sleepHours.value ?? 0))
})

const moveGapMinutes = computed(() => {
  return Math.max(0, 20 - (moveMinutes.value ?? 0))
})

const hasAnyMetricInput = computed(() => {
  return [sleepHours.value, waterMl.value, moveMinutes.value, moodScore.value].some(
    (value) => value !== null && !Number.isNaN(value),
  )
})

const yesterdayDelta = computed(() => {
  const source = todayEntry.value
  const baseline = yesterdayEntry.value

  const sleep =
    source?.sleepHours !== null &&
    source?.sleepHours !== undefined &&
    baseline?.sleepHours !== null &&
    baseline?.sleepHours !== undefined
      ? Number((source.sleepHours - baseline.sleepHours).toFixed(1))
      : null

  const water =
    source?.waterMl !== null &&
    source?.waterMl !== undefined &&
    baseline?.waterMl !== null &&
    baseline?.waterMl !== undefined
      ? source.waterMl - baseline.waterMl
      : null

  const move =
    source?.moveMinutes !== null &&
    source?.moveMinutes !== undefined &&
    baseline?.moveMinutes !== null &&
    baseline?.moveMinutes !== undefined
      ? source.moveMinutes - baseline.moveMinutes
      : null

  const mood =
    source?.moodScore !== null &&
    source?.moodScore !== undefined &&
    baseline?.moodScore !== null &&
    baseline?.moodScore !== undefined
      ? source.moodScore - baseline.moodScore
      : null

  return { sleep, water, move, mood }
})

const lastUpdatedText = computed(() => {
  if (!lastUpdatedAt.value) {
    return 'Chưa có bản lưu hôm nay'
  }
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(lastUpdatedAt.value)
})

function hasNormalizedDiff(before: number | null, after: number | null): boolean {
  if (before === null && after === null) {
    return false
  }
  if (before === null || after === null) {
    return true
  }
  return before !== after
}

function formatDelta(value: number | null, suffix: string): string {
  if (value === null) {
    return '--'
  }
  if (value === 0) {
    return `0${suffix}`
  }
  return `${value > 0 ? '+' : ''}${value}${suffix}`
}

function deltaClass(value: number | null): string {
  if (value === null || value === 0) {
    return 'text-text-dim'
  }
  return value > 0 ? 'text-accent-sky' : 'text-accent-coral'
}

const mascotState = computed<'idle' | 'reminder' | 'saved' | 'good-streak' | 'greet-talk'>(() => {
  if (saveState.value === 'saved') {
    return 'saved'
  }

  if (isBuddyGreeting.value) {
    return 'greet-talk'
  }

  if (streakDays.value >= 7 && todayCompletion.value >= 3) {
    return 'good-streak'
  }

  if (todayCompletion.value <= 1) {
    return 'reminder'
  }

  return 'idle'
})

const mascotImage = computed(() => {
  switch (mascotState.value) {
    case 'saved':
      return pulseBuddySavedSvg
    case 'greet-talk':
      return pulseBuddyGreetTalkSvg
    case 'good-streak':
      return pulseBuddyGoodStreakSvg
    case 'reminder':
      return pulseBuddyReminderStateSvg
    default:
      return pulseBuddyIdleSvg
  }
})

const mascotText = computed(() => {
  switch (mascotState.value) {
    case 'saved':
      return 'Pulse Buddy: Lưu xong rồi, nice!'
    case 'greet-talk':
      return 'Pulse Buddy: Chao ban, nho check-in deu de giu nhip song nhe!'
    case 'good-streak':
      return 'Pulse Buddy: Chuỗi tốt đang lên, giữ nhịp này nhé!'
    case 'reminder':
      return 'Pulse Buddy: Hôm nay check thêm vài chỉ số để đủ nhịp nào.'
    default:
      return 'Pulse Buddy: Trạng thái ổn định, tiếp tục theo dõi mỗi ngày.'
  }
})

function onSave(): void {
  if (!hasAnyMetricInput.value) {
    saveWarningVisible.value = true
    saveToastVisible.value = false
    clearSaveUiTimers()
    saveWarningTimer = window.setTimeout(() => {
      saveWarningVisible.value = false
      saveWarningTimer = null
    }, 1800)
    return
  }

  const beforeSave = {
    sleep: sleepHours.value,
    water: waterMl.value,
    move: moveMinutes.value,
    mood: moodScore.value,
  }

  const saved = saveTodayEntry()

  const hasNormalizedInput =
    hasNormalizedDiff(beforeSave.sleep, saved.sleepHours) ||
    hasNormalizedDiff(beforeSave.water, saved.waterMl) ||
    hasNormalizedDiff(beforeSave.move, saved.moveMinutes) ||
    hasNormalizedDiff(beforeSave.mood, saved.moodScore)

  if (hasNormalizedInput) {
    normalizeToastVisible.value = true
    if (normalizeToastTimer !== null) {
      window.clearTimeout(normalizeToastTimer)
    }
    normalizeToastTimer = window.setTimeout(() => {
      normalizeToastVisible.value = false
      normalizeToastTimer = null
    }, 2200)
  }

  saveState.value = 'saved'
  saveToastVisible.value = true
  saveWarningVisible.value = false
  chartPulseActive.value = true
  weeklyRingSweepActive.value = true
  liftedHistoryDate.value = todayKey.value
  clearSaveUiTimers()
  saveToastTimer = window.setTimeout(() => {
    saveToastVisible.value = false
    saveToastTimer = null
  }, 1400)
  chartPulseTimer = window.setTimeout(() => {
    chartPulseActive.value = false
    chartPulseTimer = null
  }, 900)
  weeklyRingTimer = window.setTimeout(() => {
    weeklyRingSweepActive.value = false
    weeklyRingTimer = null
  }, 900)
  historyLiftTimer = window.setTimeout(() => {
    liftedHistoryDate.value = null
    historyLiftTimer = null
  }, 900)
  isBuddyGreeting.value = false
  clearGreetTimer()
  setTimeout(() => {
    saveState.value = 'idle'
    scheduleBuddyGreeting()
  }, 1200)
}

function onExportJson(): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'daily-health-checkin',
    totalEntries: entries.value.length,
    entries: entries.value,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `daily-health-checkin-${todayKey.value}.json`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)

  exportToastVisible.value = true
  if (exportToastTimer !== null) {
    window.clearTimeout(exportToastTimer)
  }
  exportToastTimer = window.setTimeout(() => {
    exportToastVisible.value = false
    exportToastTimer = null
  }, 1600)
}

function onResetInputs(): void {
  loadTodayDraft()
  saveState.value = 'idle'
}

function setSleepPreset(value: number): void {
  sleepHours.value = value
  saveState.value = 'idle'
  focusedMetric.value = 'sleep'
}

function setWaterPreset(value: number): void {
  waterMl.value = value
  saveState.value = 'idle'
  focusedMetric.value = 'water'
}

function setMovePreset(value: number): void {
  moveMinutes.value = value
  saveState.value = 'idle'
  focusedMetric.value = 'move'
}

function setMoodPreset(value: number): void {
  moodScore.value = value
  saveState.value = 'idle'
  focusedMetric.value = 'mood'
}

function applyQuickProfile(profileId: string): void {
  const profile = quickProfiles.find((item) => item.id === profileId)
  if (!profile) {
    return
  }

  sleepHours.value = profile.sleepHours
  waterMl.value = profile.waterMl
  moveMinutes.value = profile.moveMinutes
  moodScore.value = profile.moodScore
  saveState.value = 'idle'
}

function handleClearAllData(): void {
  clearAllEntries()
  saveState.value = 'idle'
  window.location.reload()
}

function showBuddy(): void {
  isBuddyVisible.value = true
  scheduleBuddyGreeting()
}

function hideBuddy(): void {
  isBuddyVisible.value = false
  isBuddyGreeting.value = false
  clearGreetTimer()
}

function openAdvicePopup(): void {
  isAdvicePopupOpen.value = true
}

function closeAdvicePopup(): void {
  isAdvicePopupOpen.value = false
}

onMounted(() => {
  if (isBuddyVisible.value) {
    scheduleBuddyGreeting()
  }
})

watch(
  targetChecklist,
  (next, prev) => {
    if (!prev) {
      return
    }

    const prevByKey = new Map(prev.map((item) => [item.key, item.done]))
    for (const item of next) {
      if (item.done && !prevByKey.get(item.key)) {
        pulseChecklistItem(item.key)
      }
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  clearGreetTimer()
  clearSaveUiTimers()
  clearChecklistPulseTimers()
})
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden bg-bg-deep text-text-primary font-body">
    <a
      href="https://github.com/TranQui004"
      target="_blank"
      rel="noopener noreferrer"
      class="absolute right-2 top-2 z-30 inline-flex items-center gap-2 border border-border-default bg-bg-surface/90 px-2 py-1 text-[10px] tracking-wider text-text-secondary backdrop-blur hover:border-accent-amber hover:text-text-primary sm:right-6 sm:top-3 sm:px-3 sm:py-2 sm:text-xs"
      aria-label="Made by TranQui004"
    >
      <img
        src="https://github.com/TranQui004.png?size=64"
        alt="TranQui004 GitHub Avatar"
        class="h-5 w-5 rounded-full border border-border-default"
      />
      <span class="hidden sm:inline"
        >Made by <span class="text-accent-amber">TranQui004</span></span
      >
    </a>

    <div class="pointer-events-none absolute inset-0">
      <div
        class="ambient-orb ambient-orb-a absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-sky/10 blur-3xl"
      />
      <div
        class="ambient-orb ambient-orb-b absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-coral/10 blur-3xl"
      />
      <div
        class="ambient-orb ambient-orb-c absolute right-0 top-1/3 h-56 w-56 rounded-full bg-accent-amber/10 blur-3xl"
      />
      <div
        class="ambient-glow absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_55%)]"
      />
    </div>

    <div class="relative mx-auto max-w-[98rem] px-5 py-10 sm:px-8 sm:py-14">
      <header
        class="relative overflow-hidden animate-fade-up border border-border-default bg-bg-surface/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm sm:p-8"
      >
        <div class="header-accent-sweep pointer-events-none" />
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="font-display text-xs tracking-[0.14em] text-accent-coral">
              // SỨC KHỎE & LỐI SỐNG
            </p>
            <h1 class="mt-2 font-display text-3xl font-bold sm:text-4xl">Daily Health Check-in</h1>
            <p class="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
              Check-in nhanh 4 chỉ số mỗi ngày để theo dõi nhịp sống và giữ cân bằng.
            </p>
          </div>
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Về trang chủ
          </RouterLink>
        </div>
      </header>

      <section
        class="mt-5 animate-fade-up border border-border-default bg-bg-surface/90 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-6"
      >
        <p class="font-display text-xs tracking-[0.14em] text-accent-sky">
          // BẠN CẦN LÀM GÌ Ở TRANG NÀY?
        </p>
        <ol class="mt-2 grid gap-2 text-sm text-text-secondary sm:grid-cols-3">
          <li class="border border-border-default bg-bg-elevated px-3 py-2">
            1. Chọn preset hoặc nhập 4 chỉ số sức khỏe hôm nay.
          </li>
          <li class="border border-border-default bg-bg-elevated px-3 py-2">
            2. Bấm Lưu check-in để cập nhật tiến độ và gợi ý cá nhân hóa.
          </li>
          <li class="border border-border-default bg-bg-elevated px-3 py-2">
            3. Theo dõi Pulse Buddy và xu hướng 7 ngày để giữ nhịp đều.
          </li>
        </ol>
      </section>

      <section class="mt-6 grid gap-5 sm:grid-cols-3">
        <article
          class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface/90 p-5 transition hover:-translate-y-0.5 hover:border-accent-coral/40 hover:shadow-lg sm:p-6"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">TODAY</p>
          <p class="mt-2 font-display text-2xl text-accent-coral">{{ todayKey }}</p>
          <p class="mt-1 text-sm text-text-secondary">{{ completionText }}</p>
        </article>
        <article
          class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface/90 p-5 transition hover:-translate-y-0.5 hover:border-accent-amber/40 hover:shadow-lg sm:p-6"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">STREAK</p>
          <p class="mt-2 font-display text-2xl text-accent-amber">{{ streakDays }} ngày</p>
          <p class="mt-1 text-sm text-text-secondary">Chuỗi check-in liên tiếp</p>
        </article>
        <article
          class="animate-fade-up animate-delay-3 relative border border-border-default bg-bg-surface/90 p-5 transition hover:-translate-y-0.5 hover:border-accent-sky/40 hover:shadow-lg sm:p-6"
        >
          <div class="weekly-ring-wrap" :class="weeklyRingSweepActive ? 'weekly-ring-sweep' : ''">
            <div class="weekly-ring" />
          </div>
          <p class="text-xs tracking-[0.12em] text-text-dim">WEEKLY SCORE</p>
          <p class="mt-2 font-display text-2xl text-accent-sky">{{ weeklyAverage }}%</p>
          <p class="mt-1 text-sm text-text-secondary">Mức hoàn thành 7 ngày gần nhất</p>
        </article>
      </section>

      <section
        class="mt-6 animate-fade-up animate-delay-4 border border-border-default bg-bg-surface/90 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-7"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-display text-xs tracking-[0.14em] text-accent-amber">
              // PULSE BUDDY WIDGET
            </p>
            <p class="mt-1 text-sm text-text-secondary">
              Buddy đang là widget nổi, kéo thả tự do trên màn hình.
            </p>
            <p class="mt-1 text-xs text-accent-sky">
              Mẹo tương tác: hãy click phải vào Pulse Buddy để mở menu tương tác.
            </p>
          </div>
          <button
            v-if="!isBuddyVisible"
            type="button"
            class="inline-flex items-center gap-2 border border-accent-sky bg-accent-sky/10 px-4 py-2 text-sm text-accent-sky transition hover:bg-accent-sky hover:text-bg-deep"
            @click="showBuddy"
          >
            <Icon icon="lucide:sparkles" class="size-4" />
            Hiện Pulse Buddy
          </button>
          <button
            v-else
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
            @click="hideBuddy"
          >
            <Icon icon="lucide:eye-off" class="size-4" />
            Ẩn Pulse Buddy
          </button>
        </div>
      </section>

      <section class="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article
          class="animate-fade-up animate-delay-5 border border-border-default bg-bg-surface/90 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-7"
        >
          <h2 class="mb-4 flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-xs tracking-widest text-accent-amber">//</span>
            Check-in hôm nay
          </h2>

          <p class="mb-4 text-xs text-text-dim">
            Ưu tiên bấm preset để check nhanh. Chỉ nhập tay khi cần giá trị tùy chỉnh.
          </p>

          <div class="mb-4 grid gap-2 sm:grid-cols-3">
            <button
              v-for="profile in quickProfiles"
              :key="profile.id"
              type="button"
              class="border bg-bg-elevated px-3 py-2 text-left transition hover:bg-bg-deep/50"
              :class="profile.accentClass"
              @click="applyQuickProfile(profile.id)"
            >
              <p class="font-display text-sm">{{ profile.label }}</p>
              <p class="mt-1 text-xs text-text-dim">{{ profile.note }}</p>
            </button>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label
              class="space-y-1 metric-field"
              :class="focusedMetric === 'sleep' ? 'metric-field-active metric-field-amber' : ''"
            >
              <span class="text-xs tracking-wide text-text-dim">Ngủ (giờ)</span>
              <div class="mb-2 flex flex-wrap gap-2">
                <button
                  v-for="preset in sleepPresets"
                  :key="`sleep-${preset}`"
                  type="button"
                  class="border px-2.5 py-1 text-xs transition"
                  :class="
                    sleepHours === preset
                      ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber'
                  "
                  @click="setSleepPreset(preset)"
                >
                  {{ preset }}h
                </button>
              </div>
              <input
                v-model.number="sleepHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none transition focus:border-accent-coral"
                placeholder="Nhập tay nếu khác preset"
                @focus="focusedMetric = 'sleep'"
                @blur="focusedMetric = null"
              />
            </label>
            <label
              class="space-y-1 metric-field"
              :class="focusedMetric === 'water' ? 'metric-field-active metric-field-sky' : ''"
            >
              <span class="text-xs tracking-wide text-text-dim">Nước (ml)</span>
              <div class="mb-2 flex flex-wrap gap-2">
                <button
                  v-for="preset in waterPresets"
                  :key="`water-${preset}`"
                  type="button"
                  class="border px-2.5 py-1 text-xs transition"
                  :class="
                    waterMl === preset
                      ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-sky'
                  "
                  @click="setWaterPreset(preset)"
                >
                  {{ preset }}
                </button>
              </div>
              <input
                v-model.number="waterMl"
                type="number"
                min="0"
                step="100"
                class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none transition focus:border-accent-coral"
                placeholder="Nhập tay nếu khác preset"
                @focus="focusedMetric = 'water'"
                @blur="focusedMetric = null"
              />
            </label>
            <label
              class="space-y-1 metric-field"
              :class="focusedMetric === 'move' ? 'metric-field-active metric-field-coral' : ''"
            >
              <span class="text-xs tracking-wide text-text-dim">Vận động (phút)</span>
              <div class="mb-2 flex flex-wrap gap-2">
                <button
                  v-for="preset in movePresets"
                  :key="`move-${preset}`"
                  type="button"
                  class="border px-2.5 py-1 text-xs transition"
                  :class="
                    moveMinutes === preset
                      ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral'
                  "
                  @click="setMovePreset(preset)"
                >
                  {{ preset }}m
                </button>
              </div>
              <input
                v-model.number="moveMinutes"
                type="number"
                min="0"
                step="5"
                class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none transition focus:border-accent-coral"
                placeholder="Nhập tay nếu khác preset"
                @focus="focusedMetric = 'move'"
                @blur="focusedMetric = null"
              />
            </label>
            <label
              class="space-y-1 metric-field"
              :class="focusedMetric === 'mood' ? 'metric-field-active metric-field-amber' : ''"
            >
              <span class="text-xs tracking-wide text-text-dim">Tâm trạng (1-5)</span>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="mood in moodPresets"
                  :key="`mood-${mood.value}`"
                  type="button"
                  class="border px-2 py-2 text-center text-xs transition"
                  :class="
                    moodScore === mood.value
                      ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber'
                  "
                  @click="setMoodPreset(mood.value)"
                >
                  <span class="block text-base">{{ mood.emoji }}</span>
                  <span class="mt-0.5 block">{{ mood.value }}</span>
                </button>
              </div>
              <p class="text-[11px] text-text-dim">
                Mood chọn nhanh bằng nút để check-in tiện hơn.
              </p>
            </label>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-sm text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
              @click="onSave"
            >
              <Icon icon="lucide:save" class="size-4" />
              Lưu check-in
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
              @click="onResetInputs"
            >
              <Icon icon="lucide:rotate-ccw" class="size-4" />
              Tải lại dữ liệu hôm nay
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-accent-sky bg-accent-sky/10 px-4 py-2 text-sm text-accent-sky transition hover:bg-accent-sky hover:text-bg-deep"
              @click="openAdvicePopup"
            >
              <Icon icon="lucide:heart-pulse" class="size-4" />
              Mở popup lời khuyên
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-accent-amber bg-accent-amber/10 px-4 py-2 text-sm text-accent-amber transition hover:bg-accent-amber hover:text-bg-deep"
              @click="onExportJson"
            >
              <Icon icon="lucide:download" class="size-4" />
              Export JSON
            </button>
            <span
              class="inline-flex items-center px-3 py-2 text-xs"
              :class="saveState === 'saved' ? 'text-accent-sky' : 'text-text-dim'"
            >
              {{
                saveState === 'saved' ? 'Đã lưu thành công' : 'Dữ liệu lưu local trên trình duyệt'
              }}
            </span>
          </div>

          <div
            class="mt-3 flex flex-wrap items-center justify-between gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary"
          >
            <span>Lần lưu gần nhất: {{ lastUpdatedText }}</span>
            <span class="text-text-dim"
              >Mục 1: Dữ liệu được tự động chuẩn hóa trong ngưỡng hợp lệ.</span
            >
          </div>

          <transition name="save-toast">
            <div
              v-if="saveToastVisible"
              class="mt-3 border border-accent-sky/60 bg-accent-sky/10 px-3 py-2 text-xs text-accent-sky"
            >
              Save success: dữ liệu hôm nay đã được cập nhật.
            </div>
          </transition>

          <transition name="save-toast">
            <div
              v-if="saveWarningVisible"
              class="mt-3 border border-accent-amber/70 bg-accent-amber/12 px-3 py-2 text-xs text-accent-amber"
            >
              Bạn chưa nhập chỉ số nào để lưu. Hãy chọn ít nhất 1 chỉ số trước khi save check-in.
            </div>
          </transition>

          <transition name="save-toast">
            <div
              v-if="normalizeToastVisible"
              class="mt-3 border border-accent-coral/70 bg-accent-coral/12 px-3 py-2 text-xs text-accent-coral"
            >
              Một vài giá trị đã được chuẩn hóa về ngưỡng an toàn trước khi lưu.
            </div>
          </transition>

          <transition name="save-toast">
            <div
              v-if="exportToastVisible"
              class="mt-3 border border-accent-amber/70 bg-accent-amber/12 px-3 py-2 text-xs text-accent-amber"
            >
              Export thành công file JSON lịch sử check-in.
            </div>
          </transition>

          <div
            class="mt-4 border border-border-default bg-bg-elevated p-3 text-xs text-text-secondary"
          >
            Gợi ý lối sống chỉ mang tính tham khảo, không phải tư vấn y khoa/chẩn đoán/điều trị.
          </div>
        </article>

        <div class="grid gap-5">
          <article
            class="animate-fade-up animate-delay-6 border border-border-default bg-bg-surface/90 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-6"
          >
            <h2 class="mb-4 flex items-center gap-3 font-display text-2xl font-semibold">
              <span class="font-display text-xs tracking-widest text-accent-coral">//</span>
              Mục tiêu hôm nay
            </h2>

            <ul class="space-y-2 text-sm">
              <li
                v-for="item in targetChecklist"
                :key="item.key"
                class="flex items-center justify-between border border-border-default bg-bg-elevated px-3 py-2 transition"
                :class="[
                  item.done ? 'goal-item-done' : '',
                  justCompletedMap[item.key] ? 'goal-item-resolve' : '',
                ]"
              >
                <div>
                  <p :class="item.accent">{{ item.label }}</p>
                  <p class="text-xs text-text-dim">{{ item.detail }}</p>
                </div>
                <Icon
                  :icon="item.done ? 'lucide:check-circle-2' : 'lucide:circle-dashed'"
                  class="size-4"
                  :class="[
                    item.done ? 'text-accent-sky' : 'text-text-dim',
                    justCompletedMap[item.key] ? 'goal-icon-pop' : '',
                  ]"
                />
              </li>
            </ul>
          </article>

          <HealthWeeklyTrendPanel
            :today-key="todayKey"
            :seven-day-series="sevenDaySeries"
            :perfect-days="perfectDays"
            :active-days="activeDays"
            :history-summary="historySummary"
            :lifted-history-date="liftedHistoryDate"
            :chart-pulse-active="chartPulseActive"
            :suggestions="suggestions"
          />

          <HealthDangerZone :total-entries="totalEntries" @clear-all="handleClearAllData" />
        </div>
      </section>

      <section class="mt-6 grid gap-5 lg:grid-cols-3">
        <article
          class="border border-border-default bg-bg-surface/90 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">HYDRATION GAP</p>
          <p class="mt-2 font-display text-2xl text-accent-sky">{{ hydrationGapMl }}ml</p>
          <p class="mt-1 text-sm text-text-secondary">Khoảng thiếu nước để chạm mốc 2L hôm nay</p>
        </article>

        <article
          class="border border-border-default bg-bg-surface/90 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">RECOVERY WINDOW</p>
          <p class="mt-2 font-display text-2xl text-accent-amber">
            {{ recoveryGapHours.toFixed(1) }}h
          </p>
          <p class="mt-1 text-sm text-text-secondary">
            Khoảng ngủ còn thiếu để đạt ngưỡng phục hồi
          </p>
        </article>

        <article
          class="border border-border-default bg-bg-surface/90 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">MOVE TARGET</p>
          <p class="mt-2 font-display text-2xl text-accent-coral">{{ moveGapMinutes }}m</p>
          <p class="mt-1 text-sm text-text-secondary">Số phút vận động còn thiếu để đủ 20 phút</p>
        </article>
      </section>

      <section class="mt-6 grid gap-5 lg:grid-cols-4">
        <article
          class="border border-border-default bg-bg-surface/90 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">VS HÔM QUA • NGỦ</p>
          <p class="mt-2 font-display text-2xl" :class="deltaClass(yesterdayDelta.sleep)">
            {{ formatDelta(yesterdayDelta.sleep, 'h') }}
          </p>
        </article>
        <article
          class="border border-border-default bg-bg-surface/90 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">VS HÔM QUA • NƯỚC</p>
          <p class="mt-2 font-display text-2xl" :class="deltaClass(yesterdayDelta.water)">
            {{ formatDelta(yesterdayDelta.water, 'ml') }}
          </p>
        </article>
        <article
          class="border border-border-default bg-bg-surface/90 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">VS HÔM QUA • VẬN ĐỘNG</p>
          <p class="mt-2 font-display text-2xl" :class="deltaClass(yesterdayDelta.move)">
            {{ formatDelta(yesterdayDelta.move, 'm') }}
          </p>
        </article>
        <article
          class="border border-border-default bg-bg-surface/90 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5"
        >
          <p class="text-xs tracking-[0.12em] text-text-dim">VS HÔM QUA • TÂM TRẠNG</p>
          <p class="mt-2 font-display text-2xl" :class="deltaClass(yesterdayDelta.mood)">
            {{ formatDelta(yesterdayDelta.mood, '') }}
          </p>
        </article>
      </section>
    </div>

    <PulseBuddyFloatingWidget
      v-if="isBuddyVisible"
      :image-src="mascotImage"
      :state-text="mascotText"
      :idle-image-src="pulseBuddyIdleSvg"
      :reminder-image-src="pulseBuddyReminderStateSvg"
      :saved-image-src="pulseBuddySavedSvg"
      :good-streak-image-src="pulseBuddyGoodStreakSvg"
      :greet-talk-image-src="pulseBuddyGreetTalkSvg"
      :drag-start-image-src="pulseBuddyDragStartSvg"
      :dragging-image-src="pulseBuddyDraggingLoopSvg"
      :drag-release-image-src="pulseBuddyDragReleaseSvg"
      :context-menu-image-src="pulseBuddyHideContextSvg"
      :reappear-image-src="pulseBuddyReappearSvg"
      :annoyed-image-src="pulseBuddyClickAnnoyedSvg"
      @hide="hideBuddy"
    />

    <HealthReferencePopup
      :open="isAdvicePopupOpen"
      :sleep-hours="sleepHours"
      :water-ml="waterMl"
      :move-minutes="moveMinutes"
      :mood-score="moodScore"
      @close="closeAdvicePopup"
    />

    <BackToTop />
  </div>
</template>

<style scoped>
.ambient-orb {
  animation: ambient-orb-float 14s ease-in-out infinite;
}

.ambient-orb-a {
  animation-delay: 0s;
}

.ambient-orb-b {
  animation-delay: -4s;
}

.ambient-orb-c {
  animation-delay: -8s;
}

.ambient-glow {
  animation: ambient-glow-pulse 10s ease-in-out infinite;
}

.header-accent-sweep {
  position: absolute;
  top: 0;
  left: -20%;
  width: 40%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.55), transparent);
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4));
  animation: header-accent-sweep 12s ease-in-out infinite;
}

.weekly-ring-wrap {
  pointer-events: none;
  position: absolute;
  top: 8px;
  right: 8px;
  width: 44px;
  height: 44px;
}

.weekly-ring {
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  border: 2px solid rgba(56, 189, 248, 0.25);
  opacity: 0.55;
}

.weekly-ring-sweep .weekly-ring {
  animation: weekly-ring-sweep 0.8s ease-out;
}

.save-toast-enter-active,
.save-toast-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.save-toast-enter-from,
.save-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes ambient-orb-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, -8px, 0) scale(1.04);
  }
}

@keyframes ambient-glow-pulse {
  0%,
  100% {
    opacity: 0.65;
  }
  50% {
    opacity: 0.9;
  }
}

@keyframes header-accent-sweep {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0;
  }
  8% {
    opacity: 0.9;
  }
  24% {
    transform: translateX(300%);
    opacity: 0;
  }
}

@keyframes weekly-ring-sweep {
  0% {
    transform: scale(0.88) rotate(-40deg);
    border-color: rgba(56, 189, 248, 0.65);
    opacity: 0.95;
  }
  60% {
    transform: scale(1.04) rotate(16deg);
    border-color: rgba(56, 189, 248, 0.42);
    opacity: 0.75;
  }
  100% {
    transform: scale(1) rotate(0deg);
    border-color: rgba(56, 189, 248, 0.25);
    opacity: 0.55;
  }
}

.metric-field {
  border: 1px solid transparent;
  padding: 8px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.metric-field-active {
  background: rgba(255, 255, 255, 0.01);
}

.metric-field-amber {
  border-color: rgba(255, 184, 48, 0.5);
  box-shadow:
    0 0 0 1px rgba(255, 184, 48, 0.18),
    0 0 18px rgba(255, 184, 48, 0.12);
}

.metric-field-sky {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.18),
    0 0 18px rgba(56, 189, 248, 0.12);
}

.metric-field-coral {
  border-color: rgba(255, 107, 74, 0.5);
  box-shadow:
    0 0 0 1px rgba(255, 107, 74, 0.18),
    0 0 18px rgba(255, 107, 74, 0.12);
}

.goal-item-done {
  border-color: rgba(56, 189, 248, 0.35);
}

.goal-item-resolve {
  animation: goal-resolve 0.52s ease-out;
}

.goal-icon-pop {
  animation: goal-icon-pop 0.42s ease-out;
}

@keyframes goal-resolve {
  0% {
    transform: translateY(0);
    background-color: rgba(56, 189, 248, 0.04);
  }
  45% {
    transform: translateY(-2px);
    background-color: rgba(56, 189, 248, 0.12);
  }
  100% {
    transform: translateY(0);
    background-color: rgba(56, 189, 248, 0.04);
  }
}

@keyframes goal-icon-pop {
  0% {
    transform: scale(0.85);
  }
  55% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}
</style>
