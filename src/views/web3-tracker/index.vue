<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useWeb3Scanner, networksInfo } from './composables/useWeb3Scanner'
import { RouterLink } from 'vue-router'
import BackToTop from '@/components/BackToTop.vue'

const {
  isScanning,
  stats,
  error,
  scanProgress,
  scanWallets,
  currentScanningNet,
  networkStatuses,
  moralisApiKey,
  updateApiKey,
} = useWeb3Scanner()

const addressInput = ref('')
const apiKeyInput = ref(moralisApiKey.value)
const showSettings = ref(!moralisApiKey.value)
const selectedNetworkId = ref('all')

const formatUSD = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val)
}

const isUrlLogo = (logo: string) => {
  return logo?.startsWith('http')
}

const rememberWallets = ref(localStorage.getItem('vibe_remember_wallets') === 'true')
const savedWallets = ref(localStorage.getItem('vibe_saved_wallets') || '')

// Load saved wallets on init
if (rememberWallets.value && savedWallets.value) {
  addressInput.value = savedWallets.value
}

const handleScan = () => {
  if (rememberWallets.value) {
    localStorage.setItem('vibe_saved_wallets', addressInput.value)
  }
  scanWallets(addressInput.value)
}

const toggleRemember = () => {
  rememberWallets.value = !rememberWallets.value
  localStorage.setItem('vibe_remember_wallets', String(rememberWallets.value))
  if (!rememberWallets.value) {
    localStorage.removeItem('vibe_saved_wallets')
  } else {
    localStorage.setItem('vibe_saved_wallets', addressInput.value)
  }
}

const clearSavedWallets = () => {
  addressInput.value = ''
  localStorage.removeItem('vibe_saved_wallets')
}

const handleSaveKey = () => {
  updateApiKey(apiKeyInput.value)
  if (apiKeyInput.value) showSettings.value = false
}

// Stats computed
const totalNetWorth = computed(() => stats.value?.totalValue || 0)
const change24h = computed(() => stats.value?.change24h || 0)
const changePercent = computed(() => {
  if (!stats.value || stats.value.totalValue === 0) return 0
  const prevValue = stats.value.totalValue - stats.value.change24h
  if (prevValue === 0) return 0
  return (stats.value.change24h / prevValue) * 100
})

const selectedWallet = ref('all')

const activeWallets = computed(() => {
  if (!stats.value) return []
  const addrs = new Set(stats.value.assets.map((a) => a.ownerAddress).filter(Boolean))
  return Array.from(addrs) as string[]
})

const filteredAssets = computed(() => {
  if (!stats.value) return []
  let assets = stats.value.assets
  if (selectedNetworkId.value !== 'all') {
    assets = assets.filter((a) => a.network === selectedNetworkId.value)
  }
  if (selectedWallet.value !== 'all') {
    assets = assets.filter((a) => a.ownerAddress === selectedWallet.value)
  }
  return assets
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden">
    <!-- Header Section (Editorial Style) -->
    <header class="relative max-w-5xl mx-auto px-6 pt-20 pb-12 w-full">
      <!-- Issue Badge -->
      <div
        class="absolute top-8 right-6 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 z-10 shadow-[4px_4px_0px_rgba(255,107,74,0.2)]"
      >
        VOL.01 / 2026
      </div>

      <!-- Home Navigation -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-all mb-8 group"
      >
        <div
          class="w-8 h-px bg-text-dim group-hover:w-12 group-hover:bg-accent-coral transition-all"
        ></div>
        <span class="font-display text-[10px] tracking-widest uppercase">Trở về trang chủ</span>
      </RouterLink>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div class="space-y-4">
          <h1
            class="font-display text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none animate-fade-up"
          >
            Web3<span class="text-accent-coral">.</span>Tracker
          </h1>
          <p
            class="max-w-xl text-text-secondary text-lg leading-relaxed animate-fade-up animate-delay-2 border-l-2 border-accent-amber pl-6"
          >
            Truy vấn tài sản mã hóa đa chuỗi<br />
            <span class="font-bold">{{ networksInfo.length }} mạng lưới Blockchain phổ biến</span>
          </p>
        </div>
      </div>

      <!-- Dot Divider -->
      <div class="flex gap-1.5 mt-12 animate-fade-up animate-delay-3">
        <span v-for="n in 30" :key="n" class="w-1.5 h-1.5 rounded-full bg-border-default/50" />
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 pb-16">
      <!-- Search Section -->
      <section class="mb-12 animate-fade-up animate-delay-4">
        <div
          class="border border-border-default bg-bg-surface p-1 shadow-[8px_8px_0px_rgba(255,107,74,0.1)]"
        >
          <div class="p-6 md:p-10 space-y-6">
            <h2
              class="font-display text-2xl font-semibold text-text-primary flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Nhập địa chỉ ví
            </h2>

            <div class="relative flex flex-col md:flex-row gap-4">
              <div class="flex-1 relative">
                <textarea
                  v-model="addressInput"
                  placeholder="Dán địa chỉ ví 0x... (cách nhau bởi dấu phẩy hoặc xuống dòng)"
                  class="w-full h-32 md:h-24 bg-bg-deep border border-border-default p-4 text-sm font-mono text-text-primary placeholder:text-text-dim/50 focus:outline-none focus:border-accent-coral transition-colors resize-none"
                ></textarea>
                <!-- Progress Line -->
                <div
                  v-if="isScanning"
                  class="absolute bottom-0 left-0 h-1 bg-accent-coral transition-all duration-300"
                  :style="{ width: `${scanProgress}%` }"
                ></div>
              </div>

              <button
                @click="handleScan"
                :disabled="isScanning"
                class="bg-accent-coral text-bg-deep font-display font-bold uppercase tracking-widest text-sm px-10 py-4 hover:bg-white transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shrink-0"
              >
                <Icon v-if="isScanning" icon="lucide:loader-2" class="w-5 h-5 animate-spin" />
                <Icon v-else icon="lucide:radar" class="w-5 h-5" />
                {{ isScanning ? 'Đang quét' : 'Truy vấn' }}
              </button>
            </div>

            <!-- Persistent Wallets Controls -->
            <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                @click="toggleRemember"
                class="flex items-center gap-2 group cursor-pointer select-none"
              >
                <div
                  class="w-5 h-5 border-2 flex items-center justify-center transition-all duration-300"
                  :class="
                    rememberWallets
                      ? 'border-accent-amber bg-accent-amber'
                      : 'border-border-default bg-transparent group-hover:border-accent-amber'
                  "
                >
                  <Icon
                    v-if="rememberWallets"
                    icon="lucide:check"
                    class="w-3.5 h-3.5 text-bg-deep"
                  />
                </div>
                <span
                  class="text-[10px] font-display font-bold uppercase tracking-widest transition-colors"
                  :class="
                    rememberWallets
                      ? 'text-text-primary'
                      : 'text-text-dim group-hover:text-text-primary'
                  "
                >
                  Ghi nhớ địa chỉ ví cho lần sau
                </span>
              </button>

              <button
                v-if="addressInput"
                @click="clearSavedWallets"
                class="text-[9px] font-display font-bold uppercase tracking-[0.2em] text-text-dim hover:text-accent-coral transition-colors flex items-center gap-1.5"
              >
                <Icon icon="lucide:trash-2" class="w-3 h-3" />
                Xóa nhanh
              </button>
            </div>

            <!-- API Key Settings Section -->
            <div class="pt-6 border-t border-border-default/30 space-y-4">
              <div class="flex items-center justify-between">
                <button
                  @click="showSettings = !showSettings"
                  class="text-[10px] tracking-[0.2em] font-display uppercase font-bold text-text-secondary hover:text-accent-amber transition-colors flex items-center gap-2"
                >
                  <Icon icon="lucide:settings-2" class="w-3.5 h-3.5" />
                  {{ showSettings ? 'Đóng cài đặt' : 'Cấu hình Moralis API' }}
                </button>

                <!-- <div class="text-[10px] text-text-dim/50 italic tracking-widest hidden md:block">
                  READY TO SCAN
                </div> -->
              </div>

              <div v-if="showSettings" class="space-y-3 animate-fade-in">
                <div
                  class="flex flex-col md:flex-row gap-3 p-4 bg-bg-deep border border-dashed border-border-default"
                >
                  <div class="flex-1 space-y-2">
                    <label class="text-[10px] font-display tracking-widest font-bold"
                      >Moralis API Key</label
                    >
                    <input
                      v-model="apiKeyInput"
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                      class="w-full bg-bg-surface border border-border-default p-3 text-sm font-mono focus:outline-none focus:border-accent-coral transition-colors"
                    />
                  </div>
                  <button
                    @click="handleSaveKey"
                    class="self-end bg-accent-amber text-bg-deep hover:bg-white transition-all px-6 py-3 font-display font-bold uppercase text-[10px] tracking-widest"
                  >
                    Lưu Key
                  </button>
                </div>

                <!-- Usage Info & Dashboard Link -->
                <div
                  v-if="showSettings"
                  class="p-4 bg-bg-surface/30 border border-border-default flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div class="flex-1 space-y-2">
                    <div
                      class="text-[10px] text-accent-amber font-display font-black uppercase tracking-widest flex items-center gap-2"
                    >
                      <Icon icon="lucide:info" class="w-3.5 h-3.5" />
                      Thông tin hạn mức API
                    </div>
                    <p class="text-xs text-text-secondary leading-relaxed">
                      Moralis đã ngừng cung cấp thông tin hạn mức trực tiếp qua API. Để kiểm tra số
                      Compute Units (CU) đã dùng hoặc còn lại, vui lòng truy cập Dashboard cá nhân
                      của bạn
                    </p>
                  </div>

                  <a
                    href="https://admin.moralis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-bg-deep border border-accent-amber/30 text-accent-amber hover:bg-accent-amber hover:text-bg-deep transition-all duration-300 font-display font-bold text-[10px] uppercase tracking-widest"
                  >
                    Moralis Dashboard
                    <Icon icon="lucide:external-link" class="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <!-- Error Message Display -->
              <div
                v-if="error"
                class="pt-4 text-accent-coral text-xs font-display tracking-wide animate-pulse flex items-center gap-2 border-t border-border-default/10"
              >
                <Icon icon="lucide:info" class="w-4 h-4" />
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Scanning State -->
      <section
        v-if="isScanning"
        class="py-24 flex flex-col items-center justify-center space-y-12 animate-fade-in relative overflow-hidden"
      >
        <!-- Background decorative elements -->
        <div class="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-accent-coral/20 rounded-full animate-ping [animation-duration:4s]"
          ></div>
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-accent-amber/10 rounded-full animate-ping [animation-duration:6s]"
          ></div>
        </div>

        <!-- Radar/Scanner Display -->
        <div class="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
          <!-- Circular Progress Ring -->
          <svg
            class="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(255,107,74,0.3)]"
          >
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              class="text-border-default/20"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="square"
              style="
                stroke-dasharray: 283%;
                stroke-dashoffset: 283%;
                transition: stroke-dashoffset 0.5s ease-out;
              "
              :style="{ strokeDashoffset: `${283 - (283 * scanProgress) / 100}%` }"
              class="text-accent-coral"
            />
          </svg>

          <!-- Rotating Radar Sweep -->
          <div
            class="absolute inset-[5%] rounded-full bg-gradient-to-tr from-accent-coral/20 via-transparent to-transparent animate-spin [animation-duration:3s] origin-center"
          ></div>

          <!-- Inner Geometric Elements -->
          <div
            class="absolute inset-[15%] border border-border-default/30 rounded-full flex items-center justify-center"
          >
            <div
              class="absolute inset-0 border border-accent-amber/20 rounded-full animate-pulse"
            ></div>

            <!-- Central Progress Text -->
            <div class="relative z-10 flex flex-col items-center">
              <div
                class="font-display text-7xl md:text-8xl font-black tracking-tighter text-text-primary flex items-baseline leading-none"
              >
                {{ scanProgress
                }}<span class="text-accent-coral text-2xl md:text-3xl ml-1 font-bold">%</span>
              </div>
              <div class="mt-4 px-4 py-1 bg-accent-coral/10 border border-accent-coral/20">
                <span
                  class="font-display text-[10px] tracking-[0.4em] text-accent-coral uppercase font-bold"
                  >Scanning</span
                >
              </div>
            </div>
          </div>

          <!-- Dynamic Target Dots (Visual noise) -->
          <div
            v-for="n in 6"
            :key="n"
            class="absolute w-1.5 h-1.5 bg-accent-amber rounded-sm animate-pulse opacity-40"
            :style="{
              top: `${15 + Math.random() * 70}%`,
              left: `${15 + Math.random() * 70}%`,
              animationDelay: `${n * 0.5}s`,
            }"
          ></div>
        </div>

        <!-- Progress Information -->
        <div class="max-w-md w-full space-y-8 text-center relative z-20">
          <div class="space-y-3">
            <div class="flex items-center justify-center gap-4">
              <span class="h-px w-12 bg-border-default"></span>
              <h3
                class="font-display text-sm font-bold tracking-[0.2em] text-text-primary uppercase"
              >
                ĐANG TRUY VẤN DỮ LIỆU
              </h3>
              <span class="h-px w-12 bg-border-default"></span>
            </div>

            <div class="flex flex-col items-center gap-1.5">
              <div
                class="text-[10px] font-mono text-accent-amber uppercase tracking-widest flex items-center gap-2"
              >
                <span class="relative flex h-2 w-2">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-amber opacity-75"
                  ></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-accent-amber"></span>
                </span>
                Connection: LIVE
              </div>
              <div class="min-h-[1.5rem] flex items-center justify-center">
                <Transition name="fade" mode="out-in">
                  <p :key="currentScanningNet" class="text-xs text-text-secondary font-body italic">
                    Đang quét mạng:
                    <span class="text-text-primary font-bold not-italic font-display">{{
                      currentScanningNet || '...'
                    }}</span>
                  </p>
                </Transition>
              </div>
            </div>
          </div>

          <!-- Horizontal Progress Bar (Editorial style) -->
          <div class="space-y-2">
            <div
              class="flex justify-between text-[8px] font-display font-bold text-text-dim tracking-widest uppercase"
            >
              <span>0% START</span>
              <span>100% COMPLETE</span>
            </div>
            <div class="h-1 bg-border-default/30 w-full overflow-hidden relative">
              <div
                class="h-full bg-accent-coral transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,107,74,0.5)]"
                :style="{ width: `${scanProgress}%` }"
              ></div>
            </div>
          </div>

          <!-- Enhanced Network Checklist Grid -->
          <div class="mt-12 grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div
              v-for="net in networksInfo"
              :key="net.id"
              class="flex flex-col items-center gap-2 p-3 border transition-all duration-300 relative overflow-hidden"
              :class="[
                networkStatuses[net.id] === 'done'
                  ? 'border-accent-amber/40 bg-accent-amber/5'
                  : networkStatuses[net.id] === 'scanning'
                    ? 'border-accent-coral bg-accent-coral/10'
                    : 'border-border-default/20 opacity-30',
              ]"
            >
              <div class="relative z-10">
                <Icon
                  :icon="net.icon"
                  class="w-5 h-5"
                  :style="{
                    color: networkStatuses[net.id] === 'pending' ? '#666' : net.color,
                  }"
                />
              </div>
              <span
                class="relative z-10 text-[8px] font-display font-bold uppercase tracking-tighter truncate w-full text-center"
              >
                {{ net.name }}
              </span>

              <!-- Status bar bottom -->
              <div class="absolute bottom-0 left-0 w-full h-0.5 bg-border-default/10">
                <div
                  v-if="networkStatuses[net.id] === 'done'"
                  class="h-full bg-accent-amber w-full"
                ></div>
                <div
                  v-if="networkStatuses[net.id] === 'scanning'"
                  class="h-full bg-accent-coral w-full animate-pulse"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Results Section -->
      <div v-else-if="stats" class="space-y-16 animate-fade-up">
        <!-- Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Portfolio Value -->
          <div
            class="lg:col-span-2 border border-border-default bg-bg-surface p-10 relative overflow-hidden group hover:border-accent-coral transition-all duration-300"
          >
            <span
              class="absolute top-3 right-4 font-display text-7xl font-bold text-accent-coral/5 select-none pointer-events-none"
              >01</span
            >

            <div class="flex flex-col gap-6">
              <h3
                class="font-display text-lg font-semibold text-text-secondary uppercase tracking-[0.2em]"
              >
                TỔNG GIÁ TRỊ TÀI SẢN
              </h3>
              <div class="space-y-2">
                <div
                  class="text-6xl md:text-7xl font-display font-bold text-text-primary tracking-tighter"
                >
                  {{ formatUSD(totalNetWorth) }}
                </div>
                <div class="flex items-center gap-3 font-display text-sm">
                  <span
                    :class="change24h >= 0 ? 'text-accent-amber' : 'text-accent-coral'"
                    class="font-bold"
                  >
                    {{ change24h >= 0 ? '+' : '' }}{{ formatUSD(change24h) }}
                  </span>
                  <span class="text-text-dim">({{ changePercent.toFixed(2) }}%)</span>
                  <span
                    class="bg-border-default px-2 py-0.5 text-[10px] text-text-secondary uppercase font-bold tracking-widest"
                    >24H MARKET</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Network Summary Card -->
          <div class="border border-border-default bg-bg-surface p-8 space-y-6">
            <h3
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-2"
            >
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              PHÂN BỔ CHUỖI
            </h3>
            <div class="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="net in stats.networks" :key="net.id" class="group flex flex-col gap-1.5">
                <div class="flex justify-between text-xs font-display text-text-secondary">
                  <span class="flex items-center gap-2">
                    <Icon :icon="net.icon" :style="{ color: net.color }" />
                    {{ net.name }}
                  </span>
                  <span class="text-text-primary">
                    {{ formatUSD(net.value) }}
                    <span class="text-[10px] text-text-dim ml-1"
                      >({{ ((net.value / totalNetWorth) * 100).toFixed(1) }}%)</span
                    >
                  </span>
                </div>
                <div class="h-1 bg-border-default overflow-hidden">
                  <div
                    class="h-full bg-accent-amber transition-all duration-500"
                    :style="{ width: `${(net.value / totalNetWorth) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Asset List Section -->
        <section class="space-y-8">
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-default pb-6"
          >
            <h2 class="font-display text-3xl font-bold text-text-primary flex items-center gap-3">
              <span class="text-accent-coral font-display text-lg tracking-widest">//</span>
              DANH MỤC TOKEN
            </h2>

            <div class="flex flex-col gap-4">
              <div class="flex flex-wrap gap-2">
                <button
                  @click="selectedNetworkId = 'all'"
                  class="px-4 py-2 text-[10px] font-display font-bold uppercase tracking-widest transition-all ring-1 ring-inset"
                  :class="
                    selectedNetworkId === 'all'
                      ? 'bg-accent-coral text-bg-deep ring-accent-coral'
                      : 'bg-bg-surface text-text-secondary ring-border-default/30 hover:ring-accent-coral'
                  "
                >
                  Tất cả mạng
                </button>
                <button
                  v-for="net in stats.networks"
                  :key="net.id"
                  @click="selectedNetworkId = net.id"
                  class="px-4 py-2 text-[10px] font-display font-bold uppercase tracking-widest transition-all flex items-center gap-2 ring-1 ring-inset"
                  :class="
                    selectedNetworkId === net.id
                      ? 'bg-accent-coral text-bg-deep ring-accent-coral'
                      : 'bg-bg-surface text-text-secondary ring-border-default/30 hover:ring-accent-coral font-bold'
                  "
                >
                  <Icon :icon="net.icon" />
                  {{ net.name }}
                </button>
              </div>

              <!-- Wallet Filter (Visible if multiple wallets) -->
              <div v-if="activeWallets.length > 1" class="flex flex-wrap items-center gap-3">
                <span
                  class="text-[9px] font-display font-black uppercase tracking-widest text-text-dim"
                  >Ví:</span
                >
                <button
                  @click="selectedWallet = 'all'"
                  class="px-3 py-1 text-[9px] font-bold uppercase tracking-tighter border-b-2 transition-all"
                  :class="
                    selectedWallet === 'all'
                      ? 'border-accent-amber text-accent-amber'
                      : 'border-transparent text-text-dim hover:text-text-primary'
                  "
                >
                  Toàn bộ
                </button>
                <button
                  v-for="addr in activeWallets"
                  :key="addr"
                  @click="selectedWallet = addr"
                  class="px-3 py-1 text-[9px] font-bold uppercase tracking-tighter border-b-2 transition-all"
                  :class="
                    selectedWallet === addr
                      ? 'border-accent-amber text-accent-amber'
                      : 'border-transparent text-text-dim hover:text-text-primary'
                  "
                >
                  {{ addr.slice(0, 6) }}...{{ addr.slice(-4) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Token List -->
          <div class="grid grid-cols-1 gap-4">
            <div
              v-for="(asset, idx) in filteredAssets"
              :key="asset.symbol + idx"
              class="border border-border-default bg-bg-surface p-6 flex flex-col md:flex-row items-center gap-6 group hover:bg-bg-elevated transition-colors duration-300"
            >
              <div class="flex items-center gap-4 w-full md:w-1/3">
                <div
                  class="w-12 h-12 bg-bg-deep border border-border-default flex items-center justify-center p-2 relative shrink-0 overflow-hidden"
                >
                  <img
                    v-if="isUrlLogo(asset.logo)"
                    :src="asset.logo"
                    class="w-full h-full object-contain"
                    @error="
                      (e) =>
                        ((e.target as HTMLImageElement).src =
                          'https://api.iconify.design/lucide:circle-dollar-sign.svg?color=%23888888')
                    "
                  />
                  <Icon v-else :icon="asset.logo" class="w-full h-full text-text-primary" />

                  <div
                    class="absolute -right-2 -top-2 w-5 h-5 border border-border-default flex items-center justify-center bg-bg-surface z-10 shadow-sm"
                    :title="asset.network"
                  >
                    <Icon
                      :icon="networksInfo.find((n) => n.id === asset.network)?.icon || 'lucide:box'"
                      class="w-3 h-3"
                      :style="{ color: networksInfo.find((n) => n.id === asset.network)?.color }"
                    />
                  </div>
                </div>
                <div class="overflow-hidden">
                  <div
                    class="font-display font-bold text-xl text-text-primary group-hover:text-accent-coral transition-colors"
                  >
                    {{ asset.symbol }}
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <div
                      class="text-[9px] text-text-dim truncate font-body uppercase tracking-wider"
                    >
                      {{ asset.name }}
                    </div>
                    <div
                      v-if="asset.ownerAddress"
                      class="text-[8px] bg-bg-deep px-1.5 py-0.5 font-mono text-text-dim/80 border border-border-default"
                      :title="asset.ownerAddress"
                    >
                      {{ asset.ownerAddress.slice(0, 4) }}...{{ asset.ownerAddress.slice(-4) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col md:items-end gap-1 w-full md:w-1/4">
                <div class="font-mono text-sm text-text-primary">
                  ${{
                    asset.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })
                  }}
                </div>
                <div
                  v-if="asset.priceChange24h"
                  :class="asset.priceChange24h >= 0 ? 'text-accent-amber' : 'text-accent-coral'"
                  class="text-[10px] font-bold font-display"
                >
                  {{ asset.priceChange24h >= 0 ? '+' : '' }}{{ asset.priceChange24h.toFixed(2) }}%
                </div>
              </div>

              <div class="flex flex-col md:items-end gap-1 w-full md:w-1/4">
                <div class="font-display font-medium text-text-primary">
                  {{ asset.balance.toLocaleString(undefined, { maximumFractionDigits: 6 }) }}
                </div>
                <div class="text-[10px] text-text-dim uppercase font-bold tracking-widest">
                  Balance
                </div>
              </div>

              <div class="flex flex-col items-end gap-1 ml-auto shrink-0 pr-2">
                <div class="font-display font-bold text-2xl text-accent-amber">
                  {{ formatUSD(asset.value) }}
                </div>
                <div class="text-[10px] text-text-dim uppercase font-bold tracking-widest">
                  {{ ((asset.value / totalNetWorth) * 100).toFixed(1) }}% Portfolio
                </div>
              </div>

              <div
                class="hidden md:block w-0 group-hover:w-1 bg-accent-coral h-12 transition-all duration-300 ml-4"
              ></div>
            </div>
          </div>
        </section>
      </div>

      <!-- Welcome State -->
      <section v-else class="py-12 animate-fade-up animate-delay-2">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="(feature, i) in [
              {
                icon: 'lucide:shield-check',
                title: 'Privacy First',
                text: 'Toàn bộ dữ liệu được truy vấn công khai. Không yêu cầu Connect Wallet hay Private Key',
              },
              {
                icon: 'lucide:zap',
                title: 'Deep Discovery',
                text: `Tự động quét hàng trăm token trên ${networksInfo.length} chuỗi phổ biến (ETH, BSC, Base, Polygon...)`,
              },
              {
                icon: 'lucide:bar-chart-3',
                title: 'Real-time Bias',
                text: 'Cập nhật giá từ On-chain Indexer để có cái nhìn tài sản chính xác nhất',
              },
            ]"
            :key="i"
            class="border border-border-default bg-bg-surface p-8 space-y-4 hover:border-accent-coral transition-colors duration-300"
          >
            <Icon :icon="feature.icon" class="w-10 h-10 text-accent-coral" />
            <h3 class="font-display text-xl font-bold text-text-primary uppercase tracking-tight">
              {{ feature.title }}
            </h3>
            <p class="text-text-secondary text-sm leading-relaxed">{{ feature.text }}</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="bg-bg-surface border-t border-border-default py-16 px-6 mt-12">
      <div class="max-w-5xl mx-auto space-y-6">
        <div class="font-display font-bold text-3xl text-text-primary tracking-tighter">
          Web3<span class="text-accent-coral">.</span>Tracker
        </div>
        <p class="text-text-secondary text-sm leading-loose">
          Công cụ theo dõi danh mục đầu tư phi tập trung đa chuỗi mạnh mẽ, bảo mật và hiệu suất cao
        </p>
      </div>
    </footer>

    <BackToTop />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #253549;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #ff6b4a;
}

.animate-fade-up {
  animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-delay-1 {
  animation-delay: 0.1s;
}
.animate-delay-2 {
  animation-delay: 0.2s;
}
.animate-delay-3 {
  animation-delay: 0.3s;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
@keyframes progress-loop {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
