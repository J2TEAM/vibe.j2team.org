<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
// ── Types ─────────────────────────────────────────────────────────────────────

interface FundOwner {
  id: number
  name: string
  shortName: string
}

interface FundAssetType {
  id: number
  name: string
  code: 'BOND' | 'STOCK' | 'BALANCED' | 'OTHER'
}

interface ProductNavChange {
  navToPrevious?: number
  navToLastYear?: number
  navTo1Months?: number
  navTo3Months?: number
  navTo6Months?: number
  navTo12Months?: number
  navTo24Months?: number
  navTo36Months?: number
  navTo60Months?: number
  annualizedReturn36Months?: number
  updateAt?: number
}

interface FundData {
  id: number
  code: string
  name: string
  shortName: string
  nav: number
  owner?: FundOwner
  dataFundAssetType?: FundAssetType
  productNavChange?: ProductNavChange
}

type FundAssetFilter = 'ALL' | 'STOCK' | 'BOND' | 'BALANCED'
type SortField = 'navTo1Months' | 'navTo12Months' | 'navTo36Months' | 'nav'
type SortDir = 'asc' | 'desc'

// ── State ─────────────────────────────────────────────────────────────────────

const funds = ref<FundData[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const activeFilter = ref<FundAssetFilter>('ALL')
const sortField = ref<SortField>('navTo12Months')
const sortDir = ref<SortDir>('desc')
const searchQuery = ref('')

// ── API ───────────────────────────────────────────────────────────────────────

const API_URL = 'https://api.fmarket.vn/res/products/filter'

async function fetchFunds(filter: FundAssetFilter = 'ALL') {
  loading.value = true
  error.value = null
  funds.value = []

  const fundAssetTypes = filter === 'ALL' ? [] : filter === 'BALANCED' ? ['BALANCED'] : [filter]

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'vi',
        'content-type': 'application/json',
        'f-language': 'vi',
      },
      body: JSON.stringify({
        types: ['NEW_FUND', 'TRADING_FUND'],
        sortOrder: 'DESC',
        sortField: 'navTo12Months',
        page: 1,
        pageSize: 100,
        fundAssetTypes,
      }),
    })

    if (!response.ok) throw new Error(`Lỗi kết nối: ${response.statusText}`)

    const json = await response.json()
    funds.value = json.data?.rows ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không thể tải dữ liệu quỹ. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}

// ── Computed ──────────────────────────────────────────────────────────────────

const filteredAndSorted = computed(() => {
  let list = [...funds.value]

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (f) =>
        f.code.toLowerCase().includes(q) ||
        f.shortName.toLowerCase().includes(q) ||
        (f.owner?.name ?? '').toLowerCase().includes(q),
    )
  }

  // Sort
  list.sort((a, b) => {
    let aVal: number | undefined
    let bVal: number | undefined

    if (sortField.value === 'nav') {
      aVal = a.nav
      bVal = b.nav
    } else {
      aVal = a.productNavChange?.[sortField.value]
      bVal = b.productNavChange?.[sortField.value]
    }

    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1
    const diff = aVal - bVal
    return sortDir.value === 'desc' ? -diff : diff
  })

  return list
})

const stats = computed(() => {
  const all = funds.value
  if (!all.length) return null

  const stockFunds = all.filter((f) => f.dataFundAssetType?.code === 'STOCK')
  const bondFunds = all.filter((f) => f.dataFundAssetType?.code === 'BOND')

  const avg12m = (arr: FundData[]) => {
    const valid = arr
      .map((f) => f.productNavChange?.navTo12Months)
      .filter((v): v is number => v !== undefined && v !== null)
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
  }

  const best = [...all].sort(
    (a, b) =>
      (b.productNavChange?.navTo12Months ?? -Infinity) -
      (a.productNavChange?.navTo12Months ?? -Infinity),
  )[0]

  return {
    total: all.length,
    stockCount: stockFunds.length,
    bondCount: bondFunds.length,
    avgStock12m: avg12m(stockFunds),
    avgBond12m: avg12m(bondFunds),
    bestFund: best,
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPct(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A'
  const v = Number(value.toFixed(2))
  return v > 0 ? `+${v}%` : `${v}%`
}

function formatVND(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A'
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDate(ts: number | string | undefined): string {
  if (!ts) return 'N/A'
  try {
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return 'N/A'
  }
}

function pctClass(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'text-text-dim'
  return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-text-secondary'
}

function assetLabel(code: string | undefined): string {
  const map: Record<string, string> = {
    BOND: 'Trái phiếu',
    STOCK: 'Cổ phiếu',
    BALANCED: 'Cân bằng',
    OTHER: 'Khác',
  }
  return map[code ?? ''] ?? code ?? 'Khác'
}

const ASSET_COLOR_FALLBACK = 'bg-text-dim/15 text-text-dim border border-text-dim/30'

function assetColor(code: string | undefined): string {
  const map: Record<string, string> = {
    BOND: 'bg-accent-sky/15 text-accent-sky border border-accent-sky/30',
    STOCK: 'bg-accent-coral/15 text-accent-coral border border-accent-coral/30',
    BALANCED: 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30',
    OTHER: ASSET_COLOR_FALLBACK,
  }
  return map[code ?? ''] ?? ASSET_COLOR_FALLBACK
}

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = field
    sortDir.value = 'desc'
  }
}

function setFilter(f: FundAssetFilter) {
  activeFilter.value = f
  fetchFunds(f)
}

function sortIcon(field: SortField): string {
  if (sortField.value !== field) return 'lucide:chevrons-up-down'
  return sortDir.value === 'desc' ? 'lucide:chevron-down' : 'lucide:chevron-up'
}

function sortActive(field: SortField): boolean {
  return sortField.value === field
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(() => fetchFunds('ALL'))

// ── FAQ ──────────────────────────────────────────────────────────────────────

const openFaq = ref<number | null>(null)

function toggleFaq(index: number) {
  openFaq.value = openFaq.value === index ? null : index
}

const faqs = [
  {
    q: 'Quỹ mở là gì?',
    a: 'Quỹ mở (open-end fund) là loại quỹ đầu tư mà nhà đầu tư có thể mua và bán chứng chỉ quỹ bất kỳ lúc nào theo giá NAV hiện tại. Không có giới hạn số lượng chứng chỉ phát hành — quỹ liên tục phát hành mới khi có nhà đầu tư mua vào và thu hồi khi có nhà đầu tư bán ra.',
  },
  {
    q: 'NAV là gì?',
    a: 'NAV (Net Asset Value — Giá trị tài sản ròng) là giá trị mỗi chứng chỉ quỹ tại một thời điểm, tính bằng tổng tài sản của quỹ trừ các khoản nợ, chia cho tổng số chứng chỉ đang lưu hành. Đây là mức giá bạn sẽ mua hoặc bán chứng chỉ quỹ.',
  },
  {
    q: 'Lợi nhuận 1 tháng, 1 năm, 3 năm có nghĩa gì?',
    a: 'Các con số này thể hiện phần trăm thay đổi của NAV so với thời điểm 1 tháng, 1 năm, hoặc 3 năm trước đó. Ví dụ: lợi nhuận 1 năm = +15% nghĩa là nếu đầu tư 1 năm trước, bạn kiếm được 15% (chưa tính thuế và phí).',
  },
  {
    q: 'Quỹ cổ phiếu và quỹ trái phiếu khác nhau như thế nào?',
    a: 'Quỹ cổ phiếu (STOCK) đầu tư chủ yếu vào cổ phiếu — tiềm năng sinh lời cao hơn nhưng biến động nhiều hơn, phù hợp với mục tiêu dài hạn (5+ năm). Quỹ trái phiếu (BOND) đầu tư chủ yếu vào trái phiếu — ổn định hơn, phù hợp cho mục tiêu ngắn đến trung hạn (1–3 năm).',
  },
  {
    q: 'Tôi có thể đầu tư quỹ mở ở đâu?',
    a: 'Tại Việt Nam, bạn có thể đầu tư quỹ mở qua các nền tảng như Fmarket, TCBS, MBS, VPS... Thủ tục đăng ký khá đơn giản, chỉ cần CCCD và tài khoản ngân hàng. Số tiền đầu tư tối thiểu thường từ 100.000 – 1.000.000 VNĐ.',
  },
  {
    q: 'Dữ liệu trên trang này có độ tin cậy không?',
    a: 'Dữ liệu được lấy trực tiếp từ API của Fmarket — một trong những nền tảng quỹ mở lớn tại Việt Nam. Thông tin NAV và hiệu suất được cập nhật theo từng phiên giao dịch. Tuy nhiên, trang này chỉ mang tính tham khảo, không phải tư vấn đầu tư chuyên nghiệp.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <!-- ── HEADER ── -->
      <header class="mb-10 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-text-dim text-sm hover:text-accent-coral transition mb-6 group"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 group-hover:-translate-x-0.5 transition-transform"
          />
          Trang chủ
        </RouterLink>

        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              <span class="text-text-dim text-xs font-display tracking-widest uppercase"
                >Finance</span
              >
            </div>
            <h1 class="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-tight">
              Hiệu suất
              <span class="text-accent-coral">quỹ mở</span>
            </h1>
            <p class="mt-3 text-text-secondary text-base max-w-xl">
              Theo dõi và so sánh lợi nhuận các quỹ đầu tư mở tại Việt Nam
            </p>
          </div>

          <!-- Refresh -->
          <button
            :disabled="loading"
            class="self-start sm:self-auto inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            @click="fetchFunds(activeFilter)"
          >
            <Icon
              icon="lucide:refresh-cw"
              class="size-4 transition-transform"
              :class="{ 'animate-spin': loading }"
            />
            Làm mới
          </button>
        </div>
      </header>

      <!-- ── STATS CARDS ── -->
      <div
        v-if="stats"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fade-up animate-delay-2"
      >
        <!-- Total -->
        <div class="border border-border-default bg-bg-surface p-4 relative overflow-hidden">
          <span
            class="absolute top-2 right-3 font-display text-5xl font-bold text-accent-coral/5 select-none pointer-events-none"
            >Q</span
          >
          <div class="text-text-dim text-xs font-display tracking-widest uppercase mb-1">
            Tổng quỹ
          </div>
          <div class="font-display text-3xl font-bold text-text-primary">{{ stats.total }}</div>
          <div class="text-text-dim text-xs mt-1">quỹ đang giao dịch</div>
        </div>
        <!-- Stock -->
        <div class="border border-border-default bg-bg-surface p-4 relative overflow-hidden">
          <span
            class="absolute top-2 right-3 font-display text-5xl font-bold text-accent-coral/5 select-none pointer-events-none"
            >C</span
          >
          <div class="text-text-dim text-xs font-display tracking-widest uppercase mb-1">
            Cổ phiếu
          </div>
          <div class="font-display text-3xl font-bold text-accent-coral">
            {{ stats.stockCount }}
          </div>
          <div class="text-text-dim text-xs mt-1">
            TB 1 năm:
            <span :class="pctClass(stats.avgStock12m)">{{ formatPct(stats.avgStock12m) }}</span>
          </div>
        </div>
        <!-- Bond -->
        <div class="border border-border-default bg-bg-surface p-4 relative overflow-hidden">
          <span
            class="absolute top-2 right-3 font-display text-5xl font-bold text-accent-sky/5 select-none pointer-events-none"
            >T</span
          >
          <div class="text-text-dim text-xs font-display tracking-widest uppercase mb-1">
            Trái phiếu
          </div>
          <div class="font-display text-3xl font-bold text-accent-sky">{{ stats.bondCount }}</div>
          <div class="text-text-dim text-xs mt-1">
            TB 1 năm:
            <span :class="pctClass(stats.avgBond12m)">{{ formatPct(stats.avgBond12m) }}</span>
          </div>
        </div>
        <!-- Best -->
        <div class="border border-border-default bg-bg-surface p-4 relative overflow-hidden">
          <span
            class="absolute top-2 right-3 font-display text-5xl font-bold text-accent-amber/5 select-none pointer-events-none"
            >★</span
          >
          <div class="text-text-dim text-xs font-display tracking-widest uppercase mb-1">
            Tốt nhất 1 năm
          </div>
          <div class="font-display text-xl font-bold text-accent-amber truncate">
            {{ stats.bestFund?.code ?? 'N/A' }}
          </div>
          <div class="text-text-dim text-xs mt-1">
            <span :class="pctClass(stats.bestFund?.productNavChange?.navTo12Months)">
              {{ formatPct(stats.bestFund?.productNavChange?.navTo12Months) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── WHAT IS ── -->
      <section class="mb-12 animate-fade-up animate-delay-2">
        <h2 class="font-display text-xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Khái niệm cần biết
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <!-- NAV -->
          <div
            class="border border-border-default bg-bg-surface p-5 hover:-translate-y-0.5 hover:border-accent-sky hover:bg-bg-elevated transition-all duration-300 group"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="shrink-0 size-9 flex items-center justify-center border border-accent-sky/30 bg-accent-sky/10 text-accent-sky"
              >
                <Icon icon="lucide:trending-up" class="size-4" />
              </div>
              <div>
                <div
                  class="font-display font-semibold text-text-primary group-hover:text-accent-sky transition"
                >
                  NAV
                </div>
                <div class="text-text-dim text-xs">Net Asset Value</div>
              </div>
            </div>
            <p class="text-text-secondary text-sm leading-relaxed">
              Giá trị tài sản ròng mỗi chứng chỉ quỹ. Đây là mức giá bạn mua hoặc bán chứng chỉ quỹ
              vào cuối mỗi phiên giao dịch.
            </p>
          </div>
          <!-- Quỹ cổ phiếu -->
          <div
            class="border border-border-default bg-bg-surface p-5 hover:-translate-y-0.5 hover:border-accent-coral hover:bg-bg-elevated transition-all duration-300 group"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="shrink-0 size-9 flex items-center justify-center border border-accent-coral/30 bg-accent-coral/10 text-accent-coral"
              >
                <Icon icon="lucide:bar-chart-2" class="size-4" />
              </div>
              <div>
                <div
                  class="font-display font-semibold text-text-primary group-hover:text-accent-coral transition"
                >
                  Quỹ cổ phiếu
                </div>
                <div class="text-text-dim text-xs">Stock Fund</div>
              </div>
            </div>
            <p class="text-text-secondary text-sm leading-relaxed">
              Đầu tư chủ yếu vào cổ phiếu. Tiềm năng sinh lời cao hơn nhưng biến động lớn hơn — phù
              hợp mục tiêu dài hạn 5+ năm.
            </p>
          </div>
          <!-- Quỹ trái phiếu -->
          <div
            class="border border-border-default bg-bg-surface p-5 hover:-translate-y-0.5 hover:border-accent-amber hover:bg-bg-elevated transition-all duration-300 group"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="shrink-0 size-9 flex items-center justify-center border border-accent-amber/30 bg-accent-amber/10 text-accent-amber"
              >
                <Icon icon="lucide:shield-check" class="size-4" />
              </div>
              <div>
                <div
                  class="font-display font-semibold text-text-primary group-hover:text-accent-amber transition"
                >
                  Quỹ trái phiếu
                </div>
                <div class="text-text-dim text-xs">Bond Fund</div>
              </div>
            </div>
            <p class="text-text-secondary text-sm leading-relaxed">
              Đầu tư chủ yếu vào trái phiếu. Ổn định hơn, ít biến động — phù hợp mục tiêu ngắn đến
              trung hạn 1–3 năm.
            </p>
          </div>
          <!-- Quỹ cân bằng -->
          <div
            class="border border-border-default bg-bg-surface p-5 hover:-translate-y-0.5 hover:border-accent-amber/60 hover:bg-bg-elevated transition-all duration-300 group"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="shrink-0 size-9 flex items-center justify-center border border-accent-amber/30 bg-accent-amber/10 text-accent-amber"
              >
                <Icon icon="lucide:scale" class="size-4" />
              </div>
              <div>
                <div
                  class="font-display font-semibold text-text-primary group-hover:text-accent-amber transition"
                >
                  Quỹ cân bằng
                </div>
                <div class="text-text-dim text-xs">Balanced Fund</div>
              </div>
            </div>
            <p class="text-text-secondary text-sm leading-relaxed">
              Phân bổ vốn vào cả cổ phiếu lẫn trái phiếu để cân bằng rủi ro và lợi nhuận — phù hợp
              nhà đầu tư trung dung.
            </p>
          </div>
          <!-- Hiệu suất -->
          <div
            class="border border-border-default bg-bg-surface p-5 hover:-translate-y-0.5 hover:border-accent-sky/60 hover:bg-bg-elevated transition-all duration-300 group"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="shrink-0 size-9 flex items-center justify-center border border-accent-sky/30 bg-accent-sky/10 text-accent-sky"
              >
                <Icon icon="lucide:percent" class="size-4" />
              </div>
              <div>
                <div
                  class="font-display font-semibold text-text-primary group-hover:text-accent-sky transition"
                >
                  Hiệu suất (%)
                </div>
                <div class="text-text-dim text-xs">Performance</div>
              </div>
            </div>
            <p class="text-text-secondary text-sm leading-relaxed">
              Phần trăm thay đổi NAV theo kỳ (1 tháng, 1 năm, 3 năm). Số dương = sinh lời, số âm =
              thua lỗ so với thời điểm ban đầu.
            </p>
          </div>
          <!-- Công ty quản lý quỹ -->
          <div
            class="border border-border-default bg-bg-surface p-5 hover:-translate-y-0.5 hover:border-accent-coral/60 hover:bg-bg-elevated transition-all duration-300 group"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="shrink-0 size-9 flex items-center justify-center border border-accent-coral/30 bg-accent-coral/10 text-accent-coral"
              >
                <Icon icon="lucide:building-2" class="size-4" />
              </div>
              <div>
                <div
                  class="font-display font-semibold text-text-primary group-hover:text-accent-coral transition"
                >
                  Công ty quản lý quỹ
                </div>
                <div class="text-text-dim text-xs">Fund Management Company</div>
              </div>
            </div>
            <p class="text-text-secondary text-sm leading-relaxed">
              Tổ chức chuyên nghiệp quản lý danh mục đầu tư của quỹ. Uy tín và kinh nghiệm của công
              ty là yếu tố quan trọng khi chọn quỹ.
            </p>
          </div>
        </div>
      </section>

      <!-- ── FILTERS & SEARCH ── -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up animate-delay-3">
        <!-- Filter tabs -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in [
              { key: 'ALL', label: 'Tất cả' },
              { key: 'STOCK', label: 'Cổ phiếu' },
              { key: 'BOND', label: 'Trái phiếu' },
              { key: 'BALANCED', label: 'Cân bằng' },
            ] as { key: FundAssetFilter; label: string }[]"
            :key="tab.key"
            class="px-4 py-1.5 text-sm font-display font-semibold border transition-all duration-200"
            :class="
              activeFilter === tab.key
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-secondary hover:border-accent-coral/50 hover:text-text-primary'
            "
            @click="setFilter(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Search -->
        <div class="relative flex-1 max-w-sm sm:ml-auto">
          <Icon
            icon="lucide:search"
            class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-dim pointer-events-none"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm quỹ theo mã, tên..."
            class="w-full bg-bg-surface border border-border-default pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition"
          />
        </div>
      </div>

      <!-- ── LOADING ── -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
        <div class="relative">
          <div class="size-12 border-2 border-border-default rounded-full" />
          <div
            class="size-12 border-2 border-t-accent-coral rounded-full animate-spin absolute inset-0"
          />
        </div>
        <p class="text-text-dim text-sm">Đang tải dữ liệu quỹ mở...</p>
      </div>

      <!-- ── ERROR ── -->
      <div v-else-if="error" class="border border-red-500/30 bg-red-500/10 p-6 text-center">
        <Icon icon="lucide:alert-triangle" class="size-8 text-red-400 mx-auto mb-3" />
        <p class="text-red-400 font-semibold mb-1">Không tải được dữ liệu</p>
        <p class="text-text-secondary text-sm mb-4">{{ error }}</p>
        <button
          class="inline-flex items-center gap-2 border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:border-red-400 hover:bg-red-500/10 transition"
          @click="fetchFunds(activeFilter)"
        >
          <Icon icon="lucide:refresh-cw" class="size-4" />
          Thử lại
        </button>
      </div>

      <!-- ── TABLE ── -->
      <template v-else-if="filteredAndSorted.length">
        <!-- Result count -->
        <div
          class="flex items-center justify-between mb-3 text-xs text-text-dim animate-fade-up animate-delay-4"
        >
          <span
            >Hiển thị
            <strong class="text-text-secondary">{{ filteredAndSorted.length }}</strong> quỹ</span
          >
          <span class="hidden sm:inline">Click vào tiêu đề cột để sắp xếp</span>
        </div>

        <!-- Table wrapper -->
        <div class="overflow-x-auto border border-border-default animate-fade-up animate-delay-4">
          <table class="min-w-full divide-y divide-border-default text-sm">
            <!-- HEAD -->
            <thead class="bg-bg-surface">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-display tracking-widest text-text-dim uppercase whitespace-nowrap"
                >
                  Quỹ
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-display tracking-widest text-text-dim uppercase whitespace-nowrap hidden sm:table-cell"
                >
                  Loại
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-display tracking-widest text-text-dim uppercase whitespace-nowrap cursor-pointer transition select-none hover:text-text-primary"
                  :class="{ 'text-accent-amber': sortActive('nav') }"
                  @click="toggleSort('nav')"
                >
                  <span class="inline-flex items-center gap-1 justify-end">
                    NAV (đ)
                    <Icon :icon="sortIcon('nav')" class="size-3.5" />
                  </span>
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-display tracking-widest text-text-dim uppercase whitespace-nowrap cursor-pointer transition select-none hover:text-text-primary"
                  :class="{ 'text-accent-amber': sortActive('navTo1Months') }"
                  @click="toggleSort('navTo1Months')"
                >
                  <span class="inline-flex items-center gap-1 justify-end">
                    1 Tháng
                    <Icon :icon="sortIcon('navTo1Months')" class="size-3.5" />
                  </span>
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-display tracking-widest uppercase whitespace-nowrap cursor-pointer transition select-none hover:text-text-primary"
                  :class="{ 'text-accent-amber': sortActive('navTo12Months') }"
                  @click="toggleSort('navTo12Months')"
                >
                  <span class="inline-flex items-center gap-1 justify-end">
                    1 Năm
                    <Icon :icon="sortIcon('navTo12Months')" class="size-3.5" />
                  </span>
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-display tracking-widest text-text-dim uppercase whitespace-nowrap cursor-pointer transition select-none hover:text-text-primary hidden md:table-cell"
                  :class="{ 'text-accent-amber': sortActive('navTo36Months') }"
                  @click="toggleSort('navTo36Months')"
                >
                  <span class="inline-flex items-center gap-1 justify-end">
                    3 Năm
                    <Icon :icon="sortIcon('navTo36Months')" class="size-3.5" />
                  </span>
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-display tracking-widest text-text-dim uppercase whitespace-nowrap hidden lg:table-cell"
                >
                  Cập nhật
                </th>
              </tr>
            </thead>

            <!-- BODY -->
            <tbody class="divide-y divide-border-default bg-bg-deep">
              <tr
                v-for="fund in filteredAndSorted"
                :key="fund.id"
                class="hover:bg-bg-surface transition-colors group"
              >
                <!-- Fund name -->
                <td class="px-4 py-3 max-w-[180px] sm:max-w-xs">
                  <div
                    class="font-display font-semibold text-text-primary group-hover:text-accent-coral transition"
                  >
                    {{ fund.code }}
                  </div>
                  <div class="text-text-dim text-xs truncate mt-0.5">
                    {{ fund.owner?.name ?? fund.shortName }}
                  </div>
                </td>

                <!-- Type badge (hidden on mobile) -->
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span
                    class="inline-block px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                    :class="assetColor(fund.dataFundAssetType?.code)"
                  >
                    {{ assetLabel(fund.dataFundAssetType?.code) }}
                  </span>
                </td>

                <!-- NAV -->
                <td class="px-4 py-3 text-right font-mono text-text-secondary whitespace-nowrap">
                  {{ formatVND(fund.nav) }}
                </td>

                <!-- 1 Month -->
                <td
                  class="px-4 py-3 text-right font-display font-semibold whitespace-nowrap"
                  :class="pctClass(fund.productNavChange?.navTo1Months)"
                >
                  {{ formatPct(fund.productNavChange?.navTo1Months) }}
                </td>

                <!-- 1 Year -->
                <td
                  class="px-4 py-3 text-right font-display font-bold whitespace-nowrap"
                  :class="pctClass(fund.productNavChange?.navTo12Months)"
                >
                  {{ formatPct(fund.productNavChange?.navTo12Months) }}
                </td>

                <!-- 3 Years (hidden on small) -->
                <td
                  class="px-4 py-3 text-right font-display font-semibold whitespace-nowrap hidden md:table-cell"
                  :class="pctClass(fund.productNavChange?.navTo36Months)"
                >
                  {{ formatPct(fund.productNavChange?.navTo36Months) }}
                </td>

                <!-- Updated (hidden on small) -->
                <td
                  class="px-4 py-3 text-right text-text-dim text-xs whitespace-nowrap hidden lg:table-cell"
                >
                  {{ formatDate(fund.productNavChange?.updateAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table footer note -->
        <p class="mt-3 text-text-dim text-xs text-right">
          * Lợi nhuận là % thay đổi NAV, chưa tính thuế và phí quản lý
        </p>
      </template>

      <!-- ── EMPTY ── -->
      <div
        v-else-if="!loading && !error"
        class="border border-border-default bg-bg-surface p-12 text-center"
      >
        <Icon icon="lucide:search-x" class="size-10 text-text-dim mx-auto mb-3" />
        <p class="text-text-secondary">Không tìm thấy quỹ phù hợp.</p>
        <button class="mt-4 text-sm text-accent-coral hover:underline" @click="searchQuery = ''">
          Xóa tìm kiếm
        </button>
      </div>

      <!-- ── FAQ ── -->
      <section class="mt-14 animate-fade-up">
        <h2 class="font-display text-xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Câu hỏi thường gặp
        </h2>
        <div class="divide-y divide-border-default border border-border-default">
          <div v-for="(faq, i) in faqs" :key="i" class="group">
            <button
              class="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-bg-surface"
              @click="toggleFaq(i)"
            >
              <span
                class="font-display font-semibold text-sm text-text-primary pr-4 group-hover:text-accent-coral transition"
                :class="{ 'text-accent-coral': openFaq === i }"
              >
                {{ faq.q }}
              </span>
              <Icon
                icon="lucide:chevron-down"
                class="size-4 shrink-0 text-text-dim transition-transform duration-300"
                :class="{ 'rotate-180 text-accent-coral': openFaq === i }"
              />
            </button>
            <div v-show="openFaq === i" class="px-5 pb-5">
              <p
                class="text-text-secondary text-sm leading-relaxed border-l-2 border-accent-coral/40 pl-4"
              >
                {{ faq.a }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── FOOTER ── -->
      <footer
        class="mt-14 pt-8 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up"
      >
        <div class="text-center sm:text-left">
          <p class="text-text-dim text-xs">
            Dữ liệu được lấy từ
            <a
              href="https://fmarket.vn"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent-sky hover:underline"
              >Fmarket.vn</a
            >
            — nền tảng quỹ mở tại Việt Nam.
          </p>
          <p class="text-text-dim text-xs mt-1">
            Công cụ này chỉ mang tính tham khảo, không phải tư vấn đầu tư.
          </p>
        </div>

        <!-- Citation -->
        <div class="flex items-center gap-3 text-sm">
          <span class="text-text-dim text-xs">Nguồn cảm hứng:</span>
          <a
            href="https://behitek.com/behivest"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-xs font-display font-semibold text-text-secondary hover:border-accent-amber hover:text-accent-amber transition"
          >
            <Icon icon="lucide:bar-chart-2" class="size-3.5" />
            Behitek — Behivest
          </a>
        </div>
      </footer>
    </div>
  </div>
</template>
