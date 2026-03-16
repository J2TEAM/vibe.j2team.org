import type {
  DeployerProfile,
  HourlyScore,
  ReleaseScenario,
  ScoreBreakdown,
  ScoreInput,
  WindowSuggestion,
} from '../types'

const GOLDEN_WINDOWS = [
  { start: 9, end: 11 },
  { start: 14, end: 16 },
  { start: 20, end: 21 },
] as const

const RELEASE_TYPE_WEIGHT: Record<ReleaseScenario['releaseType'], number> = {
  hotfix: -4,
  minor: 4,
  major: -10,
}

const RISK_WEIGHT: Record<ReleaseScenario['riskLevel'], number> = {
  low: 10,
  medium: 3,
  high: -10,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function isGoldenHour(hour: number): boolean {
  return GOLDEN_WINDOWS.some((window) => hour >= window.start && hour <= window.end)
}

function scoreOneDeployer(nowYear: number, deployer: DeployerProfile): number {
  if (!deployer.birthYear) {
    return 0
  }

  const lifePath = (deployer.birthYear + nowYear) % 9
  return lifePath % 2 === 0 ? 6 : 2
}

export function scoreRelease(input: ScoreInput): ScoreBreakdown {
  const reasons: string[] = []
  let score = 50

  const minuteBonus = input.minute <= 15 ? 8 : input.minute <= 30 ? 5 : 1
  score += minuteBonus
  reasons.push(`+${minuteBonus} theo phút hiện tại`)

  if (isGoldenHour(input.hour)) {
    score += 18
    reasons.push('+18 vì đang trong khung giờ đẹp')
  } else {
    score -= 7
    reasons.push('-7 vì chưa vào khung giờ đẹp')
  }

  const deployerBonus =
    input.deployers.length === 0
      ? 0
      : Math.round(
          input.deployers.reduce(
            (sum, deployer) => sum + scoreOneDeployer(input.nowYear, deployer),
            0,
          ) / input.deployers.length,
        )

  if (deployerBonus !== 0) {
    score += deployerBonus
    reasons.push(`${deployerBonus > 0 ? '+' : ''}${deployerBonus} theo thông tin team deploy`)
  }

  score += RELEASE_TYPE_WEIGHT[input.scenario.releaseType]
  reasons.push(
    `${RELEASE_TYPE_WEIGHT[input.scenario.releaseType] > 0 ? '+' : ''}${RELEASE_TYPE_WEIGHT[input.scenario.releaseType]} theo loại release`,
  )

  score += RISK_WEIGHT[input.scenario.riskLevel]
  reasons.push(
    `${RISK_WEIGHT[input.scenario.riskLevel] > 0 ? '+' : ''}${RISK_WEIGHT[input.scenario.riskLevel]} theo mức rủi ro`,
  )

  const testBonus = Math.round((input.scenario.testPassRate - 70) / 3)
  score += testBonus
  reasons.push(`${testBonus > 0 ? '+' : ''}${testBonus} theo test pass rate`)

  const filePenalty = Math.floor(input.scenario.filesChanged / 20)
  if (filePenalty > 0) {
    score -= filePenalty
    reasons.push(`-${filePenalty} do phạm vi thay đổi lớn`)
  }

  if (input.scenario.hasRollbackPlan) {
    score += 8
    reasons.push('+8 vì có rollback plan')
  } else {
    score -= 12
    reasons.push('-12 vì thiếu rollback plan')
  }

  return {
    score: clamp(score, 0, 100),
    reasons,
  }
}

export function buildHourlyScores(baseInput: Omit<ScoreInput, 'hour' | 'minute'>): HourlyScore[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const breakdown = scoreRelease({
      ...baseInput,
      hour,
      minute: 0,
    })

    return { hour, score: breakdown.score }
  })
}

export function topWindows(scores: HourlyScore[], take: number): WindowSuggestion[] {
  return [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((item) => ({
      hour: item.hour,
      label: `${String(item.hour).padStart(2, '0')}:00 - ${String(item.hour).padStart(2, '0')}:59`,
      score: item.score,
    }))
}

export function buildVerdict(score: number): string {
  if (score >= 85) return 'Giờ vàng để release. Team có thể tự tin chốt kèo.'
  if (score >= 70) return 'Có thể release, ưu tiên theo dõi alert trong 30 phút đầu.'
  if (score >= 55) return 'Mức trung tính. Nên giảm phạm vi hoặc chờ khung giờ đẹp hơn.'
  return 'Nên delay và củng cố checklist trước khi lên production.'
}
