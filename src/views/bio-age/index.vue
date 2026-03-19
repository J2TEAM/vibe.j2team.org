<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Factor {
  icon: string
  label: string
  value: string
  impact: number
  tip: string
}

// ─── Form state ───────────────────────────────────────────────────────────────
const step = ref(0)
const TOTAL_STEPS = 4

const age = ref<number | null>(null)
const gender = ref<'male' | 'female' | null>(null)
const height = ref<number | null>(null)
const weight = ref<number | null>(null)

const sleepHours = ref<number | null>(null)
const exerciseDays = ref<number | null>(null)

const dietScore = ref<number | null>(null) // 1–5
const waterLiters = ref<number | null>(null) // 1–5 scale

const smoking = ref<'never' | 'quit' | 'current' | null>(null)
const alcohol = ref<'never' | 'occasional' | 'weekly' | 'daily' | null>(null)
const stressLevel = ref<number | null>(null) // 1–5
const sittingHours = ref<number | null>(null) // hours per day

// ─── Navigation ───────────────────────────────────────────────────────────────
const canNext = computed(() => {
  if (step.value === 0) return age.value && gender.value && height.value && weight.value
  if (step.value === 1) return sleepHours.value !== null && exerciseDays.value !== null
  if (step.value === 2) return dietScore.value !== null && waterLiters.value !== null
  if (step.value === 3)
    return (
      smoking.value !== null &&
      alcohol.value !== null &&
      stressLevel.value !== null &&
      sittingHours.value !== null
    )
  return false
})

function next() {
  if (canNext.value && step.value < TOTAL_STEPS) step.value++
}
function back() {
  if (step.value > 0) step.value--
}
function reset() {
  step.value = 0
  age.value = null
  gender.value = null
  height.value = null
  weight.value = null
  sleepHours.value = null
  exerciseDays.value = null
  dietScore.value = null
  waterLiters.value = null
  smoking.value = null
  alcohol.value = null
  stressLevel.value = null
  sittingHours.value = null
}

// ─── Calculation ──────────────────────────────────────────────────────────────
const result = computed<{ bioAge: number; factors: Factor[] } | null>(() => {
  if (step.value < TOTAL_STEPS) return null
  if (
    !age.value ||
    !height.value ||
    !weight.value ||
    sleepHours.value === null ||
    exerciseDays.value === null ||
    dietScore.value === null ||
    waterLiters.value === null ||
    !smoking.value ||
    !alcohol.value ||
    stressLevel.value === null ||
    sittingHours.value === null
  )
    return null

  const factors: Factor[] = []
  let adj = 0

  // BMI (Asian standard)
  const bmi = weight.value / (height.value / 100) ** 2
  if (bmi < 18.5) {
    adj += 2
    factors.push({
      icon: 'lucide:scale',
      label: 'Cân nặng',
      value: `BMI ${bmi.toFixed(1)} — Thiếu cân`,
      impact: 2,
      tip: 'Tăng cường dinh dưỡng, bổ sung protein và calo lành mạnh.',
    })
  } else if (bmi < 23) {
    adj -= 2
    factors.push({
      icon: 'lucide:scale',
      label: 'Cân nặng',
      value: `BMI ${bmi.toFixed(1)} — Lý tưởng`,
      impact: -2,
      tip: 'Duy trì cân nặng hiện tại — bạn đang rất tốt!',
    })
  } else if (bmi < 25) {
    adj += 1
    factors.push({
      icon: 'lucide:scale',
      label: 'Cân nặng',
      value: `BMI ${bmi.toFixed(1)} — Thừa cân nhẹ`,
      impact: 1,
      tip: 'Tập thể dục đều đặn và giảm tinh bột tinh chế.',
    })
  } else if (bmi < 30) {
    adj += 3
    factors.push({
      icon: 'lucide:scale',
      label: 'Cân nặng',
      value: `BMI ${bmi.toFixed(1)} — Thừa cân`,
      impact: 3,
      tip: 'Giảm cân từ từ 0.5–1kg/tuần qua chế độ ăn và vận động.',
    })
  } else {
    adj += 5
    factors.push({
      icon: 'lucide:scale',
      label: 'Cân nặng',
      value: `BMI ${bmi.toFixed(1)} — Béo phì`,
      impact: 5,
      tip: 'Tham khảo chuyên gia dinh dưỡng để có lộ trình giảm cân an toàn.',
    })
  }

  // Sleep
  const s = sleepHours.value
  if (s < 5) {
    adj += 5
    factors.push({
      icon: 'lucide:moon',
      label: 'Giấc ngủ',
      value: `${s}h/đêm — Rất thiếu`,
      impact: 5,
      tip: 'Thiếu ngủ nghiêm trọng ảnh hưởng tim mạch và miễn dịch. Mục tiêu tối thiểu 7h.',
    })
  } else if (s < 7) {
    adj += 2
    factors.push({
      icon: 'lucide:moon',
      label: 'Giấc ngủ',
      value: `${s}h/đêm — Thiếu ngủ`,
      impact: 2,
      tip: 'Cố gắng đi ngủ sớm hơn 30 phút mỗi đêm cho đến khi đạt 7h.',
    })
  } else if (s <= 9) {
    adj -= 2
    factors.push({
      icon: 'lucide:moon',
      label: 'Giấc ngủ',
      value: `${s}h/đêm — Lý tưởng`,
      impact: -2,
      tip: 'Thời lượng ngủ hoàn hảo. Duy trì lịch ngủ cố định.',
    })
  } else {
    adj += 1
    factors.push({
      icon: 'lucide:moon',
      label: 'Giấc ngủ',
      value: `${s}h/đêm — Ngủ quá nhiều`,
      impact: 1,
      tip: 'Ngủ quá nhiều có thể là dấu hiệu mệt mỏi mãn tính. Tập thể dục giúp cải thiện.',
    })
  }

  // Exercise
  const ex = exerciseDays.value
  if (ex === 0) {
    adj += 4
    factors.push({
      icon: 'lucide:dumbbell',
      label: 'Vận động',
      value: 'Không tập luyện',
      impact: 4,
      tip: 'Bắt đầu với 20 phút đi bộ mỗi ngày — đơn giản nhất nhưng hiệu quả nhất.',
    })
  } else if (ex <= 2) {
    adj += 1
    factors.push({
      icon: 'lucide:dumbbell',
      label: 'Vận động',
      value: `${ex} ngày/tuần — Ít`,
      impact: 1,
      tip: 'Tăng lên 3–4 buổi/tuần để thấy sự khác biệt rõ rệt.',
    })
  } else if (ex <= 4) {
    adj -= 3
    factors.push({
      icon: 'lucide:dumbbell',
      label: 'Vận động',
      value: `${ex} ngày/tuần — Đều đặn`,
      impact: -3,
      tip: 'Tuyệt vời! Kết hợp cardio và sức mạnh để tối ưu hóa.',
    })
  } else {
    adj -= 4
    factors.push({
      icon: 'lucide:dumbbell',
      label: 'Vận động',
      value: `${ex} ngày/tuần — Rất tích cực`,
      impact: -4,
      tip: 'Ấn tượng! Đảm bảo có đủ ngày nghỉ để cơ thể phục hồi.',
    })
  }

  // Diet
  const diet = dietScore.value
  if (diet <= 1) {
    adj += 4
    factors.push({
      icon: 'lucide:utensils',
      label: 'Chế độ ăn',
      value: 'Rất kém',
      impact: 4,
      tip: 'Ưu tiên rau xanh, protein nạc và giảm đồ ăn chế biến sẵn.',
    })
  } else if (diet === 2) {
    adj += 2
    factors.push({
      icon: 'lucide:utensils',
      label: 'Chế độ ăn',
      value: 'Kém',
      impact: 2,
      tip: 'Thêm 1 bữa rau/ngày và giảm đường là bước đầu tiên dễ nhất.',
    })
  } else if (diet === 3) {
    adj += 0
    factors.push({
      icon: 'lucide:utensils',
      label: 'Chế độ ăn',
      value: 'Trung bình',
      impact: 0,
      tip: 'Khá tốt rồi. Thêm nhiều chất xơ và omega-3 để nâng cấp lên mức tiếp theo.',
    })
  } else if (diet === 4) {
    adj -= 1
    factors.push({
      icon: 'lucide:utensils',
      label: 'Chế độ ăn',
      value: 'Tốt',
      impact: -1,
      tip: 'Bạn ăn uống lành mạnh! Duy trì sự đa dạng trong thực phẩm.',
    })
  } else {
    adj -= 3
    factors.push({
      icon: 'lucide:utensils',
      label: 'Chế độ ăn',
      value: 'Rất tốt',
      impact: -3,
      tip: 'Chế độ ăn xuất sắc — một trong những yếu tố quan trọng nhất để sống lâu.',
    })
  }

  // Water
  const w = waterLiters.value
  if (w <= 1) {
    adj += 2
    factors.push({
      icon: 'lucide:droplets',
      label: 'Uống nước',
      value: '≤1L/ngày — Thiếu nước',
      impact: 2,
      tip: 'Uống ít nhất 2L/ngày. Đặt lời nhắc mỗi 2 tiếng.',
    })
  } else if (w <= 2) {
    adj += 0
    factors.push({
      icon: 'lucide:droplets',
      label: 'Uống nước',
      value: '1–2L/ngày',
      impact: 0,
      tip: 'Tốt, nhưng hãy cố uống 2L+ để tối ưu hóa trao đổi chất.',
    })
  } else {
    adj -= 1
    factors.push({
      icon: 'lucide:droplets',
      label: 'Uống nước',
      value: '2L+/ngày — Tốt',
      impact: -1,
      tip: 'Uống đủ nước — xuất sắc!',
    })
  }

  // Smoking
  if (smoking.value === 'never') {
    adj -= 1
    factors.push({
      icon: 'lucide:cigarette-off',
      label: 'Hút thuốc',
      value: 'Không bao giờ',
      impact: -1,
      tip: 'Một trong những quyết định tốt nhất cho sức khỏe của bạn.',
    })
  } else if (smoking.value === 'quit') {
    adj += 1
    factors.push({
      icon: 'lucide:cigarette-off',
      label: 'Hút thuốc',
      value: 'Đã bỏ',
      impact: 1,
      tip: 'Bỏ thuốc lá là quyết định đúng đắn. Phổi tiếp tục phục hồi theo thời gian.',
    })
  } else {
    adj += 6
    factors.push({
      icon: 'lucide:cigarette',
      label: 'Hút thuốc',
      value: 'Đang hút',
      impact: 6,
      tip: 'Hút thuốc là yếu tố lão hóa mạnh nhất. Tìm hỗ trợ để bỏ thuốc ngay hôm nay.',
    })
  }

  // Alcohol
  if (alcohol.value === 'never') {
    adj -= 1
    factors.push({
      icon: 'lucide:wine-off',
      label: 'Rượu bia',
      value: 'Không uống',
      impact: -1,
      tip: 'Không uống rượu — tốt cho gan và não bộ.',
    })
  } else if (alcohol.value === 'occasional') {
    adj += 0
    factors.push({
      icon: 'lucide:wine',
      label: 'Rượu bia',
      value: 'Thỉnh thoảng',
      impact: 0,
      tip: 'Uống ở mức độ vừa phải. Giữ nguyên thói quen này.',
    })
  } else if (alcohol.value === 'weekly') {
    adj += 2
    factors.push({
      icon: 'lucide:wine',
      label: 'Rượu bia',
      value: 'Hàng tuần',
      impact: 2,
      tip: 'Cố gắng giảm xuống thỉnh thoảng. Rượu ảnh hưởng giấc ngủ và trao đổi chất.',
    })
  } else {
    adj += 4
    factors.push({
      icon: 'lucide:wine',
      label: 'Rượu bia',
      value: 'Hàng ngày',
      impact: 4,
      tip: 'Uống rượu hàng ngày làm tổn thương gan và tăng tốc lão hóa đáng kể.',
    })
  }

  // Stress
  const st = stressLevel.value
  if (st <= 2) {
    adj -= 2
    factors.push({
      icon: 'lucide:brain',
      label: 'Căng thẳng',
      value: 'Thấp — Thoải mái',
      impact: -2,
      tip: 'Mức stress thấp tuyệt vời! Tiếp tục duy trì các hoạt động thư giãn.',
    })
  } else if (st === 3) {
    adj += 1
    factors.push({
      icon: 'lucide:brain',
      label: 'Căng thẳng',
      value: 'Trung bình',
      impact: 1,
      tip: 'Thêm 10 phút thiền hoặc đi bộ mỗi ngày để giảm cortisol.',
    })
  } else if (st === 4) {
    adj += 3
    factors.push({
      icon: 'lucide:brain',
      label: 'Căng thẳng',
      value: 'Cao',
      impact: 3,
      tip: 'Stress mãn tính là một trong những yếu tố lão hóa nhanh nhất. Ưu tiên thư giãn.',
    })
  } else {
    adj += 5
    factors.push({
      icon: 'lucide:brain',
      label: 'Căng thẳng',
      value: 'Rất cao',
      impact: 5,
      tip: 'Mức stress này rất nguy hiểm cho sức khỏe lâu dài. Hãy tìm sự hỗ trợ ngay.',
    })
  }

  // Sitting
  const sit = sittingHours.value
  if (sit <= 4) {
    adj -= 1
    factors.push({
      icon: 'lucide:armchair',
      label: 'Ngồi nhiều',
      value: `${sit}h/ngày — Ít`,
      impact: -1,
      tip: 'Ít ngồi một chỗ — rất tốt cho tuần hoàn máu!',
    })
  } else if (sit <= 8) {
    adj += 1
    factors.push({
      icon: 'lucide:armchair',
      label: 'Ngồi nhiều',
      value: `${sit}h/ngày — Trung bình`,
      impact: 1,
      tip: 'Đứng dậy đi lại 5 phút mỗi giờ để giảm tác hại.',
    })
  } else {
    adj += 3
    factors.push({
      icon: 'lucide:armchair',
      label: 'Ngồi nhiều',
      value: `${sit}h/ngày — Nhiều`,
      impact: 3,
      tip: 'Ngồi quá nhiều tăng nguy cơ tim mạch dù bạn có tập thể dục. Dùng bàn đứng nếu có thể.',
    })
  }

  const bioAge = Math.max(10, Math.round(age.value + adj))
  return { bioAge, factors }
})

const delta = computed(() => {
  if (!result.value || !age.value) return 0
  return age.value - result.value.bioAge
})

const positiveFactors = computed(() => result.value?.factors.filter((f) => f.impact < 0) ?? [])
const negativeFactors = computed(() => result.value?.factors.filter((f) => f.impact > 0) ?? [])
const neutralFactors = computed(() => result.value?.factors.filter((f) => f.impact === 0) ?? [])

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIET_LABELS = [
  '',
  'Rất kém (fastfood hàng ngày)',
  'Kém',
  'Trung bình',
  'Tốt',
  'Rất tốt (sạch, cân bằng)',
]
const STRESS_LABELS = ['', 'Rất thấp', 'Thấp', 'Trung bình', 'Cao', 'Rất cao (kiệt sức)']
const WATER_LABELS = ['', '< 1L', '1–1.5L', '2L', '2.5L', '3L+']
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header class="border-b border-border-default shrink-0">
      <div class="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        <RouterLink
          to="/"
          class="text-text-secondary hover:text-text-primary transition text-sm flex items-center gap-1.5"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
        <h1
          class="font-display font-bold text-base tracking-widest text-accent-coral absolute left-1/2 -translate-x-1/2"
        >
          TUỔI SINH HỌC
        </h1>
        <span />
      </div>
    </header>

    <div class="flex-1 max-w-xl mx-auto w-full px-4 py-8">
      <!-- ── Progress bar ───────────────────────────────────────────── -->
      <div v-if="step < TOTAL_STEPS" class="flex gap-1.5 mb-8">
        <div
          v-for="i in TOTAL_STEPS"
          :key="i"
          class="h-1 flex-1 transition-all duration-300"
          :class="i - 1 <= step ? 'bg-accent-coral' : 'bg-bg-elevated'"
        />
      </div>

      <!-- ════ Steps ════════════════════════════════════════════════ -->
      <Transition name="slide" mode="out-in">
        <!-- STEP 0 — Thông tin cơ bản -->
        <div v-if="step === 0" key="s0">
          <p class="text-text-dim text-xs font-display tracking-widest mb-1">BƯỚC 1 / 4</p>
          <h2 class="font-display text-2xl font-bold mb-6">Thông tin cơ bản</h2>

          <!-- Age -->
          <label class="block mb-4">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
              >Tuổi</span
            >
            <input
              v-model.number="age"
              type="number"
              min="10"
              max="100"
              placeholder="25"
              class="w-full bg-bg-surface border border-border-default text-text-primary px-4 py-2.5 font-body text-base focus:outline-none focus:border-accent-coral transition"
            />
          </label>

          <!-- Gender -->
          <div class="mb-4">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
              >Giới tính</span
            >
            <div class="flex gap-2">
              <button
                class="flex-1 py-2.5 border text-sm font-display font-semibold transition"
                :class="
                  gender === 'male'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="gender = 'male'"
              >
                Nam
              </button>
              <button
                class="flex-1 py-2.5 border text-sm font-display font-semibold transition"
                :class="
                  gender === 'female'
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="gender = 'female'"
              >
                Nữ
              </button>
            </div>
          </div>

          <!-- Height & Weight -->
          <div class="flex gap-3 mb-6">
            <label class="flex-1">
              <span
                class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
                >Chiều cao (cm)</span
              >
              <input
                v-model.number="height"
                type="number"
                min="100"
                max="250"
                placeholder="170"
                class="w-full bg-bg-surface border border-border-default text-text-primary px-4 py-2.5 font-body text-base focus:outline-none focus:border-accent-coral transition"
              />
            </label>
            <label class="flex-1">
              <span
                class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
                >Cân nặng (kg)</span
              >
              <input
                v-model.number="weight"
                type="number"
                min="20"
                max="300"
                placeholder="65"
                class="w-full bg-bg-surface border border-border-default text-text-primary px-4 py-2.5 font-body text-base focus:outline-none focus:border-accent-coral transition"
              />
            </label>
          </div>
        </div>

        <!-- STEP 1 — Ngủ & Vận động -->
        <div v-else-if="step === 1" key="s1">
          <p class="text-text-dim text-xs font-display tracking-widest mb-1">BƯỚC 2 / 4</p>
          <h2 class="font-display text-2xl font-bold mb-6">Ngủ & Vận động</h2>

          <!-- Sleep -->
          <div class="mb-6">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
            >
              Bạn ngủ bao nhiêu tiếng mỗi đêm?
            </span>
            <div class="flex items-center gap-4 mt-2">
              <input
                type="range"
                min="3"
                max="12"
                step="0.5"
                :value="sleepHours ?? 3"
                class="flex-1 accent-accent-coral"
                @input="sleepHours = Number(($event.target as HTMLInputElement).value)"
              />
              <span class="font-display font-bold text-accent-coral w-12 text-right">
                {{ sleepHours ?? '–' }}h
              </span>
            </div>
            <div class="flex justify-between text-text-dim text-[10px] mt-1">
              <span>3h</span><span>12h</span>
            </div>
          </div>

          <!-- Exercise -->
          <div class="mb-6">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
            >
              Bạn tập thể dục bao nhiêu ngày mỗi tuần?
            </span>
            <div class="flex gap-1.5 mt-2 flex-wrap">
              <button
                v-for="d in [0, 1, 2, 3, 4, 5, 6, 7]"
                :key="d"
                class="w-10 h-10 border text-sm font-display font-bold transition"
                :class="
                  exerciseDays === d
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="exerciseDays = d"
              >
                {{ d }}
              </button>
            </div>
            <p class="text-text-dim text-xs mt-2">0 = không tập, 7 = mỗi ngày</p>
          </div>
        </div>

        <!-- STEP 2 — Ăn uống -->
        <div v-else-if="step === 2" key="s2">
          <p class="text-text-dim text-xs font-display tracking-widest mb-1">BƯỚC 3 / 4</p>
          <h2 class="font-display text-2xl font-bold mb-6">Ăn uống</h2>

          <!-- Diet quality -->
          <div class="mb-6">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-3 block"
            >
              Chế độ ăn của bạn?
            </span>
            <div class="flex flex-col gap-2">
              <button
                v-for="d in [1, 2, 3, 4, 5]"
                :key="d"
                class="w-full py-2.5 px-4 border text-sm text-left transition"
                :class="
                  dietScore === d
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral font-semibold'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="dietScore = d"
              >
                <span class="font-display mr-2">{{ d }}.</span>{{ DIET_LABELS[d] }}
              </button>
            </div>
          </div>

          <!-- Water -->
          <div class="mb-6">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-3 block"
            >
              Uống bao nhiêu nước mỗi ngày?
            </span>
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="w in [1, 2, 3, 4, 5]"
                :key="w"
                class="flex-1 py-2.5 border text-xs font-display font-semibold transition"
                :class="
                  waterLiters === w
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="waterLiters = w"
              >
                {{ WATER_LABELS[w] }}
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 3 — Thói quen khác -->
        <div v-else-if="step === 3" key="s3">
          <p class="text-text-dim text-xs font-display tracking-widest mb-1">BƯỚC 4 / 4</p>
          <h2 class="font-display text-2xl font-bold mb-6">Thói quen khác</h2>

          <!-- Smoking -->
          <div class="mb-4">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
              >Hút thuốc lá</span
            >
            <div class="flex gap-2">
              <button
                v-for="[val, label] in [
                  ['never', 'Không bao giờ'],
                  ['quit', 'Đã bỏ'],
                  ['current', 'Đang hút'],
                ]"
                :key="val"
                class="flex-1 py-2 border text-xs font-display font-semibold transition"
                :class="
                  smoking === val
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="smoking = val as typeof smoking"
              >
                {{ label }}
              </button>
            </div>
          </div>

          <!-- Alcohol -->
          <div class="mb-4">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
              >Rượu bia</span
            >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="[val, label] in [
                  ['never', 'Không uống'],
                  ['occasional', 'Thỉnh thoảng'],
                  ['weekly', 'Hàng tuần'],
                  ['daily', 'Hàng ngày'],
                ]"
                :key="val"
                class="flex-1 py-2 border text-xs font-display font-semibold transition min-w-[80px]"
                :class="
                  alcohol === val
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="alcohol = val as typeof alcohol"
              >
                {{ label }}
              </button>
            </div>
          </div>

          <!-- Stress -->
          <div class="mb-4">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
              >Mức độ căng thẳng</span
            >
            <div class="flex gap-1.5">
              <button
                v-for="s in [1, 2, 3, 4, 5]"
                :key="s"
                class="flex-1 py-2.5 border text-sm font-display font-bold transition"
                :class="
                  stressLevel === s
                    ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                    : 'border-border-default text-text-secondary hover:border-accent-coral'
                "
                @click="stressLevel = s"
              >
                {{ s }}
              </button>
            </div>
            <div class="flex justify-between text-text-dim text-[10px] mt-1">
              <span>{{ STRESS_LABELS[1] }}</span
              ><span>{{ STRESS_LABELS[5] }}</span>
            </div>
          </div>

          <!-- Sitting -->
          <div class="mb-6">
            <span
              class="text-xs text-text-secondary font-display tracking-wide uppercase mb-1.5 block"
            >
              Ngồi một chỗ bao nhiêu tiếng mỗi ngày? (làm việc, xem TV...)
            </span>
            <div class="flex items-center gap-4 mt-2">
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                :value="sittingHours ?? 1"
                class="flex-1 accent-accent-coral"
                @input="sittingHours = Number(($event.target as HTMLInputElement).value)"
              />
              <span class="font-display font-bold text-accent-coral w-12 text-right">
                {{ sittingHours ?? '–' }}h
              </span>
            </div>
            <div class="flex justify-between text-text-dim text-[10px] mt-1">
              <span>1h</span><span>16h</span>
            </div>
          </div>
        </div>

        <!-- RESULTS -->
        <div v-else-if="step === TOTAL_STEPS && result" key="result">
          <!-- Big age display -->
          <div class="text-center mb-8">
            <p class="text-text-dim text-xs font-display tracking-widest mb-2">
              TUỔI SINH HỌC CỦA BẠN
            </p>
            <p class="font-display font-bold text-8xl text-accent-coral leading-none">
              {{ result.bioAge }}
            </p>
            <p class="text-text-secondary text-sm mt-2">
              Tuổi thật: <span class="text-text-primary font-bold">{{ age }}</span>
            </p>

            <!-- Delta badge -->
            <div
              class="inline-flex items-center gap-2 mt-4 px-4 py-2 border font-display font-bold text-sm"
              :class="
                delta > 0
                  ? 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral'
                  : delta < 0
                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                    : 'border-border-default text-text-secondary'
              "
            >
              <Icon
                :icon="
                  delta > 0
                    ? 'lucide:trending-down'
                    : delta < 0
                      ? 'lucide:trending-up'
                      : 'lucide:minus'
                "
                class="size-4"
              />
              <span v-if="delta > 0">Trẻ hơn tuổi thật {{ delta }} năm 🎉</span>
              <span v-else-if="delta < 0">Già hơn tuổi thật {{ Math.abs(delta) }} năm</span>
              <span v-else>Đúng bằng tuổi thật</span>
            </div>
          </div>

          <!-- Factor breakdown -->
          <div class="space-y-3 mb-8">
            <!-- Positive -->
            <template v-if="positiveFactors.length">
              <p class="text-xs font-display tracking-widest text-accent-coral mb-2">
                // ĐANG GIỮ BẠN TRẺ
              </p>
              <div
                v-for="f in positiveFactors"
                :key="f.label"
                class="border border-accent-coral/20 bg-accent-coral/5 p-3 flex items-start gap-3"
              >
                <Icon :icon="f.icon" class="size-4 text-accent-coral mt-0.5 shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-display font-semibold text-text-primary">{{
                      f.label
                    }}</span>
                    <span class="text-xs font-display font-bold text-accent-coral shrink-0"
                      >−{{ Math.abs(f.impact) }} năm</span
                    >
                  </div>
                  <p class="text-xs text-text-secondary mt-0.5">{{ f.value }}</p>
                  <p class="text-xs text-text-dim mt-1">{{ f.tip }}</p>
                </div>
              </div>
            </template>

            <!-- Negative -->
            <template v-if="negativeFactors.length">
              <p class="text-xs font-display tracking-widest text-red-400 mb-2 mt-4">
                // ĐANG LÀM BẠN GIÀ ĐI
              </p>
              <div
                v-for="f in negativeFactors"
                :key="f.label"
                class="border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-3"
              >
                <Icon :icon="f.icon" class="size-4 text-red-400 mt-0.5 shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-display font-semibold text-text-primary">{{
                      f.label
                    }}</span>
                    <span class="text-xs font-display font-bold text-red-400 shrink-0"
                      >+{{ f.impact }} năm</span
                    >
                  </div>
                  <p class="text-xs text-text-secondary mt-0.5">{{ f.value }}</p>
                  <p class="text-xs text-text-dim mt-1">{{ f.tip }}</p>
                </div>
              </div>
            </template>

            <!-- Neutral -->
            <template v-if="neutralFactors.length">
              <p class="text-xs font-display tracking-widest text-text-dim mb-2 mt-4">
                // TRUNG TÍNH
              </p>
              <div
                v-for="f in neutralFactors"
                :key="f.label"
                class="border border-border-default p-3 flex items-start gap-3"
              >
                <Icon :icon="f.icon" class="size-4 text-text-dim mt-0.5 shrink-0" />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-display font-semibold text-text-primary">{{
                    f.label
                  }}</span>
                  <p class="text-xs text-text-secondary mt-0.5">{{ f.value }}</p>
                  <p class="text-xs text-text-dim mt-1">{{ f.tip }}</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Reset -->
          <button
            class="w-full border border-border-default text-text-secondary py-3 text-sm font-display tracking-wide transition hover:border-accent-coral hover:text-text-primary flex items-center justify-center gap-2"
            @click="reset"
          >
            <Icon icon="lucide:rotate-ccw" class="size-4" />
            Tính lại
          </button>

          <p class="text-text-dim text-xs text-center mt-4 leading-relaxed">
            Kết quả chỉ mang tính tham khảo dựa trên các yếu tố lối sống phổ biến.<br />
            Không thay thế tư vấn y tế chuyên nghiệp.
          </p>
        </div>
      </Transition>

      <!-- ── Navigation buttons ────────────────────────────────────── -->
      <div v-if="step < TOTAL_STEPS" class="flex gap-3 mt-6">
        <button
          v-if="step > 0"
          class="px-6 py-2.5 border border-border-default text-text-secondary text-sm font-display transition hover:border-accent-coral hover:text-text-primary"
          @click="back"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
        </button>
        <button
          class="flex-1 py-2.5 border text-sm font-display font-bold tracking-wide transition flex items-center justify-center gap-2"
          :class="
            canNext
              ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral hover:text-bg-deep'
              : 'border-border-default text-text-dim cursor-not-allowed'
          "
          :disabled="!canNext"
          @click="next"
        >
          {{ step === TOTAL_STEPS - 1 ? 'Xem kết quả' : 'Tiếp theo' }}
          <Icon
            :icon="step === TOTAL_STEPS - 1 ? 'lucide:sparkles' : 'lucide:arrow-right'"
            class="size-4"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
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
