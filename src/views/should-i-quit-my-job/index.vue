<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
import { questions, resultRanges, funnyMessages } from './questions'

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────

type Phase = 'intro' | 'quiz' | 'result'

const NUM_OF_QUESTIONS = 15

function pickRandom(arr: typeof questions, n: number): typeof questions {
  const shuffled = [...arr].sort(() => Math.random() - 0.5).slice(0, n)
  return shuffled.sort((a, b) => (a.isEnd ? 1 : 0) - (b.isEnd ? 1 : 0))
}

const phase = ref<Phase>('intro')
const currentIndex = ref(0)
const activeQuestions = ref(pickRandom(questions, NUM_OF_QUESTIONS))
const selectedAnswers = ref<(number | null)[]>(Array.from({ length: NUM_OF_QUESTIONS }, () => null))
const randomMessage = ref('')

const currentQuestion = computed(() => activeQuestions.value[currentIndex.value]!)
const progress = computed(() => Math.round((currentIndex.value / NUM_OF_QUESTIONS) * 100))

const totalScore = computed(() => {
  return selectedAnswers.value.reduce<number>((sum, score) => {
    return sum + (score ?? 0)
  }, 0)
})

const currentResult = computed(() => {
  const score = totalScore.value
  return (
    resultRanges.find((r) => score >= r.min && score <= r.max) ??
    resultRanges[resultRanges.length - 1]!
  )
})

function pickAnswer(score: number) {
  selectedAnswers.value[currentIndex.value] = score
  setTimeout(() => {
    if (currentIndex.value < NUM_OF_QUESTIONS - 1) {
      currentIndex.value++
    } else {
      finishQuiz()
    }
  }, 350)
}

function goBack() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function finishQuiz() {
  randomMessage.value = funnyMessages[Math.floor(Math.random() * funnyMessages.length)] ?? ''
  phase.value = 'result'
}

function restartQuiz() {
  activeQuestions.value = pickRandom(questions, NUM_OF_QUESTIONS)
  selectedAnswers.value = Array.from({ length: NUM_OF_QUESTIONS }, () => null)
  currentIndex.value = 0
  phase.value = 'intro'
}

function startQuiz() {
  phase.value = 'quiz'
}

const categoryColors: Record<string, string> = {
  'Cảm xúc': 'text-accent-coral',
  Sếp: 'text-accent-amber',
  'Đồng nghiệp': 'text-accent-sky',
  Lương: 'text-accent-coral',
  'Phát triển': 'text-accent-amber',
  Stress: 'text-accent-coral',
  'Work-Life Balance': 'text-accent-sky',
  'Giả định': 'text-accent-amber',
  'Tổng quan': 'text-accent-coral',
  Bonus: 'text-accent-sky',
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-12">
    <div class="max-w-2xl mx-auto">
      <!-- Back link -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary mb-10"
      >
        &larr; Về trang chủ
      </RouterLink>

      <!-- ─── INTRO ─── -->
      <template v-if="phase === 'intro'">
        <div class="animate-fade-up">
          <div class="flex items-center gap-2 mb-4">
            <span class="font-display text-xs tracking-widest text-accent-coral">// QUIZ</span>
          </div>
          <h1
            class="font-display text-5xl sm:text-6xl font-bold text-text-primary leading-tight mb-2"
          >
            Should I Quit
            <span class="text-accent-coral">My Job?</span>
          </h1>
          <p class="text-text-secondary text-lg mt-4 max-w-lg animate-fade-up animate-delay-2">
            Bài quiz <strong class="text-text-primary">{{ NUM_OF_QUESTIONS }} câu hỏi</strong> giúp
            bạn tự đánh giá tình trạng nghề nghiệp hiện tại — hoàn toàn khoa học, độ chính xác 100%,
            chúng tôi chịu trách nhiệm 0%.
          </p>

          <div
            class="mt-8 border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-3"
          >
            <p class="text-text-secondary text-sm leading-relaxed">
              ⚠️ <strong class="text-text-primary">Disclaimer:</strong> Bài quiz này không thay thế
              tư vấn nghề nghiệp chuyên nghiệp. Chúng tôi không chịu trách nhiệm nếu bạn thực sự
              nghỉ việc sau khi làm xong.
            </p>
          </div>

          <button
            class="mt-8 inline-flex cursor-pointer items-center gap-3 border border-accent-coral bg-accent-coral/10 px-8 py-3.5 font-display font-semibold text-accent-coral tracking-wide transition hover:bg-accent-coral hover:text-bg-deep animate-fade-up animate-delay-4"
            @click="startQuiz"
          >
            Bắt đầu quiz →
          </button>
        </div>
      </template>

      <!-- ─── QUIZ ─── -->
      <template v-else-if="phase === 'quiz'">
        <!-- Progress bar -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <span class="font-display text-xs tracking-widest text-text-dim">
              Câu {{ currentIndex + 1 }} / {{ NUM_OF_QUESTIONS }}
            </span>
            <span
              class="font-display text-xs tracking-widest"
              :class="categoryColors[currentQuestion.category] ?? 'text-accent-coral'"
            >
              // {{ currentQuestion.category.toUpperCase() }}
            </span>
          </div>
          <div class="h-1 w-full bg-border-default">
            <div
              class="h-1 bg-accent-coral transition-all duration-500"
              :style="{ width: progress + '%' }"
            />
          </div>
        </div>

        <!-- Question card -->
        <div
          :key="currentQuestion.id"
          class="border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up"
        >
          <p
            class="font-display text-xl sm:text-2xl font-semibold text-text-primary leading-snug mb-8"
          >
            {{ currentQuestion.text }}
          </p>

          <div class="flex flex-col gap-3">
            <button
              v-for="(answer, idx) in currentQuestion.answers"
              :key="idx"
              class="text-left cursor-pointer border border-border-default bg-bg-deep px-5 py-3.5 text-text-secondary text-sm transition-all duration-200 hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
              :class="{
                'border-accent-coral bg-bg-elevated text-text-primary':
                  selectedAnswers[currentIndex] === answer.score &&
                  currentQuestion.answers.findIndex(
                    (a) => a.score === answer.score && a.text === answer.text,
                  ) === idx,
              }"
              @click="pickAnswer(answer.score)"
            >
              <span class="font-display text-accent-coral mr-2 text-xs tracking-widest">
                {{ String.fromCharCode(65 + idx) }}.
              </span>
              {{ answer.text }}
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="mt-6 flex items-center justify-between">
          <button
            class="inline-flex cursor-pointer items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="currentIndex === 0"
            @click="goBack"
          >
            ← Quay lại
          </button>
          <span class="font-display text-xs text-text-dim tracking-widest">
            {{ Math.round(((currentIndex + 1) / NUM_OF_QUESTIONS) * 100) }}% hoàn thành
          </span>
        </div>
      </template>

      <!-- ─── RESULT ─── -->
      <template v-else-if="phase === 'result'">
        <div class="animate-fade-up">
          <!-- Score header -->
          <div class="border border-border-default bg-bg-surface p-8 mb-6 relative overflow-hidden">
            <span
              class="absolute top-3 right-4 font-display text-8xl font-bold text-accent-amber/5 select-none pointer-events-none"
            >
              {{ totalScore }}
            </span>
            <div class="flex items-center gap-2 mb-4">
              <span class="font-display text-xs tracking-widest text-accent-coral">// KẾT QUẢ</span>
            </div>
            <div class="text-6xl mb-4">{{ currentResult.emoji }}</div>
            <h2
              class="font-display text-3xl sm:text-4xl font-bold mb-3"
              :class="currentResult.color"
            >
              {{ currentResult.label }}
            </h2>
            <p class="text-text-secondary text-base leading-relaxed max-w-lg">
              {{ currentResult.description }}
            </p>
            <div class="mt-6 flex items-center gap-4">
              <div class="border border-border-default bg-bg-deep px-4 py-2">
                <span class="font-display text-xs text-text-dim tracking-widest block"
                  >TỔNG ĐIỂM</span
                >
                <span class="font-display text-2xl font-bold" :class="currentResult.color">
                  {{ totalScore }}
                </span>
                <span class="font-display text-xs text-text-dim"> / 60</span>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-2">
                <span class="font-display text-xs text-text-dim tracking-widest block"
                  >SỐ CÂU ĐÃ TRẢ LỜI</span
                >
                <span class="font-display text-2xl font-bold text-text-primary">
                  {{ selectedAnswers.filter((s) => s !== null).length }}
                </span>
                <span class="font-display text-xs text-text-dim"> / {{ NUM_OF_QUESTIONS }}</span>
              </div>
            </div>
          </div>

          <!-- Score ranges -->
          <div
            class="border border-border-default bg-bg-surface p-6 mb-6 animate-fade-up animate-delay-2"
          >
            <h3
              class="font-display text-sm tracking-widest text-text-dim mb-4 flex items-center gap-2"
            >
              <span class="text-accent-amber">// </span>THANG ĐIỂM
            </h3>
            <div class="flex flex-col gap-2">
              <div
                v-for="range in resultRanges"
                :key="range.label"
                class="flex items-start gap-3 px-3 py-2 border transition-colors"
                :class="
                  totalScore >= range.min && totalScore <= range.max
                    ? 'border-accent-coral bg-bg-elevated'
                    : 'border-transparent'
                "
              >
                <span class="text-xl">{{ range.emoji }}</span>
                <div>
                  <span class="font-display text-xs font-semibold" :class="range.color">
                    {{ range.min }}–{{ range.max === 60 ? '60' : range.max }}:
                  </span>
                  <span class="text-text-secondary text-sm ml-1">{{ range.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Funny message -->
          <div
            class="border border-accent-amber/30 bg-bg-surface p-6 mb-8 animate-fade-up animate-delay-3"
          >
            <p class="font-display text-xs tracking-widest text-accent-amber mb-2">
              // LỜI KẾT TỪ HỆ THỐNG
            </p>
            <p class="text-text-primary text-sm leading-relaxed italic">"{{ randomMessage }}"</p>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-4 animate-fade-up animate-delay-4">
            <button
              class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-6 py-2.5 font-display text-sm font-semibold text-accent-coral tracking-wide transition hover:bg-accent-coral hover:text-bg-deep"
              @click="restartQuiz"
            >
              ↺ Làm lại quiz
            </button>
            <RouterLink
              to="/"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-6 py-2.5 font-display text-sm text-text-secondary tracking-wide transition hover:border-accent-coral hover:text-text-primary"
            >
              ← Về trang chủ
            </RouterLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
