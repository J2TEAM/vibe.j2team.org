import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { Incident, Metrics, RoundLog } from '../types'
import { useBugWarRoomComputed } from '../composables/useBugWarRoomComputed'

function buildIncident(): Incident {
  return {
    id: 'inc-1',
    title: 'Gateway timeout spike',
    severity: 'SEV-1',
    context: 'Traffic surge causes elevated error rates.',
    choices: [
      {
        title: 'Enable rate limiting',
        description: 'Contain traffic and stabilize edge.',
        effect: {
          stability: 8,
          trust: 5,
          energy: -3,
          minutes: -6,
          chaos: -10,
        },
      },
    ],
  }
}

describe('useBugWarRoomComputed', () => {
  it('calculates campaign score, rank and verdict with mission bonus', () => {
    const incident = buildIncident()
    const metrics = ref<Metrics>({
      stability: 88,
      trust: 82,
      energy: 67,
      timeLeft: 30,
      chaos: 24,
    })

    const state = useBugWarRoomComputed({
      mode: ref('normal'),
      round: ref(1),
      deck: ref([incident]),
      metrics,
      streak: ref(4),
      logs: ref<RoundLog[]>([]),
      telemetryTick: ref(0),
      missionClockSeconds: ref(180),
      showRandomEvent: ref(false),
      uiFocusMode: ref('full'),
      learningJournal: ref([]),
      learningSeverityFilter: ref('all'),
      careerLearningXp: ref(0),
      characterAnimationEnabled: ref(true),
      transientSlimeMood: ref(null),
      currentDailySeed: ref('20260308'),
      fallbackIncident: incident,
      slimeAssetMap: {
        'slime-idle': '/idle.svg',
        annoyed: '/annoyed.svg',
        'click-reaction': '/click.svg',
        'action-confirm': '/confirm.svg',
        'trust-up': '/trust.svg',
        'stability-up': '/stability.svg',
        'chaos-up': '/chaos.svg',
        'energy-low': '/energy.svg',
        warning: '/warning.svg',
        critical: '/critical.svg',
        victory: '/victory.svg',
        defeat: '/defeat.svg',
      },
      slimeIdleAsset: '/idle.svg',
    })

    expect(state.missionBonus.value).toBe(14)
    expect(state.score.value).toBe(78)
    expect(state.campaignScore.value).toBe(92)
    expect(state.campaignRank.value).toBe('Legend Commander')
    expect(state.verdict.value).toContain('giữ hệ thống rất tốt')
  })

  it('formats daily seed label and reacts to critical chaos', () => {
    const incident = buildIncident()

    const state = useBugWarRoomComputed({
      mode: ref('hardcore'),
      round: ref(2),
      deck: ref([incident]),
      metrics: ref({ stability: 42, trust: 48, energy: 50, timeLeft: 14, chaos: 90 }),
      streak: ref(0),
      logs: ref<RoundLog[]>([]),
      telemetryTick: ref(0),
      missionClockSeconds: ref(84),
      showRandomEvent: ref(false),
      uiFocusMode: ref('minimal'),
      learningJournal: ref([]),
      learningSeverityFilter: ref('all'),
      careerLearningXp: ref(120),
      characterAnimationEnabled: ref(true),
      transientSlimeMood: ref(null),
      currentDailySeed: ref('20260308'),
      fallbackIncident: incident,
      slimeAssetMap: {
        'slime-idle': '/idle.svg',
        annoyed: '/annoyed.svg',
        'click-reaction': '/click.svg',
        'action-confirm': '/confirm.svg',
        'trust-up': '/trust.svg',
        'stability-up': '/stability.svg',
        'chaos-up': '/chaos.svg',
        'energy-low': '/energy.svg',
        warning: '/warning.svg',
        critical: '/critical.svg',
        victory: '/victory.svg',
        defeat: '/defeat.svg',
      },
      slimeIdleAsset: '/idle.svg',
    })

    expect(state.dailySeedLabel.value).toBe('2026-03-08')
    expect(state.warState.value).toBe('MELTDOWN')
    expect(state.currentSlimeMoodLabel.value).toContain('Critical')
    expect(state.isMinimalFocus.value).toBe(true)
  })
})
