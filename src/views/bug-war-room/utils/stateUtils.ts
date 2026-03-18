import type {
  Choice,
  DailyLeaderboardEntry,
  GameMode,
  LearningEntry,
  ResultHistoryEntry,
  Severity,
  SharePayload,
} from '../types'
import { bugWarRoomStoragePrefixes } from './storageKeys'

export function parseLearningJournal(raw: string | null): LearningEntry[] {
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

export function createLearningLesson(choice: Choice, severity: Severity): string {
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

export function buildDailySeed(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  return `${y}${m}${d}`
}

export function hashSeed(text: string): number {
  let hash = 2166136261
  for (const ch of text) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createSeededRandom(seed: number): () => number {
  let state = seed || 1
  return () => {
    state += 0x6D2B79F5
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function dailyBestStorageKey(seed: string, gameMode: GameMode): string {
  return `${bugWarRoomStoragePrefixes.dailyBest}${seed}-${gameMode}`
}

export function dailyLeaderboardStorageKey(seed: string, gameMode: GameMode): string {
  return `${bugWarRoomStoragePrefixes.dailyLeaderboard}${seed}-${gameMode}`
}

export function upsertDailyLeaderboardEntry(
  entries: DailyLeaderboardEntry[],
  entry: DailyLeaderboardEntry,
  limit = 5,
): DailyLeaderboardEntry[] {
  const merged = [
    entry,
    ...entries.filter((item) => item.id !== entry.id),
  ]

  return merged.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    if (a.chaos !== b.chaos) {
      return a.chaos - b.chaos
    }
    return b.timeLeft - a.timeLeft
  }).slice(0, limit)
}

export function parseDailyLeaderboard(raw: string | null): DailyLeaderboardEntry[] {
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

export function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function impactLabel(choice: Choice): string {
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

export function severityClass(severity: Severity): string {
  if (severity === 'SEV-1') {
    return 'text-accent-coral border-accent-coral bg-accent-coral/10'
  }

  if (severity === 'SEV-2') {
    return 'text-accent-amber border-accent-amber bg-accent-amber/10'
  }

  return 'text-accent-sky border-accent-sky bg-accent-sky/10'
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds)
  const mm = Math.floor(safe / 60)
  const ss = safe % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

export function jitter(base: number, phase: number, amplitude: number, isFinished: boolean): number {
  if (isFinished) {
    return base
  }

  const wave = Math.sin(phase / 4)
  return clamp(base + Math.round(wave * amplitude))
}

export function parseShareDraft(raw: string | null): SharePayload | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as SharePayload
    const valid = typeof parsed?.player === 'string'
      && typeof parsed?.mode === 'string'
      && typeof parsed?.rank === 'string'
      && typeof parsed?.dailySeed === 'string'
      && typeof parsed?.campaignScore === 'number'
      && typeof parsed?.rawScore === 'number'
      && typeof parsed?.bestScore === 'number'
      && typeof parsed?.dailyBestScore === 'number'
      && typeof parsed?.chaos === 'number'
      && typeof parsed?.timeLeft === 'number'
      && typeof parsed?.rounds === 'string'
      && typeof parsed?.state === 'string'
      && typeof parsed?.verdict === 'string'
      && typeof parsed?.generatedAt === 'string'

    return valid ? parsed : null
  } catch {
    return null
  }
}

export function parseResultHistory(raw: string | null): ResultHistoryEntry[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as ResultHistoryEntry[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((entry) => {
      const payload = entry?.payload
      return typeof entry?.id === 'string'
        && typeof entry?.missionBonus === 'number'
        && payload !== null
        && typeof payload === 'object'
        && typeof payload?.player === 'string'
        && typeof payload?.mode === 'string'
        && typeof payload?.rank === 'string'
        && typeof payload?.dailySeed === 'string'
        && typeof payload?.campaignScore === 'number'
        && typeof payload?.rawScore === 'number'
        && typeof payload?.bestScore === 'number'
        && typeof payload?.dailyBestScore === 'number'
        && typeof payload?.chaos === 'number'
        && typeof payload?.timeLeft === 'number'
        && typeof payload?.rounds === 'string'
        && typeof payload?.state === 'string'
        && typeof payload?.verdict === 'string'
        && typeof payload?.generatedAt === 'string'
    })
  } catch {
    return []
  }
}
