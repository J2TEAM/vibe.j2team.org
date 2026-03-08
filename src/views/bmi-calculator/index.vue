<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import BackToTop from '@/components/BackToTop.vue'

// State
const gender = ref<'male' | 'female'>('male')
const height = ref<number | null>(null)
const weight = ref<number | null>(null)

// Computed
const bmi = computed(() => {
  if (!height.value || !weight.value || height.value <= 0 || weight.value <= 0) return null
  // Chiều cao nhập bằng cm, quy đổi ra m
  const heightInMeter = height.value / 100
  return Number((weight.value / (heightInMeter * heightInMeter)).toFixed(1))
})

const bmiStatus = computed(() => {
  if (!bmi.value) return null

  // Mặc dù chuẩn WHO chung cho nam và nữ, nhưng nhiều khuyến nghị sức khỏe
  // có các ngưỡng hoặc cách gọi slightly khác cho nữ. Ta có thể thêm 1 chút tinh chỉnh label.
  const prefix = gender.value === 'female' ? '(Nữ) ' : '(Nam) '

  if (bmi.value < 18.5) {
    return { label: prefix + 'Cân nặng thấp (Gầy)', color: 'text-blue-500', bg: 'bg-blue-500/10' }
  }
  if (bmi.value >= 18.5 && bmi.value <= 24.9) {
    return { label: prefix + 'Bình thường', color: 'text-green-500', bg: 'bg-green-500/10' }
  }
  if (bmi.value >= 25 && bmi.value <= 29.9) {
    return { label: prefix + 'Tiền béo phì (Thừa cân)', color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
  }
  if (bmi.value >= 30 && bmi.value <= 34.9) {
    return { label: prefix + 'Béo phì độ I', color: 'text-orange-500', bg: 'bg-orange-500/10' }
  }
  if (bmi.value >= 35 && bmi.value <= 39.9) {
    return { label: prefix + 'Béo phì độ II', color: 'text-red-500', bg: 'bg-red-500/10' }
  }
  return { label: prefix + 'Béo phì độ III', color: 'text-rose-600', bg: 'bg-rose-600/10' }
})

// Methods
const reset = () => {
  height.value = null
  weight.value = null
  gender.value = 'male'
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4 sm:p-6 pb-24 font-body text-text-primary relative"
  >
    <!-- Back to Home Button (Explicit) -->
    <div class="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
      <RouterLink
        to="/"
        class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-text-dim transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-border-default"
      >
        <span class="text-xl leading-none">&larr;</span>
        <span class="text-sm font-medium">Trang chủ</span>
      </RouterLink>
    </div>

    <!-- Header -->
    <div class="max-w-md w-full mb-8 text-center space-y-2">
      <h1 class="font-display text-4xl font-bold tracking-tight text-text-primary">
        BMI Calculator
      </h1>
      <p class="text-text-secondary text-base">Tính chỉ số khối cơ thể nhanh chóng & dễ dàng</p>
    </div>

    <!-- Main Card -->
    <div
      class="max-w-md w-full bg-bg-surface border border-border-default rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-300"
    >
      <div class="p-6 sm:p-8 space-y-6">
        <!-- Input section -->
        <div class="space-y-5">
          <!-- Giới tính -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-text-secondary">Giới tính</label>
            <div class="grid grid-cols-2 gap-3 relative">
              <!-- Nút Nam -->
              <button
                @click="gender = 'male'"
                class="relative py-3.5 px-4 rounded-xl transition-all duration-300 font-medium overflow-hidden border focus:outline-none"
                :class="[
                  gender === 'male'
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'border-border-default bg-bg-deep text-text-secondary hover:text-text-primary hover:border-text-dim hover:bg-bg-surface'
                ]"
              >
                <!-- Hiệu ứng nhấp nháy nền phía sau khi được chọn -->
                <div v-if="gender === 'male'" class="absolute inset-0 bg-blue-400/20 animate-pulse pointer-events-none rounded-xl"></div>
                <span class="relative z-10 flex items-center justify-center gap-2">
                  <span class="text-lg">👨</span> Nam giới
                </span>
              </button>

              <!-- Nút Nữ -->
              <button
                @click="gender = 'female'"
                class="relative py-3.5 px-4 rounded-xl transition-all duration-300 font-medium overflow-hidden border focus:outline-none"
                :class="[
                  gender === 'female'
                    ? 'border-pink-500/50 bg-pink-500/10 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                    : 'border-border-default bg-bg-deep text-text-secondary hover:text-text-primary hover:border-text-dim hover:bg-bg-surface'
                ]"
              >
                 <!-- Hiệu ứng nhấp nháy nền phía sau khi được chọn -->
                <div v-if="gender === 'female'" class="absolute inset-0 bg-pink-400/20 animate-pulse pointer-events-none rounded-xl"></div>
                <span class="relative z-10 flex items-center justify-center gap-2">
                  <span class="text-lg">👩</span> Nữ giới
                </span>
              </button>
            </div>
          </div>

          <!-- Chiều cao -->
          <div class="space-y-2">
            <label for="height" class="block text-sm font-medium text-text-secondary">
              Chiều cao (cm)
            </label>
            <div class="relative">
              <input
                id="height"
                v-model.number="height"
                type="number"
                placeholder="Ví dụ: 170"
                min="0"
                class="w-full bg-bg-deep border border-border-default rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-amber focus:border-transparent transition-all placeholder:text-text-dim"
              />
              <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span class="text-text-dim text-sm font-medium">cm</span>
              </div>
            </div>
          </div>

          <!-- Cân nặng -->
          <div class="space-y-2">
            <label for="weight" class="block text-sm font-medium text-text-secondary">
              Cân nặng (kg)
            </label>
            <div class="relative">
              <input
                id="weight"
                v-model.number="weight"
                type="number"
                placeholder="Ví dụ: 65"
                min="0"
                class="w-full bg-bg-deep border border-border-default rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all placeholder:text-text-dim"
              />
              <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span class="text-text-dim text-sm font-medium">kg</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Result section -->
        <div
          v-if="bmi && bmiStatus"
          class="rounded-xl p-5 border transition-all duration-500 ease-out flex flex-col items-center justify-center space-y-2"
          :class="[
            bmiStatus.bg,
            bmiStatus.color.replace('text-', 'border-').replace('500', '500/30'),
            bmiStatus.color.replace('text-rose-', 'border-rose-').replace('600', '600/30')
          ]"
        >
          <p class="text-sm font-medium opacity-80 uppercase tracking-widest">Chỉ số BMI của bạn</p>
          <div class="text-5xl font-display font-black tracking-tighter" :class="bmiStatus.color">
            {{ bmi }}
          </div>
          <p class="text-lg font-semibold pt-1 text-center" :class="bmiStatus.color">
            {{ bmiStatus.label }}
          </p>
        </div>

        <!-- Empty state / Helper text -->
        <div
          v-else
          class="rounded-xl p-5 border border-dashed border-border-default bg-bg-deep/50 text-center transition-all duration-500"
        >
          <p class="text-text-dim text-sm">Nhập thông số để xem kết quả đánh giá thể trạng.</p>
        </div>


        <!-- Actions -->
        <div class="pt-2">
          <button
            @click="reset"
            class="w-full py-3 px-4 rounded-xl border border-border-default hover:bg-bg-deep hover:border-text-dim text-text-secondary hover:text-text-primary transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-border-default"
          >
            Làm mới (Reset)
          </button>
        </div>
      </div>
    </div>

    <!-- Info Note -->
    <p class="max-w-md w-full text-center text-xs text-text-dim mt-6 leading-relaxed">
      * BMI áp dụng cho nam và nữ trưởng thành (từ 18 tuổi trở lên). Không áp dụng cho phụ nữ có
      thai, vận động viên, người già. Phân loại theo tiêu chuẩn WHO.
    </p>

    <BackToTop />
  </div>
</template>

<style scoped>
/* Ẩn mũi tên cuộn trong thẻ input number cho các trình duyệt */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
