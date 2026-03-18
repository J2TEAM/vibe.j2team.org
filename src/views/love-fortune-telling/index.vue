<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

interface CalculationStep {
  type: 'input' | 'count' | 'combine' | 'result'
  content: string
  displayItems?: string[]
}

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

const isHighPercentage = computed(() => (finalPercentage.value ?? 0) >= 70)
const isLowPercentage = computed(() => (finalPercentage.value ?? 0) < 30)

const countLetters = (text: string, letters: string[]): Record<string, number> => {
  const counts: Record<string, number> = {}
  const upperText = text.toUpperCase().replace(/\s/g, '')

  letters.forEach((letter) => {
    const regex = new RegExp(letter, 'g')
    const match = upperText.match(regex)
    counts[letter] = match ? match.length : 0
  })

  return counts
}

const calculateLovePercentage = async () => {
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

  // Step 1: Show input combination
  const fullText = `${maleName.value.toUpperCase()} LOVES ${femaleName.value.toUpperCase()}`

  calculateSteps.value.push({
    type: 'input',
    content: `Bạn viết tên: ${fullText}`,
  })

  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Step 2: Count LOVES letters
  const letters = ['L', 'O', 'V', 'E', 'S']
  const counts = countLetters(fullText, letters)

  const countDisplay = letters.map((letter) => `${letter}: ${counts[letter]}`).join(' | ')

  calculateSteps.value.push({
    type: 'count',
    content: `Đếm chữ cái L, O, V, E, S: ${countDisplay}`,
    displayItems: [
      `L: ${counts['L']}`,
      `O: ${counts['O']}`,
      `V: ${counts['V']}`,
      `E: ${counts['E']}`,
      `S: ${counts['S']}`,
    ],
  })

  currentStepIndex.value = 1

  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Step 3: Create initial digit sequence
  let digitSequence = Object.values(counts).join('')

  calculateSteps.value.push({
    type: 'combine',
    content: `Dãy số ban đầu: ${digitSequence}`,
  })

  currentStepIndex.value = 2

  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Step 4: Combine adjacent numbers until result <= 99 (has 1-2 digits)
  let iterationCount = 0

  while (digitSequence.length > 2) {
    iterationCount++
    const digits: number[] = digitSequence.split('').map(Number)
    let newSequence = ''

    for (let i = 0; i < digits.length - 1; i++) {
      newSequence += (digits[i]! + digits[i + 1]!).toString()
    }

    calculateSteps.value.push({
      type: 'combine',
      content: `Lần ${iterationCount}: ${digitSequence} → ${newSequence}`,
    })

    currentStepIndex.value = 2 + iterationCount

    digitSequence = newSequence

    await new Promise((resolve) => setTimeout(resolve, 1200))
  }

  // Extract final percentage
  const percentage = parseInt(digitSequence.slice(0, 2), 10)

  finalPercentage.value = percentage

  calculateSteps.value.push({
    type: 'result',
    content: `Kết quả: Tỷ lệ tình yêu giữa hai người là ${percentage}%`,
  })

  currentStepIndex.value = calculateSteps.value.length - 1

  await new Promise((resolve) => setTimeout(resolve, 1500))

  isCalculating.value = false
  showModal.value = true

  if (isHighPercentage.value) {
    showConfetti.value = true
    await new Promise((resolve) => setTimeout(resolve, 3000))
    showConfetti.value = false
  }
}

const resetCalculation = () => {
  maleName.value = ''
  femaleName.value = ''
  displayMaleName.value = ''
  displayFemaleName.value = ''
  calculateSteps.value = []
  finalPercentage.value = null
  isCalculating.value = false
  currentStepIndex.value = 0
  showModal.value = false
}

const formatPercentageColor = (): string => {
  if (isHighPercentage.value) {
    return 'text-accent-coral'
  }
  if (isLowPercentage.value) {
    return 'text-accent-sky'
  }
  return 'text-accent-amber'
}

const formatPercentageBg = (): string => {
  if (isHighPercentage.value) {
    return 'bg-accent-coral/10'
  }
  if (isLowPercentage.value) {
    return 'bg-accent-sky/10'
  }
  return 'bg-accent-amber/10'
}

// Auto-scroll to steps container when new steps are added
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
    <!-- Confetti effect -->
    <div v-if="showConfetti" class="fixed inset-0 pointer-events-none">
      <div
        v-for="i in 50"
        :key="i"
        class="fixed animate-pulse"
        :style="{
          left: Math.random() * 100 + '%',
          top: -10 + 'px',
          animation: `fall ${2 + Math.random() * 1}s linear forwards`,
          animationDelay: Math.random() * 0.5 + 's',
        }"
      >
        <Icon v-if="i % 3 === 0" icon="lucide:heart" class="text-accent-coral text-2xl" />
        <Icon v-else-if="i % 3 === 1" icon="lucide:sparkles" class="text-accent-amber text-2xl" />
        <Icon v-else icon="lucide:star" class="text-accent-sky text-2xl" />
      </div>
    </div>

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

      <!-- Calculation Steps -->
      <div
        v-if="calculateSteps.length > 0"
        ref="stepContainerRef"
        class="mb-8 space-y-4 animate-fade-up animate-delay-3"
      >
        <h2 class="flex items-center gap-3 font-display text-xl font-semibold">
          <span class="text-accent-coral">//</span>
          Quá Trình Tính Toán
        </h2>

        <div class="space-y-3 rounded-none border border-border-default bg-bg-surface p-6">
          <div
            v-for="(step, index) in calculateSteps"
            :key="index"
            class="transform transition-all duration-500"
            :class="{
              'opacity-100 translate-y-0': index <= currentStepIndex,
              'opacity-30 translate-y-4': index > currentStepIndex,
            }"
          >
            <!-- Count Display -->
            <div
              v-if="step.type === 'count' && step.displayItems"
              class="mb-3 flex flex-wrap gap-2"
            >
              <div
                v-for="item in step.displayItems"
                :key="item"
                class="flex items-center gap-2 rounded-none border border-accent-amber bg-accent-amber/5 px-3 py-2"
              >
                <Icon icon="lucide:check-circle" class="text-accent-amber" />
                <span class="font-body text-sm font-semibold">{{ item }}</span>
              </div>
            </div>

            <div
              class="flex items-start gap-3 rounded-none border-l-4 border-l-accent-coral px-4 py-3"
              :class="
                step.type === 'result'
                  ? 'bg-accent-coral/20 border-l-4 border-l-accent-coral'
                  : 'bg-bg-elevated'
              "
            >
              <Icon
                :icon="
                  step.type === 'input'
                    ? 'lucide:edit-3'
                    : step.type === 'count'
                      ? 'lucide:list-checks'
                      : step.type === 'combine'
                        ? 'lucide:plus'
                        : 'lucide:target'
                "
                class="mt-1 flex-shrink-0 text-lg text-accent-coral"
              />
              <p class="font-body text-sm">{{ step.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Result Modal -->
      <Teleport v-if="showModal" to="body">
        <Transition
          name="modal"
          enter-active-class="transition-opacity duration-300"
          leave-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <div
              class="animate-fade-up w-full max-w-md space-y-6 rounded-none border-4 border-accent-coral bg-bg-surface p-8 shadow-lg shadow-accent-coral/20"
            >
              <div class="text-center">
                <Icon
                  v-if="isHighPercentage"
                  icon="lucide:heart"
                  class="mx-auto mb-4 text-6xl text-accent-coral animate-pulse"
                />
                <Icon
                  v-else-if="isLowPercentage"
                  icon="lucide:heart-crack"
                  class="mx-auto mb-4 text-6xl text-accent-sky animate-pulse"
                />
                <Icon
                  v-else
                  icon="lucide:heart-handshake"
                  class="mx-auto mb-4 text-6xl text-accent-amber animate-pulse"
                />

                <h3 class="mt-4 font-display text-2xl font-bold text-text-primary">
                  {{ displayMaleName }}<br />
                  & <br />{{ displayFemaleName }}
                </h3>

                <div
                  class="mx-auto mt-8 flex w-fit flex-col items-center rounded-none border-2 border-accent-coral px-8 py-6"
                  :class="formatPercentageBg()"
                >
                  <p class="font-body text-sm tracking-widest text-text-secondary">
                    Tỷ Lệ Tình Yêu
                  </p>
                  <p class="mt-2 font-display text-7xl font-bold" :class="formatPercentageColor()">
                    {{ finalPercentage }}%
                  </p>
                </div>

                <p class="mt-6 font-body text-lg" :class="formatPercentageColor()">
                  <span v-if="isHighPercentage"> ❤️ Tình yêu rực rỡ! Hai bạn xứng đôi! </span>
                  <span v-else-if="isLowPercentage"> 💙 Còn cơ hội để xây dựng tình yêu... </span>
                  <span v-else> 💛 Tình yêu đang phát triển, cần thêm thời gian! </span>
                </p>
              </div>

              <div class="space-y-3 border-t border-border-default pt-6">
                <button
                  @click="resetCalculation"
                  class="w-full border border-accent-coral bg-accent-coral px-4 py-3 font-display font-semibold text-bg-deep transition hover:bg-accent-coral/90"
                >
                  Thử Lại
                </button>
                <RouterLink
                  to="/"
                  class="block border border-border-default bg-bg-elevated px-4 py-3 text-center font-display font-semibold text-text-primary transition hover:border-accent-coral hover:text-accent-coral"
                >
                  Về Trang Chủ
                </RouterLink>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
@keyframes fall {
  to {
    transform: translateY(100vh) rotateZ(360deg);
    opacity: 0;
  }
}
</style>
