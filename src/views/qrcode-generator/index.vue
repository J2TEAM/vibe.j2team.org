<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { refDebounced } from '@vueuse/core'
import { useQrStore } from './composables/qr-store'
import {
  generateQrSvg,
  generateQrDataUrl,
  PATTERNS,
  MARKERS_IN,
  MARKERS_OUT,
} from './utils/qr-utils'

const store = useQrStore()

// Local state for UI
const qrSvg = ref('')
const qrDataUrl = ref('')
const isGenerating = ref(false)
const debouncedContent = refDebounced(
  computed(() => store.content),
  200,
)

const validationError = computed(() => {
  if (store.contentType === 'link') {
    if (!store.linkUrl) return 'Please enter a URL'
    try {
      new URL(store.linkUrl)
      return null
    } catch {
      return 'Invalid URL (please include http:// or https://)'
    }
  }

  if (store.contentType === 'email') {
    if (!store.emailData.address) return 'Please enter recipient email'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(store.emailData.address)) return 'Invalid email'
    return null
  }

  if (store.contentType === 'phone') {
    if (!store.phoneNum) return 'Please enter phone number'
    const phoneRegex = /^\+?[\d\s-]{8,}$/
    if (!phoneRegex.test(store.phoneNum)) return 'Invalid phone number'
    return null
  }

  if (store.contentType === 'sms') {
    if (!store.smsData.phone) return 'Please enter recipient phone number'
    const phoneRegex = /^\+?[\d\s-]{8,}$/
    if (!phoneRegex.test(store.smsData.phone)) return 'Invalid phone number'
    return null
  }

  if (store.contentType === 'wifi') {
    if (!store.wifiData.ssid) return 'Please enter network name (SSID)'
    return null
  }

  if (store.contentType === 'text') {
    if (!store.content) return 'Please enter content'
    return null
  }

  return null
})

const updateQrCode = async () => {
  if (validationError.value || !debouncedContent.value) {
    qrSvg.value = ''
    qrDataUrl.value = ''
    return
  }

  isGenerating.value = true
  try {
    const options = {
      color: {
        dark: store.color,
        light: store.background,
      },
      width: store.size,
      errorCorrectionLevel: store.ecl,
      logo: store.logo,
      markerOut: store.markerOut,
      markerIn: store.markerIn,
      pattern: store.pattern,
      frame: {
        type: store.frameType,
        text: store.frameText,
        textSize: store.frameTextSize,
        color: store.frameColor,
      },
    }

    // Generate both for preview and download
    const [svg, dataUrl] = await Promise.all([
      generateQrSvg(debouncedContent.value, options),
      generateQrDataUrl(debouncedContent.value, options),
    ])

    qrSvg.value = svg
    qrDataUrl.value = dataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
  } finally {
    isGenerating.value = false
  }
}

const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    store.logo = e.target?.result as string
    // Auto set ECL to High for better scannability when logo is added
    store.ecl = 'H'
  }
  reader.readAsDataURL(file)
}

const removeLogo = () => {
  store.logo = null
}

// Sync specialized fields to store.content
watch(
  [
    () => store.contentType,
    () => store.linkUrl,
    () => store.emailData,
    () => store.phoneNum,
    () => store.smsData,
    () => store.wifiData,
  ],
  () => {
    if (store.contentType === 'link') {
      store.content = store.linkUrl
    } else if (store.contentType === 'email') {
      const { address, subject, body } = store.emailData
      if (!address) {
        store.content = ''
        return
      }
      store.content = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    } else if (store.contentType === 'phone') {
      if (!store.phoneNum) {
        store.content = ''
        return
      }
      store.content = `tel:${store.phoneNum}`
    } else if (store.contentType === 'sms') {
      const { phone, message } = store.smsData
      if (!phone) {
        store.content = ''
        return
      }
      store.content = `sms:${phone}?body=${encodeURIComponent(message)}`
    } else if (store.contentType === 'wifi') {
      const { ssid, password, encryption } = store.wifiData
      if (!ssid) {
        store.content = ''
        return
      }
      store.content = `WIFI:S:${ssid};T:${encryption};P:${password};;`
    }
  },
  { deep: true },
)

// Watchers for real-time update
watch(
  [
    debouncedContent,
    validationError,
    () => store.color,
    () => store.background,
    () => store.size,
    () => store.ecl,
    () => store.logo,
    () => store.markerOut,
    () => store.markerIn,
    () => store.pattern,
    () => store.frameType,
    () => store.frameText,
    () => store.frameTextSize,
    () => store.frameColor,
  ],
  () => {
    updateQrCode()
  },
)

onMounted(() => {
  // Initialize linkUrl with current content if link is default
  if (store.contentType === 'link' && store.content) {
    store.linkUrl = store.content
  }
  updateQrCode()
})

const downloadSvg = () => {
  if (!qrSvg.value) return
  const blob = new Blob([qrSvg.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `qrcode-${Date.now()}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadPng = () => {
  if (!qrDataUrl.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = `qrcode-${Date.now()}.png`
  a.click()
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <!-- Navbar -->
      <nav class="flex items-center justify-between mb-8 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:home" class="size-4" />
          <span class="hidden sm:inline">Home</span>
        </RouterLink>

        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
        >
          VOL.01 / 2026
        </div>
      </nav>

      <!-- Header -->
      <header class="mb-10 text-center text-[#FF6B4A]">
        <div class="flex gap-1.5 justify-center mb-4">
          <span v-for="n in 20" :key="n" class="w-1.5 h-1.5 rounded-full bg-border-default/20" />
        </div>

        <h1
          class="font-display text-4xl sm:text-7xl font-bold uppercase tracking-tighter animate-fade-up"
        >
          QR Code <span class="text-white">Gen</span>
        </h1>
        <p
          class="mt-4 text-text-secondary text-lg max-w-xl mx-auto animate-fade-up animate-delay-2"
        >
          Professional QR generator with
          <span class="underline decoration-accent-coral">custom styling</span>
          and frame support.
        </p>

        <div class="flex gap-1.5 justify-center mt-4">
          <span v-for="n in 20" :key="n" class="w-1.5 h-1.5 rounded-full bg-border-default/20" />
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Input & Options Panel -->
        <div class="lg:col-span-7 space-y-8">
          <!-- Input Card -->
          <section class="animate-fade-up animate-delay-3">
            <h2
              class="font-display text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-4"
            >
              <span class="text-accent-coral">//</span> 01 CONTENT
            </h2>
            <div class="border border-border-default bg-bg-surface group">
              <!-- Content Tabs -->
              <div class="flex overflow-x-auto border-b border-border-default bg-bg-elevated/30">
                <button
                  v-for="type in ['link', 'text', 'email', 'phone', 'sms', 'wifi'] as const"
                  :key="type"
                  @click="store.contentType = type"
                  class="px-6 py-4 text-[10px] font-display font-bold uppercase tracking-widest transition border-b-2 relative whitespace-nowrap"
                  :class="
                    store.contentType === type
                      ? 'text-accent-coral border-accent-coral bg-bg-surface'
                      : 'text-text-dim border-transparent hover:text-text-secondary'
                  "
                >
                  <Icon v-if="type === 'link'" icon="lucide:link" class="inline-block mr-2" />
                  <Icon v-else-if="type === 'text'" icon="lucide:type" class="inline-block mr-2" />
                  <Icon v-else-if="type === 'email'" icon="lucide:mail" class="inline-block mr-2" />
                  <Icon
                    v-else-if="type === 'phone'"
                    icon="lucide:phone"
                    class="inline-block mr-2"
                  />
                  <Icon
                    v-else-if="type === 'sms'"
                    icon="lucide:message-square"
                    class="inline-block mr-2"
                  />
                  <Icon v-else-if="type === 'wifi'" icon="lucide:wifi" class="inline-block mr-2" />
                  {{ type }}
                </button>
              </div>

              <div class="p-6">
                <!-- Link Form -->
                <div v-if="store.contentType === 'link'" class="space-y-4 animate-fade-in">
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider"
                      >URL *</label
                    >
                    <input
                      v-model="store.linkUrl"
                      type="url"
                      placeholder="https://j2team.org/"
                      class="w-full bg-bg-elevated border p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition font-mono"
                      :class="
                        store.contentType === 'link' && validationError
                          ? 'border-red-500/50'
                          : 'border-border-default'
                      "
                    />
                    <p
                      v-if="store.contentType === 'link' && validationError"
                      class="text-[10px] text-red-400 mt-1 uppercase tracking-tight"
                    >
                      {{ validationError }}
                    </p>
                  </div>
                </div>

                <!-- Text Form -->
                <div v-else-if="store.contentType === 'text'" class="animate-fade-in">
                  <textarea
                    v-model="store.content"
                    rows="4"
                    placeholder="Type your message here..."
                    class="w-full bg-bg-elevated border p-4 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none transition resize-none font-mono"
                    :class="
                      store.contentType === 'text' && validationError
                        ? 'border-red-500/50'
                        : 'border-border-default'
                    "
                  ></textarea>
                  <p
                    v-if="store.contentType === 'text' && validationError"
                    class="text-[10px] text-red-400 mt-1 uppercase tracking-tight"
                  >
                    {{ validationError }}
                  </p>
                </div>

                <!-- Email Form -->
                <div v-else-if="store.contentType === 'email'" class="space-y-4 animate-fade-in">
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider"
                      >Recipient Email *</label
                    >
                    <input
                      v-model="store.emailData.address"
                      type="email"
                      placeholder="recipient@example.com"
                      class="w-full bg-bg-elevated border p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                      :class="
                        store.contentType === 'email' && validationError
                          ? 'border-red-500/50'
                          : 'border-border-default'
                      "
                    />
                    <p
                      v-if="store.contentType === 'email' && validationError"
                      class="text-[10px] text-red-400 mt-1 uppercase tracking-tight"
                    >
                      {{ validationError }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider"
                      >Subject</label
                    >
                    <input
                      v-model="store.emailData.subject"
                      type="text"
                      placeholder="Email subject"
                      class="w-full bg-bg-elevated border border-border-default p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider">Body</label>
                    <textarea
                      v-model="store.emailData.body"
                      rows="3"
                      placeholder="Email message..."
                      class="w-full bg-bg-elevated border border-border-default p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition resize-none"
                    ></textarea>
                  </div>
                </div>

                <!-- Phone Form -->
                <div v-else-if="store.contentType === 'phone'" class="space-y-4 animate-fade-in">
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider"
                      >Phone Number *</label
                    >
                    <input
                      v-model="store.phoneNum"
                      type="tel"
                      placeholder="+84..."
                      class="w-full bg-bg-elevated border p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                      :class="
                        store.contentType === 'phone' && validationError
                          ? 'border-red-500/50'
                          : 'border-border-default'
                      "
                    />
                    <p
                      v-if="store.contentType === 'phone' && validationError"
                      class="text-[10px] text-red-400 mt-1 uppercase tracking-tight"
                    >
                      {{ validationError }}
                    </p>
                  </div>
                </div>

                <!-- SMS Form -->
                <div v-else-if="store.contentType === 'sms'" class="space-y-4 animate-fade-in">
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider"
                      >Recipient Phone *</label
                    >
                    <input
                      v-model="store.smsData.phone"
                      type="tel"
                      placeholder="+84..."
                      class="w-full bg-bg-elevated border p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                      :class="
                        store.contentType === 'sms' && validationError
                          ? 'border-red-500/50'
                          : 'border-border-default'
                      "
                    />
                    <p
                      v-if="store.contentType === 'sms' && validationError"
                      class="text-[10px] text-red-400 mt-1 uppercase tracking-tight"
                    >
                      {{ validationError }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider"
                      >Message</label
                    >
                    <textarea
                      v-model="store.smsData.message"
                      rows="3"
                      placeholder="Your SMS message..."
                      class="w-full bg-bg-elevated border border-border-default p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition resize-none"
                    ></textarea>
                  </div>
                </div>

                <!-- Wifi Form -->
                <div v-else-if="store.contentType === 'wifi'" class="space-y-4 animate-fade-in">
                  <div class="space-y-2">
                    <label class="block text-text-dim text-xs uppercase tracking-wider"
                      >SSID (Network Name) *</label
                    >
                    <input
                      v-model="store.wifiData.ssid"
                      type="text"
                      placeholder="My WiFi Network"
                      class="w-full bg-bg-elevated border p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                      :class="
                        store.contentType === 'wifi' && validationError
                          ? 'border-red-500/50'
                          : 'border-border-default'
                      "
                    />
                    <p
                      v-if="store.contentType === 'wifi' && validationError"
                      class="text-[10px] text-red-400 mt-1 uppercase tracking-tight"
                    >
                      {{ validationError }}
                    </p>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="block text-text-dim text-xs uppercase tracking-wider"
                        >Password</label
                      >
                      <input
                        v-model="store.wifiData.password"
                        type="password"
                        placeholder="••••••••"
                        class="w-full bg-bg-elevated border border-border-default p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="block text-text-dim text-xs uppercase tracking-wider"
                        >Encryption</label
                      >
                      <select
                        v-model="store.wifiData.encryption"
                        class="w-full bg-bg-elevated border border-border-default p-4 text-sm text-text-primary focus:border-accent-coral focus:outline-none transition"
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">No Encryption</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Styling Card -->
          <section class="animate-fade-up animate-delay-4">
            <h2
              class="font-display text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-4"
            >
              <span class="text-accent-amber">//</span> 02 APPEARANCE
            </h2>
            <div class="border border-border-default bg-bg-surface p-6 space-y-8">
              <!-- Grid controls -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <!-- Color & Size -->
                <div class="space-y-6">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                        >QR Color</label
                      >
                      <div class="flex items-center gap-2">
                        <input
                          type="color"
                          v-model="store.color"
                          class="size-8 bg-transparent border-none cursor-pointer"
                        />
                        <span class="text-[10px] uppercase font-mono text-text-secondary">{{
                          store.color
                        }}</span>
                      </div>
                    </div>
                    <div>
                      <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                        >Background</label
                      >
                      <div class="flex items-center gap-2">
                        <input
                          type="color"
                          v-model="store.background"
                          class="size-8 bg-transparent border-none cursor-pointer"
                        />
                        <span class="text-[10px] uppercase font-mono text-text-secondary">{{
                          store.background
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                      >Size: {{ store.size }}px</label
                    >
                    <input
                      type="range"
                      v-model.number="store.size"
                      min="128"
                      max="512"
                      step="32"
                      class="w-full"
                    />
                  </div>
                </div>

                <!-- ECL & Logo -->
                <div class="space-y-6">
                  <div>
                    <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                      >Error Correction Level (ECL)</label
                    >
                    <div class="flex bg-bg-elevated border border-border-default p-0.5">
                      <button
                        v-for="level in ['L', 'M', 'Q', 'H']"
                        :key="level"
                        @click="store.ecl = level as any"
                        class="flex-1 py-2 text-[10px] font-bold transition"
                        :class="
                          store.ecl === level
                            ? 'bg-accent-coral text-white'
                            : 'text-text-dim hover:text-text-primary'
                        "
                      >
                        {{ level }}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                      >Logo Overlay</label
                    >
                    <div class="flex items-center gap-4">
                      <div
                        v-if="store.logo"
                        class="size-12 border border-border-default p-1 relative group/logo"
                      >
                        <img :src="store.logo" class="size-full object-contain" />
                        <button
                          @click="removeLogo"
                          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <Icon icon="lucide:x" class="size-3" />
                        </button>
                      </div>
                      <label
                        v-else
                        class="size-12 border-2 border-dashed border-border-default hover:border-accent-coral transition cursor-pointer flex items-center justify-center text-text-dim hover:text-accent-coral"
                      >
                        <input
                          type="file"
                          class="hidden"
                          accept="image/*"
                          @change="handleLogoUpload"
                        />
                        <Icon icon="lucide:image-plus" class="size-4" />
                      </label>
                      <p class="text-[10px] text-text-dim leading-tight">
                        Center logo. ECL H is auto-selected.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Module Pattern Selection -->
              <div class="space-y-4 pt-6 border-t border-border-default">
                <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-4"
                  >Module Pattern</label
                >
                <div class="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    v-for="(data, key) in PATTERNS"
                    :key="key"
                    @click="store.pattern = key"
                    class="size-10 sm:size-12 flex items-center justify-center p-2 sm:p-2.5 transition border group relative"
                    :class="
                      store.pattern === key
                        ? 'bg-accent-coral/10 border-accent-coral shadow-[0_0_10px_rgba(255,107,74,0.2)]'
                        : 'bg-bg-elevated border-border-default hover:border-text-dim'
                    "
                  >
                    <svg
                      viewBox="0 0 6 6"
                      class="size-full fill-current"
                      :class="store.pattern === key ? 'text-accent-coral' : 'text-text-primary'"
                    >
                      <path :d="data.path"></path>
                    </svg>
                    <div
                      class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                    ></div>
                  </button>
                </div>
              </div>

              <!-- Finder Shape (Outer) Selection -->
              <div class="space-y-4 pt-6 border-t border-border-default">
                <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-4"
                  >Finder Shape (Outer)</label
                >
                <div class="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    v-for="(data, key) in MARKERS_OUT"
                    :key="key"
                    @click="store.markerOut = key"
                    class="size-10 sm:size-12 flex items-center justify-center p-2 sm:p-2.5 transition border group relative"
                    :class="
                      store.markerOut === key
                        ? 'bg-accent-coral/10 border-accent-coral shadow-[0_0_10px_rgba(255,107,74,0.2)]'
                        : 'bg-bg-elevated border-border-default hover:border-text-dim'
                    "
                  >
                    <svg
                      viewBox="0 0 14 14"
                      class="size-full fill-current"
                      :class="store.markerOut === key ? 'text-accent-coral' : 'text-text-primary'"
                    >
                      <path :d="data.path"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Finder Shape (Inner) Selection -->
              <div class="space-y-4 pt-6 border-t border-border-default">
                <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-4"
                  >Finder Shape (Inner)</label
                >
                <div class="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    v-for="(data, key) in MARKERS_IN"
                    :key="key"
                    @click="store.markerIn = key"
                    class="size-10 sm:size-12 flex items-center justify-center p-2 sm:p-2.5 transition border group relative"
                    :class="
                      store.markerIn === key
                        ? 'bg-accent-coral/10 border-accent-coral shadow-[0_0_10px_rgba(255,107,74,0.2)]'
                        : 'bg-bg-elevated border-border-default hover:border-text-dim'
                    "
                  >
                    <svg
                      viewBox="0 0 6 6"
                      class="size-full fill-current"
                      :class="store.markerIn === key ? 'text-accent-coral' : 'text-text-primary'"
                    >
                      <path :d="data.path"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Frame Style -->
              <div class="space-y-6 pt-6 border-t border-border-default">
                <div>
                  <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-3"
                    >Frame Type</label
                  >
                  <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    <button
                      v-for="f in [
                        'none',
                        'bottom',
                        'top',
                        'box',
                        'banner-top',
                        'banner-bottom',
                        'border',
                      ]"
                      :key="f"
                      @click="store.frameType = f as any"
                      class="py-2 text-[9px] font-bold uppercase tracking-tight border truncate transition"
                      :class="
                        store.frameType === f
                          ? 'bg-accent-coral border-accent-coral text-white'
                          : 'bg-bg-elevated border-border-default text-text-dim hover:text-text-primary'
                      "
                    >
                      {{ f }}
                    </button>
                  </div>
                </div>

                <div v-if="store.frameType !== 'none'" class="space-y-4 animate-fade-in">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="sm:col-span-2">
                      <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                        >Frame Label</label
                      >
                      <input
                        v-model="store.frameText"
                        type="text"
                        placeholder="SCAN ME"
                        class="w-full bg-bg-elevated border border-border-default p-3 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                        >Text Size: {{ store.frameTextSize }}%</label
                      >
                      <input
                        type="range"
                        v-model.number="store.frameTextSize"
                        min="50"
                        max="150"
                        step="10"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-text-dim text-[10px] uppercase tracking-wider mb-2"
                        >Frame Color</label
                      >
                      <div class="flex items-center gap-2">
                        <input
                          type="color"
                          v-model="store.frameColor"
                          class="size-8 bg-transparent border-none cursor-pointer"
                        />
                        <span class="text-[10px] uppercase font-mono text-text-secondary">{{
                          store.frameColor
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Preview Panel -->
        <div class="lg:col-span-5 sticky top-6">
          <section class="animate-fade-up animate-delay-5">
            <h2
              class="font-display text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-4"
            >
              <span class="text-accent-sky">//</span> 03 RESULT
            </h2>
            <div class="border border-border-default bg-bg-surface p-10 flex flex-col items-center">
              <!-- QR Preview -->
              <div
                class="bg-white p-2 flex items-center justify-center relative shadow-2xl transition-transform hover:scale-[1.02]"
                style="background: white"
              >
                <div v-if="!store.content" class="text-center p-12 space-y-3">
                  <Icon icon="lucide:qr-code" class="size-16 text-slate-100 mx-auto" />
                  <p class="text-slate-300 text-xs font-display tracking-widest uppercase">
                    Waiting for input...
                  </p>
                </div>
                <div
                  v-else-if="isGenerating"
                  class="absolute inset-0 bg-white/90 flex items-center justify-center z-10"
                >
                  <Icon icon="lucide:loader-2" class="size-10 text-accent-coral animate-spin" />
                </div>
                <div v-html="qrSvg" class="max-w-full h-auto"></div>
              </div>

              <!-- Actions -->
              <div class="w-full mt-10 grid grid-cols-2 gap-4">
                <button
                  @click="downloadPng"
                  :disabled="!qrDataUrl"
                  class="flex items-center justify-center gap-3 border-2 border-accent-coral bg-transparent py-4 text-xs font-display font-bold uppercase tracking-widest text-accent-coral transition hover:bg-accent-coral hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Icon icon="lucide:image" class="size-4" />
                  PNG Download
                </button>
                <button
                  @click="downloadSvg"
                  :disabled="!qrSvg"
                  class="flex items-center justify-center gap-3 border-2 border-accent-sky bg-transparent py-4 text-xs font-display font-bold uppercase tracking-widest text-accent-sky transition hover:bg-accent-sky hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Icon icon="lucide:code" class="size-4" />
                  SVG Download
                </button>
              </div>

              <div
                class="mt-8 flex items-center gap-2 text-text-dim text-[10px] tracking-widest uppercase"
              >
                <Icon icon="lucide:zap" class="size-3 text-accent-amber" />
                Ready to scan · High scannability
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Footer -->
      <footer
        class="mt-20 pt-10 border-t border-border-default/50 text-center animate-fade-up animate-delay-7"
      >
        <div class="flex flex-col sm:flex-row items-center justify-center gap-8">
          <RouterLink
            to="/"
            class="group text-[10px] font-display font-bold uppercase tracking-widest text-text-secondary hover:text-accent-coral transition flex items-center gap-2"
          >
            <Icon
              icon="lucide:arrow-left"
              class="size-3 transition-transform group-hover:-translate-x-1"
            />
            Vibe Home
          </RouterLink>
          <button
            @click="scrollToTop"
            class="text-[10px] font-display font-bold uppercase tracking-widest text-text-secondary hover:text-accent-sky transition flex items-center gap-2"
          >
            Top of Page
            <Icon icon="lucide:arrow-up" class="size-3" />
          </button>
        </div>
        <div
          class="mt-10 text-[9px] text-text-dim/30 font-display tracking-[0.3em] uppercase max-w-sm mx-auto leading-relaxed"
        >
          Crafted for J2TEAM · Client-side processing only · No data persists on servers · Vibe
          Coding 2026
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Custom range slider thumb */
input[type='range'] {
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.05);
  height: 4px;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 12px;
  width: 12px;
  background: #ff6b4a;
  cursor: pointer;
  border-radius: 0;
}
input[type='range']::-moz-range-thumb {
  height: 12px;
  width: 12px;
  background: #ff6b4a;
  cursor: pointer;
  border-radius: 0;
  border: none;
}
</style>
