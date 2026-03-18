import { computed } from 'vue'
import type { Ref } from 'vue'
import { maxRoundsByMode } from '../data'
import { formatClock } from '../utils/stateUtils'
import type {
  GameMode,
  Incident,
  LearningEntry,
  Metrics,
  RoundLog,
  Severity,
} from '../types'

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

interface AnalyzedLog extends RoundLog {
  weightedDelta: number
}

interface UseBugWarRoomComputedOptions {
  mode: Ref<GameMode>
  round: Ref<number>
  deck: Ref<Incident[]>
  metrics: Ref<Metrics>
  streak: Ref<number>
  logs: Ref<RoundLog[]>
  telemetryTick: Ref<number>
  missionClockSeconds: Ref<number>
  showRandomEvent: Ref<boolean>
  uiFocusMode: Ref<'full' | 'minimal'>
  learningJournal: Ref<LearningEntry[]>
  learningSeverityFilter: Ref<LearningSeverityFilter>
  careerLearningXp: Ref<number>
  characterAnimationEnabled: Ref<boolean>
  transientSlimeMood: Ref<SlimeMood | null>
  currentDailySeed: Ref<string>
  fallbackIncident: Incident
  slimeAssetMap: Record<SlimeMood, string>
  slimeIdleAsset: string
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function useBugWarRoomComputed(options: UseBugWarRoomComputedOptions) {
  const {
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
  } = options

  const currentIncident = computed<Incident>(() => {
    const maxR = maxRoundsByMode[mode.value]
    const index = Math.min(round.value - 1, maxR - 1)
    return deck.value[index] ?? fallbackIncident
  })

  const maxRounds = computed<number>(() => maxRoundsByMode[mode.value])
  const isFinished = computed<boolean>(() => {
    return round.value > maxRounds.value || metrics.value.timeLeft <= 0 || metrics.value.chaos >= 100
  })

  const jitter = (base: number, phase: number, amplitude: number): number => {
    if (isFinished.value) {
      return base
    }

    const wave = Math.sin((telemetryTick.value + phase) / 4)
    return clamp(base + Math.round(wave * amplitude))
  }

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

  const isMinimalFocus = computed<boolean>(() => uiFocusMode.value === 'minimal')

  const priorityHeadline = computed<string>(() => {
    if (metrics.value.chaos >= 85 || metrics.value.timeLeft <= 10) {
      return 'ƯU TIÊN TỨC THÌ: containment và giảm chaos ngay.'
    }

    if (metrics.value.chaos >= 65 || metrics.value.energy <= 40) {
      return 'ƯU TIÊN CAO: hạ áp lực hệ thống và bảo toàn năng lượng team.'
    }

    if (metrics.value.trust <= 55) {
      return 'ƯU TIÊN: củng cố trust bằng thông điệp minh bạch và ổn định nhanh.'
    }

    return 'ƯU TIÊN: giữ nhịp ổn định, tránh quyết định rủi ro không cần thiết.'
  })

  const priorityChecklist = computed<string[]>(() => {
    const items: string[] = []

    if (metrics.value.chaos >= 65) {
      items.push('Chọn phương án có C âm hoặc C thấp để chặn snowball.')
    }

    if (metrics.value.energy <= 45) {
      items.push('Tránh phương án tiêu hao E sâu, ưu tiên phương án cân bằng.')
    }

    if (metrics.value.timeLeft <= 20) {
      items.push('Ưu tiên rollback/feature flag để rút ngắn time-to-mitigate.')
    }

    if (metrics.value.trust <= 55) {
      items.push('Ưu tiên quyết định có T dương để giảm áp lực từ user/stakeholder.')
    }

    if (items.length === 0) {
      items.push('Tiếp tục giữ Chaos thấp và tránh đốt Energy ở các vòng đầu.')
    }

    return items.slice(0, 2)
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

  const dailySeedLabel = computed<string>(() => {
    const raw = currentDailySeed.value
    if (raw.length !== 8) {
      return raw
    }

    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  })

  const severityWeights: Record<Severity, number> = {
    'SEV-1': 1.35,
    'SEV-2': 1.15,
    'SEV-3': 1,
  }

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

  const currentSlimeAsset = computed<string>(() => {
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

  return {
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
    analyzedLogs,
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
    systemSlimeMood,
    activeOverlaySlimeMood,
    currentSlimeAsset,
    currentSlimeMoodLabel,
  }
}
