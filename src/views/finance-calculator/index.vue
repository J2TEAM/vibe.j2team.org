<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage, useClipboard } from '@vueuse/core'

const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const income = useLocalStorage('fin-income', 15000000)
const budget = computed(() => ({
  needs: income.value * 0.5,
  wants: income.value * 0.3,
  savings: income.value * 0.2,
}))

const exchangeRate = ref(25450)
const amountUSD = ref(100)
const convertedVND = computed(() => amountUSD.value * exchangeRate.value)

const principal = ref(50000000)
const rate = ref(6.5)
const years = ref(10)
const compoundInterest = computed(() => {
  return Math.round(principal.value * Math.pow(1 + rate.value / 100, years.value))
})

const grossSalary = ref(25000000)
const dependents = ref(0)
const taxResult = computed(() => {
  const giacanh = 11000000
  const phuthuoc = dependents.value * 4400000
  const chiuthue = Math.max(0, grossSalary.value - giacanh - phuthuoc)
  let tax = 0
  if (chiuthue <= 5000000) tax = chiuthue * 0.05
  else if (chiuthue <= 10000000) tax = chiuthue * 0.1 - 250000
  else if (chiuthue <= 18000000) tax = chiuthue * 0.15 - 750000
  else if (chiuthue <= 32000000) tax = chiuthue * 0.2 - 1650000
  else tax = chiuthue * 0.25 - 3250000
  return { tax, net: grossSalary.value - tax }
})

const loanAmount = ref(500000000)
const loanRate = ref(8.5)
const loanTerm = ref(60)
const monthlyPayment = computed(() => {
  const r = loanRate.value / 12 / 100
  const n = loanTerm.value
  if (r === 0) return loanAmount.value / n
  const payment = (loanAmount.value * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  return Math.round(payment)
})
const totalInterest = computed(() => monthlyPayment.value * loanTerm.value - loanAmount.value)

const remainingCash = computed(() => {
  return Math.max(0, taxResult.value.net - monthlyPayment.value)
})

const { copy, copied } = useClipboard()
const handleCopyLink = () => {
  if (typeof window !== 'undefined') {
    copy(window.location.href)
  }
}

const printPage = () => {
  if (typeof window !== 'undefined') {
    window.print()
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body pb-20 print:bg-white print:text-black"
  >
    <div class="max-w-5xl mx-auto px-4 py-12">
      <header class="mb-12 text-center print:mb-8">
        <div class="inline-flex p-3 bg-accent-sky/10 rounded-full mb-4 print:hidden">
          <Icon icon="lucide:wallet" class="size-8 text-accent-sky" />
        </div>
        <h1
          class="text-4xl sm:text-5xl font-bold text-white mb-4 font-display italic print:text-black print:not-italic"
        >
          Tài Chính Cá Nhân
        </h1>
        <p class="text-text-secondary max-w-xl mx-auto print:text-gray-600">
          Lập kế hoạch ngân sách, tính toán lãi suất và quản lý dòng tiền thông minh.
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-8">
          <section
            class="bg-bg-surface border border-border-default p-6 rounded-sm shadow-sm print:border-gray-300"
          >
            <h2
              class="text-xl font-semibold mb-6 flex items-center gap-2 text-accent-amber print:text-black"
            >
              <Icon icon="lucide:pie-chart" class="print:hidden" /> Quy tắc Ngân Sách 50/30/20
            </h2>
            <div class="mb-6">
              <label class="text-xs text-text-dim block mb-2 uppercase tracking-widest"
                >Thu nhập hàng tháng</label
              >
              <input
                v-model.number="income"
                type="number"
                class="w-full bg-bg-elevated border border-border-default p-3 outline-none focus:border-accent-amber transition print:border-gray-400"
              />
            </div>

            <div
              class="h-4 w-full flex bg-bg-deep rounded-full overflow-hidden border border-border-default mb-6 print:border-gray-300"
            >
              <div :style="{ width: '50%' }" class="bg-accent-sky h-full"></div>
              <div :style="{ width: '30%' }" class="bg-accent-coral h-full"></div>
              <div :style="{ width: '20%' }" class="bg-green-500 h-full"></div>
            </div>

            <div class="space-y-3">
              <div
                v-for="(val, key) in budget"
                :key="key"
                class="flex justify-between items-center p-3 bg-bg-deep border border-border-default print:border-gray-200"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="size-2 rounded-full"
                    :class="
                      key === 'needs'
                        ? 'bg-accent-sky'
                        : key === 'wants'
                          ? 'bg-accent-coral'
                          : 'bg-green-500'
                    "
                  ></div>
                  <span class="text-sm text-text-dim capitalize">{{
                    key === 'needs' ? 'Thiết yếu' : key === 'wants' ? 'Linh hoạt' : 'Tiết kiệm'
                  }}</span>
                </div>
                <span class="font-mono font-bold">{{ formatVND(val) }}</span>
              </div>
            </div>
          </section>

          <section
            class="bg-bg-surface border border-border-default p-6 rounded-sm shadow-sm print:border-gray-300"
          >
            <h2
              class="text-xl font-semibold mb-6 flex items-center gap-2 text-accent-sky print:text-black"
            >
              <Icon icon="lucide:refresh-cw" class="print:hidden" /> Chuyển Đổi Tỷ Giá
            </h2>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <label class="text-[10px] uppercase text-text-dim">Nhập USD</label>
                  <input
                    v-model.number="amountUSD"
                    type="number"
                    class="w-full bg-bg-elevated border border-border-default p-2 outline-none focus:border-accent-sky"
                  />
                </div>
                <Icon icon="lucide:repeat" class="mt-4 text-text-dim" />
                <div class="flex-1 text-right">
                  <label class="text-[10px] uppercase text-text-dim">VND tương ứng</label>
                  <div class="p-2 text-accent-sky font-bold">{{ formatVND(convertedVND) }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="space-y-8">
          <section
            class="bg-bg-surface border border-border-default p-6 rounded-sm shadow-sm print:border-gray-300"
          >
            <h2
              class="text-xl font-semibold mb-6 flex items-center gap-2 text-green-400 print:text-black"
            >
              <Icon icon="lucide:trending-up" class="print:hidden" /> Lãi Suất Kép
            </h2>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label class="text-xs text-text-dim mb-1 block uppercase">Vốn ban đầu</label>
                <input
                  v-model.number="principal"
                  type="number"
                  class="w-full bg-bg-elevated border border-border-default p-2 outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-dim mb-1 block uppercase">Lãi năm (%)</label>
                <input
                  v-model.number="rate"
                  type="number"
                  step="0.1"
                  class="w-full bg-bg-elevated border border-border-default p-2 outline-none"
                />
              </div>
            </div>
            <div class="mb-6">
              <div class="flex justify-between text-xs text-text-dim mb-2 uppercase">
                <span>Thời gian gửi</span>
                <span class="text-green-400 font-bold">{{ years }} năm</span>
              </div>
              <input
                v-model.number="years"
                type="range"
                min="1"
                max="50"
                class="w-full h-1.5 bg-bg-elevated accent-green-400 appearance-none cursor-pointer"
              />
            </div>
            <div class="text-center p-6 bg-green-500/5 border border-dashed border-green-500/30">
              <p class="text-[10px] text-text-dim uppercase mb-1">Tổng tài sản dự kiến</p>
              <p class="text-3xl font-bold text-green-400 font-display italic print:text-black">
                {{ formatVND(compoundInterest) }}
              </p>
            </div>
          </section>

          <section
            class="bg-bg-surface border border-border-default p-6 rounded-sm shadow-sm print:border-gray-300 relative overflow-hidden"
          >
            <div
              class="absolute top-0 right-0 p-3 bg-accent-coral/10 text-accent-coral text-[10px] font-bold uppercase"
            >
              Tax Calculator
            </div>
            <h2
              class="text-xl font-semibold mb-6 flex items-center gap-2 text-accent-coral print:text-black"
            >
              <Icon icon="lucide:landmark" class="print:hidden" /> Thuế Thu Nhập (PIT)
            </h2>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label class="text-xs text-text-dim mb-1 block uppercase">Lương Gross</label>
                <input
                  v-model.number="grossSalary"
                  type="number"
                  class="w-full bg-bg-elevated border border-border-default p-2 outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-dim mb-1 block uppercase">Người phụ thuộc</label>
                <input
                  v-model.number="dependents"
                  type="number"
                  class="w-full bg-bg-elevated border border-border-default p-2 outline-none"
                />
              </div>
            </div>
            <div
              class="flex justify-between items-center p-4 bg-bg-deep border-l-4 border-accent-coral"
            >
              <span class="text-sm text-text-secondary">Thực nhận (Net):</span>
              <span class="text-xl font-bold text-green-400 print:text-black">{{
                formatVND(taxResult.net)
              }}</span>
            </div>
          </section>
        </div>

        <section
          class="lg:col-span-2 bg-bg-surface border border-border-default p-6 rounded-sm shadow-sm print:border-gray-300"
        >
          <h2
            class="text-xl font-semibold mb-6 flex items-center gap-2 text-accent-sky print:text-black"
          >
            <Icon icon="lucide:calculator" class="print:hidden" /> Vay Trả Góp (Annuity)
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label class="text-xs text-text-dim mb-1 block uppercase">Số tiền vay</label>
              <input
                v-model.number="loanAmount"
                type="number"
                class="w-full bg-bg-elevated border border-border-default p-2 outline-none focus:border-accent-sky"
              />
            </div>
            <div>
              <label class="text-xs text-text-dim mb-1 block uppercase">Lãi suất (%/năm)</label>
              <input
                v-model.number="loanRate"
                type="number"
                step="0.1"
                class="w-full bg-bg-elevated border border-border-default p-2 outline-none focus:border-accent-sky"
              />
            </div>
            <div>
              <label class="text-xs text-text-dim mb-1 block uppercase">Kỳ hạn (tháng)</label>
              <input
                v-model.number="loanTerm"
                type="number"
                class="w-full bg-bg-elevated border border-border-default p-2 outline-none focus:border-accent-sky"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-6 bg-accent-sky/5 border border-accent-sky/20 rounded-sm text-center">
              <p class="text-xs text-text-dim uppercase mb-2">Trả mỗi tháng</p>
              <p class="text-3xl font-bold text-accent-sky print:text-black">
                {{ formatVND(monthlyPayment) }}
              </p>
            </div>
            <div class="p-6 bg-bg-deep border border-border-default rounded-sm text-center">
              <p class="text-xs text-text-dim uppercase mb-2">Tổng lãi phải trả</p>
              <p class="text-2xl font-bold text-accent-coral print:text-black">
                {{ formatVND(totalInterest) }}
              </p>
            </div>
            <div
              class="p-6 bg-green-500/5 border border-green-500/20 rounded-sm text-center sm:col-span-2 lg:col-span-1"
            >
              <p class="text-xs text-text-dim uppercase mb-2">Số dư Net sau trả nợ</p>
              <p class="text-2xl font-bold text-green-400 print:text-black">
                {{ formatVND(remainingCash) }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer class="mt-16 flex flex-col items-center gap-6 print:hidden">
        <div class="flex flex-wrap justify-center gap-4">
          <button
            @click="handleCopyLink"
            class="flex items-center gap-2 px-4 py-2 border border-border-default hover:border-white transition text-xs"
          >
            <Icon :icon="copied ? 'lucide:check' : 'lucide:share-2'" />
            {{ copied ? 'Đã copy link' : 'Chia sẻ' }}
          </button>
          <button
            @click="printPage"
            class="flex items-center gap-2 px-4 py-2 border border-border-default hover:border-accent-sky transition text-xs"
          >
            <Icon icon="lucide:printer" />
            Xuất file / In
          </button>
        </div>

        <RouterLink
          to="/"
          class="group flex items-center gap-2 px-8 py-3 border border-border-default hover:border-white transition-all text-sm uppercase tracking-widest"
        >
          <Icon icon="lucide:arrow-left" class="group-hover:-translate-x-1 transition-transform" />
          Về trang chủ
        </RouterLink>
      </footer>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}

@media print {
  .bg-bg-deep {
    background-color: white !important;
  }
  .bg-bg-surface {
    background-color: white !important;
    border: 1px solid #ddd !important;
  }
  .bg-bg-elevated {
    background-color: #f9f9f9 !important;
    border: 1px solid #eee !important;
  }
  input {
    border: 1px solid #ccc !important;
    background: transparent !important;
  }
}
</style>
