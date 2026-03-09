import { computed, ref } from 'vue'
import { useClipboard, useNow } from '@vueuse/core'
import type {
  DeployerProfile,
  HistoryItem,
  ReleaseScenario,
  ReleaseType,
  RiskLevel,
} from '../types'
import { buildHourlyScores, buildVerdict, scoreRelease, topWindows } from '../utils/scoring'

function sanitizeBirthYear(value: number | null): number | null {
  if (!value) return null
  if (value < 1950 || value > 2100) return null
  return value
}

export function useDeployAdvisor() {
  const now = useNow({ interval: 1000 })
  const { copy, copied } = useClipboard()

  const deployers = ref<DeployerProfile[]>([{ name: '', birthYear: null }])

  const riskLevel = ref<RiskLevel>('medium')
  const releaseType = ref<ReleaseType>('minor')
  const testPassRate = ref(85)
  const filesChanged = ref(25)
  const hasRollbackPlan = ref(true)

  const scenario = computed<ReleaseScenario>(() => ({
    riskLevel: riskLevel.value,
    releaseType: releaseType.value,
    testPassRate: testPassRate.value,
    filesChanged: filesChanged.value,
    hasRollbackPlan: hasRollbackPlan.value,
  }))

  const validDeployers = computed(() => {
    return deployers.value
      .map((deployer) => ({
        name: deployer.name.trim(),
        birthYear: sanitizeBirthYear(deployer.birthYear),
      }))
      .filter((deployer) => deployer.name.length > 0)
  })

  const currentBreakdown = computed(() => {
    return scoreRelease({
      nowYear: now.value.getFullYear(),
      hour: now.value.getHours(),
      minute: now.value.getMinutes(),
      deployers: validDeployers.value,
      scenario: scenario.value,
    })
  })

  const hourlyScores = computed(() => {
    return buildHourlyScores({
      nowYear: now.value.getFullYear(),
      deployers: validDeployers.value,
      scenario: scenario.value,
    })
  })

  const topThreeWindows = computed(() => topWindows(hourlyScores.value, 3))
  const verdict = computed(() => buildVerdict(currentBreakdown.value.score))
  const currentHour = computed(() => now.value.getHours())

  const nowText = computed(() => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now.value)
  })

  const deploymentBrief = computed(() => {
    const names = validDeployers.value.map((item) => item.name).join(', ') || 'Chưa nhập tên'

    return [
      '# Deployment Brief',
      '',
      `- Time: ${nowText.value}`,
      `- Team deploy: ${names}`,
      `- Score: ${currentBreakdown.value.score}/100`,
      `- Verdict: ${verdict.value}`,
      `- Release type: ${releaseType.value}`,
      `- Risk level: ${riskLevel.value}`,
      `- Test pass rate: ${testPassRate.value}%`,
      `- Files changed: ${filesChanged.value}`,
      `- Rollback plan: ${hasRollbackPlan.value ? 'Yes' : 'No'}`,
      '',
      '## Top windows',
      ...topThreeWindows.value.map((window) => `- ${window.label}: ${window.score}`),
    ].join('\n')
  })

  async function exportBrief(): Promise<void> {
    await copy(deploymentBrief.value)
  }

  function addDeployer(): void {
    deployers.value.push({ name: '', birthYear: null })
  }

  function removeDeployer(index: number): void {
    if (deployers.value.length === 1) return
    deployers.value.splice(index, 1)
  }

  function toHistoryItem(): HistoryItem {
    return {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      deployers: validDeployers.value.map((item) => item.name),
      score: currentBreakdown.value.score,
      releaseType: releaseType.value,
      riskLevel: riskLevel.value,
      hasRollbackPlan: hasRollbackPlan.value,
      filesChanged: filesChanged.value,
      testPassRate: testPassRate.value,
    }
  }

  return {
    now,
    currentHour,
    nowText,
    deployers,
    riskLevel,
    releaseType,
    testPassRate,
    filesChanged,
    hasRollbackPlan,
    currentBreakdown,
    verdict,
    hourlyScores,
    topThreeWindows,
    deploymentBrief,
    copied,
    exportBrief,
    addDeployer,
    removeDeployer,
    toHistoryItem,
  }
}
