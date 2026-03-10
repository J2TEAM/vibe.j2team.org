<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, computed } from 'vue'

// Tác giả: Your Name
const fullName = ref('')
const birthDate = ref('')
const activeTab = ref('basic')
const showResult = ref(false)

// Interface cho kết quả
interface NumerologyResult {
  lifePath: number
  attitude: number
  destiny: number
  soulUrge: number
  personality: number
  lifePathMeaning: NumberMeaning
  attitudeMeaning: NumberMeaning
  destinyMeaning: NumberMeaning
  soulUrgeMeaning: NumberMeaning
  personalityMeaning: NumberMeaning
}

interface NumberMeaning {
  title: string
  description: string
  positive: string
  negative: string
}

// Hàm tính tổng các chữ số (rút gọn về 1-9, trừ 11,22,33)
const reduceNumber = (num: number): number => {
  if (num === 11 || num === 22 || num === 33) return num
  let result = num
  while (result > 9) {
    result = result
      .toString()
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit), 0)
  }
  return result
}

// Tính chỉ số đường đời từ ngày sinh
const calculateLifePath = (date: string): number => {
  if (!date) return 0

  try {
    const [year, month, day] = date.split('-').map(Number)

    // Kiểm tra nếu có giá trị undefined hoặc NaN
    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) return 0

    const sum = day + month + year
    return reduceNumber(sum)
  } catch (error) {
    console.error('Lỗi khi tính chỉ số đường đời:', error)
    return 0
  }
}

// Tính chỉ số thái độ từ ngày sinh (ngày + tháng)
const calculateAttitude = (date: string): number => {
  if (!date) return 0

  try {
    const [year, month, day] = date.split('-').map(Number)

    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) return 0

    const sum = day + month
    return reduceNumber(sum)
  } catch (error) {
    console.error('Lỗi khi tính chỉ số thái độ:', error)
    return 0
  }
}

// Tính chỉ số linh hồn (nguyên âm)
const calculateSoulUrge = (name: string): number => {
  if (!name) return 0

  const vowels = ['a', 'e', 'i', 'o', 'u']
  const vowelValues: Record<string, number> = {
    a: 1,
    e: 5,
    i: 9,
    o: 6,
    u: 3,
  }

  const sum = name
    .toLowerCase()
    .split('')
    .filter((char) => vowels.includes(char))
    .map((char) => vowelValues[char] || 0)
    .reduce((acc, val) => acc + val, 0)

  return sum > 0 ? reduceNumber(sum) : 0
}

// Tính chỉ số nhân cách (phụ âm)
const calculatePersonality = (name: string): number => {
  if (!name) return 0

  const vowels = ['a', 'e', 'i', 'o', 'u']
  const consonantValues: Record<string, number> = {
    b: 2,
    c: 3,
    d: 4,
    f: 6,
    g: 7,
    h: 8,
    j: 1,
    k: 2,
    l: 3,
    m: 4,
    n: 5,
    p: 7,
    q: 8,
    r: 9,
    s: 1,
    t: 2,
    v: 4,
    w: 5,
    x: 6,
    y: 7,
    z: 8,
  }

  const sum = name
    .toLowerCase()
    .split('')
    .filter((char) => char.match(/[a-z]/) && !vowels.includes(char))
    .map((char) => consonantValues[char] || 0)
    .reduce((acc, val) => acc + val, 0)

  return sum > 0 ? reduceNumber(sum) : 0
}

// Tính chỉ số sứ mệnh (tổng các chữ cái)
const calculateDestiny = (name: string): number => {
  if (!name) return 0

  const sum = name
    .toLowerCase()
    .split('')
    .filter((char) => char.match(/[a-z]/))
    .map((char) => char.charCodeAt(0) - 96)
    .reduce((acc, val) => acc + val, 0)

  return sum > 0 ? reduceNumber(sum) : 0
}

// Dữ liệu ý nghĩa các chỉ số
const numberMeanings: Record<number, NumberMeaning> = {
  1: {
    title: 'Nhà Lãnh Đạo',
    description: 'Độc lập, sáng tạo, quyết đoán',
    positive: 'Tiên phong, tự tin, ý chí mạnh mẽ',
    negative: 'Ích kỷ, độc đoán, dễ nóng giận',
  },
  2: {
    title: 'Nhà Ngoại Giao',
    description: 'Nhạy cảm, hợp tác, cân bằng',
    positive: 'Khéo léo, kiên nhẫn, trực giác tốt',
    negative: 'Nhút nhát, dễ bị ảnh hưởng, thụ động',
  },
  3: {
    title: 'Người Truyền Cảm Hứng',
    description: 'Sáng tạo, lạc quan, giao tiếp',
    positive: 'Hài hước, nghệ thuật, cuốn hút',
    negative: 'Phân tán, kịch tính, thiếu tập trung',
  },
  4: {
    title: 'Người Thực Tế',
    description: 'Kỷ luật, đáng tin cậy, truyền thống',
    positive: 'Chăm chỉ, trung thành, nguyên tắc',
    negative: 'Cứng nhắc, bảo thủ, thiếu linh hoạt',
  },
  5: {
    title: 'Người Tự Do',
    description: 'Linh hoạt, phiêu lưu, thích nghi',
    positive: 'Đa tài, tò mò, dễ thích nghi',
    negative: 'Bồn chồn, thiếu trách nhiệm, bốc đồng',
  },
  6: {
    title: 'Người Yêu Thương',
    description: 'Trách nhiệm, quan tâm, hài hòa',
    positive: 'Ấm áp, vị tha, nghệ thuật',
    negative: 'Bao biện, hay lo lắng, thích kiểm soát',
  },
  7: {
    title: 'Nhà Triết Học',
    description: 'Phân tích, tâm linh, bí ẩn',
    positive: 'Thông thái, trực giác, sâu sắc',
    negative: 'Xa cách, hoài nghi, cô độc',
  },
  8: {
    title: 'Nhà Quản Lý',
    description: 'Tham vọng, quyền lực, vật chất',
    positive: 'Kinh doanh giỏi, tổ chức tốt',
    negative: 'Thực dụng, độc tài, ham vật chất',
  },
  9: {
    title: 'Nhà Nhân Đạo',
    description: 'Vị tha, bao dung, lý tưởng',
    positive: 'Cao cả, nghệ thuật, thông cảm',
    negative: 'Viển vông, dễ tổn thương, hy sinh quá mức',
  },
  11: {
    title: 'Nhà Tâm Linh (Master)',
    description: 'Trực giác siêu phàm, khai sáng',
    positive: 'Cảm xúc sâu sắc, truyền cảm hứng',
    negative: 'Quá nhạy cảm, áp lực tinh thần',
  },
  22: {
    title: 'Kiến Trúc Sư Trưởng (Master)',
    description: 'Xây dựng giấc mơ thành hiện thực',
    positive: 'Tầm nhìn xa, thực tế, quy mô lớn',
    negative: 'Quá tải trách nhiệm, căng thẳng',
  },
  33: {
    title: 'Người Thầy Tâm Linh (Master)',
    description: 'Tình yêu thương vô điều kiện, chữa lành',
    positive: 'Bao dung, truyền cảm hứng, hy sinh',
    negative: 'Quá tải cảm xúc, dễ bị lợi dụng',
  },
}

// Default meaning khi không tìm thấy
const DEFAULT_MEANING: NumberMeaning = {
  title: 'Chưa xác định',
  description: 'Không thể xác định ý nghĩa cho số này',
  positive: '',
  negative: '',
}

// Hàm an toàn để lấy ý nghĩa số
const getNumberMeaning = (num: number): NumberMeaning => {
  if (num === 0) {
    return DEFAULT_MEANING
  }

  // Xử lý master numbers
  if (num === 11 || num === 22 || num === 33) {
    return (
      numberMeanings[num] ??
      numberMeanings[reduceNumber(num)] ??
      numberMeanings[1] ??
      DEFAULT_MEANING
    )
  }

  // Rút gọn nếu > 9 và không phải master number
  const reducedNum = reduceNumber(num)
  return numberMeanings[reducedNum] ?? numberMeanings[1] ?? DEFAULT_MEANING
}

// Tính toán các chỉ số
const numerologyResults = computed<NumerologyResult | null>(() => {
  if (!fullName.value.trim() || !birthDate.value) return null

  const lifePath = calculateLifePath(birthDate.value)
  const attitude = calculateAttitude(birthDate.value)
  const destiny = calculateDestiny(fullName.value)
  const soulUrge = calculateSoulUrge(fullName.value)
  const personality = calculatePersonality(fullName.value)

  // Kiểm tra nếu tất cả đều là 0
  if (lifePath === 0 && attitude === 0 && destiny === 0 && soulUrge === 0 && personality === 0) {
    return null
  }

  return {
    lifePath,
    attitude,
    destiny,
    soulUrge,
    personality,
    lifePathMeaning: getNumberMeaning(lifePath),
    attitudeMeaning: getNumberMeaning(attitude),
    destinyMeaning: getNumberMeaning(destiny),
    soulUrgeMeaning: getNumberMeaning(soulUrge),
    personalityMeaning: getNumberMeaning(personality),
  }
})

const calculate = () => {
  if (fullName.value.trim() && birthDate.value) {
    showResult.value = true
  }
}

const resetForm = () => {
  fullName.value = ''
  birthDate.value = ''
  showResult.value = false
  activeTab.value = 'basic'
}

// Format ngày sinh hiển thị
const formattedBirthDate = computed(() => {
  if (!birthDate.value) return ''
  try {
    const [year, month, day] = birthDate.value.split('-')
    return `${day}/${month}/${year}`
  } catch {
    return birthDate.value
  }
})

// ngày may mắn
const luckyDay = computed(() => {
  if (!numerologyResults.value) return ''
  const days = ['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Chủ nhật']
  const dayIndex = (numerologyResults.value.destiny - 1) % 7
  const day = days[dayIndex]
  return day === 'Chủ nhật' ? day : `Thứ ${day}`
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 py-8 relative"
  >
    <!-- Nút back về home page - Điều chỉnh để không che nội dung -->
    <RouterLink
      to="/"
      class="fixed sm:absolute top-4 right-4 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3 z-50 shadow-lg"
    >
      &larr; Về trang chủ
    </RouterLink>

    <!-- Thêm padding top cho mobile để tránh button đè content -->
    <div class="max-w-3xl w-full pt-16">
      <div class="mb-8 text-center">
        <h1
          class="font-display text-3xl min-[375px]:text-4xl sm:text-5xl font-bold text-accent-coral animate-fade-up"
        >
          Thần Số Học 🔢
        </h1>
        <p
          class="mt-2 text-text-secondary text-sm sm:text-base animate-fade-up animate-delay-2 px-2"
        >
          Khám phá ý nghĩa các con số trong cuộc đời bạn
        </p>
      </div>

      <!-- Main content - Thêm overflow-x-auto để tránh tràn trên mobile -->
      <div
        class="bg-bg-surface border border-border-default p-4 sm:p-8 animate-fade-up animate-delay-3 overflow-x-auto"
      >
        <!-- Form input -->
        <div v-if="!showResult" class="space-y-6">
          <div>
            <label for="fullName" class="block text-sm font-medium text-text-secondary mb-2">
              Họ và tên khai sinh <span class="text-accent-coral">*</span>
            </label>
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="VD: Nguyễn Văn A"
              class="w-full px-4 py-3 bg-bg-deep border border-border-default text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent-coral transition-colors"
              :class="{ 'border-accent-coral': fullName }"
            />
            <p class="mt-1 text-xs text-text-secondary/50">
              Nhập đúng họ tên khai sinh để kết quả chính xác nhất
            </p>
          </div>

          <div>
            <label for="birthDate" class="block text-sm font-medium text-text-secondary mb-2">
              Ngày sinh <span class="text-accent-coral">*</span>
            </label>
            <input
              id="birthDate"
              v-model="birthDate"
              type="date"
              class="w-full px-4 py-3 bg-bg-deep border border-border-default text-text-primary focus:outline-none focus:border-accent-coral transition-colors date-input-white-icon"
              :class="{ 'border-accent-coral': birthDate }"
            />
          </div>

          <button
            @click="calculate"
            :disabled="!fullName.trim() || !birthDate"
            class="w-full bg-accent-coral text-bg-deep font-medium py-3 px-4 hover:bg-opacity-90 hover:cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tra cứu thần số học
          </button>
        </div>

        <!-- Results - Responsive improvements -->
        <div v-else-if="numerologyResults" class="space-y-6">
          <!-- Thông tin cơ bản - Responsive -->
          <div class="text-center p-4 bg-bg-deep/30 break-words">
            <p class="text-text-secondary text-sm">Tra cứu cho</p>
            <p class="text-text-primary font-medium text-base sm:text-lg break-words">
              {{ fullName }}
            </p>
            <p class="text-text-secondary text-xs">Ngày sinh: {{ formattedBirthDate }}</p>
          </div>

          <!-- Tabs - Scrollable on mobile -->
          <div class="flex border-b border-border-default overflow-x-auto hide-scrollbar">
            <button
              @click="activeTab = 'basic'"
              class="flex-1 min-w-[100px] py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap"
              :class="
                activeTab === 'basic'
                  ? 'text-accent-coral'
                  : 'text-text-secondary hover:text-text-primary'
              "
            >
              Cơ bản
              <span
                v-if="activeTab === 'basic'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
              ></span>
            </button>
            <button
              @click="activeTab = 'personality'"
              class="flex-1 min-w-[100px] py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap"
              :class="
                activeTab === 'personality'
                  ? 'text-accent-coral'
                  : 'text-text-secondary hover:text-text-primary'
              "
            >
              Tính cách
              <span
                v-if="activeTab === 'personality'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
              ></span>
            </button>
            <button
              @click="activeTab = 'destiny'"
              class="flex-1 min-w-[100px] py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap"
              :class="
                activeTab === 'destiny'
                  ? 'text-accent-coral'
                  : 'text-text-secondary hover:text-text-primary'
              "
            >
              Sứ mệnh
              <span
                v-if="activeTab === 'destiny'"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-accent-coral"
              ></span>
            </button>
          </div>

          <!-- Basic Info Tab - Responsive grid -->
          <div v-if="activeTab === 'basic'" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="bg-bg-deep p-3 sm:p-4">
                <div class="text-2xl sm:text-3xl font-display font-bold text-accent-coral mb-1">
                  {{ numerologyResults.lifePath }}
                </div>
                <div class="text-xs sm:text-sm font-medium text-text-secondary mb-2">
                  Chỉ số đường đời
                </div>
                <div class="text-xs text-text-secondary break-words">
                  {{ numerologyResults.lifePathMeaning.title }}
                </div>
              </div>

              <div class="bg-bg-deep p-3 sm:p-4">
                <div class="text-2xl sm:text-3xl font-display font-bold text-accent-coral mb-1">
                  {{ numerologyResults.attitude }}
                </div>
                <div class="text-xs sm:text-sm font-medium text-text-secondary mb-2">
                  Chỉ số thái độ
                </div>
                <div class="text-xs text-text-secondary break-words">
                  {{ numerologyResults.attitudeMeaning.title }}
                </div>
              </div>
            </div>

            <div class="p-3 sm:p-4 bg-bg-deep/50">
              <h3 class="font-medium text-text-primary mb-2 text-sm sm:text-base">
                Đường đời số {{ numerologyResults.lifePath }}
              </h3>
              <p class="text-xs sm:text-sm text-text-secondary break-words">
                {{ numerologyResults.lifePathMeaning.description }}
              </p>
            </div>
          </div>

          <!-- Personality Tab - Responsive -->
          <div v-if="activeTab === 'personality'" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="bg-bg-deep p-3 sm:p-4">
                <div class="text-2xl sm:text-3xl font-display font-bold text-accent-coral mb-1">
                  {{ numerologyResults.soulUrge }}
                </div>
                <div class="text-xs sm:text-sm font-medium text-text-secondary mb-2">
                  Chỉ số linh hồn
                </div>
                <div class="text-xs text-text-secondary break-words">
                  {{ numerologyResults.soulUrgeMeaning.title }}
                </div>
              </div>

              <div class="bg-bg-deep p-3 sm:p-4">
                <div class="text-2xl sm:text-3xl font-display font-bold text-accent-coral mb-1">
                  {{ numerologyResults.personality }}
                </div>
                <div class="text-xs sm:text-sm font-medium text-text-secondary mb-2">
                  Chỉ số nhân cách
                </div>
                <div class="text-xs text-text-secondary break-words">
                  {{ numerologyResults.personalityMeaning.title }}
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="p-3 bg-bg-deep/50">
                <div class="text-xs sm:text-sm font-medium text-accent-coral mb-1">Điểm mạnh:</div>
                <p class="text-xs text-text-secondary break-words">
                  {{ numerologyResults.soulUrgeMeaning.positive }}
                </p>
              </div>
              <div class="p-3 bg-bg-deep/50">
                <div class="text-xs sm:text-sm font-medium text-accent-coral mb-1">Điểm yếu:</div>
                <p class="text-xs text-text-secondary break-words">
                  {{ numerologyResults.soulUrgeMeaning.negative }}
                </p>
              </div>
            </div>
          </div>

          <!-- Destiny Tab - Responsive -->
          <div v-if="activeTab === 'destiny'" class="space-y-4">
            <div class="bg-bg-deep p-4 sm:p-6 text-center">
              <div class="text-4xl sm:text-5xl font-display font-bold text-accent-coral mb-2">
                {{ numerologyResults.destiny }}
              </div>
              <div class="text-xs sm:text-sm font-medium text-text-secondary mb-2">
                Chỉ số sứ mệnh
              </div>
              <div class="text-xs text-text-secondary break-words">
                {{ numerologyResults.destinyMeaning.title }}
              </div>
            </div>

            <div class="p-3 sm:p-4 bg-bg-deep/50">
              <h3 class="font-medium text-text-primary mb-2 text-sm sm:text-base">
                Sứ mệnh của bạn:
              </h3>
              <p class="text-xs sm:text-sm text-text-secondary break-words">
                {{ numerologyResults.destinyMeaning.description }}
              </p>
            </div>

            <!-- Responsive grid cho màu sắc và ngày -->
            <div class="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 p-3 sm:p-4 bg-bg-deep/50">
              <div class="flex flex-col xs:block">
                <span class="text-text-secondary text-xs sm:text-sm">Màu sắc hợp:</span>
                <span class="text-text-primary text-xs sm:text-sm font-medium ml-0 xs:ml-2">
                  {{
                    ['Đỏ', 'Cam', 'Vàng', 'Xanh lá', 'Xanh dương', 'Tím', 'Hồng', 'Nâu', 'Trắng'][
                      (numerologyResults.destiny - 1) % 9
                    ]
                  }}
                </span>
              </div>
              <div class="flex flex-col xs:block">
                <span class="text-text-secondary text-xs sm:text-sm">Ngày may mắn:</span>
                <span class="text-text-primary text-xs sm:text-sm font-medium ml-0 xs:ml-2">
                  {{ luckyDay }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions - Responsive buttons -->
          <div class="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-4 border-t border-border-default">
            <button
              @click="resetForm"
              class="flex-1 bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-coral hover:cursor-pointer py-2 px-3 sm:px-4 text-xs sm:text-sm transition-colors"
            >
              Tra cứu lại
            </button>
            <button
              @click="showResult = false"
              class="flex-1 bg-accent-coral text-bg-deep hover:bg-opacity-90 hover:cursor-pointer py-2 px-3 sm:px-4 text-xs sm:text-sm transition-colors"
            >
              Nhập thông tin mới
            </button>
          </div>
        </div>

        <!-- Loading/Error state -->
        <div v-else-if="showResult" class="text-center py-8">
          <p class="text-text-secondary text-sm sm:text-base">
            Không thể tính toán với thông tin đã nhập. Vui lòng thử lại!
          </p>
          <button
            @click="showResult = false"
            class="mt-4 bg-accent-coral text-bg-deep font-medium py-2 px-4 sm:px-6 text-xs sm:text-sm hover:bg-opacity-90 hover:cursor-pointer transition-colors"
          >
            Nhập lại
          </button>
        </div>

        <!-- Footer note -->
        <p class="mt-6 text-xs text-text-secondary/50 text-center px-2">
          * Thần số học Pythagoras - Kết quả chỉ mang tính chất tham khảo
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ẩn scrollbar cho tab nhưng vẫn cho phép scroll */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Đổi màu icon lịch trong input date thành trắng */
.date-input-white-icon::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.8;
  cursor: pointer;
}

.date-input-white-icon::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Custom breakpoint cho xs (extra small) */
@media (min-width: 480px) {
  .xs\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .xs\:flex-row {
    flex-direction: row;
  }
  .xs\:block {
    display: block;
  }
  .xs\:ml-2 {
    margin-left: 0.5rem;
  }
}

/* Đảm bảo text wrap tốt trên mobile */
.break-words {
  word-break: break-word;
  overflow-wrap: break-word;
}
</style>
