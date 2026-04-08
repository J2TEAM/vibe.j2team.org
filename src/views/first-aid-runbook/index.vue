<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import FirstAidReplay from './components/FirstAidReplay.vue'
import FirstAidScenarioGrid from './components/FirstAidScenarioGrid.vue'
import FirstAidStepPanel from './components/FirstAidStepPanel.vue'
import FirstAidSummary from './components/FirstAidSummary.vue'
import { scenarios } from './data/scenarios'
import type { DecisionLogItem, SafetyAssessment, SessionStatus, Severity } from './types'

const emergencyHotline = '115'

const selectedScenarioId = ref<string>(scenarios[0]?.id ?? '')
const status = ref<SessionStatus>('idle')
const currentStepId = ref<string | null>(null)
const currentStepLimit = ref(0)
const timeLeft = ref(0)
const decisionLog = ref<DecisionLogItem[]>([])
const replayIndex = ref(0)
const replayAuto = ref(false)

const severityLabelMap: Record<Severity, string> = {
  safe: 'An toàn',
  warning: 'Thận trọng',
  danger: 'Nguy hiểm',
}

const selectedScenario = computed(
  () => scenarios.find((scenario) => scenario.id === selectedScenarioId.value) ?? null,
)

const currentStep = computed(() => {
  if (!selectedScenario.value || !currentStepId.value) {
    return null
  }

  return selectedScenario.value.steps.find((step) => step.id === currentStepId.value) ?? null
})

const progressCurrent = computed(() => {
  const ongoing = status.value === 'running' ? 1 : 0
  return Math.min(decisionLog.value.length + ongoing, selectedScenario.value?.steps.length ?? 0)
})

const progressTotal = computed(() => selectedScenario.value?.steps.length ?? 0)
const score = computed(() => decisionLog.value.reduce((sum, item) => sum + item.impact, 0))
const dangerCount = computed(
  () => decisionLog.value.filter((item) => item.severity === 'danger').length,
)
const timeoutCount = computed(() => decisionLog.value.filter((item) => item.timedOut).length)

const timerRatio = computed(() => {
  if (currentStepLimit.value <= 0) {
    return 0
  }

  return Math.max(0, Math.min(1, timeLeft.value / currentStepLimit.value))
})

const timerToneClass = computed(() => {
  if (timerRatio.value <= 0.33) {
    return 'bg-accent-coral'
  }

  if (timerRatio.value <= 0.66) {
    return 'bg-accent-amber'
  }

  return 'bg-accent-sky'
})

const safetyAssessment = computed<SafetyAssessment>(() => {
  if (dangerCount.value >= 3 || score.value <= 2) {
    return {
      label: 'Nguy cơ cao',
      description: 'Bạn cần luyện lại thứ tự ưu tiên sơ cứu để giảm rủi ro biến chứng.',
      textClass: 'text-accent-coral',
      borderClass: 'border-accent-coral/40',
    }
  }

  if (dangerCount.value >= 1 || score.value <= 7) {
    return {
      label: 'Cần cải thiện',
      description: 'Bạn đã có nền tảng, nhưng vẫn còn vài quyết định dễ gây hậu quả xấu.',
      textClass: 'text-accent-amber',
      borderClass: 'border-accent-amber/40',
    }
  }

  return {
    label: 'Phản xạ tốt',
    description: 'Thứ tự xử lý hợp lý, ưu tiên an toàn hiện trường và hỗ trợ y tế đúng thời điểm.',
    textClass: 'text-accent-sky',
    borderClass: 'border-accent-sky/40',
  }
})

const { pause: pauseCountdown, resume: resumeCountdown } = useIntervalFn(
  () => {
    if (status.value !== 'running' || !currentStep.value) {
      return
    }

    if (timeLeft.value <= 1) {
      chooseOption(currentStep.value.timeoutChoiceId, true)
      return
    }

    timeLeft.value -= 1
  },
  1000,
  { immediate: false },
)

const { pause: pauseReplayAuto, resume: resumeReplayAuto } = useIntervalFn(
  () => {
    if (!replayAuto.value) {
      return
    }

    if (replayIndex.value >= decisionLog.value.length - 1) {
      replayAuto.value = false
      pauseReplayAuto()
      return
    }

    replayIndex.value += 1
  },
  1600,
  { immediate: false },
)

watch(replayAuto, (enabled) => {
  if (enabled && status.value === 'finished' && decisionLog.value.length > 1) {
    resumeReplayAuto()
    return
  }

  pauseReplayAuto()
})

function switchScenario(scenarioId: string) {
  if (status.value === 'running') {
    return
  }

  selectedScenarioId.value = scenarioId
  resetSessionState()
}

function resetSessionState() {
  pauseCountdown()
  pauseReplayAuto()
  replayAuto.value = false
  currentStepId.value = null
  currentStepLimit.value = 0
  timeLeft.value = 0
  decisionLog.value = []
  replayIndex.value = 0
  status.value = 'idle'
}

function loadStep(stepId: string) {
  if (!selectedScenario.value) {
    return
  }

  const step = selectedScenario.value.steps.find((item) => item.id === stepId)

  if (!step) {
    finishRun()
    return
  }

  currentStepId.value = step.id
  currentStepLimit.value = step.timeLimit
  timeLeft.value = step.timeLimit
  resumeCountdown()
}

function startRun() {
  if (!selectedScenario.value) {
    return
  }

  pauseReplayAuto()
  replayAuto.value = false
  replayIndex.value = 0
  decisionLog.value = []
  status.value = 'running'
  loadStep(selectedScenario.value.startStepId)
}

function finishRun() {
  pauseCountdown()
  status.value = 'finished'
  currentStepId.value = null
  currentStepLimit.value = 0
  timeLeft.value = 0
  replayIndex.value = 0
  replayAuto.value = false
  pauseReplayAuto()
}

function chooseOption(choiceId: string, timedOut = false) {
  if (status.value !== 'running' || !currentStep.value) {
    return
  }

  const choice = currentStep.value.choices.find((item) => item.id === choiceId)

  if (!choice) {
    return
  }

  pauseCountdown()

  const elapsedTime = Math.max(0, currentStepLimit.value - timeLeft.value)
  decisionLog.value.push({
    stepId: currentStep.value.id,
    stepTitle: currentStep.value.title,
    selectedChoiceId: choice.id,
    selectedLabel: choice.label,
    consequence: choice.consequence,
    impact: choice.impact,
    severity: choice.severity,
    timedOut,
    remainingTime: timeLeft.value,
    elapsedTime,
    reference: currentStep.value.reference,
  })

  if ('nextStepId' in choice && choice.nextStepId) {
    loadStep(choice.nextStepId)
    return
  }

  finishRun()
}

function replayPrev() {
  replayIndex.value = Math.max(0, replayIndex.value - 1)
}

function replayNext() {
  replayIndex.value = Math.min(decisionLog.value.length - 1, replayIndex.value + 1)
}

function setReplayIndex(index: number) {
  const maxIndex = decisionLog.value.length - 1

  if (maxIndex < 0) {
    replayIndex.value = 0
    return
  }

  replayIndex.value = Math.min(maxIndex, Math.max(0, index))
}

function toggleReplayAuto() {
  replayAuto.value = !replayAuto.value
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <header class="border-b border-border-default bg-bg-deep/90 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <RouterLink
          to="/"
          class="font-display text-xs tracking-[0.2em] text-text-secondary transition-colors hover:text-accent-coral"
        >
          HOME
        </RouterLink>
        <div
          class="bg-accent-coral px-3 py-1.5 font-display text-xs font-bold tracking-widest text-bg-deep"
        >
          FIRST_AID_RUNBOOK
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl px-6 py-10">
      <section class="grid gap-5 animate-fade-up lg:grid-cols-[1.2fr_1fr]">
        <article>
          <p class="font-display text-sm tracking-widest text-accent-coral">// EMERGENCY DRILL</p>
          <h1 class="mt-3 font-display text-4xl font-bold tracking-tight md:text-6xl">
            First Aid Runbook
          </h1>
          <p class="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
            Bạn tập xử lý tình huống cấp cứu bằng quyết định theo bước và giới hạn thời gian. Giao
            diện đã tách nhỏ component, giảm mật độ chữ và tăng hình minh họa.
          </p>
          <p class="mt-2 text-xs text-text-dim">
            Tình huống thực tế nguy hiểm: gọi
            <span class="font-display text-accent-coral">{{ emergencyHotline }}</span
            >.
          </p>
        </article>

        <img
          v-if="selectedScenario"
          :src="selectedScenario.image"
          :alt="`Minh họa ${selectedScenario.name}`"
          class="aspect-video w-full border border-border-default bg-bg-surface object-contain p-1"
        />
      </section>

      <FirstAidScenarioGrid
        :scenarios="scenarios"
        :selected-scenario-id="selectedScenarioId"
        :locked="status === 'running'"
        @select="switchScenario"
      />

      <section
        class="mt-8 border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-1"
      >
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-display text-xs tracking-widest text-accent-sky">// OBJECTIVE</span>
          <span class="text-xs text-text-dim"
            >Tiến trình: {{ progressCurrent }}/{{ progressTotal || 0 }}</span
          >
        </div>

        <div class="mt-3 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <p class="text-sm text-text-secondary">{{ selectedScenario?.objective }}</p>
          <p class="text-sm text-text-dim">{{ selectedScenario?.summary }}</p>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-3">
          <button
            v-if="status !== 'running'"
            type="button"
            class="border border-accent-coral bg-accent-coral/10 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-coral/20"
            @click="startRun"
          >
            {{ status === 'finished' ? 'Chạy lại kịch bản' : 'Bắt đầu diễn tập' }}
          </button>
          <button
            v-if="status !== 'idle'"
            type="button"
            class="border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent-amber hover:text-accent-amber"
            @click="resetSessionState"
          >
            Đặt lại phiên
          </button>
        </div>
      </section>

      <FirstAidStepPanel
        v-if="status === 'running' && currentStep && selectedScenario"
        :scenario="selectedScenario"
        :current-step="currentStep"
        :time-left="timeLeft"
        :timer-ratio="timerRatio"
        :timer-tone-class="timerToneClass"
        :severity-label-map="severityLabelMap"
        @choose="chooseOption"
      />

      <template v-if="status === 'finished' && selectedScenario">
        <FirstAidSummary
          :score="score"
          :danger-count="dangerCount"
          :timeout-count="timeoutCount"
          :safety-assessment="safetyAssessment"
          :debrief="selectedScenario.debrief"
        />

        <FirstAidReplay
          v-if="decisionLog.length"
          :decision-log="decisionLog"
          :replay-index="replayIndex"
          :replay-auto="replayAuto"
          :severity-label-map="severityLabelMap"
          @prev="replayPrev"
          @next="replayNext"
          @toggle-auto="toggleReplayAuto"
          @set-index="setReplayIndex"
        />
      </template>

      <footer
        class="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-6"
      >
        <p class="text-xs text-text-dim">
          Công cụ mô phỏng để tập phản xạ. Không thay thế chẩn đoán hay điều trị y khoa.
        </p>
        <RouterLink
          to="/"
          class="border border-border-default bg-bg-surface px-4 py-2 text-xs text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
        >
          Quay về trang chủ
        </RouterLink>
      </footer>
    </main>
  </div>
</template>
