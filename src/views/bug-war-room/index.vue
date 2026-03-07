<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  incidents,
  maxRoundsByMode,
  randomEventChanceByMode,
  randomEvents,
  severityPressureByLevel,
} from './data'
import { buildShareText, openShareCard, PUBLIC_SHARE_URL } from './share'
import type { ChaosAlert, Choice, GameMode, Incident, Metrics, RandomEvent, RoundLog, Severity, SharePayload } from './types'
import actionConfirmSvg from './svg-animation/action-confirm.svg'
import chaosUpSvg from './svg-animation/chaos-up.svg'
import criticalSvg from './svg-animation/critical.svg'
import defeatSvg from './svg-animation/defeat.svg'
import energyLowSvg from './svg-animation/energy-low.svg'
import slimeAnnoyedSvg from './svg-animation/slime-annoyed.svg'
import slimeClickReactionSvg from './svg-animation/slime-click-reaction.svg'
import slimeIdleSvg from './svg-animation/slime-idle.svg'
import slimeTeachingSvg from './svg-animation/slime-teaching.svg'
import stabilityUpSvg from './svg-animation/stability-up.svg'
import trustUpSvg from './svg-animation/trust-up.svg'
import victorySvg from './svg-animation/victory.svg'
import warningSvg from './svg-animation/warning.svg'
import { bugWarRoomBlogPosts } from './blog/posts'

interface AnalyzedLog extends RoundLog {
  weightedDelta: number
}

interface DailyLeaderboardEntry {
  id: string
  player: string
  score: number
  rank: string
  chaos: number
  timeLeft: number
  createdAt: string
}

interface LearningEntry {
  id: string
  title: string
  note: string
  severity: Severity
  lesson: string
  createdAt: string
}

type LearningSeverityFilter = 'all' | Severity

type SlimeMood =
  | 'slime-idle'
  | 'annoyed'
  | 'click-reaction'
  | 'action-confirm'
  | 'trust-up'
  | 'stability-up'
  | 'chaos-up'
  | 'energy-low'
  | 'warning'
  | 'critical'
  | 'victory'
  | 'defeat'

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
const dailyBestScore = ref<number>(0)
const dailyLeaderboard = ref<DailyLeaderboardEntry[]>([])
const shareResultNotice = ref<string>('')
const playerAlias = ref<string>('')
const recentRandomEventIds = ref<string[]>([])
const dailySeedEnabled = ref<boolean>(true)
const currentDailySeed = ref<string>('')
const seededRandomFn = ref<() => number>(Math.random)
const runId = ref<string>('')
const leaderboardPersisted = ref<boolean>(false)
const transientSlimeMood = ref<SlimeMood | null>(null)
const characterAnimationEnabled = ref<boolean>(true)
const docsCollapsed = ref<boolean>(true)
const actionLogCollapsedMobile = ref<boolean>(false)
const learningJournal = ref<LearningEntry[]>([])
const careerLearningXp = ref<number>(0)
const learningSeverityFilter = ref<LearningSeverityFilter>('all')
const learningCollapsed = ref<boolean>(false)
const showBackToTop = ref<boolean>(false)

const playerAliasStorageKey = 'bug-war-room-player-alias'
const shareDraftStorageKey = 'bug-war-room-share-draft'
const shareDraftAtStorageKey = 'bug-war-room-share-draft-at'
const characterAnimationStorageKey = 'bug-war-room-character-animation-enabled'
const docsCollapsedStorageKey = 'bug-war-room-docs-collapsed'
const actionLogCollapsedStorageKey = 'bug-war-room-action-log-collapsed-mobile'
const learningJournalStorageKey = 'bug-war-room-learning-journal'
const careerLearningXpStorageKey = 'bug-war-room-career-learning-xp'
const learningCollapsedStorageKey = 'bug-war-room-learning-collapsed'
const slimeSpamWindowMs = 950
const slimeSpamAnnoyedThreshold = 6
const slimeClickReactionDurationMs = 1700
const slimeAnnoyedDurationMs = 1200

let alertIdCounter = 0
let timerHandle: ReturnType<typeof setInterval> | undefined
let slimeMoodHandle: ReturnType<typeof setTimeout> | undefined
const slimeClickTimestamps = ref<number[]>([])

const slimeOverlayAssets = [
  slimeAnnoyedSvg,
  slimeClickReactionSvg,
  actionConfirmSvg,
  trustUpSvg,
  stabilityUpSvg,
  chaosUpSvg,
  energyLowSvg,
  warningSvg,
  criticalSvg,
  victorySvg,
  defeatSvg,
]

const slimeAssetMap: Record<SlimeMood, string> = {
  'slime-idle': slimeIdleSvg,
  annoyed: slimeAnnoyedSvg,
  'click-reaction': slimeClickReactionSvg,
  'action-confirm': actionConfirmSvg,
  'trust-up': trustUpSvg,
  'stability-up': stabilityUpSvg,
  'chaos-up': chaosUpSvg,
  'energy-low': energyLowSvg,
  warning: warningSvg,
  critical: criticalSvg,
  victory: victorySvg,
  defeat: defeatSvg,
}

function setTransientMood(mood: SlimeMood, duration = 1500): void {
  if (!characterAnimationEnabled.value) {
    return
  }

  transientSlimeMood.value = mood
  if (slimeMoodHandle) {
    clearTimeout(slimeMoodHandle)
  }

  slimeMoodHandle = setTimeout(() => {
    transientSlimeMood.value = null
  }, duration)
}

function onSlimeOperatorClick(): void {
  const now = Date.now()
  slimeClickTimestamps.value = [
    ...slimeClickTimestamps.value.filter((ts) => now - ts < slimeSpamWindowMs),
    now,
  ]

  const spamCount = slimeClickTimestamps.value.length
  if (spamCount >= slimeSpamAnnoyedThreshold) {
    setTransientMood('annoyed', slimeAnnoyedDurationMs)
    return
  }

  setTransientMood('click-reaction', slimeClickReactionDurationMs)
}

const metrics = ref<Metrics>({
  stability: 70,
  trust: 66,
  energy: 72,
  timeLeft: 110,
  chaos: 28,
})

function randomizeDeck(): Incident[] {
  const targetRounds = maxRoundsByMode[mode.value]
  const output: Incident[] = []

  while (output.length < targetRounds) {
    const shuffled = [...incidents]
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(seededRandomFn.value() * (i + 1))
      const temp = shuffled[i] as Incident
      shuffled[i] = shuffled[j] as Incident
      shuffled[j] = temp
    }

    output.push(...shuffled)
  }

  return output.slice(0, targetRounds)
}

function parseLearningJournal(raw: string | null): LearningEntry[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as LearningEntry[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item) => {
      return typeof item?.id === 'string'
        && typeof item?.title === 'string'
        && typeof item?.note === 'string'
        && typeof item?.severity === 'string'
        && typeof item?.lesson === 'string'
        && typeof item?.createdAt === 'string'
    })
  } catch {
    return []
  }
}

function createLearningLesson(choice: Choice, severity: Severity): string {
  const effect = choice.effect
  const chaosGuarded = effect.chaos <= -6
  const trustGuarded = effect.trust >= 6
  const stabilityGuarded = effect.stability >= 8
  const energyRisk = effect.energy <= -10

  if (severity === 'SEV-1' && chaosGuarded) {
    return 'SEV-1: ưu tiên containment nhanh và giảm chaos trước, rồi mới tối ưu trải nghiệm.'
  }
  if (trustGuarded && stabilityGuarded) {
    return 'Cân bằng trust + stability đang tốt; đây là chiến thuật nên đưa vào runbook chuẩn.'
  }
  if (energyRisk) {
    return 'Quyết định này tiêu hao team mạnh; cần phương án xoay ca/on-call để tránh burnout.'
  }
  if (effect.minutes <= -12) {
    return 'Mất nhiều thời gian thực thi; cân nhắc rollback/feature flag để giảm time-to-mitigate.'
  }

  return 'Bài học: kiểm tra trade-off giữa chaos, trust và năng lượng team trước khi chốt phương án.'
}

function pushLearningEntry(incident: Incident, choice: Choice): void {
  const newEntry: LearningEntry = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    title: incident.title,
    note: choice.title,
    severity: incident.severity,
    lesson: createLearningLesson(choice, incident.severity),
    createdAt: new Date().toLocaleString('vi-VN'),
  }

  learningJournal.value = [newEntry, ...learningJournal.value].slice(0, 12)
  localStorage.setItem(learningJournalStorageKey, JSON.stringify(learningJournal.value))

  const baseXp = incident.severity === 'SEV-1' ? 5 : incident.severity === 'SEV-2' ? 3 : 2
  const performanceXp = Math.max(0, Math.round((choice.effect.stability + choice.effect.trust - choice.effect.chaos) / 8))
  careerLearningXp.value += baseXp + performanceXp
  localStorage.setItem(careerLearningXpStorageKey, String(careerLearningXp.value))
}

function buildDailySeed(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  return `${y}${m}${d}`
}

function hashSeed(text: string): number {
  let hash = 2166136261
  for (const ch of text) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1
  return () => {
    state += 0x6D2B79F5
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dailyBestStorageKey(seed: string, gameMode: GameMode): string {
  return `bug-war-room-daily-best-${seed}-${gameMode}`
}

function dailyLeaderboardStorageKey(seed: string, gameMode: GameMode): string {
  return `bug-war-room-daily-leaderboard-${seed}-${gameMode}`
}

function parseDailyLeaderboard(raw: string | null): DailyLeaderboardEntry[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as DailyLeaderboardEntry[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item) => {
      return typeof item?.id === 'string'
        && typeof item?.player === 'string'
        && typeof item?.score === 'number'
        && typeof item?.rank === 'string'
        && typeof item?.chaos === 'number'
        && typeof item?.timeLeft === 'number'
        && typeof item?.createdAt === 'string'
    })
  } catch {
    return []
  }
}

function updateDailyBestFromStorage(seed: string, gameMode: GameMode): void {
  const stored = Number(localStorage.getItem(dailyBestStorageKey(seed, gameMode)))
  dailyBestScore.value = Number.isNaN(stored) ? 0 : Math.max(0, stored)
}

function updateDailyLeaderboardFromStorage(seed: string, gameMode: GameMode): void {
  dailyLeaderboard.value = parseDailyLeaderboard(localStorage.getItem(dailyLeaderboardStorageKey(seed, gameMode)))
}

function persistCurrentRunToDailyLeaderboard(): void {
  if (!currentDailySeed.value || !runId.value || leaderboardPersisted.value) {
    return
  }

  const entry: DailyLeaderboardEntry = {
    id: runId.value,
    player: playerAlias.value.trim() || 'Anonymous Commander',
    score: campaignScore.value,
    rank: campaignRank.value,
    chaos: metrics.value.chaos,
    timeLeft: metrics.value.timeLeft,
    createdAt: new Date().toLocaleString('vi-VN'),
  }

  const merged = [
    entry,
    ...dailyLeaderboard.value.filter((item) => item.id !== runId.value),
  ]

  const sorted = merged.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    if (a.chaos !== b.chaos) {
      return a.chaos - b.chaos
    }
    return b.timeLeft - a.timeLeft
  }).slice(0, 5)

  dailyLeaderboard.value = sorted
  localStorage.setItem(dailyLeaderboardStorageKey(currentDailySeed.value, mode.value), JSON.stringify(sorted))
  leaderboardPersisted.value = true
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

  return weighted[Math.floor(seededRandomFn.value() * weighted.length)]
}

function tryRandomEvent(): void {
  const chance = randomEventChanceByMode[mode.value]
  if (seededRandomFn.value() > chance) {
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
      deltaScore: event.effect.stability + event.effect.trust + event.effect.energy - event.effect.chaos,
      chaosDelta: event.effect.chaos,
    },
    ...logs.value,
  ]

  recentRandomEventIds.value = [event.id, ...recentRandomEventIds.value].slice(0, 3)
  pushAlert(`Sự cố phụ: ${event.title}`, 'warning')
  setTransientMood(event.effect.chaos > 0 ? 'chaos-up' : 'action-confirm', 1700)

  activeRandomEvent.value = null
  showRandomEvent.value = false
}

function resetGame(): void {
  currentDailySeed.value = buildDailySeed()
  runId.value = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  leaderboardPersisted.value = false
  transientSlimeMood.value = null
  if (slimeMoodHandle) {
    clearTimeout(slimeMoodHandle)
    slimeMoodHandle = undefined
  }
  if (dailySeedEnabled.value) {
    const seed = hashSeed(`${currentDailySeed.value}-${mode.value}`)
    seededRandomFn.value = createSeededRandom(seed)
  } else {
    seededRandomFn.value = Math.random
  }

  deck.value = randomizeDeck()
  round.value = 1
  streak.value = 0
  logs.value = []
  chaosAlerts.value = []
  activeRandomEvent.value = null
  showRandomEvent.value = false
  lastChaosThreshold.value = 0
  recentRandomEventIds.value = []
  slimeClickTimestamps.value = []

  const baseTime = mode.value === 'hardcore' ? 170 : 220
  const baseEnergy = mode.value === 'hardcore' ? 62 : 70

  metrics.value = {
    stability: 70,
    trust: 66,
    energy: baseEnergy,
    timeLeft: baseTime,
    chaos: mode.value === 'hardcore' ? 36 : 28,
  }

  missionClockSeconds.value = baseTime * 60
  updateDailyBestFromStorage(currentDailySeed.value, mode.value)
  updateDailyLeaderboardFromStorage(currentDailySeed.value, mode.value)
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
  const decisionDelta = choice.effect.stability + choice.effect.trust + choice.effect.energy - (choice.effect.chaos + pressure)
  const chaosDelta = choice.effect.chaos + pressure

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
      deltaScore: decisionDelta,
      chaosDelta,
    },
    ...logs.value,
  ]
  pushLearningEntry(currentIncident.value, choice)

  if (chaosDelta >= 12) {
    setTransientMood('chaos-up')
  } else if (choice.effect.energy <= -10 || metrics.value.energy <= 35) {
    setTransientMood('energy-low')
  } else if (choice.effect.trust >= 8) {
    setTransientMood('trust-up')
  } else if (choice.effect.stability >= 8) {
    setTransientMood('stability-up')
  } else {
    setTransientMood('action-confirm')
  }

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

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function jitter(base: number, phase: number, amplitude: number): number {
  if (isFinished.value) {
    return base
  }

  const wave = Math.sin((telemetryTick.value + phase) / 4)
  return clamp(base + Math.round(wave * amplitude))
}

function onPageScroll(): void {
  showBackToTop.value = window.scrollY > 360
}

function scrollPageToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function copyResult(): Promise<void> {
  const payload: SharePayload = {
    player: playerAlias.value.trim() || 'Anonymous Commander',
    mode: modeLabel.value,
    rank: campaignRank.value,
    dailySeed: currentDailySeed.value,
    campaignScore: campaignScore.value,
    rawScore: score.value,
    bestScore: bestScore.value,
    dailyBestScore: dailyBestScore.value,
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

function openLearningBlog(): void {
  const blogTab = window.open('', '_blank')
  if (!blogTab) {
    shareResultNotice.value = 'Không mở được tab Knowledge Blog. Hãy cho phép pop-up và thử lại.'
    return
  }

  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bug War Room Knowledge Blog</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b1621;
        --panel: #122233;
        --line: #26384c;
        --text: #f3f6fa;
        --muted: #93a8bc;
        --amber: #ffb830;
        --coral: #ff6b4a;
        --sky: #38bdf8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 0% 0%, rgba(255, 107, 74, 0.1), transparent 38%),
          radial-gradient(circle at 100% 0%, rgba(56, 189, 248, 0.12), transparent 42%),
          var(--bg);
        padding: 18px;
      }
      .layout { max-width: 1020px; margin: 0 auto; display: grid; gap: 12px; }
      .panel { border: 1px solid var(--line); background: var(--panel); padding: 14px; }
      .toc-panel { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
      .action-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .action-link {
        text-decoration: none;
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.8);
        color: var(--sky);
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .action-link:hover { border-color: var(--sky); }
      .blog-action {
        border: 1px solid var(--line);
        background: rgba(56, 189, 248, 0.12);
        color: var(--text);
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
      }
      .blog-action:hover { border-color: var(--sky); background: rgba(56, 189, 248, 0.2); }
      h1 { margin: 0 0 4px; font-size: 30px; }
      h2 { margin: 0 0 10px; font-size: 18px; }
      h3 { margin: 0 0 8px; }
      .sub { margin: 0; color: var(--muted); font-size: 12px; }
      .hero {
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.84);
        padding: 18px;
      }
      .blog-home-list { display: grid; gap: 10px; }
      .blog-controls { display: grid; gap: 10px; margin-bottom: 12px; }
      .search-input {
        width: 100%;
        border: 1px solid var(--line);
        background: rgba(8, 14, 22, 0.72);
        color: var(--text);
        padding: 10px 12px;
        font-size: 13px;
      }
      .search-input::placeholder { color: var(--muted); }
      .combo-group { display: grid; gap: 6px; }
      .combo-label { color: var(--muted); font-size: 11px; letter-spacing: 0.08em; }
      .combo-input {
        width: 100%;
        border: 1px solid var(--line);
        background: rgba(8, 14, 22, 0.72);
        color: var(--text);
        padding: 9px 12px;
        font-size: 13px;
      }
      .combo-input::placeholder { color: var(--muted); }
      .combo-help { margin: 0; color: var(--muted); font-size: 11px; }
      .combo-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .combo-action-btn {
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.8);
        color: #b8dff5;
        padding: 6px 10px;
        font-size: 11px;
        cursor: pointer;
      }
      .combo-action-btn:hover { border-color: var(--sky); color: var(--sky); }
      .home-result-count { margin: 0; color: var(--muted); font-size: 12px; }
      .post-card { border: 1px solid var(--line); background: rgba(8, 14, 22, 0.72); padding: 14px; display: grid; gap: 8px; }
      .post-cover {
        width: 100%;
        max-height: 220px;
        object-fit: cover;
        border: 1px solid rgba(38, 56, 76, 0.75);
      }
      .post-title-btn {
        border: 0;
        background: transparent;
        color: var(--text);
        font-size: 22px;
        text-align: left;
        padding: 0;
        cursor: pointer;
      }
      .post-title-btn:hover { color: var(--sky); }
      .post-meta { margin: 0; color: var(--muted); font-size: 12px; }
      .post-excerpt { margin: 0; color: #dce8f5; line-height: 1.6; }
      .blog-post { display: grid; gap: 12px; }
      .post-kicker { margin: 0; color: var(--coral); font-size: 11px; letter-spacing: 0.12em; }
      .tags { display: flex; flex-wrap: wrap; gap: 8px; }
      .tag { border: 1px solid var(--line); background: rgba(8, 14, 22, 0.72); color: var(--amber); padding: 4px 8px; font-size: 11px; }
      .tag-clickable { cursor: pointer; }
      .detail-cover {
        width: 100%;
        max-height: 340px;
        object-fit: cover;
        border: 1px solid rgba(38, 56, 76, 0.75);
      }
      .image-links {
        border: 1px dashed rgba(147, 168, 188, 0.45);
        background: rgba(8, 14, 22, 0.4);
        padding: 10px;
      }
      .image-links p { margin: 0 0 8px; color: var(--muted); font-size: 12px; }
      .image-links ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
      .image-links a { color: var(--sky); text-decoration: underline; text-underline-offset: 2px; }
      .home-empty {
        border: 1px dashed rgba(147, 168, 188, 0.45);
        background: rgba(8, 14, 22, 0.4);
        color: var(--muted);
        padding: 16px;
        font-size: 13px;
      }
      .detail-layout { display: grid; gap: 12px; }
      @media (min-width: 1040px) {
        .detail-layout { grid-template-columns: 280px 1fr; }
      }
      .toc-side {
        border: 1px solid var(--line);
        background: rgba(8, 14, 22, 0.82);
        padding: 12px;
      }
      @media (min-width: 1040px) {
        .toc-side { position: sticky; top: 16px; max-height: calc(100vh - 40px); overflow: auto; }
      }
      .toc-side-list { display: grid; gap: 8px; }
      .toc-side-link {
        border: 1px solid rgba(38, 56, 76, 0.75);
        background: rgba(11, 22, 33, 0.8);
        color: #b8dff5;
        text-decoration: none;
        padding: 6px 8px;
        font-size: 12px;
      }
      .toc-side-link.active {
        color: var(--amber);
        border-color: rgba(255, 184, 48, 0.75);
      }
      .blog-reading-note {
        margin: 0;
        border: 1px solid rgba(56, 189, 248, 0.35);
        background: rgba(56, 189, 248, 0.08);
        color: #d6ecff;
        padding: 10px;
        font-size: 12px;
        line-height: 1.6;
      }
      .blog-section {
        border: 1px solid rgba(38, 56, 76, 0.75);
        background: rgba(8, 14, 22, 0.55);
        padding: 12px;
        display: grid;
        gap: 10px;
      }
      .blog-section-heading {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--sky);
        font-size: 16px;
      }
      .section-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: var(--amber);
        font-size: 12px;
        background: rgba(11, 22, 33, 0.8);
      }
      .section-points {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 8px;
      }
      .section-points li {
        font-size: 14px;
        line-height: 1.7;
        color: #dce8f5;
      }
      .section-points li::marker {
        color: var(--amber);
      }
      .signal-list { margin: 0; padding-left: 18px; display: grid; gap: 6px; color: #dce8f5; font-size: 13px; }
      .signal-list strong { color: var(--coral); }
      .muted { margin: 0; font-size: 13px; color: var(--muted); }
      .footer { color: var(--sky); font-size: 13px; }
      .hidden { display: none !important; }
      .export-hint { color: var(--muted); font-size: 11px; }
      .back-top {
        position: fixed;
        right: 16px;
        bottom: 16px;
        border: 1px solid var(--line);
        background: rgba(11, 22, 33, 0.9);
        color: var(--text);
        padding: 8px 11px;
        cursor: pointer;
        display: none;
      }
      a { color: var(--sky); }
      @media print {
        .toc-panel,
        .toc-side,
        .back-top { display: none !important; }
        body { background: #fff; color: #111; padding: 0; }
        .panel,
        .hero,
        .post-card,
        .toc-side,
        .blog-post { border-color: #999; background: #fff; color: #111; }
        .blog-section p,
        .section-points li,
        .post-excerpt,
        .signal-list,
        .post-meta,
        .muted,
        .footer { color: #222 !important; }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <section class="panel toc-panel" id="toc">
        <div class="action-list">
          <button id="blog-home-btn" class="action-link" type="button">Trang Chủ Blog</button>
          <button id="blog-back-list-btn" class="action-link hidden" type="button">Quay Lại Danh Sách</button>
        </div>
        <div>
          <button id="blog-export-pdf-btn" class="blog-action" type="button">Export Blog PDF</button>
          <p class="export-hint">Xuất PDF từ trang đang mở trong blog (Home hoặc Detail).</p>
        </div>
      </section>

      <section class="hero" id="overview">
          <p class="sub">// BUG WAR ROOM KNOWLEDGE BLOG</p>
          <h1>Engineering Notes Từ Bug War Room</h1>
          <p class="sub">Trang chủ hiển thị danh sách bài viết. Chọn bài để mở trang chi tiết và dùng mục lục bên cạnh để nhảy nhanh giữa các đề mục.</p>
      </section>

      <section id="blog-home" class="panel">
        <h2>Bài Viết Mới Nhất</h2>
        <div class="blog-controls">
          <input id="blog-search-input" class="search-input" type="search" placeholder="Tìm theo tiêu đề, mô tả, nội dung, tác giả hoặc tag..." />
          <div class="combo-group">
            <label class="combo-label" for="blog-tag-combobox">FILTER TAG (COMBOBOX - CÓ THỂ GÕ ĐỂ TÌM)</label>
            <input id="blog-tag-combobox" class="combo-input" list="blog-tag-options" placeholder="Ví dụ: rollback, incident, observability..." />
            <datalist id="blog-tag-options"></datalist>
            <div class="combo-actions">
              <button id="blog-clear-tag-filter-btn" type="button" class="combo-action-btn">Xóa Lọc Tag</button>
              <button id="blog-reset-all-filter-btn" type="button" class="combo-action-btn">Reset Tất Cả Lọc</button>
            </div>
            <p class="combo-help">Bấm vào ô để gõ đè tag cũ ngay. Nhấn <strong>Esc</strong> để xóa nhanh lọc tag.</p>
          </div>
          <div class="combo-group">
            <label class="combo-label" for="blog-sort-combobox">SORT (COMBOBOX)</label>
            <input id="blog-sort-combobox" class="combo-input" list="blog-sort-options" placeholder="newest" value="newest" />
            <datalist id="blog-sort-options">
              <option value="newest"></option>
              <option value="oldest"></option>
              <option value="read-long"></option>
              <option value="read-short"></option>
              <option value="title-az"></option>
              <option value="title-za"></option>
            </datalist>
            <p class="combo-help">Giá trị hỗ trợ: <strong>newest</strong>, <strong>oldest</strong>, <strong>read-long</strong>, <strong>read-short</strong>, <strong>title-az</strong>, <strong>title-za</strong>.</p>
          </div>
          <p id="blog-home-result-count" class="home-result-count"></p>
        </div>
        <div id="blog-home-list" class="blog-home-list"></div>
      </section>

      <section id="blog-detail" class="panel hidden">
        <div class="detail-layout">
          <aside class="toc-side">
            <h3>Mục Lục Bài Viết</h3>
            <div id="blog-detail-toc" class="toc-side-list"></div>
          </aside>
          <article id="blog-detail-content" class="blog-post"></article>
        </div>
      </section>

      <section class="panel" id="recent-signals">
        <h2>Recent Signals From Your Run</h2>
        <ul id="blog-signal-list" class="signal-list"></ul>
        <p id="blog-signal-empty" class="muted hidden">Chưa có signal nào từ run hiện tại.</p>
      </section>

      <section class="panel footer" id="play-link">
        Play at <a href="${PUBLIC_SHARE_URL}" target="_blank" rel="noopener noreferrer">${PUBLIC_SHARE_URL}</a>
      </section>
    </div>
    <button id="blog-back-to-top" class="back-top" type="button">Back to top</button>
  </body>
</html>`

  try {
    blogTab.document.open()
    blogTab.document.write(html)
    blogTab.document.close()

    const homeSection = blogTab.document.getElementById('blog-home') as HTMLElement | null
    const homeList = blogTab.document.getElementById('blog-home-list') as HTMLElement | null
    const detailSection = blogTab.document.getElementById('blog-detail') as HTMLElement | null
    const detailToc = blogTab.document.getElementById('blog-detail-toc') as HTMLElement | null
    const detailContent = blogTab.document.getElementById('blog-detail-content') as HTMLElement | null
    const searchInput = blogTab.document.getElementById('blog-search-input') as HTMLInputElement | null
    const tagCombobox = blogTab.document.getElementById('blog-tag-combobox') as HTMLInputElement | null
    const tagOptions = blogTab.document.getElementById('blog-tag-options') as HTMLDataListElement | null
    const sortCombobox = blogTab.document.getElementById('blog-sort-combobox') as HTMLInputElement | null
    const clearTagFilterBtn = blogTab.document.getElementById('blog-clear-tag-filter-btn') as HTMLButtonElement | null
    const resetAllFilterBtn = blogTab.document.getElementById('blog-reset-all-filter-btn') as HTMLButtonElement | null
    const homeResultCount = blogTab.document.getElementById('blog-home-result-count') as HTMLElement | null
    const signalList = blogTab.document.getElementById('blog-signal-list') as HTMLElement | null
    const signalEmpty = blogTab.document.getElementById('blog-signal-empty') as HTMLElement | null
    const homeBtn = blogTab.document.getElementById('blog-home-btn') as HTMLButtonElement | null
    const backListBtn = blogTab.document.getElementById('blog-back-list-btn') as HTMLButtonElement | null

    let currentSectionIds: string[] = []
    let searchKeyword = ''
    let activeTagQuery = ''
    let activeSortMode = 'newest'

    const allTags = Array.from(new Set(
      bugWarRoomBlogPosts.flatMap((post) => post.tags.map((tag) => tag.trim())).filter((tag) => tag.length > 0),
    )).sort((a, b) => a.localeCompare(b, 'vi'))

    const syncTagOptions = (): void => {
      if (!tagOptions) {
        return
      }

      const optionsHtml = [
        '<option value="all"></option>',
        ...allTags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`),
      ]
      tagOptions.innerHTML = optionsHtml.join('')
    }

    const normalizeSearchText = (value: string): string => {
      return value
        .toLocaleLowerCase('vi')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    }

    const parseDateScore = (value: string): number => {
      const ts = Date.parse(value)
      return Number.isNaN(ts) ? 0 : ts
    }

    const getSortedPosts = (posts: typeof bugWarRoomBlogPosts) => {
      const sorted = [...posts]

      sorted.sort((a, b) => {
        if (activeSortMode === 'oldest') {
          return parseDateScore(a.publishedAt) - parseDateScore(b.publishedAt)
        }

        if (activeSortMode === 'read-long') {
          return b.readMinutes - a.readMinutes
        }

        if (activeSortMode === 'read-short') {
          return a.readMinutes - b.readMinutes
        }

        if (activeSortMode === 'title-az') {
          return a.title.localeCompare(b.title, 'vi')
        }

        if (activeSortMode === 'title-za') {
          return b.title.localeCompare(a.title, 'vi')
        }

        return parseDateScore(b.publishedAt) - parseDateScore(a.publishedAt)
      })

      return sorted
    }

    const getFilteredPosts = () => {
      const keyword = normalizeSearchText(searchKeyword)

      const filtered = bugWarRoomBlogPosts.filter((post) => {
        if (activeTagQuery && !post.tags.some((tag) => normalizeSearchText(tag).includes(activeTagQuery))) {
          return false
        }

        if (!keyword) {
          return true
        }

        const textToSearch = normalizeSearchText([
          post.title,
          post.excerpt,
          post.author,
          post.tags.join(' '),
          post.sections.map((section) => `${section.heading} ${section.paragraphs.join(' ')}`).join(' '),
        ].join(' '))

        return textToSearch.includes(keyword)
      })

      return getSortedPosts(filtered)
    }

    const renderSignals = (): void => {
      if (!signalList || !signalEmpty) {
        return
      }

      const entries = filteredLearningJournal.value.slice(0, 4)
      if (entries.length === 0) {
        signalList.innerHTML = ''
        signalEmpty.classList.remove('hidden')
        return
      }

      signalEmpty.classList.add('hidden')
      signalList.innerHTML = entries.map((entry) => {
        return `<li><strong>${escapeHtml(entry.severity)}</strong> - ${escapeHtml(entry.note)} (${escapeHtml(entry.createdAt)})</li>`
      }).join('')
    }

    const renderHome = (): void => {
      if (!homeSection || !homeList || !detailSection || !backListBtn) {
        return
      }

      homeSection.classList.remove('hidden')
      detailSection.classList.add('hidden')
      backListBtn.classList.add('hidden')
      currentSectionIds = []

      const filteredPosts = getFilteredPosts()
      if (homeResultCount) {
        const suffix = filteredPosts.length === bugWarRoomBlogPosts.length && !searchKeyword && !activeTagQuery
          ? `${filteredPosts.length} bài`
          : `${filteredPosts.length}/${bugWarRoomBlogPosts.length} bài phù hợp`
        homeResultCount.textContent = suffix
      }

      if (filteredPosts.length === 0) {
        homeList.innerHTML = '<div class="home-empty">Không tìm thấy bài viết phù hợp. Hãy thử từ khóa khác hoặc bỏ lọc tag.</div>'
        return
      }

      homeList.innerHTML = filteredPosts.map((post) => {
        const coverImageHtml = post.coverImageUrl
          ? `<img class="post-cover" src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.coverImageAlt ?? post.title)}" loading="lazy" />`
          : ''
        const tagsHtml = post.tags.map((tag) => `<button type="button" class="tag tag-clickable" data-filter-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')
        return `<article class="post-card">
          <p class="post-kicker">BUG WAR ROOM BLOG</p>
          ${coverImageHtml}
          <button type="button" class="post-title-btn" data-blog-slug="${escapeHtml(post.slug)}">${escapeHtml(post.title)}</button>
          <p class="post-meta">Tác giả: ${escapeHtml(post.author)} • Ngày đăng: ${escapeHtml(post.publishedAt)}${post.updatedAt ? ` • Cập nhật: ${escapeHtml(post.updatedAt)}` : ''} • ${post.readMinutes} phút đọc</p>
          <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="tags">${tagsHtml}</div>
        </article>`
      }).join('')
    }

    const updateActiveTocLink = (): void => {
      if (!detailToc || currentSectionIds.length === 0 || detailSection?.classList.contains('hidden')) {
        return
      }

      let activeId = currentSectionIds[0]
      for (const id of currentSectionIds) {
        const section = blogTab.document.getElementById(id)
        if (!section) {
          continue
        }

        const top = section.getBoundingClientRect().top
        if (top <= 140) {
          activeId = id
        }
      }

      detailToc.querySelectorAll('.toc-side-link').forEach((node) => {
        node.classList.remove('active')
      })
      const activeLink = detailToc.querySelector(`[data-target="${activeId}"]`)
      if (activeLink) {
        activeLink.classList.add('active')
      }
    }

    const renderDetail = (slug: string): void => {
      if (!homeSection || !detailSection || !detailToc || !detailContent || !backListBtn) {
        return
      }

      const post = bugWarRoomBlogPosts.find((item) => item.slug === slug)
      if (!post) {
        renderHome()
        return
      }

      homeSection.classList.add('hidden')
      detailSection.classList.remove('hidden')
      backListBtn.classList.remove('hidden')

      const coverImageHtml = post.coverImageUrl
        ? `<img class="detail-cover" src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.coverImageAlt ?? post.title)}" loading="lazy" />`
        : ''
      const tagsHtml = post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
      const imageLinksHtml = post.imageLinks && post.imageLinks.length > 0
        ? `<div class="image-links">
            <p>Link ảnh tham khảo theo chủ đề bài viết:</p>
            <ul>
              ${post.imageLinks.map((item) => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a></li>`).join('')}
            </ul>
          </div>`
        : ''
      const sectionBlocks = post.sections.map((section, sectionIndex) => {
        const sectionId = `blog-post-${post.slug}-section-${sectionIndex + 1}`
        const paragraphsHtml = section.paragraphs.map((paragraph) => `<li>${escapeHtml(paragraph)}</li>`).join('')
        return `<section class="blog-section" id="${escapeHtml(sectionId)}">
          <h3 class="blog-section-heading">
            <span class="section-index">${sectionIndex + 1}</span>
            <span>${escapeHtml(section.heading)}</span>
          </h3>
          <ol class="section-points">${paragraphsHtml}</ol>
        </section>`
      })

      detailContent.innerHTML = `
        <p class="post-kicker">BUG WAR ROOM BLOG / CHI TIẾT</p>
        <h2>${escapeHtml(post.title)}</h2>
        <p class="post-meta">Tác giả: ${escapeHtml(post.author)} • Ngày đăng: ${escapeHtml(post.publishedAt)}${post.updatedAt ? ` • Cập nhật: ${escapeHtml(post.updatedAt)}` : ''} • ${post.readMinutes} phút đọc</p>
        ${coverImageHtml}
        <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
        <p class="blog-reading-note">Gợi ý đọc nhanh: xem mục lục bên phải để nhảy theo chủ đề, mỗi phần đã tách thành các ý chính để theo dõi dễ hơn.</p>
        <div class="tags">${tagsHtml}</div>
        ${imageLinksHtml}
        ${sectionBlocks.join('')}
      `

      currentSectionIds = post.sections.map((_, sectionIndex) => `blog-post-${post.slug}-section-${sectionIndex + 1}`)
      detailToc.innerHTML = post.sections.map((section, sectionIndex) => {
        const sectionId = `blog-post-${post.slug}-section-${sectionIndex + 1}`
        return `<a href="#${escapeHtml(sectionId)}" data-target="${escapeHtml(sectionId)}" class="toc-side-link">${sectionIndex + 1}. ${escapeHtml(section.heading)}</a>`
      }).join('')

      detailToc.querySelectorAll('.toc-side-link').forEach((node) => {
        node.addEventListener('click', (event) => {
          event.preventDefault()
          const target = (node as HTMLElement).dataset.target
          if (!target) {
            return
          }

          const section = blogTab.document.getElementById(target)
          if (!section) {
            return
          }

          section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })

      updateActiveTocLink()
      blogTab.scrollTo({ top: 0, behavior: 'auto' })
    }

    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        renderHome()
        blogTab.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }

    if (backListBtn) {
      backListBtn.addEventListener('click', () => {
        renderHome()
        blogTab.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }

    if (homeList) {
      homeList.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        const tagFilterTrigger = target.closest('[data-filter-tag]') as HTMLElement | null
        if (tagFilterTrigger) {
          const tag = tagFilterTrigger.dataset.filterTag
          if (tag) {
            activeTagQuery = normalizeSearchText(tag)
            if (tagCombobox) {
              tagCombobox.value = tag
            }
            renderHome()
            blogTab.scrollTo({ top: 0, behavior: 'smooth' })
          }
          return
        }

        const trigger = target.closest('[data-blog-slug]') as HTMLElement | null
        if (!trigger) {
          return
        }

        const slug = trigger.dataset.blogSlug
        if (!slug) {
          return
        }

        renderDetail(slug)
      })
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchKeyword = searchInput.value
        renderHome()
      })
    }

    if (tagCombobox) {
      tagCombobox.addEventListener('focus', () => {
        tagCombobox.select()
      })

      tagCombobox.addEventListener('input', () => {
        const raw = tagCombobox.value.trim()
        const normalized = normalizeSearchText(raw)
        activeTagQuery = normalized === 'all' ? '' : normalized
        renderHome()
      })

      tagCombobox.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
          return
        }

        activeTagQuery = ''
        tagCombobox.value = ''
        renderHome()
      })
    }

    if (sortCombobox) {
      sortCombobox.addEventListener('focus', () => {
        sortCombobox.select()
      })

      sortCombobox.addEventListener('input', () => {
        const mode = normalizeSearchText(sortCombobox.value)
        const acceptedModes = ['newest', 'oldest', 'read-long', 'read-short', 'title-az', 'title-za']
        activeSortMode = acceptedModes.includes(mode) ? mode : 'newest'
        if (!acceptedModes.includes(mode)) {
          sortCombobox.value = 'newest'
        }
        renderHome()
      })
    }

    if (clearTagFilterBtn) {
      clearTagFilterBtn.addEventListener('click', () => {
        activeTagQuery = ''
        if (tagCombobox) {
          tagCombobox.value = ''
        }
        renderHome()
      })
    }

    if (resetAllFilterBtn) {
      resetAllFilterBtn.addEventListener('click', () => {
        activeTagQuery = ''
        searchKeyword = ''
        activeSortMode = 'newest'
        if (tagCombobox) {
          tagCombobox.value = ''
        }
        if (searchInput) {
          searchInput.value = ''
        }
        if (sortCombobox) {
          sortCombobox.value = 'newest'
        }
        renderHome()
      })
    }

    syncTagOptions()

    const exportBtn = blogTab.document.getElementById('blog-export-pdf-btn') as HTMLButtonElement | null
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        blogTab.focus()
        blogTab.print()
      })
    }

    const backTopBtn = blogTab.document.getElementById('blog-back-to-top') as HTMLButtonElement | null
    if (backTopBtn) {
      backTopBtn.addEventListener('click', () => {
        blogTab.scrollTo({ top: 0, behavior: 'smooth' })
      })

      const onBlogScroll = () => {
        backTopBtn.style.display = blogTab.scrollY > 420 ? 'block' : 'none'
        updateActiveTocLink()
      }
      blogTab.addEventListener('scroll', onBlogScroll)
      onBlogScroll()
    }

    renderSignals()
    renderHome()

    pushAlert('Knowledge Blog đã mở ở tab mới.', 'warning')
  } catch {
    blogTab.close()
    shareResultNotice.value = 'Không thể khởi tạo tab Knowledge Blog trên trình duyệt này.'
  }
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
  `SEED ${dailySeedLabel.value}`,
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

const severityWeights: Record<Severity, number> = {
  'SEV-1': 1.35,
  'SEV-2': 1.15,
  'SEV-3': 1,
}

const dailySeedLabel = computed<string>(() => {
  const raw = currentDailySeed.value
  if (raw.length !== 8) {
    return raw
  }

  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
})

const analyzedLogs = computed<AnalyzedLog[]>(() => {
  return logs.value
    .filter((entry) => typeof entry.deltaScore === 'number')
    .map((entry) => {
      const weight = severityWeights[entry.severity] ?? 1
      const weightedDelta = Math.round((entry.deltaScore as number) * weight)
      return {
        ...entry,
        weightedDelta,
      }
    })
})

const bestDecision = computed<AnalyzedLog | null>(() => {
  if (analyzedLogs.value.length === 0) {
    return null
  }

  return analyzedLogs.value.reduce((best, entry) => {
    const bestScoreDelta = best.weightedDelta
    const currentScoreDelta = entry.weightedDelta
    return currentScoreDelta > bestScoreDelta ? entry : best
  })
})

const riskiestDecision = computed<AnalyzedLog | null>(() => {
  if (analyzedLogs.value.length === 0) {
    return null
  }

  return analyzedLogs.value.reduce((worst, entry) => {
    const worstScoreDelta = worst.weightedDelta
    const currentScoreDelta = entry.weightedDelta
    return currentScoreDelta < worstScoreDelta ? entry : worst
  })
})

const postmortemActions = computed<string[]>(() => {
  const actions: string[] = []

  if (metrics.value.chaos >= 70) {
    actions.push('Chaos cuối trận cao: ưu tiên phương án có chaosDelta thấp ở 2 vòng đầu để tránh snowball.')
  }

  if (metrics.value.energy < 50) {
    actions.push('Energy thấp: dùng chiến thuật giảm tải on-call, hạn chế fix nóng liên tục qua nhiều vòng.')
  }

  if (metrics.value.trust < 55) {
    actions.push('Trust giảm sâu: thêm cập nhật trạng thái sớm cho user và stakeholder ở các sự cố SEV-1/SEV-2.')
  }

  if (metrics.value.timeLeft <= 20) {
    actions.push('Time buffer mỏng: chọn giải pháp rollback/feature flag trước, tối ưu dài hạn để sau postmortem.')
  }

  if (actions.length === 0) {
    actions.push('Đội hình đang vận hành tốt. Thử Hardcore + Daily Seed để benchmark chiến lược mới.')
  }

  return actions
})

const currentLearningLevel = computed<number>(() => {
  return Math.floor(careerLearningXp.value / 40) + 1
})

const nextLearningLevelXp = computed<number>(() => {
  return currentLearningLevel.value * 40
})

const learningLevelProgress = computed<number>(() => {
  const start = (currentLearningLevel.value - 1) * 40
  const span = 40
  return Math.max(0, Math.min(100, Math.round(((careerLearningXp.value - start) / span) * 100)))
})

const learningBySeverity = computed<Record<Severity, number>>(() => {
  return learningJournal.value.reduce((acc, item) => {
    acc[item.severity] += 1
    return acc
  }, {
    'SEV-1': 0,
    'SEV-2': 0,
    'SEV-3': 0,
  } as Record<Severity, number>)
})

const learningRecent7dCount = computed<number>(() => {
  const threshold = Date.now() - (7 * 24 * 60 * 60 * 1000)
  return learningJournal.value.filter((entry) => {
    const ts = Number(entry.id.split('-')[0])
    return !Number.isNaN(ts) && ts >= threshold
  }).length
})

const learningMasteryScore = computed<number>(() => {
  const diversityBonus = Object.values(learningBySeverity.value).filter((count) => count > 0).length * 6
  const lessonBonus = Math.min(38, learningJournal.value.length * 3)
  const xpBonus = Math.min(44, Math.round(careerLearningXp.value / 6))
  return Math.min(100, diversityBonus + lessonBonus + xpBonus)
})

const learningFocus = computed<string[]>(() => {
  const items: string[] = []

  if (metrics.value.chaos >= 65) {
    items.push('Chaos cao: luyện quyết định giảm chaos ở early-game.')
  }
  if (metrics.value.energy <= 45) {
    items.push('Energy thấp: ưu tiên phương án giảm áp lực on-call.')
  }
  if (metrics.value.trust <= 55) {
    items.push('Trust yếu: thêm thông điệp cập nhật minh bạch cho user.')
  }
  if (learningBySeverity.value['SEV-1'] < 2) {
    items.push('Nên luyện thêm kịch bản SEV-1 để tăng phản xạ incident lớn.')
  }

  if (items.length === 0) {
    items.push('Đà học đang ổn. Thử Hardcore + Daily Seed để mở rộng kinh nghiệm.')
  }

  return items.slice(0, 4)
})

const filteredLearningJournal = computed<LearningEntry[]>(() => {
  if (learningSeverityFilter.value === 'all') {
    return learningJournal.value
  }

  return learningJournal.value.filter((entry) => entry.severity === learningSeverityFilter.value)
})

const systemSlimeMood = computed<SlimeMood>(() => {
  if (!characterAnimationEnabled.value) {
    return 'slime-idle'
  }

  if (isFinished.value) {
    return campaignScore.value >= 65 ? 'victory' : 'defeat'
  }

  if (metrics.value.chaos >= 85) {
    return 'critical'
  }

  if (metrics.value.chaos >= 65) {
    return 'warning'
  }

  if (metrics.value.energy <= 35) {
    return 'energy-low'
  }

  return 'slime-idle'
})

const activeOverlaySlimeMood = computed<SlimeMood | null>(() => {
  if (!characterAnimationEnabled.value) {
    return null
  }

  if (transientSlimeMood.value) {
    return transientSlimeMood.value
  }

  if (systemSlimeMood.value === 'slime-idle') {
    return null
  }

  return systemSlimeMood.value
})

const slimeIdleAsset = slimeAssetMap['slime-idle']

const currentSlimeOverlayAsset = computed<string>(() => {
  return activeOverlaySlimeMood.value ? slimeAssetMap[activeOverlaySlimeMood.value] : slimeIdleAsset
})

const currentSlimeMoodLabel = computed<string>(() => {
  const labels: Record<SlimeMood, string> = {
    'slime-idle': 'Idle / Quan sát',
    annoyed: 'Annoyed / Bị chọc nhiều quá',
    'click-reaction': 'Click Reaction / Phản hồi thao tác',
    'action-confirm': 'Action Confirm / Đã thực thi lệnh',
    'trust-up': 'Trust Up / User confidence tăng',
    'stability-up': 'Stability Up / Hệ thống ổn định hơn',
    'chaos-up': 'Chaos Up / Áp lực tăng',
    'energy-low': 'Energy Low / Team đang mệt',
    warning: 'Warning / Tình hình nóng',
    critical: 'Critical / Báo động đỏ',
    victory: 'Victory / Chiến dịch thành công',
    defeat: 'Defeat / Cần reset chiến lược',
  }

  return labels[activeOverlaySlimeMood.value ?? 'slime-idle']
})

watch(campaignScore, (value) => {
  if (!isFinished.value) {
    return
  }

  if (value > bestScore.value) {
    bestScore.value = value
    localStorage.setItem('bug-war-room-best-score', String(value))
  }

  if (currentDailySeed.value) {
    const key = dailyBestStorageKey(currentDailySeed.value, mode.value)
    if (value > dailyBestScore.value) {
      dailyBestScore.value = value
      localStorage.setItem(key, String(value))
    }
  }

  persistCurrentRunToDailyLeaderboard()
})

watch(playerAlias, (value) => {
  localStorage.setItem(playerAliasStorageKey, value)
})

watch(characterAnimationEnabled, (value) => {
  localStorage.setItem(characterAnimationStorageKey, value ? '1' : '0')
  if (!value) {
    transientSlimeMood.value = null
  }
})

watch(docsCollapsed, (value) => {
  localStorage.setItem(docsCollapsedStorageKey, value ? '1' : '0')
})

watch(learningCollapsed, (value) => {
  localStorage.setItem(learningCollapsedStorageKey, value ? '1' : '0')
})

watch(actionLogCollapsedMobile, (value) => {
  localStorage.setItem(actionLogCollapsedStorageKey, value ? '1' : '0')
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

  learningJournal.value = parseLearningJournal(localStorage.getItem(learningJournalStorageKey))
  const storedLearningXp = Number(localStorage.getItem(careerLearningXpStorageKey))
  if (!Number.isNaN(storedLearningXp) && storedLearningXp > 0) {
    careerLearningXp.value = storedLearningXp
  }

  const storedAnimation = localStorage.getItem(characterAnimationStorageKey)
  if (storedAnimation === '0') {
    characterAnimationEnabled.value = false
  }

  const storedDocsCollapsed = localStorage.getItem(docsCollapsedStorageKey)
  const storedLearningCollapsed = localStorage.getItem(learningCollapsedStorageKey)
  const storedActionLogCollapsed = localStorage.getItem(actionLogCollapsedStorageKey)
  if (storedDocsCollapsed === '1' || storedDocsCollapsed === '0') {
    docsCollapsed.value = storedDocsCollapsed === '1'
  }

  if (storedLearningCollapsed === '1' || storedLearningCollapsed === '0') {
    learningCollapsed.value = storedLearningCollapsed === '1'
  }

  if (storedActionLogCollapsed === '1' || storedActionLogCollapsed === '0') {
    actionLogCollapsedMobile.value = storedActionLogCollapsed === '1'
  }

  if (window.innerWidth < 640) {
    if (storedDocsCollapsed === null) {
      docsCollapsed.value = true
    }
    if (storedLearningCollapsed === null) {
      learningCollapsed.value = true
    }
    if (storedActionLogCollapsed === null) {
      actionLogCollapsedMobile.value = true
    }
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

  window.addEventListener('scroll', onPageScroll, { passive: true })
  onPageScroll()
})

onBeforeUnmount(() => {
  if (timerHandle) clearInterval(timerHandle)
  if (slimeMoodHandle) clearTimeout(slimeMoodHandle)
  window.removeEventListener('scroll', onPageScroll)
})

resetGame()
</script>

<template>
  <div class="relative min-h-screen bg-bg-deep px-3 py-6 font-body text-text-primary sm:px-6 sm:py-10" :class="{ 'chaos-atmosphere': metrics.chaos >= 70 }">
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
      >
      <span class="hidden sm:inline">Made by <span class="text-accent-amber">TranQui004</span></span>
    </a>

    <!-- Chaos Alerts Toast Stack -->
    <div class="fixed right-2 top-12 z-50 flex flex-col gap-2 sm:right-6 sm:top-20">
      <transition-group name="alert-slide">
        <div
          v-for="alert in chaosAlerts"
          :key="alert.id"
          class="alert-toast max-w-[88vw] border px-3 py-2 font-display text-[11px] tracking-wider shadow-lg sm:max-w-sm sm:px-4 sm:py-3 sm:text-xs"
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
            <h1 class="mt-2 font-display text-2xl font-bold sm:text-5xl">Bug War Room</h1>
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

        <div class="control-wrap relative z-10 mt-4 flex flex-wrap gap-2">
          <div class="setting-item">
            <button
              type="button"
              class="border px-3 py-2 text-xs font-display tracking-wider transition-colors"
              :disabled="!canChangeMode"
              :class="mode === 'normal' ? 'border-accent-amber bg-accent-amber/10 text-accent-amber' : 'border-border-default text-text-secondary hover:text-text-primary disabled:opacity-50'"
              @click="mode = 'normal'; resetGame()"
            >
              NORMAL
            </button>
            <span class="info-tip">
              <button type="button" class="info-tip-button" aria-label="Giải thích Normal mode">?</button>
              <span class="info-tip-panel">Normal: nhịp chơi cân bằng hơn, thời gian và energy khởi điểm cao hơn để làm quen chiến thuật.</span>
            </span>
          </div>

          <div class="setting-item">
            <button
              type="button"
              class="border px-3 py-2 text-xs font-display tracking-wider transition-colors"
              :disabled="!canChangeMode"
              :class="mode === 'hardcore' ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' : 'border-border-default text-text-secondary hover:text-text-primary disabled:opacity-50'"
              @click="mode = 'hardcore'; resetGame()"
            >
              HARDCORE
            </button>
            <span class="info-tip">
              <button type="button" class="info-tip-button" aria-label="Giải thích Hardcore mode">?</button>
              <span class="info-tip-panel">Hardcore: ít thời gian và energy hơn, chaos khởi điểm cao hơn. Phù hợp khi đã quen game loop.</span>
            </span>
          </div>

          <div class="border border-border-default bg-bg-deep px-3 py-2 text-xs tracking-wider text-text-secondary">
            Clock: <span class="text-accent-sky">{{ formatClock(missionClockSeconds) }}</span>
          </div>

          <div class="setting-item">
            <button
              type="button"
              class="border px-3 py-2 text-xs font-display tracking-wider transition-colors"
              :disabled="!canChangeMode"
              :class="dailySeedEnabled ? 'border-accent-sky bg-accent-sky/10 text-accent-sky' : 'border-border-default text-text-secondary hover:text-text-primary disabled:opacity-50'"
              @click="dailySeedEnabled = !dailySeedEnabled; resetGame()"
            >
              DAILY SEED {{ dailySeedEnabled ? 'ON' : 'OFF' }}
            </button>
            <span class="info-tip">
              <button type="button" class="info-tip-button" aria-label="Giải thích Daily Seed">?</button>
              <span class="info-tip-panel">Daily Seed ON: mọi người chơi cùng một bộ incident mỗi ngày để so leaderboard công bằng. OFF: run ngẫu nhiên tự do.</span>
            </span>
          </div>

          <div class="setting-item">
            <div class="border border-border-default bg-bg-deep px-3 py-2 text-xs tracking-wider text-text-secondary">
              Seed: <span class="text-accent-amber">{{ dailySeedLabel }}</span>
            </div>
            <span class="info-tip">
              <button type="button" class="info-tip-button" aria-label="Giải thích Seed hiện tại">?</button>
              <span class="info-tip-panel">Mã seed của ngày hiện tại. Seed giống nhau sẽ tạo cùng thứ tự incident và random event khi Daily Seed bật.</span>
            </span>
          </div>

          <div class="setting-item">
            <div class="border border-border-default bg-bg-deep px-3 py-2 text-xs tracking-wider text-text-secondary">
              Daily Best: <span class="text-accent-amber">{{ dailyBestScore }}</span>
            </div>
            <span class="info-tip">
              <button type="button" class="info-tip-button" aria-label="Giải thích Daily Best">?</button>
              <span class="info-tip-panel">Điểm campaign cao nhất của bạn trong ngày với mode hiện tại và seed hiện tại.</span>
            </span>
          </div>

          <div class="setting-item">
            <button
              type="button"
              class="border px-3 py-2 text-xs font-display tracking-wider transition-colors"
              :class="characterAnimationEnabled ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' : 'border-border-default text-text-secondary hover:text-text-primary'"
              @click="characterAnimationEnabled = !characterAnimationEnabled"
            >
              CHARACTER FX {{ characterAnimationEnabled ? 'ON' : 'OFF' }}
            </button>
            <span class="info-tip">
              <button type="button" class="info-tip-button" aria-label="Giải thích Character FX">?</button>
              <span class="info-tip-panel">Character FX: bật/tắt animation của Slime để giảm nhiễu khi tập trung số liệu hoặc cải thiện hiệu năng máy yếu.</span>
            </span>
          </div>
        </div>

        <!-- Metrics Row -->
        <div class="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
          <div class="metric-card col-span-2 border border-border-default bg-bg-deep p-3 sm:col-span-1" :class="{ 'chaos-card-pulse': metrics.chaos >= 70 }">
            <p class="text-xs tracking-widest text-text-dim">CHAOS</p>
            <p class="mt-1 font-display text-2xl" :class="liveMetrics.chaos >= 70 ? 'text-accent-coral' : 'text-text-primary'">{{ liveMetrics.chaos }}</p>
            <p class="mt-1 text-xs" :class="metrics.chaos >= 85 ? 'text-accent-coral font-bold animate-pulse-fast' : 'text-text-secondary'">{{ warState }}</p>
          </div>
        </div>
      </header>

      <!-- Guide + Docs Section -->
      <section class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-5 sm:p-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 class="flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            Hướng Dẫn Nhanh &amp; Docs
          </h2>
          <button
            type="button"
            class="border border-border-default bg-bg-deep px-3 py-1.5 text-[11px] tracking-wider text-text-secondary"
            @click="docsCollapsed = !docsCollapsed"
          >
            {{ docsCollapsed ? 'MỞ TOÀN BỘ DOCS' : 'THU GỌN CHỈ CÒN HƯỚNG DẪN NHANH' }}
          </button>
        </div>

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
          Mặc định hiển thị phần hướng dẫn nhanh. Bấm nút ở trên để mở toàn bộ docs chi tiết.
        </div>

        <div class="collapsible-mobile mt-4" :class="{ 'collapsed-mobile': docsCollapsed }">
          <div class="grid gap-3 lg:grid-cols-2">
            <div class="docs-card border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
              <p class="font-display text-sm text-accent-coral">Chỉ số cốt lõi</p>
              <p class="mt-2"><span class="text-text-primary">Stability</span>: mức ổn định kỹ thuật của hệ thống.</p>
              <p class="mt-1"><span class="text-text-primary">Trust</span>: niềm tin người dùng/doanh nghiệp.</p>
              <p class="mt-1"><span class="text-text-primary">Energy</span>: sức bền của team xử lý sự cố.</p>
              <p class="mt-1"><span class="text-text-primary">Chaos</span>: độ hỗn loạn tổng thể, càng thấp càng tốt.</p>
              <p class="mt-1"><span class="text-text-primary">Time Left</span>: thời gian còn lại của chiến dịch.</p>
            </div>

            <div class="docs-card border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
              <p class="font-display text-sm text-accent-amber">Điều kiện thắng/thua</p>
              <p class="mt-2">Thua ngay nếu <span class="text-text-primary">Chaos = 100</span> hoặc <span class="text-text-primary">Time Left = 0</span>.</p>
              <p class="mt-1">Vượt qua đủ số vòng sẽ vào màn tổng kết chiến dịch.</p>
              <p class="mt-1">Điểm cao khi giữ Stability/Trust/Energy tốt và Chaos thấp.</p>
            </div>
          </div>

          <div class="mt-3 grid gap-3 lg:grid-cols-2">
            <div class="docs-card border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
              <p class="font-display text-sm text-accent-sky">Công thức điểm</p>
              <p class="mt-2">Base Score = <span class="text-accent-amber">(Stability + Trust + Energy + (100 - Chaos)) / 4</span></p>
              <p class="mt-1">Campaign Score = <span class="text-accent-amber">Base Score + Contract Bonus</span> (tối đa 100).</p>
            </div>
            <div class="docs-card border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
              <p class="font-display text-sm text-accent-coral">Thông số nâng cao</p>
              <p class="mt-2"><span class="text-text-primary">Pressure Index</span>: tổng hợp từ Chaos, Stability và Energy để phản ánh mức căng thẳng.</p>
              <p class="mt-1"><span class="text-text-primary">Operation Phase</span>: phase vận hành đổi theo ngưỡng chaos và tiến độ vòng.</p>
              <p class="mt-1"><span class="text-text-primary">Random Event</span>: sự cố phụ có xác suất theo mode và trọng số event.</p>
            </div>
          </div>

          <div class="docs-card mt-3 border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
            <p class="font-display text-sm text-accent-amber">Mẹo nhanh</p>
            <p class="mt-2">Nếu Chaos vượt 70: ưu tiên giảm Chaos trước, kể cả phải hy sinh điểm ngắn hạn.</p>
            <p class="mt-1">Nếu Energy xuống thấp: chọn phương án an toàn vận hành để tránh domino incident.</p>
            <p class="mt-1">Contract Bonus nhỏ nhưng rất hữu ích khi bạn đang sát mốc rank.</p>
          </div>

          <div class="docs-card mt-3 border border-accent-coral/50 bg-accent-coral/10 p-4 text-sm text-text-secondary">
            <p class="font-display text-sm text-accent-coral">Disclaimer - AI-generated Content</p>
            <p class="mt-2">
              Nội dung lesson, gợi ý chiến lược và phân tích trong trang này được sinh bởi AI để phục vụ mô phỏng học tập.
              Thông tin có thể không đầy đủ hoặc không phù hợp mọi ngữ cảnh production thực tế.
            </p>
            <p class="mt-1">
              Vui lòng <span class="text-text-primary">double-check</span> với tài liệu chính thức, runbook nội bộ,
              và ý kiến chuyên gia trước khi áp dụng vào hệ thống thật.
            </p>
          </div>
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

      <section class="section-learning animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-4 sm:p-6">
        <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
          <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
          Learning Progress
        </h2>
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs tracking-widest text-text-dim">LEARNING JOURNAL &amp; XP</p>
          <button
            type="button"
            class="border border-border-default bg-bg-deep px-3 py-1.5 text-[11px] tracking-wider text-text-secondary"
            @click="learningCollapsed = !learningCollapsed"
          >
            {{ learningCollapsed ? 'MỞ LEARNING' : 'THU GỌN LEARNING' }}
          </button>
        </div>
        <div class="collapsible-mobile" :class="{ 'collapsed-mobile': learningCollapsed }">
          <div class="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
            <div class="space-y-3">
              <div class="border border-border-default bg-bg-deep p-4">
                <p class="text-xs tracking-widest text-text-dim">CAREER LEARNING XP</p>
                <p class="mt-1 font-display text-3xl text-accent-amber">{{ careerLearningXp }}</p>
                <p class="mt-2 text-xs text-text-secondary">Level {{ currentLearningLevel }} - Next at {{ nextLearningLevelXp }} XP</p>
                <div class="mt-2 h-1 bg-bg-elevated">
                  <div class="h-1 bg-accent-amber transition-all duration-500" :style="{ width: `${learningLevelProgress}%` }" />
                </div>
              </div>

              <div class="learning-coach border border-accent-sky/35 bg-bg-deep p-4">
                <div class="learning-coach-visual">
                  <img :src="slimeTeachingSvg" alt="Slime Teaching Coach" class="learning-teach-svg">
                </div>
                <p class="mt-2 text-xs tracking-widest text-accent-sky">SLIME COACH / KNOWLEDGE MODE</p>
                <p class="mt-1 text-xs text-text-secondary">
                  Tổng hợp chiến thuật và bài học theo dữ liệu trận hiện tại. Mở tab blog để đọc chi tiết như mini playbook.
                </p>
                <button
                  type="button"
                  class="mt-3 border border-accent-sky bg-accent-sky/10 px-3 py-2 text-[11px] tracking-wider text-accent-sky transition-colors hover:bg-accent-sky/20"
                  @click="openLearningBlog"
                >
                  OPEN KNOWLEDGE BLOG
                </button>
              </div>

              <div class="grid gap-2 sm:grid-cols-2">
                <div class="border border-border-default bg-bg-deep p-3">
                  <p class="text-[10px] tracking-widest text-text-dim">MASTERY SCORE</p>
                  <p class="mt-1 font-display text-2xl text-accent-amber">{{ learningMasteryScore }}</p>
                </div>
                <div class="border border-border-default bg-bg-deep p-3">
                  <p class="text-[10px] tracking-widest text-text-dim">LESSONS / 7 DAYS</p>
                  <p class="mt-1 font-display text-2xl text-accent-sky">{{ learningRecent7dCount }}</p>
                </div>
                <div class="border border-border-default bg-bg-deep p-3">
                  <p class="text-[10px] tracking-widest text-text-dim">SEV-1 LESSONS</p>
                  <p class="mt-1 font-display text-2xl text-accent-coral">{{ learningBySeverity['SEV-1'] }}</p>
                </div>
                <div class="border border-border-default bg-bg-deep p-3">
                  <p class="text-[10px] tracking-widest text-text-dim">TOTAL LESSONS</p>
                  <p class="mt-1 font-display text-2xl text-text-primary">{{ learningJournal.length }}</p>
                </div>
              </div>

              <div class="border border-border-default bg-bg-deep p-3">
                <p class="text-xs tracking-widest text-text-dim">FOCUS GỢI Ý</p>
                <ul class="mt-2 space-y-1 text-xs text-text-secondary">
                  <li v-for="item in learningFocus" :key="item">- {{ item }}</li>
                </ul>
              </div>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-xs tracking-widest text-text-dim">LEARNING JOURNAL</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="border px-2 py-1 text-[10px] tracking-wider"
                    :class="learningSeverityFilter === 'all' ? 'border-accent-amber text-accent-amber bg-accent-amber/10' : 'border-border-default text-text-dim'"
                    @click="learningSeverityFilter = 'all'"
                  >
                    ALL
                  </button>
                  <button
                    type="button"
                    class="border px-2 py-1 text-[10px] tracking-wider"
                    :class="learningSeverityFilter === 'SEV-1' ? 'border-accent-coral text-accent-coral bg-accent-coral/10' : 'border-border-default text-text-dim'"
                    @click="learningSeverityFilter = 'SEV-1'"
                  >
                    SEV-1
                  </button>
                  <button
                    type="button"
                    class="border px-2 py-1 text-[10px] tracking-wider"
                    :class="learningSeverityFilter === 'SEV-2' ? 'border-accent-amber text-accent-amber bg-accent-amber/10' : 'border-border-default text-text-dim'"
                    @click="learningSeverityFilter = 'SEV-2'"
                  >
                    SEV-2
                  </button>
                  <button
                    type="button"
                    class="border px-2 py-1 text-[10px] tracking-wider"
                    :class="learningSeverityFilter === 'SEV-3' ? 'border-accent-sky text-accent-sky bg-accent-sky/10' : 'border-border-default text-text-dim'"
                    @click="learningSeverityFilter = 'SEV-3'"
                  >
                    SEV-3
                  </button>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-2 text-[10px] tracking-wider text-text-dim">
                <span class="border border-border-default px-2 py-1">SEV-1 {{ learningBySeverity['SEV-1'] }}</span>
                <span class="border border-border-default px-2 py-1">SEV-2 {{ learningBySeverity['SEV-2'] }}</span>
                <span class="border border-border-default px-2 py-1">SEV-3 {{ learningBySeverity['SEV-3'] }}</span>
              </div>

              <div v-if="filteredLearningJournal.length > 0" class="mt-3 space-y-2">
                <div
                  v-for="entry in filteredLearningJournal.slice(0, 8)"
                  :key="entry.id"
                  class="border border-border-default bg-bg-surface px-3 py-2"
                >
                  <p class="text-xs text-accent-amber">{{ entry.severity }} • {{ entry.note }}</p>
                  <p class="mt-1 text-[11px] text-text-dim">{{ entry.title }} • {{ entry.createdAt }}</p>
                  <p class="mt-1 text-xs text-text-secondary">{{ entry.lesson }}</p>
                </div>
              </div>
              <p v-else class="mt-2 text-xs text-text-dim">Không có lesson cho bộ lọc hiện tại. Thử chuyển filter hoặc chơi thêm vòng.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section-mission animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 sm:p-6">
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

      <!-- Game Content -->
      <section class="section-game-content grid gap-5 lg:grid-cols-[1.35fr_1fr]">
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
              class="choice-card w-full border border-border-default bg-bg-deep p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-l-4 hover:border-l-accent-coral hover:bg-bg-elevated sm:p-4"
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
          <p class="mt-1 font-display text-4xl sm:text-5xl" :class="scoreTone">{{ campaignScore }}</p>
          <p class="mt-2 text-xs text-text-dim">Base {{ score }} + Bonus {{ missionBonus }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <p class="inline-flex border border-accent-sky bg-accent-sky/10 px-2 py-1 font-display text-xs tracking-widest text-accent-sky">
              {{ campaignRank }}
            </p>
            <p class="inline-flex border border-accent-amber bg-accent-amber/10 px-2 py-1 font-display text-xs tracking-widest text-accent-amber">
              DAILY SEED {{ dailySeedLabel }}
            </p>
          </div>
          <p class="mt-4 text-sm text-text-primary">{{ verdict }}</p>
          <div class="mt-4 border border-border-default bg-bg-deep p-3 text-xs text-text-secondary">
            Chaos kết thúc: <span class="text-text-primary">{{ metrics.chaos }}</span>
            | Thời gian còn lại: <span class="text-text-primary">{{ metrics.timeLeft }}m</span>
            | Streak cuối: <span class="text-text-primary">x{{ streak }}</span>
            | Best score: <span class="text-accent-amber">{{ bestScore }}</span>
            | Daily best: <span class="text-accent-sky">{{ dailyBestScore }}</span>
          </div>

          <div class="mt-4 border border-border-default bg-bg-deep p-4 text-sm text-text-secondary">
            <p class="font-display text-xs tracking-widest text-accent-sky">// POSTMORTEM CHI TIẾT</p>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div class="border border-border-default bg-bg-surface p-3">
                <p class="text-xs tracking-widest text-text-dim">BEST DECISION</p>
                <p class="mt-1 text-text-primary">{{ bestDecision?.action || 'Chưa có dữ liệu' }}</p>
                <p class="mt-1 text-xs text-text-dim">{{ bestDecision?.incident || '-' }}</p>
                <p class="mt-2 text-xs text-accent-amber">Impact delta: {{ bestDecision?.deltaScore ?? '-' }} (weighted: {{ bestDecision?.weightedDelta ?? '-' }})</p>
              </div>
              <div class="border border-border-default bg-bg-surface p-3">
                <p class="text-xs tracking-widest text-text-dim">RISKIEST DECISION</p>
                <p class="mt-1 text-text-primary">{{ riskiestDecision?.action || 'Chưa có dữ liệu' }}</p>
                <p class="mt-1 text-xs text-text-dim">{{ riskiestDecision?.incident || '-' }}</p>
                <p class="mt-2 text-xs text-accent-coral">Impact delta: {{ riskiestDecision?.deltaScore ?? '-' }} (weighted: {{ riskiestDecision?.weightedDelta ?? '-' }})</p>
              </div>
            </div>

            <div class="mt-3 border border-border-default bg-bg-surface p-3">
              <p class="text-xs tracking-widest text-text-dim">ACTION ITEMS</p>
              <p v-for="item in postmortemActions" :key="item" class="mt-2 text-xs text-text-secondary">
                - {{ item }}
              </p>
            </div>

            <div class="mt-3 border border-border-default bg-bg-surface p-3">
              <p class="text-xs tracking-widest text-text-dim">DAILY SEED LEADERBOARD (TOP 5)</p>
              <div v-if="dailyLeaderboard.length > 0" class="mt-2 space-y-2">
                <p
                  v-for="(entry, index) in dailyLeaderboard"
                  :key="entry.id"
                  class="flex flex-wrap items-center gap-2 border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary sm:flex-nowrap sm:justify-between"
                >
                  <span class="break-all text-text-primary">#{{ index + 1 }} {{ entry.player }}</span>
                  <span class="w-full text-text-dim sm:w-auto sm:text-text-secondary">Score {{ entry.score }} | {{ entry.rank }} | Chaos {{ entry.chaos }}</span>
                </p>
              </div>
              <p v-else class="mt-2 text-xs text-text-dim">Chưa có dữ liệu cho seed hôm nay.</p>
            </div>
          </div>

          <div class="mt-4 border border-border-default bg-bg-deep p-3">
            <div class="flex items-center gap-1.5">
              <label class="text-[11px] tracking-widest text-text-dim">TÊN CỦA BẠN TRƯỚC KHI SHARE</label>
              <span class="info-tip">
                <button type="button" class="info-tip-button" aria-label="Giải thích tên trước khi share">?</button>
                <span class="info-tip-panel">Tên này sẽ xuất hiện trên share card, leaderboard và file PNG khi bạn export kết quả.</span>
              </span>
            </div>
            <input
              v-model="playerAlias"
              type="text"
              maxlength="40"
              placeholder="Ví dụ: TranQui004"
              class="mt-2 w-full border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-dim focus:border-accent-amber"
            >
          </div>
          <div class="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              class="border border-border-default bg-bg-deep px-4 py-2 text-xs font-display tracking-widest text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
              @click="resetGame"
            >
              CHƠI LẠI
            </button>

            <button
              type="button"
              class="border border-accent-amber bg-accent-amber/10 px-4 py-2 text-xs font-display tracking-widest text-accent-amber transition-colors hover:bg-accent-amber/20"
              @click="copyResult"
            >
              OPEN SHARE CARD
            </button>
          </div>

          <p v-if="shareResultNotice" class="mt-3 text-xs text-accent-amber">{{ shareResultNotice }}</p>
        </article>

        <!-- Right: Slime Operator + Log -->
        <aside class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-6 sm:p-8">
          <h2 class="mb-4 flex items-center gap-3 font-display text-xl font-semibold sm:text-2xl">
            <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
            Slime Operator
          </h2>

          <div class="slime-frame border border-border-default bg-bg-deep p-3">
            <div
              class="slime-clickable w-full"
              role="button"
              tabindex="0"
              aria-label="Kích hoạt slime reaction"
              @pointerdown.capture.prevent="onSlimeOperatorClick"
              @keydown.enter.prevent="onSlimeOperatorClick"
              @keydown.space.prevent="onSlimeOperatorClick"
            >
              <div class="slime-stage">
                <img :src="slimeIdleAsset" alt="Bug War Room Slime Idle" class="slime-layer slime-layer-idle">
                <img
                  :src="currentSlimeOverlayAsset"
                  alt="Bug War Room Slime Reaction"
                  class="slime-layer slime-layer-overlay"
                  :class="{ 'slime-layer-visible': !!activeOverlaySlimeMood }"
                >
              </div>
            </div>
            <div class="slime-preload" aria-hidden="true">
              <img v-for="asset in slimeOverlayAssets" :key="asset" :src="asset" alt="">
            </div>
          </div>

          <div class="mt-3 border border-border-default bg-bg-deep p-3">
            <p class="text-xs tracking-widest text-text-dim">CURRENT ANIMATION</p>
            <p class="mt-1 font-display text-sm text-accent-amber sm:text-base">{{ currentSlimeMoodLabel }}</p>
            <p class="mt-1 text-xs text-text-secondary sm:text-sm">
              Trạng thái slime phản ánh chaos, energy và action gần nhất trong trận hiện tại.
            </p>
            <p class="mt-2 text-xs text-text-dim">Character FX: {{ characterAnimationEnabled ? 'ON' : 'OFF' }}</p>
            <p class="mt-1 text-[11px] text-text-dim">
              Animation Credits: Bộ Slime animated SVG được thiết kế bởi
              <span class="text-accent-amber">TranQui004</span>.
            </p>
          </div>

          <!-- Action Log -->
          <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-display text-sm tracking-widest text-accent-sky">// ACTION LOG</h3>
            <button
              type="button"
              class="border border-border-default bg-bg-deep px-3 py-1.5 text-[11px] tracking-wider text-text-secondary sm:hidden"
              @click="actionLogCollapsedMobile = !actionLogCollapsedMobile"
            >
              {{ actionLogCollapsedMobile ? 'MỞ LOG' : 'THU GỌN LOG' }}
            </button>
          </div>

          <div class="collapsible-mobile mt-3" :class="{ 'collapsed-mobile': actionLogCollapsedMobile }">
            <div class="action-log-scroll max-h-80 space-y-3 overflow-y-auto" v-if="logs.length > 0">
              <div
                v-for="(entry, index) in logs"
                :key="entry.incident + index.toString()"
                class="action-log-entry border border-border-default bg-bg-deep p-3"
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

            <p v-else class="border border-dashed border-border-default p-4 text-sm text-text-dim">
              Chưa có hành động nào. Chọn phương án ở khung bên trái để bắt đầu.
            </p>
          </div>
        </aside>
      </section>

      <!-- Footer -->
      <footer class="animate-fade-up animate-delay-4 flex flex-wrap items-center justify-between gap-4 border border-border-default bg-bg-surface p-4 sm:p-5">
        <p class="text-xs text-text-secondary sm:text-sm">
          Tip: Khi chaos vượt 70, ưu tiên giảm chaos ngay cả khi mất trust ngắn hạn. Cẩn thận random event!
        </p>
        <p class="w-full text-[11px] text-text-dim sm:w-auto sm:max-w-xl">
          Disclaimer: Nội dung học tập/khuyến nghị trên trang được AI tạo tự động, chỉ mang tính tham khảo.
          Luôn xác minh lại bằng nguồn đáng tin cậy trước khi áp dụng thực tế.
        </p>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-4 py-2 text-xs font-display tracking-widest text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
        >
          <span aria-hidden="true">&larr;</span>
          VỀ TRANG CHỦ
        </RouterLink>
      </footer>

      <button
        v-if="showBackToTop"
        type="button"
        class="fixed bottom-4 right-4 z-50 border border-border-default bg-bg-surface/95 px-3 py-2 text-xs tracking-wider text-text-primary backdrop-blur transition-colors hover:border-accent-amber hover:text-accent-amber"
        @click="scrollPageToTop"
      >
        BACK TO TOP
      </button>
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

.slime-frame {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slime-stage {
  position: relative;
  width: 100%;
  max-width: 280px;
  height: 260px;
  margin: 0 auto;
}

.slime-layer {
  position: absolute;
  top: 50%;
  left: calc(50% + 1.2%);
  transform: translate(-50%, -50%);
  max-width: 280px;
  width: 100%;
  height: auto;
  image-rendering: auto;
}

.slime-layer-overlay {
  opacity: 0;
  transition: opacity 0.08s linear;
  pointer-events: none;
}

.slime-layer-visible {
  opacity: 1;
}

.slime-clickable {
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.slime-clickable:active {
  transform: scale(0.99);
}

.slime-preload {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.slime-preload img {
  width: 1px;
  height: 1px;
}

.learning-coach {
  position: relative;
  overflow: hidden;
}

.learning-coach::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.12), transparent 64%);
  pointer-events: none;
}

.learning-coach-visual {
  position: relative;
  z-index: 1;
  min-height: 140px;
  display: grid;
  place-items: center;
}

.learning-teach-svg {
  width: min(100%, 220px);
  height: auto;
}

.control-wrap > * {
  flex-shrink: 0;
}

.setting-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  position: relative;
}

.info-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.info-tip-button {
  width: 1.1rem;
  height: 1.1rem;
  border: 1px solid rgba(149, 166, 184, 0.45);
  background: rgba(15, 25, 35, 0.9);
  color: #95a6b8;
  font-size: 0.65rem;
  line-height: 1;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: help;
}

.info-tip-button:hover,
.info-tip-button:focus-visible {
  color: #ffb830;
  border-color: rgba(255, 184, 48, 0.7);
  outline: none;
}

.info-tip-panel {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.42rem);
  transform: translate(-50%, 6px);
  min-width: 220px;
  max-width: 300px;
  border: 1px solid rgba(149, 166, 184, 0.34);
  background: rgba(9, 16, 24, 0.97);
  color: #d6e2ef;
  padding: 0.45rem 0.55rem;
  font-size: 0.67rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  pointer-events: none;
  opacity: 0;
  z-index: 35;
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.info-tip:hover .info-tip-panel,
.info-tip:focus-within .info-tip-panel {
  opacity: 1;
  transform: translate(-50%, 0);
}

.info-tip-panel::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: rgba(9, 16, 24, 0.97) transparent transparent transparent;
}

.section-game-content {
  order: 2;
}

.section-learning {
  order: 3;
}

.section-mission {
  order: 4;
}

.section-docs {
  order: 5;
}

.collapsible-mobile {
  overflow: hidden;
  transition: max-height 0.28s ease, opacity 0.28s ease;
  max-height: 2200px;
  opacity: 1;
}

.collapsed-mobile {
  max-height: 0;
  opacity: 0;
}

.chaos-card-pulse {
  animation: chaos-pulse 1.2s ease-in-out infinite;
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

@media (max-width: 640px) {
  .control-wrap > * {
    width: 100%;
  }

  .setting-item {
    width: 100%;
    justify-content: space-between;
  }

  .info-tip-panel {
    left: auto;
    right: 0;
    transform: translate(0, 6px);
    max-width: min(82vw, 320px);
  }

  .info-tip:hover .info-tip-panel,
  .info-tip:focus-within .info-tip-panel {
    transform: translate(0, 0);
  }

  .info-tip-panel::after {
    left: auto;
    right: 0.35rem;
    transform: none;
  }

  .docs-panel {
    padding: 0.9rem;
  }

  .docs-card {
    padding: 0.75rem;
  }

  .slime-frame {
    min-height: 180px;
    padding: 0.75rem;
  }

  .slime-stage {
    max-width: 200px;
    height: 180px;
  }

  .slime-layer {
    max-width: 200px;
  }

  .learning-coach-visual {
    min-height: 120px;
  }

  .learning-teach-svg {
    width: min(100%, 170px);
  }

  .action-log-scroll {
    max-height: 14rem;
  }

  .action-log-entry {
    padding: 0.65rem;
  }

  .collapsible-mobile {
    max-height: 2800px;
  }
}

@media (max-width: 480px) {
  .ticker-shell {
    padding: 0.55rem 0;
  }

  .ticker-track {
    animation-duration: 22s;
  }

  .hero-glow {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track,
  .hero-glow,
  .header-chaos-glow,
  .chaos-card-pulse,
  .animate-pulse-fast {
    animation: none !important;
  }
}
</style>
