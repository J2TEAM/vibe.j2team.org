<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'

// ── Types ─────────────────────────────────────────────────────────────────────
interface FiatResponse {
  result: string
  time_last_update_unix: number
  rates: Record<string, number>
}

interface CryptoPrice {
  usd: number
  vnd: number
}

type CoinId = 'bitcoin' | 'ethereum'
type CryptoPricesData = Record<CoinId, CryptoPrice>

// ── Constants ─────────────────────────────────────────────────────────────────
const POPULAR_CURRENCIES = [
  'VND',
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'AUD',
  'CAD',
  'CNY',
  'SGD',
  'KRW',
  'THB',
  'HKD',
]

const CURRENCY_FLAGS: Record<string, string> = {
  VND: '🇻🇳',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  JPY: '🇯🇵',
  GBP: '🇬🇧',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CNY: '🇨🇳',
  SGD: '🇸🇬',
  KRW: '🇰🇷',
  THB: '🇹🇭',
  HKD: '🇭🇰',
  CHF: '🇨🇭',
  NZD: '🇳🇿',
  SEK: '🇸🇪',
  NOK: '🇳🇴',
  DKK: '🇩🇰',
  MYR: '🇲🇾',
  IDR: '🇮🇩',
  PHP: '🇵🇭',
  TWD: '🇹🇼',
  INR: '🇮🇳',
  SAR: '🇸🇦',
  AED: '🇦🇪',
}

const NO_DECIMAL = new Set(['VND', 'KRW', 'JPY', 'IDR', 'MMK'])

const COINS: { id: CoinId; name: string; symbol: string; color: string }[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: 'text-accent-amber' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'text-accent-sky' },
]

// ── State ─────────────────────────────────────────────────────────────────────
const activeTab = ref<'fiat' | 'crypto'>('fiat')

// Fiat
const fiatRates = ref<FiatResponse | null>(null)
const fiatLoading = ref(false)
const fiatError = ref('')
const fiatAmount = useLocalStorage('currency-converter:amount', '1000000')
const fromCurrency = useLocalStorage('currency-converter:from', 'VND')
const toCurrency = useLocalStorage('currency-converter:to', 'USD')

// Crypto
const cryptoPrices = ref<CryptoPricesData | null>(null)
const cryptoLoading = ref(false)
const cryptoError = ref('')
const cryptoAmount = ref('1')
const selectedCoin = ref<CoinId>('bitcoin')
const cryptoTargetCurrency = ref<'vnd' | 'usd'>('vnd')
const cryptoReversed = ref(false)

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchFiatRates() {
  fiatLoading.value = true
  fiatError.value = ''
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as FiatResponse
    if (data.result !== 'success') throw new Error('API trả về lỗi')
    fiatRates.value = data
  } catch (e) {
    fiatError.value = e instanceof Error ? e.message : 'Lỗi không xác định'
  } finally {
    fiatLoading.value = false
  }
}

async function fetchCryptoPrices() {
  cryptoLoading.value = true
  cryptoError.value = ''
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,vnd',
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    cryptoPrices.value = (await res.json()) as CryptoPricesData
  } catch (e) {
    cryptoError.value = e instanceof Error ? e.message : 'Lỗi không xác định'
  } finally {
    cryptoLoading.value = false
  }
}

// ── Computed ──────────────────────────────────────────────────────────────────
const allCurrencies = computed(() =>
  fiatRates.value ? Object.keys(fiatRates.value.rates).sort() : [],
)

const fiatResult = computed<number | null>(() => {
  if (!fiatRates.value) return null
  const amount = parseFloat(fiatAmount.value)
  if (isNaN(amount) || amount < 0) return null
  const { rates } = fiatRates.value
  const fromRate = rates[fromCurrency.value]
  const toRate = rates[toCurrency.value]
  if (fromRate == null || toRate == null) return null
  return (amount / fromRate) * toRate
})

const exchangeRate = computed<number | null>(() => {
  if (!fiatRates.value) return null
  const { rates } = fiatRates.value
  const fromRate = rates[fromCurrency.value]
  const toRate = rates[toCurrency.value]
  if (fromRate == null || toRate == null) return null
  return toRate / fromRate
})

const fiatLastUpdated = computed(() => {
  if (!fiatRates.value) return ''
  return new Date(fiatRates.value.time_last_update_unix * 1000).toLocaleString('vi-VN')
})

const cryptoConvertResult = computed<number | null>(() => {
  if (!cryptoPrices.value) return null
  const amount = parseFloat(cryptoAmount.value)
  if (isNaN(amount) || amount <= 0) return null
  const price = cryptoPrices.value[selectedCoin.value]?.[cryptoTargetCurrency.value]
  if (price == null) return null
  return cryptoReversed.value ? amount / price : amount * price
})

// ── Formatters ────────────────────────────────────────────────────────────────
function formatFiat(value: number, currency: string): string {
  const noDecimal = NO_DECIMAL.has(currency)
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      minimumFractionDigits: noDecimal ? 0 : 2,
      maximumFractionDigits: noDecimal ? 0 : 6,
    }).format(value)
  } catch {
    return `${new Intl.NumberFormat('vi-VN').format(value)} ${currency}`
  }
}

function formatCryptoAmount(value: number): string {
  if (value < 0.000001) return value.toFixed(10)
  if (value < 0.001) return value.toFixed(8)
  if (value < 1) return value.toFixed(6)
  if (value < 1000) return value.toFixed(4)
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function getFlag(code: string): string {
  return CURRENCY_FLAGS[code] ?? ''
}

function getCoin(id: CoinId) {
  return COINS.find((c) => c.id === id)!
}

// ── Actions ───────────────────────────────────────────────────────────────────
function swapFiat() {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
}

function swapCrypto() {
  cryptoReversed.value = !cryptoReversed.value
}

// ── Auto refresh every 60s (VueUse auto-cleans up on unmount) ─────────────────
useIntervalFn(fetchFiatRates, 60_000)
useIntervalFn(fetchCryptoPrices, 60_000)

onMounted(() => {
  fetchFiatRates()
  fetchCryptoPrices()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <div class="mx-auto max-w-5xl px-6 py-10">
      <!-- ── Header ── -->
      <header class="mb-8 animate-fade-up">
        <div class="mb-6 flex items-center justify-between">
          <RouterLink
            to="/"
            class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition-all hover:border-accent-coral hover:text-accent-coral"
          >
            <Icon icon="lucide:arrow-left" class="size-3.5" />
            <span>Trang chủ</span>
          </RouterLink>

          <div class="flex items-center gap-2 text-xs text-text-dim">
            <Icon icon="lucide:refresh-cw" class="size-3.5" />
            <span>Tự động cập nhật mỗi 60 giây</span>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center border border-accent-coral/30 bg-bg-surface"
          >
            <Icon icon="lucide:circle-dollar-sign" class="size-6 text-accent-coral" />
          </div>
          <div>
            <h1 class="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Quy đổi tiền tệ
            </h1>
            <p class="mt-1 text-sm text-text-secondary">
              Tỷ giá ngoại tệ và tiền mã hoá theo thời gian thực — dữ liệu từ
              <span class="text-accent-amber">open.er-api.com</span> và
              <span class="text-accent-amber">CoinGecko</span>.
            </p>
          </div>
        </div>
      </header>

      <!-- ── Tabs ── -->
      <div class="mb-6 flex animate-fade-up border-b border-border-default animate-delay-1">
        <button
          class="px-5 py-2.5 font-display text-sm font-semibold tracking-wide transition-colors"
          :class="
            activeTab === 'fiat'
              ? '-mb-px border-b-2 border-accent-coral text-accent-coral'
              : 'text-text-dim hover:text-text-secondary'
          "
          @click="activeTab = 'fiat'"
        >
          <span class="mr-2">💱</span> Ngoại tệ
        </button>
        <button
          class="px-5 py-2.5 font-display text-sm font-semibold tracking-wide transition-colors"
          :class="
            activeTab === 'crypto'
              ? '-mb-px border-b-2 border-accent-amber text-accent-amber'
              : 'text-text-dim hover:text-text-secondary'
          "
          @click="activeTab = 'crypto'"
        >
          <span class="mr-2">₿</span> Tiền mã hoá
        </button>
      </div>

      <!-- ══════════════════════════════════════════ FIAT TAB ══ -->
      <div v-if="activeTab === 'fiat'" class="animate-fade-up animate-delay-2">
        <!-- Popular currencies quick-select -->
        <div class="mb-4">
          <p class="mb-2 font-display text-xs tracking-widest text-text-dim uppercase">
            <span class="text-accent-coral">//</span> Nhanh — Đổi sang
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="code in POPULAR_CURRENCIES"
              :key="code"
              class="border px-3 py-1 font-display text-xs transition-all"
              :class="
                toCurrency === code
                  ? 'border-accent-coral bg-bg-elevated text-accent-coral'
                  : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral/50 hover:text-text-primary'
              "
              @click="toCurrency = code"
            >
              {{ getFlag(code) }} {{ code }}
            </button>
          </div>
        </div>

        <!-- Converter card -->
        <div class="border border-border-default bg-bg-surface p-6">
          <!-- From row -->
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="mb-1 block font-display text-xs tracking-wide text-text-dim"
                >Số tiền</label
              >
              <input
                v-model="fiatAmount"
                type="number"
                min="0"
                placeholder="0"
                class="w-full border border-border-default bg-bg-deep px-4 py-3 font-display text-xl text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
              />
            </div>
            <div class="w-36 shrink-0">
              <label class="mb-1 block font-display text-xs tracking-wide text-text-dim">Từ</label>
              <div class="relative">
                <select
                  v-model="fromCurrency"
                  class="w-full cursor-pointer appearance-none border border-border-default bg-bg-deep px-3 py-3 pr-8 font-display text-sm text-text-primary focus:border-accent-coral focus:outline-none"
                >
                  <option v-for="code in allCurrencies" :key="code" :value="code">
                    {{ getFlag(code) }} {{ code }}
                  </option>
                </select>
                <Icon
                  icon="lucide:chevron-down"
                  class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-text-dim"
                />
              </div>
            </div>
          </div>

          <!-- Swap + rate -->
          <div class="my-4 flex items-center gap-4">
            <button
              class="flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-accent-coral hover:text-accent-coral"
              @click="swapFiat"
            >
              <Icon icon="lucide:arrow-up-down" class="size-3.5" />
              Đảo chiều
            </button>

            <div v-if="exchangeRate !== null" class="text-xs text-text-dim">
              1 {{ fromCurrency }} =
              <span class="font-semibold text-accent-amber">
                {{ formatFiat(exchangeRate, toCurrency) }}
              </span>
            </div>
          </div>

          <!-- To row -->
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="mb-1 block font-display text-xs tracking-wide text-text-dim"
                >Kết quả</label
              >
              <div
                class="flex min-h-[52px] items-center border border-border-default bg-bg-deep px-4 py-3"
              >
                <template v-if="fiatLoading && !fiatRates">
                  <div class="h-6 w-32 animate-pulse bg-bg-elevated" />
                </template>
                <template v-else-if="fiatError">
                  <span class="text-sm text-accent-coral">{{ fiatError }}</span>
                </template>
                <template v-else-if="fiatResult !== null">
                  <span class="font-display text-xl font-semibold text-accent-coral">
                    {{ formatFiat(fiatResult, toCurrency) }}
                  </span>
                </template>
                <template v-else>
                  <span class="text-text-dim">—</span>
                </template>
              </div>
            </div>
            <div class="w-36 shrink-0">
              <label class="mb-1 block font-display text-xs tracking-wide text-text-dim"
                >Sang</label
              >
              <div class="relative">
                <select
                  v-model="toCurrency"
                  class="w-full cursor-pointer appearance-none border border-border-default bg-bg-deep px-3 py-3 pr-8 font-display text-sm text-text-primary focus:border-accent-coral focus:outline-none"
                >
                  <option v-for="code in allCurrencies" :key="code" :value="code">
                    {{ getFlag(code) }} {{ code }}
                  </option>
                </select>
                <Icon
                  icon="lucide:chevron-down"
                  class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-text-dim"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Last updated -->
        <div v-if="fiatLastUpdated" class="mt-3 flex items-center gap-1.5 text-xs text-text-dim">
          <Icon icon="lucide:clock" class="size-3" />
          Cập nhật lúc {{ fiatLastUpdated }}
          <button
            class="ml-2 flex items-center gap-1 underline-offset-2 transition-colors hover:text-accent-sky"
            :disabled="fiatLoading"
            @click="fetchFiatRates"
          >
            <Icon
              icon="lucide:refresh-cw"
              class="size-3"
              :class="fiatLoading ? 'animate-spin' : ''"
            />
            Làm mới
          </button>
        </div>
      </div>

      <!-- ══════════════════════════════════════════ CRYPTO TAB ══ -->
      <div v-else class="animate-fade-up animate-delay-2">
        <!-- Price cards -->
        <div class="mb-6">
          <p class="mb-3 font-display text-xs tracking-widest text-text-dim uppercase">
            <span class="text-accent-amber">//</span> Giá hiện tại
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="coin in COINS"
              :key="coin.id"
              class="border border-border-default bg-bg-surface p-5 transition-all hover:-translate-y-1 hover:border-accent-amber/50 hover:bg-bg-elevated"
            >
              <div class="mb-3 flex items-center gap-3">
                <div
                  class="flex size-9 items-center justify-center border font-display text-xs font-bold"
                  :class="
                    coin.id === 'bitcoin'
                      ? 'border-accent-amber/30 bg-accent-amber/5 text-accent-amber'
                      : 'border-accent-sky/30 bg-accent-sky/5 text-accent-sky'
                  "
                >
                  {{ coin.symbol }}
                </div>
                <div>
                  <div class="font-display text-sm font-semibold">{{ coin.name }}</div>
                  <div class="text-xs text-text-dim">{{ coin.symbol }}</div>
                </div>
              </div>

              <template v-if="cryptoLoading && !cryptoPrices">
                <div class="h-7 w-40 animate-pulse bg-bg-elevated" />
                <div class="mt-1 h-4 w-24 animate-pulse bg-bg-elevated" />
              </template>
              <template v-else-if="cryptoPrices">
                <div class="font-display text-2xl font-bold" :class="coin.color">
                  {{ new Intl.NumberFormat('vi-VN').format(cryptoPrices[coin.id]?.vnd ?? 0)
                  }}<span class="text-sm font-normal text-text-dim"> ₫</span>
                </div>
                <div class="mt-1 text-xs text-text-secondary">
                  ≈
                  {{
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(cryptoPrices[coin.id]?.usd ?? 0)
                  }}
                </div>
              </template>
              <template v-else-if="cryptoError">
                <span class="text-xs text-accent-coral">{{ cryptoError }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Crypto converter -->
        <div>
          <p class="mb-3 font-display text-xs tracking-widest text-text-dim uppercase">
            <span class="text-accent-amber">//</span> Quy đổi
          </p>

          <div class="border border-border-default bg-bg-surface p-6">
            <!-- Direction toggle -->
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <span class="text-xs text-text-dim">Chiều quy đổi:</span>
              <button
                class="border px-3 py-1 font-display text-xs transition-all"
                :class="
                  !cryptoReversed
                    ? 'border-accent-amber bg-bg-elevated text-accent-amber'
                    : 'border-border-default text-text-secondary hover:border-accent-amber/50'
                "
                @click="cryptoReversed = false"
              >
                Crypto → Fiat
              </button>
              <button
                class="border px-3 py-1 font-display text-xs transition-all"
                :class="
                  cryptoReversed
                    ? 'border-accent-amber bg-bg-elevated text-accent-amber'
                    : 'border-border-default text-text-secondary hover:border-accent-amber/50'
                "
                @click="cryptoReversed = true"
              >
                Fiat → Crypto
              </button>
            </div>

            <!-- Input row -->
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="mb-1 block font-display text-xs tracking-wide text-text-dim">
                  {{ cryptoReversed ? 'Số tiền fiat' : 'Số lượng crypto' }}
                </label>
                <input
                  v-model="cryptoAmount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  class="w-full border border-border-default bg-bg-deep px-4 py-3 font-display text-xl text-text-primary placeholder-text-dim focus:border-accent-amber focus:outline-none"
                />
              </div>

              <div class="w-36 shrink-0">
                <label class="mb-1 block font-display text-xs tracking-wide text-text-dim">
                  {{ cryptoReversed ? 'Đơn vị fiat' : 'Đồng crypto' }}
                </label>
                <div class="relative">
                  <select
                    v-if="!cryptoReversed"
                    v-model="selectedCoin"
                    class="w-full cursor-pointer appearance-none border border-border-default bg-bg-deep px-3 py-3 pr-8 font-display text-sm text-text-primary focus:border-accent-amber focus:outline-none"
                  >
                    <option v-for="c in COINS" :key="c.id" :value="c.id">
                      {{ c.symbol }}
                    </option>
                  </select>
                  <select
                    v-else
                    v-model="cryptoTargetCurrency"
                    class="w-full cursor-pointer appearance-none border border-border-default bg-bg-deep px-3 py-3 pr-8 font-display text-sm text-text-primary focus:border-accent-amber focus:outline-none"
                  >
                    <option value="vnd">🇻🇳 VND</option>
                    <option value="usd">🇺🇸 USD</option>
                  </select>
                  <Icon
                    icon="lucide:chevron-down"
                    class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-text-dim"
                  />
                </div>
              </div>
            </div>

            <!-- Swap + current rate -->
            <div class="my-4 flex flex-wrap items-center gap-3">
              <button
                class="flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-accent-amber hover:text-accent-amber"
                @click="swapCrypto"
              >
                <Icon icon="lucide:arrow-up-down" class="size-3.5" />
                Đảo chiều
              </button>

              <div v-if="cryptoPrices" class="text-xs text-text-dim">
                1 {{ getCoin(selectedCoin).symbol }} ≈
                <span class="font-semibold text-accent-amber">
                  {{
                    new Intl.NumberFormat('vi-VN').format(
                      cryptoPrices[selectedCoin]?.[cryptoTargetCurrency] ?? 0,
                    )
                  }}
                  {{ cryptoTargetCurrency.toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Result row -->
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="mb-1 block font-display text-xs tracking-wide text-text-dim">
                  {{ cryptoReversed ? 'Số lượng crypto nhận được' : 'Tương đương' }}
                </label>
                <div
                  class="flex min-h-[52px] items-center border border-border-default bg-bg-deep px-4 py-3"
                >
                  <template v-if="cryptoLoading && !cryptoPrices">
                    <div class="h-6 w-32 animate-pulse bg-bg-elevated" />
                  </template>
                  <template v-else-if="cryptoConvertResult !== null">
                    <span class="font-display text-xl font-semibold text-accent-amber">
                      {{ formatCryptoAmount(cryptoConvertResult) }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-text-dim">—</span>
                  </template>
                </div>
              </div>

              <div class="w-36 shrink-0">
                <label class="mb-1 block font-display text-xs tracking-wide text-text-dim">
                  {{ cryptoReversed ? 'Đồng crypto' : 'Đơn vị fiat' }}
                </label>
                <div class="relative">
                  <select
                    v-if="cryptoReversed"
                    v-model="selectedCoin"
                    class="w-full cursor-pointer appearance-none border border-border-default bg-bg-deep px-3 py-3 pr-8 font-display text-sm text-text-primary focus:border-accent-amber focus:outline-none"
                  >
                    <option v-for="c in COINS" :key="c.id" :value="c.id">
                      {{ c.symbol }}
                    </option>
                  </select>
                  <select
                    v-else
                    v-model="cryptoTargetCurrency"
                    class="w-full cursor-pointer appearance-none border border-border-default bg-bg-deep px-3 py-3 pr-8 font-display text-sm text-text-primary focus:border-accent-amber focus:outline-none"
                  >
                    <option value="vnd">🇻🇳 VND</option>
                    <option value="usd">🇺🇸 USD</option>
                  </select>
                  <Icon
                    icon="lucide:chevron-down"
                    class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-text-dim"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Crypto note + refresh -->
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-dim">
          <Icon icon="lucide:info" class="size-3" />
          Dữ liệu từ CoinGecko API (miễn phí, có thể chậm giờ cao điểm)
          <button
            class="ml-2 flex items-center gap-1 transition-colors hover:text-accent-sky"
            :disabled="cryptoLoading"
            @click="fetchCryptoPrices"
          >
            <Icon
              icon="lucide:refresh-cw"
              class="size-3"
              :class="cryptoLoading ? 'animate-spin' : ''"
            />
            Làm mới
          </button>
        </div>
      </div>

      <!-- ── Footer ── -->
      <footer
        class="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-4 text-xs text-text-dim"
      >
        <span>Được tạo bởi <span class="font-semibold text-text-primary">Hachi Tu</span></span>
        <div class="flex gap-3">
          <a
            href="https://github.com/hachitubg"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:github" class="size-3.5" /> GitHub
          </a>
          <a
            href="https://www.facebook.com/tuhachiz/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:facebook" class="size-3.5" /> Facebook
          </a>
        </div>
      </footer>
    </div>
  </div>
</template>
