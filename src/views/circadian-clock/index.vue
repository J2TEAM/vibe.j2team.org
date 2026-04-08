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
          Nhịp Sinh Học
        </h1>
        <p class="text-text-secondary text-sm mt-1">
          Biết lúc nào nên làm gì — dựa trên giờ thức dậy
        </p>
      </div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Trang chủ
      </RouterLink>
    </header>

    <!-- Wake Time Setting -->
    <div
      class="w-full max-w-2xl border border-border-default bg-bg-surface p-5 mb-6 animate-fade-up animate-delay-1"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Icon icon="lucide:alarm-clock" class="size-5 text-accent-amber" />
          <span class="font-display text-sm font-semibold">Giờ thức dậy:</span>
        </div>
        <input
          v-model="wakeTime"
          type="time"
          class="bg-bg-deep border border-border-default px-4 py-2 text-text-primary font-display text-lg font-bold text-center focus:outline-none focus:border-accent-amber transition-colors"
        />
      </div>
    </div>

    <!-- Current Phase Highlight -->
    <div
      v-if="currentPhase"
      class="w-full max-w-2xl border p-6 mb-6 animate-fade-up animate-delay-2"
      :style="{
        borderColor: currentPhase.color + '60',
        backgroundColor: currentPhase.color + '08',
      }"
    >
      <div class="flex items-center gap-3 mb-3">
        <Icon :icon="currentPhase.icon" class="size-6" :style="{ color: currentPhase.color }" />
        <div>
          <div class="font-display text-lg font-bold" :style="{ color: currentPhase.color }">
            {{ currentPhase.label }}
          </div>
          <div class="text-text-dim text-xs font-display tracking-wide">
            {{ formatPhaseTime(currentPhase) }} · ĐANG DIỄN RA
          </div>
        </div>
      </div>
      <p class="text-text-secondary text-sm mb-3">{{ currentPhase.description }}</p>
      <div class="flex items-center gap-2 text-xs text-text-dim mb-3">
        <Icon icon="lucide:flask-conical" class="size-3.5" />
        <span class="font-display">{{ currentPhase.hormone }}</span>
      </div>
      <div class="space-y-1.5">
        <div
          v-for="(tip, i) in currentPhase.tips"
          :key="i"
          class="flex gap-2 text-sm text-text-secondary"
        >
          <span :style="{ color: currentPhase.color }">▸</span>
          {{ tip }}
        </div>
      </div>
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
      <!-- Clock Tab -->
      <div v-if="activeTab === 'clock'">
        <!-- Circular Clock -->
        <div class="border border-border-default bg-bg-surface p-6 mb-4 flex justify-center">
          <div class="relative w-72 h-72 sm:w-80 sm:h-80">
            <canvas ref="clockCanvas" class="w-full h-full" />
          </div>
        </div>

        <!-- Phase Legend -->
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="phase in CIRCADIAN_PHASES"
            :key="phase.id"
            class="flex items-center gap-2 p-2 border border-border-default bg-bg-surface text-xs cursor-pointer transition-all"
            :class="selectedPhase?.id === phase.id ? 'outline outline-1' : 'hover:bg-bg-elevated'"
            :style="selectedPhase?.id === phase.id ? { outlineColor: phase.color } : {}"
            @click="selectedPhase = phase"
          >
            <div class="w-2.5 h-2.5 shrink-0" :style="{ backgroundColor: phase.color }" />
            <div>
              <span class="font-display font-semibold" :style="{ color: phase.color }">{{
                phase.label
              }}</span>
              <span class="text-text-dim ml-1.5">{{ formatPhaseTime(phase) }}</span>
            </div>
          </div>
        </div>

        <!-- Selected Phase Detail -->
        <div
          v-if="selectedPhase"
          class="mt-4 border p-5"
          :style="{
            borderColor: selectedPhase.color + '40',
            backgroundColor: selectedPhase.color + '08',
          }"
        >
          <div class="flex items-center gap-2 mb-2">
            <Icon
              :icon="selectedPhase.icon"
              class="size-5"
              :style="{ color: selectedPhase.color }"
            />
            <span class="font-display font-semibold" :style="{ color: selectedPhase.color }">
              {{ selectedPhase.label }}
            </span>
            <span class="text-text-dim text-xs ml-auto font-display">{{
              selectedPhase.hormone
            }}</span>
          </div>
          <p class="text-text-secondary text-sm mb-3">{{ selectedPhase.description }}</p>
          <div class="space-y-1">
            <div
              v-for="(tip, i) in selectedPhase.tips"
              :key="i"
              class="flex gap-2 text-sm text-text-secondary"
            >
              <span :style="{ color: selectedPhase.color }">▸</span>
              {{ tip }}
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Tab -->
      <div v-if="activeTab === 'timeline'">
        <div class="border border-border-default bg-bg-surface p-6">
          <div class="space-y-0">
            <div
              v-for="(phase, index) in CIRCADIAN_PHASES"
              :key="phase.id"
              class="flex gap-4 relative"
            >
              <!-- Timeline Line -->
              <div class="flex flex-col items-center w-8 shrink-0">
                <div class="w-3 h-3 z-10" :style="{ backgroundColor: phase.color }" />
                <div
                  v-if="index < CIRCADIAN_PHASES.length - 1"
                  class="w-px flex-1 min-h-16"
                  :style="{ backgroundColor: phase.color + '30' }"
                />
              </div>

              <!-- Content -->
              <div class="pb-6 flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <Icon :icon="phase.icon" class="size-4" :style="{ color: phase.color }" />
                  <span class="font-display text-sm font-semibold" :style="{ color: phase.color }">
                    {{ phase.label }}
                  </span>
                  <span class="text-text-dim text-xs font-display ml-auto">
                    {{ formatPhaseTime(phase) }}
                  </span>
                </div>
                <p class="text-text-secondary text-xs mb-1">{{ phase.description }}</p>
                <div class="text-text-dim text-xs flex items-center gap-1">
                  <Icon icon="lucide:flask-conical" class="size-3" />
                  {{ phase.hormone }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Score Tab -->
      <div v-if="activeTab === 'score'">
        <div class="border border-border-default bg-bg-surface p-6 mb-4">
          <h2 class="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="lucide:star" class="size-5 text-accent-amber" />
            Đánh giá tuân thủ hôm nay
          </h2>

          <div class="mb-4">
            <label class="text-text-dim text-xs font-display tracking-wide mb-2 block">
              MỨC ĐỘ TUÂN THỦ (1-10):
            </label>
            <div class="flex gap-2">
              <button
                v-for="n in 10"
                :key="n"
                class="w-8 h-8 border font-display text-sm font-bold transition-all"
                :class="
                  todayScore === n
                    ? 'border-accent-amber bg-accent-amber text-bg-deep'
                    : 'border-border-default text-text-dim hover:border-accent-amber hover:text-accent-amber'
                "
                @click="todayScore = n"
              >
                {{ n }}
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="text-text-dim text-xs font-display tracking-wide mb-1.5 block"
              >GHI CHÚ:</label
            >
            <textarea
              v-model="todayNotes"
              rows="2"
              placeholder="Hôm nay bạn tuân thủ nhịp sinh học thế nào?"
              class="w-full bg-bg-deep border border-border-default px-3 py-2.5 text-text-primary text-sm resize-none focus:outline-none focus:border-accent-amber transition-colors placeholder:text-text-dim/50"
            />
          </div>

          <button
            class="w-full py-3 font-display font-semibold tracking-wide text-sm transition-all"
            :class="
              todayScore > 0
                ? 'bg-accent-amber text-bg-deep hover:bg-accent-amber/90'
                : 'bg-bg-elevated text-text-dim cursor-not-allowed'
            "
            :disabled="todayScore === 0"
            @click="saveScore"
          >
            LƯU ĐÁNH GIÁ
          </button>
        </div>

        <!-- History -->
        <div class="border border-border-default bg-bg-surface p-6">
          <h2 class="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Icon icon="lucide:history" class="size-5 text-accent-sky" />
            Lịch sử tuần qua
          </h2>

          <div v-if="recentScores.length > 0" class="space-y-2">
            <div
              v-for="score in recentScores"
              :key="score.date"
              class="flex items-center gap-4 p-3 border border-border-default bg-bg-deep"
            >
              <span class="text-xs text-text-dim font-display w-24">
                {{ score.date.split('-').reverse().join('/') }}
              </span>
              <div class="flex gap-0.5 flex-1">
                <div
                  v-for="n in 10"
                  :key="n"
                  class="h-4 flex-1"
                  :style="{
                    backgroundColor: n <= score.score ? getScoreColor(score.score) : '#253549',
                  }"
                />
              </div>
              <span
                class="font-display font-bold text-sm w-6 text-right"
                :style="{ color: getScoreColor(score.score) }"
              >
                {{ score.score }}
              </span>
            </div>

            <div class="text-center pt-2">
              <span class="text-text-dim text-xs font-display">
                Trung bình:
                <span class="text-accent-amber font-bold">
                  {{ avgScore }}
                </span>
                / 10
              </span>
            </div>
          </div>
          <p v-else class="text-text-dim text-sm text-center py-8">
            Chưa có đánh giá — hãy bắt đầu theo dõi!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useIntervalFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { CIRCADIAN_PHASES } from './types'
import type { CircadianPhase, DailyScore } from './types'

// === Wake Time ===
const wakeTime = useLocalStorage('circadian-wake-time', '06:30')

function getWakeDate(): Date {
  const [h, m] = wakeTime.value.split(':').map(Number)
  const d = new Date()
  d.setHours(h!, m!, 0, 0)
  return d
}

function getPhaseStartTime(phase: CircadianPhase): Date {
  const wake = getWakeDate()
  const start = new Date(wake.getTime() + phase.offsetHours * 60 * 60 * 1000)
  return start
}

function getPhaseEndTime(phase: CircadianPhase): Date {
  const start = getPhaseStartTime(phase)
  return new Date(start.getTime() + phase.durationHours * 60 * 60 * 1000)
}

function formatPhaseTime(phase: CircadianPhase): string {
  const start = getPhaseStartTime(phase)
  const end = getPhaseEndTime(phase)
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}`
}

// === Current Phase ===
const now = ref(new Date())
useIntervalFn(() => {
  now.value = new Date()
}, 60000)

const currentPhase = computed(() => {
  const currentMs = now.value.getTime()
  for (const phase of CIRCADIAN_PHASES) {
    const start = getPhaseStartTime(phase)
    const end = getPhaseEndTime(phase)
    if (currentMs >= start.getTime() && currentMs < end.getTime()) {
      return phase
    }
  }
  return null
})

// === Tabs ===
const tabs = [
  { id: 'clock' as const, label: 'Đồng hồ', icon: 'lucide:clock' },
  { id: 'timeline' as const, label: 'Timeline', icon: 'lucide:list' },
  { id: 'score' as const, label: 'Đánh giá', icon: 'lucide:star' },
]
type TabId = 'clock' | 'timeline' | 'score'
const activeTab = ref<TabId>('clock')

const selectedPhase = ref<CircadianPhase | null>(null)

// === Circular Clock ===
const clockCanvas = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function drawClock() {
  const canvas = clockCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height
  const cx = w / 2
  const cy = h / 2
  const outerR = Math.min(cx, cy) - 10
  const innerR = outerR * 0.55

  ctx.clearRect(0, 0, w, h)

  // Draw phase arcs
  for (const phase of CIRCADIAN_PHASES) {
    const startAngle = hoursToAngle(phase.offsetHours)
    const endAngle = hoursToAngle(phase.offsetHours + phase.durationHours)

    ctx.beginPath()
    ctx.arc(cx, cy, outerR, startAngle, endAngle)
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
    ctx.closePath()

    const isCurrentPhase = currentPhase.value?.id === phase.id
    ctx.fillStyle = phase.color + (isCurrentPhase ? '60' : '25')
    ctx.fill()

    ctx.strokeStyle = phase.color + '40'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // Hour markers
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2
    const isWakeHour = i === Number(wakeTime.value.split(':')[0])

    const r1 = outerR + 2
    const r2 = outerR + (i % 6 === 0 ? 12 : 6)
    const x1 = cx + Math.cos(angle) * r1
    const y1 = cy + Math.sin(angle) * r1
    const x2 = cx + Math.cos(angle) * r2
    const y2 = cy + Math.sin(angle) * r2

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = isWakeHour ? '#FFB830' : '#4A6180'
    ctx.lineWidth = isWakeHour ? 2 : 1
    ctx.stroke()

    if (i % 3 === 0) {
      const labelR = outerR + 20
      const lx = cx + Math.cos(angle) * labelR
      const ly = cy + Math.sin(angle) * labelR
      ctx.fillStyle = isWakeHour ? '#FFB830' : '#8B9DB5'
      ctx.font = `${isWakeHour ? 'bold ' : ''}10px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(i).padStart(2, '0'), lx, ly)
    }
  }

  // Current time hand
  const nowDate = now.value
  const currentHour = nowDate.getHours() + nowDate.getMinutes() / 60
  const handAngle = (currentHour / 24) * Math.PI * 2 - Math.PI / 2
  const handR = outerR - 5

  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(handAngle) * handR, cy + Math.sin(handAngle) * handR)
  ctx.strokeStyle = '#F0EDE6'
  ctx.lineWidth = 2
  ctx.stroke()

  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fillStyle = '#F0EDE6'
  ctx.fill()

  // Center time
  ctx.fillStyle = '#F0EDE6'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const timeStr = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`
  ctx.fillText(timeStr, cx, cy + 25)
}

function hoursToAngle(offsetHours: number): number {
  const wake = getWakeDate()
  const actualHour = (wake.getHours() + wake.getMinutes() / 60 + offsetHours) % 24
  return (actualHour / 24) * Math.PI * 2 - Math.PI / 2
}

watch([wakeTime, now, activeTab], () => {
  if (activeTab.value === 'clock') {
    nextTick(() => drawClock())
  }
})

watch(clockCanvas, (canvas) => {
  if (canvas) {
    resizeObserver = new ResizeObserver(() => drawClock())
    resizeObserver.observe(canvas)
    nextTick(() => drawClock())
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// === Score Tab ===
const scores = useLocalStorage<DailyScore[]>('circadian-scores', [])
const todayScore = ref(0)
const todayNotes = ref('')

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function saveScore() {
  if (todayScore.value === 0) return
  const today = getToday()
  const existing = scores.value.findIndex((s) => s.date === today)
  const entry: DailyScore = { date: today, score: todayScore.value, notes: todayNotes.value }
  if (existing >= 0) {
    scores.value[existing] = entry
  } else {
    scores.value.push(entry)
  }
  scores.value = [...scores.value]
}

const recentScores = computed(() => {
  return [...scores.value].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
})

const avgScore = computed(() => {
  if (recentScores.value.length === 0) return 0
  const sum = recentScores.value.reduce((s, r) => s + r.score, 0)
  return (sum / recentScores.value.length).toFixed(1)
})

function getScoreColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 5) return '#FFB830'
  return '#FF6B4A'
}
</script>
