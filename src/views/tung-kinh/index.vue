<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage, useIntervalFn } from '@vueuse/core'
const bgImage = '/tung-kinh/bg_home1.webp'
const bonkImage = '/tung-kinh/bonk.webp'
const bonkSound = '/tung-kinh/audio-bonk.mp3'

// Nhạc nền gọi qua URL — thay bằng bất kỳ URL audio công khai nào cũng được
const BEAT_URL = 'https://storage.wizlab.io.vn/sop/beat-background.mp3'

// ── State ────────────────────────────────────────────────────────────────────
const merit = useLocalStorage('tung-kinh-merit', 0)
const isStriking = ref(false)
const autoMode = ref(false)
const ripples = ref<{ id: number; x: number; y: number }[]>([])
const floatingTexts = ref<{ id: number; text: string; x: number }[]>([])
let rippleId = 0
let floatId = 0

// ── Sutras ───────────────────────────────────────────────────────────────────
const sutras = [
  'Nam mô A Di Đà Phật 🙏',
  'Nam mô Quan Thế Âm Bồ Tát',
  'Om Mani Padme Hum ☸️',
  'Nam mô Bổn Sư Thích Ca Mâu Ni Phật',
  'Thiện tai, thiện tai',
  'Con lạy Phật 🙏',
  'Nam mô Địa Tạng Vương Bồ Tát',
  'A Di Đà Phật ✨',
  'Nam mô Dược Sư Lưu Ly Quang Phật',
  'Công đức vô lượng 🌸',
]

// ── Milestones ───────────────────────────────────────────────────────────────
const milestones = [
  { threshold: 10, label: 'Phật Tử' },
  { threshold: 50, label: 'Thiện Nhân' },
  { threshold: 150, label: 'Cư Sĩ' },
  { threshold: 500, label: 'Sa Di' },
  { threshold: 1000, label: 'Tỳ Kheo' },
  { threshold: 2000, label: 'Hòa Thượng' },
  { threshold: 5000, label: 'Cao Tăng' },
  { threshold: 10000, label: 'Phật Sống 🌟' },
]

// ── Merit title ───────────────────────────────────────────────────────────────
const meritTitle = computed(() => {
  if (merit.value === 0) return 'Kẻ Trần Tục'
  if (merit.value < 10) return 'Tín Đồ Mới'
  if (merit.value < 50) return 'Phật Tử'
  if (merit.value < 150) return 'Thiện Nhân'
  if (merit.value < 500) return 'Cư Sĩ'
  if (merit.value < 1000) return 'Sa Di'
  if (merit.value < 2000) return 'Tỳ Kheo'
  if (merit.value < 5000) return 'Hòa Thượng'
  if (merit.value < 10000) return 'Cao Tăng'
  return '🌟 Phật Sống 🌟'
})

// ── Next milestone ────────────────────────────────────────────────────────────
const nextMilestone = computed(() => {
  const passed = milestones.filter((m) => m.threshold <= merit.value)
  const prev = passed.length > 0 ? passed[passed.length - 1] : undefined
  const next = milestones.find((m) => m.threshold > merit.value)
  if (!next) return null
  const from = prev?.threshold ?? 0
  const progress = Math.min(((merit.value - from) / (next.threshold - from)) * 100, 100)
  return { ...next, progress }
})

// ── Background beat ───────────────────────────────────────────────────────────
const bgVolume = ref(5) // 0-100
const moVolume = ref(100) // 0-100
const showVolume = ref(false)
let bgAudio: HTMLAudioElement | null = null
watch(bgVolume, (v) => {
  if (bgAudio) bgAudio.volume = v / 100
})
onMounted(() => {
  bgAudio = new Audio(BEAT_URL)
  bgAudio.loop = true
  bgAudio.volume = bgVolume.value / 100
  bgAudio.play().catch(() => {})
})
onUnmounted(() => {
  bgAudio?.pause()
  bgAudio = null
})

// ── Audio ─────────────────────────────────────────────────────────────────────
function playMo() {
  const audio = new Audio(bonkSound)
  audio.currentTime = 0
  audio.volume = moVolume.value / 100
  audio.play().catch(() => {})
}

// ── Core strike logic ─────────────────────────────────────────────────────────
function doStrike(x: number, y: number) {
  playMo()
  merit.value++
  isStriking.value = true
  setTimeout(() => (isStriking.value = false), 180)

  const id = rippleId++
  ripples.value.push({ id, x, y })
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 900)

  const text = sutras[merit.value % sutras.length] ?? 'Nam mô A Di Đà Phật 🙏'
  const fId = floatId++
  const fx = 30 + Math.random() * 40
  floatingTexts.value.push({ id: fId, text, x: fx })
  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((f) => f.id !== fId)
  }, 2200)
}

// ── Strike from pointer event ─────────────────────────────────────────────────
const moZoneEl = ref<HTMLElement | null>(null)
function strike(e: MouseEvent | TouchEvent) {
  const el = (e.currentTarget as HTMLElement).getBoundingClientRect()
  let clientX: number, clientY: number
  if (e instanceof TouchEvent) {
    clientX = e.touches[0]?.clientX ?? el.left + el.width / 2
    clientY = e.touches[0]?.clientY ?? el.top + el.height / 2
  } else {
    clientX = (e as MouseEvent).clientX
    clientY = (e as MouseEvent).clientY
  }
  doStrike(clientX - el.left, clientY - el.top)
}

// ── Auto mode (1 strike / second) ────────────────────────────────────────────
function autoStrike() {
  if (!moZoneEl.value) return
  const r = moZoneEl.value.getBoundingClientRect()
  doStrike(r.width / 2, r.height / 2)
}
const { pause: pauseAuto, resume: resumeAuto } = useIntervalFn(autoStrike, 1000, {
  immediate: false,
})
function toggleAuto() {
  autoMode.value = !autoMode.value
  if (autoMode.value) {
    resumeAuto()
  } else {
    pauseAuto()
  }
}

function resetMerit() {
  if (confirm('Bạn có chắc muốn xả bỏ hết công đức không? 🙏')) {
    merit.value = 0
  }
}
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col items-center overflow-x-hidden select-none"
    :style="{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundAttachment: 'fixed',
    }"
  >
    <!-- Layered overlay: dark top/bottom, transparent mid to reveal altar -->
    <div
      class="pointer-events-none fixed inset-0"
      style="
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.72) 0%,
          rgba(0, 0, 0, 0.3) 35%,
          rgba(0, 0, 0, 0.28) 65%,
          rgba(0, 0, 0, 0.78) 100%
        );
      "
    />
    <!-- Warm golden ambient (pulsing) -->
    <div
      class="pointer-events-none fixed inset-0 ambient-pulse"
      style="
        background: radial-gradient(
          ellipse 60% 55% at 50% 45%,
          rgba(180, 100, 5, 0.22) 0%,
          transparent 70%
        );
      "
    />

    <!-- ── Header ── -->
    <div class="anim-fade-down relative z-10 flex w-full items-center justify-between px-4 py-3">
      <RouterLink
        to="/"
        class="flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-black/40 px-4 py-2 text-sm text-amber-300 backdrop-blur-md transition hover:border-amber-400/70 hover:bg-black/60 hover:text-amber-100"
      >
        ← Trở về
      </RouterLink>

      <div class="text-center">
        <p class="text-[10px] tracking-[0.35em] uppercase text-amber-500/80">✦ Chùa J2TEAM ✦</p>
        <p class="text-base font-bold text-amber-200 drop-shadow-[0_1px_6px_rgba(200,130,0,0.8)]">
          Tụng Kinh · Gõ Mõ
        </p>
      </div>

      <button
        class="rounded-full border border-red-800/50 bg-black/40 px-3 py-2 text-xs text-red-400 backdrop-blur-md transition hover:border-red-500/60 hover:text-red-200"
        @click="resetMerit"
        title="Xả bỏ công đức"
      >
        🔥 Xả bỏ
      </button>
    </div>

    <!-- ── Merit panel ── -->
    <div class="anim-fade-up relative z-10 mt-1 w-full max-w-xs px-4" style="animation-delay: 0.1s">
      <div class="merit-panel rounded-2xl px-6 py-4 text-center">
        <p class="text-[10px] tracking-[0.4em] uppercase text-amber-500/90">Công Đức Tích Lũy</p>
        <p
          class="mt-0.5 font-mono text-5xl font-extrabold text-amber-200 transition-all duration-100"
          :class="
            isStriking
              ? 'scale-110 text-amber-100 drop-shadow-[0_0_24px_rgba(255,200,50,0.9)]'
              : 'drop-shadow-[0_0_12px_rgba(200,130,10,0.6)]'
          "
        >
          {{ merit.toLocaleString('vi-VN') }}
        </p>
        <p class="mt-1 text-sm font-medium text-amber-400">{{ meritTitle }}</p>

        <!-- Progress to next milestone -->
        <div v-if="nextMilestone" class="mt-3">
          <div class="mb-1 flex justify-between text-[10px] text-amber-600/80">
            <span>{{ merit.toLocaleString('vi-VN') }}</span>
            <span
              >{{ nextMilestone.threshold.toLocaleString('vi-VN') }} →
              {{ nextMilestone.label }}</span
            >
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-amber-950/60">
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-300"
              :style="{ width: nextMilestone.progress + '%' }"
            />
          </div>
        </div>
        <div v-else class="mt-2 text-xs text-yellow-300/80">🌟 Đã đạt cảnh giới tối cao!</div>
      </div>
    </div>

    <!-- ── Incense row (kept, no candles) ── -->
    <div class="anim-fade-up relative z-10 mt-4 flex items-end gap-8" style="animation-delay: 0.2s">
      <div v-for="i in 3" :key="i" class="incense-wrap">
        <div class="smoke-col">
          <div class="smoke-puff" :style="{ animationDelay: `${(i - 1) * 0.7}s` }" />
          <div class="smoke-puff" :style="{ animationDelay: `${(i - 1) * 0.7 + 0.35}s` }" />
        </div>
        <div class="incense-stick" />
      </div>
    </div>

    <!-- ── Mõ area (pushed to bottom) ── -->
    <div
      class="anim-fade-up relative z-10 mt-auto mb-10 flex flex-col items-center"
      style="animation-delay: 0.3s"
    >
      <!-- Floating sutras -->
      <TransitionGroup
        name="float"
        tag="div"
        class="pointer-events-none absolute bottom-full mb-4 w-full"
      >
        <div
          v-for="f in floatingTexts"
          :key="f.id"
          class="absolute bottom-0 whitespace-nowrap rounded-full border border-amber-500/30 bg-black/55 px-5 py-1.5 text-sm font-semibold text-amber-200 backdrop-blur-md shadow-lg"
          :style="{ left: f.x + '%', transform: 'translateX(-50%)' }"
        >
          {{ f.text }}
        </div>
      </TransitionGroup>

      <!-- Strike zone -->
      <div
        ref="moZoneEl"
        class="mo-zone relative cursor-pointer"
        :class="isStriking ? 'scale-90' : 'scale-100'"
        @click="strike"
        @touchstart.prevent="strike"
      >
        <div class="mo-halo" :class="isStriking ? 'mo-halo-active' : ''" />
        <img
          :src="bonkImage"
          alt="Mõ"
          class="mo-img relative z-10 select-none"
          :class="isStriking ? 'bounce' : 'float-idle'"
        />
        <span
          v-for="r in ripples"
          :key="r.id"
          class="ripple absolute z-20 rounded-full"
          :style="{ left: r.x + 'px', top: r.y + 'px' }"
        />
      </div>

      <!-- Hint + Auto toggle -->
      <p class="mt-3 text-[11px] tracking-[0.25em] uppercase text-amber-600/70">
        {{
          autoMode
            ? '✦ Đang tự động gõ... ✦'
            : merit === 0
              ? '✦ Nhấn để gõ mõ ✦'
              : '✦ Tiếp tục gõ ✦'
        }}
      </p>

      <button
        class="mt-4 flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium backdrop-blur-md transition-all duration-200"
        :class="
          autoMode
            ? 'border-amber-400/60 bg-amber-700/40 text-amber-100 shadow-[0_0_16px_rgba(220,160,0,0.4)]'
            : 'border-amber-800/50 bg-black/40 text-amber-400 hover:border-amber-600/60 hover:text-amber-200'
        "
        @click="toggleAuto"
      >
        <span
          class="inline-block h-2.5 w-2.5 rounded-full transition-colors"
          :class="
            autoMode ? 'bg-amber-300 shadow-[0_0_6px_2px_rgba(255,200,50,0.7)]' : 'bg-amber-700'
          "
        />
        {{ autoMode ? 'Dừng tự động' : 'Tự động gõ (1s)' }}
      </button>
    </div>

    <!-- ── Floating volume control (fixed right) ── -->
    <div class="fixed right-4 top-1/2 z-50 -translate-y-1/2 flex flex-col items-end gap-2">
      <!-- Toggle button -->
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200"
        :class="
          showVolume
            ? 'border-amber-400/60 bg-amber-700/50 text-amber-100 shadow-[0_0_12px_rgba(220,160,0,0.5)]'
            : 'border-amber-800/50 bg-black/50 text-amber-400 hover:border-amber-600/60 hover:text-amber-200'
        "
        :title="showVolume ? 'Đóng' : 'Âm lượng nhạc nền'"
        @click="showVolume = !showVolume"
      >
        <span class="text-lg leading-none">
          {{ bgVolume === 0 ? '🔇' : bgVolume < 30 ? '🔈' : '🔊' }}
        </span>
      </button>

      <!-- Popover panel -->
      <Transition name="vol-pop">
        <div
          v-if="showVolume"
          class="flex flex-col items-center gap-3 rounded-2xl border border-amber-800/50 bg-black/70 px-4 py-4 backdrop-blur-md shadow-xl"
        >
          <span class="text-[10px] uppercase tracking-widest text-amber-600/80">Âm thanh</span>
          <div class="flex items-end gap-5">
            <!-- Nhạc nền -->
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-xs text-amber-600/70">Nền</span>
              <input
                v-model.number="bgVolume"
                type="range"
                min="0"
                max="100"
                step="1"
                class="vol-slider-v"
                :style="{ '--val': bgVolume }"
                orient="vertical"
              />
              <span class="text-[11px] tabular-nums text-amber-400">{{ bgVolume }}%</span>
            </div>
            <!-- Tiếng mõ -->
            <div class="flex flex-col items-center gap-1.5">
              <span class="text-xs text-amber-600/70">Mõ</span>
              <input
                v-model.number="moVolume"
                type="range"
                min="0"
                max="100"
                step="1"
                class="vol-slider-v"
                :style="{ '--val': moVolume }"
                orient="vertical"
              />
              <span class="text-[11px] tabular-nums text-amber-400">{{ moVolume }}%</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── Author ── -->
    <p
      class="fixed bottom-3 left-4 z-50 text-[9px] tracking-[0.18em] text-amber-800/50 select-none"
    >
      by Lion3993vn
    </p>
  </div>
</template>

<style scoped>
/* ── Entrance animations ────────────────────────────────────────────────────── */
.anim-fade-down {
  animation: fade-down 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.anim-fade-up {
  animation: fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes fade-down {
  from {
    opacity: 0;
    transform: translateY(-18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Idle float (mõ) ───────────────────────────────────────────────────────── */
.float-idle {
  animation: mo-float 3.6s ease-in-out infinite;
}
@keyframes mo-float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* ── Ambient pulse ─────────────────────────────────────────────────────────── */
.ambient-pulse {
  animation: ambient-breathe 6s ease-in-out infinite;
}
@keyframes ambient-breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
/* ── Merit panel ────────────────────────────────────────────────────────── */
.merit-panel {
  background: linear-gradient(135deg, rgba(30, 12, 0, 0.82) 0%, rgba(55, 22, 0, 0.78) 100%);
  border: 1px solid rgba(200, 140, 20, 0.35);
  box-shadow:
    0 0 0 1px rgba(200, 140, 20, 0.12),
    0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 200, 80, 0.08);
  backdrop-filter: blur(12px);
}

/* ── Incense ────────────────────────────────────────────────────────────── */
.incense-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.incense-stick {
  width: 3px;
  height: 52px;
  background: linear-gradient(to bottom, #c8a060 0%, #6b3a10 60%, #3a1a05 100%);
  border-radius: 2px;
  position: relative;
}
.incense-stick::after {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(circle, #ff9922 30%, rgba(255, 100, 0, 0.4) 100%);
  box-shadow: 0 0 6px 2px rgba(255, 140, 20, 0.7);
}
.smoke-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  height: 40px;
  overflow: hidden;
}
.smoke-puff {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(220, 190, 130, 0.55);
  filter: blur(3px);
  animation: incense-rise 2.4s ease-in-out infinite;
}
@keyframes incense-rise {
  0% {
    transform: translateY(0) translateX(0) scale(0.6);
    opacity: 0.7;
  }
  40% {
    transform: translateY(-16px) translateX(3px) scale(1);
    opacity: 0.4;
  }
  80% {
    transform: translateY(-36px) translateX(-2px) scale(1.3);
    opacity: 0.15;
  }
  100% {
    transform: translateY(-44px) scale(0);
    opacity: 0;
  }
}

/* ── Mõ zone ────────────────────────────────────────────────────────────── */
.mo-zone {
  position: relative;
  transition: transform 0.13s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.mo-img {
  width: 160px;
  height: 160px;
  object-fit: contain;
  filter: drop-shadow(0 4px 24px rgba(180, 100, 0, 0.55))
    drop-shadow(0 0 8px rgba(255, 180, 40, 0.25));
  transition: filter 0.15s;
}
@media (min-width: 640px) {
  .mo-img {
    width: 200px;
    height: 200px;
  }
}

/* Halo */
.mo-halo {
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  transition:
    box-shadow 0.25s,
    background 0.25s;
  background: radial-gradient(circle, rgba(200, 130, 0, 0.1) 0%, transparent 70%);
  box-shadow: 0 0 0 0 rgba(200, 134, 10, 0);
}
.mo-halo-active {
  background: radial-gradient(circle, rgba(255, 200, 50, 0.22) 0%, transparent 65%);
  box-shadow:
    0 0 0 10px rgba(200, 134, 10, 0.18),
    0 0 60px rgba(255, 180, 20, 0.45);
}

/* Bounce */
.bounce {
  animation: mo-bounce 0.18s ease-out;
}
@keyframes mo-bounce {
  0% {
    transform: scale(1) rotate(0deg);
  }
  40% {
    transform: scale(0.88) rotate(-4deg);
  }
  75% {
    transform: scale(1.06) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* ── Ripple ─────────────────────────────────────────────────────────────── */
.ripple {
  width: 12px;
  height: 12px;
  margin-left: -6px;
  margin-top: -6px;
  background: rgba(255, 200, 60, 0.5);
  animation: ripple-expand 0.85s ease-out forwards;
  pointer-events: none;
}
@keyframes ripple-expand {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(16);
    opacity: 0;
  }
}

/* ── Volume slider (vertical) ───────────────────────────────────────────── */
.vol-slider-v {
  -webkit-appearance: slider-vertical;
  appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  width: 4px;
  height: 100px;
  border-radius: 9999px;
  background: linear-gradient(
    to top,
    #c8860a calc(var(--val, 5) * 1%),
    rgba(80, 40, 0, 0.6) calc(var(--val, 5) * 1%)
  );
  outline: none;
  cursor: pointer;
}
.vol-slider-v::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffd060, #c8860a);
  box-shadow: 0 0 8px rgba(200, 134, 10, 0.8);
  cursor: pointer;
  transition: transform 0.1s;
}
.vol-slider-v::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
.vol-slider-v::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffd060, #c8860a);
  box-shadow: 0 0 8px rgba(200, 134, 10, 0.8);
  cursor: pointer;
}

/* ── Volume popover transition ──────────────────────────────────────────── */
.vol-pop-enter-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.vol-pop-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.vol-pop-enter-from {
  opacity: 0;
  transform: translateX(12px) scale(0.92);
}
.vol-pop-leave-to {
  opacity: 0;
  transform: translateX(12px) scale(0.92);
}

/* ── Floating sutra ─────────────────────────────────────────────────────── */
.float-enter-active {
  animation: float-up 2.4s ease-out forwards;
}
.float-leave-active {
  display: none;
}
@keyframes float-up {
  0% {
    transform: translateX(-50%) translateY(0) scale(0.75);
    opacity: 0;
  }
  12% {
    opacity: 1;
    transform: translateX(-50%) translateY(-12px) scale(1);
  }
  75% {
    opacity: 0.9;
  }
  100% {
    transform: translateX(-50%) translateY(-130px) scale(0.88);
    opacity: 0;
  }
}
</style>
