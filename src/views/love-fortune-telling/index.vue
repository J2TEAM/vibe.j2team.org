<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import CelebrationOverlay from './components/CelebrationOverlay.vue'
import CalculationTimeline from './components/CalculationTimeline.vue'
import ResultModal from './components/ResultModal.vue'
import type { CalculationStep, FireworkBurst } from './types'
import { CELEBRATION_DURATION_MS, createFireworks } from './utils/celebration'
import {
  STEP_DELAY_MS,
  buildCountDisplayItems,
  buildInitialSequence,
  buildLoveText,
  buildNextSequence,
  countLoveLetters,
  extractPercentage,
  formatCountSummary,
} from './utils/love-calculator'

const maleName = ref('')
const femaleName = ref('')
const displayMaleName = ref('')
const displayFemaleName = ref('')
const calculateSteps = ref<CalculationStep[]>([])
const finalPercentage = ref<number | null>(null)
const isCalculating = ref(false)
const currentStepIndex = ref(0)
const showModal = ref(false)
const showConfetti = ref(false)
const stepContainerRef = ref<HTMLElement>()
const fireworks = ref<FireworkBurst[]>([])

const isHighPercentage = computed(() => (finalPercentage.value ?? 0) >= 70)
const isLowPercentage = computed(() => (finalPercentage.value ?? 0) < 30)

const sleep = (delay: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

const runCelebration = async (): Promise<void> => {
  fireworks.value = createFireworks()
  showConfetti.value = true

  await sleep(CELEBRATION_DURATION_MS)

  showConfetti.value = false
  fireworks.value = []
}

const calculateLovePercentage = async (): Promise<void> => {
  if (!maleName.value.trim() || !femaleName.value.trim()) {
    alert('Vui lòng nhập đầy đủ tên của cả hai người')
    return
  }

  isCalculating.value = true
  currentStepIndex.value = 0
  calculateSteps.value = []
  finalPercentage.value = null
  showModal.value = false

  displayMaleName.value = maleName.value
  displayFemaleName.value = femaleName.value

  const fullText = buildLoveText(maleName.value, femaleName.value)

  calculateSteps.value.push({
    type: 'input',
    content: `Bạn viết tên: ${fullText}`,
  })
  await sleep(STEP_DELAY_MS.input)

  const counts = countLoveLetters(fullText)

  calculateSteps.value.push({
    type: 'count',
    content: `Phân tích: L, O, V, E, S: ${formatCountSummary(counts)}`,
    displayItems: buildCountDisplayItems(counts),
  })

  currentStepIndex.value = 1
  await sleep(STEP_DELAY_MS.count)

  let sequence = buildInitialSequence(counts)

  calculateSteps.value.push({
    type: 'combine',
    content: `Dãy số tình yêu của các bạn: ${sequence}`,
  })

  currentStepIndex.value = 2
  await sleep(STEP_DELAY_MS.initialSequence)

  let iterationCount = 0

  while (sequence.length > 2) {
    iterationCount += 1
    const nextSequence = buildNextSequence(sequence)

    calculateSteps.value.push({
      type: 'combine',
      content: `Lần bói toán thứ ${iterationCount}: ${sequence} → ${nextSequence}`,
    })

    currentStepIndex.value = 2 + iterationCount
    sequence = nextSequence

    await sleep(STEP_DELAY_MS.combine)
  }

  const percentage = extractPercentage(sequence)
  finalPercentage.value = percentage

  calculateSteps.value.push({
    type: 'result',
    content: `Kết quả: Tỷ lệ tình yêu giữa hai người là ${percentage}%`,
  })

  currentStepIndex.value = calculateSteps.value.length - 1
  await sleep(STEP_DELAY_MS.beforeResult)

  isCalculating.value = false
  showModal.value = true

  if (isHighPercentage.value) {
    await runCelebration()
  }
}

const resetCalculation = (): void => {
  maleName.value = ''
  femaleName.value = ''
  displayMaleName.value = ''
  displayFemaleName.value = ''
  calculateSteps.value = []
  finalPercentage.value = null
  isCalculating.value = false
  currentStepIndex.value = 0
  showModal.value = false
  showConfetti.value = false
  fireworks.value = []
}

watch(
  () => calculateSteps.value.length,
  async () => {
    await nextTick()
    if (stepContainerRef.value) {
      stepContainerRef.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  },
)
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-12 text-text-primary">
    <CelebrationOverlay :show="showConfetti" :fireworks="fireworks" />

    <div class="mx-auto max-w-2xl">
      <!-- Back to Home Button -->
      <div class="mb-8 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="text-lg" />
          Trang Chủ
        </RouterLink>
      </div>

      <!-- Header -->
      <div class="mb-12 animate-fade-up text-center">
        <h1 class="font-display text-5xl font-bold text-accent-coral md:text-6xl">
          Bói Toán Tình Yêu
        </h1>
        <p class="mt-4 text-lg text-text-secondary animate-fade-up animate-delay-1">
          Khám phá tỷ lệ phần trăm tình yêu giữa hai người
        </p>
      </div>

      <!-- Input Section -->
      <div
        class="mb-8 space-y-6 rounded-none border border-border-default bg-bg-surface p-8 animate-fade-up animate-delay-2"
      >
        <div>
          <label
            class="mb-3 block font-display text-sm font-semibold tracking-widest text-text-primary"
          >
            TÊN CỦA BẠN NAM
          </label>
          <input
            v-model="maleName"
            type="text"
            placeholder="Ví dụ: Dương Thanh Tâm"
            :disabled="isCalculating"
            class="w-full border border-border-default bg-bg-deep px-4 py-3 text-text-primary placeholder-text-dim transition focus:border-accent-coral focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label
            class="mb-3 block font-display text-sm font-semibold tracking-widest text-text-primary"
          >
            TÊN CỦA BẠN NỮ
          </label>
          <input
            v-model="femaleName"
            type="text"
            placeholder="Ví dụ: Dương Thị Tâm"
            :disabled="isCalculating"
            class="w-full border border-border-default bg-bg-deep px-4 py-3 text-text-primary placeholder-text-dim transition focus:border-accent-coral focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          @click="calculateLovePercentage"
          :disabled="isCalculating"
          class="w-full border border-accent-coral bg-accent-coral/10 px-6 py-3 font-display font-semibold text-accent-coral transition hover:bg-accent-coral/20 disabled:opacity-50"
        >
          <Icon v-if="!isCalculating" icon="lucide:heart" class="mr-2 inline text-lg" />
          <Icon v-else icon="lucide:loader" class="mr-2 inline animate-spin text-lg" />
          {{ isCalculating ? 'Đang tính toán...' : 'Tính Phần Trăm Tình Yêu' }}
        </button>
      </div>

      <div
        v-if="calculateSteps.length > 0"
        ref="stepContainerRef"
        class="mb-8 space-y-4 animate-fade-up animate-delay-3"
      >
        <h2 class="flex items-center gap-3 font-display text-xl font-semibold">
          <span class="text-accent-coral">//</span>
          Quá Trình Bói Toán
        </h2>
        <CalculationTimeline :steps="calculateSteps" :current-step-index="currentStepIndex" />
      </div>

      <ResultModal
        :show="showModal"
        :is-high-percentage="isHighPercentage"
        :is-low-percentage="isLowPercentage"
        :final-percentage="finalPercentage"
        :display-male-name="displayMaleName"
        :display-female-name="displayFemaleName"
        @reset="resetCalculation"
      />
    </div>
  </div>
</template>
