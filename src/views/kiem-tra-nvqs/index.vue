<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const showScrollTop = ref(false)
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

// Form State
const birthDate = ref('')
const education = ref('highschool')
const deferment = ref('no')
const height = ref<number | null>(null)
const weight = ref<number | null>(null)
const eyeCan = ref<number>(0)
const eyeVien = ref<number>(0)
const eyeLoan = ref<number>(0)

watch(education, (newVal) => {
  if (newVal !== 'college') deferment.value = 'no'
})

const isCalculated = ref(false)
const activeTab = ref('danh-gia')

const results = ref({
  age: {
    val: 0,
    defText: '',
    max: 0,
    freeDateText: '',
    isPass: false,
    statusClass: '',
    statusText: '',
  },
  edu: { levelText: '', isPass: false, statusClass: '', statusText: '' },
  bmi: {
    val: '0',
    isPass: false,
    isWarning: false,
    statusClass: '',
    statusText: '',
    hackGained: 0,
    hackLoss: 0,
  },
  eye: { conditionText: '', failStdText: '', isPass: false, statusClass: '', statusText: '' },
})

const tabsSection = ref<HTMLElement | null>(null)
const faqOpen = ref<Record<string, boolean>>({
  age: true,
  one: false,
  two: false,
  three: false,
  four: false,
  five: false,
  six: false,
})

const toggleFaq = (key: string) => {
  faqOpen.value[key] = !faqOpen.value[key]
}

// ------------------------------------
// EXTENSION FEATURES STATE
// ------------------------------------
const resultCardRef = ref<HTMLElement | null>(null)
const isExporting = ref(false)
const snapshotUrl = ref('')

const checklistItems = ref([
  { id: 1, text: 'Bàn chải, kem đánh răng', checked: false, type: 'Nên mang' },
  { id: 2, text: 'Dao cạo râu (dùng cán nhựa)', checked: false, type: 'Nên mang' },
  { id: 3, text: 'Đồ lót (cần mang 5-7 cái)', checked: false, type: 'Nên mang' },
  { id: 4, text: 'Dầu gió, thuốc đau bụng cơ bản', checked: false, type: 'Nên mang' },
  { id: 5, text: 'Sách, truyện (đọc giải trí lúc rảnh)', checked: false, type: 'Nên mang' },
  { id: 6, text: 'Smartphone, đồ điện tử đắt tiền', checked: false, type: 'Cấm mang' },
  { id: 7, text: 'Thuốc lá, bài bạc, rượu bia', checked: false, type: 'Cấm mang' },
])

const eyeTestLeft = ref<number | null>(null)
const eyeTestRight = ref<number | null>(null)
const eyeTestResult = ref<{ score: number; class: string; note: string } | null>(null)

const calculateEyeTest = () => {
  if (!eyeTestLeft.value || !eyeTestRight.value) return
  const total = eyeTestLeft.value + eyeTestRight.value
  let score = 6
  let note = 'Rớt (Sức khỏe loại 6)'
  let colorClass = 'text-accent-coral font-bold'

  if (eyeTestLeft.value === 10 && total === 19) {
    score = 1
    note = 'Rất Tốt (Loại 1)'
    colorClass = 'text-green-400 font-bold'
  } else if (eyeTestLeft.value === 10 && total === 18) {
    score = 2
    note = 'Tốt (Loại 2)'
    colorClass = 'text-green-400 font-bold'
  } else if (eyeTestLeft.value >= 9 && total === 17) {
    score = 3
    note = 'Khá (Loại 3)'
    colorClass = 'text-green-400 font-bold'
  } else if (eyeTestLeft.value >= 8 && total === 16) {
    score = 4
    note = 'Trung bình (Loại 4) - KHÔNG GỌI'
    colorClass = 'text-accent-coral font-bold'
  } else if (eyeTestLeft.value >= 6 && total >= 13) {
    score = 5
    note = 'Yếu (Loại 5) - KHÔNG GỌI'
    colorClass = 'text-accent-coral font-bold'
  }

  eyeTestResult.value = { score, class: colorClass, note }
}

const exportImage = async () => {
  if (!resultCardRef.value) return
  isExporting.value = true
  try {
    // Dynamic import to avoid bundling html-to-image into the main chunk
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(resultCardRef.value, {
      quality: 1,
      backgroundColor: '#0F1923',
      style: { margin: '0', padding: '20px' },
    })
    snapshotUrl.value = dataUrl
    const link = document.createElement('a')
    link.download = 'ket-qua-nvqs-2026.png'
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Lỗi khi xuất ảnh', err)
  } finally {
    isExporting.value = false
  }
}
// ------------------------------------

const calculate = () => {
  if (!birthDate.value || !height.value || !weight.value) return

  const [bYear, bMonth, bDay] = birthDate.value.split('-')
  const birthYearVal = Number(bYear)
  const callYear = 2026

  // 1. TÍNH TOÁN ĐỘ TUỔI
  const age = callYear - birthYearVal
  const maxAge = education.value === 'college' && deferment.value === 'yes' ? 27 : 25
  const freeYear = birthYearVal + maxAge + 1
  const freeDate = `${bDay}/${bMonth}/${freeYear}`

  let isAgePass = false
  let ageStatusClass = 'text-accent-coral font-bold'
  let ageStatusText = 'Hết tuổi gọi nhập ngũ'

  if (age < 18) {
    ageStatusText = 'Chưa đủ tuổi nhập ngũ'
  } else if (age <= maxAge) {
    isAgePass = true
    ageStatusClass = 'text-green-400 font-bold'
    ageStatusText = 'Trong độ tuổi nhập ngũ'
  }

  results.value.age = {
    val: age,
    defText: deferment.value === 'yes' ? 'Đã hoãn CĐ/ĐH' : 'Chưa nộp giấy hoãn',
    max: maxAge,
    freeDateText: `${freeDate} (Sinh nhật ${maxAge + 1} tuổi)`,
    isPass: isAgePass,
    statusClass: ageStatusClass,
    statusText: ageStatusText,
  }

  // 2. TÍNH TOÁN VĂN HÓA
  let isEduPass = true
  let eduStatusClass = 'text-green-400 font-bold'
  let eduStatusText = 'Đủ tiêu chuẩn văn hóa'
  let eduLevelText = ''

  if (education.value === 'under8') {
    isEduPass = false
    eduStatusClass = 'text-accent-coral font-bold'
    eduStatusText = 'Chưa đạt chuẩn (Dưới lớp 8)'
    eduLevelText = 'Dưới lớp 8'
  } else if (education.value === 'highschool') {
    eduLevelText = 'Từ lớp 8 đến 12'
  } else {
    eduLevelText = 'Cao đẳng / Đại học'
  }

  results.value.edu = {
    levelText: eduLevelText,
    isPass: isEduPass,
    statusClass: eduStatusClass,
    statusText: eduStatusText,
  }

  // 3. TÍNH TOÁN BMI
  const heightM = height.value / 100
  const bmiVal = (weight.value / (heightM * heightM)).toFixed(1)
  let isBmiPass = true
  let isBmiWarning = false
  let bmiStatusClass = 'text-green-400 font-bold'
  let bmiStatusText = 'Thể lực Đạt (Loại 1,2,3)'

  if (parseFloat(bmiVal) >= 30) {
    isBmiPass = false
    bmiStatusClass = 'text-accent-coral font-bold'
    bmiStatusText = 'Loại 4 (Béo phì)'
  } else if (parseFloat(bmiVal) < 18.5) {
    isBmiPass = false
    isBmiWarning = true
    bmiStatusClass = 'text-accent-amber font-bold'
    bmiStatusText = 'Thiếu cân (Dưới tiêu chuẩn)'
  }

  // TÍNH TOÁN "HACK" BMI CẦN TĂNG/GIẢM (Dự báo vui)
  let hackGained = 0
  let hackLoss = 0

  if (isBmiWarning) {
    // Để lên đc 18.5
    hackGained = parseFloat((18.5 * heightM * heightM - weight.value).toFixed(1))
  } else if (isBmiPass) {
    // Để lên đc 30 (bị béo phì -> rớt)
    hackGained = parseFloat((30 * heightM * heightM - weight.value).toFixed(1))
  } else {
    // Đang béo phì, để rớt về 29.9 (Đạt chuẩn trở lại)
    hackLoss = parseFloat((weight.value - 29.9 * heightM * heightM).toFixed(1))
  }

  results.value.bmi = {
    val: bmiVal,
    isPass: isBmiPass,
    isWarning: isBmiWarning,
    statusClass: bmiStatusClass,
    statusText: bmiStatusText,
    hackGained,
    hackLoss,
  }

  // 4. TÍNH TOÁN MẮT
  let isEyePass = true
  let eyeStatusClass = 'text-green-400 font-bold'
  let eyeStatusText = 'Mắt tốt (Đạt yêu cầu)'

  const eyeConditions: string[] = []
  if (eyeCan.value > 0) eyeConditions.push(`Cận ${eyeCan.value}`)
  if (eyeVien.value > 0) eyeConditions.push(`Viễn ${eyeVien.value}`)
  if (eyeLoan.value > 0) eyeConditions.push(`Loạn ${eyeLoan.value}`)
  const eyeConditionText =
    eyeConditions.length > 0 ? eyeConditions.join(' + ') + ' Diop' : 'Không có tật khúc xạ'

  const failReasons: string[] = []
  if (eyeCan.value >= 1.5) failReasons.push(`Cận >= 1.5`)
  if (eyeVien.value > 0) failReasons.push(`Bị Viễn thị`)

  if (failReasons.length > 0) {
    isEyePass = false
    eyeStatusClass = 'text-accent-coral font-bold'
    eyeStatusText = 'Không đủ chuẩn (Loại 4,5,6)'
  } else if (eyeCan.value > 0 || eyeLoan.value > 0) {
    eyeStatusClass = 'text-accent-amber font-bold'
    eyeStatusText = 'Tật khúc xạ nhẹ (Vẫn gọi)'
  }

  const eyeFailStdText = failReasons.length > 0 ? failReasons.join(', ') : 'Không vi phạm'

  results.value.eye = {
    conditionText: eyeConditionText,
    failStdText: eyeFailStdText,
    isPass: isEyePass,
    statusClass: eyeStatusClass,
    statusText: eyeStatusText,
  }

  isCalculated.value = true
  activeTab.value = 'danh-gia'

  setTimeout(() => {
    tabsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20 relative px-4 sm:px-6">
    <!-- Home Button -->
    <RouterLink
      to="/"
      class="absolute top-4 left-4 z-10 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary font-display font-medium transition hover:border-accent-coral hover:text-text-primary hover:-translate-y-0.5"
    >
      &larr; Về trang chủ
    </RouterLink>

    <!-- Issue Badge -->
    <div
      class="absolute top-6 right-6 z-10 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg select-none pointer-events-none hidden sm:block"
    >
      VOL.01 / 2026
    </div>

    <!-- Scroll to top button -->
    <button
      v-show="showScrollTop"
      @click="scrollToTop"
      class="fixed bottom-6 right-6 z-50 border border-border-default bg-bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated text-accent-amber"
      aria-label="Lên đầu trang"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>

    <div class="max-w-5xl mx-auto pt-24">
      <!-- Welcome Banner -->
      <div
        class="border border-border-default bg-bg-surface p-6 sm:p-10 mb-8 relative animate-fade-up"
      >
        <!-- Background Number -->
        <span
          class="absolute top-3 right-4 font-display text-8xl font-bold text-accent-coral/5 select-none pointer-events-none hidden sm:block"
        >
          01
        </span>

        <div class="flex items-center gap-3 mb-4">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          <span
            class="text-xs text-accent-sky font-display tracking-wide uppercase border border-border-default px-2 py-1"
          >
            Hệ thống đánh giá
          </span>
        </div>

        <h1
          class="font-display text-4xl md:text-5xl font-bold text-text-primary mb-5 uppercase tracking-tight"
        >
          Tra cứu NVQS 2026
        </h1>

        <p class="text-text-secondary text-lg mb-6 max-w-3xl leading-relaxed">
          Nhập thông tin cá nhân của bạn vào biểu mẫu bên dưới. Hệ thống sẽ phân tích tự động điều
          kiện trúng tuyển dựa trên Luật NVQS và Thông tư 105/2023/TT-BQP, 148/2018/TT-BQP.
        </p>

        <ul class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-medium text-text-dim">
          <li class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-accent-amber rounded-sm"></div>
            Tính toán Độ tuổi chính xác
          </li>
          <li class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-accent-amber rounded-sm"></div>
            Cập nhật Loạn thị 2026
          </li>
          <li class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-accent-amber rounded-sm"></div>
            Phân loại BMI chuẩn y tế
          </li>
          <li class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-accent-amber rounded-sm"></div>
            Đánh giá Mắt chuẩn xác
          </li>
        </ul>
      </div>

      <!-- Form Nhập Liệu -->
      <div
        class="border border-border-default bg-bg-surface p-6 sm:p-8 mb-10 transition-all duration-300 hover:border-accent-sky/50 animate-fade-up animate-delay-2"
      >
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3"
        >
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Nhập Thông Tin Cá Nhân
        </h2>

        <form @submit.prevent="calculate" class="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div class="md:col-span-4 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Ngày sinh *</label
            >
            <input
              type="date"
              v-model="birthDate"
              required
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition"
            />
          </div>
          <div class="md:col-span-4 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Chiều cao (cm) *</label
            >
            <input
              type="number"
              v-model="height"
              required
              min="140"
              max="220"
              placeholder="VD: 170"
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition placeholder-text-dim"
            />
          </div>
          <div class="md:col-span-4 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Cân nặng (kg) *</label
            >
            <input
              type="number"
              v-model="weight"
              required
              step="0.1"
              min="35"
              max="150"
              placeholder="VD: 65"
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition placeholder-text-dim"
            />
          </div>

          <div class="md:col-span-6 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Trình độ học vấn *</label
            >
            <select
              v-model="education"
              required
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition"
            >
              <option value="highschool">Từ lớp 8 đến lớp 12</option>
              <option value="college">Đang/Đã học CĐ, Đại học</option>
              <option value="under8">Dưới lớp 8</option>
            </select>
          </div>
          <div class="md:col-span-6 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Đã nộp giấy hoãn CĐ/ĐH? *</label
            >
            <select
              v-model="deferment"
              :disabled="education !== 'college'"
              required
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="no">Chưa nộp / Không áp dụng</option>
              <option value="yes">Đã nộp giấy xác nhận CĐ/ĐH</option>
            </select>
          </div>

          <div class="md:col-span-4 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Độ Cận (Diop)</label
            >
            <input
              type="number"
              v-model="eyeCan"
              step="0.25"
              min="0"
              max="15"
              placeholder="VD: 1.5"
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition placeholder-text-dim"
            />
          </div>
          <div class="md:col-span-4 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Độ Viễn (Diop)</label
            >
            <input
              type="number"
              v-model="eyeVien"
              step="0.25"
              min="0"
              max="15"
              placeholder="VD: 0"
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition placeholder-text-dim"
            />
          </div>
          <div class="md:col-span-4 space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Độ Loạn (Diop)</label
            >
            <input
              type="number"
              v-model="eyeLoan"
              step="0.25"
              min="0"
              max="15"
              placeholder="VD: 0.5"
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2 transition placeholder-text-dim"
            />
          </div>

          <div class="md:col-span-12 flex justify-end mt-4">
            <button
              type="submit"
              class="bg-accent-sky hover:bg-accent-sky/90 text-bg-deep font-display font-semibold px-6 py-3 transition-all hover:-translate-y-0.5 shadow-[4px_4px_0_0_#253549] hover:shadow-[2px_2px_0_0_#253549]"
            >
              BẮT ĐẦU TRA CỨU
            </button>
          </div>
        </form>
      </div>

      <!-- Scroll target -->
      <div ref="tabsSection" class="-mt-20 pt-20"></div>

      <!-- Tabs -->
      <div v-show="isCalculated" class="flex flex-wrap justify-center gap-4 mb-8">
        <button
          @click="activeTab = 'danh-gia'"
          class="px-5 py-2.5 font-display font-medium text-sm transition-all border"
          :class="
            activeTab === 'danh-gia'
              ? 'border-accent-coral text-accent-coral bg-accent-coral/10'
              : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
          "
        >
          KẾT QUẢ ĐÁNH GIÁ
        </button>
        <button
          @click="activeTab = 'trich-luat'"
          class="px-5 py-2.5 font-display font-medium text-sm transition-all border"
          :class="
            activeTab === 'trich-luat'
              ? 'border-accent-amber text-accent-amber bg-accent-amber/10'
              : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary'
          "
        >
          TRÍCH LỤC LUẬT
        </button>
      </div>

      <!-- Panel Kết Quả -->
      <div v-show="isCalculated && activeTab === 'danh-gia'" class="animate-fade-up">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
          <div>
            <h3 class="font-display text-2xl font-bold text-accent-sky">KẾT QUẢ ĐÁNH GIÁ</h3>
            <p class="text-text-secondary text-sm">
              Dựa theo thông số bạn nhập & quy định PL năm 2026
            </p>
          </div>
          <button
            @click="exportImage"
            :disabled="isExporting"
            class="bg-accent-sky text-bg-deep font-display font-medium px-4 py-2 hover:bg-white transition-colors disabled:opacity-50"
          >
            {{ isExporting ? 'ĐANG LƯU...' : 'KHOE ÁNH KẾT QUẢ' }}
          </button>
        </div>

        <div
          ref="resultCardRef"
          class="bg-bg-deep rounded-none p-2 sm:p-4 border-2 border-border-default mb-8"
        >
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            <!-- Tuổi -->
            <div
              class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 group"
            >
              <div class="flex items-center gap-4 mb-4">
                <div
                  class="w-12 h-12 bg-bg-deep text-accent-coral flex items-center justify-center border border-border-default text-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                </div>
                <div>
                  <div class="font-display font-medium text-lg uppercase">Tiêu chí độ tuổi</div>
                  <div :class="results.age.statusClass" class="text-sm">
                    {{ results.age.statusText }}
                  </div>
                </div>
              </div>
              <hr class="border-border-default my-4" />
              <ul class="space-y-3 text-sm text-text-secondary mb-6 flex-grow">
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Tuổi năm 2026</span>
                  <strong class="text-text-primary">{{ results.age.val }} tuổi</strong>
                </li>
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Lịch sử hoãn</span>
                  <span>{{ results.age.defText }}</span>
                </li>
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Độ tuổi hết gọi</span>
                  <span>{{ results.age.max }} tuổi</span>
                </li>
                <li class="flex justify-between items-center pb-2">
                  <span class="flex items-center gap-2">Năm hết gọi chính thức</span>
                  <span class="font-bold text-accent-sky">{{ results.age.freeDateText }}</span>
                </li>
              </ul>
              <div
                class="text-center font-display border p-2 mt-auto"
                :class="
                  results.age.isPass
                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                    : 'border-accent-coral/30 text-accent-coral bg-accent-coral/10'
                "
              >
                {{ results.age.isPass ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT' }}
              </div>
            </div>

            <!-- Trình độ văn hóa -->
            <div
              class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 group flex flex-col"
            >
              <div class="flex items-center gap-4 mb-4">
                <div
                  class="w-12 h-12 bg-bg-deep text-accent-coral flex items-center justify-center border border-border-default text-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
                <div>
                  <div class="font-display font-medium text-lg uppercase">Trình độ văn hóa</div>
                  <div :class="results.edu.statusClass" class="text-sm">
                    {{ results.edu.statusText }}
                  </div>
                </div>
              </div>
              <hr class="border-border-default my-4" />
              <ul class="space-y-3 text-sm text-text-secondary mb-6 flex-grow">
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Học vấn hiện tại</span>
                  <strong class="text-text-primary">{{ results.edu.levelText }}</strong>
                </li>
                <li class="flex justify-between items-center pb-2">
                  <span class="flex items-center gap-2">Tiêu chuẩn tối thiểu</span>
                  <span>Từ lớp 8 trở lên</span>
                </li>
              </ul>
              <div
                class="text-center font-display border p-2 mt-auto"
                :class="
                  results.edu.isPass
                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                    : 'border-accent-coral/30 text-accent-coral bg-accent-coral/10'
                "
              >
                {{ results.edu.isPass ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT (RỚT)' }}
              </div>
            </div>

            <!-- Thể lực -->
            <div
              class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 group flex flex-col"
            >
              <div class="flex items-center gap-4 mb-4">
                <div
                  class="w-12 h-12 bg-bg-deep text-accent-coral flex items-center justify-center border border-border-default text-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
                    />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </div>
                <div>
                  <div class="font-display font-medium text-lg uppercase">Thể lực (BMI)</div>
                  <div :class="results.bmi.statusClass" class="text-sm">
                    {{ results.bmi.statusText }}
                  </div>
                </div>
              </div>
              <hr class="border-border-default my-4" />
              <ul class="space-y-3 text-sm text-text-secondary mb-6 flex-grow">
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Chiều cao</span>
                  <strong class="text-text-primary">{{ height }} cm</strong>
                </li>
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Cân nặng</span>
                  <strong class="text-text-primary">{{ weight }} kg</strong>
                </li>
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Chỉ số BMI</span>
                  <strong :class="results.bmi.isPass ? 'text-green-400' : 'text-accent-coral'">{{
                    results.bmi.val
                  }}</strong>
                </li>
                <li class="flex justify-between items-center pb-2">
                  <span class="flex items-center gap-2">Tiêu chuẩn loại trừ</span>
                  <span>BMI ≥ 30 hoặc &lt; 18.5</span>
                </li>
                <li
                  v-if="results.bmi.hackGained > 0"
                  class="flex justify-between items-center border-t border-border-default pt-2 mt-2"
                >
                  <span class="text-accent-amber"><i class="bx bx-run"></i> Hack trốn NVQS</span>
                  <span class="text-xs"
                    >Tăng thêm <strong>{{ results.bmi.hackGained }} kg</strong> để béo phì</span
                  >
                </li>
                <li
                  v-else-if="results.bmi.hackLoss > 0"
                  class="flex justify-between items-center border-t border-border-default pt-2 mt-2"
                >
                  <span class="text-accent-sky"><i class="bx bx-run"></i> Hack đậu NVQS</span>
                  <span class="text-xs"
                    >Giảm thêm <strong>{{ results.bmi.hackLoss }} kg</strong> để đạt</span
                  >
                </li>
              </ul>
              <div
                class="text-center font-display border p-2 mt-auto"
                :class="
                  results.bmi.isPass
                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                    : results.bmi.isWarning
                      ? 'border-accent-amber/30 text-accent-amber bg-accent-amber/10'
                      : 'border-accent-coral/30 text-accent-coral bg-accent-coral/10'
                "
              >
                {{ results.bmi.isPass ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT' }}
              </div>
            </div>

            <!-- Mắt -->
            <div
              class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 group flex flex-col"
            >
              <div class="flex items-center gap-4 mb-4">
                <div
                  class="w-12 h-12 bg-bg-deep text-accent-coral flex items-center justify-center border border-border-default text-xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <div class="font-display font-medium text-lg uppercase">Thị lực (Mắt)</div>
                  <div :class="results.eye.statusClass" class="text-sm">
                    {{ results.eye.statusText }}
                  </div>
                </div>
              </div>
              <hr class="border-border-default my-4" />
              <ul class="space-y-3 text-sm text-text-secondary mb-6 flex-grow">
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Tình trạng</span>
                  <strong class="text-text-primary">{{ results.eye.conditionText }}</strong>
                </li>
                <li
                  class="flex justify-between items-center border-b border-border-default border-dashed pb-2"
                >
                  <span class="flex items-center gap-2">Tiêu chuẩn đạt</span>
                  <span>Cận &lt; 1.5, Loạn mọi mức độ</span>
                </li>
                <li class="flex justify-between items-center pb-2">
                  <span class="flex items-center gap-2">Tiêu chuẩn vi phạm</span>
                  <span
                    :class="results.eye.isPass ? 'text-green-400' : 'text-accent-coral font-bold'"
                    >{{ results.eye.failStdText }}</span
                  >
                </li>
              </ul>
              <div
                class="text-center font-display border p-2 mt-auto"
                :class="
                  results.eye.isPass
                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                    : 'border-accent-coral/30 text-accent-coral bg-accent-coral/10'
                "
              >
                {{ results.eye.isPass ? 'ĐẠT YÊU CẦU' : 'RỚT (KHÔNG GỌI)' }}
              </div>
            </div>
          </div>
        </div>

        <!-- HÀNH TRANG & ĐẾM NGƯỢC (Chỉ hiện khi tính toán xong) -->
        <div class="grid gap-5 md:grid-cols-2 mt-8 animate-fade-up animate-delay-2">
          <!-- Đồng hồ -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h4 class="font-display font-bold text-lg text-accent-amber mb-4">
              LỘ TRÌNH DỰ KIẾN TƯƠNG LAI
            </h4>
            <hr class="border-border-default my-3" />
            <div class="space-y-4">
              <div
                class="flex justify-between items-center bg-bg-elevated p-3 border border-border-default"
              >
                <span class="text-text-secondary text-sm">Gọi khám sức khỏe:</span>
                <strong class="text-accent-amber">Tháng 11 - 12/2025</strong>
              </div>
              <div
                class="flex justify-between items-center bg-bg-elevated p-3 border border-border-default"
              >
                <span class="text-text-secondary text-sm">Chính thức Nhập ngũ:</span>
                <strong class="text-accent-coral">~ 15/02/2026</strong>
              </div>
              <div
                class="flex justify-between items-center bg-bg-elevated p-3 border border-border-default"
              >
                <span class="text-text-secondary text-sm">Dự kiến Xuất ngũ:</span>
                <strong class="text-accent-sky">~ 15/02/2028</strong>
              </div>
            </div>
          </div>

          <!-- Hành trang To-do -->
          <div class="border border-border-default bg-bg-surface p-6">
            <h4 class="font-display font-bold text-lg text-text-primary mb-4">
              HÀNH TRANG MANG THEO
            </h4>
            <hr class="border-border-default my-3" />
            <ul class="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
              <li v-for="item in checklistItems" :key="item.id" class="flex gap-3 text-sm">
                <input
                  type="checkbox"
                  v-model="item.checked"
                  class="mt-1 w-4 h-4 accent-accent-coral bg-bg-deep border-border-default"
                />
                <span :class="item.checked ? 'line-through text-text-dim' : 'text-text-secondary'">
                  <span v-if="item.type === 'Cấm mang'" class="text-accent-coral font-bold mr-1"
                    >[CẤM]</span
                  >
                  {{ item.text }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Panel Trích Luật -->
      <div
        v-show="isCalculated && activeTab === 'trich-luat'"
        class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12 animate-fade-up"
      >
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col hover:-translate-y-1 transition duration-300 hover:border-accent-amber"
        >
          <h5 class="font-display text-lg font-bold text-accent-amber mb-3">Tuổi NVQS theo Luật</h5>
          <hr class="border-border-default mb-4" />
          <p class="text-text-secondary text-sm leading-relaxed text-justify mb-4">
            <strong>Căn cứ Điều 30 Luật NVQS 2015:</strong> Công dân đủ 18 tuổi được gọi nhập ngũ;
            độ tuổi gọi nhập ngũ từ đủ 18 tuổi đến hết 25 tuổi; công dân được đào tạo trình độ cao
            đẳng, đại học đã được tạm hoãn gọi nhập ngũ thì độ tuổi gọi nhập ngũ đến hết 27 tuổi.
          </p>
          <a href="#" class="mt-auto text-sm text-accent-sky link-underline w-fit"
            >Xem chi tiết trên Thư Viện PL &rarr;</a
          >
        </div>

        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col hover:-translate-y-1 transition duration-300 hover:border-accent-amber"
        >
          <h5 class="font-display text-lg font-bold text-accent-amber mb-3">Văn hóa theo TT 148</h5>
          <hr class="border-border-default mb-4" />
          <p class="text-text-secondary text-sm leading-relaxed text-justify mb-4">
            Tuyển chọn và gọi nhập ngũ những công dân có trình độ văn hóa
            <strong>lớp 8 trở lên</strong>, lấy từ cao xuống thấp. Những địa phương khó khăn xem xét
            tuyển từ lớp 7.
          </p>
        </div>

        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col hover:-translate-y-1 transition duration-300 hover:border-accent-amber"
        >
          <h5 class="font-display text-lg font-bold text-accent-amber mb-3">
            Thể lực BMI (TT 105)
          </h5>
          <hr class="border-border-default mb-4" />
          <p class="text-text-secondary text-sm leading-relaxed text-justify mb-4">
            Phân loại theo chỉ số BMI:<br />
            - Loại 1: 18.5 ≤ BMI &lt; 25.0<br />
            - Loại 2: 25.0 ≤ BMI &lt; 27.0<br />
            - Loại 3: 27.0 ≤ BMI &lt; 30.0<br />
            - <strong>Loại 4: BMI ≥ 30.0 (Không đủ điện kiện)</strong>
          </p>
        </div>

        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col hover:-translate-y-1 transition duration-300 hover:border-accent-amber"
        >
          <h5 class="font-display text-lg font-bold text-accent-amber mb-3">Thị lực Mắt (Mới)</h5>
          <hr class="border-border-default mb-4" />
          <p class="text-text-secondary text-sm leading-relaxed text-justify mb-4">
            Theo TT 105/2023, <strong>KHÔNG GỌI</strong> nhập ngũ:<br />
            + Cận thị từ <strong>1.5 diop trở lên</strong>.<br />
            + Viễn thị các mức độ.<br />
            <span class="text-green-400 font-bold">+ Loạn thị đơn thuần vẫn ĐỦ điều kiện.</span>
          </p>
        </div>
      </div>

      <div class="flex gap-1.5 justify-center my-12 opacity-50">
        <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- FAQ Section -->
      <div class="mb-16 max-w-4xl mx-auto">
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-8 flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          FAQ — Câu hỏi thường gặp
        </h2>

        <div class="space-y-4">
          <div
            class="border border-border-default bg-bg-surface transition-colors hover:border-accent-coral group"
          >
            <button
              @click="toggleFaq('age')"
              class="w-full text-left px-6 py-4 flex justify-between items-center font-display font-medium text-text-primary"
            >
              Cách tính độ tuổi gọi nhập ngũ chuẩn xác nhất (Hết 25/27 tuổi được hiểu thế nào)?
              <span
                class="text-accent-coral transition-transform"
                :class="faqOpen.age ? 'rotate-180' : ''"
                >▼</span
              >
            </button>
            <div
              v-show="faqOpen.age"
              class="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border-default border-dashed pt-4 mt-1"
            >
              <strong>Căn cứ theo Điều 30 Luật Nghĩa vụ quân sự 2015:</strong> Công dân đủ 18 tuổi
              được gọi nhập ngũ; độ tuổi gọi nhập ngũ từ đủ 18 tuổi đến hết 25 tuổi. Công dân được
              đào tạo trình độ cao đẳng, đại học đã được tạm hoãn gọi nhập ngũ thì độ tuổi gọi nhập
              ngũ đến hết 27 tuổi.<br /><br />
              <strong>Giải thích chi tiết để tránh hiểu lầm:</strong> Cụm từ
              <em>"hết 25 tuổi"</em> theo luật được hiểu là mốc thời gian kéo dài cho đến
              <strong>ngay trước ngày sinh nhật tròn 26 tuổi</strong> của bạn. Điều này có nghĩa là,
              khi bạn chính thức bước qua ngày sinh nhật thứ 26 (bạn 26 tuổi), bạn mới không còn
              thuộc diện gọi nhập ngũ.<br /><br />
              Tương tự, đối với người có giấy hoãn để học Cao đẳng/Đại học, phải từ
              <strong>ngày sinh nhật tròn 28 tuổi trở đi</strong>, bạn mới chính thức hết độ tuổi
              gọi nhập ngũ theo luật định.
            </div>
          </div>

          <div
            class="border border-border-default bg-bg-surface transition-colors hover:border-accent-coral group"
          >
            <button
              @click="toggleFaq('one')"
              class="w-full text-left px-6 py-4 flex justify-between items-center font-display font-medium text-text-primary"
            >
              Cận bao nhiêu độ thì không phải đi Nghĩa vụ quân sự?
              <span
                class="text-accent-coral transition-transform"
                :class="faqOpen.one ? 'rotate-180' : ''"
                >▼</span
              >
            </button>
            <div
              v-show="faqOpen.one"
              class="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border-default border-dashed pt-4 mt-1"
            >
              Căn cứ theo <strong>Thông tư 105/2023/TT-BQP</strong>, những người cận thị từ
              <strong>1.5 Diop trở lên</strong> sẽ bị xếp vào sức khỏe Loại 4, 5 hoặc 6 và sẽ
              <strong>không được gọi nhập ngũ</strong>. Cận dưới 1.5 Diop vẫn được gọi nhập ngũ bình
              thường nếu các tiêu chí khác đạt.
            </div>
          </div>

          <div
            class="border border-border-default bg-bg-surface transition-colors hover:border-accent-coral group"
          >
            <button
              @click="toggleFaq('two')"
              class="w-full text-left px-6 py-4 flex justify-between items-center font-display font-medium text-text-primary"
            >
              Bị Viễn thị và Loạn thị có được miễn NVQS không?
              <span
                class="text-accent-coral transition-transform"
                :class="faqOpen.two ? 'rotate-180' : ''"
                >▼</span
              >
            </button>
            <div
              v-show="faqOpen.two"
              class="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border-default border-dashed pt-4 mt-1"
            >
              <strong>Đối với Viễn thị: CÓ.</strong> Theo Thông tư 105/2023/TT-BQP, người mắc bệnh
              Viễn thị ở mọi mức độ đều không đủ điều kiện nhập ngũ.<br /><br />
              <strong>Đối với Loạn thị: KHÔNG.</strong> Điểm mới nhất của luật năm 2026 quy định
              người bị Loạn thị đơn thuần sẽ được xếp loại sức khỏe 2 hoặc 3, do đó
              <strong>VẪN ĐỦ ĐIỀU KIỆN</strong> tham gia NVQS. Loạn thị chỉ rớt khi đi kèm Cận thị
              từ 1.5 Diop trở lên hoặc đi kèm Viễn thị.
            </div>
          </div>

          <div
            class="border border-border-default bg-bg-surface transition-colors hover:border-accent-coral group"
          >
            <button
              @click="toggleFaq('five')"
              class="w-full text-left px-6 py-4 flex justify-between items-center font-display font-medium text-text-primary"
            >
              Vừa Cận, vừa Loạn thị có được miễn nghĩa vụ quân sự không?
              <span
                class="text-accent-coral transition-transform"
                :class="faqOpen.five ? 'rotate-180' : ''"
                >▼</span
              >
            </button>
            <div
              v-show="faqOpen.five"
              class="px-6 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border-default border-dashed pt-4 mt-1"
            >
              Việc mắc đồng thời cả cận thị và loạn thị (cận loạn) sẽ được Hội đồng khám sức khỏe đo
              đạc riêng rẽ. Vì Loạn thị hiện nay VẪN được gọi đi nghĩa vụ, nên quyết định rớt phụ
              thuộc hoàn toàn vào độ Cận thị. Nếu độ Cận thị từ 1.5 Diop trở lên, bạn sẽ RỚT. Nhưng
              nếu độ cận dưới 1.5 Diop và kèm theo loạn thị, bạn
              <strong>VẪN ĐỦ ĐIỀU KIỆN</strong> đi.
            </div>
          </div>
        </div>
      </div>

      <!-- Tool Kiểm Tra Thị Lực Nhanh -->
      <div
        class="mb-16 max-w-4xl mx-auto border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up"
      >
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-2 flex items-center gap-3"
        >
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Tool Phân Loại Thị Lực (Không Kính)
        </h2>
        <p class="text-text-secondary text-sm mb-6">
          Dành cho các bạn biết kết quả đo mắt dạng 10/10 nhưng chưa biết quy đổi ra Thể lực loại
          mấy.
        </p>

        <div class="grid sm:grid-cols-2 gap-6 mb-6">
          <div class="space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Thị lực Mắt Trái (x/10)</label
            >
            <input
              type="number"
              v-model="eyeTestLeft"
              min="1"
              max="10"
              placeholder="VD: 10"
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-display tracking-wide text-text-secondary"
              >Thị lực Mắt Phải (x/10)</label
            >
            <input
              type="number"
              v-model="eyeTestRight"
              min="1"
              max="10"
              placeholder="VD: 10"
              class="w-full bg-bg-elevated border border-border-default text-text-primary focus:border-accent-sky focus:outline-none px-4 py-2"
            />
          </div>
        </div>

        <button
          @click="calculateEyeTest"
          class="bg-accent-sky/20 text-accent-sky border border-accent-sky hover:bg-accent-sky hover:text-bg-deep font-display font-semibold px-6 py-2 transition-colors mb-4"
        >
          QUY ĐỔI ĐIỂM
        </button>

        <div v-if="eyeTestResult" class="bg-bg-elevated p-4 border-l-4 border-accent-sky">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-text-secondary text-sm">Điểm số thị lực quy đổi:</span>
            <strong class="text-xl" :class="eyeTestResult.class">{{ eyeTestResult.score }}</strong>
          </div>
          <div class="text-sm">
            Kết luận: <span :class="eyeTestResult.class">{{ eyeTestResult.note }}</span>
          </div>
        </div>
      </div>

      <!-- Bảng Chấm Tiêu Chí Khám Sức Khỏe -->
      <div class="mb-16">
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-4 flex items-center gap-3"
        >
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Bảng Phân Loại Sức Khỏe
        </h2>
        <p class="text-text-secondary text-sm mb-6 max-w-3xl leading-relaxed">
          Căn cứ Điều 9 Thông tư 105: Mỗi chỉ tiêu sẽ được chấm điểm từ 1 đến 6. Sức khỏe được phân
          loại dựa trên điểm số <strong>thấp nhất</strong> trong các chỉ tiêu.
        </p>

        <div class="overflow-x-auto border border-border-default bg-bg-surface">
          <table class="w-full text-sm text-left text-text-primary">
            <thead
              class="bg-bg-elevated text-text-secondary font-display font-medium text-xs uppercase border-b border-border-default"
            >
              <tr>
                <th class="px-6 py-4 border-r border-border-default text-center">Phân loại</th>
                <th class="px-6 py-4 border-r border-border-default">
                  Tình trạng sức khỏe tương ứng
                </th>
                <th class="px-6 py-4 text-center">Đủ điều kiện?</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border-default hover:bg-bg-elevated transition-colors">
                <td
                  class="px-6 py-4 border-r border-border-default text-center font-bold text-green-400"
                >
                  Loại 1
                </td>
                <td class="px-6 py-4 border-r border-border-default text-text-secondary">
                  Tất cả các chỉ tiêu đều đạt điểm 1.
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="bg-green-500/20 text-green-400 px-3 py-1 text-xs font-bold border border-green-500/30"
                    >CÓ GỌI</span
                  >
                </td>
              </tr>
              <tr class="border-b border-border-default hover:bg-bg-elevated transition-colors">
                <td
                  class="px-6 py-4 border-r border-border-default text-center font-bold text-green-400"
                >
                  Loại 2
                </td>
                <td class="px-6 py-4 border-r border-border-default text-text-secondary">
                  Có ít nhất 1 chỉ tiêu bị điểm 2.
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="bg-green-500/20 text-green-400 px-3 py-1 text-xs font-bold border border-green-500/30"
                    >CÓ GỌI</span
                  >
                </td>
              </tr>
              <tr class="border-b border-border-default hover:bg-bg-elevated transition-colors">
                <td
                  class="px-6 py-4 border-r border-border-default text-center font-bold text-green-400"
                >
                  Loại 3
                </td>
                <td class="px-6 py-4 border-r border-border-default text-text-secondary">
                  Có ít nhất 1 chỉ tiêu bị điểm 3.
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="bg-green-500/20 text-green-400 px-3 py-1 text-xs font-bold border border-green-500/30"
                    >CÓ GỌI</span
                  >
                </td>
              </tr>
              <tr class="border-b border-border-default hover:bg-bg-elevated transition-colors">
                <td
                  class="px-6 py-4 border-r border-border-default text-center font-bold text-accent-coral"
                >
                  Loại 4
                </td>
                <td class="px-6 py-4 border-r border-border-default text-text-secondary">
                  Có ít nhất 1 chỉ tiêu bị điểm 4. (VD: Cận 1.5 - dưới 3)
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="bg-accent-coral/20 text-accent-coral px-3 py-1 text-xs font-bold border border-accent-coral/30"
                    >KHÔNG GỌI</span
                  >
                </td>
              </tr>
              <tr class="border-b border-border-default hover:bg-bg-elevated transition-colors">
                <td
                  class="px-6 py-4 border-r border-border-default text-center font-bold text-accent-coral"
                >
                  Loại 5, 6
                </td>
                <td class="px-6 py-4 border-r border-border-default text-text-secondary">
                  Có ít nhất 1 chỉ tiêu bị điểm 5 hoặc 6. (VD: Các bệnh nặng về mắt)
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    class="bg-accent-coral/20 text-accent-coral px-3 py-1 text-xs font-bold border border-accent-coral/30"
                    >KHÔNG GỌI</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- FOMO Footer -->
  <footer
    class="bg-bg-deep border-t border-border-default py-8 text-center text-text-secondary text-sm font-display"
  >
    <p>Code bằng đam mê phục vụ anh em genZ chuẩn bị nhập ngũ 2026.</p>
    <p class="mt-2">
      Ghé thăm
      <a
        href="https://nguyenquocanh.io.vn"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent-coral link-underline font-bold hover:text-white transition-colors"
        >Portfolio của tôi (Nguyễn Quốc Anh)</a
      >
      nếu bạn thấy tool này hữu ích nhé!
    </p>
  </footer>
</template>

<style scoped>
/* Scoped styles in case needed, otherwise Tailwind covers it */
</style>
