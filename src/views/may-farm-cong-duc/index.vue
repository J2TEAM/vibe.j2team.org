<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import BackToTop from '@/components/BackToTop.vue'

// --- State ---
const isStarted = ref(false)
const selectionStep = ref<'mo' | 'chuong'>('mo')
const meritCount = ref(20)
const incenseSticks = ref(0)
const selectedMo = ref<string | null>(null)
const selectedChuong = ref<string | null>(null)

const isInteractingMo = ref(false)
const isInteractingChuong = ref(false)
const incenseLevel = ref(1)
const activeIncenseCount = ref(0)
const isAuto = ref(false)
const isMusicPlaying = ref(false)
const floatingTexts = ref<{ id: number; x: number; y: number; text: string; color?: string }[]>([])
let nextId = 0

// --- Config ---
const INCENSE_PRICE = 50
const INCENSE_QUANTITY = 1
const INCENSE_DURATION = 5000
const INCENSE_TICK = 2000
const INCENSE_GAIN_PER_TICK = 2

const availableMos = [
  { id: 'mo-1', path: '/may-farm-cong-duc/images/go-mo-1.png', label: 'Mõ Gỗ Cơ Bản' },
  { id: 'mo-2', path: '/may-farm-cong-duc/images/go-mo-2.png', label: 'Mõ Gỗ Cổ' },
  { id: 'mo-3', path: '/may-farm-cong-duc/images/go-mo-3.png', label: 'Mõ Gỗ Quý' },
]

const availableChuongs = [
  { id: 'chuong-1', path: '/may-farm-cong-duc/images/chuong-1.png', label: 'Đại Hồng Chung' },
  { id: 'chuong-2', path: '/may-farm-cong-duc/images/chuong-2.png', label: 'Thiên Chung' },
]

// --- Sound Logic ---
let moAudio: HTMLAudioElement | null = null
let chuongAudio: HTMLAudioElement | null = null
let bgmAudio: HTMLAudioElement | null = null

const playSound = (type: 'mo' | 'chuong') => {
  let audio: HTMLAudioElement | null = null
  if (type === 'mo') {
    if (!moAudio) moAudio = new Audio('/may-farm-cong-duc/sounds/go-mo-sound.mp3')
    audio = moAudio
  } else {
    if (!chuongAudio) chuongAudio = new Audio('/may-farm-cong-duc/sounds/go-chuong.mp3')
    audio = chuongAudio
  }
  if (audio) {
    const sound = audio.cloneNode() as HTMLAudioElement
    sound.volume = 0.5
    sound.play().catch(() => {})
  }
}

const toggleMusic = () => {
  if (!bgmAudio) {
    bgmAudio = new Audio('/may-farm-cong-duc/sounds/nhac-tung-kinh.mp3')
    bgmAudio.loop = true
    bgmAudio.volume = 0.3
  }
  if (isMusicPlaying.value) bgmAudio.pause()
  else bgmAudio.play().catch(() => {})
  isMusicPlaying.value = !isMusicPlaying.value
}

// --- Methods ---

const selectMo = (path: string) => {
  selectedMo.value = path
  selectionStep.value = 'chuong'
}

const selectChuong = (path: string) => {
  selectedChuong.value = path
  isStarted.value = true
}

const resetGame = () => {
  isStarted.value = false
  selectionStep.value = 'mo'
  selectedMo.value = null
  selectedChuong.value = null
  isAuto.value = false
  if (bgmAudio) {
    bgmAudio.pause()
    isMusicPlaying.value = false
  }
  localStorage.removeItem('mfc-selected-mo')
  localStorage.removeItem('mfc-selected-chuong')
}

const strikeMo = (event?: MouseEvent | TouchEvent) => {
  meritCount.value += 1
  isInteractingMo.value = true
  playSound('mo')
  setTimeout(() => {
    isInteractingMo.value = false
  }, 100)
  const coords = event
    ? getEventCoords(event)
    : { x: window.innerWidth / 2 - 150, y: window.innerHeight - 400 }
  addFloatingText(coords.x, coords.y, '+1 Công đức', 'text-accent-coral')
}

const ringBell = (event?: MouseEvent | TouchEvent) => {
  meritCount.value += 1
  isInteractingChuong.value = true
  playSound('chuong')
  setTimeout(() => {
    isInteractingChuong.value = false
  }, 400)
  const coords = event
    ? getEventCoords(event)
    : { x: window.innerWidth / 2 + 150, y: window.innerHeight - 400 }
  addFloatingText(coords.x, coords.y, '+1 Công đức', 'text-accent-amber')
}

const buyIncense = () => {
  if (meritCount.value >= INCENSE_PRICE) {
    meritCount.value -= INCENSE_PRICE
    incenseSticks.value += INCENSE_QUANTITY
    addFloatingText(
      window.innerWidth / 2,
      window.innerHeight / 2,
      `+${INCENSE_QUANTITY} Nén nhang`,
      'text-accent-sky',
    )
  }
}

const lightIncense = (event: MouseEvent | TouchEvent) => {
  if (incenseSticks.value > 0) {
    incenseSticks.value--
    activeIncenseCount.value++
    if (incenseLevel.value < 5) incenseLevel.value++
    else incenseLevel.value = 1
    const { x, y } = getEventCoords(event)
    addFloatingText(x, y, 'Đã thắp nhang', 'text-accent-sky')
    setTimeout(() => {
      activeIncenseCount.value--
    }, INCENSE_DURATION)
  } else {
    const { x, y } = getEventCoords(event)
    addFloatingText(x, y, 'Hết nhang rồi!', 'text-red-500')
  }
}

// --- Intervals ---
let autoInterval: number | null = null
let incenseInterval: number | null = null

onMounted(() => {
  const savedScore = localStorage.getItem('mfc-score')
  const savedNhang = localStorage.getItem('mfc-nhang')
  const savedMo = localStorage.getItem('mfc-selected-mo')
  const savedChuong = localStorage.getItem('mfc-selected-chuong')

  if (savedScore) meritCount.value = parseInt(savedScore, 10) || 20
  if (savedNhang) incenseSticks.value = parseInt(savedNhang, 10) || 0
  if (savedMo && savedChuong) {
    selectedMo.value = savedMo
    selectedChuong.value = savedChuong
    isStarted.value = true
  }

  incenseInterval = setInterval(() => {
    if (activeIncenseCount.value > 0) {
      const gain = activeIncenseCount.value * INCENSE_GAIN_PER_TICK
      meritCount.value += gain
      const burner = document.querySelector('.incense-burner-box')
      if (burner) {
        const rect = burner.getBoundingClientRect()
        addFloatingText(
          rect.left + rect.width / 2,
          rect.top + 60,
          `+${gain} CD (Nhang)`,
          'text-accent-sky',
        )
      }
    }
  }, INCENSE_TICK)
})

onUnmounted(() => {
  clearInterval(incenseInterval)
  if (autoInterval) clearInterval(autoInterval)
  if (bgmAudio) bgmAudio.pause()
})

watch(isAuto, (val) => {
  if (val)
    autoInterval = setInterval(() => {
      strikeMo()
    }, 400)
  else if (autoInterval) clearInterval(autoInterval)
})

const getEventCoords = (event: MouseEvent | TouchEvent) => {
  const x = 'clientX' in event ? event.clientX : event.touches[0].clientX
  const y = 'clientY' in event ? event.clientY : event.touches[0].clientY
  return { x, y }
}

const addFloatingText = (x: number, y: number, text: string, colorClass: string) => {
  const id = nextId++
  floatingTexts.value.push({ id, x, y, text, color: colorClass })
  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((t) => t.id !== id)
  }, 1000)
}

watch([meritCount, incenseSticks, selectedMo, selectedChuong], () => {
  localStorage.setItem('mfc-score', meritCount.value.toString())
  localStorage.setItem('mfc-nhang', incenseSticks.value.toString())
  if (selectedMo.value) localStorage.setItem('mfc-selected-mo', selectedMo.value)
  if (selectedChuong.value) localStorage.setItem('mfc-selected-chuong', selectedChuong.value)
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden relative select-none"
    @contextmenu.prevent
  >
    <header
      class="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none"
    >
      <div class="pointer-events-auto">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          <span
            class="font-display tracking-wide uppercase text-xs font-bold font-display uppercase tracking-widest"
            >Về trang chủ</span
          >
        </RouterLink>
      </div>
      <div class="pointer-events-auto animate-fade-up animate-delay-1">
        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg"
        >
          VOL.01 / 2026
        </div>
      </div>
    </header>

    <div
      v-if="!isStarted"
      class="fixed inset-0 z-[60] bg-bg-deep flex flex-col items-center justify-center p-6 overflow-y-auto"
    >
      <div class="max-w-5xl w-full text-center py-12">
        <div v-if="selectionStep === 'mo'" class="animate-fade-up">
          <h2 class="font-display text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tighter">
            Chọn <span class="text-accent-coral">Mõ Gỗ</span>
          </h2>
          <p class="text-text-secondary mb-12 font-display uppercase tracking-widest text-xs">
            Bước 1/2
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              v-for="inst in availableMos"
              :key="inst.id"
              @click="selectMo(inst.path)"
              class="bg-bg-surface border border-border-default p-10 cursor-pointer group hover:border-accent-coral transition-all flex flex-col items-center"
            >
              <img
                :src="inst.path"
                :alt="inst.label"
                class="h-40 object-contain group-hover:scale-110 transition-transform mb-6 pointer-events-none"
              />
              <h3 class="font-display text-xs font-bold uppercase tracking-widest text-center">
                {{ inst.label }}
              </h3>
            </div>
          </div>
        </div>
        <div v-if="selectionStep === 'chuong'" class="animate-fade-up">
          <h2 class="font-display text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tighter">
            Chọn <span class="text-accent-amber">Chuông</span>
          </h2>
          <p class="text-text-secondary mb-12 font-display uppercase tracking-widest text-xs">
            Bước 2/2
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div
              v-for="inst in availableChuongs"
              :key="inst.id"
              @click="selectChuong(inst.path)"
              class="bg-bg-surface border border-border-default p-10 cursor-pointer group hover:border-accent-amber transition-all flex flex-col items-center"
            >
              <img
                :src="inst.path"
                :alt="inst.label"
                class="h-40 object-contain group-hover:scale-110 transition-transform mb-6 pointer-events-none"
              />
              <h3 class="font-display text-xs font-bold uppercase tracking-widest text-center">
                {{ inst.label }}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>

    <main
      v-else
      class="container mx-auto max-w-5xl px-6 pt-32 pb-20 flex flex-col items-center relative z-10"
    >
      <!-- HUD (2 Columns) -->
      <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 animate-fade-up">
        <div
          class="bg-bg-surface border border-border-default p-6 flex flex-col justify-center relative overflow-hidden"
        >
          <span
            class="text-accent-coral font-display text-xs tracking-widest block mb-1 uppercase font-bold"
            >// CÔNG ĐỨC</span
          >
          <div class="font-display text-5xl font-bold tracking-tighter tabular-nums">
            {{ meritCount.toLocaleString() }}
          </div>
        </div>
        <div
          class="bg-bg-surface border border-border-default p-6 flex justify-between items-end relative overflow-hidden"
        >
          <div>
            <span
              class="text-accent-sky font-display text-xs tracking-widest block mb-1 uppercase font-bold"
              >// KHO NHANG</span
            >
            <div
              class="font-display text-5xl font-bold tracking-tighter text-accent-sky tabular-nums"
            >
              {{ incenseSticks }}
            </div>
          </div>
          <button
            @click="buyIncense"
            :disabled="meritCount < INCENSE_PRICE"
            class="bg-bg-deep border border-accent-sky/30 px-4 py-2 text-[10px] font-display tracking-widest text-accent-sky hover:bg-accent-sky hover:text-bg-deep transition-all disabled:opacity-30 uppercase font-bold"
          >
            Mua 1 nén ({{ INCENSE_PRICE }} CD)
          </button>
        </div>
      </div>

      <!-- BOARD -->
      <div class="w-full flex flex-col gap-12 items-center">
        <!-- TOP: INCENSE -->
        <div class="w-full max-w-md animate-fade-up animate-delay-1 relative">
          <img
            src="/may-farm-cong-duc/images/adidaphat.png"
            alt="A Di Da Phat Left"
            class="absolute bottom-0 right-full mr-4 h-[120%] object-contain opacity-10 hidden lg:block pointer-events-none"
          />
          <img
            src="/may-farm-cong-duc/images/adidaphat.png"
            alt="A Di Da Phat Right"
            class="absolute bottom-0 left-full ml-4 h-[120%] object-contain opacity-10 scale-x-[-1] hidden lg:block pointer-events-none"
          />

          <div
            @click="lightIncense"
            class="incense-burner-box bg-bg-surface border border-border-default pt-10 pb-12 px-10 flex flex-col items-center justify-center group hover:border-accent-sky transition-colors cursor-pointer relative z-10"
          >
            <span
              class="text-accent-sky font-display text-base tracking-[0.3em] uppercase mb-16 font-bold z-20 relative text-center w-full block animate-pulse"
              >// NGHI LỄ THẮP NHANG</span
            >
            <div class="relative">
              <div
                v-if="activeIncenseCount > 0"
                class="absolute left-1/2 -translate-x-1/2 -top-36 flex gap-2 z-10 pointer-events-none items-end h-[140px]"
              >
                <div v-for="i in Math.min(activeIncenseCount, 5)" :key="i" class="incense-stick">
                  <div class="smoke"></div>
                </div>
              </div>
              <img
                :src="`/may-farm-cong-duc/images/bat-huong-${incenseLevel}.png`"
                alt="Bát hương"
                class="h-48 object-contain transition-transform group-active:scale-95 z-20 relative pointer-events-none"
              />
            </div>
            <p
              class="text-xs text-text-dim text-center mt-12 font-display uppercase tracking-widest font-bold"
            >
              {{ incenseSticks > 0 ? 'Thắp 1 nén nhang (Cháy 5s)' : 'Cần mua thêm nhang' }}
            </p>
          </div>
        </div>

        <!-- BOTTOM: BOTH INSTRUMENTS -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full animate-fade-up animate-delay-2">
          <div
            @mousedown="strikeMo"
            @touchstart.prevent="strikeMo"
            class="bg-bg-surface border border-border-default p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent-coral group transition-all relative"
          >
            <span
              class="absolute top-4 left-4 text-accent-coral font-display text-xs tracking-widest uppercase font-bold"
              >// GÕ MÕ (+1)</span
            >
            <img
              :src="selectedMo || ''"
              alt="Mõ"
              class="h-56 object-contain transition-transform duration-75 pointer-events-none"
              :class="{ 'scale-90': isInteractingMo }"
            />
          </div>
          <div
            @mousedown="ringBell"
            @touchstart.prevent="ringBell"
            class="bg-bg-surface border border-border-default p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent-amber group transition-all relative"
          >
            <span
              class="absolute top-4 left-4 text-accent-amber font-display text-xs tracking-widest uppercase font-bold"
              >// THỈNH CHUÔNG (+1)</span
            >
            <img
              :src="selectedChuong || ''"
              alt="Chuông"
              class="h-56 object-contain transition-transform pointer-events-none"
              :class="{ 'shake-animation': isInteractingChuong }"
            />
          </div>
        </div>
      </div>

      <!-- BOTTOM CONTROL PANEL -->
      <div
        class="mt-20 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up animate-delay-3"
      >
        <!-- Auto Toggle -->
        <div
          @click="isAuto = !isAuto"
          class="bg-bg-surface border border-border-default p-4 flex items-center justify-between cursor-pointer transition-all hover:border-accent-coral"
          :class="{ 'bg-accent-coral/5 border-accent-coral': isAuto }"
        >
          <div class="flex items-center gap-3">
            <Icon
              :icon="isAuto ? 'lucide:cpu' : 'lucide:mouse-pointer-click'"
              class="size-5"
              :class="isAuto ? 'text-accent-coral' : 'text-text-dim'"
            />
            <span class="font-display text-xs font-bold uppercase tracking-widest"
              >Máy Gõ Tự Động</span
            >
          </div>
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-bold font-display uppercase"
              :class="isAuto ? 'text-accent-coral' : 'text-text-dim'"
              >{{ isAuto ? 'ON' : 'OFF' }}</span
            >
            <Icon
              :icon="isAuto ? 'lucide:toggle-right' : 'lucide:toggle-left'"
              class="size-6"
              :class="isAuto ? 'text-accent-coral' : 'text-text-dim'"
            />
          </div>
        </div>

        <!-- Music Toggle -->
        <div
          @click="toggleMusic"
          class="bg-bg-surface border border-border-default p-4 flex items-center justify-between cursor-pointer transition-all hover:border-accent-amber"
          :class="{ 'bg-accent-amber/5 border-accent-amber': isMusicPlaying }"
        >
          <div class="flex items-center gap-3">
            <Icon
              :icon="isMusicPlaying ? 'lucide:music' : 'lucide:music-2'"
              class="size-5"
              :class="isMusicPlaying ? 'text-accent-amber' : 'text-text-dim'"
            />
            <span class="font-display text-xs font-bold uppercase tracking-widest"
              >Nhạc Tụng Kinh</span
            >
          </div>
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-bold font-display uppercase"
              :class="isMusicPlaying ? 'text-accent-amber' : 'text-text-dim'"
              >{{ isMusicPlaying ? 'ON' : 'OFF' }}</span
            >
            <Icon
              :icon="isMusicPlaying ? 'lucide:volume-2' : 'lucide:volume-x'"
              class="size-6"
              :class="isMusicPlaying ? 'text-accent-amber' : 'text-text-dim'"
            />
          </div>
        </div>
      </div>

      <!-- RESET BUTTON -->
      <button
        @click="resetGame"
        class="mt-12 text-text-dim hover:text-text-primary text-[10px] font-display tracking-widest flex items-center gap-2 transition-colors uppercase font-bold animate-fade-up animate-delay-4 relative z-20"
      >
        <Icon icon="lucide:refresh-cw" class="size-3" />
        Chọn lại Pháp Khí
      </button>
    </main>

    <transition-group name="float">
      <div
        v-for="t in floatingTexts"
        :key="t.id"
        class="fixed pointer-events-none z-[100] font-display font-bold text-xl whitespace-nowrap"
        :class="t.color || 'text-text-primary'"
        :style="{ left: `${t.x}px`, top: `${t.y}px` }"
      >
        {{ t.text }}
      </div>
    </transition-group>

    <BackToTop />
  </div>
</template>

<style scoped>
.incense-stick {
  width: 4px;
  height: 140px;
  background: linear-gradient(to bottom, #ff6b4a 0%, #a52a2a 20%, #8b4513 100%);
  position: relative;
  border-radius: 2px;
  transform-origin: bottom;
}
.incense-stick::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 7px;
  height: 7px;
  background: #ff4500;
  border-radius: 50%;
  box-shadow:
    0 0 12px #ff6b4a,
    0 0 25px #ff4500;
  animation: glow 1s infinite alternate;
}
@keyframes glow {
  from {
    opacity: 0.7;
    transform: translateX(-50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1.2);
  }
}
.smoke {
  position: absolute;
  top: -20px;
  left: 50%;
  width: 14px;
  height: 40px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 80%);
  filter: blur(4px);
  animation: rise 3s infinite ease-out;
}
@keyframes rise {
  0% {
    transform: translate(-50%, 0) scale(1);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -80px) scale(3);
    opacity: 0;
  }
}

.shake-animation {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes shake {
  10%,
  90% {
    transform: rotate(-3deg);
  }
  20%,
  80% {
    transform: rotate(5deg);
  }
  30%,
  50%,
  70% {
    transform: rotate(-7deg);
  }
  40%,
  60% {
    transform: rotate(7deg);
  }
}
.float-enter-active {
  animation: float-up 1s ease-out forwards;
}
@keyframes float-up {
  0% {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -100px);
    opacity: 0;
  }
}

:global(::-webkit-scrollbar) {
  width: 6px;
}
:global(::-webkit-scrollbar-track) {
  background: var(--color-bg-deep);
}
:global(::-webkit-scrollbar-thumb) {
  background: var(--color-border-default);
}
:global(::-webkit-scrollbar-thumb:hover) {
  background: var(--color-accent-coral);
}
</style>
