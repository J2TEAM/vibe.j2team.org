<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  incidents,
  maxRoundsByMode,
  randomEventChanceByMode,
  randomEvents,
  severityPressureByLevel,
  tacticalEdges,
  tacticalNodes,
} from './data'
import { buildShareText, openShareCard, PUBLIC_SHARE_URL } from './share'
import type { ChaosAlert, Choice, GameMode, Incident, Metrics, RandomEvent, RoundLog, Severity, SharePayload, TacticalEdge, TacticalNode } from './types'

const fallbackIncident: Incident = incidents[0] as Incident
const mode = ref<GameMode>('normal')
const round = ref<number>(1)
const deck = ref<Incident[]>([])
const logs = ref<RoundLog[]>([])
const streak = ref<number>(0)
const telemetryTick = ref<number>(0)
const missionClockSeconds = ref<number>(0)
const chaosAlerts = ref<ChaosAlert[]>([])
const activeRandomEvent = ref<RandomEvent | null>(null)
const showRandomEvent = ref<boolean>(false)
const lastChaosThreshold = ref<number>(0)
const bestScore = ref<number>(0)
const shareResultNotice = ref<string>('')
const playerAlias = ref<string>('')
const recentRandomEventIds = ref<string[]>([])

const playerAliasStorageKey = 'bug-war-room-player-alias'
const shareDraftStorageKey = 'bug-war-room-share-draft'
const shareDraftAtStorageKey = 'bug-war-room-share-draft-at'

let alertIdCounter = 0
let timerHandle: ReturnType<typeof setInterval> | undefined

const metrics = ref<Metrics>({
  stability: 70,
  trust: 66,
  energy: 72,
  timeLeft: 110,
  chaos: 28,
})

function randomizeDeck(): Incident[] {
  const shuffled = [...incidents].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, maxRoundsByMode[mode.value])
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function pushAlert(message: string, level: ChaosAlert['level']): void {
  alertIdCounter += 1
  const alert: ChaosAlert = { id: alertIdCounter, message, level }
  chaosAlerts.value = [alert, ...chaosAlerts.value].slice(0, 5)

  const capturedId = alert.id
  setTimeout(() => {
    chaosAlerts.value = chaosAlerts.value.filter((a) => a.id !== capturedId)
  }, 5000)
}

function pickWeightedRandomEvent(pool: RandomEvent[]): RandomEvent | undefined {
  const weighted = pool.flatMap((event) => {
    const weight = event.weight ?? 3
    return Array.from({ length: weight }, () => event)
  })

  return weighted[Math.floor(Math.random() * weighted.length)]
}

function tryRandomEvent(): void {
  const chance = randomEventChanceByMode[mode.value]
  if (Math.random() > chance) {
    return
  }

  const pool = randomEvents.filter((event) => {
    if (event.id === activeRandomEvent.value?.id) {
      return false
    }

    return !recentRandomEventIds.value.includes(event.id)
  })

  const picked = pickWeightedRandomEvent(pool)
  if (!picked) {
    return
  }

  activeRandomEvent.value = picked
  showRandomEvent.value = true
}

function dismissRandomEvent(): void {
  if (!activeRandomEvent.value) {
    return
  }

  const event = activeRandomEvent.value
  metrics.value = {
    stability: clamp(metrics.value.stability + event.effect.stability),
    trust: clamp(metrics.value.trust + event.effect.trust),
    energy: clamp(metrics.value.energy + event.effect.energy),
    timeLeft: Math.max(0, metrics.value.timeLeft + event.effect.minutes),
    chaos: clamp(metrics.value.chaos + event.effect.chaos),
  }

  missionClockSeconds.value = metrics.value.timeLeft * 60
  logs.value = [
    {
      incident: `⚡ ${event.title}`,
      severity: event.severity,
      action: 'Random Event',
      note: event.description,
      impact: 'Sự cố phụ',
    },
    ...logs.value,
  ]

  recentRandomEventIds.value = [event.id, ...recentRandomEventIds.value].slice(0, 3)
  pushAlert(`Sự cố phụ: ${event.title}`, 'warning')

  activeRandomEvent.value = null
  showRandomEvent.value = false
}

function resetGame(): void {
  deck.value = randomizeDeck()
  round.value = 1
  streak.value = 0
  logs.value = []
  chaosAlerts.value = []
  activeRandomEvent.value = null
  showRandomEvent.value = false
  lastChaosThreshold.value = 0
  recentRandomEventIds.value = []

  const baseTime = mode.value === 'hardcore' ? 92 : 112
  const baseEnergy = mode.value === 'hardcore' ? 62 : 70

  metrics.value = {
    stability: 70,
    trust: 66,
    energy: baseEnergy,
    timeLeft: baseTime,
    chaos: mode.value === 'hardcore' ? 36 : 28,
  }

  missionClockSeconds.value = baseTime * 60
}

function severityPressure(severity: Severity): number {
  return severityPressureByLevel[severity]
}

function impactLabel(choice: Choice): string {
  const total = choice.effect.stability + choice.effect.trust + choice.effect.energy - choice.effect.chaos
  if (total >= 25) {
    return 'Xuất sắc'
  }

  if (total >= 10) {
    return 'Ổn định'
  }

  if (total >= 0) {
    return 'Tạm ổn'
  }

  return 'Rủi ro cao'
}

function applyChoice(choice: Choice): void {
  if (isFinished.value) {
    return
  }

  const pressure = severityPressure(currentIncident.value.severity)
  const comboBoost = streak.value >= 2 ? 3 : 0
  const stabilization = choice.effect.stability + choice.effect.trust
  const nextStreak = stabilization > 0 ? streak.value + 1 : 0

  const next: Metrics = {
    stability: clamp(metrics.value.stability + choice.effect.stability + comboBoost),
    trust: clamp(metrics.value.trust + choice.effect.trust + (comboBoost > 0 ? 1 : 0)),
    energy: clamp(metrics.value.energy + choice.effect.energy),
    timeLeft: Math.max(0, metrics.value.timeLeft + choice.effect.minutes),
    chaos: clamp(metrics.value.chaos + choice.effect.chaos + pressure),
  }

  metrics.value = next
  streak.value = nextStreak
  missionClockSeconds.value = next.timeLeft * 60
  logs.value = [
    {
      incident: currentIncident.value.title,
      severity: currentIncident.value.severity,
      action: choice.title,
      note: choice.description,
      impact: impactLabel(choice),
    },
    ...logs.value,
  ]

  round.value += 1
  if (!isFinished.value) {
    tryRandomEvent()
  }
}

function progress(value: number): number {
  return clamp(value)
}

function severityClass(severity: Severity): string {
  if (severity === 'SEV-1') {
    return 'text-accent-coral border-accent-coral bg-accent-coral/10'
  }

  if (severity === 'SEV-2') {
    return 'text-accent-amber border-accent-amber bg-accent-amber/10'
  }

  return 'text-accent-sky border-accent-sky bg-accent-sky/10'
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds)
  const mm = Math.floor(safe / 60)
  const ss = safe % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

function jitter(base: number, phase: number, amplitude: number): number {
  if (isFinished.value) {
    return base
  }

  const wave = Math.sin((telemetryTick.value + phase) / 4)
  return clamp(base + Math.round(wave * amplitude))
}

function nodeById(id: string): TacticalNode | undefined {
  return tacticalNodes.find((node) => node.id === id)
}

function nodeStatusClass(node: TacticalNode): string {
  const chaos = metrics.value.chaos
  if (node.lane === 'db' && chaos >= 70) {
    return 'node-critical'
  }

  if (node.lane === 'api' && chaos >= 55) {
    return 'node-warning'
  }

  if (node.lane === 'queue' && chaos >= 60) {
    return 'node-warning'
  }

  if (chaos >= 85) {
    return 'node-critical'
  }

  return 'node-healthy'
}

function edgeSvgPath(edge: TacticalEdge): string {
  const from = nodeById(edge.from)
  const to = nodeById(edge.to)
  if (!from || !to) {
    return ''
  }

  return `M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y}, ${(from.x + to.x) / 2} ${to.y}, ${to.x} ${to.y}`
}

function laneColor(lane: TacticalNode['lane']): string {
  if (lane === 'db') {
    return '#FF6B4A'
  }

  if (lane === 'api') {
    return '#FFB830'
  }

  if (lane === 'gateway') {
    return '#38BDF8'
  }

  return '#94A3B8'
}

async function copyResult(): Promise<void> {
  const payload: SharePayload = {
    player: playerAlias.value.trim() || 'Anonymous Commander',
    mode: modeLabel.value,
    campaignScore: campaignScore.value,
    rawScore: score.value,
    bestScore: bestScore.value,
    chaos: metrics.value.chaos,
    timeLeft: metrics.value.timeLeft,
    rounds: `${Math.min(round.value - 1, maxRounds.value)}/${maxRounds.value}`,
    state: warState.value,
    verdict: verdict.value,
    generatedAt: new Date().toLocaleString('vi-VN'),
  }

  const message = buildShareText(payload, missionBonus.value)

  try {
    localStorage.setItem(shareDraftStorageKey, JSON.stringify(payload))
    localStorage.setItem(shareDraftAtStorageKey, String(Date.now()))

    const opened = openShareCard({
      payload,
      message,
      draftKey: shareDraftStorageKey,
      draftAtKey: shareDraftAtStorageKey,
    })

    if (!opened) {
      throw new Error('tab_blocked')
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    shareResultNotice.value = isLocal
      ? `Đã mở share card. Link public sau approve: ${PUBLIC_SHARE_URL}`
      : 'Đã mở tab share card mới.'

    pushAlert('Share card đã mở ở tab mới.', 'warning')
  } catch {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message)
      shareResultNotice.value = `Không mở được tab mới, đã copy report vào clipboard. Link public: ${PUBLIC_SHARE_URL}`
      pushAlert('Tab share bị chặn. Đã copy report.', 'critical')
    } else {
      shareResultNotice.value = 'Không mở được tab share. Hãy cho phép pop-up và thử lại.'
    }
  }

  setTimeout(() => {
    shareResultNotice.value = ''
  }, 3500)
}

const currentIncident = computed<Incident>(() => {
  const maxR = maxRoundsByMode[mode.value]
  const index = Math.min(round.value - 1, maxR - 1)
  return deck.value[index] ?? fallbackIncident
})

const maxRounds = computed<number>(() => maxRoundsByMode[mode.value])
const isFinished = computed<boolean>(() => {
  return round.value > maxRounds.value || metrics.value.timeLeft <= 0 || metrics.value.chaos >= 100
})

const liveMetrics = computed(() => ({
  stability: jitter(metrics.value.stability, 1, 2),
  trust: jitter(metrics.value.trust, 4, 2),
  energy: jitter(metrics.value.energy, 7, 3),
  chaos: jitter(metrics.value.chaos, 11, 2),
}))

const score = computed<number>(() => {
  const value = (metrics.value.stability + metrics.value.trust + metrics.value.energy + (100 - metrics.value.chaos)) / 4
  return Math.round(value)
})

const missionContract = computed(() => {
  return [
    {
      id: 'low-chaos',
      label: 'Giữ chaos <= 55',
      done: metrics.value.chaos <= 55,
      bonus: 6,
    },
    {
      id: 'high-energy',
      label: 'Kết thúc với energy >= 60',
      done: metrics.value.energy >= 60,
      bonus: 5,
    },
    {
      id: 'combo-streak',
      label: 'Đạt streak x3 trở lên',
      done: streak.value >= 3,
      bonus: 3,
    },
  ]
})

const missionBonus = computed<number>(() => {
  return missionContract.value.reduce((total, item) => {
    return item.done ? total + item.bonus : total
  }, 0)
})

const campaignScore = computed<number>(() => {
  return Math.min(100, score.value + missionBonus.value)
})

const campaignRank = computed<string>(() => {
  if (campaignScore.value >= 90) return 'Legend Commander'
  if (campaignScore.value >= 78) return 'Senior Commander'
  if (campaignScore.value >= 62) return 'Incident Lead'
  return 'Junior Operator'
})

const verdict = computed<string>(() => {
  if (campaignScore.value >= 80) return 'Bạn giữ hệ thống rất tốt. Team có thể ngủ yên.'
  if (campaignScore.value >= 65) return 'Bạn xử lý ổn định. Còn vài điểm có thể tối ưu sau postmortem.'
  if (campaignScore.value >= 45) return 'Đã dập được cháy, nhưng hệ thống còn mong manh.'
  return 'War room vỡ trận. Cần viết runbook và luyện incident drill ngay.'
})

const scoreTone = computed<string>(() => {
  if (campaignScore.value >= 80) return 'text-accent-coral'
  if (campaignScore.value >= 65) return 'text-accent-amber'
  return 'text-accent-sky'
})

const warState = computed<string>(() => {
  if (metrics.value.chaos >= 85) return 'MELTDOWN'
  if (metrics.value.chaos >= 60) return 'Căng thẳng'
  if (metrics.value.chaos >= 35) return 'Đang kiểm soát'
  return 'Ổn định cao'
})

const chaosGlowIntensity = computed<number>(() => {
  if (metrics.value.chaos >= 85) return 0.4
  if (metrics.value.chaos >= 60) return 0.2
  return 0
})

const incomingCount = computed<number>(() => Math.max(0, maxRounds.value - round.value))

const modeLabel = computed<string>(() => mode.value === 'hardcore' ? 'Hardcore' : 'Normal')

const feedMessage = computed<string>(() => {
  const incident = currentIncident.value
  return `[LIVE] ${incident.severity} ${incident.title} | Còn ${metrics.value.timeLeft} phút để khóa tình hình`
})

const canChangeMode = computed<boolean>(() => logs.value.length === 0 && round.value === 1)

const tickerItems = computed<string[]>(() => [
  `MODE ${modeLabel.value}`,
  `ROUND ${Math.min(round.value, maxRounds.value)}/${maxRounds.value}`,
  `CHAOS ${liveMetrics.value.chaos}`,
  `STABILITY ${liveMetrics.value.stability}`,
  `TRUST ${liveMetrics.value.trust}`,
  `ENERGY ${liveMetrics.value.energy}`,
  `TIMER ${formatClock(missionClockSeconds.value)}`,
  `INCIDENT LEFT ${incomingCount.value}`,
])

const canContinue = computed<boolean>(() => !isFinished.value && currentIncident.value.choices.length > 0 && !showRandomEvent.value)

const operationPhase = computed<string>(() => {
  if (metrics.value.chaos >= 80) return 'Containment'
  if (metrics.value.chaos >= 55) return 'Escalation'
  if (round.value <= 2) return 'Detection'
  return 'Recovery'
})

const pressureIndex = computed<number>(() => {
  const pressure = (metrics.value.chaos * 0.45) + ((100 - metrics.value.energy) * 0.25) + ((100 - metrics.value.stability) * 0.3)
  return Math.round(Math.max(0, Math.min(100, pressure)))
})

const frontlineStatus = computed(() => {
  const chaos = metrics.value.chaos
  return [
    {
      name: 'Gateway Front',
      status: chaos >= 70 ? 'Hot' : chaos >= 45 ? 'Warm' : 'Stable',
      tone: chaos >= 70 ? 'text-accent-coral' : chaos >= 45 ? 'text-accent-amber' : 'text-accent-sky',
    },
    {
      name: 'Data Front',
      status: metrics.value.stability < 50 ? 'Risky' : metrics.value.stability < 70 ? 'Guarded' : 'Healthy',
      tone: metrics.value.stability < 50 ? 'text-accent-coral' : metrics.value.stability < 70 ? 'text-accent-amber' : 'text-accent-sky',
    },
    {
      name: 'Team Front',
      status: metrics.value.energy < 40 ? 'Fatigued' : metrics.value.energy < 65 ? 'Strained' : 'Ready',
      tone: metrics.value.energy < 40 ? 'text-accent-coral' : metrics.value.energy < 65 ? 'text-accent-amber' : 'text-accent-sky',
    },
  ]
})

watch(campaignScore, (value) => {
  if (!isFinished.value) {
    return
  }

  if (value > bestScore.value) {
    bestScore.value = value
    localStorage.setItem('bug-war-room-best-score', String(value))
  }
})

watch(playerAlias, (value) => {
  localStorage.setItem(playerAliasStorageKey, value)
})

watch(() => metrics.value.chaos, (newChaos) => {
  if (newChaos >= 85 && lastChaosThreshold.value < 85) {
    pushAlert('CHAOS ĐẠT 85+! Hệ thống đang MELTDOWN! Hành động ngay!', 'meltdown')
    lastChaosThreshold.value = 85
  } else if (newChaos >= 70 && lastChaosThreshold.value < 70) {
    pushAlert('CẢNH BÁO: Chaos vượt 70! Nguy cơ mất kiểm soát.', 'critical')
    lastChaosThreshold.value = 70
  } else if (newChaos >= 50 && lastChaosThreshold.value < 50) {
    pushAlert('Chaos đang tăng nhanh. Cân nhắc ưu tiên giảm chaos.', 'warning')
    lastChaosThreshold.value = 50
  }

  if (newChaos < 50 && lastChaosThreshold.value >= 50) {
    lastChaosThreshold.value = 0
  }
})

onMounted(() => {
  const stored = Number(localStorage.getItem('bug-war-room-best-score'))
  if (!Number.isNaN(stored) && stored > 0) {
    bestScore.value = stored
  }

  const storedAlias = localStorage.getItem(playerAliasStorageKey)
  if (storedAlias) {
    playerAlias.value = storedAlias
  }

  const shareDraftAt = Number(localStorage.getItem(shareDraftAtStorageKey))
  const oneHour = 60 * 60 * 1000
  if (!Number.isNaN(shareDraftAt) && Date.now() - shareDraftAt > oneHour) {
    localStorage.removeItem(shareDraftStorageKey)
    localStorage.removeItem(shareDraftAtStorageKey)
  }

  timerHandle = setInterval(() => {
    telemetryTick.value += 1

    if (!isFinished.value && missionClockSeconds.value > 0) {
      missionClockSeconds.value -= 1

      if (missionClockSeconds.value % 60 === 0) {
        metrics.value = {
          ...metrics.value,
          timeLeft: Math.max(0, metrics.value.timeLeft - 1),
        }
      }
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timerHandle) clearInterval(timerHandle)
})

resetGame()
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-10 font-body text-text-primary sm:px-6" :class="{ 'chaos-atmosphere': metrics.chaos >= 70 }">
    <a
      href="https://github.com/TranQui004"
      target="_blank"
      rel="noopener noreferrer"
      class="fixed right-4 top-3 z-50 inline-flex items-center gap-2 border border-border-default bg-bg-surface/90 px-3 py-2 text-xs tracking-wider text-text-secondary backdrop-blur hover:border-accent-amber hover:text-text-primary sm:right-6"
      aria-label="Made by TranQui004"
    >
      <img
        src="https://github.com/TranQui004.png?size=64"
        alt="TranQui004 GitHub Avatar"
        class="h-5 w-5 rounded-full border border-border-default"
      >
      <span>Made by <span class="text-accent-amber">TranQui004</span></span>
    </a>

    <!-- Chaos Alerts Toast Stack -->
    <div class="fixed right-4 top-16 z-50 flex flex-col gap-2 sm:right-6 sm:top-20">
      <transition-group name="alert-slide">
        <div
          v-for="alert in chaosAlerts"
          :key="alert.id"
          class="alert-toast max-w-sm border px-4 py-3 font-display text-xs tracking-wider shadow-lg"
          :class="{
            'border-accent-amber bg-accent-amber/15 text-accent-amber': alert.level === 'warning',
            'border-accent-coral bg-accent-coral/15 text-accent-coral': alert.level === 'critical',
            'border-accent-coral bg-accent-coral/25 text-accent-coral animate-pulse-fast': alert.level === 'meltdown',
          }"
        >
          <span v-if="alert.level === 'meltdown'" class="mr-1">🔥</span>
          <span v-else-if="alert.level === 'critical'" class="mr-1">⚠️</span>
          <span v-else class="mr-1">📡</span>
          {{ alert.message }}
        </div>
      </transition-group>
    </div>

    <!-- Random Event Overlay -->
    <transition name="event-fade">
      <div v-if="showRandomEvent && activeRandomEvent" class="fixed inset-0 z-40 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm">
        <div class="mx-4 w-full max-w-lg animate-fade-up border-2 border-accent-amber bg-bg-surface p-6 shadow-[0_0_40px_rgba(255,184,48,0.15)]">
          <div class="flex items-center gap-3">
            <span class="animate-pulse-fast text-2xl">⚡</span>
            <p class="font-display text-xs tracking-[0.2em] text-accent-amber">// RANDOM EVENT — SỰ CỐ PHỤ</p>
          </div>
          <h3 class="mt-3 font-display text-2xl text-text-primary">{{ activeRandomEvent.title }}</h3>
          <p class="mt-2 inline-flex border px-2 py-1 text-xs tracking-widest" :class="severityClass(activeRandomEvent.severity)">
            {{ activeRandomEvent.severity }}
          </p>
          <p class="mt-3 text-sm text-text-secondary">{{ activeRandomEvent.description }}</p>
          <div class="mt-4 border border-border-default bg-bg-deep p-3 text-xs text-text-dim">
            Tác động:
            <span class="ml-1 text-accent-coral">
              S{{ activeRandomEvent.effect.stability >= 0 ? '+' : '' }}{{ activeRandomEvent.effect.stability }}
              / T{{ activeRandomEvent.effect.trust >= 0 ? '+' : '' }}{{ activeRandomEvent.effect.trust }}
              / E{{ activeRandomEvent.effect.energy >= 0 ? '+' : '' }}{{ activeRandomEvent.effect.energy }}
              / C{{ activeRandomEvent.effect.chaos >= 0 ? '+' : '' }}{{ activeRandomEvent.effect.chaos }}
            </span>
          </div>
          <button
            type="button"
            class="mt-5 w-full border border-accent-amber bg-accent-amber/10 py-3 font-display text-sm tracking-widest text-accent-amber transition-colors hover:bg-accent-amber/20"
            @click="dismissRandomEvent"
          >
            XÁC NHẬN &amp; TIẾP TỤC
          </button>
        </div>
      </div>
    </transition>

    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <!-- Ticker -->
      <div class="ticker-shell animate-fade-up border border-border-default bg-bg-surface text-xs tracking-wider text-text-secondary">
        <div class="ticker-track">
          <span class="ticker-segment" v-for="segment in tickerItems" :key="segment">{{ segment }}</span>
          <span class="ticker-segment" v-for="segment in tickerItems" :key="segment + '-mirror'">{{ segment }}</span>
        </div>
      </div>

      <!-- Live Feed -->
      <div class="animate-fade-up border border-border-default bg-bg-surface p-3 text-xs tracking-wider text-text-secondary">
        <span class="text-accent-coral">// LIVE FEED</span>
        <span class="ml-2">{{ feedMessage }}</span>
      </div>

      <!-- Header -->
      <header
        class="relative overflow-hidden animate-fade-up border border-border-default bg-bg-surface p-6 sm:p-8"
        :class="{ 'header-chaos-glow': metrics.chaos >= 60 }"
        :style="{ '--chaos-glow': chaosGlowIntensity }"
      >
        <div class="hero-glow hero-glow-coral" />
        <div class="hero-glow hero-glow-sky" />

        <div class="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="font-display text-xs tracking-[0.2em] text-accent-coral">// INCIDENT SIMULATOR</p>
            <h1 class="mt-2 font-display text-3xl font-bold sm:text-5xl">Bug War Room</h1>
            <p class="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
              Bạn là incident commander. Mỗi vòng là một sự cố production. Chọn chiến thuật đủ nhanh để giữ
              ổn định hệ thống, niềm tin người dùng và năng lượng team.
            </p>
            <p class="mt-2 max-w-2xl text-xs text-text-dim sm:text-sm">
              Luồng chơi: đọc incident - chọn 1 phương án - nhận tác động lên 4 chỉ số - qua vòng mới.
              Nếu Chaos lên 100 hoặc hết thời gian thì chiến dịch thất thủ ngay.
            </p>
          </div>
          <div class="border border-accent-amber bg-accent-amber/10 px-3 py-2 font-display text-xs tracking-widest text-accent-amber">
            VOL.01 / WAR ROOM
          </div>
        </div>

        <div class="relative z-10 mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="border px-3 py-2 text-xs font-display tracking-wider transition-colors"
            :disabled="!canChangeMode"
            :class="mode === 'normal' ? 'border-accent-amber bg-accent-amber/10 text-accent-amber' : 'border-border-default text-text-secondary hover:text-text-primary disabled:opacity-50'"
            @click="mode = 'normal'; resetGame()"
          >
            NORMAL
          </button>
          <button
            type="button"
            class="border px-3 py-2 text-xs font-display tracking-wider transition-colors"
            :disabled="!canChangeMode"
            :class="mode === 'hardcore' ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' : 'border-border-default text-text-secondary hover:text-text-primary disabled:opacity-50'"
            @click="mode = 'hardcore'; resetGame()"
          >
            HARDCORE
          </button>
          <div class="border border-border-default bg-bg-deep px-3 py-2 text-xs tracking-wider text-text-secondary">
            Clock: <span class="text-accent-sky">{{ formatClock(missionClockSeconds) }}</span>
          </div>
        </div>

        <!-- Metrics Row -->
        <div class="relative z-10 mt-6 grid gap-3 sm:grid-cols-5">
          <div class="metric-card border border-border-default bg-bg-deep p-3">
            <p class="text-xs tracking-widest text-text-dim">STABILITY</p>
            <p class="mt-1 font-display text-2xl text-accent-coral">{{ liveMetrics.stability }}</p>
            <div class="mt-2 h-1 bg-bg-elevated">
              <div class="h-1 bg-accent-coral transition-all duration-500" :style="{ width: `${progress(liveMetrics.stability)}%` }" />
            </div>
          </div>
          <div class="metric-card border border-border-default bg-bg-deep p-3">
            <p class="text-xs tracking-widest text-text-dim">TRUST</p>
            <p class="mt-1 font-display text-2xl text-accent-amber">{{ liveMetrics.trust }}</p>
            <div class="mt-2 h-1 bg-bg-elevated">
              <div class="h-1 bg-accent-amber transition-all duration-500" :style="{ width: `${progress(liveMetrics.trust)}%` }" />
            </div>
          </div>
          <div class="metric-card border border-border-default bg-bg-deep p-3">
            <p class="text-xs tracking-widest text-text-dim">TEAM ENERGY</p>
            <p class="mt-1 font-display text-2xl text-accent-sky">{{ liveMetrics.energy }}</p>
            <div class="mt-2 h-1 bg-bg-elevated">
              <div class="h-1 bg-accent-sky transition-all duration-500" :style="{ width: `${progress(liveMetrics.energy)}%` }" />
            </div>
          </div>
          <div class="metric-card border border-border-default bg-bg-deep p-3">
            <p class="text-xs tracking-widest text-text-dim">TIME LEFT</p>
            <p class="mt-1 font-display text-2xl text-text-primary">{{ metrics.timeLeft }}m</p>
          </div>
          <div class="metric-card border border-border-default bg-bg-deep p-3" :class="{ 'chaos-card-pulse': metrics.chaos >= 70 }">
            <p class="text-xs tracking-widest text-text-dim">CHAOS</p>
            <p class="mt-1 font-display text-2xl" :class="liveMetrics.chaos >= 70 ? 'text-accent-coral' : 'text-text-primary'">{{ liveMetrics.chaos }}</p>
            <p class="mt-1 text-xs" :class="metrics.chaos >= 85 ? 'text-accent-coral font-bold animate-pulse-fast' : 'text-text-secondary'">{{ warState }}</p>
          </div>
        </div>
      </header>

      <!-- Guide Section -->
      <section class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-5 sm:p-6">
        <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
          <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
          Hướng Dẫn Nhanh
        </h2>
        <div class="grid gap-3 sm:grid-cols-4">
          <div class="border border-border-default bg-bg-deep p-4">
            <p class="font-display text-sm text-accent-coral">1. Mục tiêu</p>
            <p class="mt-2 text-sm text-text-secondary">
              Giữ <span class="text-text-primary">Stability</span>, <span class="text-text-primary">Trust</span>,
              <span class="text-text-primary">Energy</span> cao và đẩy <span class="text-text-primary">Chaos</span> thấp.
            </p>
          </div>
          <div class="border border-border-default bg-bg-deep p-4">
            <p class="font-display text-sm text-accent-amber">2. Cách chơi</p>
            <p class="mt-2 text-sm text-text-secondary">
              Mỗi vòng đọc tình huống, chọn chiến thuật. Đồng hồ đếm lùi realtime.
            </p>
          </div>
          <div class="border border-border-default bg-bg-deep p-4">
            <p class="font-display text-sm text-accent-sky">3. Random Event</p>
            <p class="mt-2 text-sm text-text-secondary">
              Giữa các vòng có thể xảy ra sự cố phụ bất ngờ. Xác nhận để tiếp tục.
            </p>
          </div>
          <div class="border border-border-default bg-bg-deep p-4">
            <p class="font-display text-sm text-accent-coral">4. Điều kiện thắng</p>
            <p class="mt-2 text-sm text-text-secondary">
              Kết thúc toàn bộ vòng với điểm cao. Chaos = 100 hoặc hết giờ = thất thủ.
            </p>
          </div>
        </div>
        <div class="mt-4 border border-accent-sky/40 bg-accent-sky/10 p-3 text-sm text-text-secondary">
          Một số chỉ số như <span class="text-text-primary">Pressure Index</span>, <span class="text-text-primary">Contract Bonus</span>
          và công thức tính điểm có thể hơi khó hiểu lúc đầu.
          <a href="#docs-panel" class="ml-1 text-accent-sky underline underline-offset-2 hover:text-text-primary">
            Xem docs giải thích chi tiết
          </a>
        </div>
      </section>

      <section class="animate-fade-up animate-delay-2 grid gap-3 lg:grid-cols-3">
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-xs tracking-[0.16em] text-accent-coral">// COMMAND PHASE</p>
          <p class="mt-2 font-display text-2xl text-text-primary">{{ operationPhase }}</p>
          <p class="mt-2 text-sm text-text-secondary">Phase hiện tại thay đổi theo chaos và tiến độ chiến dịch.</p>
        </div>
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-xs tracking-[0.16em] text-accent-amber">// PRESSURE INDEX</p>
          <p class="mt-2 font-display text-2xl text-accent-amber">{{ pressureIndex }}</p>
          <div class="mt-2 h-1 bg-bg-elevated">
            <div class="h-1 bg-accent-amber transition-all duration-500" :style="{ width: `${pressureIndex}%` }" />
          </div>
          <p class="mt-2 text-sm text-text-secondary">Chỉ số tổng hợp từ chaos, stability và năng lượng team.</p>
        </div>
        <div class="border border-border-default bg-bg-surface p-4">
          <p class="font-display text-xs tracking-[0.16em] text-accent-sky">// FRONTLINES</p>
          <div class="mt-2 space-y-1 text-sm">
            <p v-for="front in frontlineStatus" :key="front.name" class="flex items-center justify-between gap-2 text-text-secondary">
              <span>{{ front.name }}</span>
              <span class="font-display text-xs tracking-wider" :class="front.tone">{{ front.status }}</span>
            </p>
          </div>
        </div>
      </section>

      <section class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 sm:p-6">
        <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
          <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
          Mission Contract
        </h2>
        <div class="grid gap-3 md:grid-cols-[1.4fr_1fr]">
          <div class="space-y-2">
            <div
              v-for="item in missionContract"
              :key="item.id"
              class="flex items-center justify-between border border-border-default bg-bg-deep px-3 py-2 text-sm"
            >
              <span class="text-text-secondary">{{ item.label }}</span>
              <span class="font-display text-xs tracking-wider" :class="item.done ? 'text-accent-amber' : 'text-text-dim'">
                {{ item.done ? `+${item.bonus}` : '+0' }}
              </span>
            </div>
          </div>
          <div class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-text-dim">CONTRACT BONUS</p>
            <p class="mt-1 font-display text-3xl text-accent-amber">+{{ missionBonus }}</p>
            <p class="mt-2 text-xs text-text-secondary">Campaign score = Base score + Contract bonus</p>
          </div>
        </div>
      </section>

      <section id="docs-panel" class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 sm:p-6">
        <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
          <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
          Bug War Room Docs
        </h2>

        <div class="grid gap-3 lg:grid-cols-2">
          <div class="border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
            <p class="font-display text-sm text-accent-coral">Chỉ số cốt lõi</p>
            <p class="mt-2"><span class="text-text-primary">Stability</span>: mức ổn định kỹ thuật của hệ thống.</p>
            <p class="mt-1"><span class="text-text-primary">Trust</span>: niềm tin người dùng/doanh nghiệp.</p>
            <p class="mt-1"><span class="text-text-primary">Energy</span>: sức bền của team xử lý sự cố.</p>
            <p class="mt-1"><span class="text-text-primary">Chaos</span>: độ hỗn loạn tổng thể, càng thấp càng tốt.</p>
            <p class="mt-1"><span class="text-text-primary">Time Left</span>: thời gian còn lại của chiến dịch.</p>
          </div>

          <div class="border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
            <p class="font-display text-sm text-accent-amber">Điều kiện thắng/thua</p>
            <p class="mt-2">Thua ngay nếu <span class="text-text-primary">Chaos = 100</span> hoặc <span class="text-text-primary">Time Left = 0</span>.</p>
            <p class="mt-1">Vượt qua đủ số vòng sẽ vào màn tổng kết chiến dịch.</p>
            <p class="mt-1">Điểm cao khi giữ Stability/Trust/Energy tốt và Chaos thấp.</p>
          </div>
        </div>

        <div class="mt-3 grid gap-3 lg:grid-cols-2">
          <div class="border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
            <p class="font-display text-sm text-accent-sky">Công thức điểm</p>
            <p class="mt-2">Base Score = <span class="text-accent-amber">(Stability + Trust + Energy + (100 - Chaos)) / 4</span></p>
            <p class="mt-1">Campaign Score = <span class="text-accent-amber">Base Score + Contract Bonus</span> (tối đa 100).</p>
          </div>
          <div class="border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
            <p class="font-display text-sm text-accent-coral">Thông số nâng cao</p>
            <p class="mt-2"><span class="text-text-primary">Pressure Index</span>: tổng hợp từ Chaos, Stability và Energy để phản ánh mức căng thẳng.</p>
            <p class="mt-1"><span class="text-text-primary">Operation Phase</span>: phase vận hành đổi theo ngưỡng chaos và tiến độ vòng.</p>
            <p class="mt-1"><span class="text-text-primary">Random Event</span>: sự cố phụ có xác suất theo mode và trọng số event.</p>
          </div>
        </div>

        <div class="mt-3 border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
          <p class="font-display text-sm text-accent-amber">Mẹo nhanh</p>
          <p class="mt-2">Nếu Chaos vượt 70: ưu tiên giảm Chaos trước, kể cả phải hy sinh điểm ngắn hạn.</p>
          <p class="mt-1">Nếu Energy xuống thấp: chọn phương án an toàn vận hành để tránh domino incident.</p>
          <p class="mt-1">Contract Bonus nhỏ nhưng rất hữu ích khi bạn đang sát mốc rank.</p>
        </div>
      </section>

      <!-- Game Content -->
      <section class="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <!-- Left: Incident -->
        <article
          class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-6 sm:p-8"
          v-if="!isFinished"
        >
          <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            Vòng {{ round }} / {{ maxRounds }}
          </h2>

          <div class="mb-5 grid gap-3 sm:grid-cols-3">
            <div class="border border-border-default bg-bg-deep p-3">
              <p class="text-xs tracking-widest text-text-dim">STREAK</p>
              <p class="mt-1 font-display text-2xl text-accent-coral">x{{ streak }}</p>
            </div>
            <div class="border border-border-default bg-bg-deep p-3">
              <p class="text-xs tracking-widest text-text-dim">INCIDENT CÒN LẠI</p>
              <p class="mt-1 font-display text-2xl text-accent-amber">{{ incomingCount }}</p>
            </div>
            <div class="border border-border-default bg-bg-deep p-3">
              <p class="text-xs tracking-widest text-text-dim">WAR STATE</p>
              <p class="mt-1 font-display text-lg text-text-primary">{{ warState }}</p>
            </div>
          </div>

          <div class="mb-5 border border-border-default bg-bg-deep p-4">
            <p class="inline-flex border px-2 py-1 text-xs tracking-widest" :class="severityClass(currentIncident.severity)">
              {{ currentIncident.severity }}
            </p>
            <h3 class="mt-1 font-display text-2xl">{{ currentIncident.title }}</h3>
            <p class="mt-2 text-sm text-text-secondary">{{ currentIncident.context }}</p>
          </div>

          <div class="space-y-3" v-if="canContinue">
            <button
              v-for="choice in currentIncident.choices"
              :key="choice.title"
              type="button"
              class="choice-card w-full border border-border-default bg-bg-deep p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated"
              @click="applyChoice(choice)"
            >
              <p class="font-display text-lg text-text-primary">{{ choice.title }}</p>
              <p class="mt-1 text-sm text-text-secondary">{{ choice.description }}</p>
              <p class="mt-2 text-xs text-text-dim">
                Tác động:
                <span class="ml-1 text-text-primary">
                  S{{ choice.effect.stability >= 0 ? '+' : '' }}{{ choice.effect.stability }}
                  / T{{ choice.effect.trust >= 0 ? '+' : '' }}{{ choice.effect.trust }}
                  / E{{ choice.effect.energy >= 0 ? '+' : '' }}{{ choice.effect.energy }}
                  / C{{ choice.effect.chaos >= 0 ? '+' : '' }}{{ choice.effect.chaos }}
                </span>
              </p>
            </button>
          </div>

          <div v-if="showRandomEvent" class="mt-4 border border-accent-amber/40 bg-accent-amber/5 p-4 text-sm text-accent-amber">
            ⚡ Sự cố phụ đang chờ xử lý — xem overlay phía trên.
          </div>
        </article>

        <!-- Results Screen -->
        <article
          class="animate-fade-up animate-delay-2 border border-accent-coral bg-accent-coral/10 p-6 sm:p-8"
          v-else
        >
          <h2 class="flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            Kết quả chiến dịch
          </h2>
          <p class="mt-4 text-sm text-text-secondary">Campaign score</p>
          <p class="mt-1 font-display text-5xl" :class="scoreTone">{{ campaignScore }}</p>
          <p class="mt-2 text-xs text-text-dim">Base {{ score }} + Bonus {{ missionBonus }}</p>
          <p class="mt-2 inline-flex border border-accent-sky bg-accent-sky/10 px-2 py-1 font-display text-xs tracking-widest text-accent-sky">
            {{ campaignRank }}
          </p>
          <p class="mt-4 text-sm text-text-primary">{{ verdict }}</p>
          <div class="mt-4 border border-border-default bg-bg-deep p-3 text-xs text-text-secondary">
            Chaos kết thúc: <span class="text-text-primary">{{ metrics.chaos }}</span>
            | Thời gian còn lại: <span class="text-text-primary">{{ metrics.timeLeft }}m</span>
            | Streak cuối: <span class="text-text-primary">x{{ streak }}</span>
            | Best score: <span class="text-accent-amber">{{ bestScore }}</span>
          </div>
          <div class="mt-4 border border-border-default bg-bg-deep p-3">
            <label class="text-[11px] tracking-widest text-text-dim">TÊN CỦA BẠN TRƯỚC KHI SHARE</label>
            <input
              v-model="playerAlias"
              type="text"
              maxlength="40"
              placeholder="Ví dụ: TranQui004"
              class="mt-2 w-full border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-dim focus:border-accent-amber"
            >
          </div>
          <button
            type="button"
            class="mt-6 border border-border-default bg-bg-deep px-4 py-2 text-xs font-display tracking-widest text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
            @click="resetGame"
          >
            CHƠI LẠI
          </button>

          <button
            type="button"
            class="ml-2 mt-6 border border-accent-amber bg-accent-amber/10 px-4 py-2 text-xs font-display tracking-widest text-accent-amber transition-colors hover:bg-accent-amber/20"
            @click="copyResult"
          >
            OPEN SHARE CARD
          </button>

          <p v-if="shareResultNotice" class="mt-3 text-xs text-accent-amber">{{ shareResultNotice }}</p>
        </article>

        <!-- Right: Tactical Map + Log -->
        <aside class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-6 sm:p-8">
          <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
            <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
            Tactical Map
          </h2>

          <div class="tactical-map border border-border-default bg-bg-deep">
            <!-- Grid overlay -->
            <div class="tactical-grid" />

            <!-- Lane labels -->
            <div class="lane-label" style="left: 12%; top: 6%">GATEWAY</div>
            <div class="lane-label" style="left: 38%; top: 6%">API</div>
            <div class="lane-label" style="left: 62%; top: 6%">QUEUE</div>
            <div class="lane-label" style="left: 88%; top: 6%">DATABASE</div>

            <!-- Edges (SVG) -->
            <svg class="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                v-for="edge in tacticalEdges"
                :key="edge.from + edge.to"
                :d="edgeSvgPath(edge)"
                fill="none"
                stroke="rgba(56, 189, 248, 0.2)"
                stroke-width="0.4"
                class="edge-line"
              />
            </svg>

            <!-- Scan line -->
            <div class="tactical-scanline" />

            <!-- Nodes -->
            <div
              v-for="node in tacticalNodes"
              :key="node.id"
              class="tactical-node"
              :class="nodeStatusClass(node)"
              :style="{ left: `${node.x}%`, top: `${node.y}%` }"
            >
              <div class="node-ring" :style="{ borderColor: laneColor(node.lane) }" />
              <div class="node-core" :style="{ backgroundColor: laneColor(node.lane) }" />
              <span class="node-label">{{ node.label }}</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-3 flex flex-wrap gap-3 text-[10px] tracking-widest text-text-dim">
            <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 bg-accent-sky" /> GATEWAY</span>
            <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 bg-accent-amber" /> API</span>
            <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 bg-text-primary" /> QUEUE</span>
            <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 bg-accent-coral" /> DB</span>
            <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-full animate-pulse-fast bg-accent-coral" /> ALERT</span>
          </div>

          <!-- Action Log -->
          <h3 class="mt-5 font-display text-sm tracking-widest text-accent-sky">// ACTION LOG</h3>
          <div class="mt-3 max-h-80 space-y-3 overflow-y-auto" v-if="logs.length > 0">
            <div
              v-for="(entry, index) in logs"
              :key="entry.incident + index.toString()"
              class="border border-border-default bg-bg-deep p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs tracking-widest text-text-dim">{{ entry.incident }}</p>
                <span class="border px-2 py-0.5 text-[10px] tracking-widest" :class="severityClass(entry.severity)">
                  {{ entry.severity }}
                </span>
              </div>
              <p class="mt-1 font-display text-sm text-text-primary">{{ entry.action }}</p>
              <p class="mt-1 text-xs text-text-secondary">{{ entry.note }}</p>
              <p class="mt-1 text-[11px] text-accent-amber">Đánh giá: {{ entry.impact }}</p>
            </div>
          </div>

          <p v-else class="mt-3 border border-dashed border-border-default p-4 text-sm text-text-dim">
            Chưa có hành động nào. Chọn phương án ở khung bên trái để bắt đầu.
          </p>
        </aside>
      </section>

      <!-- Footer -->
      <footer class="animate-fade-up animate-delay-4 flex flex-wrap items-center justify-between gap-4 border border-border-default bg-bg-surface p-4 sm:p-5">
        <p class="text-xs text-text-secondary sm:text-sm">
          Tip: Khi chaos vượt 70, ưu tiên giảm chaos ngay cả khi mất trust ngắn hạn. Cẩn thận random event!
        </p>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-4 py-2 text-xs font-display tracking-widest text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
        >
          <span aria-hidden="true">&larr;</span>
          VỀ TRANG CHỦ
        </RouterLink>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ---- Ticker ---- */
.ticker-shell {
  overflow: hidden;
  position: relative;
  padding: 0.7rem 0;
}

.ticker-track {
  display: flex;
  width: max-content;
  animation: ticker-slide 18s linear infinite;
}

.ticker-segment {
  padding: 0 1.1rem;
  white-space: nowrap;
}

/* ---- Hero Glow ---- */
.hero-glow {
  position: absolute;
  width: 16rem;
  height: 16rem;
  filter: blur(48px);
  opacity: 0.22;
  pointer-events: none;
}

.hero-glow-coral {
  right: -5rem;
  top: -4rem;
  background: #ff6b4a;
}

.hero-glow-sky {
  left: -6rem;
  bottom: -6rem;
  background: #38bdf8;
}

.header-chaos-glow {
  box-shadow:
    0 0 0 1px rgba(255, 107, 74, calc(var(--chaos-glow, 0) * 0.5)),
    0 0 40px rgba(255, 107, 74, var(--chaos-glow, 0)),
    inset 0 0 60px rgba(255, 107, 74, calc(var(--chaos-glow, 0) * 0.3));
}

/* ---- Metrics ---- */
.metric-card {
  box-shadow: inset 0 0 0 1px rgba(37, 53, 73, 0.3);
}

.chaos-card-pulse {
  animation: chaos-pulse 1.2s ease-in-out infinite;
}

/* ---- Tactical Map ---- */
.tactical-map {
  position: relative;
  height: 280px;
  overflow: hidden;
  border-radius: 2px;
}

.tactical-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.06) 1px, transparent 1px);
  background-size: 20px 20px;
}

.tactical-scanline {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(56, 189, 248, 0.4) 30%,
    rgba(56, 189, 248, 0.8) 50%,
    rgba(56, 189, 248, 0.4) 70%,
    transparent 100%
  );
  animation: scanline-sweep 4s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}

.lane-label {
  position: absolute;
  transform: translateX(-50%);
  font-family: var(--font-display, 'Anybody', monospace);
  font-size: 9px;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.5);
}

.tactical-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.node-ring {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid;
  opacity: 0.4;
  animation: ring-pulse 3s ease-in-out infinite;
}

.node-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  z-index: 1;
  box-shadow: 0 0 6px currentColor;
}

.node-label {
  position: absolute;
  top: 18px;
  font-family: var(--font-display, 'Anybody', monospace);
  font-size: 8px;
  letter-spacing: 0.1em;
  color: rgba(148, 163, 184, 0.7);
  white-space: nowrap;
}

.node-healthy .node-ring {
  opacity: 0.3;
}

.node-warning .node-core {
  animation: node-blink 1.5s ease-in-out infinite;
}

.node-warning .node-ring {
  opacity: 0.6;
  border-color: #FFB830 !important;
}

.node-critical .node-core {
  animation: node-blink 0.6s ease-in-out infinite;
  background-color: #FF6B4A !important;
  box-shadow: 0 0 12px #FF6B4A;
}

.node-critical .node-ring {
  opacity: 0.8;
  border-color: #FF6B4A !important;
  animation: ring-pulse-fast 1s ease-in-out infinite;
}

.edge-line {
  stroke-dasharray: 4 4;
  animation: edge-flow 2s linear infinite;
}

/* ---- Choice cards ---- */
.choice-card {
  position: relative;
  overflow: hidden;
}

.choice-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 107, 74, 0.06), transparent);
  transition: width 0.3s ease;
}

.choice-card:hover::before {
  width: 100%;
}

/* ---- Chaos atmosphere ---- */
.chaos-atmosphere {
  background-image: radial-gradient(ellipse at 50% 0%, rgba(255, 107, 74, 0.04) 0%, transparent 60%);
}

/* ---- Alert toast transitions ---- */
.alert-toast {
  backdrop-filter: blur(8px);
}

.alert-slide-enter-active {
  transition: all 0.3s ease-out;
}

.alert-slide-leave-active {
  transition: all 0.3s ease-in;
}

.alert-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.alert-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ---- Event overlay transitions ---- */
.event-fade-enter-active {
  transition: opacity 0.3s ease;
}

.event-fade-leave-active {
  transition: opacity 0.2s ease;
}

.event-fade-enter-from,
.event-fade-leave-to {
  opacity: 0;
}

/* ---- Keyframes ---- */
@keyframes ticker-slide {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes scanline-sweep {
  0% { top: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.4); opacity: 0.6; }
}

@keyframes ring-pulse-fast {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.6); opacity: 1; }
}

@keyframes node-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes edge-flow {
  from { stroke-dashoffset: 8; }
  to { stroke-dashoffset: 0; }
}

@keyframes chaos-pulse {
  0%, 100% { box-shadow: inset 0 0 0 1px rgba(255, 107, 74, 0.2); }
  50% { box-shadow: inset 0 0 0 2px rgba(255, 107, 74, 0.5), 0 0 16px rgba(255, 107, 74, 0.15); }
}

.animate-pulse-fast {
  animation: pulse-fast 0.8s ease-in-out infinite;
}

@keyframes pulse-fast {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
