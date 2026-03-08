<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

// =============================================
// CẤU HÌNH: Google Apps Script Web App URL
// =============================================
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzHmRsc3yNOpBFAV17yb1JpmBSI5fU1oSf_f38_HbCyuKIcCgfmt3pgdD3IUJjNxJE/exec'

interface Wish {
  id: string
  timestamp: string
  user: string
  content: string
}

const wishes = ref<Wish[]>([])
const newWish = ref('')
const userName = ref('Guest_Dev')
const isIncenseBurning = ref(false)
const incenseTimeout = ref<number | null>(null)
const isSyncing = ref(false)
const syncStatus = ref<'idle' | 'syncing' | 'success' | 'error' | 'offline'>('idle')
const totalPrayers = computed(() => wishes.value.length)
const isGoogleScriptConfigured = computed(() => SCRIPT_URL.length > 0)

// === VFX States ===
const showFireworks = ref(false)
const showBlessingText = ref(false)
const blessingMessage = ref('')
const screenShake = ref(false)
const goldenBurst = ref(false)
const particles = ref<{ id: number; x: number; y: number; emoji: string; delay: number }[]>([])

// API Helpers
async function sendToSheet(body: object) {
  if (!isGoogleScriptConfigured.value) return null
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    })
    return { success: true }
  } catch (error) {
    console.warn('Google Script POST failed:', error)
    return null
  }
}

async function fetchFromSheet(): Promise<{ success: boolean; wishes?: Wish[] } | null> {
  if (!isGoogleScriptConfigured.value) return null
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getAll`, {
      method: 'GET',
      redirect: 'follow',
    })
    if (response.ok) return await response.json()
    return null
  } catch (error) {
    console.warn('Google Script GET failed:', error)
    return null
  }
}

const saveToLocal = () => {
  localStorage.setItem('it_altar_wishes', JSON.stringify(wishes.value))
}

onMounted(async () => {
  const savedWishes = localStorage.getItem('it_altar_wishes')
  if (savedWishes) wishes.value = JSON.parse(savedWishes)

  if (isGoogleScriptConfigured.value) {
    syncStatus.value = 'syncing'
    try {
      const result = await fetchFromSheet()
      if (result?.success && Array.isArray(result.wishes) && result.wishes.length > 0) {
        wishes.value = result.wishes
        saveToLocal()
      }
      syncStatus.value = 'success'
    } catch {
      syncStatus.value = 'error'
    }
  } else {
    syncStatus.value = 'offline'
  }
})

// === TRIGGER VFX EXPLOSION ===
function triggerExplosion() {
  // 1. Screen shake
  screenShake.value = true
  setTimeout(() => (screenShake.value = false), 600)

  // 2. Golden burst
  goldenBurst.value = true
  setTimeout(() => (goldenBurst.value = false), 2000)

  // 3. Fireworks particles
  showFireworks.value = true
  const emojis = ['🙏', '✨', '🔥', '💫', '⭐', '🕯️', '💛', '🌟', '☁️', '🧧']
  particles.value = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    delay: Math.random() * 1.5,
  }))
  setTimeout(() => {
    showFireworks.value = false
    particles.value = []
  }, 4000)

  // 4. Blessing text
  const messages = [
    '🙏 Nguyện ước đã được gửi đến Server Thần Linh!',
    '✨ Lời cầu nguyện đang bay lên Cloud Thiên Đàng!',
    '🔥 Request đã được accept bởi Thần Linh API!',
    '💫 200 OK — Phước lành đã được response!',
    '⭐ Commit thành công! Merge vào nhánh Thiên Đàng!',
    '🕯️ Pipeline Thần Linh đang deploy phước lành...',
  ]
  blessingMessage.value = messages[Math.floor(Math.random() * messages.length)]
  showBlessingText.value = true
  setTimeout(() => (showBlessingText.value = false), 4000)
}

const commitWish = async () => {
  if (!newWish.value.trim()) return

  const wish: Wish = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleString('vi-VN'),
    user: userName.value || 'Anonymous',
    content: newWish.value,
  }

  wishes.value.unshift(wish)
  newWish.value = ''
  saveToLocal()

  // Thắp nhang + trigger VFX
  isIncenseBurning.value = true
  if (incenseTimeout.value) clearTimeout(incenseTimeout.value)
  incenseTimeout.value = window.setTimeout(() => {
    isIncenseBurning.value = false
  }, 30000)

  triggerExplosion()

  // Gửi lên Google Sheet
  if (isGoogleScriptConfigured.value) {
    isSyncing.value = true
    syncStatus.value = 'syncing'
    const result = await sendToSheet({
      action: 'add',
      id: wish.id,
      user: wish.user,
      content: wish.content,
      userAgent: navigator.userAgent,
    })
    syncStatus.value = result ? 'success' : 'error'
    isSyncing.value = false
  }
}

const clearWishes = async () => {
  if (confirm('Bạn có chắc muốn xóa sạch sớ nguyện này?')) {
    wishes.value = []
    saveToLocal()
    if (isGoogleScriptConfigured.value) await sendToSheet({ action: 'clear' })
  }
}

const exportToCSV = () => {
  const headers = ['ID', 'Timestamp', 'User', 'Content']
  const rows = wishes.value.map((w) => [w.id, w.timestamp, w.user, w.content])
  const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', 'VIBE_LUCK_DATABASE.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div
    class="altar-page min-h-screen bg-bg-deep text-text-primary font-body relative overflow-hidden"
    :class="{ 'animate-shake': screenShake }"
  >
    <!-- ===== FIREWORKS OVERLAY ===== -->
    <Transition name="fade-vfx">
      <div v-if="showFireworks" class="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <div
          v-for="p in particles"
          :key="p.id"
          class="particle-burst absolute text-2xl"
          :style="{ left: p.x + '%', top: p.y + '%', animationDelay: p.delay + 's' }"
        >
          {{ p.emoji }}
        </div>
      </div>
    </Transition>

    <!-- ===== GOLDEN BURST OVERLAY ===== -->
    <Transition name="fade-vfx">
      <div
        v-if="goldenBurst"
        class="fixed inset-0 z-40 pointer-events-none golden-burst-overlay"
      ></div>
    </Transition>

    <!-- ===== BLESSING TEXT ===== -->
    <Transition name="blessing-text">
      <div
        v-if="showBlessingText"
        class="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
      >
        <div
          class="blessing-banner px-8 py-4 bg-bg-surface/90 backdrop-blur-md border-2 border-accent-amber/50 shadow-[0_0_60px_rgba(255,184,48,0.4)] text-center"
        >
          <p class="text-accent-amber font-display text-xl md:text-2xl font-bold tracking-wide">
            {{ blessingMessage }}
          </p>
        </div>
      </div>
    </Transition>

    <!-- ===== AMBIENT BACKGROUND ===== -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-radial-gradient from-accent-amber/[0.04] via-transparent to-transparent"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-[500px] h-[400px] bg-radial-gradient from-accent-coral/[0.03] via-transparent to-transparent"
      ></div>
      <div
        class="absolute inset-0 opacity-[0.02]"
        style="
          background-image:
            linear-gradient(rgba(255, 184, 48, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 184, 48, 0.3) 1px, transparent 1px);
          background-size: 60px 60px;
        "
      ></div>
    </div>

    <div class="relative z-10 px-4 py-12 flex flex-col items-center">
      <!-- ===== HEADER ===== -->
      <header class="text-center mb-12 max-w-3xl animate-fade-up">
        <div
          class="inline-flex items-center gap-2 bg-bg-surface/80 backdrop-blur-sm border border-border-default px-4 py-1.5 mb-6 text-[10px] font-mono text-text-dim tracking-wider"
        >
          <span class="w-2 h-2 rounded-full bg-accent-coral animate-pulse"></span>
          <span>SYSTEM:</span>
          <span class="text-accent-amber">ALTAR_SERVICE</span>
          <span class="text-text-dim">|</span>
          <span
            >PRAYERS: <span class="text-accent-sky">{{ totalPrayers }}</span></span
          >
          <span class="text-text-dim">|</span>
          <Icon
            icon="mdi:database"
            :class="syncStatus === 'success' ? 'text-green-400' : 'text-text-dim'"
          />
          <span v-if="syncStatus === 'success'" class="text-green-400">Synced</span>
          <span v-else-if="syncStatus === 'syncing'" class="text-accent-amber">Syncing...</span>
          <span v-else class="text-text-dim">Local</span>
        </div>

        <div class="flex items-center justify-center gap-4 mb-4">
          <div class="h-[1px] w-16 bg-gradient-to-r from-transparent to-accent-amber/50"></div>
          <Icon icon="mdi:fire" class="text-accent-amber text-3xl animate-pulse" />
          <h1
            class="font-display text-4xl md:text-6xl font-bold text-accent-coral uppercase tracking-tighter leading-none"
          >
            Bàn Thờ Cầu May IT
          </h1>
          <Icon icon="mdi:fire" class="text-accent-amber text-3xl animate-pulse" />
          <div class="h-[1px] w-16 bg-gradient-to-l from-transparent to-accent-amber/50"></div>
        </div>

        <p class="text-text-secondary text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          Nơi những developer gửi gắm lời cầu nguyện. <br />
          Mỗi lần
          <code
            class="text-accent-sky bg-accent-sky/10 px-1.5 py-0.5 text-sm border border-accent-sky/20"
            >commit</code
          >
          là một lần tâm nguyện bay lên Server Thần Linh!
        </p>
      </header>

      <!-- ===== MAIN ALTAR SECTION ===== -->
      <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6 mb-16 items-start">
        <!-- ====== ALTAR (3 cols) ====== -->
        <div class="lg:col-span-3 relative animate-fade-up animate-delay-1">
          <div
            class="altar-card relative bg-gradient-to-b from-bg-surface to-bg-deep border border-accent-amber/15 p-8 pb-6 flex flex-col items-center overflow-visible"
            :class="{ 'altar-glow': isIncenseBurning }"
          >
            <div
              class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-amber/30"
            ></div>
            <div
              class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-amber/30"
            ></div>
            <div
              class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-amber/30"
            ></div>
            <div
              class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-amber/30"
            ></div>

            <div class="absolute inset-0 pointer-events-none">
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-64 h-64 bg-radial-gradient from-accent-amber/[0.08] via-transparent to-transparent"
                :class="{ 'animate-pulse': isIncenseBurning }"
              ></div>
            </div>

            <div class="self-start mb-6 flex items-center gap-2">
              <span class="text-accent-coral font-mono text-xs">&lt;!--</span>
              <span class="text-text-dim font-mono text-xs uppercase tracking-widest"
                >Digital Altar v2.0</span
              >
              <span class="text-accent-coral font-mono text-xs">--&gt;</span>
            </div>

            <!-- ==> ALTAR SCENE <== -->
            <div class="relative flex items-end gap-8 mb-6" style="min-height: 220px">
              <!-- LEFT CANDLE -->
              <div class="candle-wrapper flex flex-col items-center z-10">
                <div class="relative">
                  <div
                    v-if="isIncenseBurning"
                    class="absolute -top-5 left-1/2 -translate-x-1/2 candle-flame-container"
                  >
                    <div class="candle-flame-outer"></div>
                    <div class="candle-flame-inner"></div>
                    <div class="candle-glow"></div>
                  </div>
                  <div class="w-[2px] h-2 bg-gray-800 mx-auto rounded-full"></div>
                  <div
                    class="w-5 h-28 bg-gradient-to-b from-[#cc3333] via-[#b02020] to-[#801515] rounded-t-sm rounded-b-[3px] shadow-[inset_-3px_0_6px_rgba(0,0,0,0.3),inset_3px_0_6px_rgba(255,255,255,0.1)]"
                  ></div>
                  <div
                    class="absolute top-6 -left-[1px] w-[3px] h-4 bg-[#d44] rounded-b-full opacity-60"
                  ></div>
                </div>
                <div
                  class="w-10 h-2 bg-gradient-to-b from-[#FFB830] to-[#c9922a] rounded-sm shadow-md"
                ></div>
                <div
                  class="w-12 h-1.5 bg-gradient-to-b from-[#c9922a] to-[#8a6420] rounded-b-sm shadow-md"
                ></div>
              </div>

              <!-- BURNER + INCENSE -->
              <div class="relative flex flex-col items-center" style="width: 240px; height: 200px">
                <!-- HALO GLOW (behind incense) -->
                <div
                  v-if="isIncenseBurning"
                  class="absolute z-5 pointer-events-none"
                  style="bottom: 100px; left: 50%; transform: translateX(-50%)"
                >
                  <div class="incense-halo"></div>
                </div>

                <!-- SMOKE (multi-layered) -->
                <Transition name="fade-smoke">
                  <div
                    v-if="isIncenseBurning"
                    class="absolute z-10 pointer-events-none"
                    style="bottom: 130px; left: 50%; transform: translateX(-50%)"
                  >
                    <div class="smoke-wisp smoke-wisp-1"></div>
                    <div class="smoke-wisp smoke-wisp-2"></div>
                    <div class="smoke-wisp smoke-wisp-3"></div>
                    <div class="smoke-wisp smoke-wisp-4"></div>
                    <div class="smoke-wisp smoke-wisp-5"></div>
                    <!-- Extra curling tendrils -->
                    <div class="smoke-tendril smoke-tendril-1"></div>
                    <div class="smoke-tendril smoke-tendril-2"></div>
                    <div class="smoke-tendril smoke-tendril-3"></div>
                  </div>
                </Transition>

                <!-- HEAT SHIMMER -->
                <div
                  v-if="isIncenseBurning"
                  class="absolute z-15 pointer-events-none heat-shimmer"
                  style="
                    bottom: 110px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 80px;
                  "
                ></div>

                <!-- INCENSE STICKS -->
                <Transition name="slide-incense">
                  <div
                    v-if="isIncenseBurning"
                    class="absolute z-30 flex items-end gap-[6px]"
                    style="bottom: 90px; left: 50%; transform: translateX(-50%)"
                  >
                    <!-- Stick 1 -->
                    <div class="incense-stick" style="transform: rotate(-4deg)">
                      <div class="incense-ember">
                        <div class="spark spark-1"></div>
                        <div class="spark spark-2"></div>
                        <div class="spark spark-3"></div>
                      </div>
                      <div class="incense-body"></div>
                      <div class="incense-ash"></div>
                    </div>
                    <!-- Stick 2 (center) -->
                    <div class="incense-stick">
                      <div class="incense-ember">
                        <div class="spark spark-1" style="animation-delay: 0.3s"></div>
                        <div class="spark spark-2" style="animation-delay: 0.8s"></div>
                        <div class="spark spark-3" style="animation-delay: 1.5s"></div>
                      </div>
                      <div class="incense-body"></div>
                      <div class="incense-ash"></div>
                    </div>
                    <!-- Stick 3 -->
                    <div class="incense-stick" style="transform: rotate(4deg)">
                      <div class="incense-ember">
                        <div class="spark spark-1" style="animation-delay: 0.6s"></div>
                        <div class="spark spark-2" style="animation-delay: 1.2s"></div>
                        <div class="spark spark-3" style="animation-delay: 2s"></div>
                      </div>
                      <div class="incense-body"></div>
                      <div class="incense-ash"></div>
                    </div>
                  </div>
                </Transition>

                <!-- IGNITION FLASH (appears briefly when incense first lights) -->
                <Transition name="ignition-flash">
                  <div
                    v-if="isIncenseBurning"
                    class="absolute z-35 pointer-events-none ignition-burst"
                    style="bottom: 130px; left: 50%; transform: translateX(-50%)"
                  ></div>
                </Transition>

                <!-- BURNER SVG -->
                <div
                  class="absolute z-20"
                  style="bottom: 0; left: 50%; transform: translateX(-50%); width: 200px"
                >
                  <svg
                    viewBox="0 0 200 130"
                    class="w-full"
                    style="filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.5))"
                  >
                    <defs>
                      <linearGradient id="burner-body" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#e8ddd0" />
                        <stop offset="30%" stop-color="#f5efe5" />
                        <stop offset="70%" stop-color="#d4c8b8" />
                        <stop offset="100%" stop-color="#b8a898" />
                      </linearGradient>
                      <radialGradient id="burner-inner" cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stop-color="#1a1a2e" />
                        <stop offset="100%" stop-color="#0d0d1a" />
                      </radialGradient>
                      <linearGradient id="gold-rim" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#c9922a" />
                        <stop offset="30%" stop-color="#FFD700" />
                        <stop offset="50%" stop-color="#FFB830" />
                        <stop offset="70%" stop-color="#FFD700" />
                        <stop offset="100%" stop-color="#c9922a" />
                      </linearGradient>
                      <radialGradient id="ash-fill" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#8a8070" />
                        <stop offset="100%" stop-color="#6a6050" />
                      </radialGradient>
                    </defs>
                    <ellipse cx="100" cy="125" rx="70" ry="6" fill="black" opacity="0.3" />
                    <rect
                      x="60"
                      y="110"
                      width="80"
                      height="10"
                      rx="2"
                      fill="url(#gold-rim)"
                      opacity="0.8"
                    />
                    <rect x="65" y="112" width="70" height="6" rx="1" fill="#1a2535" />
                    <path
                      d="M30 40 Q30 15, 100 15 Q170 15, 170 40 L165 95 Q165 115, 100 115 Q35 115, 35 95 Z"
                      fill="url(#burner-body)"
                      stroke="#b8a898"
                      stroke-width="0.5"
                    />
                    <path
                      d="M30 40 Q30 15, 60 18 L38 95 Q36 110, 50 112 Z"
                      fill="black"
                      opacity="0.08"
                    />
                    <ellipse cx="100" cy="38" rx="72" ry="10" fill="url(#gold-rim)" />
                    <ellipse cx="100" cy="38" rx="60" ry="7" fill="url(#burner-inner)" />
                    <ellipse cx="100" cy="39" rx="55" ry="5" fill="url(#ash-fill)" opacity="0.6" />
                    <g opacity="0.25">
                      <path
                        d="M100 90 Q90 75 100 58 Q110 75 100 90"
                        fill="none"
                        stroke="#c4956a"
                        stroke-width="1.2"
                      />
                      <path
                        d="M85 88 Q78 75 90 62"
                        fill="none"
                        stroke="#c4956a"
                        stroke-width="0.8"
                      />
                      <path
                        d="M115 88 Q122 75 110 62"
                        fill="none"
                        stroke="#c4956a"
                        stroke-width="0.8"
                      />
                    </g>
                  </svg>
                </div>
              </div>

              <!-- RIGHT CANDLE -->
              <div class="candle-wrapper flex flex-col items-center z-10">
                <div class="relative">
                  <div
                    v-if="isIncenseBurning"
                    class="absolute -top-5 left-1/2 -translate-x-1/2 candle-flame-container"
                  >
                    <div class="candle-flame-outer"></div>
                    <div class="candle-flame-inner"></div>
                    <div class="candle-glow"></div>
                  </div>
                  <div class="w-[2px] h-2 bg-gray-800 mx-auto rounded-full"></div>
                  <div
                    class="w-5 h-28 bg-gradient-to-b from-[#cc3333] via-[#b02020] to-[#801515] rounded-t-sm rounded-b-[3px] shadow-[inset_-3px_0_6px_rgba(0,0,0,0.3),inset_3px_0_6px_rgba(255,255,255,0.1)]"
                  ></div>
                  <div
                    class="absolute top-8 -right-[1px] w-[3px] h-5 bg-[#d44] rounded-b-full opacity-60"
                  ></div>
                </div>
                <div
                  class="w-10 h-2 bg-gradient-to-b from-[#FFB830] to-[#c9922a] rounded-sm shadow-md"
                ></div>
                <div
                  class="w-12 h-1.5 bg-gradient-to-b from-[#c9922a] to-[#8a6420] rounded-b-sm shadow-md"
                ></div>
              </div>
            </div>

            <!-- Offerings -->
            <div class="flex gap-8 mt-2 z-10">
              <div
                v-for="item in [
                  {
                    icon: 'mdi:coffee',
                    label: 'Caffeine',
                    color: 'text-accent-sky',
                    tip: 'Linh hồn của cả team',
                  },
                  {
                    icon: 'mdi:book-open-page-variant',
                    label: 'Clean Code',
                    color: 'text-accent-amber',
                    tip: 'Kinh thánh Developer',
                  },
                  {
                    icon: 'mdi:currency-usd',
                    label: 'Revenue',
                    color: 'text-accent-coral',
                    tip: 'Lương về đúng hạn',
                  },
                ]"
                :key="item.label"
                class="flex flex-col items-center group cursor-help"
                :title="item.tip"
              >
                <div
                  class="w-12 h-12 rounded-lg bg-bg-deep/50 border border-border-default flex items-center justify-center group-hover:border-accent-amber/50 group-hover:bg-bg-elevated transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                >
                  <Icon :icon="item.icon" :class="[item.color, 'text-xl drop-shadow-lg']" />
                </div>
                <span
                  class="text-[8px] text-text-dim mt-1.5 font-display uppercase tracking-[0.2em]"
                  >{{ item.label }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- ====== WISH INPUT (2 cols) ====== -->
        <div class="lg:col-span-2 animate-fade-up animate-delay-2">
          <div
            class="bg-gradient-to-b from-bg-surface to-bg-deep border border-border-default p-6 relative"
          >
            <div
              class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent-coral/30"
            ></div>
            <div
              class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent-coral/30"
            ></div>

            <div class="flex items-center gap-2 mb-5">
              <span class="text-accent-coral font-mono text-xs">//</span>
              <h2 class="font-display text-xl font-semibold uppercase tracking-wide">
                Viết sớ nguyện
              </h2>
            </div>

            <div class="space-y-4">
              <div>
                <label
                  class="block text-[10px] uppercase tracking-[0.15em] text-text-dim mb-1.5 font-mono"
                >
                  <Icon icon="mdi:account-cowboy-hat" class="inline text-accent-amber mr-1" />Cư sĩ
                  (Dev Name)
                </label>
                <input
                  v-model="userName"
                  type="text"
                  placeholder="Nhập pháp danh..."
                  class="w-full bg-bg-deep/70 border border-border-default px-4 py-2.5 text-text-primary text-sm focus:border-accent-coral focus:shadow-[0_0_0_1px_rgba(255,107,74,0.3)] outline-none transition-all font-mono rounded-sm"
                />
              </div>

              <div>
                <label
                  class="block text-[10px] uppercase tracking-[0.15em] text-text-dim mb-1.5 font-mono"
                >
                  <Icon icon="mdi:script-text" class="inline text-accent-amber mr-1" />Lời cầu
                  nguyện
                </label>
                <textarea
                  v-model="newWish"
                  placeholder="Ví dụ: Cầu cho sprint này không OT..."
                  rows="4"
                  class="w-full bg-bg-deep/70 border border-border-default px-4 py-2.5 text-text-primary text-sm focus:border-accent-coral focus:shadow-[0_0_0_1px_rgba(255,107,74,0.3)] outline-none transition-all resize-none rounded-sm"
                ></textarea>
              </div>

              <button
                @click="commitWish"
                class="commit-btn w-full bg-gradient-to-r from-accent-coral to-accent-coral/80 hover:from-accent-coral/90 hover:to-accent-coral/70 text-bg-deep font-display font-bold py-3.5 transition-all uppercase tracking-widest flex items-center justify-center gap-2 group text-sm rounded-sm shadow-[0_4px_15px_rgba(255,107,74,0.3)] hover:shadow-[0_6px_20px_rgba(255,107,74,0.4)] active:scale-95"
              >
                <Icon
                  icon="mdi:hand-heart"
                  class="text-lg group-hover:scale-125 transition-transform duration-300"
                />
                🙏 Khai lễ — Dâng sớ nguyện
                <Icon
                  icon="mdi:arrow-right"
                  class="text-lg group-hover:translate-x-1 transition-transform duration-300"
                />
              </button>
            </div>

            <div class="mt-4 p-3 bg-bg-deep/50 border border-border-default/50 rounded-sm">
              <p class="text-[10px] font-mono text-text-dim leading-relaxed">
                <span class="text-accent-amber">TIP:</span> Nhấn
                <span class="text-accent-coral">Khai lễ</span> để thắp hương, nến bùng cháy và lời
                nguyện sẽ được gửi lên Google Sheet tự động!
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== PRAYERS LOG ===== -->
      <div class="w-full max-w-5xl animate-fade-up animate-delay-3">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-1 h-6 bg-accent-amber rounded-full"></div>
            <h2 class="font-display text-xl font-semibold uppercase tracking-wide">
              Sổ cầu nguyện
            </h2>
            <span
              class="text-[10px] font-mono text-text-dim bg-bg-surface px-2 py-0.5 border border-border-default rounded-sm"
              >{{ totalPrayers }} lời nguyện</span
            >
          </div>
          <div class="flex gap-3">
            <button
              @click="exportToCSV"
              class="flex items-center gap-1.5 text-[10px] font-mono uppercase px-3 py-1.5 border border-accent-amber/30 text-accent-amber hover:bg-accent-amber/10 transition-all rounded-sm"
            >
              <Icon icon="mdi:file-excel" class="text-sm" /> Export
            </button>
            <button
              @click="clearWishes"
              class="flex items-center gap-1.5 text-[10px] font-mono uppercase px-3 py-1.5 border border-accent-coral/30 text-text-dim hover:text-accent-coral hover:bg-accent-coral/10 transition-all rounded-sm"
            >
              <Icon icon="mdi:trash-can-outline" class="text-sm" /> Xóa
            </button>
          </div>
        </div>

        <div
          class="overflow-x-auto border border-border-default bg-bg-deep rounded-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)]"
        >
          <table class="w-full text-left text-sm font-mono border-collapse">
            <thead>
              <tr class="bg-bg-surface/80 border-b border-border-default">
                <th
                  class="p-3 border-r border-border-default text-accent-amber w-12 text-center text-[10px] uppercase"
                >
                  #
                </th>
                <th
                  class="p-3 border-r border-border-default text-text-dim w-44 text-[10px] uppercase"
                >
                  Thời gian
                </th>
                <th
                  class="p-3 border-r border-border-default text-text-dim w-36 text-[10px] uppercase"
                >
                  Cư sĩ
                </th>
                <th class="p-3 text-text-dim text-[10px] uppercase">Lời cầu nguyện</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="wishes.length === 0">
                <td colspan="4" class="p-12 text-center text-text-dim italic">
                  <Icon icon="mdi:candle" class="text-3xl mb-2 mx-auto block opacity-30" />
                  Chưa có lời cầu nguyện nào. Hãy là người đầu tiên!
                </td>
              </tr>
              <tr
                v-for="(wish, index) in wishes"
                :key="wish.id"
                class="border-b border-border-default/50 hover:bg-bg-elevated/50 transition-colors"
              >
                <td class="p-3 border-r border-border-default/50 text-center text-text-dim text-xs">
                  {{ index + 1 }}
                </td>
                <td class="p-3 border-r border-border-default/50 text-xs text-text-dim">
                  {{ wish.timestamp }}
                </td>
                <td class="p-3 border-r border-border-default/50 font-bold text-accent-sky text-xs">
                  {{ wish.user }}
                </td>
                <td class="p-3 text-text-secondary text-xs">"{{ wish.content }}"</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Back -->
      <RouterLink
        to="/"
        class="mt-16 inline-flex items-center gap-2 border border-border-default bg-bg-surface/50 backdrop-blur-sm px-8 py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary group animate-fade-up animate-delay-7 rounded-sm"
      >
        <Icon icon="mdi:arrow-left" class="group-hover:-translate-x-1 transition-transform" />
        Trở về Launcher
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   SCREEN SHAKE
   ============================================ */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10% {
    transform: translateX(-4px) translateY(2px);
  }
  20% {
    transform: translateX(4px) translateY(-2px);
  }
  30% {
    transform: translateX(-3px) translateY(1px);
  }
  40% {
    transform: translateX(3px) translateY(-1px);
  }
  50% {
    transform: translateX(-2px);
  }
  60% {
    transform: translateX(2px);
  }
  70% {
    transform: translateX(-1px);
  }
}
.animate-shake {
  animation: shake 0.6s ease-out;
}

/* ============================================
   GOLDEN BURST OVERLAY
   ============================================ */
.golden-burst-overlay {
  background: radial-gradient(
    circle at 50% 40%,
    rgba(255, 184, 48, 0.25),
    rgba(255, 107, 74, 0.1) 40%,
    transparent 70%
  );
  animation: burst-fade 2s ease-out forwards;
}
@keyframes burst-fade {
  0% {
    opacity: 1;
    transform: scale(0.5);
  }
  30% {
    opacity: 0.8;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

/* ============================================
   FIREWORK PARTICLES
   ============================================ */
.particle-burst {
  animation: particle-explode 3s ease-out forwards;
  pointer-events: none;
}
@keyframes particle-explode {
  0% {
    transform: scale(0) translate(0, 0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: scale(1.5);
  }
  30% {
    opacity: 1;
    transform: scale(1) translate(calc(var(--tx, 0) * 1px), calc(var(--ty, 0) * 1px));
  }
  100% {
    opacity: 0;
    transform: scale(0.5) translateY(-100px);
    filter: blur(3px);
  }
}

/* ============================================
   BLESSING BANNER
   ============================================ */
.blessing-text-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.blessing-text-leave-active {
  transition: all 0.8s ease-out;
}
.blessing-text-enter-from {
  transform: translate(-50%, -50%) scale(0.3);
  opacity: 0;
}
.blessing-text-leave-to {
  transform: translate(-50%, -100%) scale(0.8);
  opacity: 0;
  filter: blur(10px);
}

/* ============================================
   ALTAR GLOW (when incense is burning)
   ============================================ */
.altar-glow {
  box-shadow:
    0 0 0 1px rgba(255, 184, 48, 0.1),
    0 0 40px rgba(255, 184, 48, 0.08),
    0 0 80px rgba(255, 184, 48, 0.04),
    0 20px 60px -15px rgba(0, 0, 0, 0.5) !important;
  border-color: rgba(255, 184, 48, 0.3) !important;
  transition: all 2s ease;
}

/* ============================================
   INCENSE STICKS
   ============================================ */
.incense-stick {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: bottom center;
}
.incense-body {
  width: 3px;
  height: 70px;
  background: linear-gradient(to bottom, #8b4513 0%, #a0522d 30%, #d2691e 60%, #8b4513 100%);
  border-radius: 1px;
  box-shadow:
    1px 0 3px rgba(0, 0, 0, 0.4),
    -1px 0 2px rgba(139, 69, 19, 0.3);
  position: relative;
}
.incense-body::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.15) 30%,
    transparent 70%
  );
}
.incense-ash {
  width: 3px;
  height: 22px;
  background: linear-gradient(to bottom, #8b4513, #777 20%, #999 50%, #bbb 80%, #aaa);
  border-radius: 0 0 1px 1px;
  opacity: 0.85;
  position: relative;
}
.incense-ash::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: -1px;
  width: 5px;
  height: 3px;
  background: radial-gradient(circle, rgba(180, 180, 180, 0.4), transparent);
  border-radius: 50%;
}
.incense-ember {
  width: 6px;
  height: 4px;
  position: relative;
  background: radial-gradient(circle, #ff8800, #ff5500, #cc2200);
  border-radius: 50%;
  box-shadow:
    0 0 4px 2px rgba(255, 100, 0, 0.9),
    0 0 10px 4px rgba(255, 60, 0, 0.6),
    0 0 25px 8px rgba(255, 40, 0, 0.25),
    0 0 50px 15px rgba(255, 80, 0, 0.08);
  animation: ember-intense 1.5s infinite alternate ease-in-out;
}
@keyframes ember-intense {
  0% {
    background: radial-gradient(circle, #ff8800, #ff5500, #cc2200);
    box-shadow:
      0 0 4px 2px rgba(255, 100, 0, 0.9),
      0 0 10px 4px rgba(255, 60, 0, 0.6),
      0 0 25px 8px rgba(255, 40, 0, 0.25);
  }
  50% {
    background: radial-gradient(circle, #ffaa00, #ff7700, #dd3300);
    box-shadow:
      0 0 6px 3px rgba(255, 130, 0, 1),
      0 0 15px 6px rgba(255, 80, 0, 0.7),
      0 0 35px 12px rgba(255, 50, 0, 0.3);
  }
  100% {
    background: radial-gradient(circle, #ff9900, #ff6600, #cc2200);
    box-shadow:
      0 0 5px 2px rgba(255, 110, 0, 0.9),
      0 0 12px 5px rgba(255, 70, 0, 0.6),
      0 0 30px 10px rgba(255, 45, 0, 0.2);
  }
}

/* ============================================
   SPARKS from ember tips
   ============================================ */
.spark {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 3px 1px rgba(255, 215, 0, 0.8);
}
.spark-1 {
  animation: spark-fly-1 3s infinite ease-out;
}
.spark-2 {
  animation: spark-fly-2 4s infinite ease-out;
}
.spark-3 {
  animation: spark-fly-3 3.5s infinite ease-out;
}

@keyframes spark-fly-1 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  15% {
    opacity: 1;
    transform: translate(12px, -20px) scale(0.8);
  }
  30% {
    opacity: 0;
    transform: translate(18px, -40px) scale(0);
  }
  100% {
    opacity: 0;
  }
}
@keyframes spark-fly-2 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  20% {
    opacity: 0.8;
    transform: translate(-15px, -25px) scale(0.6);
  }
  35% {
    opacity: 0;
    transform: translate(-20px, -50px) scale(0);
  }
  100% {
    opacity: 0;
  }
}
@keyframes spark-fly-3 {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  18% {
    opacity: 0.7;
    transform: translate(8px, -30px) scale(0.5);
  }
  35% {
    opacity: 0;
    transform: translate(5px, -55px) scale(0);
  }
  100% {
    opacity: 0;
  }
}

/* ============================================
   INCENSE HALO (warm glow behind sticks)
   ============================================ */
.incense-halo {
  width: 80px;
  height: 80px;
  background: radial-gradient(
    circle,
    rgba(255, 150, 50, 0.15),
    rgba(255, 100, 0, 0.05) 50%,
    transparent 70%
  );
  border-radius: 50%;
  animation: halo-breathe 3s infinite alternate ease-in-out;
  filter: blur(10px);
}
@keyframes halo-breathe {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.3);
    opacity: 0.9;
  }
}

/* ============================================
   HEAT SHIMMER (distortion above incense)
   ============================================ */
.heat-shimmer {
  background: linear-gradient(transparent 20%, rgba(255, 200, 100, 0.02) 50%, transparent 80%);
  animation: heat-wave 2s infinite linear;
  filter: blur(1px);
  mix-blend-mode: overlay;
}
@keyframes heat-wave {
  0% {
    transform: translateX(-50%) scaleX(1) skewX(0deg);
  }
  25% {
    transform: translateX(-48%) scaleX(1.05) skewX(2deg);
  }
  50% {
    transform: translateX(-52%) scaleX(0.95) skewX(-1deg);
  }
  75% {
    transform: translateX(-49%) scaleX(1.02) skewX(1deg);
  }
  100% {
    transform: translateX(-50%) scaleX(1) skewX(0deg);
  }
}

/* ============================================
   IGNITION BURST (flash when first lit)
   ============================================ */
.ignition-burst {
  width: 60px;
  height: 60px;
  background: radial-gradient(
    circle,
    rgba(255, 200, 50, 0.6),
    rgba(255, 100, 0, 0.3) 40%,
    transparent 70%
  );
  border-radius: 50%;
  animation: ignition-pop 1.5s ease-out forwards;
}
@keyframes ignition-pop {
  0% {
    transform: translateX(-50%) scale(0);
    opacity: 1;
  }
  20% {
    transform: translateX(-50%) scale(2);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-50%) scale(3);
    opacity: 0.3;
  }
  100% {
    transform: translateX(-50%) scale(4);
    opacity: 0;
  }
}
.ignition-flash-enter-active {
  transition: opacity 0.1s;
}
.ignition-flash-leave-active {
  transition: opacity 2s;
}
.ignition-flash-enter-from,
.ignition-flash-leave-to {
  opacity: 0;
}

/* ============================================
   SMOKE WISPS
   ============================================ */
.smoke-wisp {
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(200, 200, 200, 0.15),
    rgba(180, 180, 180, 0.05),
    transparent
  );
  filter: blur(8px);
  pointer-events: none;
}
.smoke-wisp-1 {
  width: 30px;
  height: 80px;
  left: -15px;
  animation: smoke-rise-1 6s infinite ease-out;
}
.smoke-wisp-2 {
  width: 20px;
  height: 60px;
  left: -5px;
  animation: smoke-rise-2 7s infinite ease-out 1s;
}
.smoke-wisp-3 {
  width: 25px;
  height: 70px;
  left: -8px;
  animation: smoke-rise-3 8s infinite ease-out 2s;
}
.smoke-wisp-4 {
  width: 15px;
  height: 50px;
  left: 0px;
  animation: smoke-rise-1 5s infinite ease-out 3s;
}
.smoke-wisp-5 {
  width: 22px;
  height: 65px;
  left: -12px;
  animation: smoke-rise-2 9s infinite ease-out 0.5s;
}

/* Curling smoke tendrils (thinner, more defined) */
.smoke-tendril {
  position: absolute;
  bottom: 0;
  width: 4px;
  border-radius: 50%;
  background: linear-gradient(to top, rgba(220, 220, 220, 0.12), transparent);
  filter: blur(3px);
  pointer-events: none;
}
.smoke-tendril-1 {
  height: 120px;
  left: -2px;
  animation: tendril-curl-1 10s infinite ease-in-out;
}
.smoke-tendril-2 {
  height: 100px;
  left: 2px;
  animation: tendril-curl-2 12s infinite ease-in-out 1.5s;
}
.smoke-tendril-3 {
  height: 90px;
  left: -5px;
  animation: tendril-curl-3 8s infinite ease-in-out 3s;
}

@keyframes tendril-curl-1 {
  0% {
    transform: translateY(0) translateX(0) scaleY(0.3);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  30% {
    transform: translateY(-60px) translateX(20px) scaleY(1) rotate(15deg);
    opacity: 0.15;
  }
  60% {
    transform: translateY(-130px) translateX(-10px) scaleY(1.5) rotate(-10deg);
    opacity: 0.06;
  }
  100% {
    transform: translateY(-220px) translateX(30px) scaleY(2) rotate(20deg);
    opacity: 0;
  }
}
@keyframes tendril-curl-2 {
  0% {
    transform: translateY(0) scaleY(0.3);
    opacity: 0;
  }
  10% {
    opacity: 0.25;
  }
  40% {
    transform: translateY(-80px) translateX(-25px) scaleY(1.2) rotate(-20deg);
    opacity: 0.1;
  }
  100% {
    transform: translateY(-200px) translateX(-15px) scaleY(1.8) rotate(10deg);
    opacity: 0;
  }
}
@keyframes tendril-curl-3 {
  0% {
    transform: translateY(0) scaleY(0.4);
    opacity: 0;
  }
  15% {
    opacity: 0.2;
  }
  50% {
    transform: translateY(-70px) translateX(15px) scaleY(1.3) rotate(25deg);
    opacity: 0.08;
  }
  100% {
    transform: translateY(-180px) translateX(-20px) scaleY(2) rotate(-15deg);
    opacity: 0;
  }
}

@keyframes smoke-rise-1 {
  0% {
    transform: translateY(0) translateX(0) scale(0.3);
    opacity: 0;
  }
  15% {
    opacity: 0.25;
  }
  40% {
    transform: translateY(-80px) translateX(15px) scale(1.2);
    opacity: 0.12;
  }
  100% {
    transform: translateY(-250px) translateX(20px) scale(3);
    opacity: 0;
  }
}
@keyframes smoke-rise-2 {
  0% {
    transform: translateY(0) translateX(0) scale(0.4) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 0.2;
  }
  40% {
    transform: translateY(-70px) translateX(-20px) scale(1.5) rotate(10deg);
    opacity: 0.1;
  }
  100% {
    transform: translateY(-220px) translateX(-25px) scale(3.5) rotate(15deg);
    opacity: 0;
  }
}
@keyframes smoke-rise-3 {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 0.18;
  }
  100% {
    transform: translateY(-200px) translateX(-15px) scale(2.8);
    opacity: 0;
  }
}

/* ============================================
   CANDLE FLAME
   ============================================ */
.candle-flame-container {
  width: 14px;
  height: 22px;
  position: relative;
}
.candle-flame-outer {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 20px;
  background: radial-gradient(ellipse at bottom, #ffcc33, #ff9900 40%, #ff6600 70%, transparent);
  border-radius: 50% 50% 30% 30% / 70% 70% 30% 30%;
  animation: flame-dance 0.15s infinite alternate;
  filter: blur(0.5px);
}
.candle-flame-inner {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 12px;
  background: radial-gradient(ellipse at bottom, #fff, #ffe0a0 50%, transparent);
  border-radius: 50% 50% 30% 30% / 70% 70% 30% 30%;
  animation: flame-dance-inner 0.12s infinite alternate;
}
.candle-glow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, rgba(255, 180, 50, 0.35), transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s infinite alternate;
}

@keyframes flame-dance {
  0% {
    transform: translateX(-50%) scaleX(1) scaleY(1);
  }
  50% {
    transform: translateX(-48%) scaleX(1.05) scaleY(0.97) skewX(1deg);
  }
  100% {
    transform: translateX(-50%) scaleX(1.02) scaleY(0.98) skewX(2deg);
  }
}
@keyframes flame-dance-inner {
  0% {
    transform: translateX(-50%) scaleY(1);
  }
  100% {
    transform: translateX(-48%) scaleY(0.95);
  }
}
@keyframes glow-pulse {
  0% {
    opacity: 0.6;
    transform: translateX(-50%) scale(1);
  }
  100% {
    opacity: 0.8;
    transform: translateX(-50%) scale(1.1);
  }
}

/* ============================================
   TRANSITIONS
   ============================================ */
.slide-incense-enter-active {
  transition: all 2.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-incense-enter-from {
  transform: translateX(-50%) translateY(-80px);
  opacity: 0;
}

.fade-smoke-enter-active {
  transition: opacity 3s ease;
}
.fade-smoke-leave-active {
  transition: opacity 2s ease;
}
.fade-smoke-enter-from,
.fade-smoke-leave-to {
  opacity: 0;
}

.fade-vfx-enter-active {
  transition: opacity 0.3s;
}
.fade-vfx-leave-active {
  transition: opacity 1s;
}
.fade-vfx-enter-from,
.fade-vfx-leave-to {
  opacity: 0;
}

/* ============================================
   BUTTON SHIMMER
   ============================================ */
.commit-btn {
  position: relative;
  overflow: hidden;
}
.commit-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s;
}
.commit-btn:hover::after {
  left: 100%;
}

/* ============================================
   ALTAR CARD
   ============================================ */
.altar-card {
  box-shadow:
    0 0 0 1px rgba(255, 184, 48, 0.05),
    0 20px 60px -15px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition:
    box-shadow 2s ease,
    border-color 2s ease;
}

.font-display {
  font-family: 'Anybody', sans-serif;
}
.font-body {
  font-family: 'Be Vietnam Pro', sans-serif;
}
</style>
