<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DigitalClock from './DigitalClock.vue'
import AnalogClock from './AnalogClock.vue'
import FlipClock from './FlipClock.vue'
import MinimalClock from './MinimalClock.vue'

// ─── Types ───────────────────────────────────────────────────────────
type Mode = 'clock' | 'stopwatch' | 'countdown' | 'pomodoro' | 'world'
type ClockStyle = 'digital' | 'analog' | 'flip' | 'minimal'
type PomodoroPhase = 'work' | 'short-break' | 'long-break'

interface PomodoroPreset {
  label: string
  seconds: number
  phase: PomodoroPhase
}

interface WorldCity {
  label: string
  timezone: string
  flag: string
}

// ─── State ───────────────────────────────────────────────────────────
const mode = ref<Mode>('clock')
const clockStyle = ref<ClockStyle>('digital')
const now = ref(new Date())

// Stopwatch
const stopwatchMs = ref(0)
const stopwatchRunning = ref(false)
const stopwatchInterval = ref<ReturnType<typeof setInterval>>()
const stopwatchLaps = ref<number[]>([])
const lastLapMs = ref(0)

// Countdown
const countdownTotal = ref(300)
const countdownRemaining = ref(300)
const countdownRunning = ref(false)
const countdownInterval = ref<ReturnType<typeof setInterval>>()
const countdownInputMin = ref(5)
const countdownInputSec = ref(0)
const countdownEditing = ref(true)

// Pomodoro
const pomodoroPresets: PomodoroPreset[] = [
  { label: 'Làm việc', seconds: 25 * 60, phase: 'work' },
  { label: 'Nghỉ ngắn', seconds: 5 * 60, phase: 'short-break' },
  { label: 'Nghỉ dài', seconds: 15 * 60, phase: 'long-break' },
]
const pomodoroPhase = ref<PomodoroPhase>('work')
const pomodoroRemaining = ref(25 * 60)
const pomodoroTotal = ref(25 * 60)
const pomodoroRunning = ref(false)
const pomodoroInterval = ref<ReturnType<typeof setInterval>>()
const pomodoroSessions = ref(0)
const sessionPop = ref(false)

// World clock
const worldCityOptions: WorldCity[] = [
  { label: 'Hà Nội', timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { label: 'Tokyo', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { label: 'Seoul', timezone: 'Asia/Seoul', flag: '🇰🇷' },
  { label: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬' },
  { label: 'Bangkok', timezone: 'Asia/Bangkok', flag: '🇹🇭' },
  { label: 'Bắc Kinh', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
  { label: 'Mumbai', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
  { label: 'Dubai', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { label: 'Moscow', timezone: 'Europe/Moscow', flag: '🇷🇺' },
  { label: 'London', timezone: 'Europe/London', flag: '🇬🇧' },
  { label: 'Paris', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { label: 'Berlin', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { label: 'New York', timezone: 'America/New_York', flag: '🇺🇸' },
  { label: 'Los Angeles', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { label: 'Sydney', timezone: 'Australia/Sydney', flag: '🇦🇺' },
  { label: 'São Paulo', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
]
const selectedCities = ref<WorldCity[]>([
  worldCityOptions[0]!, // Hà Nội
  worldCityOptions[12]!, // New York
  worldCityOptions[9]!, // London
  worldCityOptions[1]!, // Tokyo
])
const showCityPicker = ref(false)

function worldTime(tz: string) {
  const d = now.value
  const h = d.toLocaleString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  return h
}

function worldDate(tz: string) {
  return now.value.toLocaleDateString('vi-VN', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function worldOffset(tz: string) {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
  const parts = formatter.formatToParts(now.value)
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')
  return offsetPart?.value ?? ''
}

function toggleCity(city: WorldCity) {
  const idx = selectedCities.value.findIndex((c) => c.timezone === city.timezone)
  if (idx >= 0) {
    selectedCities.value.splice(idx, 1)
  } else {
    // Check if it's in our options list, if not add it as a new city
    const existing = worldCityOptions.find((c) => c.timezone === city.timezone)
    selectedCities.value.push(existing ?? city)
  }
}

function isCitySelected(city: WorldCity) {
  return selectedCities.value.some((c) => c.timezone === city.timezone)
}

// Fullscreen
const isFullscreen = ref(false)
const containerRef = ref<HTMLElement>()

// ─── Clock tick ──────────────────────────────────────────────────────
let clockTimer: ReturnType<typeof setInterval>
onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 200)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  clearInterval(clockTimer)
  clearStopwatch()
  clearCountdown()
  clearPomodoro()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

// ─── Computed display values ─────────────────────────────────────────
const clockTime = computed(() => {
  const h = String(now.value.getHours()).padStart(2, '0')
  const m = String(now.value.getMinutes()).padStart(2, '0')
  const s = String(now.value.getSeconds()).padStart(2, '0')
  return { h, m, s }
})

const clockDate = computed(() => {
  return now.value.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const stopwatchDisplay = computed(() => formatMs(stopwatchMs.value))

const countdownDisplay = computed(() => formatSeconds(countdownRemaining.value))

const pomodoroDisplay = computed(() => formatSeconds(pomodoroRemaining.value))

const pomodoroProgress = computed(() => {
  if (pomodoroTotal.value === 0) return 0
  return ((pomodoroTotal.value - pomodoroRemaining.value) / pomodoroTotal.value) * 100
})

const countdownProgress = computed(() => {
  if (countdownTotal.value === 0) return 0
  return ((countdownTotal.value - countdownRemaining.value) / countdownTotal.value) * 100
})

// ─── Helpers ─────────────────────────────────────────────────────────
function formatSeconds(total: number): { h: string; m: string; s: string } {
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return { h, m, s }
}

function formatMs(ms: number): { h: string; m: string; s: string; cs: string } {
  const totalSec = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0')
  return { h, m, s, cs }
}

// ─── Stopwatch ───────────────────────────────────────────────────────
function toggleStopwatch() {
  if (stopwatchRunning.value) {
    pauseStopwatch()
  } else {
    startStopwatch()
  }
}

function startStopwatch() {
  stopwatchRunning.value = true
  const start = Date.now() - stopwatchMs.value
  stopwatchInterval.value = setInterval(() => {
    stopwatchMs.value = Date.now() - start
  }, 30)
}

function pauseStopwatch() {
  stopwatchRunning.value = false
  clearInterval(stopwatchInterval.value)
}

function resetStopwatch() {
  pauseStopwatch()
  stopwatchMs.value = 0
  stopwatchLaps.value = []
  lastLapMs.value = 0
}

function recordLap() {
  const lapTime = stopwatchMs.value - lastLapMs.value
  stopwatchLaps.value.push(lapTime)
  lastLapMs.value = stopwatchMs.value
}

function clearLaps() {
  stopwatchLaps.value = []
  lastLapMs.value = stopwatchMs.value
}

function clearStopwatch() {
  clearInterval(stopwatchInterval.value)
}

// ─── Countdown ───────────────────────────────────────────────────────
function startCountdown() {
  if (countdownEditing.value) {
    const total = countdownInputMin.value * 60 + countdownInputSec.value
    if (total <= 0) return
    countdownTotal.value = total
    countdownRemaining.value = total
    countdownEditing.value = false
  }
  countdownRunning.value = true
  countdownInterval.value = setInterval(() => {
    if (countdownRemaining.value <= 0) {
      clearInterval(countdownInterval.value)
      countdownRunning.value = false
      return
    }
    countdownRemaining.value--
  }, 1000)
}

function pauseCountdown() {
  countdownRunning.value = false
  clearInterval(countdownInterval.value)
}

function toggleCountdown() {
  if (countdownRunning.value) {
    pauseCountdown()
  } else {
    startCountdown()
  }
}

function resetCountdown() {
  pauseCountdown()
  countdownEditing.value = true
  countdownRemaining.value = countdownTotal.value
}

function clearCountdown() {
  clearInterval(countdownInterval.value)
}

// ─── Pomodoro ────────────────────────────────────────────────────────
function selectPomodoro(preset: PomodoroPreset) {
  clearInterval(pomodoroInterval.value)
  pomodoroRunning.value = false
  pomodoroPhase.value = preset.phase
  pomodoroTotal.value = preset.seconds
  pomodoroRemaining.value = preset.seconds
}

function togglePomodoro() {
  if (pomodoroRunning.value) {
    pausePomodoro()
  } else {
    startPomodoro()
  }
}

function startPomodoro() {
  pomodoroRunning.value = true
  pomodoroInterval.value = setInterval(() => {
    if (pomodoroRemaining.value <= 0) {
      clearInterval(pomodoroInterval.value)
      pomodoroRunning.value = false
      if (pomodoroPhase.value === 'work') {
        pomodoroSessions.value++
      }
      return
    }
    pomodoroRemaining.value--
  }, 1000)
}

function pausePomodoro() {
  pomodoroRunning.value = false
  clearInterval(pomodoroInterval.value)
}

function resetPomodoro() {
  pausePomodoro()
  pomodoroRemaining.value = pomodoroTotal.value
}

function clearPomodoro() {
  clearInterval(pomodoroInterval.value)
}

// ─── Fullscreen ──────────────────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    containerRef.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// ─── Mode switch cleanup ─────────────────────────────────────────────
watch(mode, () => {
  pauseStopwatch()
  pauseCountdown()
  pausePomodoro()
})

watch(pomodoroSessions, () => {
  sessionPop.value = true
  setTimeout(() => {
    sessionPop.value = false
  }, 300)
})

// ─── Accent color per mode ───────────────────────────────────────────
const modeAccent = computed(() => {
  switch (mode.value) {
    case 'clock':
      return 'coral'
    case 'stopwatch':
      return 'sky'
    case 'countdown':
      return 'amber'
    case 'pomodoro':
      return 'coral'
    case 'world':
      return 'sky'
    default:
      return 'coral'
  }
})

const phaseLabel = computed(() => {
  switch (pomodoroPhase.value) {
    case 'work':
      return 'Làm việc'
    case 'short-break':
      return 'Nghỉ ngắn'
    case 'long-break':
      return 'Nghỉ dài'
    default:
      return ''
  }
})

const modes: { key: Mode; label: string }[] = [
  { key: 'clock', label: 'Đồng hồ' },
  { key: 'stopwatch', label: 'Bấm giờ' },
  { key: 'countdown', label: 'Đếm ngược' },
  { key: 'pomodoro', label: 'Pomodoro' },
  { key: 'world', label: 'Thế giới' },
]

const clockStyles: { key: ClockStyle; label: string }[] = [
  { key: 'digital', label: 'Số' },
  { key: 'analog', label: 'Kim' },
  { key: 'flip', label: 'Lật' },
  { key: 'minimal', label: 'Tối giản' },
]
</script>

<template>
  <div
    ref="containerRef"
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col select-none"
  >
    <!-- Top bar -->
    <div
      class="flex items-center justify-between px-4 sm:px-6 py-3 animate-fade-up"
      :class="{ 'opacity-0 hover:opacity-100 transition-opacity duration-500': isFullscreen }"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>

      <button
        class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @click="toggleFullscreen"
      >
        {{ isFullscreen ? 'Thoát toàn màn' : 'Toàn màn hình' }}
      </button>
    </div>

    <!-- Mode tabs -->
    <div
      class="flex flex-col items-center gap-2 px-4 py-2 animate-fade-up animate-delay-2"
      :class="{ 'opacity-0 hover:opacity-100 transition-opacity duration-500': isFullscreen }"
    >
      <!-- Primary modes -->
      <div class="flex gap-1">
        <button
          v-for="m in modes"
          :key="m.key"
          class="px-4 py-2 text-sm font-display tracking-wide transition-all duration-300 border"
          :class="
            mode === m.key
              ? `border-accent-${modeAccent} text-accent-${modeAccent} bg-bg-surface`
              : 'border-transparent text-text-dim hover:text-text-secondary'
          "
          @click="mode = m.key"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- Divider -->
      <div v-if="mode === 'clock'" class="w-full h-px bg-border-default" />

      <!-- Clock style selector (only in clock mode) -->
      <div v-if="mode === 'clock'" class="flex gap-1">
        <button
          v-for="s in clockStyles"
          :key="s.key"
          class="px-3 py-1 text-xs font-display tracking-widest transition-all duration-300 border"
          :class="
            clockStyle === s.key
              ? 'border-accent-amber text-accent-amber bg-bg-surface'
              : 'border-transparent text-text-dim hover:text-text-secondary'
          "
          @click="clockStyle = s.key"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- Main display area -->
    <div class="flex-1 flex flex-col items-center justify-center px-4 pb-8 w-full">
      <Transition name="mode-switch" mode="out-in" appear>
        <div :key="mode" class="w-full">
          <!-- CLOCK MODE -->
          <template v-if="mode === 'clock'">
            <Transition name="style-switch" mode="out-in">
              <DigitalClock
                v-if="clockStyle === 'digital'"
                key="digital"
                :hours="clockTime.h"
                :minutes="clockTime.m"
                :seconds="clockTime.s"
                :date="clockDate"
              />
              <AnalogClock
                v-else-if="clockStyle === 'analog'"
                key="analog"
                :hours="now.getHours()"
                :minutes="now.getMinutes()"
                :seconds="now.getSeconds()"
                :date="clockDate"
              />
              <FlipClock
                v-else-if="clockStyle === 'flip'"
                key="flip"
                :hours="clockTime.h"
                :minutes="clockTime.m"
                :seconds="clockTime.s"
                :date="clockDate"
              />
              <MinimalClock
                v-else-if="clockStyle === 'minimal'"
                key="minimal"
                :hours="clockTime.h"
                :minutes="clockTime.m"
                :seconds="clockTime.s"
                :date="clockDate"
              />
            </Transition>
          </template>

          <!-- STOPWATCH MODE -->
          <template v-if="mode === 'stopwatch'">
            <div class="text-center">
              <div class="font-display font-bold tracking-tight leading-none">
                <span
                  class="text-6xl min-[375px]:text-7xl sm:text-8xl md:text-9xl lg:text-[11rem]"
                  :class="stopwatchRunning ? 'text-accent-sky stopwatch-glow' : 'text-text-primary'"
                >
                  {{ stopwatchDisplay.h }}:{{ stopwatchDisplay.m }}:{{ stopwatchDisplay.s }}
                </span>
                <span class="text-3xl sm:text-4xl md:text-5xl text-text-dim ml-1"
                  >.{{ stopwatchDisplay.cs }}</span
                >
              </div>

              <div class="flex justify-center gap-3 mt-10">
                <button
                  class="border px-6 py-3 text-sm font-display tracking-wide transition-all duration-300"
                  :class="
                    stopwatchRunning
                      ? 'border-accent-amber text-accent-amber hover:bg-accent-amber/10'
                      : 'border-accent-sky text-accent-sky hover:bg-accent-sky/10'
                  "
                  @click="toggleStopwatch"
                >
                  {{ stopwatchRunning ? 'Tạm dừng' : stopwatchMs > 0 ? 'Tiếp tục' : 'Bắt đầu' }}
                </button>
                <button
                  v-if="stopwatchRunning"
                  class="border border-border-default text-text-secondary px-6 py-3 text-sm font-display tracking-wide transition hover:border-accent-sky hover:text-accent-sky"
                  @click="recordLap"
                >
                  Vòng
                </button>
                <button
                  v-if="stopwatchMs > 0 && !stopwatchRunning"
                  class="border border-border-default text-text-secondary px-6 py-3 text-sm font-display tracking-wide transition hover:border-accent-coral hover:text-accent-coral"
                  @click="resetStopwatch"
                >
                  Đặt lại
                </button>
              </div>

              <!-- Lap list -->
              <div v-if="stopwatchLaps.length > 0" class="mt-8 w-full max-w-sm mx-auto">
                <div class="flex items-center justify-between mb-3">
                  <div class="h-px flex-1 bg-border-default" />
                  <button
                    class="ml-3 text-xs font-display tracking-widest text-text-dim transition hover:text-accent-coral"
                    @click="clearLaps"
                  >
                    Xoá vòng
                  </button>
                </div>
                <div class="max-h-48 overflow-y-auto space-y-1 tick-scrollbar">
                  <div
                    v-for="(lap, i) in [...stopwatchLaps].reverse()"
                    :key="i"
                    class="flex justify-between px-3 py-1.5 text-sm font-display tracking-wide"
                    :class="i === 0 ? 'text-accent-sky' : 'text-text-dim'"
                  >
                    <span>Vòng {{ stopwatchLaps.length - i }}</span>
                    <span>{{ formatMs(lap).m }}:{{ formatMs(lap).s }}.{{ formatMs(lap).cs }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- COUNTDOWN MODE -->
          <template v-if="mode === 'countdown'">
            <div class="text-center">
              <!-- Input -->
              <div v-if="countdownEditing" class="flex items-center justify-center gap-3">
                <div class="flex flex-col items-center">
                  <label class="text-text-dim text-xs font-display tracking-widest mb-2"
                    >PHÚT</label
                  >
                  <input
                    v-model.number="countdownInputMin"
                    type="number"
                    min="0"
                    max="999"
                    class="w-24 sm:w-32 bg-bg-surface border border-border-default text-center text-text-primary font-display text-4xl sm:text-5xl py-3 focus:outline-none focus:border-accent-amber transition"
                  />
                </div>
                <span class="text-accent-amber font-display text-4xl sm:text-5xl font-bold mt-6"
                  >:</span
                >
                <div class="flex flex-col items-center">
                  <label class="text-text-dim text-xs font-display tracking-widest mb-2"
                    >GIÂY</label
                  >
                  <input
                    v-model.number="countdownInputSec"
                    type="number"
                    min="0"
                    max="59"
                    class="w-24 sm:w-32 bg-bg-surface border border-border-default text-center text-text-primary font-display text-4xl sm:text-5xl py-3 focus:outline-none focus:border-accent-amber transition"
                  />
                </div>
              </div>

              <!-- Running display -->
              <div v-else>
                <!-- Progress bar -->
                <div class="w-full max-w-md mx-auto h-1 bg-bg-surface mb-8">
                  <div
                    class="h-full bg-accent-amber transition-all duration-1000 ease-linear"
                    :style="{ width: countdownProgress + '%' }"
                  />
                </div>

                <div class="font-display font-bold tracking-tight leading-none">
                  <span
                    class="text-6xl min-[375px]:text-7xl sm:text-8xl md:text-9xl lg:text-[11rem]"
                    :class="countdownRemaining <= 0 ? 'text-accent-coral' : 'text-text-primary'"
                  >
                    {{ countdownDisplay.h }}:{{ countdownDisplay.m }}:{{ countdownDisplay.s }}
                  </span>
                </div>

                <p
                  v-if="countdownRemaining <= 0"
                  class="mt-4 text-accent-coral font-display tracking-widest text-sm animate-bounce-alert"
                >
                  HẾT GIỜ
                </p>
              </div>

              <div class="flex justify-center gap-3 mt-10">
                <button
                  class="border px-6 py-3 text-sm font-display tracking-wide transition-all duration-300"
                  :class="
                    countdownRunning
                      ? 'border-accent-coral text-accent-coral hover:bg-accent-coral/10'
                      : 'border-accent-amber text-accent-amber hover:bg-accent-amber/10'
                  "
                  @click="toggleCountdown"
                >
                  {{ countdownRunning ? 'Tạm dừng' : countdownEditing ? 'Bắt đầu' : 'Tiếp tục' }}
                </button>
                <button
                  v-if="!countdownEditing"
                  class="border border-border-default text-text-secondary px-6 py-3 text-sm font-display tracking-wide transition hover:border-accent-coral hover:text-accent-coral"
                  @click="resetCountdown"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </template>

          <!-- POMODORO MODE -->
          <template v-if="mode === 'pomodoro'">
            <div class="text-center">
              <!-- Phase selector -->
              <div class="flex justify-center gap-2 mb-8">
                <button
                  v-for="preset in pomodoroPresets"
                  :key="preset.phase"
                  class="px-4 py-2 text-sm font-display tracking-wide border transition-all duration-300"
                  :class="
                    pomodoroPhase === preset.phase
                      ? 'border-accent-coral text-accent-coral bg-bg-surface'
                      : 'border-border-default text-text-dim hover:text-text-secondary hover:border-border-default'
                  "
                  @click="selectPomodoro(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>

              <!-- Circular progress ring -->
              <div class="relative inline-flex items-center justify-center mb-6">
                <svg class="w-64 h-64 sm:w-80 sm:h-80 -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="text-bg-surface"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="butt"
                    class="text-accent-coral transition-all duration-1000 ease-linear"
                    :stroke-dasharray="565.48"
                    :stroke-dashoffset="565.48 - (565.48 * pomodoroProgress) / 100"
                  />
                </svg>
                <div class="absolute font-display font-bold">
                  <span class="text-5xl sm:text-6xl text-text-primary">
                    {{ pomodoroDisplay.m }}:{{ pomodoroDisplay.s }}
                  </span>
                  <p class="text-text-dim text-xs font-display tracking-widest mt-1">
                    {{ phaseLabel.toUpperCase() }}
                  </p>
                </div>
              </div>

              <!-- Sessions counter -->
              <p class="text-text-dim text-xs font-display tracking-widest mb-6">
                <span
                  class="text-accent-amber inline-block"
                  :class="{ 'session-pop': sessionPop }"
                  >{{ pomodoroSessions }}</span
                >
                phiên hoàn thành
              </p>

              <div class="flex justify-center gap-3">
                <button
                  class="border px-6 py-3 text-sm font-display tracking-wide transition-all duration-300"
                  :class="
                    pomodoroRunning
                      ? 'border-accent-amber text-accent-amber hover:bg-accent-amber/10'
                      : 'border-accent-coral text-accent-coral hover:bg-accent-coral/10'
                  "
                  @click="togglePomodoro"
                >
                  {{
                    pomodoroRunning
                      ? 'Tạm dừng'
                      : pomodoroRemaining < pomodoroTotal
                        ? 'Tiếp tục'
                        : 'Bắt đầu'
                  }}
                </button>
                <button
                  v-if="pomodoroRemaining < pomodoroTotal"
                  class="border border-border-default text-text-secondary px-6 py-3 text-sm font-display tracking-wide transition hover:border-accent-coral hover:text-accent-coral"
                  @click="resetPomodoro"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </template>

          <!-- WORLD CLOCK MODE -->
          <template v-if="mode === 'world'">
            <div class="text-center w-full mx-auto">
              <!-- City cards -->
              <div class="max-w-lg mx-auto">
                <div class="space-y-3 mb-8">
                  <div
                    v-for="city in selectedCities"
                    :key="city.timezone"
                    class="flex items-center justify-between border border-border-default bg-bg-surface px-5 py-4 transition-all duration-300 hover:border-accent-sky/40"
                  >
                    <div class="flex items-center gap-3 text-left">
                      <span class="text-xl">{{ city.flag }}</span>
                      <div>
                        <p class="text-text-primary font-display text-sm tracking-wide">
                          {{ city.label }}
                        </p>
                        <p class="text-text-dim text-xs font-display tracking-widest">
                          {{ worldDate(city.timezone) }} · {{ worldOffset(city.timezone) }}
                        </p>
                      </div>
                    </div>
                    <span
                      class="text-text-primary font-display font-bold text-2xl sm:text-3xl tracking-tight tabular-nums"
                    >
                      {{ worldTime(city.timezone) }}
                    </span>
                  </div>
                </div>

                <!-- Add/remove cities -->
                <button
                  class="border border-border-default text-text-secondary px-5 py-2.5 text-sm font-display tracking-wide transition-all duration-300 hover:border-accent-sky hover:text-accent-sky"
                  @click="showCityPicker = !showCityPicker"
                >
                  {{ showCityPicker ? 'Đóng' : 'Chọn thành phố' }}
                </button>

                <!-- City picker -->
                <Transition name="style-switch">
                  <div
                    v-if="showCityPicker"
                    class="mt-4 border border-border-default bg-bg-surface p-4"
                  >
                    <div
                      class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto tick-scrollbar"
                    >
                      <button
                        v-for="city in worldCityOptions"
                        :key="city.timezone"
                        class="flex items-center gap-2 px-3 py-2 text-sm font-display tracking-wide border transition-all duration-200"
                        :class="
                          isCitySelected(city)
                            ? 'border-accent-sky text-accent-sky bg-accent-sky/5'
                            : 'border-transparent text-text-dim hover:text-text-secondary'
                        "
                        @click="toggleCity(city)"
                      >
                        <span>{{ city.flag }}</span>
                        <span>{{ city.label }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </template>
        </div>
      </Transition>
    </div>

    <!-- Footer -->
    <div
      class="text-center py-4 text-text-dim text-xs font-display tracking-widest animate-fade-up animate-delay-3"
      :class="{ 'opacity-0 hover:opacity-100 transition-opacity duration-500': isFullscreen }"
    >
      <span class="text-accent-coral">//</span> Tick — bởi duckocancode
    </div>
  </div>
</template>

<style scoped>
/* ── Mode switch transition ── */
.mode-switch-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.mode-switch-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.mode-switch-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.mode-switch-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Clock style switch ── */
.style-switch-enter-active,
.style-switch-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.style-switch-enter-from {
  opacity: 0;
  transform: scale(0.96);
}
.style-switch-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* ── Button micro-interactions ── */
button {
  will-change: transform;
}
button:hover {
  transform: translateY(-1px);
}
button:active {
  transform: translateY(0) scale(0.97);
  transition-duration: 0.1s !important;
}

/* ── HẾT GIỜ bounce ── */
@keyframes bounce-alert {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.85;
  }
}
.animate-bounce-alert {
  animation: bounce-alert 0.8s ease-in-out infinite;
}

/* ── Stopwatch running glow ── */
@keyframes subtle-glow {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2);
  }
}
.stopwatch-glow {
  animation: subtle-glow 1.5s ease-in-out infinite;
}

/* ── Pomodoro session pop ── */
@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}
.session-pop {
  animation: pop 0.3s ease;
}

/* ── Custom scrollbar (design system) ── */
.tick-scrollbar::-webkit-scrollbar,
:deep(*)::-webkit-scrollbar {
  width: 4px;
}
.tick-scrollbar::-webkit-scrollbar-track,
:deep(*)::-webkit-scrollbar-track {
  background: #0f1923;
}
.tick-scrollbar::-webkit-scrollbar-thumb,
:deep(*)::-webkit-scrollbar-thumb {
  background: #253549;
  border-radius: 0;
}
.tick-scrollbar::-webkit-scrollbar-thumb:hover,
:deep(*)::-webkit-scrollbar-thumb:hover {
  background: #ff6b4a;
}

/* Firefox */
.tick-scrollbar,
:deep(*) {
  scrollbar-width: thin;
  scrollbar-color: #253549 #0f1923;
}
</style>
