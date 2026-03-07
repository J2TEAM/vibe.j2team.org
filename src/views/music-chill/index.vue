<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-12 px-4 relative overflow-hidden"
  >
    <!-- Header -->
    <header class="w-full max-w-7xl flex justify-between items-center mb-10 animate-fade-up z-10">
      <h1
        class="font-display text-4xl sm:text-5xl font-bold text-text-primary flex items-center gap-3"
      >
        <span class="text-accent-sky font-display text-lg tracking-widest">//</span>
        Trạm Chill
      </h1>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>
    </header>

    <main
      class="w-full max-w-7xl flex flex-col lg:flex-row gap-8 animate-fade-up animate-delay-2 z-10 h-full"
    >
      <!-- Left Panel: Focus & Lofi -->
      <div class="w-full lg:w-[300px] flex flex-col gap-6 flex-shrink-0">
        <!-- Pomodoro Timer -->
        <div
          class="border border-border-default bg-bg-surface/60 backdrop-blur-md p-6 relative overflow-hidden group"
        >
          <div
            class="absolute top-0 right-0 w-32 h-32 bg-accent-coral/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"
          ></div>
          <h2
            class="font-display text-lg font-semibold mb-6 flex items-center gap-2 text-text-primary"
          >
            <span class="text-accent-coral">⏱</span> Phiên Tập Trung
          </h2>

          <div class="flex flex-col gap-3 mb-6">
            <label class="text-sm text-text-dim">Cài đặt tổng thời gian (Giờ):</label>
            <div class="flex items-center gap-2 border border-border-default bg-bg-deep p-1">
              <input
                type="number"
                v-model.number="sessionHoursInput"
                min="0.1"
                max="12"
                step="0.1"
                :disabled="isSessionActive"
                class="w-full bg-transparent outline-none px-3 py-1.5 text-text-primary text-center font-display"
                placeholder="Ví dụ: 2"
              />
              <span class="text-text-dim text-sm pr-3">h</span>
            </div>
            <p v-if="totalSessionSeconds > 0" class="text-xs text-text-dim/70 text-center">
              Tổng thời gian còn: {{ Math.floor(sessionTimeLeft / 60) }} phút
              {{ sessionTimeLeft % 60 }} giây
            </p>
          </div>

          <div class="flex justify-center mb-6">
            <div
              class="relative w-48 h-48 rounded-full border flex items-center justify-center shadow-lg transition-colors duration-500"
              :class="[
                isTimerRunning
                  ? timerMode === 'focus'
                    ? 'border-accent-coral/50 bg-accent-coral/5 shadow-accent-coral/10'
                    : 'border-accent-sky/50 bg-accent-sky/5 shadow-accent-sky/10'
                  : 'border-border-default bg-bg-deep/40',
              ]"
            >
              <div
                class="text-5xl font-display font-medium tracking-wider"
                :class="[
                  isTimerRunning
                    ? timerMode === 'focus'
                      ? 'text-accent-coral'
                      : 'text-accent-sky'
                    : 'text-text-primary',
                ]"
              >
                {{ formattedTime }}
              </div>
              <div
                class="absolute bottom-8 text-[10px] text-text-dim uppercase tracking-widest font-bold"
              >
                {{ timerMode === 'focus' ? 'Tập trung' : 'Nghỉ ngơi' }}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-center gap-3">
            <button
              @click="toggleSession"
              class="flex-1 py-3 border bg-bg-deep transition-all font-semibold"
              :class="
                isSessionActive
                  ? 'border-accent-coral text-accent-coral hover:bg-accent-coral/10 shadow-[0_0_15px_rgba(255,107,74,0.15)]'
                  : 'border-border-default text-text-primary hover:border-text-secondary hover:text-text-primary'
              "
            >
              {{
                isSessionActive
                  ? isTimerRunning
                    ? 'Tạm Dừng Phiên'
                    : 'Tiếp Tục Phiên'
                  : 'Bắt Đầu Phiên'
              }}
            </button>
            <button
              @click="resetSession"
              class="px-5 py-3 border border-transparent text-text-dim hover:text-text-primary transition-colors text-sm bg-bg-deep hover:bg-bg-deep/50"
            >
              Kết thúc
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Ambient Environment -->
      <div class="flex-1 flex flex-col gap-6">
        <div
          class="border border-border-default bg-bg-surface/60 backdrop-blur-md p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div class="flex-1">
            <p class="text-text-secondary w-full text-sm leading-relaxed mb-3">
              Kết hợp Lofi Radio và 12 loại âm thanh môi trường siêu mềm (Soft Noise) được thiết kế đặc biệt giúp thư giãn sâu.
            </p>
            <!-- Mode Switcher -->
            <div class="flex items-center gap-1 bg-bg-deep p-1 rounded border border-border-default inline-flex">
              <button 
                @click="ambientMode = 'relax'"
                class="px-4 py-1.5 text-xs font-display font-medium rounded transition-all"
                :class="ambientMode === 'relax' ? 'bg-bg-surface text-accent-sky shadow border border-text-dim/20' : 'text-text-dim hover:text-text-primary'"
              >
                Chill
              </button>
              <button 
                @click="ambientMode = 'chill'"
                class="px-4 py-1.5 text-xs font-display font-medium rounded transition-all flex items-center gap-1"
                :class="ambientMode === 'chill' ? 'bg-bg-surface text-accent-amber shadow border border-text-dim/20' : 'text-text-dim hover:text-text-primary'"
              >
                Rick Roll
              </button>
            </div>
          </div>
          <button
            @click="stopAll"
            class="px-5 py-2.5 border border-border-default bg-bg-deep text-text-primary font-display font-medium text-sm transition-all hover:border-accent-coral hover:text-accent-coral flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0"
          >
            Dừng Tất Cả Tiếng Ồn
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="sound in soundsList"
            :key="sound.id"
            class="relative overflow-hidden border transition-all duration-500 group flex flex-col h-[160px] cursor-pointer"
            :class="[
              sound.isPlaying ? themeStyles[sound.theme].border : 'border-border-default',
              sound.isPlaying
                ? themeStyles[sound.theme].bgActive
                : 'bg-bg-surface hover:border-text-dim/50',
            ]"
            @click="toggleSound(sound)"
          >
            <!-- Glow Base -->
            <div
              v-if="sound.isPlaying"
              class="absolute inset-0 opacity-10 sm:opacity-20 pointer-events-none transition-opacity duration-1000 mix-blend-screen"
              :class="themeStyles[sound.theme].bgBase"
            ></div>

            <!-- Card Content -->
            <div
              class="relative z-10 flex-1 p-3 flex flex-col items-center justify-center text-center mt-2"
            >
              <div
                class="text-3xl mb-2 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0"
                :class="{ 'scale-110 drop-shadow-xl grayscale-0': sound.isPlaying }"
              >
                {{ sound.icon }}
              </div>
              <h3
                class="font-display text-[13px] font-medium mb-1 transition-colors duration-300 leading-tight"
                :class="sound.isPlaying ? themeStyles[sound.theme].text : 'text-text-primary'"
              >
                {{ sound.title }}
              </h3>
            </div>

            <!-- Controls Section -->
            <div
              class="relative z-20 px-3 pb-3 pt-3 bg-gradient-to-t from-bg-surface to-transparent transition-opacity"
              :class="{
                'opacity-100': sound.isPlaying,
                'opacity-20 group-hover:opacity-100': !sound.isPlaying,
              }"
              @click.stop
            >
              <div class="flex items-center gap-2">
                <button
                  @click="toggleSound(sound)"
                  class="text-base transition-all hover:scale-110 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                  :class="
                    sound.isPlaying
                      ? themeStyles[sound.theme].text
                      : 'text-text-dim hover:text-text-primary'
                  "
                >
                  {{ sound.isPlaying ? '⏸' : '▶' }}
                </button>
                
                <!-- RELAX MODE: Normal Slider -->
                <input
                  v-if="ambientMode === 'relax'"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  v-model.number="sound.volume"
                  @input="onVolumeChange(sound)"
                  class="w-full h-1 appearance-none bg-bg-deep outline-none cursor-pointer transition-opacity duration-300 custom-range"
                  :style="sound.isPlaying ? `accent-color: ${themeStyles[sound.theme].hex};` : ''"
                />

                <!-- CHILL MODE: Troll Dice -->
                <button
                  v-else
                  @click.stop="rollDice(sound)"
                  class="flex-1 h-6 flex items-center justify-center bg-bg-deep rounded border transition-all duration-300 relative overflow-hidden"
                  :class="[
                    sound.isRolling ? 'border-accent-coral animate-pulse scale-105 shadow-[0_0_10px_rgba(255,107,74,0.2)]' : 'border-border-default hover:border-text-dim/50 cursor-pointer',
                    sound.isPlaying ? themeStyles[sound.theme].text : 'text-text-dim'
                  ]"
                  :title="'Thử nhân phẩm âm lượng: ' + Math.round(sound.volume * 100) + '%'"
                  :disabled="!sound.isPlaying"
                >
                   <span class="mr-2 text-xs font-display font-medium min-w-[32px] text-right transition-opacity" :class="sound.isPlaying ? 'opacity-100' : 'opacity-40'">
                     {{ sound.isRolling ? '...' : Math.round(sound.volume * 100) + '%' }}
                   </span>
                   <span class="text-[14px] transition-transform duration-300" :class="{ 'animate-[spin_0.2s_linear_infinite]': sound.isRolling, 'opacity-40 grayscale': !sound.isPlaying }">
                     🎲
                   </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[300px] flex flex-col gap-6 flex-shrink-0">
        <!-- Lofi Player -->
        <div
          class="border border-border-default bg-bg-surface/60 backdrop-blur-md p-6 relative overflow-hidden"
        >
          <div
            class="absolute bottom-0 left-0 w-32 h-32 bg-accent-amber/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"
          ></div>
          <h2
            class="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-text-primary"
          >
            <span class="text-accent-amber">🎵</span> Lofi Radio
          </h2>

          <div
            class="aspect-video bg-black/50 border border-border-default mb-4 relative group group-hover:border-text-dim transition-colors"
          >
            <!-- Overlay to prevent interaction with iframe inside -->
            <div
              class="absolute inset-0 z-20 pointer-events-auto cursor-pointer"
              @click="toggleLofi"
            ></div>
            <!-- Central Play/Pause Icon Overlay -->
            <div
              class="absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-opacity duration-300"
              :class="isLofiPlaying ? 'opacity-0' : 'opacity-100'"
            >
              <div
                class="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-text-primary shadow-lg border border-white/10"
              >
                <span class="text-xl ml-1">▶</span>
              </div>
            </div>

            <!-- Iframe Container -->
            <div
              id="yt-player"
              class="w-full h-full pointer-events-none transition-all duration-700 relative z-10"
              :class="isLofiPlaying ? 'opacity-100' : 'opacity-40 grayscale blur-[1px]'"
            ></div>

            <div
              v-if="!isYoutubeReady"
              class="absolute inset-0 z-40 flex items-center justify-center bg-bg-surface"
            >
              <div
                class="w-6 h-6 border-2 border-accent-sky border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="relative">
              <select
                v-model="activeLofiId"
                @change="changeLofiChannel"
                class="w-full bg-bg-deep border border-border-default text-text-primary text-sm p-2.5 outline-none focus:border-accent-amber transition-colors appearance-none cursor-pointer pr-8 z-10 relative"
              >
                <option value="custom">-- Link YouTube Tùy Chỉnh --</option>
                <option v-for="channel in lofiChannels" :key="channel.id" :value="channel.id">
                  {{ channel.title }}
                </option>
              </select>
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim z-20 text-xs"
              >
                ▼
              </div>
            </div>

            <!-- Custom Link Input -->
            <div v-if="activeLofiId === 'custom'" class="flex gap-2 animate-fade-up">
              <input
                type="text"
                v-model="customLofiLink"
                placeholder="Dán link YouTube hoặc video ID..."
                class="flex-1 bg-bg-deep border border-border-default text-text-primary text-sm p-2.5 outline-none focus:border-accent-amber transition-colors"
                @keyup.enter="playCustomLofiLink"
              />
              <button
                @click="playCustomLofiLink"
                class="px-4 bg-accent-amber/10 text-accent-amber border border-accent-amber/20 hover:bg-accent-amber/20 transition-colors text-sm font-medium"
              >
                Phát
              </button>
            </div>

            <div class="flex items-center gap-4 px-2">
              <button
                @click="toggleLofi"
                class="text-xl transition-all hover:scale-110 flex-shrink-0 w-6 h-6 flex items-center justify-center"
                :class="
                  isLofiPlaying ? 'text-accent-amber' : 'text-text-dim hover:text-text-primary'
                "
              >
                {{ isLofiPlaying ? '⏸' : '▶' }}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                v-model.number="lofiVolume"
                @input="onLofiVolumeChange"
                class="w-full h-1.5 appearance-none bg-bg-deep outline-none cursor-pointer transition-opacity duration-300 custom-range"
                :style="isLofiPlaying ? `accent-color: var(--color-accent-amber);` : ''"
                :class="[isLofiPlaying ? 'opacity-100' : 'opacity-40 hover:opacity-100']"
              />
              <span
                class="text-[10px] text-text-dim font-display min-w-[2rem] text-right font-medium"
              >
                {{ Math.round(lofiVolume * 100) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Label Chữ xéo -->
    <div
      class="fixed top-8 right-8 bg-accent-sky text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 z-50 pointer-events-none hidden lg:block opacity-90 shadow-md"
    >
      VOL.01 / CHILL
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  loadVideoById: (id: string) => void
  setVolume: (v: number) => void
}

interface WindowYT extends Window {
  YT?: {
    Player: new (id: string, options: Record<string, unknown>) => YTPlayer
  }
  onYouTubeIframeAPIReady?: () => void
  webkitAudioContext?: typeof AudioContext
  AudioContext?: typeof AudioContext
}

// ------ POMODORO ADVANCED LOGIC ------ //
const focusTime = 25 * 60
const breakTime = 5 * 60

const sessionHoursInput = ref<number>(2) // 2 hours default

const isSessionActive = ref(false)
const timerMode = ref<'focus' | 'break'>('focus')
const timeLeft = ref(focusTime) // Time left in CURRENT mode
const sessionTimeLeft = ref(0) // Total time left overall
const isTimerRunning = ref(false)
let timerInterval: number | null = null

const totalSessionSeconds = computed(() => Math.floor(sessionHoursInput.value * 3600))

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const playNotificationSound = () => {
  try {
    const win = window as unknown as WindowYT
    const AudioContextClass = win.AudioContext || win.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.5)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 2)
  } catch {
    // ignore audio error
  }
}

const toggleSession = () => {
  // If session never started
  if (!isSessionActive.value) {
    if (sessionHoursInput.value <= 0) return
    isSessionActive.value = true
    timerMode.value = 'focus'
    timeLeft.value = focusTime
    sessionTimeLeft.value = totalSessionSeconds.value
    startCountdown()
    return
  }

  // If session is active, pause or resume
  if (isTimerRunning.value) {
    if (timerInterval) clearInterval(timerInterval)
    isTimerRunning.value = false
  } else {
    startCountdown()
  }
}

const startCountdown = () => {
  isTimerRunning.value = true
  if (timerInterval) clearInterval(timerInterval)

  timerInterval = window.setInterval(() => {
    // Minus total session time
    sessionTimeLeft.value--

    // Check if TOTAL session is over
    if (sessionTimeLeft.value <= 0) {
      resetSession()
      playNotificationSound()
      return
    }

    // Minus block time
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      // Switch modes
      playNotificationSound()
      if (timerMode.value === 'focus') {
        timerMode.value = 'break'
        timeLeft.value = breakTime
      } else {
        timerMode.value = 'focus'
        timeLeft.value = focusTime
      }
    }
  }, 1000)
}

const resetSession = () => {
  if (timerInterval) clearInterval(timerInterval)
  isSessionActive.value = false
  isTimerRunning.value = false
  timerMode.value = 'focus'
  timeLeft.value = focusTime
  sessionTimeLeft.value = 0
}

// ------ LOFI PLAYER CUSTOM LOGIC ------ //
const lofiChannels = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Girl - Lofi Hip Hop/Study' },
  { id: '4xDzrJKXOOY', title: 'Synthwave Radio - Retrowave' },
  { id: '7NOSDKb0HlU', title: 'Chillhop Radio - Jazzy/Lofi' },
]
const activeLofiId = ref(lofiChannels[0]?.id || '')
const customLofiLink = ref('')
const lofiVolume = ref(0.3)
const isLofiPlaying = ref(false)
const isYoutubeReady = ref(false)
let ytPlayer: YTPlayer | null = null

onMounted(() => {
  const win = window as unknown as WindowYT
  if (!win.YT) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }
    win.onYouTubeIframeAPIReady = initYTPlayer
  } else {
    initYTPlayer()
  }
})

const initYTPlayer = () => {
  const win = window as unknown as WindowYT
  if (typeof win.YT !== 'undefined' && win.YT.Player) {
    ytPlayer = new win.YT.Player('yt-player', {
      videoId: activeLofiId.value,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          isYoutubeReady.value = true
          e.target.setVolume(lofiVolume.value * 100)
        },
        onStateChange: (e: { data: number }) => {
          if (e.data === 1) isLofiPlaying.value = true
          else if (e.data === 2 || e.data === 0) isLofiPlaying.value = false
        },
      },
    })
  }
}

const toggleLofi = () => {
  if (!ytPlayer || !isYoutubeReady.value) return
  if (isLofiPlaying.value) ytPlayer.pauseVideo()
  else ytPlayer.playVideo()
}

const changeLofiChannel = () => {
  if (!ytPlayer || !isYoutubeReady.value) return
  if (activeLofiId.value === 'custom') return // user logic handles playCustomLofiLink
  ytPlayer.loadVideoById(activeLofiId.value)
  if (!isLofiPlaying.value)
    setTimeout(() => {
      if (ytPlayer) ytPlayer.pauseVideo()
    }, 300)
}

const playCustomLofiLink = () => {
  if (!ytPlayer || !isYoutubeReady.value || !customLofiLink.value) return

  // Extract video ID from common URL formats
  let videoId = customLofiLink.value
  const ytRegex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const match = customLofiLink.value.match(ytRegex)
  if (match && match[1]) {
    videoId = match[1]
  }

  ytPlayer.loadVideoById(videoId)
  isLofiPlaying.value = true
}

const onLofiVolumeChange = () => {
  if (ytPlayer && isYoutubeReady.value) {
    ytPlayer.setVolume(lofiVolume.value * 100)
  }
}

// ------ 12 SOFT AMBIENT SOUNDS LOGIC ------ //
const themeStyles = {
  sky: {
    text: 'text-accent-sky',
    border: 'border-accent-sky',
    bgActive: 'bg-accent-sky/5',
    bgBase: 'bg-accent-sky',
    hex: 'var(--color-accent-sky)',
  },
  coral: {
    text: 'text-accent-coral',
    border: 'border-accent-coral',
    bgActive: 'bg-accent-coral/5',
    bgBase: 'bg-accent-coral',
    hex: 'var(--color-accent-coral)',
  },
  amber: {
    text: 'text-accent-amber',
    border: 'border-accent-amber',
    bgActive: 'bg-accent-amber/5',
    bgBase: 'bg-accent-amber',
    hex: 'var(--color-accent-amber)',
  },
  neutral: {
    text: 'text-text-primary',
    border: 'border-text-primary/50',
    bgActive: 'bg-text-secondary/5',
    bgBase: 'bg-text-secondary',
    hex: 'var(--color-text-primary)',
  },
}

interface SoundState {
  id: string
  title: string
  icon: string
  theme: 'sky' | 'coral' | 'amber' | 'neutral'
  volume: number
  isPlaying: boolean
  nodes: { stop: () => void; gain: GainNode } | null
  isRolling?: boolean
}

const ambientMode = ref<'relax' | 'chill'>('chill')

const soundsList = ref<SoundState[]>([
  {
    id: 'softrain',
    title: 'Mưa Phùn',
    icon: '🌧️',
    theme: 'sky',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'deepwaves',
    title: 'Sóng Ocean',
    icon: '🌊',
    theme: 'sky',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'stream',
    title: 'Suối Nhỏ',
    icon: '🏞️',
    theme: 'sky',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'softwind',
    title: 'Gió Chiều',
    icon: '🌾',
    theme: 'amber',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'softfire',
    title: 'Lửa Trại Nhẹ',
    icon: '🔥',
    theme: 'coral',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'boxfan',
    title: 'Quạt Cổ Điển',
    icon: '🌀',
    theme: 'neutral',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'om',
    title: 'Rung Cảm Oṃ',
    icon: '🕉️',
    theme: 'amber',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'bowls',
    title: 'Bát Himalaya',
    icon: '🥣',
    theme: 'amber',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'train',
    title: 'Tàu Ngoại Ô',
    icon: '🚂',
    theme: 'neutral',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'cafe',
    title: 'Quán Cafe',
    icon: '☕',
    theme: 'coral',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'softnight',
    title: 'Đêm Yên Bình',
    icon: '🌌',
    theme: 'sky',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
  {
    id: 'brownnoise',
    title: 'Nhiễu Trắng (Nâu)',
    icon: '📻',
    theme: 'neutral',
    volume: 0.15,
    isPlaying: false,
    nodes: null,
  },
])

let audioCtx: AudioContext | null = null
const initCtx = () => {
  if (!audioCtx) {
    const win = window as unknown as WindowYT
    const AudioContextClass = win.AudioContext || win.webkitAudioContext
    if (AudioContextClass) audioCtx = new AudioContextClass()
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
}

// 100% SOFT Noise (Brown/Pink) generators for no piercing frequencies
const noiseBuffers: Record<string, AudioBuffer> = {}
const getNoiseBuffer = (ctx: AudioContext, type: 'pink' | 'brown') => {
  if (noiseBuffers[type]) return noiseBuffers[type]
  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)

  if (type === 'brown') {
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1
      const currentOut = (lastOut + 0.02 * w) / 1.02
      output[i] = currentOut * 3.5
      lastOut = currentOut
    }
  } else if (type === 'pink') {
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  noiseBuffers[type] = buffer
  return buffer
}

const playNoise = (ctx: AudioContext, dest: AudioNode, type: 'pink' | 'brown') => {
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer(ctx, type)
  src.loop = true
  src.connect(dest)
  src.start()
  return src
}
const createSoftLFO = (ctx: AudioContext, rate: number, destParam: AudioParam, amount: number) => {
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = rate
  const gain = ctx.createGain()
  gain.gain.value = amount
  lfo.connect(gain)
  gain.connect(destParam)
  lfo.start()
  return { lfo, gain }
}

const generators = {
  softrain: (ctx: AudioContext, destGain: GainNode) => {
    // Very dark pink noise
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    filter.connect(destGain)
    const src = playNoise(ctx, filter, 'pink')
    return {
      stop: () => {
        src.stop()
        src.disconnect()
        filter.disconnect()
      },
    }
  },
  deepwaves: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 250
    const swellGain = ctx.createGain()
    swellGain.gain.value = 0.5
    const { lfo, gain } = createSoftLFO(ctx, 0.05, swellGain.gain, 0.4) // 20s cycle
    swellGain.connect(filter)
    filter.connect(destGain)
    const src = playNoise(ctx, swellGain, 'brown')
    return {
      stop: () => {
        src.stop()
        lfo.stop()
        src.disconnect()
        lfo.disconnect()
        gain.disconnect()
        swellGain.disconnect()
        filter.disconnect()
      },
    }
  },
  stream: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 400
    filter.Q.value = 0.3
    filter.connect(destGain)
    const src = playNoise(ctx, filter, 'pink')
    const { lfo, gain } = createSoftLFO(ctx, 0.8, filter.frequency, 100)
    return {
      stop: () => {
        src.stop()
        lfo.stop()
        src.disconnect()
        lfo.disconnect()
        gain.disconnect()
        filter.disconnect()
      },
    }
  },
  softwind: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 350
    filter.connect(destGain)
    const { lfo, gain } = createSoftLFO(ctx, 0.1, filter.frequency, 150)
    const src = playNoise(ctx, filter, 'brown')
    return {
      stop: () => {
        src.stop()
        lfo.stop()
        src.disconnect()
        lfo.disconnect()
        gain.disconnect()
        filter.disconnect()
      },
    }
  },
  softfire: (ctx: AudioContext, destGain: GainNode) => {
    const rumbleFilter = ctx.createBiquadFilter()
    rumbleFilter.type = 'lowpass'
    rumbleFilter.frequency.value = 100
    rumbleFilter.connect(destGain)
    const muffle = ctx.createBiquadFilter()
    muffle.type = 'lowpass'
    muffle.frequency.value = 1000
    muffle.connect(destGain)
    const crackleBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const dat = crackleBuf.getChannelData(0)
    for (let i = 0; i < dat.length; i++)
      dat[i] = Math.random() < 0.0001 ? (Math.random() * 2 - 1) * 0.5 : 0 // Extremely rare, soft pops
    const crackleSrc = ctx.createBufferSource()
    crackleSrc.buffer = crackleBuf
    crackleSrc.loop = true
    crackleSrc.connect(muffle)
    crackleSrc.start()
    const rumbleSrc = playNoise(ctx, rumbleFilter, 'brown')
    return {
      stop: () => {
        rumbleSrc.stop()
        crackleSrc.stop()
        rumbleSrc.disconnect()
        crackleSrc.disconnect()
        rumbleFilter.disconnect()
        muffle.disconnect()
      },
    }
  },
  boxfan: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 180
    filter.connect(destGain)
    const { lfo, gain } = createSoftLFO(ctx, 6, filter.frequency, 30) // Fast 6hz wobble
    const src = playNoise(ctx, filter, 'brown')
    return {
      stop: () => {
        src.stop()
        lfo.stop()
        src.disconnect()
        lfo.disconnect()
        gain.disconnect()
        filter.disconnect()
      },
    }
  },
  om: (ctx: AudioContext, destGain: GainNode) => {
    const subGain = ctx.createGain()
    subGain.gain.value = 0.6
    subGain.connect(destGain)
    const freqs = [136.1, 137.5] // OM Frequency heart chakra
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      o.connect(subGain)
      o.start()
      return o
    })
    return {
      stop: () => {
        oscs.forEach((o) => {
          o.stop()
          o.disconnect()
        })
        subGain.disconnect()
      },
    }
  },
  bowls: (ctx: AudioContext, destGain: GainNode) => {
    const subGain = ctx.createGain()
    subGain.gain.value = 0.5
    subGain.connect(destGain)
    const freqs = [216, 220, 432]
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      o.connect(subGain)
      o.start()
      return o
    })
    const { lfo, gain } = createSoftLFO(ctx, 0.05, subGain.gain, 0.2)
    return {
      stop: () => {
        oscs.forEach((o) => {
          o.stop()
          o.disconnect()
        })
        lfo.stop()
        lfo.disconnect()
        gain.disconnect()
        subGain.disconnect()
      },
    }
  },
  train: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 120
    filter.connect(destGain)
    const rhythmGain = ctx.createGain()
    rhythmGain.gain.value = 0.5
    rhythmGain.connect(filter)
    const src = playNoise(ctx, rhythmGain, 'brown')
    const { lfo, gain } = createSoftLFO(ctx, 3, rhythmGain.gain, 0.4) // clack clack
    return {
      stop: () => {
        src.stop()
        lfo.stop()
        src.disconnect()
        lfo.disconnect()
        gain.disconnect()
        rhythmGain.disconnect()
        filter.disconnect()
      },
    }
  },
  cafe: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300
    filter.connect(destGain)
    const src = playNoise(ctx, filter, 'pink')
    return {
      stop: () => {
        src.stop()
        src.disconnect()
        filter.disconnect()
      },
    }
  },
  softnight: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400
    filter.connect(destGain)
    const subGain = ctx.createGain()
    subGain.gain.value = 0.05
    subGain.connect(destGain) // Extremely tiny high frequency
    const lfo = ctx.createOscillator()
    lfo.type = 'square'
    lfo.frequency.value = 1.5
    const gain = ctx.createGain()
    gain.gain.value = 0.05
    lfo.connect(gain)
    gain.connect(subGain.gain)
    lfo.start()
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 3000
    osc.connect(subGain)
    osc.start()
    const src = playNoise(ctx, filter, 'brown')
    return {
      stop: () => {
        src.stop()
        osc.stop()
        lfo.stop()
        src.disconnect()
        osc.disconnect()
        lfo.disconnect()
        gain.disconnect()
        subGain.disconnect()
        filter.disconnect()
      },
    }
  },
  brownnoise: (ctx: AudioContext, destGain: GainNode) => {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 600
    filter.connect(destGain)
    const src = playNoise(ctx, filter, 'brown')
    return {
      stop: () => {
        src.stop()
        src.disconnect()
        filter.disconnect()
      },
    }
  },
}

const toggleSound = (sound: SoundState) => {
  initCtx()
  if (!audioCtx) return

  if (sound.isPlaying) {
    if (sound.nodes) {
      sound.nodes.stop()
      sound.nodes.gain.disconnect()
      sound.nodes = null
    }
    sound.isPlaying = false
  } else {
    const masterGain = audioCtx.createGain()
    masterGain.gain.setValueAtTime(sound.volume, audioCtx.currentTime)
    masterGain.connect(audioCtx.destination)

    const generator = generators[sound.id as keyof typeof generators]
    if (generator) {
      const controls = generator(audioCtx, masterGain)
      sound.nodes = { stop: controls.stop, gain: masterGain }
      sound.isPlaying = true
    }
  }
}

const onVolumeChange = (sound: SoundState) => {
  if (sound.isPlaying && sound.nodes && audioCtx) {
    sound.nodes.gain.gain.linearRampToValueAtTime(sound.volume, audioCtx.currentTime + 0.1)
  }
}

const rollDice = (sound: SoundState) => {
  if (!sound.isPlaying || sound.isRolling) return
  sound.isRolling = true
  
  // Cục xí ngầu lắc lắc 1 giây
  window.setTimeout(() => {
    // Random volume từ 1% đến 100%
    const randomVolume = Math.max(0.01, Math.random())
    sound.volume = randomVolume
    
    // Cập nhật âm thanh thực tế
    onVolumeChange(sound)
    sound.isRolling = false
  }, 1000)
}

const stopAll = () => {
  soundsList.value.forEach((s) => {
    if (s.isPlaying) toggleSound(s)
  })
}

onUnmounted(() => {
  stopAll()
  if (timerInterval) clearInterval(timerInterval)
  if (audioCtx) audioCtx.close()
})
</script>

<style>
/* Slider Styling */
.custom-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 24px;
  background: currentColor;
  cursor: pointer;
  border-radius: 2px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.custom-range::-moz-range-thumb {
  width: 14px;
  height: 24px;
  background: currentColor;
  cursor: pointer;
  border-radius: 2px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
