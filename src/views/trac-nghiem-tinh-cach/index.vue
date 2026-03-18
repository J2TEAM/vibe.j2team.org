<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useQuiz } from './composables/useQuiz'

const router = useRouter()
const showAboutModal = ref(false)

const {
  quizState,
  personalities,
  currentQuestionIndex,
  answers,
  result,
  history,
  isLoading,
  isStarting,
  hasSavedProgress,
  savedAnswersCount,
  currentQuestion,
  progress,
  progressText,
  currentDimension,
  loadData,
  loadFromStorage,
  continueQuiz,
  startQuiz,
  answerQuestion,
  nextQuestion,
  prevQuestion,
  viewHistory,
  backToWelcome,
  retakeQuiz,
  loadFromHistory,
  deleteHistoryItem,
} = useQuiz()

const currentAnswer = computed(() => {
  if (!currentQuestion.value) return null
  return answers.value[currentQuestion.value.id]
})

const personality = computed(() => {
  if (!result.value) return null
  return personalities.value.find((p) => p.code === result.value?.type)
})

const dimensionPairs = [
  { left: 'E', right: 'I', key: 'EI' },
  { left: 'S', right: 'N', key: 'SN' },
  { left: 'T', right: 'F', key: 'TF' },
  { left: 'J', right: 'P', key: 'JP' },
]

const likertOptions = [
  { value: -2, label: 'Hoàn toàn không đồng ý' },
  { value: -1, label: 'Không đồng ý' },
  { value: 0, label: 'Trung lập' },
  { value: 1, label: 'Đồng ý' },
  { value: 2, label: 'Hoàn toàn đồng ý' },
]

function handleAnswer(value: number) {
  answerQuestion(value)
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Reload from localStorage when returning to welcome
function onBackToWelcome() {
  // First change state to welcome, then load from storage
  // This way loadFromStorage will correctly load progress
  backToWelcome()
  loadFromStorage()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Header -->
    <header class="px-4 py-3 border-b border-border-default flex items-center justify-between">
      <RouterLink
        v-if="quizState === 'welcome'"
        to="/"
        class="text-xs text-text-secondary hover:text-accent-coral transition-colors"
      >
        <Icon icon="lucide:home" class="inline mr-1" />
        Trang chủ
      </RouterLink>
      <button
        v-if="quizState !== 'welcome'"
        class="text-xs text-text-dim hover:text-accent-coral transition-colors"
        @click="onBackToWelcome"
      >
        <Icon icon="lucide:arrow-left" class="inline mr-1" />
        Quay lại
      </button>
      <span v-else></span>
      <button
        class="text-xs text-text-dim hover:text-accent-coral transition-colors"
        @click="showAboutModal = true"
      >
        <Icon icon="lucide:info" class="inline mr-1" />
        About
      </button>
    </header>

    <!-- WELCOME SCREEN -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="quizState === 'welcome'"
        key="welcome"
        class="max-w-xl mx-auto px-4 py-16 animate-fade-up"
      >
        <div class="text-center mb-10">
          <div class="text-6xl mb-4">🧠</div>
          <h1 class="font-display text-4xl md:text-5xl mb-3">
            <span class="text-accent-coral">//</span> Trắc Nghiệm Tính Cách
          </h1>
          <p class="text-text-secondary text-lg">Khám phá con người thật của bạn</p>
        </div>

        <div class="bg-bg-surface border border-border-default p-6 mb-8">
          <p class="text-text-secondary text-sm leading-relaxed mb-4">
            Trắc nghiệm MBTI (Myers-Briggs Type Indicator) giúp bạn hiểu rõ hơn về tính cách, điểm
            mạnh, điểm yếu và cách bạn tương tác với thế giới xung quanh.
          </p>
          <div class="flex gap-4 text-xs text-text-dim mb-4">
            <span>⏱️ ~10 phút</span>
            <span>❓ 60 câu hỏi</span>
            <span>📊 16 kiểu tính cách</span>
          </div>
          <div
            class="text-xs text-accent-amber bg-accent-amber/10 px-3 py-2 rounded border border-accent-amber/30"
          >
            <Icon icon="lucide:save" class="inline mr-1" />
            Tiến trình của bạn luôn được lưu tự động, bạn có thể làm tiếp bất cứ khi nào.
          </div>
        </div>

        <!-- Loading state -->
        <!-- Loading state -->
        <div v-if="isLoading" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent-coral border-t-transparent mb-4"
          ></div>
          <p class="text-text-dim text-sm">Đang tải...</p>
        </div>

        <!-- Starting state (when clicking button) -->
        <div v-else-if="isStarting" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-accent-amber border-t-transparent mb-4"
          ></div>
          <p class="text-text-dim text-sm">Đang chuẩn bị...</p>
        </div>

        <div v-else class="flex flex-col gap-3">
          <!-- Both buttons when has saved progress - separate rows -->
          <template v-if="hasSavedProgress">
            <button
              class="w-full bg-accent-amber text-bg-deep font-display text-lg py-4 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              @click="continueQuiz"
            >
              Tiếp tục ({{ savedAnswersCount }}/60)
            </button>
            <button
              class="w-full border border-border-default text-text-secondary py-4 hover:border-accent-coral hover:text-text-primary transition-all cursor-pointer"
              @click="startQuiz"
            >
              Làm mới
            </button>
          </template>
          <!-- Single button when no saved progress -->
          <button
            v-else
            class="w-full bg-accent-coral text-white font-display text-lg py-4 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
            @click="startQuiz"
          >
            Bắt đầu
          </button>
          <button
            v-if="history.length > 0"
            class="w-full border border-border-default bg-bg-surface px-5 py-4 text-text-secondary hover:border-accent-coral hover:text-text-primary transition-all cursor-pointer"
            @click="viewHistory"
          >
            <Icon icon="lucide:history" class="inline mr-2" />
            Lịch sử
          </button>
        </div>
      </div>
    </Transition>

    <!-- QUIZ SCREEN -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="quizState === 'quiz' && currentQuestion"
        key="quiz"
        class="max-w-2xl mx-auto px-4 py-8"
      >
        <!-- Progress -->
        <div class="mb-6">
          <div class="flex justify-between text-xs text-text-dim mb-2">
            <span>{{ progressText }}</span>
            <span>{{ progress }}%</span>
          </div>
          <div class="h-1 bg-bg-elevated w-full">
            <div
              class="h-full bg-accent-coral transition-all duration-300"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <div class="mt-2 flex gap-2 justify-center">
            <span
              v-for="dim in ['EI', 'SN', 'TF', 'JP']"
              :key="dim"
              class="text-xs px-2 py-1"
              :class="
                dim === currentDimension
                  ? 'bg-accent-coral text-white'
                  : 'bg-bg-surface text-text-dim'
              "
            >
              {{ dim }}
            </span>
          </div>
        </div>

        <!-- Question -->
        <Transition name="slide" mode="out-in">
          <div :key="currentQuestion.id">
            <h2 class="font-display text-xl md:text-2xl mb-8 text-text-primary leading-snug">
              {{ currentQuestion.text }}
            </h2>

            <!-- Likert Scale -->
            <div class="flex flex-col gap-3">
              <button
                v-for="option in likertOptions"
                :key="option.value"
                class="group flex items-center gap-4 text-left border border-border-default bg-bg-surface p-4 hover:border-accent-coral hover:bg-bg-elevated transition-all cursor-pointer"
                :class="{ '!border-accent-coral !bg-bg-elevated': currentAnswer === option.value }"
                @click="handleAnswer(option.value)"
              >
                <span
                  class="shrink-0 w-8 h-8 flex items-center justify-center border text-sm font-mono transition-colors"
                  :class="
                    currentAnswer === option.value
                      ? 'border-accent-coral text-accent-coral'
                      : 'border-border-default text-text-dim group-hover:border-accent-coral group-hover:text-accent-coral'
                  "
                >
                  {{ option.value > 0 ? '+' : '' }}{{ option.value }}
                </span>
                <span
                  class="text-sm text-text-secondary group-hover:text-text-primary transition-colors"
                >
                  {{ option.label }}
                </span>
              </button>
            </div>

            <!-- Navigation -->
            <div class="flex justify-between mt-8">
              <button
                class="text-text-dim hover:text-text-primary transition-colors cursor-pointer"
                :disabled="currentQuestionIndex === 0"
                :class="{ 'opacity-30 cursor-not-allowed': currentQuestionIndex === 0 }"
                @click="prevQuestion"
              >
                <Icon icon="lucide:chevron-left" class="inline mr-1" />
                Trước
              </button>
              <button
                class="text-text-dim hover:text-text-primary transition-colors cursor-pointer"
                @click="nextQuestion"
              >
                Sau
                <Icon icon="lucide:chevron-right" class="inline ml-1" />
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- RESULT SCREEN -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="quizState === 'result' && result"
        key="result"
        class="max-w-2xl mx-auto px-4 py-10 animate-fade-up"
      >
        <!-- Result Header -->
        <div class="text-center mb-8">
          <div class="text-5xl mb-3">{{ personality?.emoji || '🧠' }}</div>
          <div class="font-display text-6xl font-bold text-accent-coral mb-2 tracking-wider">
            {{ result.type }}
          </div>
          <h2 class="font-display text-2xl text-text-primary mb-1">
            {{ personality?.nameVi || result.type }}
          </h2>
          <p class="text-text-dim text-sm uppercase tracking-widest">
            {{ personality?.groupNameVi || personality?.group }} • {{ personality?.population }}
          </p>
        </div>

        <!-- Dimension Bars -->
        <div class="bg-bg-surface border border-border-default p-5 mb-6">
          <h3 class="text-xs text-text-dim uppercase tracking-widest mb-4">Phân tích chi tiết</h3>
          <div class="flex flex-col gap-4">
            <div v-for="pair in dimensionPairs" :key="pair.key" class="flex items-center gap-3">
              <span class="w-12 text-right text-text-secondary font-display">{{ pair.left }}</span>
              <div class="flex-1 h-3 bg-bg-elevated relative">
                <div
                  class="absolute left-0 top-0 h-full bg-accent-coral transition-all duration-1000"
                  :style="{ width: `${result.percentages[pair.left]}%` }"
                />
              </div>
              <span class="w-12 text-text-secondary">{{ pair.right }}</span>
              <span class="w-12 text-right text-accent-coral font-mono text-sm">
                {{ result.percentages[pair.left] }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="personality" class="bg-bg-surface border border-border-default p-5 mb-4">
          <h3 class="font-display text-sm text-accent-coral mb-3">
            <span class="text-accent-coral">//</span> Tổng quan
          </h3>
          <p class="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
            {{ personality.description }}
          </p>
        </div>

        <!-- Traits -->
        <div v-if="personality?.traits" class="bg-bg-surface border border-border-default p-5 mb-4">
          <h3 class="font-display text-sm text-accent-sky mb-3">
            <span class="text-accent-sky">//</span> Đặc điểm nổi bật
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="trait in personality.traits"
              :key="trait"
              class="text-xs bg-bg-elevated px-3 py-1.5 text-text-secondary"
            >
              {{ trait }}
            </span>
          </div>
        </div>

        <!-- Strengths & Weaknesses -->
        <div class="grid md:grid-cols-2 gap-4 mb-4">
          <div class="bg-bg-surface border border-border-default p-5">
            <h3 class="font-display text-sm text-accent-coral mb-3">
              <span class="text-accent-coral">+</span> Điểm mạnh
            </h3>
            <ul class="flex flex-col gap-2">
              <li
                v-for="(s, i) in personality?.strengths"
                :key="i"
                class="text-text-secondary text-sm flex gap-2"
              >
                <span class="text-accent-coral shrink-0">+</span>
                <span>{{ s }}</span>
              </li>
            </ul>
          </div>
          <div class="bg-bg-surface border border-border-default p-5">
            <h3 class="font-display text-sm text-accent-amber mb-3">
              <span class="text-accent-amber">−</span> Điểm yếu
            </h3>
            <ul class="flex flex-col gap-2">
              <li
                v-for="(w, i) in personality?.weaknesses"
                :key="i"
                class="text-text-secondary text-sm flex gap-2"
              >
                <span class="text-accent-amber shrink-0">−</span>
                <span>{{ w }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Compatible Types -->
        <div
          v-if="personality?.compatibleTypes"
          class="bg-bg-surface border border-border-default p-5 mb-6"
        >
          <h3 class="font-display text-sm text-accent-sky mb-3">
            <span class="text-accent-sky">//</span> Tương thích với
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="type in personality.compatibleTypes"
              :key="type"
              class="text-sm bg-accent-sky/10 text-accent-sky px-3 py-1.5 border border-accent-sky/30"
            >
              {{ type }}
            </span>
          </div>
        </div>

        <!-- Famous People -->
        <div
          v-if="personality?.famousPeople"
          class="bg-bg-surface border border-border-default p-5 mb-6"
        >
          <h3 class="font-display text-sm text-text-dim mb-3">
            <span class="text-accent-coral">//</span> Người nổi tiếng cùng tính cách
          </h3>
          <p class="text-text-secondary text-sm">
            {{ personality.famousPeople.join(', ') }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            class="flex-1 border border-border-default text-text-secondary py-3 hover:border-accent-coral hover:text-text-primary transition-all cursor-pointer text-sm"
            @click="retakeQuiz"
          >
            <Icon icon="lucide:refresh" class="inline mr-2" />
            Làm lại
          </button>
          <button
            v-if="history.length > 0"
            class="border border-border-default bg-bg-surface px-5 py-3 text-text-secondary hover:border-accent-coral hover:text-text-primary transition-all cursor-pointer text-sm"
            @click="viewHistory"
          >
            <Icon icon="lucide:history" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- HISTORY SCREEN -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="quizState === 'history'"
        key="history"
        class="max-w-xl mx-auto px-4 py-10 animate-fade-up"
      >
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-display text-2xl text-text-primary">
            <span class="text-accent-coral">//</span> Lịch sử
          </h2>
          <button
            class="text-text-dim hover:text-text-primary transition-colors cursor-pointer"
            @click="backToWelcome"
          >
            <Icon icon="lucide:x" />
          </button>
        </div>

        <div v-if="history.length === 0" class="text-center py-10 text-text-dim">
          <Icon icon="lucide:history" class="text-4xl mb-3 mx-auto opacity-50" />
          <p>Chưa có kết quả nào</p>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="bg-bg-surface border border-border-default p-4 flex items-center justify-between hover:border-accent-coral transition-all cursor-pointer group"
            @click="loadFromHistory(index)"
          >
            <div class="flex items-center gap-4">
              <span class="font-display text-2xl text-accent-coral">{{ item.type }}</span>
              <div>
                <p class="text-text-primary text-sm">{{ formatDate(item.date) }}</p>
                <p class="text-text-dim text-xs">
                  E{{ item.percentages.E }}% I{{ item.percentages.I }}% • S{{ item.percentages.S }}%
                  N{{ item.percentages.N }}% • T{{ item.percentages.T }}% F{{ item.percentages.F }}%
                  • J{{ item.percentages.J }}% P{{ item.percentages.P }}%
                </p>
              </div>
            </div>
            <button
              class="text-text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2"
              @click.stop="deleteHistoryItem(index)"
            >
              <Icon icon="lucide:trash-2" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- About Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAboutModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/60" @click="showAboutModal = false" />

          <!-- Modal Content -->
          <div
            class="relative bg-bg-surface border border-border-default max-w-md w-full p-6 shadow-xl"
          >
            <button
              class="absolute top-4 right-4 text-text-dim hover:text-text-primary transition-colors"
              @click="showAboutModal = false"
            >
              <Icon icon="lucide:x" />
            </button>

            <h2 class="font-display text-xl text-accent-coral mb-4">
              <Icon icon="lucide:info" class="inline mr-2" />
              Về Trắc Nghiệm Tính Cách
            </h2>

            <div class="text-text-secondary text-sm space-y-4 leading-relaxed">
              <p>
                Bài trắc nghiệm MBTI (Myers-Briggs Type Indicator) này được thiết kế để giúp bạn
                hiểu rõ hơn về tính cách, điểm mạnh, điểm yếu và cách bạn tương tác với thế giới
                xung quanh.
              </p>

              <div class="bg-bg-elevated p-4 border border-border-default">
                <h3 class="font-display text-sm text-accent-amber mb-2">
                  <Icon icon="lucide:alert-triangle" class="inline mr-1" />
                  Lưu ý quan trọng
                </h3>
                <p>
                  Kết quả của bài test này có tính chất <strong>tham khảo</strong>. MBTI không phải
                  là công cụ chẩn đoán tâm lý hay đánh giá năng lực. Hãy sử dụng kết quả như một
                  công cụ để tự khám phá bản thân, không phải để định kiến hay phân loại người khác.
                </p>
              </div>

              <p class="text-text-dim text-xs">
                Dữ liệu và nội dung được cung cấp bởi <strong>Model Claude Opus 4.6</strong>
              </p>

              <p class="text-center pt-2">
                <button
                  class="text-accent-coral hover:underline text-sm"
                  @click="
                    () => {
                      showAboutModal = false
                      router.push('/author/hidang')
                    }
                  "
                >
                  vibe by hidang
                </button>
              </p>

              <button
                class="w-full mt-6 bg-accent-coral text-white font-display py-3 hover:opacity-90 transition-colors"
                @click="showAboutModal = false"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
