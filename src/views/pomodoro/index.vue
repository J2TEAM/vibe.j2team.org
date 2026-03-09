<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useTimer } from './useTimer'
import { useStats } from './useStats'

const showSettings = ref(false)
const soundEnabled = ref(true)

const { recordPomodoro, todayPomodoros, todayFocusMinutes, streak, weeklyData, weeklyMax } =
  useStats()

let audioCtx: AudioContext | null = null

function playSound() {
  if (!soundEnabled.value) return
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const oscillator = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    oscillator.connect(gain)
    gain.connect(audioCtx.destination)
    oscillator.frequency.value = 830
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8)
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.8)
  } catch {
    /* audio not supported */
  }
}

function notifyUser(title: string) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(title, { icon: '🍅', body: 'Pomodoro Focus — vibe.j2team.org' })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}

const {
  config,
  mode,
  completedRounds,
  isRunning,
  isPaused,
  progress,
  displayMinutes,
  displaySeconds,
  start,
  pause,
  resume,
  skip,
  reset,
  switchMode,
  updateConfig,
} = useTimer((completedMode) => {
  playSound()
  if (completedMode === 'focus') {
    recordPomodoro(config.value.focus)
    notifyUser('🎉 Hoàn thành! Nghỉ ngơi thôi.')
  } else {
    notifyUser('⏰ Hết giờ nghỉ! Tập trung tiếp nào.')
  }
})

const modeLabels: Record<string, string> = {
  focus: 'Tập trung',
  'short-break': 'Nghỉ ngắn',
  'long-break': 'Nghỉ dài',
}

const modeColors: Record<string, string> = {
  focus: 'var(--color-accent-coral)',
  'short-break': 'var(--color-accent-sky)',
  'long-break': 'var(--color-accent-amber)',
}

const RING_RADIUS = 120
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const settingsFocus = ref(config.value.focus)
const settingsShortBreak = ref(config.value.shortBreak)
const settingsLongBreak = ref(config.value.longBreak)

function applySettings() {
  updateConfig({
    focus: settingsFocus.value,
    shortBreak: settingsShortBreak.value,
    longBreak: settingsLongBreak.value,
  })
  showSettings.value = false
}

function formatFocusTime(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return days[date.getDay()] ?? ''
}

watch(mode, () => {
  if (!isRunning.value) {
    reset()
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header
      class="flex items-center justify-between px-4 sm:px-6 py-4 max-w-2xl w-full mx-auto animate-fade-up"
    >
      <h1
        class="font-display text-lg sm:text-xl font-bold text-accent-coral flex items-center gap-2"
      >
        🍅 Pomodoro Focus
      </h1>
      <div class="flex items-center gap-3">
        <button
          class="w-9 h-9 flex items-center justify-center border border-border-default bg-bg-surface text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          title="Cài đặt"
          @click="showSettings = !showSettings"
        >
          ⚙
        </button>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          ← Về trang chủ
        </RouterLink>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 flex flex-col items-center justify-center px-4 pb-8">
      <!-- Mode tabs -->
      <div
        class="flex gap-1 p-1 border border-border-default bg-bg-surface mb-8 animate-fade-up animate-delay-1"
      >
        <button
          v-for="m in ['focus', 'short-break', 'long-break'] as const"
          :key="m"
          class="px-4 py-2 text-sm font-display font-semibold transition-all duration-200"
          :class="
            mode === m
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-dim hover:text-text-secondary'
          "
          :style="mode === m ? `color: ${modeColors[m]}` : undefined"
          @click="switchMode(m)"
        >
          {{ modeLabels[m] }}
        </button>
      </div>

      <!-- Timer ring -->
      <div class="relative w-64 h-64 sm:w-72 sm:h-72 mb-8 animate-fade-up animate-delay-2">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 260 260">
          <!-- Background ring -->
          <circle
            cx="130"
            cy="130"
            :r="RING_RADIUS"
            fill="none"
            stroke="var(--color-border-default)"
            stroke-width="6"
          />
          <!-- Progress ring -->
          <circle
            cx="130"
            cy="130"
            :r="RING_RADIUS"
            fill="none"
            :stroke="modeColors[mode]"
            stroke-width="6"
            stroke-linecap="butt"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="RING_CIRCUMFERENCE * (1 - progress)"
            class="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <!-- Center time display -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span
            class="font-display text-5xl sm:text-6xl font-bold tracking-tight tabular-nums"
            :class="{ 'timer-breathing': isRunning && !isPaused }"
          >
            {{ displayMinutes }}:{{ displaySeconds }}
          </span>
          <span
            class="font-display text-xs tracking-widest mt-2 uppercase"
            :style="`color: ${modeColors[mode]}`"
          >
            {{ modeLabels[mode] }}
          </span>
        </div>
      </div>

      <!-- Round indicators -->
      <div class="flex gap-2 mb-6 animate-fade-up animate-delay-3">
        <span
          v-for="n in 4"
          :key="n"
          class="w-3 h-3 border transition-colors duration-300"
          :class="
            n <= completedRounds % 4
              ? 'bg-accent-coral border-accent-coral'
              : 'border-border-default bg-transparent'
          "
        />
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3 animate-fade-up animate-delay-4">
        <template v-if="!isRunning">
          <button
            class="px-8 py-3 font-display font-bold text-sm tracking-wider uppercase border border-accent-coral text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
            @click="start"
          >
            Bắt đầu
          </button>
        </template>
        <template v-else>
          <button
            v-if="!isPaused"
            class="px-6 py-3 font-display font-bold text-sm tracking-wider uppercase border border-border-default text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="pause"
          >
            Tạm dừng
          </button>
          <button
            v-else
            class="px-6 py-3 font-display font-bold text-sm tracking-wider uppercase border border-accent-coral text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
            @click="resume"
          >
            Tiếp tục
          </button>
          <button
            class="px-6 py-3 font-display font-bold text-sm tracking-wider uppercase border border-border-default text-text-dim transition hover:border-accent-amber hover:text-accent-amber"
            @click="skip"
          >
            Bỏ qua
          </button>
        </template>
      </div>

      <!-- Settings panel -->
      <Transition name="settings">
        <div
          v-if="showSettings"
          class="mt-8 w-full max-w-sm border border-border-default bg-bg-surface p-5 animate-fade-up"
        >
          <h3
            class="font-display text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"
          >
            <span class="text-accent-amber text-xs tracking-widest">//</span>
            Cài đặt
          </h3>

          <div class="space-y-3">
            <label class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">Tập trung (phút)</span>
              <input
                v-model.number="settingsFocus"
                type="number"
                min="1"
                max="90"
                class="w-16 bg-bg-elevated border border-border-default px-2 py-1 text-center text-text-primary text-sm focus:border-accent-coral focus:outline-none"
              />
            </label>
            <label class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">Nghỉ ngắn (phút)</span>
              <input
                v-model.number="settingsShortBreak"
                type="number"
                min="1"
                max="30"
                class="w-16 bg-bg-elevated border border-border-default px-2 py-1 text-center text-text-primary text-sm focus:border-accent-coral focus:outline-none"
              />
            </label>
            <label class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">Nghỉ dài (phút)</span>
              <input
                v-model.number="settingsLongBreak"
                type="number"
                min="1"
                max="60"
                class="w-16 bg-bg-elevated border border-border-default px-2 py-1 text-center text-text-primary text-sm focus:border-accent-coral focus:outline-none"
              />
            </label>
            <label class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">Âm thanh</span>
              <button
                class="w-16 py-1 border text-center text-sm font-display font-semibold transition"
                :class="
                  soundEnabled
                    ? 'border-accent-coral text-accent-coral'
                    : 'border-border-default text-text-dim'
                "
                @click="soundEnabled = !soundEnabled"
              >
                {{ soundEnabled ? 'Bật' : 'Tắt' }}
              </button>
            </label>
          </div>

          <button
            class="mt-4 w-full py-2 font-display font-bold text-sm tracking-wider uppercase border border-accent-coral text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
            @click="applySettings"
          >
            Áp dụng
          </button>
        </div>
      </Transition>

      <!-- Stats section -->
      <section class="mt-10 w-full max-w-sm animate-fade-up animate-delay-5">
        <h3
          class="font-display text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"
        >
          <span class="text-accent-sky text-xs tracking-widest">//</span>
          Thống kê
        </h3>

        <!-- Today stats -->
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="border border-border-default bg-bg-surface p-3 text-center">
            <div class="font-display text-2xl font-bold text-accent-coral">
              {{ todayPomodoros }}
            </div>
            <div class="text-xs text-text-dim mt-1">pomodoro</div>
          </div>
          <div class="border border-border-default bg-bg-surface p-3 text-center">
            <div class="font-display text-2xl font-bold text-accent-amber">
              {{ formatFocusTime(todayFocusMinutes) }}
            </div>
            <div class="text-xs text-text-dim mt-1">tập trung</div>
          </div>
          <div class="border border-border-default bg-bg-surface p-3 text-center">
            <div class="font-display text-2xl font-bold text-accent-sky">
              {{ streak }}
            </div>
            <div class="text-xs text-text-dim mt-1">ngày liên tiếp</div>
          </div>
        </div>

        <!-- Weekly chart -->
        <div class="border border-border-default bg-bg-surface p-4">
          <div class="text-xs text-text-dim font-display tracking-wider mb-3">7 NGÀY GẦN NHẤT</div>
          <div class="flex items-end justify-between gap-1.5 h-20">
            <div
              v-for="day in weeklyData"
              :key="day.date"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <div class="w-full relative flex items-end justify-center h-14">
                <div
                  class="w-full max-w-[20px] transition-all duration-500"
                  :class="day.pomodoros > 0 ? 'bg-accent-coral' : 'bg-border-default'"
                  :style="{
                    height: `${Math.max((day.pomodoros / weeklyMax) * 100, 8)}%`,
                  }"
                />
              </div>
              <span class="text-[10px] text-text-dim font-display">
                {{ getDayLabel(day.date) }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="text-center py-4 text-xs text-text-dim animate-fade-up animate-delay-6">
      Được tạo bởi
      <span class="text-accent-coral font-display font-semibold">ĐAN</span>
      cho
      <RouterLink to="/" class="text-accent-sky link-underline">vibe.j2team.org</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.timer-breathing {
  animation: breathing 4s ease-in-out infinite;
}

@keyframes breathing {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.settings-enter-active,
.settings-leave-active {
  transition: all 0.3s ease;
}

.settings-enter-from,
.settings-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
