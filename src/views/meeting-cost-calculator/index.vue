<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useIntervalFn } from '@vueuse/core'
import './style.css'

// --- Types ---
interface ComparisonItem {
  icon: string
  label: string
  cost: number
  count?: number
}

interface DramaticPhrase {
  threshold: number
  text: string
}

interface FunFact {
  icon: string
  color: string
  text: string
}

interface AppData {
  comparisons: ComparisonItem[]
  dramaticPhrases: DramaticPhrase[]
  funFacts: FunFact[]
}

// --- State ---
const numPeople = ref(6)
const avgMonthlySalary = ref(20) // triệu VND / tháng
const meetingMinutes = ref(60)
const revealed = ref(false)
const resultKey = ref(0)
const appData = ref<AppData | null>(null)
const funFactIndex = ref(0)
const funFactDirection = ref<'left' | 'right'>('right')
const isAutoPlaying = ref(true)

// Load data
onMounted(async () => {
  const res = await fetch('/meeting-cost-calculator/data.json')
  appData.value = await res.json()
})

// Auto-next mỗi 5s khi đã reveal, user click arrow → dừng auto
const { pause: pauseAuto, resume: resumeAuto } = useIntervalFn(() => {
  if (!isAutoPlaying.value) return
  funFactDirection.value = 'right'
  funFactIndex.value = (funFactIndex.value + 1) % (appData.value?.funFacts.length ?? 1)
}, 5000)

watch(revealed, (val) => {
  if (val) {
    funFactIndex.value = 0
    isAutoPlaying.value = true
    resumeAuto()
  } else {
    pauseAuto()
  }
})

function prevFact() {
  isAutoPlaying.value = false
  pauseAuto()
  funFactDirection.value = 'left'
  const total = appData.value?.funFacts.length ?? 1
  funFactIndex.value = (funFactIndex.value - 1 + total) % total
}

function nextFact() {
  isAutoPlaying.value = false
  pauseAuto()
  funFactDirection.value = 'right'
  funFactIndex.value = (funFactIndex.value + 1) % (appData.value?.funFacts.length ?? 1)
}

// Click nút → reveal mãi mãi
function reveal() {
  revealed.value = true
}

// Khi slider thay đổi + đã reveal → cập nhật kết quả
watch([numPeople, avgMonthlySalary, meetingMinutes], () => {
  if (revealed.value) {
    resultKey.value++
  }
})

onUnmounted(() => {
  pauseAuto()
})

// Lương trung bình / giờ (22 ngày × 8h)
const avgHourlyRate = computed(() => {
  return (avgMonthlySalary.value * 1_000_000) / (22 * 8)
})

// Tổng chi phí cuộc họp
const totalCost = computed(() => {
  return ((avgHourlyRate.value * meetingMinutes.value) / 60) * numPeople.value
})

const totalCostFormatted = computed(() => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalCost.value)
})

// Chi phí mỗi phút
const perMinuteFormatted = computed(() => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalCost.value / meetingMinutes.value)
})

// Đổi ra các thứ khác
const comparisons = computed(() => {
  if (!appData.value) return []
  const cost = totalCost.value
  return appData.value.comparisons
    .map((item) => ({
      ...item,
      count: Math.floor(cost / item.cost),
    }))
    .filter((item) => item.count > 0)
})

// Câu cảnh báo theo mức chi phí
const dramaticPhrase = computed(() => {
  if (!appData.value) return ''
  const cost = totalCost.value
  const phrases = appData.value.dramaticPhrases
  for (const phrase of phrases) {
    if (cost >= phrase.threshold) return phrase.text
  }
  return phrases[phrases.length - 1]!.text
})

// Active fact duy nhất
const activeFact = computed(() => {
  if (!appData.value) return null
  return appData.value.funFacts[funFactIndex.value] ?? null
})

// Slider tick marks
const peopleMarks = [2, 5, 10, 15, 20, 30]
const salaryMarks = [10, 20, 30, 50, 80, 100]
const timeMarks = [15, 30, 45, 60, 90, 120]
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <!-- Back link -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-text-dim text-sm hover:text-accent-coral transition mb-10 group"
      >
        <Icon icon="lucide:arrow-left" class="size-4 group-hover:-translate-x-1 transition" />
        Về trang chủ
      </RouterLink>

      <!-- Header -->
      <header class="mb-12 text-center">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-accent-coral/30 bg-accent-coral/10 mb-6"
        >
          <Icon icon="lucide:timer" class="size-8 text-accent-coral" />
        </div>
        <h1 class="font-display text-3xl sm:text-5xl font-bold text-text-primary leading-tight">
          Meeting Cost<br />
          <span class="text-accent-coral">Calculator</span>
        </h1>
        <p class="mt-4 text-text-secondary text-base max-w-md mx-auto">
          Cuộc họp này tốn bao nhiêu tiền? Spoiler: nhiều hơn bạn nghĩ. Nhập số liệu và nhấn nút
          "Tính toán nỗi đau".
        </p>
      </header>

      <!-- Input Card -->
      <div class="border border-border-default bg-bg-surface p-6 sm:p-8 mb-8">
        <!-- Số người -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <label class="text-text-secondary text-sm flex items-center gap-2">
              <Icon icon="lucide:users" class="size-4 text-accent-sky" />
              Số người tham dự
            </label>
            <span class="font-display text-2xl font-bold text-accent-coral tabular-nums">
              {{ numPeople }}
            </span>
          </div>
          <input
            v-model="numPeople"
            type="range"
            min="2"
            max="50"
            class="w-full h-2 bg-bg-elevated rounded-full appearance-none cursor-pointer accent-accent-coral"
          />
          <div class="flex justify-between mt-1.5 text-text-dim text-xs font-mono">
            <span
              v-for="m in peopleMarks"
              :key="m"
              :class="numPeople === m ? 'text-accent-coral font-bold' : ''"
              >{{ m }}</span
            >
          </div>
        </div>

        <!-- Lương trung bình -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <label class="text-text-secondary text-sm flex items-center gap-2">
              <Icon icon="lucide:wallet" class="size-4 text-accent-amber" />
              Lương TB (triệu VND / tháng)
            </label>
            <span class="font-display text-2xl font-bold text-accent-amber tabular-nums">
              {{ avgMonthlySalary }}M
            </span>
          </div>
          <input
            v-model="avgMonthlySalary"
            type="range"
            min="5"
            max="150"
            step="5"
            class="w-full h-2 bg-bg-elevated rounded-full appearance-none cursor-pointer accent-accent-amber"
          />
          <div class="flex justify-between mt-1.5 text-text-dim text-xs font-mono">
            <span
              v-for="m in salaryMarks"
              :key="m"
              :class="avgMonthlySalary === m ? 'text-accent-amber font-bold' : ''"
              >{{ m }}M</span
            >
          </div>
          <p class="mt-2 text-text-dim text-xs">
            ≈
            {{
              new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(
                Math.round(avgHourlyRate),
              )
            }}đ / giờ (22 ngày × 8h)
          </p>
        </div>

        <!-- Thời gian họp -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-text-secondary text-sm flex items-center gap-2">
              <Icon icon="lucide:clock" class="size-4 text-accent-sky" />
              Thời gian cuộc họp
            </label>
            <span class="font-display text-2xl font-bold text-accent-sky tabular-nums">
              {{ meetingMinutes }} phút
            </span>
          </div>
          <input
            v-model="meetingMinutes"
            type="range"
            min="5"
            max="180"
            step="5"
            class="w-full h-2 bg-bg-elevated rounded-full appearance-none cursor-pointer accent-accent-sky"
          />
          <div class="flex justify-between mt-1.5 text-text-dim text-xs font-mono">
            <span
              v-for="m in timeMarks"
              :key="m"
              :class="meetingMinutes === m ? 'text-accent-sky font-bold' : ''"
              >{{ m }}p</span
            >
          </div>
        </div>
      </div>

      <!-- CTA Button (chỉ hiện lần đầu) -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition-all duration-300 ease-in"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="!revealed" class="text-center mb-8">
          <button
            @click="reveal"
            class="inline-flex items-center gap-3 border-2 border-accent-coral bg-accent-coral/10 hover:bg-accent-coral/20 text-accent-coral px-8 py-4 font-display font-bold text-lg transition cursor-pointer"
          >
            <Icon icon="lucide:calculator" class="size-5" />
            Xem chi phí
          </button>
          <p class="mt-3 text-text-dim text-xs">
            Kéo 3 thanh trượt bên trên rồi nhấn nút này để xem kết quả
          </p>
        </div>
      </Transition>

      <!-- Result Card -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        mode="out-in"
      >
        <div
          v-if="revealed"
          :key="resultKey"
          class="border border-accent-coral/40 bg-bg-surface overflow-hidden mb-8"
        >
          <!-- Dramatic header -->
          <div
            class="bg-gradient-to-r from-accent-coral/20 via-accent-coral/5 to-transparent px-6 py-4 border-b border-accent-coral/20"
          >
            <div class="text-text-dim text-xs font-display tracking-widest mb-1">
              // CHI PHÍ CUỘC HỌP
            </div>
            <div class="font-display text-4xl sm:text-6xl font-bold text-accent-coral tabular-nums">
              {{ totalCostFormatted }}
            </div>
          </div>

          <!-- Per-minute cost -->
          <div class="px-6 py-4 border-b border-border-default flex items-center justify-between">
            <span class="text-text-secondary text-sm flex items-center gap-2">
              <Icon icon="lucide:flame" class="size-4 text-accent-amber" />
              Mỗi phút "cháy"
            </span>
            <span class="font-mono text-accent-amber font-semibold tabular-nums">
              {{ perMinuteFormatted }}
            </span>
          </div>

          <!-- Dramatic phrase -->
          <div class="px-6 py-4 text-center bg-bg-elevated/50">
            <span class="text-text-primary font-display text-base">
              {{ dramaticPhrase }}
            </span>
          </div>
        </div>
      </Transition>

      <!-- Comparisons -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out delay-100"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="revealed && comparisons.length" class="mb-8">
          <h2
            class="font-display text-sm text-text-dim tracking-widest mb-4 flex items-center gap-2"
          >
            <Icon icon="lucide:sparkles" class="size-4" />
            VỚI SỐ TIỀN NÀY, BẠN CÓ THỂ...
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="item in comparisons"
              :key="item.label"
              class="border border-border-default bg-bg-surface p-4 text-center hover:border-accent-coral/40 transition group"
            >
              <Icon
                :icon="item.icon"
                class="size-6 mx-auto mb-2 text-text-dim group-hover:text-accent-coral transition"
              />
              <div class="font-display text-2xl font-bold text-accent-amber tabular-nums">
                {{ item.count }}
              </div>
              <div class="text-text-dim text-xs mt-0.5">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Fun Facts Carousel -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out delay-200"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="revealed && activeFact" class="mb-10">
          <h2
            class="font-display text-sm text-text-dim tracking-widest mb-4 flex items-center gap-2"
          >
            <Icon icon="lucide:lightbulb" class="size-4" />
            THỰC TẾ ĐÁNG SUY NGẪM
          </h2>

          <!-- Carousel -->
          <div class="border border-border-default bg-bg-surface overflow-hidden">
            <!-- Fact content — fixed height prevents layout shift -->
            <div class="overflow-hidden" style="height: 72px">
              <div class="h-full flex items-center px-5">
                <Transition
                  :class="funFactDirection === 'right' ? 'slide-from-right' : 'slide-from-left'"
                  mode="out-in"
                >
                  <div v-if="activeFact" :key="funFactIndex" class="flex gap-4 items-center w-full">
                    <div
                      class="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border border-border-default bg-bg-elevated"
                    >
                      <Icon :icon="activeFact.icon" class="size-4" :class="activeFact.color" />
                    </div>
                    <p class="text-text-secondary text-sm leading-snug line-clamp-2">
                      {{
                        activeFact.text
                          .replace('{perMinute}', perMinuteFormatted)
                          .replace('{meetingMinutes}', String(meetingMinutes))
                      }}
                    </p>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div
            class="flex items-center justify-center gap-4 px-4 py-2 border-t border-border-default bg-bg-elevated/50"
          >
            <button
              @click="prevFact"
              class="w-8 h-8 rounded-lg border border-border-default bg-bg-surface hover:border-accent-coral/50 hover:bg-accent-coral/10 flex items-center justify-center transition group"
            >
              <Icon
                icon="lucide:chevron-left"
                class="size-4 text-text-secondary group-hover:text-accent-coral transition"
              />
            </button>
            <button
              @click="nextFact"
              class="w-8 h-8 rounded-lg border border-border-default bg-bg-surface hover:border-accent-coral/50 hover:bg-accent-coral/10 flex items-center justify-center transition group"
            >
              <Icon
                icon="lucide:chevron-right"
                class="size-4 text-text-secondary group-hover:text-accent-coral transition"
              />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Footer note -->
      <div class="border-t border-border-default pt-6 text-center">
        <p class="text-text-dim text-xs leading-relaxed max-w-md mx-auto">
          * Chi phí tính dựa trên lương cơ bản. Thực tế còn cao hơn nếu tính thêm: chi phí phòng
          họp, thiết bị, giảm năng suất (meeting fatigue), và cơ hội bỏ lỡ khi dev phải rời khỏi bàn
          phím.
        </p>
      </div>
    </div>
  </div>
</template>
