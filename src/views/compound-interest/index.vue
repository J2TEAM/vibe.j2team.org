<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

// Input state
const initialInvestment = ref<number>(10000000) // 10M VND default
const recurringContribution = ref<number>(1000000) // 1M VND default
const contributionFrequency = ref<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
const annualReturn = ref<number>(10) // 10% default
const timeHorizon = ref<number>(10) // 10 years default

// Quick amount suggestions (in VND)
const amountSuggestions = [
  { label: '100K', value: 100000 },
  { label: '500K', value: 500000 },
  { label: '1M', value: 1000000 },
  { label: '2M', value: 2000000 },
  { label: '5M', value: 5000000 },
  { label: '10M', value: 10000000 },
  { label: '50M', value: 50000000 },
  { label: '100M', value: 100000000 },
]

// Frequency multiplier for yearly calculations
const frequencyMultiplier = computed(() => {
  switch (contributionFrequency.value) {
    case 'daily':
      return 365
    case 'weekly':
      return 52
    case 'monthly':
      return 12
    case 'yearly':
    default:
      return 1
  }
})

// Compound interest calculation
const results = computed(() => {
  const P = initialInvestment.value // Principal
  const PMT = recurringContribution.value // Recurring contribution
  const n = frequencyMultiplier.value // Compounding frequency per year
  const r = annualReturn.value / 100 // Annual rate as decimal
  const t = timeHorizon.value // Time in years

  // Future value of initial investment: P * (1 + r/n)^(n*t)
  const fvInitial = P * Math.pow(1 + r / n, n * t)

  // Future value of recurring contributions: PMT * (((1 + r/n)^(n*t) - 1) / (r/n))
  const fvContributions = r > 0
    ? PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n))
    : PMT * n * t

  const totalFutureValue = fvInitial + fvContributions
  const totalInvested = P + PMT * n * t
  const totalInterest = totalFutureValue - totalInvested

  // Chart data
  const investedRatio = totalInvested > 0 ? (totalInvested / totalFutureValue) * 100 : 0
  const interestRatio = 100 - investedRatio

  return {
    totalFutureValue,
    totalInvested,
    totalInterest,
    investedRatio,
    interestRatio,
  }
})

// Format number as VND currency
function formatCurrency(value: number): string {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + ' tỷ'
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(1) + ' triệu'
  } else if (value >= 1e3) {
    return (value / 1e3).toFixed(0) + ' nghìn'
  }
  return value.toLocaleString('vi-VN') + ' ₫'
}

// Format for input display (smart readable)
function formatInputDisplay(value: number): string {
  if (value === 0) return ''
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + ' tỷ'
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(1) + ' triệu'
  } else if (value >= 1e3) {
    return (value / 1e3).toFixed(0) + ' nghìn'
  }
  return value.toLocaleString('vi-VN') + ' VND'
}

// Calculate SVG arc for pie chart
function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return ['M', cx, cy, 'L', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y, 'Z'].join(' ')
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

// Set amount from suggestion
function setInitialAmount(value: number) {
  initialInvestment.value = value
}

function setContributionAmount(value: number) {
  recurringContribution.value = value
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-8 md:py-12">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <header class="text-center mb-12 animate-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-accent-coral tracking-tight">
          Tính Lãi Kép
        </h1>
        <p class="mt-4 text-text-secondary text-lg max-w-xl mx-auto">
          Xem tiền của bạn tăng trưởng theo thời gian với sức mạnh của lãi suất kép
        </p>
      </header>

      <!-- Main Content -->
      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Input Panel -->
        <div class="border border-border-default bg-bg-surface p-6 md:p-8 animate-fade-up animate-delay-1">
          <h2 class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            Nhập thông tin
          </h2>

          <div class="space-y-6">
            <!-- Initial Investment -->
            <div class="space-y-2">
              <label class="text-sm text-text-secondary font-display tracking-wide">
                Vốn ban đầu (₫)
              </label>
              <input
                v-model.number="initialInvestment"
                type="number"
                min="0"
                step="1000000"
                class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-text-primary
                       focus:border-accent-coral focus:outline-none transition-colors
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="10,000,000"
              />
              <!-- Readable display -->
              <p v-if="initialInvestment > 0" class="text-text-dim text-sm">
                ≈ {{ formatInputDisplay(initialInvestment) }}
              </p>
              <!-- Quick suggestions -->
              <div class="flex flex-wrap gap-2 mt-2">
                <button
                  v-for="suggestion in amountSuggestions"
                  :key="suggestion.value"
                  @click="setInitialAmount(suggestion.value)"
                  :class="[
                    'px-2.5 py-1 text-xs font-display transition-all duration-200 border',
                    initialInvestment === suggestion.value
                      ? 'bg-accent-coral/20 text-accent-coral border-accent-coral'
                      : 'bg-bg-elevated text-text-dim border-border-default hover:border-accent-coral hover:text-text-secondary'
                  ]"
                >
                  {{ suggestion.label }}
                </button>
              </div>
            </div>

            <!-- Recurring Contribution -->
            <div class="space-y-2">
              <label class="text-sm text-text-secondary font-display tracking-wide">
                Góp định kỳ (₫)
              </label>
              <input
                v-model.number="recurringContribution"
                type="number"
                min="0"
                step="500000"
                class="w-full bg-bg-elevated border border-border-default px-4 py-3 text-text-primary
                       focus:border-accent-coral focus:outline-none transition-colors
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="1,000,000"
              />
              <!-- Readable display -->
              <p v-if="recurringContribution > 0" class="text-text-dim text-sm">
                ≈ {{ formatInputDisplay(recurringContribution) }}
              </p>
              <!-- Quick suggestions -->
              <div class="flex flex-wrap gap-2 mt-2">
                <button
                  v-for="suggestion in amountSuggestions"
                  :key="suggestion.value"
                  @click="setContributionAmount(suggestion.value)"
                  :class="[
                    'px-2.5 py-1 text-xs font-display transition-all duration-200 border',
                    recurringContribution === suggestion.value
                      ? 'bg-accent-amber/20 text-accent-amber border-accent-amber'
                      : 'bg-bg-elevated text-text-dim border-border-default hover:border-accent-amber hover:text-text-secondary'
                  ]"
                >
                  {{ suggestion.label }}
                </button>
              </div>
            </div>

            <!-- Contribution Frequency -->
            <div class="space-y-2">
              <label class="text-sm text-text-secondary font-display tracking-wide">
                Tần suất góp
              </label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="freq in ['daily', 'weekly', 'monthly', 'yearly'] as const"
                  :key="freq"
                  @click="contributionFrequency = freq"
                  :class="[
                    'px-3 py-2 text-sm font-display transition-all duration-300 border',
                    contributionFrequency === freq
                      ? 'bg-accent-coral text-bg-deep border-accent-coral'
                      : 'bg-bg-elevated text-text-secondary border-border-default hover:border-accent-coral hover:text-text-primary'
                  ]"
                >
                  {{ freq === 'daily' ? 'Ngày' : freq === 'weekly' ? 'Tuần' : freq === 'monthly' ? 'Tháng' : 'Năm' }}
                </button>
              </div>
            </div>

            <!-- Annual Return Slider -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-sm text-text-secondary font-display tracking-wide">
                  Lãi suất năm
                </label>
                <span class="text-accent-coral font-display font-semibold text-lg">
                  {{ annualReturn }}%
                </span>
              </div>
              <input
                v-model.number="annualReturn"
                type="range"
                min="1"
                max="30"
                step="0.5"
                class="w-full h-2 bg-bg-elevated border border-border-default appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:bg-accent-amber [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent-amber
                       [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <p class="text-xs text-text-dim italic">
                * Ví dụ: VN30 trung bình ~10%/năm
              </p>
            </div>

            <!-- Time Horizon Slider -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-sm text-text-secondary font-display tracking-wide">
                  Thời gian đầu tư
                </label>
                <span class="text-accent-sky font-display font-semibold text-lg">
                  {{ timeHorizon }} năm
                </span>
              </div>
              <input
                v-model.number="timeHorizon"
                type="range"
                min="1"
                max="40"
                step="1"
                class="w-full h-2 bg-bg-elevated border border-border-default appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:bg-accent-sky [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent-sky
                       [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb]:hover:scale-110"
              />
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="space-y-6 animate-fade-up animate-delay-2">
          <!-- Big Numbers -->
          <div class="border border-border-default bg-bg-surface p-6 md:p-8">
            <h2 class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Kết quả
            </h2>

            <div class="space-y-5">
              <!-- Total Future Value -->
              <div class="bg-bg-elevated p-5 border-l-4 border-accent-coral">
                <p class="text-xs text-text-dim font-display tracking-widest uppercase mb-1">
                  Giá trị tương lai
                </p>
                <p class="font-display text-3xl md:text-4xl font-bold text-accent-coral">
                  {{ formatCurrency(results.totalFutureValue) }}
                </p>
              </div>

              <!-- Total Invested -->
              <div class="bg-bg-elevated p-5 border-l-4 border-accent-amber">
                <p class="text-xs text-text-dim font-display tracking-widest uppercase mb-1">
                  Tổng vốn góp
                </p>
                <p class="font-display text-2xl md:text-3xl font-semibold text-accent-amber">
                  {{ formatCurrency(results.totalInvested) }}
                </p>
              </div>

              <!-- Total Interest -->
              <div class="bg-bg-elevated p-5 border-l-4 border-accent-sky">
                <p class="text-xs text-text-dim font-display tracking-widest uppercase mb-1">
                  Lãi thu được
                </p>
                <p class="font-display text-2xl md:text-3xl font-semibold text-accent-sky">
                  {{ formatCurrency(results.totalInterest) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Pie Chart -->
          <div class="border border-border-default bg-bg-surface p-6 md:p-8">
            <h3 class="font-display text-lg font-semibold text-text-primary mb-6 flex items-center gap-3">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Phân bổ
            </h3>

            <div class="flex items-center justify-center gap-8">
              <!-- SVG Pie Chart -->
              <svg viewBox="0 0 200 200" class="w-40 h-40 md:w-48 md:h-48">
                <!-- Background circle -->
                <circle cx="100" cy="100" r="90" fill="var(--color-bg-elevated)" />

                <!-- Interest slice -->
                <path
                  v-if="results.interestRatio > 0"
                  :d="describeArc(100, 100, 90, 0, results.interestRatio * 3.6)"
                  fill="var(--color-accent-sky)"
                />

                <!-- Invested slice -->
                <path
                  v-if="results.investedRatio > 0"
                  :d="describeArc(100, 100, 90, results.interestRatio * 3.6, 360)"
                  fill="var(--color-accent-amber)"
                />

                <!-- Center hole for donut effect -->
                <circle cx="100" cy="100" r="50" fill="var(--color-bg-surface)" />
              </svg>

              <!-- Legend -->
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <span class="w-4 h-4 bg-accent-amber"></span>
                  <div>
                    <p class="text-sm text-text-secondary">Vốn góp</p>
                    <p class="font-display font-semibold text-text-primary">
                      {{ results.investedRatio.toFixed(1) }}%
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-4 h-4 bg-accent-sky"></span>
                  <div>
                    <p class="text-sm text-text-secondary">Lãi suất</p>
                    <p class="font-display font-semibold text-text-primary">
                      {{ results.interestRatio.toFixed(1) }}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="mt-6">
              <div class="h-3 bg-bg-elevated overflow-hidden flex">
                <div
                  class="h-full bg-accent-amber transition-all duration-500"
                  :style="{ width: results.investedRatio + '%' }"
                ></div>
                <div
                  class="h-full bg-accent-sky transition-all duration-500"
                  :style="{ width: results.interestRatio + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="mt-12 text-center animate-fade-up animate-delay-3">
        <p class="text-text-dim text-sm italic border border-border-default bg-bg-surface px-6 py-4 inline-block">
          ⚠️ Chỉ mang tính chất tham khảo. Không phải lời khuyên tài chính. Lợi nhuận thực tế có thể khác biệt.
        </p>
      </div>

      <!-- Back Link -->
      <div class="mt-8 text-center animate-fade-up animate-delay-4">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:text-text-primary hover:-translate-y-0.5"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
