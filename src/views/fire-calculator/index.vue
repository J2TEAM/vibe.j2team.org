<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

// --- Inputs ---
const currentAge = ref(25)
const retirementAge = ref(60)
const monthlyIncome = ref(20) // triệu VND
const monthlyExpenses = ref(12) // triệu VND
const currentSavings = ref(100) // triệu VND
const annualReturn = ref(7) // %
const withdrawalRate = ref(4) // %

// --- Lean / Fat FIRE ---
type FireTier = 'lean' | 'normal' | 'fat'
const fireTier = ref<FireTier | null>(null)
const tierMultiplier: Record<FireTier, number> = { lean: 0.7, normal: 1, fat: 1.4 }
const tierLabels: { id: FireTier; label: string }[] = [
  { id: 'lean', label: 'Lean (-30%)' },
  { id: 'normal', label: 'Hiện tại' },
  { id: 'fat', label: 'Fat (+40%)' },
]

function selectTier(tier: FireTier) {
  fireTier.value = tier
}

function onExpenseInput() {
  fireTier.value = null
}

// --- Core calculations ---
const adjustedExpenses = computed(() =>
  fireTier.value !== null
    ? monthlyExpenses.value * tierMultiplier[fireTier.value]
    : monthlyExpenses.value,
)
const monthlySavings = computed(() => monthlyIncome.value - adjustedExpenses.value)
const annualExpenses = computed(() => adjustedExpenses.value * 12)
const fireNumber = computed(() =>
  withdrawalRate.value > 0 ? (annualExpenses.value * 100) / withdrawalRate.value : 0,
)

function calcYears(saving: number, target: number, current: number, ratePercent: number) {
  const monthlyRate = ratePercent / 100 / 12
  if (current >= target) return 0
  if (saving <= 0) return Infinity
  if (monthlyRate === 0) return (target - current) / saving / 12
  let balance = current
  for (let month = 1; month <= 600; month++) {
    balance = balance * (1 + monthlyRate) + saving
    if (balance >= target) return month / 12
  }
  return Infinity
}

const yearsToFire = computed(() =>
  calcYears(monthlySavings.value, fireNumber.value, currentSavings.value, annualReturn.value),
)

const fireAge = computed(() =>
  yearsToFire.value !== Infinity ? Math.floor(currentAge.value + yearsToFire.value) : null,
)

const savingsRate = computed(() =>
  monthlyIncome.value > 0 ? Math.round((monthlySavings.value / monthlyIncome.value) * 100) : 0,
)

// --- Coast FIRE ---
// How much you need saved TODAY so compound growth alone hits FIRE number by retirementAge
const coastFireNumber = computed(() => {
  const years = retirementAge.value - currentAge.value
  if (years <= 0 || annualReturn.value <= 0) return fireNumber.value
  return fireNumber.value / Math.pow(1 + annualReturn.value / 100, years)
})

const isCoasting = computed(() => currentSavings.value >= coastFireNumber.value)

const yearsToCoast = computed(() =>
  calcYears(monthlySavings.value, coastFireNumber.value, currentSavings.value, annualReturn.value),
)

const coastAge = computed(() =>
  yearsToCoast.value !== Infinity ? Math.floor(currentAge.value + yearsToCoast.value) : null,
)

// --- Savings rate sensitivity table ---
const sensitivityRates = [10, 20, 30, 40, 50, 60, 70]
const sensitivityRows = computed(() =>
  sensitivityRates.map((rate) => {
    const saving = (monthlyIncome.value * rate) / 100
    const years = calcYears(saving, fireNumber.value, currentSavings.value, annualReturn.value)
    return { rate, saving, years }
  }),
)

// --- Chart: balance per year ---
const chartPoints = computed(() => {
  if (monthlySavings.value <= 0 && currentSavings.value < fireNumber.value) return []
  const monthlyRate = annualReturn.value / 100 / 12
  const maxYears = Math.min(
    yearsToFire.value === Infinity ? 50 : Math.ceil(yearsToFire.value) + 5,
    50,
  )
  const points: { year: number; balance: number }[] = []
  let balance = currentSavings.value
  for (let year = 0; year <= maxYears; year++) {
    points.push({ year, balance: Math.round(balance) })
    for (let m = 0; m < 12; m++) balance = balance * (1 + monthlyRate) + monthlySavings.value
  }
  return points
})

const chartMax = computed(() =>
  Math.max(fireNumber.value * 1.1, ...chartPoints.value.map((p) => p.balance)),
)

function barHeight(balance: number) {
  return chartMax.value > 0 ? Math.min((balance / chartMax.value) * 100, 100) : 0
}

// --- Formatting ---
function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + ' tỷ'
  return n.toFixed(0) + ' tr'
}

function fmtYears(y: number) {
  if (y === Infinity || y > 100) return '> 50 năm'
  if (y === 0) return 'Đã đạt!'
  const yrs = Math.floor(y)
  const mos = Math.round((y - yrs) * 12)
  if (mos === 0) return `${yrs} năm`
  if (yrs === 0) return `${mos} tháng`
  return `${yrs} năm ${mos} tháng`
}

const withdrawalRateOptions = [3, 3.5, 4, 4.5, 5]
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body finance-bg">
    <div class="max-w-2xl mx-auto px-4 py-12">
      <!-- Back -->
      <div class="mb-6 text-center pb-6 border-b border-border-default">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 text-text-dim text-sm hover:text-text-primary transition"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>
      </div>

      <!-- Header -->
      <header class="mb-10 text-center">
        <p class="text-text-dim text-xs tracking-widest mb-2 font-mono">// FINANCE</p>
        <h1 class="font-display text-4xl sm:text-5xl font-bold text-accent-coral mb-3">
          FIRE Calculator
        </h1>
        <p class="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
          Tính số năm đến
          <span class="text-accent-amber font-semibold">tự do tài chính</span>
          theo phương pháp FIRE — Financial Independence, Retire Early.
        </p>
      </header>

      <!-- Inputs -->
      <section class="border border-border-default bg-bg-surface p-6 mb-6">
        <h2 class="font-display text-lg font-semibold mb-5 flex items-center gap-2">
          <Icon icon="lucide:sliders-horizontal" class="size-4 text-accent-coral" />
          Thông tin của bạn
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-text-dim text-xs mb-1.5">Tuổi hiện tại</label>
            <div class="flex items-center border border-border-default bg-bg-elevated">
              <input
                v-model.number="currentAge"
                type="number"
                min="15"
                max="70"
                class="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
              <span class="px-3 text-text-dim text-xs border-l border-border-default">tuổi</span>
            </div>
          </div>

          <div>
            <label class="block text-text-dim text-xs mb-1.5">Tuổi nghỉ hưu mục tiêu</label>
            <div class="flex items-center border border-border-default bg-bg-elevated">
              <input
                v-model.number="retirementAge"
                type="number"
                min="30"
                max="80"
                class="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
              <span class="px-3 text-text-dim text-xs border-l border-border-default">tuổi</span>
            </div>
          </div>

          <div>
            <label class="block text-text-dim text-xs mb-1.5">Tiết kiệm hiện có</label>
            <div class="flex items-center border border-border-default bg-bg-elevated">
              <input
                v-model.number="currentSavings"
                type="number"
                min="0"
                class="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
              <span class="px-3 text-text-dim text-xs border-l border-border-default">triệu ₫</span>
            </div>
          </div>

          <div>
            <label class="block text-text-dim text-xs mb-1.5">Thu nhập hàng tháng</label>
            <div class="flex items-center border border-border-default bg-bg-elevated">
              <input
                v-model.number="monthlyIncome"
                type="number"
                min="0"
                class="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
              <span class="px-3 text-text-dim text-xs border-l border-border-default">triệu ₫</span>
            </div>
          </div>

          <div>
            <label class="block text-text-dim text-xs mb-1.5">Chi tiêu hàng tháng</label>
            <div
              class="flex items-center border bg-bg-elevated mb-2 transition-opacity"
              :class="
                fireTier !== null ? 'opacity-40 border-border-default' : 'border-border-default'
              "
            >
              <input
                v-model.number="monthlyExpenses"
                type="number"
                min="0"
                class="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary focus:outline-none"
                @input="onExpenseInput"
                @focus="onExpenseInput"
              />
              <span class="px-3 text-text-dim text-xs border-l border-border-default">triệu ₫</span>
            </div>
            <div class="flex gap-1.5">
              <button
                v-for="tier in tierLabels"
                :key="tier.id"
                class="flex-1 border py-1.5 text-[11px] transition text-center"
                :class="
                  fireTier === tier.id
                    ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                    : 'border-border-default text-text-dim hover:border-accent-amber/50'
                "
                @click="selectTier(tier.id)"
              >
                {{ tier.label }}
              </button>
            </div>
            <p class="text-text-dim text-[11px] mt-1.5">
              <template v-if="fireTier !== null">
                Chi tiêu điều chỉnh:
                <span class="text-accent-amber font-mono"
                  >{{ adjustedExpenses.toFixed(1) }} tr/tháng</span
                >
              </template>
              <template v-else>
                <span class="text-text-dim">Hoặc chọn preset bên trên</span>
              </template>
            </p>
          </div>

          <div>
            <label class="block text-text-dim text-xs mb-1.5">Lãi suất đầu tư / năm</label>
            <div class="flex items-center border border-border-default bg-bg-elevated">
              <input
                v-model.number="annualReturn"
                type="number"
                min="0"
                max="30"
                step="0.5"
                class="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
              <span class="px-3 text-text-dim text-xs border-l border-border-default">%/năm</span>
            </div>
            <p class="text-text-dim text-[11px] mt-1.5 italic">VN30 ETF ~12%, gửi tiết kiệm ~5%</p>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-text-dim text-xs mb-1.5">Tỷ lệ rút hàng năm</label>
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="r in withdrawalRateOptions"
                :key="r"
                class="border px-2.5 py-1.5 text-xs font-mono transition"
                :class="
                  withdrawalRate === r
                    ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                    : 'border-border-default text-text-dim hover:border-accent-amber'
                "
                @click="withdrawalRate = r"
              >
                {{ r }}%
              </button>
            </div>
            <p class="text-text-dim text-[11px] mt-1.5">
              4% = quy tắc phổ biến nhất · 3–3.5% an toàn hơn cho VN
            </p>
          </div>
        </div>
      </section>

      <!-- Warning -->
      <div
        v-if="monthlySavings <= 0"
        class="border border-red-500/40 bg-red-500/10 px-4 py-3 mb-6 flex items-start gap-3 text-sm text-red-400"
      >
        <Icon icon="lucide:triangle-alert" class="size-4 mt-0.5 shrink-0" />
        <span>Chi tiêu đang lớn hơn hoặc bằng thu nhập — bạn chưa tích lũy được gì thêm.</span>
      </div>

      <!-- Results -->
      <section class="border border-border-default bg-bg-surface p-6 mb-6">
        <h2 class="font-display text-lg font-semibold mb-5 flex items-center gap-2">
          <Icon icon="lucide:target" class="size-4 text-accent-coral" />
          Kết quả FIRE
        </h2>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="border border-border-default bg-bg-elevated p-4 col-span-2 sm:col-span-1">
            <p class="text-text-dim text-xs mb-1">FIRE number</p>
            <p class="font-display text-2xl font-bold text-accent-coral">{{ fmt(fireNumber) }}</p>
            <p class="text-text-dim text-[11px] mt-1">
              = chi tiêu năm × {{ (100 / withdrawalRate).toFixed(0) }}
            </p>
          </div>

          <div class="border border-border-default bg-bg-elevated p-4 col-span-2 sm:col-span-1">
            <p class="text-text-dim text-xs mb-1">Tiết kiệm mỗi tháng</p>
            <p
              class="font-display text-2xl font-bold"
              :class="monthlySavings > 0 ? 'text-accent-sky' : 'text-red-400'"
            >
              {{ monthlySavings > 0 ? '+' : '' }}{{ fmt(monthlySavings) }}
            </p>
            <p class="text-text-dim text-[11px] mt-1">Tỷ lệ tiết kiệm: {{ savingsRate }}%</p>
          </div>

          <div class="border border-border-default bg-bg-elevated p-4 col-span-2 sm:col-span-1">
            <p class="text-text-dim text-xs mb-1">Thời gian đến FIRE</p>
            <p class="font-display text-2xl font-bold text-accent-amber">
              {{ fmtYears(yearsToFire) }}
            </p>
          </div>

          <div class="border border-border-default bg-bg-elevated p-4 col-span-2 sm:col-span-1">
            <p class="text-text-dim text-xs mb-1">Tuổi khi đạt FIRE</p>
            <p class="font-display text-2xl font-bold text-accent-coral">
              {{ fireAge !== null ? fireAge + ' tuổi' : '—' }}
            </p>
          </div>
        </div>

        <!-- Progress bar -->
        <div v-if="fireNumber > 0">
          <div class="flex justify-between text-xs text-text-dim mb-1.5">
            <span>Tiến độ hiện tại</span>
            <span>{{ Math.min(Math.round((currentSavings / fireNumber) * 100), 100) }}%</span>
          </div>
          <div class="h-2 bg-bg-elevated border border-border-default overflow-hidden">
            <div
              class="h-full bg-accent-coral transition-all duration-500"
              :style="{ width: Math.min((currentSavings / fireNumber) * 100, 100) + '%' }"
            />
          </div>
          <div class="flex justify-between text-[11px] text-text-dim mt-1">
            <span>{{ fmt(currentSavings) }}</span>
            <span>{{ fmt(fireNumber) }}</span>
          </div>
        </div>
      </section>

      <!-- Coast FIRE -->
      <section class="border border-border-default bg-bg-surface p-6 mb-6">
        <h2 class="font-display text-lg font-semibold mb-1 flex items-center gap-2">
          <Icon icon="lucide:sailboat" class="size-4 text-accent-sky" />
          Coast FIRE
        </h2>
        <p class="text-text-dim text-xs mb-5 leading-relaxed">
          Số tiền cần có <em>ngay hôm nay</em> để chỉ cần để yên — không cần tiết kiệm thêm — và lãi
          kép sẽ tự đưa bạn đến FIRE number vào tuổi {{ retirementAge }}.
        </p>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="border border-border-default bg-bg-elevated p-4 col-span-2 sm:col-span-1">
            <p class="text-text-dim text-xs mb-1">Coast FIRE number</p>
            <p class="font-display text-2xl font-bold text-accent-sky">
              {{ fmt(coastFireNumber) }}
            </p>
            <p class="text-text-dim text-[11px] mt-1">tại tuổi {{ retirementAge }}</p>
          </div>

          <div
            class="border p-4 col-span-2 sm:col-span-1"
            :class="
              isCoasting
                ? 'border-green-500/40 bg-green-500/10'
                : 'border-border-default bg-bg-elevated'
            "
          >
            <p class="text-text-dim text-xs mb-1">Trạng thái</p>
            <p
              class="font-display text-lg font-bold"
              :class="isCoasting ? 'text-green-400' : 'text-accent-amber'"
            >
              {{ isCoasting ? '🏄 Đang coasting!' : fmtYears(yearsToCoast) + ' nữa' }}
            </p>
            <p class="text-text-dim text-[11px] mt-1">
              {{
                isCoasting
                  ? 'Bạn có thể dừng tiết kiệm rồi!'
                  : coastAge !== null
                    ? 'Đạt Coast lúc ' + coastAge + ' tuổi'
                    : '—'
              }}
            </p>
          </div>
        </div>

        <!-- Coast progress bar -->
        <div v-if="coastFireNumber > 0">
          <div class="flex justify-between text-xs text-text-dim mb-1.5">
            <span>Tiến độ Coast FIRE</span>
            <span>{{ Math.min(Math.round((currentSavings / coastFireNumber) * 100), 100) }}%</span>
          </div>
          <div class="h-2 bg-bg-elevated border border-border-default overflow-hidden">
            <div
              class="h-full bg-accent-sky transition-all duration-500"
              :style="{ width: Math.min((currentSavings / coastFireNumber) * 100, 100) + '%' }"
            />
          </div>
          <div class="flex justify-between text-[11px] text-text-dim mt-1">
            <span>{{ fmt(currentSavings) }}</span>
            <span>{{ fmt(coastFireNumber) }}</span>
          </div>
        </div>
      </section>

      <!-- Chart -->
      <section
        v-if="chartPoints.length > 1"
        class="border border-border-default bg-bg-surface p-6 mb-6"
      >
        <h2 class="font-display text-lg font-semibold mb-5 flex items-center gap-2">
          <Icon icon="lucide:trending-up" class="size-4 text-accent-coral" />
          Biểu đồ tăng trưởng
        </h2>

        <div class="flex items-end gap-px h-36 mb-2">
          <div
            v-for="(point, i) in chartPoints"
            :key="i"
            class="relative flex-1 min-w-0 h-full group"
          >
            <div
              class="absolute bottom-0 w-full transition-all"
              :class="point.balance >= fireNumber ? 'bg-accent-coral/70' : 'bg-accent-sky/50'"
              :style="{ height: barHeight(point.balance) + '%' }"
            />
            <div
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none"
            >
              <div
                class="bg-bg-elevated border border-border-default px-2 py-1 text-[10px] text-text-secondary whitespace-nowrap"
              >
                Năm {{ point.year }}: {{ fmt(point.balance) }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 text-[11px] text-text-dim mb-1">
          <span class="inline-block w-3 h-2 bg-accent-sky/50 shrink-0" />
          <span>Chưa đạt FIRE</span>
          <span class="inline-block w-3 h-2 bg-accent-coral/70 shrink-0 ml-2" />
          <span>Đã vượt FIRE number ({{ fmt(fireNumber) }})</span>
        </div>
        <div class="flex justify-between text-[11px] text-text-dim font-mono mt-2">
          <span>Năm 0</span>
          <span>Năm {{ chartPoints[chartPoints.length - 1]?.year }}</span>
        </div>
      </section>

      <!-- Sensitivity table -->
      <section class="border border-border-default bg-bg-surface p-6 mb-6">
        <h2 class="font-display text-lg font-semibold mb-2 flex items-center gap-2">
          <Icon icon="lucide:table-2" class="size-4 text-accent-amber" />
          Tỷ lệ tiết kiệm ảnh hưởng thế nào?
        </h2>
        <p class="text-text-dim text-xs mb-5">
          Nếu thu nhập {{ fmt(monthlyIncome) }} tr/tháng, mỗi mức tiết kiệm mất bao lâu để FIRE?
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-border-default">
                <th class="text-left text-text-dim text-xs font-normal py-2 pr-4">Tỷ lệ TK</th>
                <th class="text-right text-text-dim text-xs font-normal py-2 px-4">
                  Tiết kiệm/tháng
                </th>
                <th class="text-right text-text-dim text-xs font-normal py-2 pl-4">
                  Thời gian đến FIRE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in sensitivityRows"
                :key="row.rate"
                class="border-b border-border-default/50 transition"
                :class="
                  Math.abs(row.rate - savingsRate) < 5
                    ? 'bg-accent-amber/5'
                    : 'hover:bg-bg-elevated/50'
                "
              >
                <td class="py-2.5 pr-4">
                  <span
                    class="font-mono text-sm"
                    :class="
                      Math.abs(row.rate - savingsRate) < 5
                        ? 'text-accent-amber font-semibold'
                        : 'text-text-secondary'
                    "
                  >
                    {{ row.rate }}%
                  </span>
                  <span
                    v-if="Math.abs(row.rate - savingsRate) < 5"
                    class="ml-1.5 text-[10px] text-accent-amber"
                    >← bạn</span
                  >
                </td>
                <td class="text-right text-text-dim font-mono text-xs py-2.5 px-4">
                  {{ fmt(row.saving) }}
                </td>
                <td
                  class="text-right font-mono text-xs py-2.5 pl-4"
                  :class="row.years === Infinity ? 'text-red-400' : 'text-text-primary'"
                >
                  {{ fmtYears(row.years) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Disclaimer -->
      <div
        class="border border-border-default bg-bg-surface px-4 py-3 mb-8 text-xs text-text-dim leading-relaxed"
      >
        <Icon icon="lucide:info" class="inline size-3 -mt-0.5 mr-1" />
        Ước tính dựa trên lãi suất cố định và chi tiêu không đổi. Thực tế có thể khác do lạm phát,
        biến động thị trường, và thay đổi lối sống. Quy tắc 4% được nghiên cứu tại Mỹ — với Việt
        Nam, tỷ lệ 3–3.5% được khuyến nghị để an toàn hơn.
      </div>
    </div>
  </div>
</template>

<style scoped>
.finance-bg {
  position: relative;
}
.finance-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cstyle%3Etext%7Bfont-family:Courier New,monospace;fill:%23ffffff;opacity:0.07%7D%3C/style%3E%3Ctext x='10' y='20' font-size='13' transform='rotate(-8,10,20)'%3E%25%3C/text%3E%3Ctext x='50' y='15' font-size='14' transform='rotate(6,50,15)'%3E%E2%82%AB%3C/text%3E%3Ctext x='92' y='24' font-size='11' transform='rotate(-15,92,24)'%3E%E2%86%91%3C/text%3E%3Ctext x='135' y='16' font-size='13' transform='rotate(10,135,16)'%3E4%25%3C/text%3E%3Ctext x='182' y='22' font-size='10' transform='rotate(-5,182,22)'%3EFIRE%3C/text%3E%3Ctext x='228' y='18' font-size='14' transform='rotate(14,228,18)'%3E%24%3C/text%3E%3Ctext x='268' y='26' font-size='12' transform='rotate(-12,268,26)'%3E%E2%86%93%3C/text%3E%3Ctext x='310' y='14' font-size='13' transform='rotate(8,310,14)'%3E%E2%82%AC%3C/text%3E%3Ctext x='355' y='22' font-size='11' transform='rotate(-18,355,22)'%3E%25%3C/text%3E%3Ctext x='390' y='16' font-size='14' transform='rotate(5,390,16)'%3E%E2%82%AB%3C/text%3E%3Ctext x='25' y='58' font-size='12' transform='rotate(16,25,58)'%3EFAT%3C/text%3E%3Ctext x='70' y='64' font-size='10' transform='rotate(-20,70,64)'%3ELEAN%3C/text%3E%3Ctext x='118' y='52' font-size='14' transform='rotate(4,118,52)'%3E%E2%86%91%3C/text%3E%3Ctext x='162' y='60' font-size='11' transform='rotate(-10,162,60)'%3E7%25%3C/text%3E%3Ctext x='205' y='56' font-size='13' transform='rotate(18,205,56)'%3E%24%3C/text%3E%3Ctext x='248' y='66' font-size='10' transform='rotate(-7,248,66)'%3EFIRE%3C/text%3E%3Ctext x='292' y='54' font-size='14' transform='rotate(12,292,54)'%3E%25%3C/text%3E%3Ctext x='336' y='62' font-size='12' transform='rotate(-16,336,62)'%3E%E2%82%AB%3C/text%3E%3Ctext x='378' y='50' font-size='11' transform='rotate(9,378,50)'%3E%E2%86%91%3C/text%3E%3Ctext x='15' y='96' font-size='13' transform='rotate(-6,15,96)'%3E%E2%82%AC%3C/text%3E%3Ctext x='58' y='104' font-size='11' transform='rotate(22,58,104)'%3E25x%3C/text%3E%3Ctext x='102' y='90' font-size='14' transform='rotate(-14,102,90)'%3E%E2%86%93%3C/text%3E%3Ctext x='148' y='98' font-size='10' transform='rotate(7,148,98)'%3ECOAST%3C/text%3E%3Ctext x='195' y='88' font-size='13' transform='rotate(-19,195,88)'%3E%25%3C/text%3E%3Ctext x='238' y='100' font-size='12' transform='rotate(11,238,100)'%3E%E2%82%AB%3C/text%3E%3Ctext x='282' y='92' font-size='14' transform='rotate(-5,282,92)'%3E%E2%86%91%3C/text%3E%3Ctext x='325' y='102' font-size='11' transform='rotate(15,325,102)'%3E4%25%3C/text%3E%3Ctext x='370' y='96' font-size='13' transform='rotate(-9,370,96)'%3E%24%3C/text%3E%3Ctext x='35' y='138' font-size='10' transform='rotate(5,35,138)'%3EFIRE%3C/text%3E%3Ctext x='80' y='144' font-size='14' transform='rotate(-18,80,144)'%3E%25%3C/text%3E%3Ctext x='122' y='132' font-size='12' transform='rotate(13,122,132)'%3E%E2%82%AB%3C/text%3E%3Ctext x='165' y='140' font-size='11' transform='rotate(-4,165,140)'%3E%E2%86%91%3C/text%3E%3Ctext x='208' y='130' font-size='13' transform='rotate(20,208,130)'%3E7%25%3C/text%3E%3Ctext x='252' y='142' font-size='10' transform='rotate(-13,252,142)'%3EFAT%3C/text%3E%3Ctext x='295' y='134' font-size='14' transform='rotate(8,295,134)'%3E%E2%82%AC%3C/text%3E%3Ctext x='340' y='146' font-size='12' transform='rotate(-21,340,146)'%3E%E2%86%93%3C/text%3E%3Ctext x='382' y='132' font-size='11' transform='rotate(6,382,132)'%3E%25%3C/text%3E%3Ctext x='20' y='178' font-size='14' transform='rotate(-11,20,178)'%3E%E2%82%AB%3C/text%3E%3Ctext x='62' y='184' font-size='10' transform='rotate(17,62,184)'%3E25x%3C/text%3E%3Ctext x='108' y='172' font-size='13' transform='rotate(-7,108,172)'%3E%E2%86%91%3C/text%3E%3Ctext x='152' y='180' font-size='11' transform='rotate(14,152,180)'%3ELEAN%3C/text%3E%3Ctext x='196' y='170' font-size='14' transform='rotate(-19,196,170)'%3E%24%3C/text%3E%3Ctext x='240' y='182' font-size='12' transform='rotate(9,240,182)'%3E%25%3C/text%3E%3Ctext x='285' y='174' font-size='10' transform='rotate(-15,285,174)'%3EFIRE%3C/text%3E%3Ctext x='328' y='186' font-size='13' transform='rotate(4,328,186)'%3E%E2%82%AB%3C/text%3E%3Ctext x='372' y='176' font-size='14' transform='rotate(-10,372,176)'%3E%E2%86%91%3C/text%3E%3Ctext x='42' y='218' font-size='11' transform='rotate(21,42,218)'%3E%E2%82%AC%3C/text%3E%3Ctext x='85' y='224' font-size='13' transform='rotate(-6,85,224)'%3E4%25%3C/text%3E%3Ctext x='130' y='212' font-size='14' transform='rotate(12,130,212)'%3E%E2%86%93%3C/text%3E%3Ctext x='175' y='220' font-size='10' transform='rotate(-17,175,220)'%3ECOAST%3C/text%3E%3Ctext x='220' y='210' font-size='12' transform='rotate(7,220,210)'%3E%25%3C/text%3E%3Ctext x='262' y='222' font-size='11' transform='rotate(-22,262,222)'%3E%E2%82%AB%3C/text%3E%3Ctext x='305' y='214' font-size='14' transform='rotate(16,305,214)'%3E%E2%86%91%3C/text%3E%3Ctext x='350' y='226' font-size='13' transform='rotate(-8,350,226)'%3E%24%3C/text%3E%3Ctext x='392' y='212' font-size='10' transform='rotate(11,392,212)'%3EFIRE%3C/text%3E%3Ctext x='18' y='258' font-size='12' transform='rotate(-14,18,258)'%3E%25%3C/text%3E%3Ctext x='62' y='264' font-size='14' transform='rotate(5,62,264)'%3E%E2%82%AB%3C/text%3E%3Ctext x='108' y='252' font-size='11' transform='rotate(-20,108,252)'%3EFAT%3C/text%3E%3Ctext x='150' y='260' font-size='13' transform='rotate(18,150,260)'%3E%E2%86%91%3C/text%3E%3Ctext x='195' y='250' font-size='10' transform='rotate(-3,195,250)'%3E7%25%3C/text%3E%3Ctext x='238' y='262' font-size='14' transform='rotate(13,238,262)'%3E%E2%82%AC%3C/text%3E%3Ctext x='282' y='254' font-size='12' transform='rotate(-9,282,254)'%3E%25%3C/text%3E%3Ctext x='326' y='266' font-size='11' transform='rotate(19,326,266)'%3E%E2%86%93%3C/text%3E%3Ctext x='370' y='256' font-size='13' transform='rotate(-15,370,256)'%3E%E2%82%AB%3C/text%3E%3Ctext x='30' y='298' font-size='14' transform='rotate(8,30,298)'%3E25x%3C/text%3E%3Ctext x='75' y='304' font-size='10' transform='rotate(-12,75,304)'%3EFIRE%3C/text%3E%3Ctext x='118' y='292' font-size='13' transform='rotate(22,118,292)'%3E%25%3C/text%3E%3Ctext x='162' y='300' font-size='11' transform='rotate(-7,162,300)'%3E%E2%86%91%3C/text%3E%3Ctext x='205' y='290' font-size='14' transform='rotate(16,205,290)'%3E%24%3C/text%3E%3Ctext x='250' y='302' font-size='12' transform='rotate(-4,250,302)'%3ELEAN%3C/text%3E%3Ctext x='296' y='294' font-size='11' transform='rotate(11,296,294)'%3E%E2%82%AB%3C/text%3E%3Ctext x='338' y='306' font-size='14' transform='rotate(-18,338,306)'%3E4%25%3C/text%3E%3Ctext x='382' y='296' font-size='13' transform='rotate(6,382,296)'%3E%E2%82%AC%3C/text%3E%3Ctext x='48' y='338' font-size='10' transform='rotate(-10,48,338)'%3ECOAST%3C/text%3E%3Ctext x='92' y='344' font-size='14' transform='rotate(20,92,344)'%3E%25%3C/text%3E%3Ctext x='135' y='332' font-size='12' transform='rotate(-16,135,332)'%3E%E2%86%91%3C/text%3E%3Ctext x='178' y='340' font-size='11' transform='rotate(7,178,340)'%3E%E2%82%AB%3C/text%3E%3Ctext x='222' y='330' font-size='13' transform='rotate(-21,222,330)'%3EFIRE%3C/text%3E%3Ctext x='268' y='342' font-size='14' transform='rotate(10,268,342)'%3E%24%3C/text%3E%3Ctext x='310' y='334' font-size='10' transform='rotate(-5,310,334)'%3E7%25%3C/text%3E%3Ctext x='355' y='346' font-size='12' transform='rotate(15,355,346)'%3E%E2%86%93%3C/text%3E%3Ctext x='395' y='332' font-size='13' transform='rotate(-9,395,332)'%3E%25%3C/text%3E%3Ctext x='22' y='378' font-size='14' transform='rotate(4,22,378)'%3E%E2%82%AB%3C/text%3E%3Ctext x='65' y='384' font-size='11' transform='rotate(-17,65,384)'%3EFAT%3C/text%3E%3Ctext x='110' y='372' font-size='13' transform='rotate(21,110,372)'%3E%E2%86%91%3C/text%3E%3Ctext x='155' y='380' font-size='10' transform='rotate(-8,155,380)'%3E4%25%3C/text%3E%3Ctext x='198' y='370' font-size='14' transform='rotate(13,198,370)'%3E%E2%82%AC%3C/text%3E%3Ctext x='242' y='382' font-size='12' transform='rotate(-19,242,382)'%3E%25%3C/text%3E%3Ctext x='286' y='374' font-size='11' transform='rotate(6,286,374)'%3ELEAN%3C/text%3E%3Ctext x='330' y='386' font-size='14' transform='rotate(-12,330,386)'%3E%E2%82%AB%3C/text%3E%3Ctext x='375' y='376' font-size='13' transform='rotate(17,375,376)'%3E%E2%86%91%3C/text%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 400px 400px;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
.finance-bg > * {
  position: relative;
  z-index: 1;
}
</style>
