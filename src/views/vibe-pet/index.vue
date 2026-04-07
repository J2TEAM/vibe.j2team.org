<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage, useIntervalFn } from '@vueuse/core'

// --- Types & Constants ---
type SkinType = 'blob' | 'cat' | 'robo' | 'ghost' | 'dino'

interface PetStats {
  name: string
  skin: SkinType
  level: number
  exp: number
  hunger: number // 0-100 (100 is full)
  happiness: number // 0-100
  energy: number // 0-100
  anger: number // 0-100 (New)
  coins: number // (New)
  isSleeping: boolean
  lastUpdate: number
  birthday: number
}

interface ShopItem {
  id: string
  name: string
  icon: string
  price: number
  hungerBoost: number
  happyBoost: number
  angerReduction: number
}

const FOOD_ITEMS: ShopItem[] = [
  {
    id: 'apple',
    name: 'Táo Đỏ',
    icon: 'twemoji:red-apple',
    price: 10,
    hungerBoost: 15,
    happyBoost: 5,
    angerReduction: 5,
  },
  {
    id: 'burger',
    name: 'Burger',
    icon: 'twemoji:hamburger',
    price: 50,
    hungerBoost: 40,
    happyBoost: 10,
    angerReduction: 10,
  },
  {
    id: 'ramen',
    name: 'Mì Ramen',
    icon: 'twemoji:steaming-bowl',
    price: 120,
    hungerBoost: 70,
    happyBoost: 30,
    angerReduction: 25,
  },
  {
    id: 'cake',
    name: 'Bánh Kem',
    icon: 'twemoji:shortcake',
    price: 200,
    hungerBoost: 30,
    happyBoost: 80,
    angerReduction: 50,
  },
]

const MAX_STAT = 100
const TICK_RATE = 1000 * 60 // 1 minute per tick for stat decay
const SAVE_KEY = 'vibe-pet-data-v3' // Bump version for economy

// --- State ---
const defaultStats: PetStats = {
  name: '',
  skin: 'blob',
  level: 1,
  exp: 0,
  hunger: 80,
  happiness: 80,
  energy: 100,
  anger: 0,
  coins: 50, // Starter coins
  isSleeping: false,
  lastUpdate: Date.now(),
  birthday: Date.now(),
}

const MUSIC_TRACKS = [
  'https://cdn.pixabay.com/audio/2025/04/03/audio_7b184f866c.mp3', // Track 1 (New)
  'https://cdn.pixabay.com/audio/2025/04/05/audio_5dbaf9d320.mp3', // Track 2 (Old)
]

const stats = useLocalStorage<PetStats>(SAVE_KEY, defaultStats)
const isInitialized = ref(false)
const showNaming = ref(!stats.value.name)
const showShop = ref(false)
const newName = ref(stats.value.name)
const selectedSkin = ref<SkinType>(stats.value.skin || 'blob')
const isMusicOn = useLocalStorage('vibe-pet-music', false)
const currentTrackIndex = useLocalStorage('vibe-pet-track-index', 0)
const audioRef = ref<HTMLAudioElement | null>(null)

// --- Computed ---
const evolutionStage = computed(() => {
  if (stats.value.level >= 10) return 3
  if (stats.value.level >= 5) return 2
  return 1
})

const currentTrackUrl = computed(() => MUSIC_TRACKS[currentTrackIndex.value] || MUSIC_TRACKS[0])

const petStatus = computed(() => {
  if (stats.value.isSleeping) return 'Đang ngủ...'
  if (stats.value.anger > 70) return 'ĐANG GIẬN DỮ!!!'
  if (stats.value.hunger < 20) return 'Đang đói!'
  if (stats.value.happiness < 20) return 'Đang buồn...'
  if (stats.value.energy < 20) return 'Mệt mỏi...'
  return 'Đang ổn định'
})

const petMood = computed(() => {
  if (stats.value.isSleeping) return 'sleeping'
  if (stats.value.anger > 70) return 'angry'
  if (stats.value.hunger < 30 || stats.value.happiness < 30 || stats.value.energy < 30) return 'sad'
  return 'happy'
})

// --- Actions ---
const handleNaming = () => {
  if (newName.value.trim()) {
    stats.value.name = newName.value.trim()
    stats.value.skin = selectedSkin.value
    showNaming.value = false
  }
}

const feed = () => {
  if (stats.value.isSleeping) return
  // Free snack
  stats.value.hunger = Math.min(MAX_STAT, stats.value.hunger + 10)
  stats.value.happiness = Math.min(MAX_STAT, stats.value.happiness + 2)
  gainExp(5)
}

const buyFood = (item: ShopItem) => {
  if (stats.value.coins >= item.price) {
    stats.value.coins -= item.price
    stats.value.hunger = Math.min(MAX_STAT, stats.value.hunger + item.hungerBoost)
    stats.value.happiness = Math.min(MAX_STAT, stats.value.happiness + item.happyBoost)
    stats.value.anger = Math.max(0, stats.value.anger - item.angerReduction)
    gainExp(item.price / 2)
  }
}

const play = () => {
  if (stats.value.isSleeping || stats.value.energy < 15) return
  stats.value.happiness = Math.min(MAX_STAT, stats.value.happiness + 25)
  stats.value.energy = Math.max(0, stats.value.energy - 15)
  stats.value.hunger = Math.max(0, stats.value.hunger - 10)
  stats.value.anger = Math.max(0, stats.value.anger - 5)
  gainExp(25)
}

const toggleSleep = () => {
  stats.value.isSleeping = !stats.value.isSleeping
}

const toggleMusic = async () => {
  if (!isMusicOn.value) {
    // Off -> Track 1
    currentTrackIndex.value = 0
    isMusicOn.value = true
    await nextTick()
    if (audioRef.value) {
      audioRef.value.load()
      audioRef.value.play().catch(() => {
        isMusicOn.value = false
      })
    }
  } else if (currentTrackIndex.value === 0) {
    // Track 1 -> Track 2
    currentTrackIndex.value = 1
    await nextTick()
    if (audioRef.value) {
      audioRef.value.load()
      audioRef.value.play().catch(() => {})
    }
  } else {
    // Track 2 -> Off
    isMusicOn.value = false
    if (audioRef.value) audioRef.value.pause()
  }
}

const gainExp = (amount: number) => {
  stats.value.exp += amount
  const nextLevelExp = stats.value.level * 100
  if (stats.value.exp >= nextLevelExp) {
    stats.value.exp -= nextLevelExp
    stats.value.level++
  }
}

// --- Logic ---
const updateStats = () => {
  const now = Date.now()
  const elapsedMinutes = Math.floor((now - stats.value.lastUpdate) / TICK_RATE)

  if (elapsedMinutes > 0) {
    if (stats.value.isSleeping) {
      stats.value.energy = Math.min(MAX_STAT, stats.value.energy + elapsedMinutes * 8)
      stats.value.hunger = Math.max(0, stats.value.hunger - elapsedMinutes * 1)
      // Earn money while sleeping!
      stats.value.coins += elapsedMinutes * 5
    } else {
      stats.value.hunger = Math.max(0, stats.value.hunger - elapsedMinutes * 3)
      stats.value.happiness = Math.max(0, stats.value.happiness - elapsedMinutes * 2)
      stats.value.energy = Math.max(0, stats.value.energy - elapsedMinutes * 1.5)

      // Anger increases if hungry or unhappy
      if (stats.value.hunger < 20 || stats.value.happiness < 20) {
        stats.value.anger = Math.min(MAX_STAT, stats.value.anger + elapsedMinutes * 5)
      } else {
        stats.value.anger = Math.max(0, stats.value.anger - elapsedMinutes * 1)
      }
    }
    stats.value.lastUpdate = now
  }
}

useIntervalFn(updateStats, 1000 * 10)

onMounted(() => {
  updateStats()
  isInitialized.value = true
  if (isMusicOn.value && audioRef.value) {
    audioRef.value.play().catch(() => {
      isMusicOn.value = false
    })
  }
})

watch(isMusicOn, (val) => {
  if (audioRef.value) {
    if (val)
      audioRef.value.play().catch(() => {
        isMusicOn.value = false
      })
    else audioRef.value.pause()
  }
})

watch(currentTrackUrl, async () => {
  if (isMusicOn.value && audioRef.value) {
    await nextTick()
    audioRef.value.load()
    audioRef.value.play().catch(() => {})
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-10 px-4 overflow-hidden relative"
  >
    <!-- Audio Element (Chill 8-bit Background Music) -->
    <audio ref="audioRef" loop :src="currentTrackUrl"></audio>

    <!-- Animated Background (Scrolling Clouds/Stars) -->
    <div class="absolute inset-0 pointer-events-none opacity-20 z-0">
      <div class="scrolling-bg clouds"></div>
      <div class="scrolling-bg stars animate-pulse"></div>
    </div>

    <!-- Load Font & Styles -->
    <component :is="'style'">
      @import
      url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap');
      .font-pixel { font-family: 'Pixelify Sans', sans-serif; } .pixel-border { border: 4px solid
      var(--color-border-default); box-shadow: 4px 4px 0 0 rgba(0,0,0,0.2); background:
      var(--color-bg-surface); } .pixel-btn { position: relative; border: 2px solid
      var(--color-border-default); box-shadow: 2px 2px 0 0 var(--color-border-default); transition:
      all 0.1s; } .pixel-btn:active:not(:disabled) { box-shadow: none; transform: translate(2px,
      2px); } .scrolling-bg { position: absolute; inset: 0; background-repeat: repeat-x; height:
      100%; width: 200%; /* Updated for smoother repeats */ animation: scroll 60s linear infinite;
      image-rendering: pixelated; } .clouds { background-image: url("data:image/svg+xml,%3Csvg
      width='100' height='40' viewBox='0 0 100 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath
      d='M10 20h20v5H10zM40 10h30v8H40zM80 25h15v5H80z' fill='%238B9DB5'
      fill-opacity='0.3'/%3E%3C/svg%3E"); top: 10%; } .stars { background-image:
      url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50'
      xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='10' width='2' height='2'
      fill='%23f0ede6'/%3E%3Crect x='30' y='40' width='1' height='1' fill='%23f0ede6'/%3E%3Crect
      x='45' y='15' width='2' height='2' fill='%23f0ede6'/%3E%3C/svg%3E"); animation-duration: 40s;
      } /* Internal Display Layers */ .internal-clouds { background-image:
      url("data:image/svg+xml,%3Csvg width='120' height='40' viewBox='0 0 120 40'
      xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10h24v4H20zM60 20h16v3H60zM90 5h20v4H90z'
      fill='%23ffffff' fill-opacity='0.15'/%3E%3C/svg%3E"); animation-duration: 90s; top: 5%; }
      .trees { background-image: url("data:image/svg+xml,%3Csvg width='160' height='60' viewBox='0 0
      160 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 40h10v20H10zM5 30h20v10H5zM80
      45h8v15h-8zM75 35h18v10H75zM120 30h12v30h-12zM110 15h32v15h-32z' fill='%232d4c1e'
      fill-opacity='0.4'/%3E%3C/svg%3E"); animation-duration: 120s; top: auto; bottom: 10px; height:
      60px; } .grass { background-image: url("data:image/svg+xml,%3Csvg width='40' height='10'
      viewBox='0 0 40 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8h2v2H0zM10
      5h1v5h-1zM25 7h2v3h-2zM35 6h1v4h-1z' fill='%234c7c32' fill-opacity='0.5'/%3E%3C/svg%3E");
      animation-duration: 30s; } @keyframes scroll { from { transform: translateX(0); } to {
      transform: translateX(-50%); } } .pet-idle { animation: pet-float 2s ease-in-out infinite; }
      @keyframes pet-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform:
      translateY(-15px) rotate(2deg); } } .stage-transition { transition: all 0.5s
      cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    </component>

    <!-- UI Overlay (Left: Coins, Right: Music) -->
    <div class="fixed top-6 left-6 z-50 animate-fade-up flex items-center gap-4">
      <div class="pixel-border bg-bg-surface px-4 py-2 flex items-center gap-3 font-pixel">
        <Icon icon="twemoji:coin" class="size-5" />
        <span class="text-accent-amber font-bold text-lg leading-none">{{
          Math.floor(stats.coins)
        }}</span>
      </div>
      <button
        @click="showShop = !showShop"
        class="pixel-btn bg-bg-surface p-2 flex items-center justify-center hover:border-accent-coral transition-colors"
        :class="{ 'border-accent-coral': showShop }"
      >
        <Icon icon="lucide:shopping-cart" class="size-6 text-accent-sky" />
      </button>
    </div>

    <div class="fixed top-6 right-6 z-50 animate-fade-up">
      <button
        @click="toggleMusic"
        class="pixel-btn bg-bg-surface p-3 flex items-center justify-center rounded-none hover:border-accent-coral transition-colors relative group"
      >
        <Icon
          :icon="isMusicOn ? 'pixelarticons:volume-3' : 'pixelarticons:volume-x'"
          class="size-6"
          :class="isMusicOn ? 'text-accent-amber' : 'text-text-dim'"
        />
        <!-- Track Indicator Badge -->
        <span
          v-if="isMusicOn"
          class="absolute -top-1 -right-1 bg-accent-coral text-bg-deep text-[8px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center shadow-sm"
        >
          {{ currentTrackIndex + 1 }}
        </span>
        <span
          class="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-surface border border-border-default px-2 py-1 text-[8px] whitespace-nowrap font-pixel pointer-events-none uppercase"
        >
          {{ isMusicOn ? `Đang phát bản nhạc ${currentTrackIndex + 1}` : 'Đã tắt nhạc' }}
        </span>
      </button>
    </div>

    <!-- Shop Modal -->
    <div
      v-if="showShop"
      class="fixed inset-0 z-[60] bg-bg-deep/90 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-lg pixel-border p-8 relative animate-fade-up">
        <button
          @click="showShop = false"
          class="absolute top-4 right-4 text-text-dim hover:text-accent-coral"
        >
          <Icon icon="pixelarticons:close" class="size-8" />
        </button>

        <h2 class="font-display text-3xl font-bold mb-6 italic flex items-center gap-3">
          <Icon icon="lucide:shopping-cart" class="text-accent-sky" /> TIỆM TẠP HÓA PIXEL
        </h2>

        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="item in FOOD_ITEMS"
            :key="item.id"
            class="p-4 border-2 border-border-default bg-bg-deep/50 hover:bg-bg-elevated transition-colors group relative"
            :class="{ 'opacity-50': stats.coins < item.price }"
          >
            <div class="flex items-center gap-3 mb-3">
              <Icon :icon="item.icon" class="size-10 group-hover:scale-110 transition-transform" />
              <div>
                <p class="font-pixel font-bold text-sm">{{ item.name }}</p>
                <div class="flex items-center gap-1 text-[10px] text-accent-amber font-pixel">
                  <Icon icon="twemoji:coin" class="size-3" />
                  <span>{{ item.price }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-1 text-[8px] font-pixel text-text-dim mb-3 uppercase">
              <span class="text-accent-sky">+{{ item.hungerBoost }} NO</span>
              <span class="text-accent-amber">+{{ item.happyBoost }} VUI</span>
              <span class="text-accent-coral">-{{ item.angerReduction }} GIẬN</span>
            </div>

            <button
              @click="buyFood(item)"
              :disabled="stats.coins < item.price"
              class="w-full pixel-btn bg-bg-surface py-1 text-[10px] font-bold disabled:grayscale disabled:opacity-50"
            >
              {{ stats.coins >= item.price ? 'MUA NGAY' : 'KHÔNG ĐỦ TIỀN' }}
            </button>
          </div>
        </div>

        <p
          class="mt-6 text-[10px] font-pixel text-text-dim text-center uppercase tracking-widest italic"
        >
          * Đi ngủ để kiếm thêm VibeCoins *
        </p>
      </div>
    </div>

    <!-- Header -->
    <div class="w-full max-w-2xl flex flex-col items-center mb-10 z-10 animate-fade-up">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-accent-coral font-display tracking-widest text-xl">//</span>
        <h1 class="font-display text-5xl font-extrabold tracking-tighter italic">VibePet</h1>
        <span class="text-accent-coral font-display tracking-widest text-xl font-bold">EVO</span>
      </div>
      <p
        class="text-text-secondary text-sm font-pixel text-center leading-relaxed font-semibold tracking-wider opacity-80 uppercase"
      >
        Nâng cấp kinh tế - Kiềm chế cơn giận
      </p>
    </div>

    <!-- Main Game Area -->
    <div
      class="w-full max-w-4xl pixel-border p-6 flex flex-col items-center relative z-10 animate-fade-up animate-delay-1"
    >
      <!-- Naming & Skin Selection Modal -->
      <div
        v-if="showNaming"
        class="absolute inset-0 z-20 bg-bg-surface/98 flex flex-col items-center justify-center p-8 text-center text-sm font-pixel overflow-y-auto"
      >
        <p class="mb-4 text-xl font-bold text-accent-coral uppercase tracking-wide">
          CHÀO MỪNG TRAINER!
        </p>

        <p class="mb-3 text-text-secondary">1. Chọn giống loài của bạn:</p>
        <div class="grid grid-cols-5 gap-3 mb-8 w-full max-w-md">
          <div
            v-for="skin in ['blob', 'cat', 'robo', 'ghost', 'dino'] as SkinType[]"
            :key="skin"
            @click="selectedSkin = skin"
            class="p-1 border-2 cursor-pointer transition-all hover:scale-110 flex items-center justify-center bg-bg-deep/50 aspect-square overflow-hidden"
            :class="
              selectedSkin === skin
                ? 'border-accent-coral bg-bg-elevated'
                : 'border-border-default opacity-40'
            "
            :title="skin.toUpperCase()"
          >
            <!-- Mini SVG Preview -->
            <div class="scale-[1.5] image-render-pixel">
              <svg
                v-if="skin === 'blob'"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                :class="selectedSkin === skin ? 'text-accent-coral' : 'text-text-secondary'"
              >
                <path d="M4 3h8v1h2v8h-1v2H3v-2H2V4h2V3z" />
              </svg>
              <svg
                v-else-if="skin === 'cat'"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                :class="selectedSkin === skin ? 'text-accent-amber' : 'text-text-secondary'"
              >
                <path d="M3 2h2v1h6V2h2v2h1v9h-1v1H11v-1H5v1H3v-1H2V4h1V2z" />
              </svg>
              <svg
                v-else-if="skin === 'robo'"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                :class="selectedSkin === skin ? 'text-accent-sky' : 'text-text-secondary'"
              >
                <path
                  d="M3 3h10v10H3V3z M2 6h1v4H2V6z M13 6h1v4h-1V6z M5 2h2v1H5V2z M9 2h2v1H9V2z"
                />
              </svg>
              <svg
                v-else-if="skin === 'ghost'"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                :class="selectedSkin === skin ? 'text-text-primary' : 'text-text-secondary'"
              >
                <path d="M4 2h8v11l-2-2-2 2-2-2-2 2V2z" />
              </svg>
              <svg
                v-else
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                :class="selectedSkin === skin ? 'text-accent-amber' : 'text-text-secondary'"
              >
                <path d="M4 2h7v2h2v4h-2v2H9v2h2v2H3v-2h1v-4H3V4h1V2z" />
              </svg>
            </div>
          </div>
        </div>

        <p class="mb-3 text-text-secondary">2. Đặt tên gọi thân thương:</p>
        <input
          v-model="newName"
          type="text"
          maxlength="12"
          placeholder="Nhập tên..."
          class="bg-bg-deep border-4 border-border-default p-3 mb-8 text-center focus:outline-none focus:border-accent-coral w-full max-w-md font-pixel text-lg"
          @keyup.enter="handleNaming"
        />

        <button
          @click="handleNaming"
          class="pixel-btn bg-accent-coral text-bg-deep px-10 py-4 hover:bg-accent-coral/90 transition-colors font-bold text-lg w-full max-w-md mb-6"
        >
          TIẾN VÀO VIBE WORLD
        </button>

        <!-- Music Credit Link -->
        <div
          class="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <p class="text-[10px] uppercase tracking-widest font-bold text-text-dim">Âm nhạc bởi:</p>
          <a
            href="https://pixabay.com/vi/users/nocopyrightsound633-47610058/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[10px] text-accent-sky hover:underline font-bold"
          >
            nocopyrightsound633 (Pixabay)
          </a>
        </div>
      </div>

      <!-- Stats Bar Top -->
      <div
        class="w-full flex justify-between mb-8 text-xs font-pixel text-text-secondary uppercase"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <Icon icon="pixelarticons:user" class="text-accent-sky" />
            <span class="font-bold text-text-primary text-sm">{{ stats.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon icon="pixelarticons:trending-up" class="text-accent-amber" />
            <span class="font-bold"
              >LV <span class="text-accent-amber text-sm">{{ stats.level }}</span></span
            >
            <span class="text-[8px] text-text-dim">(Stage {{ evolutionStage }})</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="font-bold text-[10px]">KINH NGHIỆM</span>
          <div class="w-48 h-3 bg-bg-deep border-2 border-border-default overflow-hidden">
            <div
              class="h-full bg-accent-amber transition-all duration-700 ease-out"
              :style="{ width: `${(stats.exp / (stats.level * 100)) * 100}%` }"
            ></div>
          </div>
          <span class="text-[8px] opacity-70"
            >{{ Math.floor(stats.exp) }} / {{ stats.level * 100 }}</span
          >
        </div>
      </div>

      <!-- Pet Display Area (WIDER & TALLER) -->
      <div
        class="w-full h-[400px] border-4 border-border-default mb-8 flex items-center justify-center relative overflow-hidden group transition-colors duration-500"
        :class="
          stats.anger > 70
            ? 'bg-accent-coral/10 border-accent-coral'
            : 'bg-bg-deep/40 border-border-default'
        "
      >
        <!-- Inner Glow -->
        <div
          class="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500"
          :style="{
            boxShadow:
              stats.anger > 70
                ? 'inset 0 0 100px rgba(255, 107, 74, 0.4)'
                : 'inset 0 0 60px rgba(0,0,0,0.6)',
            opacity: stats.anger > 70 ? 1 : 0.8,
          }"
        ></div>

        <!-- Internal Background Layers -->
        <div class="absolute inset-0 pointer-events-none z-0">
          <div class="scrolling-bg internal-clouds"></div>
          <div class="scrolling-bg trees opacity-20"></div>
          <div class="scrolling-bg grass opacity-30 h-16 top-auto bottom-0"></div>
        </div>

        <!-- Anger Warning Icons -->
        <div
          v-if="stats.anger > 70"
          class="absolute inset-0 pointer-events-none z-20 overflow-hidden"
        >
          <Icon
            v-for="n in 5"
            :key="n"
            icon="twemoji:angry-face-with-horns"
            class="absolute size-8 opacity-20 animate-pulse"
            :style="{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${n * 0.5}s`,
            }"
          />
        </div>

        <!-- The Pet Container (Smaller scale relative to screen) -->
        <div
          class="pet-idle flex flex-col items-center stage-transition z-10"
          :class="{ 'animate-anger': stats.anger > 70 }"
          :style="{
            transform: `scale(${0.8 + (evolutionStage - 1) * 0.3})`,
            filter: stats.anger > 70 ? 'drop-shadow(0 0 8px #ff6b4a)' : 'none',
          }"
        >
          <!-- BLOB SKIN -->
          <svg
            v-if="stats.skin === 'blob'"
            width="80"
            height="80"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="image-render-pixel scale-[2.2]"
            :class="stats.anger > 70 ? 'text-accent-coral' : 'text-accent-coral'"
          >
            <path d="M4 3h8v1h2v8h-1v2H3v-2H2V4h2V3z" />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="5"
              y="6"
              width="2"
              height="2"
              fill="white"
            />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="9"
              y="6"
              width="2"
              height="2"
              fill="white"
            />
            <path
              v-if="petMood === 'angry'"
              d="M5 6l2 1 M11 6l-2 1"
              stroke="white"
              stroke-width="0.8"
            />
            <rect v-if="petMood === 'angry'" x="5" y="8" width="2" height="1" fill="white" />
            <rect v-if="petMood === 'angry'" x="9" y="8" width="2" height="1" fill="white" />
            <path v-if="petMood === 'sleeping'" d="M5 7h2M9 7h2" stroke="white" stroke-width="1" />
            <rect v-if="petMood === 'happy'" x="7" y="10" width="2" height="1" fill="white" />
            <!-- Evolution detail: Stage 2 adds dots, Stage 3 adds crown -->
            <rect
              v-if="evolutionStage >= 2"
              x="3"
              y="10"
              width="1"
              height="1"
              fill="rgba(255,255,255,0.3)"
            />
            <rect
              v-if="evolutionStage >= 2"
              x="12"
              y="10"
              width="1"
              height="1"
              fill="rgba(255,255,255,0.3)"
            />
            <path
              v-if="evolutionStage >= 3"
              d="M6 1h1v1h2V1h1v2H6V1z"
              fill="var(--color-accent-amber)"
            />
          </svg>

          <!-- CAT SKIN -->
          <svg
            v-else-if="stats.skin === 'cat'"
            width="80"
            height="80"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="text-accent-amber image-render-pixel scale-[2.2]"
          >
            <path d="M3 2h2v1h6V2h2v2h1v9h-1v1H11v-1H5v1H3v-1H2V4h1V2z" />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="5"
              y="6"
              width="2"
              height="2"
              fill="white"
            />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="9"
              y="6"
              width="2"
              height="2"
              fill="white"
            />
            <path
              v-if="petMood === 'angry'"
              d="M5 6l2 1 M11 6l-2 1"
              stroke="white"
              stroke-width="0.8"
            />
            <rect v-if="petMood === 'angry'" x="5" y="8" width="1" height="1" fill="white" />
            <rect v-if="petMood === 'angry'" x="10" y="8" width="1" height="1" fill="white" />
            <path v-if="petMood === 'sleeping'" d="M5 7h2M9 7h2" stroke="white" stroke-width="1" />
            <!-- Evolution: Stage 2 adds stripes, Stage 3 adds wings -->
            <rect
              v-if="evolutionStage >= 2"
              x="7"
              y="3"
              width="2"
              height="1"
              fill="rgba(0,0,0,0.2)"
            />
            <path
              v-if="evolutionStage >= 3"
              d="M1 5h1V8H1V5z M14 5h1v3h-1V5z"
              fill="white"
              opacity="0.6"
            />
          </svg>

          <!-- ROBO SKIN -->
          <svg
            v-else-if="stats.skin === 'robo'"
            width="80"
            height="80"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="text-accent-sky image-render-pixel scale-[2.2]"
          >
            <path d="M3 3h10v10H3V3z M2 6h1v4H2V6z M13 6h1v4h-1V6z M5 2h2v1H5V2z M9 2h2v1H9V2z" />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="5"
              y="6"
              width="2"
              height="2"
              fill="#0f1923"
            />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="9"
              y="6"
              width="2"
              height="2"
              fill="#0f1923"
            />
            <rect v-if="petMood === 'angry'" x="5" y="6" width="6" height="2" fill="red" />
            <rect x="5" y="10" width="6" height="1" fill="#0f1923" />
            <!-- Evolution: Stage 2 adds antenna glow, Stage 3 adds armor plates -->
            <rect
              v-if="evolutionStage >= 2"
              x="5"
              y="1"
              width="1"
              height="1"
              fill="red"
              class="animate-pulse"
            />
            <rect
              v-if="evolutionStage >= 3"
              x="4"
              y="4"
              width="8"
              height="1"
              fill="white"
              opacity="0.3"
            />
          </svg>

          <!-- GHOST SKIN -->
          <svg
            v-else-if="stats.skin === 'ghost'"
            width="80"
            height="80"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="text-text-primary opacity-80 image-render-pixel scale-[2.2]"
          >
            <path d="M4 2h8v11l-2-2-2 2-2-2-2 2V2z" />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="5"
              y="5"
              width="2"
              height="3"
              fill="#0f1923"
            />
            <rect
              v-if="petMood !== 'sleeping' && petMood !== 'angry'"
              x="9"
              y="5"
              width="2"
              height="3"
              fill="#0f1923"
            />
            <rect v-if="petMood === 'angry'" x="5" y="5" width="2" height="3" fill="red" />
            <rect v-if="petMood === 'angry'" x="9" y="5" width="2" height="3" fill="red" />
            <!-- Evolution: Stage 2 adds trail, Stage 3 adds aura -->
            <path v-if="evolutionStage >= 2" d="M5 14h6v1H5v-1z" opacity="0.4" />
            <circle
              v-if="evolutionStage >= 3"
              cx="8"
              cy="7"
              r="6"
              fill="none"
              stroke="white"
              stroke-width="0.5"
              stroke-dasharray="2"
              class="animate-spin"
              style="animation-duration: 10s"
            />
          </svg>

          <!-- DINO SKIN -->
          <svg
            v-else
            width="80"
            height="80"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="text-accent-amber/90 image-render-pixel scale-[2.2]"
          >
            <path d="M4 2h7v2h2v4h-2v2H9v2h2v2H3v-2h1v-4H3V4h1V2z" />
            <rect v-if="petMood !== 'sleeping'" x="9" y="4" width="1" height="1" fill="white" />
            <path v-if="petMood === 'angry'" d="M9 7h3v1H9V7z" fill="red" />
            <!-- Evolution: Stage 2 adds spikes, Stage 3 adds fire breath tip -->
            <path
              v-if="evolutionStage >= 2"
              d="M3 3h1v1H3V3z M2 6h1v1H2V6z M2 9h1v1H2V9z"
              fill="var(--color-accent-coral)"
            />
            <rect
              v-if="evolutionStage >= 3"
              x="13"
              y="7"
              width="2"
              height="1"
              fill="red"
              class="animate-pulse"
            />
          </svg>

          <div
            class="mt-14 text-[10px] font-pixel text-accent-sky bg-bg-deep/90 px-4 py-2 border-2 border-border-default uppercase font-bold tracking-widest shadow-lg"
          >
            {{ petStatus }}
          </div>
        </div>

        <!-- Floating ZZZ -->
        <div
          v-if="stats.isSleeping"
          class="absolute top-20 right-20 font-pixel text-accent-sky animate-bounce font-bold tracking-widest text-2xl opacity-80 z-20"
        >
          Zzz...
        </div>
      </div>

      <!-- Interaction Stats Bars (WIDE GRID) -->
      <div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 mb-3">
        <!-- Hunger -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-[10px] font-pixel font-bold">
            <span class="flex items-center gap-2 italic">
              <Icon icon="pixelarticons:coffee" class="text-accent-sky" /> VIBE-NO:
            </span>
            <span
              :class="stats.hunger < 30 ? 'text-accent-coral animate-pulse' : 'text-text-secondary'"
              >{{ Math.floor(stats.hunger) }}%</span
            >
          </div>
          <div class="h-4 bg-bg-deep border-2 border-border-default p-[2px]">
            <div
              class="h-full bg-accent-sky transition-all duration-700 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
              :style="{ width: `${stats.hunger}%` }"
            ></div>
          </div>
        </div>

        <!-- Happiness -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-[10px] font-pixel font-bold">
            <span class="flex items-center gap-2 italic">
              <Icon icon="pixelarticons:heart" class="text-accent-amber" /> HẠNH PHÚC:
            </span>
            <span
              :class="
                stats.happiness < 30 ? 'text-accent-coral animate-pulse' : 'text-text-secondary'
              "
              >{{ Math.floor(stats.happiness) }}%</span
            >
          </div>
          <div class="h-4 bg-bg-deep border-2 border-border-default p-[2px]">
            <div
              class="h-full bg-accent-amber transition-all duration-700 shadow-[0_0_15px_rgba(255,184,48,0.4)]"
              :style="{ width: `${stats.happiness}%` }"
            ></div>
          </div>
        </div>

        <!-- Energy -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-[10px] font-pixel font-bold">
            <span class="flex items-center gap-2 italic">
              <Icon icon="pixelarticons:zap" class="text-accent-coral" /> NĂNG LƯỢNG:
            </span>
            <span
              :class="stats.energy < 30 ? 'text-accent-coral animate-pulse' : 'text-text-secondary'"
              >{{ Math.floor(stats.energy) }}%</span
            >
          </div>
          <div class="h-4 bg-bg-deep border-2 border-border-default p-[2px]">
            <div
              class="h-full bg-accent-coral transition-all duration-700 shadow-[0_0_15px_rgba(255,107,74,0.4)]"
              :style="{ width: `${stats.energy}%` }"
            ></div>
          </div>
        </div>

        <!-- Anger (NEW) -->
        <div class="space-y-1.5">
          <div class="flex justify-between text-[10px] font-pixel font-bold">
            <span class="flex items-center gap-2 italic">
              <Icon icon="pixelarticons:flame" class="text-accent-coral" /> GIẬN DỮ:
            </span>
            <span
              :class="stats.anger > 70 ? 'text-accent-coral animate-pulse' : 'text-text-secondary'"
              >{{ Math.floor(stats.anger) }}%</span
            >
          </div>
          <div class="h-4 bg-bg-deep border-2 border-border-default p-[2px]">
            <div
              class="h-full bg-accent-coral transition-all duration-700 shadow-[0_0_15px_rgba(255,107,74,0.8)]"
              :style="{
                width: `${stats.anger}%`,
                filter: stats.anger > 70 ? 'hue-rotate(-40deg) saturate(2)' : 'none',
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="w-full max-w-2xl grid grid-cols-4 gap-4 mt-8 z-10 animate-fade-up animate-delay-2">
      <button
        @click="feed"
        :disabled="stats.isSleeping || stats.hunger >= 100"
        class="pixel-btn bg-bg-surface p-5 flex flex-col items-center gap-3 group disabled:opacity-30 disabled:grayscale"
      >
        <Icon
          icon="pixelarticons:coffee"
          class="size-8 text-accent-sky group-hover:scale-125 transition-transform"
        />
        <span class="text-xs font-pixel font-bold tracking-tighter">ĂN SNACK</span>
      </button>

      <button
        @click="play"
        :disabled="stats.isSleeping || stats.energy < 15"
        class="pixel-btn bg-bg-surface p-5 flex flex-col items-center gap-3 group disabled:opacity-30 disabled:grayscale"
      >
        <Icon
          icon="pixelarticons:gamepad"
          class="size-8 text-accent-amber group-hover:scale-125 transition-transform"
        />
        <span class="text-xs font-pixel font-bold tracking-tighter">CHƠI DEV</span>
      </button>

      <button
        @click="toggleSleep"
        class="pixel-btn bg-bg-surface p-5 flex flex-col items-center gap-3 group"
        :class="stats.isSleeping ? 'border-accent-sky' : 'border-border-default'"
      >
        <Icon
          :icon="stats.isSleeping ? 'pixelarticons:sun' : 'pixelarticons:moon'"
          class="size-8 group-hover:scale-125 transition-transform"
          :class="stats.isSleeping ? 'text-accent-amber' : 'text-accent-sky'"
        />
        <span class="text-xs font-pixel uppercase font-bold tracking-tighter">{{
          stats.isSleeping ? 'THỨC DẬY' : 'ĐI NGỦ'
        }}</span>
      </button>

      <button
        @click="showShop = true"
        class="pixel-btn bg-accent-sky/10 p-5 flex flex-col items-center gap-3 group hover:bg-accent-sky/20 transition-colors"
      >
        <Icon
          icon="lucide:shopping-cart"
          class="size-8 text-accent-sky group-hover:scale-125 transition-transform"
        />
        <span class="text-xs font-pixel font-bold tracking-tighter">CỬA HÀNG</span>
      </button>
    </div>

    <div class="mt-12 flex flex-col items-center gap-6 z-10 animate-fade-up animate-delay-2">
      <div class="flex gap-6">
        <button
          @click="showNaming = true"
          class="text-xs font-pixel text-text-dim hover:text-accent-coral transition-colors flex items-center gap-2 hover:underline tracking-widest uppercase font-bold"
        >
          <Icon icon="pixelarticons:edit" />
          Đổi tên & Skin
        </button>
        <RouterLink
          to="/"
          class="text-xs font-pixel text-text-dim hover:text-accent-amber transition-colors flex items-center gap-2 hover:underline tracking-widest uppercase font-bold"
        >
          <Icon icon="pixelarticons:home" />
          Về Trang Chủ
        </RouterLink>
      </div>

      <!-- Persistent Credit -->
      <div class="flex flex-col items-center gap-1 opacity-40 hover:opacity-80 transition-opacity">
        <p class="text-[8px] uppercase tracking-[0.2em] font-bold text-text-dim italic">
          Background Music by
        </p>
        <a
          href="https://pixabay.com/vi/users/nocopyrightsound633-47610058/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[9px] text-accent-sky hover:underline font-pixel"
        >
          nocopyrightsound633 @ Pixabay
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-render-pixel {
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: pixelated;
  image-rendering: optimize-speed;
}
</style>
