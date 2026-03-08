<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  incidents,
  maxRoundsByMode,
  randomEventChanceByMode,
  randomEvents,
  severityPressureByLevel,
} from './data'
import { buildShareText, openShareCard, PUBLIC_SHARE_URL } from './share'
import type {
  ChaosAlert,
  Choice,
  DailyLeaderboardEntry,
  GameMode,
  Incident,
  LearningEntry,
  Metrics,
  RandomEvent,
  ResultHistoryEntry,
  RoundLog,
  Severity,
  SharePayload,
} from './types'
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
import { createAnimationCatalogItems } from './utils/animationCatalog'
import type { AnimationCatalogItem } from './utils/animationCatalog'
import { hydrateLearningBlogPopup } from './utils/blogPopup'
import { hydrateAnimationCatalogPopup } from './utils/animationPopup'
import {
  buildDailySeed,
  clamp,
  createLearningLesson,
  createSeededRandom,
  dailyBestStorageKey,
  dailyLeaderboardStorageKey,
  formatClock,
  hashSeed,
  impactLabel,
  parseDailyLeaderboard,
  parseLearningJournal,
  parseResultHistory,
  parseShareDraft,
  severityClass,
  upsertDailyLeaderboardEntry,
} from './utils/stateUtils'
import { bugWarRoomStorageKeys, bugWarRoomStoragePrefixes } from './utils/storageKeys'
import { useBugWarRoomComputed } from './composables/useBugWarRoomComputed'

type LearningSeverityFilter = 'all' | Severity
type UiFocusMode = 'full' | 'minimal'

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
const uiFocusMode = ref<UiFocusMode>('full')
const tacticalPanelCollapsed = ref<boolean>(false)
const postmortemCollapsed = ref<boolean>(false)
const resultHistory = ref<ResultHistoryEntry[]>([])
const resultHistoryCollapsed = ref<boolean>(false)
const historyPersistedForRun = ref<boolean>(false)

const playerAliasStorageKey = bugWarRoomStorageKeys.playerAlias
const shareDraftStorageKey = bugWarRoomStorageKeys.shareDraft
const shareDraftAtStorageKey = bugWarRoomStorageKeys.shareDraftAt
const characterAnimationStorageKey = bugWarRoomStorageKeys.characterAnimationEnabled
const docsCollapsedStorageKey = bugWarRoomStorageKeys.docsCollapsed
const actionLogCollapsedStorageKey = bugWarRoomStorageKeys.actionLogCollapsedMobile
const learningJournalStorageKey = bugWarRoomStorageKeys.learningJournal
const careerLearningXpStorageKey = bugWarRoomStorageKeys.careerLearningXp
const learningCollapsedStorageKey = bugWarRoomStorageKeys.learningCollapsed
const uiFocusModeStorageKey = bugWarRoomStorageKeys.uiFocusMode
const tacticalPanelCollapsedStorageKey = bugWarRoomStorageKeys.tacticalPanelCollapsed
const postmortemCollapsedStorageKey = bugWarRoomStorageKeys.postmortemCollapsed
const resultHistoryStorageKey = bugWarRoomStorageKeys.resultHistory
const resultHistoryCollapsedStorageKey = bugWarRoomStorageKeys.resultHistoryCollapsed
const blogUiStateStorageKey = bugWarRoomStorageKeys.blogUiState
const slimeSpamWindowMs = 950
const slimeSpamAnnoyedThreshold = 6
const slimeClickReactionDurationMs = 3200
const slimeAnnoyedDurationMs = 1200
const resultHistoryLimit = 40
const repoIssueBugUrl = 'https://github.com/J2TEAM/vibe.j2team.org/issues/new?template=bug_report.md'
const repoIssueFeatureUrl = 'https://github.com/J2TEAM/vibe.j2team.org/issues/new?template=feature_request.md'
const repoForkUrl = 'https://github.com/J2TEAM/vibe.j2team.org/fork'
const repoContributingUrl = 'https://github.com/J2TEAM/vibe.j2team.org/blob/main/CONTRIBUTING.md'

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

const animationCatalogItems: AnimationCatalogItem[] = createAnimationCatalogItems({
  slimeSpamWindowMs,
  slimeSpamAnnoyedThreshold,
  slimeClickReactionDurationMs,
  assets: {
    slimeIdleSvg,
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
    slimeTeachingSvg,
  },
})

const clickReactionWaitSeconds = Math.ceil(slimeClickReactionDurationMs / 1000)

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

  const sorted = upsertDailyLeaderboardEntry(dailyLeaderboard.value, entry, 5)

  dailyLeaderboard.value = sorted
  localStorage.setItem(dailyLeaderboardStorageKey(currentDailySeed.value, mode.value), JSON.stringify(sorted))
  leaderboardPersisted.value = true
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
  historyPersistedForRun.value = false
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

function onPageScroll(): void {
  showBackToTop.value = window.scrollY > 360
}

function scrollPageToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openPopupRoute(mode: 'knowledge-blog' | 'animation-catalog' | 'share-card'): Window | null {
  const popupUrl = new URL(window.location.href)
  popupUrl.searchParams.set('bugWarRoomPopup', mode)
  return window.open(popupUrl.toString(), '_blank')
}


function buildCurrentSharePayload(): SharePayload {
  return {
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
}

function persistResultHistoryEntry(payload: SharePayload, missionBonusFromPayload: number): void {
  const entry: ResultHistoryEntry = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    payload,
    missionBonus: missionBonusFromPayload,
  }

  resultHistory.value = [entry, ...resultHistory.value].slice(0, resultHistoryLimit)
  localStorage.setItem(resultHistoryStorageKey, JSON.stringify(resultHistory.value))
}

async function exportSharePayload(payload: SharePayload, missionBonusFromPayload: number): Promise<void> {
  const message = buildShareText(payload, missionBonusFromPayload)

  try {
    localStorage.setItem(shareDraftStorageKey, JSON.stringify(payload))
    localStorage.setItem(shareDraftAtStorageKey, String(Date.now()))

    const opened = Boolean(openPopupRoute('share-card'))
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

function addCurrentRunToHistoryIfNeeded(): void {
  if (!isFinished.value || historyPersistedForRun.value) {
    return
  }

  const payload = buildCurrentSharePayload()
  persistResultHistoryEntry(payload, missionBonus.value)
  historyPersistedForRun.value = true
}

async function exportHistoryEntry(entry: ResultHistoryEntry): Promise<void> {
  await exportSharePayload(entry.payload, entry.missionBonus)
}

async function copyHistoryEntryText(entry: ResultHistoryEntry): Promise<void> {
  const message = buildShareText(entry.payload, entry.missionBonus)
  if (!navigator.clipboard?.writeText) {
    shareResultNotice.value = 'Trình duyệt không hỗ trợ clipboard cho thao tác này.'
    setTimeout(() => {
      shareResultNotice.value = ''
    }, 3000)
    return
  }

  await navigator.clipboard.writeText(message)
  shareResultNotice.value = 'Đã copy báo cáo kết quả cũ vào clipboard.'
  setTimeout(() => {
    shareResultNotice.value = ''
  }, 3000)
}

function clearAllRuntimeDataKeepHistory(): void {
  const ok = window.confirm('Xóa toàn bộ dữ liệu chơi hiện tại và cài đặt? Lịch sử kết quả sẽ được giữ nguyên.')
  if (!ok) {
    return
  }

  const exactKeysToRemove = [
    bugWarRoomStorageKeys.bestScore,
    playerAliasStorageKey,
    shareDraftStorageKey,
    shareDraftAtStorageKey,
    characterAnimationStorageKey,
    docsCollapsedStorageKey,
    actionLogCollapsedStorageKey,
    learningJournalStorageKey,
    careerLearningXpStorageKey,
    learningCollapsedStorageKey,
    blogUiStateStorageKey,
    uiFocusModeStorageKey,
    tacticalPanelCollapsedStorageKey,
    postmortemCollapsedStorageKey,
    resultHistoryCollapsedStorageKey,
  ]

  for (const key of exactKeysToRemove) {
    localStorage.removeItem(key)
  }

  const prefixKeysToRemove = [
    bugWarRoomStoragePrefixes.dailyBest,
    bugWarRoomStoragePrefixes.dailyLeaderboard,
  ]

  const allKeys = Object.keys(localStorage)
  for (const key of allKeys) {
    if (prefixKeysToRemove.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key)
    }
  }

  bestScore.value = 0
  dailyBestScore.value = 0
  dailyLeaderboard.value = []
  playerAlias.value = ''
  learningJournal.value = []
  careerLearningXp.value = 0
  learningSeverityFilter.value = 'all'
  characterAnimationEnabled.value = true
  mode.value = 'normal'
  dailySeedEnabled.value = true
  uiFocusMode.value = window.innerWidth < 640 ? 'minimal' : 'full'
  docsCollapsed.value = window.innerWidth < 640
  learningCollapsed.value = window.innerWidth < 640
  actionLogCollapsedMobile.value = window.innerWidth < 640
  tacticalPanelCollapsed.value = window.innerWidth < 640
  postmortemCollapsed.value = window.innerWidth < 640
  resultHistoryCollapsed.value = window.innerWidth < 640
  shareResultNotice.value = ''

  resetGame()
  pushAlert('Đã xóa toàn bộ dữ liệu chơi. Lịch sử kết quả vẫn được giữ.', 'warning')
}

function clearAllResultHistory(): void {
  const ok = window.confirm('Xóa toàn bộ lịch sử kết quả? Hành động này không thể hoàn tác.')
  if (!ok) {
    return
  }

  resultHistory.value = []
  localStorage.removeItem(resultHistoryStorageKey)
  pushAlert('Đã xóa toàn bộ lịch sử kết quả.', 'critical')
}

async function copyResult(): Promise<void> {
  await exportSharePayload(buildCurrentSharePayload(), missionBonus.value)
}

function openLearningBlog(): void {
  const opened = openPopupRoute('knowledge-blog')
  if (!opened) {
    shareResultNotice.value = 'Không mở được tab Knowledge Blog. Hãy cho phép pop-up và thử lại.'
    return
  }

  pushAlert('Knowledge Blog đã mở ở tab mới.', 'warning')
}

function hydrateLearningBlog(targetTab?: Window): void {
  hydrateLearningBlogPopup({
    targetTab,
    popupSourceWindow: window,
    posts: bugWarRoomBlogPosts,
    signals: filteredLearningJournal.value.map((entry) => ({
      severity: entry.severity,
      note: entry.note,
      createdAt: entry.createdAt,
    })),
    blogUiStateStorageKey,
    publicShareUrl: PUBLIC_SHARE_URL,
    onBlocked: () => {
      shareResultNotice.value = 'Không mở được tab Knowledge Blog. Hãy cho phép pop-up và thử lại.'
    },
    onInitError: () => {
      shareResultNotice.value = 'Không thể khởi tạo tab Knowledge Blog trên trình duyệt này.'
    },
  })
}

function openAnimationCatalog(): void {
  const opened = openPopupRoute('animation-catalog')
  if (!opened) {
    shareResultNotice.value = 'Không mở được tab Animation Catalog. Hãy cho phép pop-up và thử lại.'
    return
  }

  pushAlert('Animation Catalog đã mở ở tab mới.', 'warning')
}

function hydrateAnimationCatalog(targetTab?: Window): void {
  hydrateAnimationCatalogPopup({
    targetTab,
    popupSourceWindow: window,
    items: animationCatalogItems,
    onBlocked: () => {
      shareResultNotice.value = 'Không mở được tab Animation Catalog. Hãy cho phép pop-up và thử lại.'
    },
    onInitError: () => {
      shareResultNotice.value = 'Không thể khởi tạo tab Animation Catalog trên trình duyệt này.'
    },
  })
}

const slimeIdleAsset = slimeAssetMap['slime-idle']

const {
  currentIncident,
  maxRounds,
  isFinished,
  liveMetrics,
  score,
  missionContract,
  missionBonus,
  campaignScore,
  campaignRank,
  verdict,
  scoreTone,
  warState,
  isMinimalFocus,
  priorityHeadline,
  priorityChecklist,
  chaosGlowIntensity,
  incomingCount,
  modeLabel,
  feedMessage,
  canChangeMode,
  tickerItems,
  canContinue,
  operationPhase,
  pressureIndex,
  frontlineStatus,
  dailySeedLabel,
  bestDecision,
  riskiestDecision,
  postmortemActions,
  currentLearningLevel,
  nextLearningLevelXp,
  learningLevelProgress,
  learningBySeverity,
  learningRecent7dCount,
  learningMasteryScore,
  learningFocus,
  filteredLearningJournal,
  currentSlimeAsset,
  currentSlimeMoodLabel,
} = useBugWarRoomComputed({
  mode,
  round,
  deck,
  metrics,
  streak,
  logs,
  telemetryTick,
  missionClockSeconds,
  showRandomEvent,
  uiFocusMode,
  learningJournal,
  learningSeverityFilter,
  careerLearningXp,
  characterAnimationEnabled,
  transientSlimeMood,
  currentDailySeed,
  fallbackIncident,
  slimeAssetMap,
  slimeIdleAsset,
})

watch(campaignScore, (value) => {
  if (!isFinished.value) {
    return
  }

  if (value > bestScore.value) {
    bestScore.value = value
    localStorage.setItem(bugWarRoomStorageKeys.bestScore, String(value))
  }

  if (currentDailySeed.value) {
    const key = dailyBestStorageKey(currentDailySeed.value, mode.value)
    if (value > dailyBestScore.value) {
      dailyBestScore.value = value
      localStorage.setItem(key, String(value))
    }
  }

  persistCurrentRunToDailyLeaderboard()
  addCurrentRunToHistoryIfNeeded()
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

watch(uiFocusMode, (value) => {
  localStorage.setItem(uiFocusModeStorageKey, value)

  if (value === 'minimal') {
    docsCollapsed.value = true
    learningCollapsed.value = true
    tacticalPanelCollapsed.value = true
    postmortemCollapsed.value = true
    if (window.innerWidth < 640) {
      actionLogCollapsedMobile.value = true
    }
  }
})

watch(tacticalPanelCollapsed, (value) => {
  localStorage.setItem(tacticalPanelCollapsedStorageKey, value ? '1' : '0')
})

watch(postmortemCollapsed, (value) => {
  localStorage.setItem(postmortemCollapsedStorageKey, value ? '1' : '0')
})

watch(resultHistoryCollapsed, (value) => {
  localStorage.setItem(resultHistoryCollapsedStorageKey, value ? '1' : '0')
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
  const stored = Number(localStorage.getItem(bugWarRoomStorageKeys.bestScore))
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
  const storedFocusMode = localStorage.getItem(uiFocusModeStorageKey)
  const storedTacticalPanelCollapsed = localStorage.getItem(tacticalPanelCollapsedStorageKey)
  const storedPostmortemCollapsed = localStorage.getItem(postmortemCollapsedStorageKey)
  const storedResultHistoryCollapsed = localStorage.getItem(resultHistoryCollapsedStorageKey)

  resultHistory.value = parseResultHistory(localStorage.getItem(resultHistoryStorageKey))

  if (storedFocusMode === 'full' || storedFocusMode === 'minimal') {
    uiFocusMode.value = storedFocusMode
  }

  if (storedDocsCollapsed === '1' || storedDocsCollapsed === '0') {
    docsCollapsed.value = storedDocsCollapsed === '1'
  }

  if (storedLearningCollapsed === '1' || storedLearningCollapsed === '0') {
    learningCollapsed.value = storedLearningCollapsed === '1'
  }

  if (storedActionLogCollapsed === '1' || storedActionLogCollapsed === '0') {
    actionLogCollapsedMobile.value = storedActionLogCollapsed === '1'
  }

  if (storedTacticalPanelCollapsed === '1' || storedTacticalPanelCollapsed === '0') {
    tacticalPanelCollapsed.value = storedTacticalPanelCollapsed === '1'
  }

  if (storedPostmortemCollapsed === '1' || storedPostmortemCollapsed === '0') {
    postmortemCollapsed.value = storedPostmortemCollapsed === '1'
  }

  if (storedResultHistoryCollapsed === '1' || storedResultHistoryCollapsed === '0') {
    resultHistoryCollapsed.value = storedResultHistoryCollapsed === '1'
  }

  if (window.innerWidth < 640) {
    if (storedFocusMode === null) {
      uiFocusMode.value = 'minimal'
    }
    if (storedDocsCollapsed === null) {
      docsCollapsed.value = true
    }
    if (storedLearningCollapsed === null) {
      learningCollapsed.value = true
    }
    if (storedActionLogCollapsed === null) {
      actionLogCollapsedMobile.value = true
    }
    if (storedTacticalPanelCollapsed === null) {
      tacticalPanelCollapsed.value = true
    }
    if (storedPostmortemCollapsed === null) {
      postmortemCollapsed.value = true
    }
    if (storedResultHistoryCollapsed === null) {
      resultHistoryCollapsed.value = true
    }
  }

  if (uiFocusMode.value === 'minimal') {
    docsCollapsed.value = true
    learningCollapsed.value = true
    tacticalPanelCollapsed.value = true
    postmortemCollapsed.value = true
  }

  const shareDraftAt = Number(localStorage.getItem(shareDraftAtStorageKey))
  const oneHour = 60 * 60 * 1000
  if (!Number.isNaN(shareDraftAt) && Date.now() - shareDraftAt > oneHour) {
    localStorage.removeItem(shareDraftStorageKey)
    localStorage.removeItem(shareDraftAtStorageKey)
  }

  const popupMode = new URLSearchParams(window.location.search).get('bugWarRoomPopup')
  if (popupMode === 'knowledge-blog') {
    setTimeout(() => {
      hydrateLearningBlog(window)
    }, 0)
    return
  }

  if (popupMode === 'animation-catalog') {
    setTimeout(() => {
      hydrateAnimationCatalog(window)
    }, 0)
    return
  }

  if (popupMode === 'share-card') {
    const draftPayload = parseShareDraft(localStorage.getItem(shareDraftStorageKey))
    if (!draftPayload) {
      window.document.body.innerHTML = '<div style="font-family:Segoe UI,Tahoma,sans-serif;padding:20px;background:#0f1923;color:#f3f6fa;">Không tìm thấy dữ liệu share card. Hãy quay lại game và mở lại share card.</div>'
      return
    }

    const missionBonusFromDraft = Math.max(0, draftPayload.campaignScore - draftPayload.rawScore)
    const messageFromDraft = buildShareText(draftPayload, missionBonusFromDraft)

    setTimeout(() => {
      openShareCard({
        payload: draftPayload,
        message: messageFromDraft,
        draftKey: shareDraftStorageKey,
        draftAtKey: shareDraftAtStorageKey,
      }, window)
    }, 0)
    return
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
      <div v-if="!isMinimalFocus" class="ticker-shell animate-fade-up border border-border-default bg-bg-surface text-xs tracking-wider text-text-secondary">
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
          <div class="setting-item setting-item-focus">
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
              :class="uiFocusMode === 'full' ? 'border-accent-sky bg-accent-sky/10 text-accent-sky' : 'border-border-default text-text-secondary hover:text-text-primary'"
              @click="uiFocusMode = 'full'"
            >
              VIEW FULL
            </button>
            <button
              type="button"
              class="border px-3 py-2 text-xs font-display tracking-wider transition-colors"
              :class="uiFocusMode === 'minimal' ? 'border-accent-amber bg-accent-amber/10 text-accent-amber' : 'border-border-default text-text-secondary hover:text-text-primary'"
              @click="uiFocusMode = 'minimal'"
            >
              VIEW MINIMAL
            </button>
            <span class="info-tip">
              <button type="button" class="info-tip-button" aria-label="Giải thích Focus View">?</button>
              <span class="info-tip-panel">Minimal sẽ thu gọn các panel phụ để tập trung vào chỉ số chính, incident hiện tại và quyết định cần chọn.</span>
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

        <div class="priority-strip relative z-10 mt-4 border border-accent-coral/45 bg-bg-deep/85 p-3 sm:p-4">
          <p class="text-[11px] tracking-[0.14em] text-accent-coral">// PRIORITY BRIEF</p>
          <p class="mt-1 text-sm text-text-primary sm:text-base">{{ priorityHeadline }}</p>
          <p
            v-for="item in priorityChecklist"
            :key="item"
            class="mt-1 text-xs text-text-secondary sm:text-sm"
          >
            - {{ item }}
          </p>
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
            class="border border-border-default bg-bg-deep px-3 py-1.5 text-[11px] tracking-wider"
            :class="isMinimalFocus ? 'cursor-not-allowed text-text-dim opacity-70' : 'text-text-secondary'"
            :disabled="isMinimalFocus"
            @click="docsCollapsed = !docsCollapsed"
          >
            {{ isMinimalFocus ? 'MINIMAL MODE: GIỮ CHẾ ĐỘ QUICK GUIDE' : (docsCollapsed ? 'MỞ TOÀN BỘ DOCS' : 'THU GỌN CHỈ CÒN HƯỚNG DẪN NHANH') }}
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

      <div class="animate-fade-up animate-delay-2 flex flex-wrap items-center justify-between gap-2 border border-border-default bg-bg-surface p-3">
        <p class="font-display text-xs tracking-[0.14em] text-accent-sky">// TACTICAL PANELS</p>
        <button
          type="button"
          class="border border-border-default bg-bg-deep px-3 py-1.5 text-[11px] tracking-wider text-text-secondary"
          @click="tacticalPanelCollapsed = !tacticalPanelCollapsed"
        >
          {{ tacticalPanelCollapsed ? 'MỞ PHÂN TÍCH CHIẾN THUẬT' : 'THU GỌN PHÂN TÍCH CHIẾN THUẬT' }}
        </button>
      </div>

      <section
        class="collapsible-mobile animate-fade-up animate-delay-2 grid gap-3 lg:grid-cols-3"
        :class="{ 'collapsed-mobile': tacticalPanelCollapsed }"
      >
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
                  title="Mở Knowledge Blog ở tab mới"
                  aria-label="Mở Knowledge Blog ở tab mới"
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

          <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border border-border-default bg-bg-deep px-3 py-2">
            <p class="font-display text-xs tracking-widest text-accent-sky">// POSTMORTEM CHI TIẾT</p>
            <button
              type="button"
              class="border border-border-default bg-bg-surface px-3 py-1.5 text-[11px] tracking-wider text-text-secondary"
              @click="postmortemCollapsed = !postmortemCollapsed"
            >
              {{ postmortemCollapsed ? 'MỞ POSTMORTEM CHI TIẾT' : 'THU GỌN POSTMORTEM' }}
            </button>
          </div>

          <div class="collapsible-mobile mt-3 border border-border-default bg-bg-deep p-4 text-sm text-text-secondary" :class="{ 'collapsed-mobile': postmortemCollapsed }">
            <div class="grid gap-3 md:grid-cols-2">
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
              title="Bắt đầu lại một chiến dịch mới"
              aria-label="Chơi lại chiến dịch"
              @click="resetGame"
            >
              CHƠI LẠI
            </button>

            <button
              type="button"
              class="border border-accent-amber bg-accent-amber/10 px-4 py-2 text-xs font-display tracking-widest text-accent-amber transition-colors hover:bg-accent-amber/20"
              title="Mở tab share card và xuất PNG"
              aria-label="Mở share card"
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
                <img
                  :src="currentSlimeAsset"
                  :alt="`Bug War Room Slime - ${currentSlimeMoodLabel}`"
                  class="slime-layer slime-layer-visible"
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
            <p class="mt-1 text-[11px] text-accent-sky">
              Click reaction note: sau mỗi lần click vào Slime Operator, nên chờ khoảng {{ clickReactionWaitSeconds }} giây để animation hiển thị trọn vẹn.
            </p>
            <p class="mt-1 text-[11px] text-text-dim">
              Animation Credits: Bộ Slime animated SVG được thiết kế bởi
              <span class="text-accent-amber">TranQui004</span>.
            </p>
            <button
              type="button"
              class="mt-3 border border-accent-sky bg-accent-sky/10 px-3 py-2 text-[11px] tracking-wider text-accent-sky transition-colors hover:bg-accent-sky/20"
              title="Mở trang tổng hợp toàn bộ animation đã dùng"
              aria-label="Mở animation catalog"
              @click="openAnimationCatalog"
            >
              OPEN ANIMATION CATALOG
            </button>
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
        <div class="w-full border border-border-default bg-bg-deep p-3 text-[11px] text-text-secondary sm:max-w-3xl">
          <p class="font-display tracking-[0.08em] text-accent-sky">// BÁO LỖI HOẶC ĐÓNG GÓP KHI ĐANG CHƠI</p>
          <p class="mt-1">Nếu phát hiện lỗi hoặc muốn đề xuất cải tiến, dùng các đường dẫn sau:</p>
          <p class="mt-1">
            Bug report:
            <a :href="repoIssueBugUrl" target="_blank" rel="noopener noreferrer" class="text-accent-sky underline underline-offset-2">{{ repoIssueBugUrl }}</a>
          </p>
          <p class="mt-1">
            Feature request:
            <a :href="repoIssueFeatureUrl" target="_blank" rel="noopener noreferrer" class="text-accent-sky underline underline-offset-2">{{ repoIssueFeatureUrl }}</a>
          </p>
          <p class="mt-1">
            Fork để commit/PR:
            <a :href="repoForkUrl" target="_blank" rel="noopener noreferrer" class="text-accent-amber underline underline-offset-2">{{ repoForkUrl }}</a>
          </p>
          <p class="mt-1">
            Hướng dẫn đóng góp:
            <a :href="repoContributingUrl" target="_blank" rel="noopener noreferrer" class="text-accent-amber underline underline-offset-2">{{ repoContributingUrl }}</a>
          </p>
        </div>
        <div class="w-full border border-border-default bg-bg-deep p-3 text-[11px] text-text-secondary sm:max-w-3xl">
          <p class="font-display tracking-[0.08em] text-accent-coral">// DATA CONTROLS</p>
          <p class="mt-1">Dọn toàn bộ dữ liệu chơi/cài đặt để bắt đầu mới, nhưng vẫn giữ lịch sử kết quả.</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="border border-accent-coral bg-accent-coral/10 px-3 py-2 text-[11px] tracking-wider text-accent-coral transition-colors hover:bg-accent-coral/20"
              title="Xóa toàn bộ dữ liệu chơi và cài đặt nhưng giữ lại lịch sử kết quả"
              aria-label="Xóa toàn bộ dữ liệu chơi"
              @click="clearAllRuntimeDataKeepHistory"
            >
              RESET GAME DATA (KEEP HISTORY)
            </button>
          </div>
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-4 py-2 text-xs font-display tracking-widest text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
        >
          <span aria-hidden="true">&larr;</span>
          VỀ TRANG CHỦ
        </RouterLink>
      </footer>

      <section class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-4 sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="flex items-center gap-3 font-display text-lg font-semibold sm:text-xl">
            <span class="font-display text-xs tracking-widest text-accent-amber">//</span>
            Lịch Sử Kết Quả
          </h2>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="border border-border-default bg-bg-deep px-3 py-1.5 text-[11px] tracking-wider text-text-secondary"
              @click="resultHistoryCollapsed = !resultHistoryCollapsed"
            >
              {{ resultHistoryCollapsed ? 'MỞ LỊCH SỬ' : 'THU GỌN LỊCH SỬ' }}
            </button>
            <button
              v-if="resultHistory.length > 0"
              type="button"
              class="border border-accent-coral bg-accent-coral/10 px-3 py-1.5 text-[11px] tracking-wider text-accent-coral transition-colors hover:bg-accent-coral/20"
              @click="clearAllResultHistory"
            >
              XÓA TOÀN BỘ LỊCH SỬ
            </button>
          </div>
        </div>

        <p class="mt-2 text-xs text-text-dim">Lịch sử lưu kết quả campaign trước đây để bạn xem lại và export lại share card bất cứ lúc nào.</p>

        <div class="collapsible-mobile mt-3" :class="{ 'collapsed-mobile': resultHistoryCollapsed }">
          <div v-if="resultHistory.length === 0" class="border border-dashed border-border-default bg-bg-deep p-3 text-xs text-text-dim">
            Chưa có lịch sử kết quả. Hoàn thành một campaign để hệ thống tự lưu vào đây.
          </div>

          <div v-else class="space-y-2">
            <article
              v-for="entry in resultHistory"
              :key="entry.id"
              class="border border-border-default bg-bg-deep p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-display text-xs tracking-widest text-accent-amber">
                  {{ entry.payload.generatedAt }}
                </p>
                <p class="text-xs text-text-secondary">
                  {{ entry.payload.mode }} / {{ entry.payload.dailySeed }}
                </p>
              </div>
              <p class="mt-1 text-sm text-text-primary">
                {{ entry.payload.player }} - {{ entry.payload.rank }} - Score {{ entry.payload.campaignScore }}
              </p>
              <p class="mt-1 text-xs text-text-dim">
                Base {{ entry.payload.rawScore }} + Bonus {{ entry.missionBonus }} | Chaos {{ entry.payload.chaos }} | Time {{ entry.payload.timeLeft }}m | {{ entry.payload.rounds }}
              </p>
              <p class="mt-1 text-xs text-text-secondary">{{ entry.payload.verdict }}</p>

              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="border border-accent-amber bg-accent-amber/10 px-3 py-1.5 text-[11px] tracking-wider text-accent-amber transition-colors hover:bg-accent-amber/20"
                  @click="exportHistoryEntry(entry)"
                >
                  EXPORT SHARE CARD
                </button>
                <button
                  type="button"
                  class="border border-border-default bg-bg-surface px-3 py-1.5 text-[11px] tracking-wider text-text-secondary transition-colors hover:border-accent-sky hover:text-accent-sky"
                  @click="copyHistoryEntryText(entry)"
                >
                  COPY REPORT TEXT
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <button
        v-if="showBackToTop"
        type="button"
        class="fixed bottom-4 right-4 z-50 border border-border-default bg-bg-surface/95 px-3 py-2 text-xs tracking-wider text-text-primary backdrop-blur transition-colors hover:border-accent-amber hover:text-accent-amber"
        title="Cuộn về đầu trang"
        aria-label="Cuộn về đầu trang"
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

.priority-strip {
  box-shadow: inset 0 0 0 1px rgba(255, 107, 74, 0.16);
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

.setting-item-focus {
  flex-wrap: wrap;
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

  .setting-item-focus {
    justify-content: flex-start;
    gap: 0.45rem;
  }

  .setting-item-focus .info-tip {
    margin-left: auto;
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
