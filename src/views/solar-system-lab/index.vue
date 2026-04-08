<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import LessonQuizPanel from './components/LessonQuizPanel.vue'
import PlanetProfilePanel from './components/PlanetProfilePanel.vue'
import { useLessonMode } from './composables/useLessonMode'
import { useSolarSimulation } from './composables/useSolarSimulation'
import type { PlanetId } from './types'

const {
  planets,
  stageRef,
  canvasRef,
  isRunning,
  showOrbits,
  showLabels,
  showTrails,
  showAxisTilt,
  showSeasonOverlay,
  showTiltGuides,
  followSelected,
  daysPerSecond,
  distanceScale,
  sizeScale,
  selectedPlanetId,
  selectedPlanet,
  selectedSeasonData,
  formattedSimulationDate,
  earthYearsElapsed,
  selectedDistanceMillionKm,
  selectedOrbitSpeedKmS,
  selectedSizeVsEarth,
  selectedYearVsEarth,
  selectedOrbitProgress,
  earthOrbitProgress,
  sizeComparePercent,
  yearComparePercent,
  setSelectedPlanet,
  clearTrails,
  resetSimulation,
  formatNumber,
} = useSolarSimulation()

const {
  lessonModeEnabled,
  currentStep,
  currentStepIndex,
  isFirstStep,
  isLastStep,
  completedStepIds,
  completedStepsCount,
  quizAnswers,
  quizSubmitted,
  answeredCount,
  canSubmitQuiz,
  quizScore,
  quizScorePercent,
  lessonSteps,
  quizQuestions,
  toggleLessonMode,
  goToStep,
  previousStep,
  nextStep,
  markCurrentStepDone,
  selectQuizAnswer,
  submitQuiz,
  resetQuiz,
} = useLessonMode()

watch(
  [lessonModeEnabled, currentStepIndex],
  ([enabled]) => {
    if (!enabled) return
    setSelectedPlanet(currentStep.value.focusPlanetId)
  },
  { immediate: true },
)

const lessonStatus = computed(() => {
  if (!lessonModeEnabled.value) {
    return 'Lesson mode tạm ẩn'
  }
  return `Bước ${currentStepIndex.value + 1}/${lessonSteps.length} • ${completedStepsCount.value} đã hoàn thành`
})

function toggleRunning() {
  isRunning.value = !isRunning.value
}

function toggleFollow() {
  followSelected.value = !followSelected.value
  clearTrails()
}

function toggleTrails() {
  showTrails.value = !showTrails.value
}

function toggleOrbits() {
  showOrbits.value = !showOrbits.value
}

function toggleLabels() {
  showLabels.value = !showLabels.value
}

function toggleAxisTilt() {
  showAxisTilt.value = !showAxisTilt.value
}

function toggleSeasonOverlay() {
  showSeasonOverlay.value = !showSeasonOverlay.value
}

function toggleTiltGuides() {
  showTiltGuides.value = !showTiltGuides.value
}

function selectPlanet(id: PlanetId) {
  setSelectedPlanet(id)
}

function applyCurrentLessonStep() {
  const step = currentStep.value
  setSelectedPlanet(step.focusPlanetId)
  daysPerSecond.value = step.recommendedSpeed
  showOrbits.value = true
  showLabels.value = true
  followSelected.value = false

  if (step.emphasis === 'eccentricity') {
    showTiltGuides.value = true
    showAxisTilt.value = false
    showSeasonOverlay.value = false
  }

  if (step.emphasis === 'inclination') {
    showTiltGuides.value = true
    showAxisTilt.value = false
    showSeasonOverlay.value = false
  }

  if (step.emphasis === 'season') {
    showTiltGuides.value = false
    showAxisTilt.value = true
    showSeasonOverlay.value = true
  }

  if (step.emphasis === 'comparison') {
    showTiltGuides.value = true
    showAxisTilt.value = true
    showSeasonOverlay.value = true
  }

  clearTrails()
}

function handleQuizAnswer(payload: { questionId: string; choiceId: string }) {
  selectQuizAnswer(payload.questionId, payload.choiceId)
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-bg-deep text-text-primary font-body">
    <div class="pointer-events-none absolute inset-0 opacity-30">
      <div
        class="absolute -left-28 top-16 h-80 w-80 bg-accent-coral/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        class="absolute -right-24 bottom-10 h-96 w-96 bg-accent-sky/10 blur-3xl"
        aria-hidden="true"
      />
    </div>

    <div class="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header class="animate-fade-up">
        <RouterLink
          to="/"
          class="mb-6 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>

        <h1 class="font-display text-4xl font-bold tracking-tight text-accent-coral sm:text-6xl">
          Solar System Lab
        </h1>
        <p class="mt-4 max-w-3xl text-text-secondary sm:text-lg">
          Mô phỏng hệ Mặt Trời theo quỹ đạo elip thực tế hơn, có độ nghiêng quỹ đạo/trục và lớp mô
          phỏng mùa để học trực quan. Bạn có thể mở lesson từng bước và làm quiz ngay khi quan sát.
        </p>
      </header>

      <section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          class="border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-1"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">SIM DATE</p>
          <p class="mt-2 text-xl font-semibold">{{ formattedSimulationDate }}</p>
        </article>

        <article
          class="border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-2"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">EARTH YEARS</p>
          <p class="mt-2 text-xl font-semibold">{{ formatNumber(earthYearsElapsed, 2) }}</p>
        </article>

        <article
          class="border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-3"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">SELECTED PLANET</p>
          <p class="mt-2 text-xl font-semibold text-accent-amber">{{ selectedPlanet.name }}</p>
        </article>

        <article
          class="border border-border-default bg-bg-surface p-4 animate-fade-up animate-delay-4"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">LESSON STATUS</p>
          <p class="mt-2 text-sm text-text-secondary">{{ lessonStatus }}</p>
        </article>
      </section>

      <main class="mt-6 grid gap-6 lg:grid-cols-3">
        <section
          class="border border-border-default bg-bg-surface p-4 sm:p-5 lg:col-span-2 animate-fade-up animate-delay-2"
        >
          <h2 class="mb-3 flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            Mô phỏng quỹ đạo
          </h2>

          <div
            ref="stageRef"
            class="relative aspect-16/10 overflow-hidden border border-border-default bg-bg-deep"
          >
            <canvas ref="canvasRef" class="h-full w-full cursor-crosshair" />

            <div
              class="pointer-events-none absolute left-3 top-3 border border-border-default bg-bg-surface/90 px-3 py-2 text-xs text-text-secondary"
            >
              Chạm vào hành tinh để mở dữ liệu học tập
            </div>

            <div
              v-if="followSelected"
              class="pointer-events-none absolute right-3 top-3 border border-accent-amber/60 bg-bg-surface/90 px-3 py-2 text-xs text-accent-amber"
            >
              Đang theo dõi {{ selectedPlanet.name }}
            </div>

            <div
              v-if="showSeasonOverlay"
              class="pointer-events-none absolute right-3 bottom-3 border border-accent-sky/60 bg-bg-surface/90 px-3 py-2 text-xs text-accent-sky"
            >
              Bắc bán cầu: {{ selectedSeasonData.northSeason }}
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              class="inline-flex items-center justify-center gap-2 border px-3 py-2 text-sm transition"
              :class="
                isRunning
                  ? 'border-accent-coral bg-accent-coral/15 text-accent-coral'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
              "
              @click="toggleRunning"
            >
              <Icon :icon="isRunning ? 'lucide:pause' : 'lucide:play'" class="size-4" />
              {{ isRunning ? 'Tạm dừng' : 'Tiếp tục' }}
            </button>

            <button
              class="inline-flex items-center justify-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="resetSimulation"
            >
              <Icon icon="lucide:rotate-ccw" class="size-4" />
              Đặt lại
            </button>

            <button
              class="inline-flex items-center justify-center gap-2 border px-3 py-2 text-sm transition"
              :class="
                followSelected
                  ? 'border-accent-amber bg-accent-amber/15 text-accent-amber'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
              "
              @click="toggleFollow"
            >
              <Icon icon="lucide:crosshair" class="size-4" />
              {{ followSelected ? 'Bỏ theo dõi' : 'Theo dõi hành tinh' }}
            </button>

            <button
              class="inline-flex items-center justify-center gap-2 border px-3 py-2 text-sm transition"
              :class="
                showTrails
                  ? 'border-accent-sky bg-accent-sky/15 text-accent-sky'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
              "
              @click="toggleTrails"
            >
              <Icon icon="lucide:waypoints" class="size-4" />
              {{ showTrails ? 'Ẩn vệt quỹ đạo' : 'Hiện vệt quỹ đạo' }}
            </button>
          </div>

          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <label class="border border-border-default bg-bg-elevated p-3">
              <span class="font-display text-xs tracking-widest text-text-dim"
                >TỐC ĐỘ THỜI GIAN</span
              >
              <div class="mt-2 flex items-center justify-between text-sm">
                <span>{{ formatNumber(daysPerSecond, 0) }} ngày/giây</span>
                <span class="text-text-dim">5 → 120</span>
              </div>
              <input
                v-model.number="daysPerSecond"
                type="range"
                min="5"
                max="120"
                step="1"
                class="mt-3 w-full"
              />
            </label>

            <label class="border border-border-default bg-bg-elevated p-3">
              <span class="font-display text-xs tracking-widest text-text-dim"
                >TỈ LỆ KHOẢNG CÁCH</span
              >
              <div class="mt-2 flex items-center justify-between text-sm">
                <span>{{ formatNumber(distanceScale, 2) }}x</span>
                <span class="text-text-dim">0.75 → 1.40</span>
              </div>
              <input
                v-model.number="distanceScale"
                type="range"
                min="0.75"
                max="1.4"
                step="0.01"
                class="mt-3 w-full"
              />
            </label>

            <label class="border border-border-default bg-bg-elevated p-3">
              <span class="font-display text-xs tracking-widest text-text-dim"
                >TỈ LỆ KÍCH THƯỚC</span
              >
              <div class="mt-2 flex items-center justify-between text-sm">
                <span>{{ formatNumber(sizeScale, 2) }}x</span>
                <span class="text-text-dim">0.8 → 1.8</span>
              </div>
              <input
                v-model.number="sizeScale"
                type="range"
                min="0.8"
                max="1.8"
                step="0.01"
                class="mt-3 w-full"
              />
            </label>

            <div class="border border-border-default bg-bg-elevated p-3">
              <span class="font-display text-xs tracking-widest text-text-dim"
                >LỚP DỮ LIỆU HIỂN THỊ</span
              >
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  class="flex items-center justify-between border px-3 py-2 text-sm transition"
                  :class="
                    showOrbits
                      ? 'border-accent-coral text-accent-coral'
                      : 'border-border-default text-text-secondary hover:text-text-primary'
                  "
                  @click="toggleOrbits"
                >
                  <span>Đường quỹ đạo</span>
                  <Icon :icon="showOrbits ? 'lucide:check' : 'lucide:x'" class="size-4" />
                </button>

                <button
                  class="flex items-center justify-between border px-3 py-2 text-sm transition"
                  :class="
                    showLabels
                      ? 'border-accent-sky text-accent-sky'
                      : 'border-border-default text-text-secondary hover:text-text-primary'
                  "
                  @click="toggleLabels"
                >
                  <span>Nhãn hành tinh</span>
                  <Icon :icon="showLabels ? 'lucide:check' : 'lucide:x'" class="size-4" />
                </button>

                <button
                  class="flex items-center justify-between border px-3 py-2 text-sm transition"
                  :class="
                    showAxisTilt
                      ? 'border-accent-amber text-accent-amber'
                      : 'border-border-default text-text-secondary hover:text-text-primary'
                  "
                  @click="toggleAxisTilt"
                >
                  <span>Trục nghiêng</span>
                  <Icon :icon="showAxisTilt ? 'lucide:check' : 'lucide:x'" class="size-4" />
                </button>

                <button
                  class="flex items-center justify-between border px-3 py-2 text-sm transition"
                  :class="
                    showSeasonOverlay
                      ? 'border-accent-sky text-accent-sky'
                      : 'border-border-default text-text-secondary hover:text-text-primary'
                  "
                  @click="toggleSeasonOverlay"
                >
                  <span>Mùa mô phỏng</span>
                  <Icon :icon="showSeasonOverlay ? 'lucide:check' : 'lucide:x'" class="size-4" />
                </button>

                <button
                  class="sm:col-span-2 flex items-center justify-between border px-3 py-2 text-sm transition"
                  :class="
                    showTiltGuides
                      ? 'border-accent-coral text-accent-coral'
                      : 'border-border-default text-text-secondary hover:text-text-primary'
                  "
                  @click="toggleTiltGuides"
                >
                  <span>Chỉ báo độ lệch tâm và độ nghiêng quỹ đạo</span>
                  <Icon :icon="showTiltGuides ? 'lucide:check' : 'lucide:x'" class="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 border border-border-default bg-bg-elevated p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <p class="font-display text-xs tracking-widest text-text-dim">CHỌN HÀNH TINH</p>
              <button
                class="inline-flex items-center gap-2 border border-accent-coral px-2.5 py-1.5 text-xs text-accent-coral transition hover:bg-accent-coral/10"
                @click="applyCurrentLessonStep"
              >
                <Icon icon="lucide:book-open-check" class="size-3.5" />
                Áp dụng bước lesson hiện tại
              </button>
            </div>

            <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <button
                v-for="planet in planets"
                :key="planet.id"
                class="flex items-center gap-2 border px-3 py-2 text-left text-sm transition"
                :class="
                  planet.id === selectedPlanetId
                    ? 'border-accent-amber bg-accent-amber/10 text-text-primary'
                    : 'border-border-default text-text-secondary hover:text-text-primary'
                "
                @click="selectPlanet(planet.id)"
              >
                <span
                  class="inline-block h-2.5 w-2.5"
                  :style="{
                    background: `linear-gradient(135deg, ${planet.primaryColor}, ${planet.secondaryColor})`,
                  }"
                />
                {{ planet.name }}
              </button>
            </div>
          </div>

          <LessonQuizPanel
            :lesson-mode-enabled="lessonModeEnabled"
            :steps="lessonSteps"
            :current-step="currentStep"
            :current-step-index="currentStepIndex"
            :is-first-step="isFirstStep"
            :is-last-step="isLastStep"
            :completed-step-ids="completedStepIds"
            :completed-steps-count="completedStepsCount"
            :quiz-questions="quizQuestions"
            :quiz-answers="quizAnswers"
            :answered-count="answeredCount"
            :quiz-submitted="quizSubmitted"
            :can-submit-quiz="canSubmitQuiz"
            :quiz-score="quizScore"
            :quiz-score-percent="quizScorePercent"
            @toggle-lesson="toggleLessonMode"
            @prev-step="previousStep"
            @next-step="nextStep"
            @go-step="goToStep"
            @apply-step="applyCurrentLessonStep"
            @mark-step-done="markCurrentStepDone"
            @select-answer="handleQuizAnswer"
            @submit-quiz="submitQuiz"
            @reset-quiz="resetQuiz"
          />
        </section>

        <PlanetProfilePanel
          :selected-planet="selectedPlanet"
          :season-data="selectedSeasonData"
          :selected-distance-million-km="selectedDistanceMillionKm"
          :selected-orbit-speed-km-s="selectedOrbitSpeedKmS"
          :selected-orbit-progress="selectedOrbitProgress"
          :earth-orbit-progress="earthOrbitProgress"
          :selected-size-vs-earth="selectedSizeVsEarth"
          :selected-year-vs-earth="selectedYearVsEarth"
          :size-compare-percent="sizeComparePercent"
          :year-compare-percent="yearComparePercent"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
input[type='range'] {
  accent-color: #ff6b4a;
}
</style>
