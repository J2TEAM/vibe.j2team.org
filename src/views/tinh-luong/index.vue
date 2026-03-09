<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

// --- Types & Interfaces ---
interface TaxBracket {
  upTo: number
  rate: number
  label: string
}

interface TaxDetail {
  level: number
  label: string
  amount: number
  rate: number
  tax: number
}

interface PayrollResult {
  gross: number
  bhxh: number
  bhyt: number
  bhtn: number
  totalInsurance: number
  incomeBeforeTax: number
  totalDependentDeduction: number
  taxableIncome: number
  totalTax: number
  taxDetails: TaxDetail[]
  net: number
}

// --- Constants ---
const CONSTANTS = {
  BASE_SALARY: 2340000,
  REGION_MIN_WAGES: {
    1: 4960000,
    2: 4410000,
    3: 3860000,
    4: 3450000,
  } as Record<number, number>,
  REGION_LABELS: {
    1: 'Vùng I (Hà Nội, TP.HCM...)',
    2: 'Vùng II',
    3: 'Vùng III',
    4: 'Vùng IV',
  } as Record<number, string>,
  PERSONAL_DEDUCTION: 11000000,
  DEPENDENT_DEDUCTION: 4400000,
  INSURANCE_RATES: {
    BHXH: 0.08,
    BHYT: 0.015,
    BHTN: 0.01,
  },
  TAX_BRACKETS: [
    { upTo: 5000000, rate: 0.05, label: 'Đến 5 triệu' },
    { upTo: 10000000, rate: 0.10, label: 'Trên 5 triệu đến 10 triệu' },
    { upTo: 18000000, rate: 0.15, label: 'Trên 10 triệu đến 18 triệu' },
    { upTo: 32000000, rate: 0.20, label: 'Trên 18 triệu đến 32 triệu' },
    { upTo: 52000000, rate: 0.25, label: 'Trên 32 triệu đến 52 triệu' },
    { upTo: 80000000, rate: 0.30, label: 'Trên 52 triệu đến 80 triệu' },
    { upTo: Infinity, rate: 0.35, label: 'Trên 80 triệu' },
  ] as TaxBracket[],
}

// --- State ---
const grossInput = ref('20,000,000')
const dependents = ref(0)
const region = ref(1)

// --- Helpers ---
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num)
}

function parseCurrency(str: string): number {
  return parseInt(str.replace(/[^0-9]/g, '')) || 0
}

function onGrossInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/[^0-9]/g, '')
  if (raw === '') {
    grossInput.value = ''
    target.value = ''
    return
  }
  const num = parseInt(raw, 10)
  const formatted = num.toLocaleString('en-US')
  grossInput.value = formatted
  target.value = formatted
}

function adjustDependents(delta: number) {
  const val = dependents.value + delta
  if (val >= 0 && val <= 20) dependents.value = val
}

// --- Calculation Logic ---
const grossNum = computed(() => parseCurrency(grossInput.value))

const result = computed<PayrollResult | null>(() => {
  const gross = grossNum.value
  if (gross <= 0) return null

  // 1. Insurance caps
  const capBHXHYT = CONSTANTS.BASE_SALARY * 20
  const capBHTN = CONSTANTS.REGION_MIN_WAGES[region.value] * 20

  const grossForBHXHYT = Math.min(gross, capBHXHYT)
  const grossForBHTN = Math.min(gross, capBHTN)

  // 2. Insurance amounts
  const bhxh = Math.round(grossForBHXHYT * CONSTANTS.INSURANCE_RATES.BHXH)
  const bhyt = Math.round(grossForBHXHYT * CONSTANTS.INSURANCE_RATES.BHYT)
  const bhtn = Math.round(grossForBHTN * CONSTANTS.INSURANCE_RATES.BHTN)
  const totalInsurance = bhxh + bhyt + bhtn

  // 3. Taxable Income calculation
  const incomeBeforeTax = gross - totalInsurance
  const totalDependentDeduction = dependents.value * CONSTANTS.DEPENDENT_DEDUCTION
  const totalDeduction = CONSTANTS.PERSONAL_DEDUCTION + totalDependentDeduction
  const taxableIncome = Math.max(0, incomeBeforeTax - totalDeduction)

  // 4. Progressive Tax Calculation
  let totalTax = 0
  const taxDetails: TaxDetail[] = []
  let remainingTaxable = taxableIncome
  let previousBracketCap = 0

  if (taxableIncome > 0) {
    for (let i = 0; i < CONSTANTS.TAX_BRACKETS.length; i++) {
      const bracket = CONSTANTS.TAX_BRACKETS[i]
      const bracketMaxAmount = bracket.upTo - previousBracketCap

      let amountInBracket = 0
      if (remainingTaxable > bracketMaxAmount) {
        amountInBracket = bracketMaxAmount
      } else {
        amountInBracket = remainingTaxable
      }

      if (amountInBracket > 0) {
        const taxForBracket = Math.round(amountInBracket * bracket.rate)
        totalTax += taxForBracket
        taxDetails.push({
          level: i + 1,
          label: bracket.label,
          amount: amountInBracket,
          rate: bracket.rate,
          tax: taxForBracket,
        })
      }

      remainingTaxable -= amountInBracket
      previousBracketCap = bracket.upTo

      if (remainingTaxable <= 0) break
    }
  }

  // 5. Net
  const net = gross - totalInsurance - totalTax

  return {
    gross,
    bhxh,
    bhyt,
    bhtn,
    totalInsurance,
    incomeBeforeTax,
    totalDependentDeduction,
    taxableIncome,
    totalTax,
    taxDetails,
    net,
  }
})

// --- Chart Data (for CSS-based bar chart) ---
const chartSegments = computed(() => {
  if (!result.value || result.value.gross <= 0) return []
  const r = result.value
  const total = r.gross
  return [
    {
      label: 'Lương Thực Nhận',
      value: r.net,
      percent: ((r.net / total) * 100).toFixed(1),
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Bảo Hiểm',
      value: r.totalInsurance,
      percent: ((r.totalInsurance / total) * 100).toFixed(1),
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
    },
    {
      label: 'Thuế TNCN',
      value: r.totalTax,
      percent: ((r.totalTax / total) * 100).toFixed(1),
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
    },
  ]
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Nav -->
    <nav class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2 animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
    </nav>

    <!-- Header -->
    <header
      class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 animate-fade-up animate-delay-1"
    >
      <h1 class="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-accent-coral">
        Tính Lương Gross → Net & Thuế TNCN
      </h1>
      <p class="mt-1.5 text-text-secondary text-xs sm:text-sm max-w-2xl">
        Công cụ ước tính thu nhập thực nhận dựa trên các quy định về bảo hiểm và thuế thu nhập cá
        nhân áp dụng dự kiến cho năm 2026 tại Việt Nam.
      </p>
    </header>

    <main class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Column: Inputs -->
        <div class="lg:col-span-4 space-y-4 animate-fade-up animate-delay-2">
          <!-- Income Info Card -->
          <div class="border border-border-default bg-bg-surface p-5">
            <h2
              class="font-display font-semibold text-text-primary text-base mb-4 flex items-center gap-2"
            >
              <span class="text-accent-sky text-xs tracking-widest">//</span>
              Thông Tin Thu Nhập
            </h2>

            <div class="space-y-5">
              <!-- Lương Gross -->
              <div>
                <label
                  for="grossInput"
                  class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
                >
                  Thu nhập Gross (VND) / Tháng
                </label>
                <div class="relative">
                  <span
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-dim text-sm"
                    >💰</span
                  >
                  <input
                    id="grossInput"
                    :value="grossInput"
                    type="text"
                    inputmode="numeric"
                    class="w-full pl-10 pr-14 py-3 text-lg font-bold bg-bg-elevated border border-border-default text-text-primary text-right placeholder-text-dim focus:border-accent-coral focus:outline-none transition"
                    placeholder="Ví dụ: 20,000,000"
                    @input="onGrossInput"
                  />
                  <span
                    class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-dim text-sm"
                    >VNĐ</span
                  >
                </div>
                <p class="mt-1 text-xs text-text-dim">
                  Tổng thu nhập trước khi trừ bảo hiểm và thuế.
                </p>
              </div>

              <!-- Người phụ thuộc -->
              <div>
                <label
                  class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
                >
                  Số người phụ thuộc
                </label>
                <div class="flex items-center border border-border-default bg-bg-elevated">
                  <button
                    class="w-12 py-3 flex items-center justify-center text-text-secondary hover:text-accent-coral transition active:scale-90"
                    @click="adjustDependents(-1)"
                  >
                    −
                  </button>
                  <input
                    :value="dependents"
                    type="text"
                    readonly
                    class="flex-1 text-center font-display font-bold text-lg text-text-primary bg-transparent outline-none"
                  />
                  <button
                    class="w-12 py-3 flex items-center justify-center text-text-secondary hover:text-accent-coral transition active:scale-90"
                    @click="adjustDependents(1)"
                  >
                    +
                  </button>
                </div>
                <p class="mt-1 text-xs text-text-dim">
                  Mức giảm trừ: {{ formatNumber(CONSTANTS.DEPENDENT_DEDUCTION) }} VNĐ/người/tháng.
                </p>
              </div>

              <!-- Vùng lương tối thiểu -->
              <div>
                <label
                  class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
                >
                  Vùng áp dụng
                </label>
                <div class="relative">
                  <select
                    v-model.number="region"
                    class="w-full px-4 py-3 bg-bg-elevated border border-border-default text-text-primary font-display font-semibold appearance-none focus:outline-none focus:border-accent-coral cursor-pointer transition"
                  >
                    <option :value="1">Vùng I (Hà Nội, TP.HCM...)</option>
                    <option :value="2">Vùng II</option>
                    <option :value="3">Vùng III</option>
                    <option :value="4">Vùng IV</option>
                  </select>
                  <span
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
                    >&#9662;</span
                  >
                </div>
                <p class="mt-1 text-xs text-text-dim">
                  Ảnh hưởng đến mức trần đóng Bảo hiểm Thất nghiệp.
                </p>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="border border-border-default bg-bg-elevated p-4">
            <h3
              class="text-xs font-display font-semibold text-accent-sky tracking-wider uppercase mb-3 flex items-center gap-2"
            >
              <span class="text-accent-sky text-xs tracking-widest">//</span>
              Căn cứ pháp lý (Giả định 2026)
            </h3>
            <ul class="text-xs text-text-secondary space-y-2 list-none">
              <li class="flex gap-2">
                <span class="text-text-dim">&bull;</span>
                <span
                  >Lương cơ sở:
                  <span class="font-display font-semibold text-accent-amber">{{
                    formatNumber(CONSTANTS.BASE_SALARY)
                  }}</span>
                  VNĐ</span
                >
              </li>
              <li class="flex gap-2">
                <span class="text-text-dim">&bull;</span>
                <span
                  >Giảm trừ bản thân:
                  <span class="font-display font-semibold text-accent-amber">{{
                    formatNumber(CONSTANTS.PERSONAL_DEDUCTION)
                  }}</span>
                  VNĐ</span
                >
              </li>
              <li class="flex gap-2">
                <span class="text-text-dim">&bull;</span>
                <span>Tỷ lệ đóng BH: BHXH (8%), BHYT (1.5%), BHTN (1%)</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right Column: Results -->
        <div class="lg:col-span-8 space-y-4 animate-fade-up animate-delay-3">
          <!-- Top Result Card -->
          <div
            v-if="result"
            class="border border-border-default bg-bg-surface overflow-hidden"
          >
            <!-- Hero Net Salary -->
            <div class="bg-bg-elevated border-b border-border-default p-5 sm:p-6">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-accent-sky font-display text-xs tracking-widest">//</span>
                    <span class="text-text-dim text-sm font-display uppercase tracking-wider"
                      >Lương Thực Nhận (Net)</span
                    >
                  </div>
                  <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-400">
                    {{ formatCurrency(result.net) }}
                  </h2>
                </div>
                <div class="text-right">
                  <p class="text-sm text-text-dim">Lương Gross ban đầu</p>
                  <p class="text-xl font-display font-semibold text-text-primary">
                    {{ formatCurrency(result.gross) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Income Breakdown -->
            <div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <!-- Visual Chart (CSS Bar) -->
              <div>
                <h3
                  class="text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-4"
                >
                  Phân bổ thu nhập
                </h3>
                <!-- Horizontal bar  -->
                <div class="w-full h-6 flex rounded-sm overflow-hidden mb-4">
                  <div
                    v-for="(seg, i) in chartSegments"
                    :key="i"
                    :class="seg.color"
                    :style="{ width: seg.percent + '%' }"
                    class="transition-all duration-500 ease-out first:rounded-l-sm last:rounded-r-sm"
                  />
                </div>
                <!-- Legend -->
                <div class="space-y-2">
                  <div
                    v-for="(seg, i) in chartSegments"
                    :key="i"
                    class="flex items-center justify-between text-sm"
                  >
                    <div class="flex items-center gap-2">
                      <span :class="seg.color" class="w-3 h-3 rounded-sm inline-block" />
                      <span class="text-text-secondary">{{ seg.label }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span :class="seg.textColor" class="font-display font-semibold text-xs">
                        {{ seg.percent }}%
                      </span>
                      <span class="font-display font-bold text-text-primary text-xs">
                        {{ formatCurrency(seg.value) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Summary Table -->
              <div>
                <h3
                  class="text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-4"
                >
                  Chi tiết các khoản trừ
                </h3>
                <div class="space-y-2 text-sm">
                  <div
                    class="flex justify-between items-center border border-border-default bg-bg-elevated p-2.5"
                  >
                    <span class="text-text-secondary">Bảo hiểm Xã hội (8%)</span>
                    <span class="font-display font-semibold text-accent-coral"
                      >-{{ formatCurrency(result.bhxh) }}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center border border-border-default bg-bg-elevated p-2.5"
                  >
                    <span class="text-text-secondary">Bảo hiểm Y tế (1.5%)</span>
                    <span class="font-display font-semibold text-accent-coral"
                      >-{{ formatCurrency(result.bhyt) }}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center border border-border-default bg-bg-elevated p-2.5"
                  >
                    <span class="text-text-secondary">Bảo hiểm Thất nghiệp (1%)</span>
                    <span class="font-display font-semibold text-accent-coral"
                      >-{{ formatCurrency(result.bhtn) }}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center border-2 border-accent-coral/30 bg-bg-elevated p-2.5"
                  >
                    <span class="font-display font-bold text-text-primary">Tổng bảo hiểm</span>
                    <span class="font-display font-bold text-accent-coral"
                      >-{{ formatCurrency(result.totalInsurance) }}</span
                    >
                  </div>
                  <div
                    class="flex justify-between items-center border border-border-default bg-bg-elevated p-2.5 mt-3!"
                  >
                    <span class="text-text-secondary">Thuế TNCN</span>
                    <span class="font-display font-bold text-accent-amber"
                      >-{{ formatCurrency(result.totalTax) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detailed Breakdown Section -->
          <div
            v-if="result"
            class="border border-border-default bg-bg-surface p-5 sm:p-6 animate-fade-up animate-delay-4"
          >
            <h2
              class="font-display font-semibold text-text-primary text-base mb-4 flex items-center gap-2"
            >
              <span class="text-accent-amber text-xs tracking-widest">//</span>
              Diễn giải chi tiết tính Thuế TNCN
            </h2>

            <div class="overflow-x-auto">
              <table class="min-w-full text-sm text-left text-text-secondary">
                <tbody>
                  <tr class="border-b border-border-default">
                    <td class="py-3 font-display font-semibold text-text-primary w-2/3">
                      Thu nhập chịu thuế (Gross - Bảo hiểm)
                    </td>
                    <td class="py-3 text-right font-display font-bold text-text-primary">
                      {{ formatCurrency(result.incomeBeforeTax) }}
                    </td>
                  </tr>
                  <tr class="border-b border-border-default">
                    <td class="py-3 pl-4 text-text-secondary">(-) Giảm trừ gia cảnh bản thân</td>
                    <td class="py-3 text-right text-emerald-400 font-display font-semibold">
                      - {{ formatCurrency(CONSTANTS.PERSONAL_DEDUCTION) }}
                    </td>
                  </tr>
                  <tr class="border-b border-border-default">
                    <td class="py-3 pl-4 text-text-secondary">
                      (-) Giảm trừ người phụ thuộc
                      <span
                        class="text-xs bg-bg-elevated border border-border-default px-2 py-0.5 font-display font-semibold"
                      >
                        ({{ dependents }} người)
                      </span>
                    </td>
                    <td class="py-3 text-right text-emerald-400 font-display font-semibold">
                      - {{ formatCurrency(result.totalDependentDeduction) }}
                    </td>
                  </tr>
                  <tr class="bg-bg-elevated font-display font-bold text-text-primary border-b border-border-default">
                    <td class="py-3 px-2">Thu nhập tính thuế</td>
                    <td class="py-3 px-2 text-right text-accent-amber">
                      {{ formatCurrency(result.taxableIncome) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Progressive Tax Brackets -->
            <div
              v-if="result.totalTax > 0"
              class="mt-6"
            >
              <h3
                class="text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-3"
              >
                Chi tiết thuế theo bậc lũy tiến:
              </h3>
              <div class="overflow-x-auto border border-border-default">
                <table class="min-w-full text-xs text-left">
                  <thead class="bg-bg-elevated text-text-dim">
                    <tr>
                      <th class="py-2.5 px-3 font-display font-semibold">Bậc</th>
                      <th class="py-2.5 px-3 font-display font-semibold">Phần thu nhập (VNĐ)</th>
                      <th class="py-2.5 px-3 font-display font-semibold text-center">Thuế suất</th>
                      <th class="py-2.5 px-3 font-display font-semibold text-right">
                        Tiền thuế (VNĐ)
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-default text-text-secondary">
                    <tr
                      v-for="detail in result.taxDetails"
                      :key="detail.level"
                    >
                      <td class="py-2.5 px-3 text-center font-display font-bold text-accent-sky">
                        {{ detail.level }}
                      </td>
                      <td class="py-2.5 px-3">{{ formatCurrency(detail.amount) }}</td>
                      <td class="py-2.5 px-3 text-center font-display font-semibold text-accent-amber">
                        {{ (detail.rate * 100) }}%
                      </td>
                      <td class="py-2.5 px-3 text-right font-display font-bold text-accent-coral">
                        {{ formatCurrency(detail.tax) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-bg-elevated font-display font-bold text-text-primary">
                    <tr>
                      <td
                        colspan="3"
                        class="py-3 px-3 text-right"
                      >
                        Tổng thuế TNCN:
                      </td>
                      <td class="py-3 px-3 text-right text-accent-coral">
                        {{ formatCurrency(result.totalTax) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- No Tax Message -->
            <div
              v-else
              class="mt-4 p-4 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm text-center font-display font-semibold"
            >
              Thu nhập của bạn chưa đến mức phải đóng thuế TNCN. 🎉
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="!result"
            class="border border-border-default bg-bg-surface p-8 text-center animate-fade-up animate-delay-3"
          >
            <div class="text-4xl mb-4">💸</div>
            <p class="font-display font-semibold text-text-secondary text-lg mb-2">
              Nhập lương Gross để xem kết quả
            </p>
            <p class="text-text-dim text-sm">
              Nhập mức lương Gross hàng tháng vào ô bên trái để xem chi tiết các khoản trừ và lương
              thực nhận.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="text-center py-4 text-xs text-text-dim font-display tracking-wide animate-fade-up animate-delay-6"
    >
      Made with ❤️ by
      <a
        href="https://www.facebook.com/NVC.9999"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent-coral font-semibold link-underline"
        >TechSpherex AI</a
      >
    </footer>
  </div>
</template>
