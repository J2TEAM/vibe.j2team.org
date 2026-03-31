<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// --- MBI Questions adapted for IT/Dev ---
interface Question {
  text: string
  dimension: 'EE' | 'DP' | 'PA'
}

const questions: Question[] = [
  // Emotional Exhaustion (EE) - 9 questions
  { text: 'Tôi cảm thấy kiệt sức về mặt tinh thần vì công việc.', dimension: 'EE' },
  { text: 'Cuối ngày làm việc, tôi cảm thấy cạn kiệt hoàn toàn.', dimension: 'EE' },
  { text: 'Sáng dậy phải đối mặt với công việc khiến tôi mệt mỏi.', dimension: 'EE' },
  { text: 'Làm việc cả ngày với người khác thực sự là áp lực lớn.', dimension: 'EE' },
  { text: 'Tôi cảm thấy bị đốt cháy bởi công việc.', dimension: 'EE' },
  { text: 'Tôi cảm thấy bất lực vì công việc.', dimension: 'EE' },
  { text: 'Tôi cảm thấy mình đang làm việc quá sức.', dimension: 'EE' },
  { text: 'Làm việc trực tiếp với người khác tạo ra quá nhiều stress.', dimension: 'EE' },
  { text: 'Tôi cảm thấy như đang ở cuối đường, không còn gì để cho.', dimension: 'EE' },

  // Depersonalization (DP) - 5 questions
  { text: 'Tôi đối xử với đồng nghiệp/khách hàng như những đối tượng vô cảm.', dimension: 'DP' },
  {
    text: 'Tôi trở nên lạnh lùng hơn với mọi người kể từ khi nhận công việc này.',
    dimension: 'DP',
  },
  { text: 'Tôi lo ngại rằng công việc đang khiến tôi chai sạn về cảm xúc.', dimension: 'DP' },
  { text: 'Tôi thực sự không quan tâm đến những gì xảy ra với đồng nghiệp.', dimension: 'DP' },
  { text: 'Tôi cảm thấy đồng nghiệp đổ lỗi cho tôi về vấn đề của họ.', dimension: 'DP' },

  // Personal Accomplishment (PA) - 8 questions (reverse scored)
  { text: 'Tôi có thể dễ dàng hiểu cảm xúc của đồng nghiệp.', dimension: 'PA' },
  { text: 'Tôi xử lý các vấn đề trong công việc rất hiệu quả.', dimension: 'PA' },
  {
    text: 'Tôi cảm thấy mình đang ảnh hưởng tích cực đến cuộc sống người khác qua công việc.',
    dimension: 'PA',
  },
  { text: 'Tôi cảm thấy rất năng động và tràn đầy năng lượng.', dimension: 'PA' },
  { text: 'Tôi có thể tạo ra không khí thoải mái với đồng nghiệp.', dimension: 'PA' },
  { text: 'Tôi cảm thấy phấn chấn sau khi làm việc chặt chẽ với đồng nghiệp.', dimension: 'PA' },
  { text: 'Tôi đã đạt được nhiều thành tựu đáng giá trong công việc này.', dimension: 'PA' },
  { text: 'Trong công việc, tôi xử lý các vấn đề cảm xúc rất bình tĩnh.', dimension: 'PA' },
]

const frequencyLabels = [
  { value: 0, label: 'Không bao giờ', emoji: '😌' },
  { value: 1, label: 'Vài lần/năm', emoji: '🙂' },
  { value: 2, label: 'Mỗi tháng', emoji: '😐' },
  { value: 3, label: 'Vài lần/tháng', emoji: '😕' },
  { value: 4, label: 'Mỗi tuần', emoji: '😟' },
  { value: 5, label: 'Vài lần/tuần', emoji: '😣' },
  { value: 6, label: 'Mỗi ngày', emoji: '😵' },
]

// --- State ---
const answers = ref<number[]>(Array.from({ length: questions.length }, () => -1))
const currentQuestion = ref(0)
const showResult = ref(false)

const answeredCount = computed(() => answers.value.filter((a) => a >= 0).length)
const progress = computed(() => (answeredCount.value / questions.length) * 100)
const allAnswered = computed(() => answeredCount.value === questions.length)

// --- Scoring ---
const scores = computed(() => {
  const ee = questions
    .map((q, i) => (q.dimension === 'EE' ? (answers.value[i] ?? 0) : 0))
    .reduce((a, b) => a + b, 0)
  const dp = questions
    .map((q, i) => (q.dimension === 'DP' ? (answers.value[i] ?? 0) : 0))
    .reduce((a, b) => a + b, 0)
  // PA is reverse: HIGH score = LOW burnout
  const pa = questions
    .map((q, i) => (q.dimension === 'PA' ? (answers.value[i] ?? 0) : 0))
    .reduce((a, b) => a + b, 0)

  return { ee, dp, pa }
})

// MBI severity thresholds
const severity = computed(() => {
  const { ee, dp, pa } = scores.value
  return {
    ee: ee >= 27 ? 'high' : ee >= 17 ? 'moderate' : 'low',
    dp: dp >= 13 ? 'high' : dp >= 7 ? 'moderate' : 'low',
    pa: pa <= 21 ? 'high' : pa <= 31 ? 'moderate' : 'low', // PA reverse
  } as Record<string, 'low' | 'moderate' | 'high'>
})

const overallBurnout = computed(() => {
  const s = severity.value
  const highCount = Object.values(s).filter((v) => v === 'high').length
  const modCount = Object.values(s).filter((v) => v === 'moderate').length
  if (highCount >= 2) return 'critical'
  if (highCount >= 1 || modCount >= 2) return 'warning'
  if (modCount >= 1) return 'caution'
  return 'healthy'
})

const burnoutConfig = computed(() => {
  const configs = {
    critical: {
      label: 'NGUY HIỂM',
      emoji: '🔴',
      color: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/30',
      message:
        'Bạn đang có dấu hiệu burnout nghiêm trọng. Hãy nghiêm túc xem xét việc nghỉ ngơi, trao đổi với quản lý, hoặc tìm kiếm hỗ trợ từ chuyên gia tâm lý.',
    },
    warning: {
      label: 'CẢNH BÁO',
      emoji: '🟡',
      color: 'text-accent-amber',
      bg: 'bg-accent-amber/10 border-accent-amber/30',
      message:
        'Bạn đang có dấu hiệu kiệt sức ở mức đáng lo ngại. Cần chủ động điều chỉnh: giảm workload, đặt ranh giới công việc-cuộc sống, và dành thời gian cho bản thân.',
    },
    caution: {
      label: 'LƯU Ý',
      emoji: '🟠',
      color: 'text-accent-coral',
      bg: 'bg-accent-coral/10 border-accent-coral/30',
      message:
        'Bạn có một số dấu hiệu stress nhẹ. Đây là bình thường nhưng hãy theo dõi và chăm sóc bản thân tốt hơn.',
    },
    healthy: {
      label: 'KHỎE MẠNH',
      emoji: '🟢',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/30',
      message:
        'Tuyệt vời! Sức khỏe tinh thần của bạn đang ở mức tốt. Hãy duy trì lối sống lành mạnh này.',
    },
  }
  return configs[overallBurnout.value] ?? configs.healthy
})

// Radar chart data (normalized 0-100)
const radarData = computed(() => {
  const eeMax = 54 // 9 questions * 6
  const dpMax = 30 // 5 questions * 6
  const paMax = 48 // 8 questions * 6

  return {
    ee: Math.round((scores.value.ee / eeMax) * 100),
    dp: Math.round((scores.value.dp / dpMax) * 100),
    pa: Math.round(((paMax - scores.value.pa) / paMax) * 100), // Reverse PA
  }
})

// --- Actions ---
function selectAnswer(value: number) {
  answers.value[currentQuestion.value] = value
  // Auto-advance
  if (currentQuestion.value < questions.length - 1) {
    setTimeout(() => {
      currentQuestion.value++
    }, 300)
  }
}

function goTo(index: number) {
  currentQuestion.value = index
}

function viewResults() {
  showResult.value = true
}

function retake() {
  answers.value = Array.from({ length: questions.length }, () => -1)
  currentQuestion.value = 0
  showResult.value = false
}

function severityLabel(level: string): string {
  if (level === 'high') return 'Cao'
  if (level === 'moderate') return 'Trung bình'
  return 'Thấp'
}

function severityColor(level: string): string {
  if (level === 'high') return 'text-red-400'
  if (level === 'moderate') return 'text-accent-amber'
  return 'text-emerald-400'
}

function dimensionLabel(dim: string): string {
  if (dim === 'ee') return 'Kiệt sức cảm xúc'
  if (dim === 'dp') return 'Mất kết nối'
  return 'Hiệu quả cá nhân'
}

function dimensionIcon(dim: string): string {
  if (dim === 'ee') return 'lucide:battery-low'
  if (dim === 'dp') return 'lucide:unplug'
  return 'lucide:trophy'
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- Header -->
    <div class="border-b border-border-default bg-bg-surface">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 text-text-secondary text-sm hover:text-accent-coral transition"
        >
          <Icon icon="lucide:arrow-left" class="w-4 h-4" />
          Trang chủ
        </RouterLink>
        <div class="flex items-center gap-2">
          <Icon icon="lucide:flame" class="w-5 h-5 text-accent-coral" />
          <span class="font-display font-bold text-accent-coral">Dev Burnout Meter</span>
        </div>
        <span class="text-[10px] text-text-dim font-display">
          bởi
          <a
            href="https://www.facebook.com/nmdung.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral hover:underline"
            >nmdung.dev</a
          >
        </span>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6">
      <!-- QUIZ MODE -->
      <template v-if="!showResult">
        <!-- Progress bar -->
        <div class="mb-6 animate-fade-up">
          <div class="flex justify-between text-xs text-text-dim mb-2">
            <span>Câu {{ currentQuestion + 1 }} / {{ questions.length }}</span>
            <span>{{ answeredCount }} đã trả lời</span>
          </div>
          <div class="h-1.5 bg-bg-elevated overflow-hidden">
            <div
              class="h-full bg-accent-coral transition-all duration-500"
              :style="{ width: progress + '%' }"
            />
          </div>
        </div>

        <!-- Question navigation dots -->
        <div class="flex flex-wrap gap-1.5 mb-6 justify-center animate-fade-up animate-delay-1">
          <button
            v-for="(q, i) in questions"
            :key="i"
            :class="[
              'w-7 h-7 text-[10px] font-display font-semibold transition-all',
              i === currentQuestion
                ? 'bg-accent-coral text-bg-deep scale-110'
                : answers[i] !== undefined && answers[i] >= 0
                  ? 'bg-accent-coral/20 text-accent-coral border border-accent-coral/30'
                  : 'bg-bg-elevated text-text-dim border border-border-default hover:border-accent-coral/40',
            ]"
            @click="goTo(i)"
          >
            {{ i + 1 }}
          </button>
        </div>

        <!-- Current question -->
        <div
          class="border border-border-default bg-bg-surface p-6 md:p-8 mb-6 animate-fade-up animate-delay-2"
        >
          <div class="flex items-start gap-3 mb-2">
            <span class="text-accent-coral font-display text-sm tracking-widest mt-1">//</span>
            <div>
              <span class="text-[10px] text-text-dim font-display tracking-widest block mb-1">
                {{
                  questions[currentQuestion]?.dimension === 'EE'
                    ? 'KIỆT SỨC CẢM XÚC'
                    : questions[currentQuestion]?.dimension === 'DP'
                      ? 'MẤT KẾT NỐI'
                      : 'HIỆU QUẢ CÁ NHÂN'
                }}
              </span>
              <p class="text-lg md:text-xl font-medium leading-relaxed">
                {{ questions[currentQuestion]?.text }}
              </p>
            </div>
          </div>
        </div>

        <!-- Frequency options -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 animate-fade-up animate-delay-3">
          <button
            v-for="freq in frequencyLabels"
            :key="freq.value"
            :class="[
              'p-3 border text-center transition-all duration-200 active:scale-95',
              answers[currentQuestion] === freq.value
                ? 'bg-accent-coral/20 border-accent-coral text-accent-coral'
                : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral/40 hover:bg-bg-elevated',
            ]"
            @click="selectAnswer(freq.value)"
          >
            <span class="text-xl block mb-1">{{ freq.emoji }}</span>
            <span class="text-[11px] font-display font-semibold block">{{ freq.label }}</span>
          </button>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between animate-fade-up animate-delay-4">
          <button
            :disabled="currentQuestion === 0"
            class="px-4 py-2 text-sm border border-border-default text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            @click="currentQuestion--"
          >
            <Icon icon="lucide:chevron-left" class="w-4 h-4" />
            Trước
          </button>

          <button
            v-if="allAnswered"
            class="px-6 py-2.5 bg-accent-coral text-bg-deep font-display font-bold text-sm transition hover:bg-accent-coral/90 active:scale-95 flex items-center gap-2"
            @click="viewResults"
          >
            <Icon icon="lucide:bar-chart-3" class="w-4 h-4" />
            Xem kết quả
          </button>

          <button
            :disabled="currentQuestion === questions.length - 1"
            class="px-4 py-2 text-sm border border-border-default text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            @click="currentQuestion++"
          >
            Sau
            <Icon icon="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </template>

      <!-- RESULT MODE -->
      <template v-else>
        <!-- Overall result -->
        <div :class="['border p-6 md:p-8 mb-6 text-center animate-fade-up', burnoutConfig.bg]">
          <div class="text-5xl mb-3">{{ burnoutConfig.emoji }}</div>
          <h2 :class="['font-display text-3xl md:text-4xl font-bold mb-2', burnoutConfig.color]">
            {{ burnoutConfig.label }}
          </h2>
          <p class="text-text-secondary text-sm md:text-base leading-relaxed max-w-lg mx-auto">
            {{ burnoutConfig.message }}
          </p>
        </div>

        <!-- Scores breakdown -->
        <div class="grid gap-3 md:grid-cols-3 mb-6 animate-fade-up animate-delay-1">
          <div
            v-for="dim in ['ee', 'dp', 'pa'] as const"
            :key="dim"
            class="border border-border-default bg-bg-surface p-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <Icon :icon="dimensionIcon(dim)" class="w-4 h-4 text-accent-coral" />
              <span class="font-display text-xs font-semibold tracking-widest text-text-secondary">
                {{ dimensionLabel(dim).toUpperCase() }}
              </span>
            </div>

            <!-- Bar -->
            <div class="h-3 bg-bg-deep mb-2 overflow-hidden">
              <div
                class="h-full transition-all duration-1000"
                :class="
                  severity[dim] === 'high'
                    ? 'bg-red-400'
                    : severity[dim] === 'moderate'
                      ? 'bg-accent-amber'
                      : 'bg-emerald-400'
                "
                :style="{ width: radarData[dim] + '%' }"
              />
            </div>

            <div class="flex justify-between items-center">
              <span class="text-xs text-text-dim">{{ radarData[dim] }}%</span>
              <span
                :class="[
                  'text-xs font-display font-semibold',
                  severityColor(severity[dim] ?? 'low'),
                ]"
              >
                {{ severityLabel(severity[dim] ?? 'low') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Dimension explanations -->
        <div
          class="border border-border-default bg-bg-surface p-5 mb-6 animate-fade-up animate-delay-2"
        >
          <h3
            class="font-display text-sm font-semibold text-text-secondary tracking-widest mb-4 flex items-center gap-2"
          >
            <span class="text-accent-sky">//</span>
            GIẢI THÍCH CHỈ SỐ
          </h3>
          <div class="space-y-3 text-sm text-text-secondary">
            <div class="flex gap-3">
              <Icon icon="lucide:battery-low" class="w-4 h-4 text-accent-coral shrink-0 mt-0.5" />
              <div>
                <span class="font-semibold text-text-primary">Kiệt sức cảm xúc (EE):</span>
                Cảm giác bị vắt kiệt năng lượng. Càng cao → càng cần nghỉ ngơi.
              </div>
            </div>
            <div class="flex gap-3">
              <Icon icon="lucide:unplug" class="w-4 h-4 text-accent-coral shrink-0 mt-0.5" />
              <div>
                <span class="font-semibold text-text-primary">Mất kết nối (DP):</span>
                Trở nên lạnh lùng, coi đồng nghiệp như "robot". Càng cao → càng cần kết nối lại.
              </div>
            </div>
            <div class="flex gap-3">
              <Icon icon="lucide:trophy" class="w-4 h-4 text-accent-coral shrink-0 mt-0.5" />
              <div>
                <span class="font-semibold text-text-primary">Hiệu quả cá nhân (PA):</span>
                Cảm giác thành tựu và đóng góp. Thanh thấp = bạn cảm thấy vô dụng → cần được động
                viên.
              </div>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div
          class="border border-accent-sky/30 bg-bg-surface p-5 mb-6 animate-fade-up animate-delay-3"
        >
          <h3
            class="font-display text-sm font-semibold text-text-secondary tracking-widest mb-4 flex items-center gap-2"
          >
            <span class="text-accent-sky">//</span>
            LỜI KHUYÊN CHO DEV
          </h3>
          <div class="grid gap-2 sm:grid-cols-2 text-sm">
            <div class="flex gap-2 items-start p-2 border border-border-default bg-bg-deep">
              <span class="text-lg">🛌</span>
              <span class="text-text-secondary">Ngủ đủ 7-8 tiếng, không code đêm.</span>
            </div>
            <div class="flex gap-2 items-start p-2 border border-border-default bg-bg-deep">
              <span class="text-lg">🚶</span>
              <span class="text-text-secondary">Đứng dậy mỗi 45 phút, đi bộ 5 phút.</span>
            </div>
            <div class="flex gap-2 items-start p-2 border border-border-default bg-bg-deep">
              <span class="text-lg">🚫</span>
              <span class="text-text-secondary">Tắt Slack/Teams sau giờ làm việc.</span>
            </div>
            <div class="flex gap-2 items-start p-2 border border-border-default bg-bg-deep">
              <span class="text-lg">🗣️</span>
              <span class="text-text-secondary">Nói "không" khi workload quá tải.</span>
            </div>
            <div class="flex gap-2 items-start p-2 border border-border-default bg-bg-deep">
              <span class="text-lg">🎮</span>
              <span class="text-text-secondary">Dành thời gian cho sở thích ngoài code.</span>
            </div>
            <div class="flex gap-2 items-start p-2 border border-border-default bg-bg-deep">
              <span class="text-lg">💬</span>
              <span class="text-text-secondary">Tìm mentor hoặc cộng đồng để chia sẻ.</span>
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="text-xs text-text-dim text-center mb-6 animate-fade-up animate-delay-4">
          <Icon icon="lucide:info" class="inline w-3 h-3 mr-1" />
          Công cụ này chỉ mang tính tham khảo, không thay thế chẩn đoán y khoa. Nếu bạn gặp vấn đề
          nghiêm trọng, hãy liên hệ chuyên gia tâm lý.
        </div>

        <!-- Retake button -->
        <div class="text-center animate-fade-up animate-delay-5">
          <button
            class="px-6 py-3 border border-accent-coral/30 text-accent-coral font-display font-semibold text-sm transition hover:bg-accent-coral/10 active:scale-95 inline-flex items-center gap-2"
            @click="retake"
          >
            <Icon icon="lucide:rotate-ccw" class="w-4 h-4" />
            Làm lại
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
