<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// --- Types & Configurations ---
type Period = 'before_2026' | 'after_2026'

const REGION_LABELS: Record<number, string> = {
  1: 'Hà Nội, TP.HCM, Hải Phòng, Đồng Nai, Bình Dương, Bà Rịa - Vũng Tàu',
  2: 'Đà Nẵng, Cần Thơ, Nha Trang, Huế, Đà Lạt',
  3: 'Các thị xã, thành phố còn lại thuộc tỉnh',
  4: 'Các khu vực nông thôn và địa phương còn lại',
}

const INSURANCE_RATES = { bhxh: 0.08, bhyt: 0.015, bhtn: 0.01 }

// Cấu hình pháp lý cho từng giai đoạn
const PERIOD_CONFIG = {
  before_2026: {
    label: 'Quy định trước 2026 (2024 - 2025)',
    deductionPersonal: 11000000,
    deductionDependent: 4400000,
    baseSalary: 2340000, // Lương cơ sở dùng để tính trần BHXH, BHYT
    regions: {
      1: { min: 4960000 },
      2: { min: 4410000 },
      3: { min: 3860000 },
      4: { min: 3450000 },
    },
    taxBrackets: [
      [5000000, 0.05],
      [10000000, 0.1],
      [18000000, 0.15],
      [32000000, 0.2],
      [52000000, 0.25],
      [80000000, 0.3],
      [Infinity, 0.35],
    ] as [number, number][],
  },
  after_2026: {
    label: 'Quy định từ 2026',
    deductionPersonal: 15500000,
    deductionDependent: 6200000,
    baseSalary: 2340000, // Mức tham chiếu (dự kiến giữ nguyên lúc chuyển đổi)
    regions: {
      1: { min: 5310000 },
      2: { min: 4730000 },
      3: { min: 4140000 },
      4: { min: 3700000 },
    },
    taxBrackets: [
      [10000000, 0.05],
      [30000000, 0.1],
      [60000000, 0.2],
      [100000000, 0.3],
      [Infinity, 0.35],
    ] as [number, number][],
  },
}

// --- State ---
const period = ref<Period>('after_2026') // Mặc định là quy định mới
const salaryInput = ref('')
const mode = ref<'gross_to_net' | 'net_to_gross'>('gross_to_net')
const regionId = ref<1 | 2 | 3 | 4>(1)
const dependents = ref(0)
const insurancePercent = ref(100)
const showRegionModal = ref(false)
const modalRegion = ref<1 | 2 | 3 | 4>(1)

// --- Helpers ---
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num)
}

function parseInputSalary(val: string): number {
  return parseInt(val.replace(/\D/g, '')) || 0
}

function onSalaryInput() {
  const raw = salaryInput.value.replace(/\D/g, '')
  if (raw === '') {
    salaryInput.value = ''
    return
  }
  salaryInput.value = parseInt(raw).toLocaleString('en-US')
}

function adjustDependents(delta: number) {
  const val = dependents.value + delta
  if (val >= 0) dependents.value = val
}

// --- Calculation logic ---
function calculatePIT(taxableIncome: number, brackets: [number, number][]): number {
  if (taxableIncome <= 0) return 0
  let tax = 0
  let previousLimit = 0
  for (const [limit, rate] of brackets) {
    if (taxableIncome > limit) {
      tax += (limit - previousLimit) * rate
      previousLimit = limit
    } else {
      tax += (taxableIncome - previousLimit) * rate
      return tax
    }
  }
  return tax
}

function calculateDetails(
  grossSalary: number,
  region: 1 | 2 | 3 | 4,
  deps: number,
  insPercent: number,
  p: Period,
) {
  grossSalary = Math.round(grossSalary)
  const config = PERIOD_CONFIG[p]
  const regionInfo = config.regions[region]

  const rawInsSalary = grossSalary * (insPercent / 100)

  // Tách riêng trần bảo hiểm theo luật
  const maxBhxhBhyt = config.baseSalary * 20
  const maxBhtn = regionInfo.min * 20

  const insBaseBhxhBhyt = Math.min(Math.round(rawInsSalary), maxBhxhBhyt)
  const insBaseBhtn = Math.min(Math.round(rawInsSalary), maxBhtn)

  const bhxh = Math.round(insBaseBhxhBhyt * INSURANCE_RATES.bhxh)
  const bhyt = Math.round(insBaseBhxhBhyt * INSURANCE_RATES.bhyt)
  const bhtn = Math.round(insBaseBhtn * INSURANCE_RATES.bhtn)
  const totalInsurance = bhxh + bhyt + bhtn

  const incomeBeforeTax = grossSalary - totalInsurance
  const totalDeduction = config.deductionPersonal + deps * config.deductionDependent
  const taxableIncome = Math.max(0, incomeBeforeTax - totalDeduction)

  const pit = Math.round(calculatePIT(taxableIncome, config.taxBrackets))
  const netSalary = incomeBeforeTax - pit

  return {
    gross: grossSalary,
    net: netSalary,
    bhxh,
    bhyt,
    bhtn,
    totalInsurance,
    incomeBeforeTax,
    deduction: totalDeduction,
    taxableIncome,
    pit,
  }
}

function solveGrossFromNet(
  targetNet: number,
  region: 1 | 2 | 3 | 4,
  deps: number,
  insPercent: number,
  p: Period,
): number {
  targetNet = Math.round(targetNet)
  let low = targetNet
  let high = targetNet * 2

  while (calculateDetails(high, region, deps, insPercent, p).net < targetNet) {
    high *= 2
  }

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    const netMid = calculateDetails(mid, region, deps, insPercent, p).net
    if (netMid < targetNet) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

// --- Computed result ---
const rawSalary = computed(() => parseInputSalary(salaryInput.value))

const result = computed(() => {
  const salary = rawSalary.value
  if (salary <= 0) return null

  if (mode.value === 'net_to_gross') {
    const gross = solveGrossFromNet(
      salary,
      regionId.value,
      dependents.value,
      insurancePercent.value,
      period.value,
    )
    return calculateDetails(
      gross,
      regionId.value,
      dependents.value,
      insurancePercent.value,
      period.value,
    )
  }
  return calculateDetails(
    salary,
    regionId.value,
    dependents.value,
    insurancePercent.value,
    period.value,
  )
})

const insPreview = computed(() => {
  const salary = rawSalary.value
  const raw = salary * (insurancePercent.value / 100)
  const config = PERIOD_CONFIG[period.value]
  const regionInfo = config.regions[regionId.value]
  const cappedBhxhBhyt = Math.min(Math.round(raw), config.baseSalary * 20)
  const cappedBhtn = Math.min(Math.round(raw), regionInfo.min * 20)
  return {
    bhxhBhyt: formatCurrency(cappedBhxhBhyt),
    bhtn: formatCurrency(cappedBhtn),
  }
})

const currentConfig = computed(() => PERIOD_CONFIG[period.value])

// --- Region modal ---
function openRegionModal() {
  modalRegion.value = regionId.value
  showRegionModal.value = true
}

function selectRegion() {
  regionId.value = modalRegion.value
  showRegionModal.value = false
}

// --- Body scroll lock & Escape key ---
watch(showRegionModal, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showRegionModal.value) {
    showRegionModal.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <nav class="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2 animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 sm:px-4 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
    </nav>

    <header
      class="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 animate-fade-up animate-delay-1"
    >
      <h1 class="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-accent-coral">
        Tính Lương Gross &#8596; Net
      </h1>
      <p class="mt-1.5 text-text-secondary text-xs sm:text-sm">
        Chuyển đổi lương Gross - Net chính xác, hỗ trợ chọn vùng và người phụ thuộc
      </p>
    </header>

    <main class="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-8">
      <div class="mb-4 animate-fade-up animate-delay-2">
        <label
          class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
        >
          Giai đoạn áp dụng pháp lý
        </label>
        <div class="relative">
          <select
            v-model="period"
            class="w-full px-4 py-3 bg-bg-surface border border-border-default text-text-primary font-display font-semibold appearance-none focus:outline-none focus:border-accent-coral cursor-pointer transition"
          >
            <option value="before_2026">{{ PERIOD_CONFIG.before_2026.label }}</option>
            <option value="after_2026">{{ PERIOD_CONFIG.after_2026.label }}</option>
          </select>
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
            >&#9662;</span
          >
        </div>
      </div>

      <div
        class="flex gap-1 p-1 border border-border-default bg-bg-surface mb-6 animate-fade-up animate-delay-3"
      >
        <button
          class="flex-1 px-4 py-2.5 text-sm font-display font-semibold transition-all duration-200"
          :class="
            mode === 'gross_to_net'
              ? 'bg-bg-elevated text-accent-coral'
              : 'text-text-dim hover:text-text-secondary'
          "
          @click="mode = 'gross_to_net'"
        >
          GROSS &rarr; NET
        </button>
        <button
          class="flex-1 px-4 py-2.5 text-sm font-display font-semibold transition-all duration-200"
          :class="
            mode === 'net_to_gross'
              ? 'bg-bg-elevated text-accent-coral'
              : 'text-text-dim hover:text-text-secondary'
          "
          @click="mode = 'net_to_gross'"
        >
          NET &rarr; GROSS
        </button>
      </div>

      <div
        class="border border-border-default bg-bg-surface p-4 sm:p-6 mb-4 animate-fade-up animate-delay-4"
      >
        <div class="mb-5">
          <label
            class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
          >
            {{ mode === 'gross_to_net' ? 'Thu nhập Gross' : 'Thu nhập Net mong muốn' }}
          </label>
          <div class="relative">
            <input
              v-model="salaryInput"
              type="text"
              inputmode="numeric"
              class="w-full px-4 pr-12 py-3 sm:py-4 text-xl sm:text-2xl font-bold bg-bg-elevated border border-border-default text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none transition"
              placeholder="Nhập số tiền..."
              @input="onSalaryInput"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim font-semibold"
              >&#8363;</span
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Vùng
            </label>
            <div class="flex items-center gap-2">
              <select
                v-model.number="regionId"
                class="flex-1 px-3 py-3 bg-bg-elevated border border-border-default text-text-primary appearance-none focus:outline-none focus:border-accent-coral cursor-pointer transition"
              >
                <option :value="1">Vùng 1</option>
                <option :value="2">Vùng 2</option>
                <option :value="3">Vùng 3</option>
                <option :value="4">Vùng 4</option>
              </select>
              <button
                class="shrink-0 px-3 py-3 border border-border-default bg-bg-elevated text-accent-sky text-xs font-display font-semibold transition hover:border-accent-coral hover:text-accent-coral"
                @click="openRegionModal"
              >
                ?
              </button>
            </div>
          </div>

          <div>
            <label
              class="block text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
            >
              Phụ thuộc
            </label>
            <div class="flex items-center border border-border-default bg-bg-elevated">
              <button
                class="w-12 py-3 flex items-center justify-center text-text-secondary hover:text-accent-coral transition"
                @click="adjustDependents(-1)"
              >
                -
              </button>
              <input
                :value="dependents"
                type="text"
                readonly
                class="flex-1 text-center font-display font-bold text-lg text-text-primary bg-transparent outline-none"
              />
              <button
                class="w-12 py-3 flex items-center justify-center text-text-secondary hover:text-accent-coral transition"
                @click="adjustDependents(1)"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div class="border border-border-default bg-bg-elevated p-4">
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm font-display font-semibold text-text-secondary">
              Mức đóng bảo hiểm
            </span>
            <span class="text-sm font-display font-bold text-accent-amber">
              {{ insurancePercent }}%
            </span>
          </div>
          <input
            v-model.number="insurancePercent"
            type="range"
            min="0"
            max="100"
            class="w-full slider"
          />
          <div class="mt-3 space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-text-dim">Lương đóng BHXH, BHYT</span>
              <span class="font-display font-semibold text-text-secondary">{{
                insPreview.bhxhBhyt
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-dim">Lương đóng BHTN</span>
              <span class="font-display font-semibold text-text-secondary">{{
                insPreview.bhtn
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="result"
        class="border border-border-default bg-bg-surface overflow-hidden animate-fade-up"
      >
        <div class="bg-bg-elevated border-b border-border-default p-4 sm:p-5">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-accent-sky font-display text-xs tracking-widest">//</span>
            <span class="text-text-dim text-sm font-display">Lương thực nhận (Net)</span>
          </div>
          <h2 class="font-display text-3xl sm:text-4xl font-bold text-accent-coral">
            {{ formatCurrency(result.net) }}
          </h2>
          <div class="flex items-center gap-2 mt-2 text-sm text-text-dim">
            <span>Gross:</span>
            <span class="text-text-primary font-display font-semibold">{{
              formatCurrency(result.gross)
            }}</span>
          </div>
        </div>

        <div class="p-4 sm:p-5 space-y-3">
          <div class="border border-border-default bg-bg-elevated p-3">
            <div class="flex justify-between items-center mb-2">
              <div
                class="flex items-center gap-2 text-text-secondary font-display font-semibold text-sm"
              >
                <span class="text-accent-coral text-xs tracking-widest">//</span>
                Bảo hiểm (10.5%)
              </div>
              <div class="font-display font-bold text-accent-coral">
                -{{ formatCurrency(result.totalInsurance) }}
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="border border-border-default bg-bg-deep p-2 text-center">
                <div class="text-text-dim">BHXH (8%)</div>
                <div class="font-display font-semibold text-accent-coral">
                  -{{ formatNumber(result.bhxh) }}
                </div>
              </div>
              <div class="border border-border-default bg-bg-deep p-2 text-center">
                <div class="text-text-dim">BHYT (1.5%)</div>
                <div class="font-display font-semibold text-accent-coral">
                  -{{ formatNumber(result.bhyt) }}
                </div>
              </div>
              <div class="border border-border-default bg-bg-deep p-2 text-center">
                <div class="text-text-dim">BHTN (1%)</div>
                <div class="font-display font-semibold text-accent-coral">
                  -{{ formatNumber(result.bhtn) }}
                </div>
              </div>
            </div>
          </div>

          <div class="border border-border-default bg-bg-elevated p-3">
            <div class="flex justify-between items-center">
              <div
                class="flex items-center gap-2 text-text-secondary font-display font-semibold text-sm"
              >
                <span class="text-accent-amber text-xs tracking-widest">//</span>
                Thuế TNCN
              </div>
              <div class="font-display font-bold text-accent-amber">
                -{{ formatCurrency(result.pit) }}
              </div>
            </div>
            <div class="mt-2 pt-2 border-t border-border-default flex justify-between text-xs">
              <span class="text-text-dim">Thu nhập chịu thuế</span>
              <span class="font-display font-semibold text-text-secondary">{{
                formatCurrency(result.taxableIncome)
              }}</span>
            </div>
          </div>

          <div
            class="border border-border-default bg-bg-elevated p-3 flex justify-between items-center"
          >
            <div class="flex items-center gap-2">
              <span class="text-accent-sky text-xs font-display tracking-widest">//</span>
              <span class="text-text-secondary font-display font-bold text-sm">Tổng giảm trừ</span>
            </div>
            <div class="font-display font-bold text-accent-sky">
              {{ formatCurrency(result.deduction) }}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-fade-up animate-delay-5">
        <div class="border border-border-default bg-bg-surface p-4">
          <h3
            class="font-display font-semibold text-text-primary text-sm mb-3 flex items-center gap-2"
          >
            <span class="text-accent-sky text-xs tracking-widest">//</span>
            Căn cứ pháp lý
          </h3>

          <ul
            v-if="period === 'before_2026'"
            class="text-xs text-text-secondary space-y-2 list-none"
          >
            <li class="flex gap-2">
              <span class="text-text-dim">&bull;</span>
              <span
                >Lương tối thiểu vùng:
                <a
                  href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-74-2024-ND-CP-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-605282.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-accent-sky hover:underline"
                  >Nghị định 74/2024/NĐ-CP</a
                ></span
              >
            </li>
            <li class="flex gap-2">
              <span class="text-text-dim">&bull;</span>
              <span
                >Mức lương cơ sở:
                <a
                  href="https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-73-2024-ND-CP-muc-luong-co-so-che-do-tien-thuong-doi-voi-can-bo-cong-chuc-vien-chuc-605281.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-accent-sky hover:underline"
                  >Nghị định 73/2024/NĐ-CP</a
                ></span
              >
            </li>
            <li class="flex gap-2">
              <span class="text-text-dim">&bull;</span>
              <span
                >Giảm trừ gia cảnh:
                <a
                  href="https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-quyet-954-2020-UBTVQH14-dieu-chinh-muc-giam-tru-gia-canh-thue-thu-nhap-ca-nhan-444053.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-accent-sky hover:underline"
                  >Nghị quyết 954/2020/UBTVQH14</a
                ></span
              >
            </li>
          </ul>

          <ul v-else class="text-xs text-text-secondary space-y-2 list-none">
            <li class="flex gap-2">
              <span class="text-text-dim">&bull;</span>
              <span
                >Lương tối thiểu vùng:
                <span class="text-accent-coral font-medium">Nghị định 293/2025/NĐ-CP</span></span
              >
            </li>
            <li class="flex gap-2">
              <span class="text-text-dim">&bull;</span>
              <span
                >Luật Bảo hiểm xã hội:
                <a
                  href="https://thuvienphapluat.vn/van-ban/Bao-hiem/Luat-Bao-hiem-xa-hoi-2024-41-2024-QH15-594248.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-accent-sky hover:underline"
                  >Luật số 41/2024/QH15</a
                >
                (Hiệu lực 01/07/2025)</span
              >
            </li>
            <li class="flex gap-2">
              <span class="text-text-dim">&bull;</span>
              <span
                >Thuế TNCN & Giảm trừ:
                <span class="text-accent-coral font-medium"
                  >Luật Thuế TNCN (sửa đổi) 2025</span
                ></span
              >
            </li>
          </ul>
        </div>

        <div class="border border-border-default bg-bg-surface p-4">
          <div class="flex items-start gap-2">
            <span class="text-accent-amber font-display text-xs tracking-widest shrink-0 mt-0.5"
              >//</span
            >
            <div class="text-xs text-text-dim leading-relaxed">
              <p>
                <span class="text-text-secondary font-semibold">Lưu ý:</span>
                Kết quả chỉ mang tính chất tham khảo, được tổng hợp từ các quy định pháp luật hiện
                hành. Chúng tôi không chịu trách nhiệm về tính chính xác tuyệt đối của số liệu. Vui
                lòng đối chiếu với cơ quan thuế hoặc chuyên gia tài chính trước khi sử dụng cho mục
                đích chính thức.
              </p>
              <p class="mt-2 pt-2 border-t border-border-default">
                Nếu phát hiện sai sót, vui lòng
                <a
                  href="https://github.com/J2TEAM/vibe.j2team.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-accent-sky hover:underline font-semibold"
                  >tạo issue trên GitHub</a
                >
                để chúng tôi cập nhật kịp thời.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer
      class="text-center py-4 text-xs text-text-dim font-display tracking-wide animate-fade-up animate-delay-6"
    >
      Made with love by
      <a
        href="https://www.facebook.com/nosiaht"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent-coral font-semibold link-underline"
        >sondt</a
      >
    </footer>

    <Teleport to="body">
      <div v-if="showRegionModal" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/60" @click="showRegionModal = false" />
        <div
          class="absolute bottom-0 sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[500px] bg-bg-surface border-2 border-border-default flex flex-col max-h-[90vh]"
        >
          <div
            class="p-4 border-b border-border-default flex justify-between items-center bg-bg-elevated"
          >
            <h3 class="font-display font-bold text-text-primary flex items-center gap-2">
              <span class="text-accent-sky text-xs tracking-widest">//</span>
              Tra cứu vùng lương ({{ period === 'after_2026' ? 'Từ 2026' : 'Trước 2026' }})
            </h3>
            <button
              class="w-8 h-8 flex items-center justify-center border border-border-default bg-bg-surface text-text-secondary hover:text-text-primary hover:border-accent-coral transition"
              @click="showRegionModal = false"
            >
              &times;
            </button>
          </div>

          <div class="flex p-1 gap-1 bg-bg-elevated border-b border-border-default">
            <button
              v-for="i in 4"
              :key="i"
              class="flex-1 py-2 text-xs font-display font-bold transition-all duration-200"
              :class="
                modalRegion === i
                  ? 'bg-bg-deep text-accent-coral'
                  : 'text-text-dim hover:text-text-secondary'
              "
              @click="modalRegion = i as 1 | 2 | 3 | 4"
            >
              Vùng {{ i }}
            </button>
          </div>

          <div class="p-4 overflow-y-auto flex-1">
            <div>
              <h4
                class="text-xs font-display font-semibold text-text-dim tracking-wider uppercase mb-2"
              >
                Khu vực áp dụng
              </h4>
              <p class="text-text-secondary text-sm leading-relaxed mb-4">
                {{ REGION_LABELS[modalRegion] }}
              </p>

              <div class="space-y-3">
                <div
                  class="border border-border-default bg-bg-elevated p-3 flex justify-between items-center"
                >
                  <div class="text-xs text-text-dim">Lương tối thiểu</div>
                  <p class="text-base font-display font-bold text-text-primary">
                    {{ formatNumber(currentConfig.regions[modalRegion].min) }} &#8363;
                  </p>
                </div>
                <div
                  class="border border-border-default bg-bg-elevated p-3 flex justify-between items-center"
                >
                  <div class="text-xs text-accent-sky">Trần đóng BHXH, BHYT</div>
                  <p class="text-base font-display font-bold text-accent-sky">
                    {{ formatNumber(currentConfig.baseSalary * 20) }} &#8363;
                  </p>
                </div>
                <div
                  class="border border-border-default bg-bg-elevated p-3 flex justify-between items-center"
                >
                  <div class="text-xs text-accent-amber">Trần đóng BHTN</div>
                  <p class="text-base font-display font-bold text-accent-amber">
                    {{ formatNumber(currentConfig.regions[modalRegion].min * 20) }} &#8363;
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-border-default bg-bg-elevated">
            <button
              class="w-full py-3 font-display font-bold text-sm tracking-wider uppercase border border-accent-coral text-accent-coral transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep"
              @click="selectRegion"
            >
              Chọn vùng này
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--color-border-default);
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-accent-amber);
  cursor: pointer;
  border: 2px solid var(--color-bg-deep);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-accent-amber);
  cursor: pointer;
  border: 2px solid var(--color-bg-deep);
  border-radius: 0;
}
</style>
