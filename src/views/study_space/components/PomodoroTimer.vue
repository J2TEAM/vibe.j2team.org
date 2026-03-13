<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

type TimerMode = 'focus' | 'short-break' | 'long-break'

// --- Pomodoro custom settings ---
const pomodoroSettings = useLocalStorage('study-space-pomodoro-settings', {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  alertVolume: 60, // 0–100
})

const modeConfigs = computed(() => ({
  focus: {
    label: 'Tập trung',
    minutes: pomodoroSettings.value.focusMinutes,
    color: 'text-accent-coral',
    hex: '#FF6B4A',
  },
  'short-break': {
    label: 'Nghỉ ngắn',
    minutes: pomodoroSettings.value.shortBreakMinutes,
    color: 'text-accent-sky',
    hex: '#38BDF8',
  },
  'long-break': {
    label: 'Nghỉ dài',
    minutes: pomodoroSettings.value.longBreakMinutes,
    color: 'text-accent-amber',
    hex: '#FFB830',
  },
}))

// --- Timer state ---
const isExpanded = ref(false)
const showSettings = ref(false)
const currentMode = ref<TimerMode>('focus')
const isRunning = ref(false)
const secondsLeft = ref(pomodoroSettings.value.focusMinutes * 60)
const completedPomodoros = useLocalStorage('study-space-pomodoros', 0)

const currentModeConfig = computed(() => modeConfigs.value[currentMode.value])

const displayTime = computed(() => {
  const mins = Math.floor(secondsLeft.value / 60)
  const secs = secondsLeft.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const progress = computed(() => {
  const total = currentModeConfig.value.minutes * 60
  if (total === 0) return 0
  return ((total - secondsLeft.value) / total) * 100
})

const circumference = 2 * Math.PI * 45

// Update secondsLeft when settings change (if timer not running)
watch(
  () => [
    pomodoroSettings.value.focusMinutes,
    pomodoroSettings.value.shortBreakMinutes,
    pomodoroSettings.value.longBreakMinutes,
  ],
  () => {
    if (!isRunning.value) {
      secondsLeft.value = currentModeConfig.value.minutes * 60
    }
  },
)

const { pause, resume } = useIntervalFn(
  () => {
    if (secondsLeft.value > 0) {
      secondsLeft.value--
    } else {
      handleTimerEnd()
    }
  },
  1000,
  { immediate: false },
)

function playAlert() {
  const volume = pomodoroSettings.value.alertVolume / 100
  if (volume === 0) return
  try {
    const ctx = new AudioContext()
    // Two-tone beep pattern
    const times = [0, 0.4, 0.8]
    times.forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = t === 0 ? 880 : 660
      gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.35)
    })
  } catch {
    // AudioContext not available
  }
}

function handleTimerEnd() {
  pause()
  isRunning.value = false
  playAlert()

  if (currentMode.value === 'focus') {
    completedPomodoros.value++
    switchMode(completedPomodoros.value % 4 === 0 ? 'long-break' : 'short-break')
  } else {
    switchMode('focus')
  }
}

function toggleTimer() {
  if (isRunning.value) {
    pause()
    isRunning.value = false
  } else {
    resume()
    isRunning.value = true
  }
}

function switchMode(mode: TimerMode) {
  pause()
  isRunning.value = false
  currentMode.value = mode
  secondsLeft.value = modeConfigs.value[mode].minutes * 60
}

function resetTimer() {
  pause()
  isRunning.value = false
  secondsLeft.value = currentModeConfig.value.minutes * 60
}

// Clamp minute inputs to valid range
function clampMinutes(
  key: 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes',
  min: number,
  max: number,
) {
  const val = pomodoroSettings.value[key]
  if (val < min) pomodoroSettings.value[key] = min
  if (val > max) pomodoroSettings.value[key] = max
}
</script>

<template>
  <div class="fixed right-4 top-4 z-50">
    <!-- Mini display -->
    <button
      v-if="!isExpanded"
      class="flex items-center gap-2 border border-white/20 bg-black/50 px-4 py-2.5 text-white/80 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
      @click="isExpanded = true"
    >
      <Icon
        icon="lucide:timer"
        class="size-5"
        :class="{ 'animate-pulse text-accent-coral': isRunning }"
      />
      <span class="font-display text-sm font-semibold tabular-nums tracking-wide">{{
        displayTime
      }}</span>
    </button>

    <!-- Expanded Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-4 scale-95"
    >
      <div v-if="isExpanded" class="w-72 border border-white/20 bg-black/70 backdrop-blur-xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 class="font-display text-sm font-semibold tracking-wide text-white">
            <Icon icon="lucide:timer" class="mr-1.5 inline size-4" />
            Pomodoro
          </h3>
          <div class="flex items-center gap-1">
            <button
              class="p-1 transition"
              :class="showSettings ? 'text-accent-sky' : 'text-white/40 hover:text-white'"
              title="Cài đặt Pomodoro"
              @click="showSettings = !showSettings"
            >
              <Icon icon="lucide:settings-2" class="size-4" />
            </button>
            <button
              class="p-1 text-white/40 transition hover:text-white"
              @click="isExpanded = false"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>
        </div>

        <!-- ─── TIMER VIEW ─── -->
        <div v-if="!showSettings">
          <!-- Mode Tabs -->
          <div class="flex border-b border-white/10">
            <button
              v-for="(config, mode) in modeConfigs"
              :key="mode"
              class="flex-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-all"
              :class="
                currentMode === mode
                  ? `${config.color} border-b-2 border-current bg-white/5`
                  : 'text-white/40 hover:text-white/70'
              "
              @click="switchMode(mode as TimerMode)"
            >
              {{ config.label }}
            </button>
          </div>

          <!-- Timer Circle -->
          <div class="flex flex-col items-center py-6">
            <div class="relative size-36">
              <svg class="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  stroke-width="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  :stroke="currentModeConfig.hex"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="circumference - (progress / 100) * circumference"
                  class="transition-all duration-1000"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-display text-3xl font-bold tabular-nums text-white">{{
                  displayTime
                }}</span>
                <span
                  class="text-[10px] uppercase tracking-widest"
                  :class="currentModeConfig.color"
                >
                  {{ currentModeConfig.label }}
                </span>
              </div>
            </div>

            <!-- Controls -->
            <div class="mt-4 flex items-center gap-4">
              <button
                class="text-white/50 transition hover:text-white"
                title="Đặt lại"
                @click="resetTimer"
              >
                <Icon icon="lucide:rotate-ccw" class="size-5" />
              </button>
              <button
                class="flex size-12 items-center justify-center border text-white transition-all"
                :class="
                  isRunning
                    ? 'border-accent-coral bg-accent-coral/20'
                    : 'border-white/20 hover:border-white/40'
                "
                @click="toggleTimer"
              >
                <Icon :icon="isRunning ? 'lucide:pause' : 'lucide:play'" class="size-6" />
              </button>
              <button
                class="text-white/50 transition hover:text-white"
                title="Bỏ qua"
                @click="switchMode(currentMode === 'focus' ? 'short-break' : 'focus')"
              >
                <Icon icon="lucide:skip-forward" class="size-5" />
              </button>
            </div>

            <!-- Completed count -->
            <div class="mt-4 flex items-center gap-1.5 text-xs text-white/40">
              <Icon icon="lucide:flame" class="size-3.5 text-accent-coral" />
              <span>{{ completedPomodoros }} phiên hoàn thành</span>
              <button
                class="ml-1 text-white/20 transition hover:text-white/50"
                title="Đặt lại số phiên"
                @click="completedPomodoros = 0"
              >
                <Icon icon="lucide:rotate-ccw" class="size-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- ─── SETTINGS VIEW ─── -->
        <div v-else class="p-4">
          <div class="mb-4 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Tùy chỉnh thời gian
          </div>

          <div class="space-y-3">
            <!-- Focus -->
            <div class="flex items-center justify-between gap-3">
              <label class="flex items-center gap-2 text-sm text-white/70">
                <span class="inline-block size-2 rounded-full bg-accent-coral" />
                Tập trung
              </label>
              <div class="flex items-center gap-1.5">
                <input
                  v-model.number="pomodoroSettings.focusMinutes"
                  type="number"
                  min="1"
                  max="60"
                  class="w-14 border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white tabular-nums outline-none transition focus:border-accent-coral"
                  @blur="clampMinutes('focusMinutes', 1, 60)"
                />
                <span class="text-xs text-white/30">phút</span>
              </div>
            </div>

            <!-- Short break -->
            <div class="flex items-center justify-between gap-3">
              <label class="flex items-center gap-2 text-sm text-white/70">
                <span class="inline-block size-2 rounded-full bg-accent-sky" />
                Nghỉ ngắn
              </label>
              <div class="flex items-center gap-1.5">
                <input
                  v-model.number="pomodoroSettings.shortBreakMinutes"
                  type="number"
                  min="1"
                  max="30"
                  class="w-14 border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white tabular-nums outline-none transition focus:border-accent-sky"
                  @blur="clampMinutes('shortBreakMinutes', 1, 30)"
                />
                <span class="text-xs text-white/30">phút</span>
              </div>
            </div>

            <!-- Long break -->
            <div class="flex items-center justify-between gap-3">
              <label class="flex items-center gap-2 text-sm text-white/70">
                <span class="inline-block size-2 rounded-full bg-accent-amber" />
                Nghỉ dài
              </label>
              <div class="flex items-center gap-1.5">
                <input
                  v-model.number="pomodoroSettings.longBreakMinutes"
                  type="number"
                  min="1"
                  max="60"
                  class="w-14 border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white tabular-nums outline-none transition focus:border-accent-amber"
                  @blur="clampMinutes('longBreakMinutes', 1, 60)"
                />
                <span class="text-xs text-white/30">phút</span>
              </div>
            </div>
          </div>

          <!-- Alert Volume -->
          <div class="mt-5 border-t border-white/10 pt-4">
            <div class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Âm thanh thông báo
            </div>
            <div class="flex items-center gap-2">
              <Icon
                :icon="pomodoroSettings.alertVolume === 0 ? 'lucide:volume-x' : 'lucide:volume-2'"
                class="size-4 shrink-0 text-white/40"
              />
              <input
                v-model.number="pomodoroSettings.alertVolume"
                type="range"
                min="0"
                max="100"
                class="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-accent-coral [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-coral"
              />
              <span class="w-7 text-right text-xs tabular-nums text-white/40">{{
                pomodoroSettings.alertVolume
              }}</span>
            </div>
            <!-- Test sound button -->
            <button
              class="mt-2 flex w-full items-center justify-center gap-1.5 border border-white/10 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white/70"
              @click="playAlert"
            >
              <Icon icon="lucide:bell" class="size-3.5" />
              Nghe thử âm báo
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
