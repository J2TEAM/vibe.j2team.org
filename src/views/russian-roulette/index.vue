<template>
  <div
    class="relative min-h-screen bg-bg-deep overflow-hidden font-body flex flex-col items-center justify-end px-4 md:px-0"
  >
    <!-- Header: Links & Metadata -->
    <div class="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-50">
      <div class="flex flex-row items-center gap-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-coral/5 focus:outline-none focus:ring-2 focus:ring-accent-coral"
        >
          &larr; Trang chủ
        </RouterLink>

        <div class="relative md:hidden flex">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="p-2 border border-border-default bg-bg-surface/90 backdrop-blur-md text-text-secondary hover:text-accent-amber shadow-xl cursor-pointer flex items-center justify-center transition-colors h-[42px] w-[42px]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>

          <transition name="fade">
            <div
              v-if="showMobileMenu"
              class="absolute top-full left-0 mt-2 flex flex-col gap-1 w-32 shadow-2xl z-50"
            >
              <button
                @click="openRules"
                class="px-4 py-3 border border-border-default bg-bg-deep text-text-primary text-[10px] font-display font-bold tracking-widest text-left active:bg-bg-surface flex items-center gap-2"
              >
                <Icon icon="mdi:book-open-variant" class="w-4 h-4 text-accent-sky" /> LUẬT
              </button>
              <button
                @click="openSettings"
                class="px-4 py-3 border border-border-default bg-bg-deep text-text-primary text-[10px] font-display font-bold tracking-widest text-left active:bg-bg-surface flex items-center gap-2"
              >
                <Icon icon="mdi:cog" class="w-4 h-4 text-accent-amber" /> CÀI ĐẶT
              </button>
            </div>
          </transition>
        </div>
      </div>

      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-[10px] md:text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg shadow-accent-coral/20 hover:rotate-0 transition-transform cursor-default select-none"
      >
        VOL.01 / 2026
      </div>
    </div>

    <!-- Intro Overlay -->
    <IntroScreen
      v-model="aiDifficulty"
      :isIntro="isIntro"
      :difficultyOptions="difficultyOptions"
      @enterGame="enterGame"
    />

    <!-- Blackout Overlay (Z-index 100) / Wake-up sequence -->
    <transition name="blackout">
      <div
        v-if="isBlackout"
        class="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none animate-unconscious"
      >
        <div
          class="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
        ></div>
      </div>
    </transition>

    <!-- Hiệu ứng Kính Lúp (Magnifying Glass Peek) -->
    <transition name="peek">
      <div
        v-if="peekedBullet !== null"
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[180] pointer-events-none"
      >
        <div
          class="relative w-36 h-36 md:w-48 md:h-48 rounded-full border-4 flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md animate-peek-zoom"
          :class="peekedBullet ? 'border-red-500 bg-red-950/80' : 'border-blue-500 bg-blue-950/80'"
        >
          <!-- Viên đạn bên trong kính lúp -->
          <div class="flex flex-col items-center">
            <div
              class="w-8 h-20 rounded-t-sm shadow-inner relative overflow-hidden"
              :class="peekedBullet ? 'bg-red-600' : 'bg-blue-600'"
            >
              <div class="absolute inset-y-0 left-0 w-1 bg-white/20"></div>
              <div class="absolute inset-y-0 right-0 w-1 bg-black/20"></div>
            </div>

            <div
              class="w-8 h-4 bg-yellow-600 rounded-b-sm border-t border-yellow-400 shadow-md relative"
            >
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-yellow-700/50 bg-yellow-500/30"
              ></div>
            </div>

            <span
              class="font-display text-lg font-bold tracking-widest uppercase mt-3"
              :class="peekedBullet ? 'text-red-400' : 'text-blue-400'"
            >
              {{ peekedBullet ? 'THẬT' : 'RỖNG' }}
            </span>
          </div>
          <!-- Viền phát sáng -->
          <div
            class="absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none"
            :class="peekedBullet ? 'bg-red-500' : 'bg-blue-500'"
          ></div>
        </div>
      </div>
    </transition>

    <!-- Game Container (Perspective FPS effect) -->
    <div class="relative w-full max-w-5xl h-screen flex flex-col perspective-container">
      <!-- LAYER 1: Background (AI Character) -->
      <div
        class="absolute inset-x-0 top-0 h-[50%] md:h-[40%] flex flex-col items-center justify-center bg-[#0C141E] border-x border-t border-border-default shadow-[inset_0_0_200px_rgba(0,0,0,0.95)] translate-z-neg px-4 z-0"
      >
        <!-- Ambient lighting -->
        <div
          class="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-bg-surface/30 to-transparent pointer-events-none"
        ></div>

        <div
          class="flex flex-row items-center justify-center gap-8 md:gap-16 translate-y-8 w-full max-w-4xl mx-auto"
        >
          <div class="w-48 md:w-60 relative flex justify-center">
            <img
              src="./assets/dealer.png"
              alt="Dealer Character"
              class="relative z-10 w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
            />
          </div>

          <!-- AI HP (Lightning bolts) - Positioned at bottom right of dealer area -->
          <div
            class="absolute right-2 md:right-4 bottom-2 flex flex-col md:flex-row gap-2 items-end md:items-center z-20"
          >
            <!-- HP Container -->
            <div
              class="flex flex-col md:flex-row items-center backdrop-blur-sm bg-bg-surface shadow-xl px-2 py-2 md:py-0 md:h-10 md:min-w-[130px] md:justify-start w-auto"
            >
              <!-- Mobile: cột dọc | Desktop: hàng ngang -->
              <div class="flex flex-col-reverse md:flex-row items-center gap-1">
                <svg
                  v-for="i in aiHp"
                  :key="'ai-hp-' + i"
                  class="w-4 h-4 md:w-5 md:h-5 text-accent-sky drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
                  />
                </svg>
                <span
                  v-if="aiHp === 0"
                  class="text-accent-coral text-[10px] font-display font-bold px-1"
                  >DEAD</span
                >
              </div>
            </div>

            <!-- Handcuffed -->
            <div
              v-if="isAiHandcuffed"
              class="text-center text-accent-amber text-[10px] md:text-xs font-display tracking-widest animate-pulse whitespace-nowrap flex items-center gap-1"
            >
              <Icon icon="game-icons:handcuffs" class="w-3 h-3 md:w-4 md:h-4" /> CÒNG
            </div>
          </div>
        </div>

        <div
          v-if="!isIntro && aiItems.length > 0"
          class="absolute bottom-2 left-2 md:left-4 flex flex-col md:flex-row gap-1.5 z-20"
        >
          <div
            v-for="(item, index) in aiItems"
            :key="'ai-item-' + index"
            class="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center border border-border-default/40 bg-bg-surface/30 text-base md:text-lg select-none opacity-70"
            :title="getItemName(item)"
          >
            <Icon :icon="getItemIcon(item)" />
          </div>
        </div>
      </div>

      <!-- LAYER 2: Midground (Wooden Table) -->
      <div
        class="absolute inset-x-0 bottom-[20%] md:bottom-[30%] h-[35%] md:h-[30%] bg-amber-950 border-2 border-border-default shadow-[0_-20px_50px_rgba(0,0,0,0.9)] table-perspective flex flex-col items-center justify-start pt-6 z-10 w-[110%] -ml-[5%]"
      >
        <div
          class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZiZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjwvc3ZnPg==')] mix-blend-overlay"
        ></div>
        <div
          class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40"
        ></div>

        <div
          class="relative w-60 md:w-64 h-24 md:h-20 shadow-[0_25px_40px_rgba(0,0,0,0.8)] transform z-10 flex items-center justify-center mt-2 md:mt-6"
        >
          <img
            src="./assets/shotgun.png"
            alt="Shotgun"
            class="w-full h-auto object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.9)]"
            :class="{ 'scale-x-75 brightness-125': isSawedOff }"
          />

          <div
            class="absolute -bottom-16 md:-bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-3 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl min-w-[150px] md:min-w-[160px] justify-center"
          >
            <div
              v-for="(isLive, index) in cylinder"
              :key="'shell-' + index"
              class="relative w-4 h-10 md:w-4 md:h-12 flex flex-col items-center"
            >
              <div
                class="w-full h-7 md:h-10 rounded-t-sm"
                :class="isLive ? 'bg-red-600' : 'bg-blue-600'"
              ></div>
              <div class="w-[110%] h-2.5 md:h-2.5 bg-yellow-600 rounded-sm"></div>
            </div>
          </div>
        </div>

        <div
          class="mt-24 md:mt-20 w-[90%] md:max-w-lg px-4 py-3 md:px-8 md:py-5 bg-bg-deep/95 border-2 border-accent-amber text-center backdrop-blur-md relative"
        >
          <p
            class="font-display text-accent-amber text-md md:text-2xl tracking-widest font-bold uppercase"
          >
            {{ turnMessage }}
          </p>
        </div>
      </div>

      <!-- LAYER 3: Foreground (Player UI) -->
      <div
        v-if="!isIntro"
        class="absolute inset-x-0 bottom-[2%] md:bottom-0 z-50 pointer-events-auto w-full px-0 pb-6 md:pb-10 flex justify-center"
      >
        <div
          class="w-full max-w-7xl flex flex-col md:flex-row items-stretch md:items-end justify-between gap-2 md:gap-4 animate-fade-up px-4 md:px-0"
        >
          <div
            class="grid grid-cols-2 md:flex md:flex-col items-stretch md:items-start gap-2 md:gap-3 w-full md:w-auto md:flex-1 md:p-0 md:ml-8"
          >
            <div
              class="flex items-center justify-center md:justify-start gap-1.5 px-2 md:px-4 bg-bg-surface/90 border border-border-default md:border-b-0 backdrop-blur-md shadow-2xl h-12 md:h-14 w-full"
            >
              <div class="flex items-center justify-center gap-1 w-full">
                <svg
                  v-for="i in playerHp"
                  :key="'p-hp-' + i"
                  class="w-4 h-4 md:w-6 md:h-6 text-accent-coral drop-shadow-[0_0_12px_rgba(255,107,74,0.5)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span
                  v-if="playerHp === 0"
                  class="text-accent-coral text-[10px] font-display font-bold"
                  >DEAD</span
                >
                <Icon
                  v-if="isPlayerHandcuffed"
                  icon="game-icons:handcuffs"
                  class="ml-1 text-accent-amber animate-pulse w-4 h-4 md:w-5 md:h-5"
                />
              </div>
            </div>

            <div
              class="flex md:hidden overflow-x-auto gap-1 p-1 bg-bg-surface/90 border border-border-default backdrop-blur-md h-12 w-full items-center justify-start"
            >
              <button
                v-for="(item, index) in playerItems"
                :key="'p-item-mobile-' + index"
                @click="playerUseItem(item)"
                :disabled="!isPlayerTurn || isActionDisabled || gameOver"
                class="w-9 h-9 flex-shrink-0 flex items-center justify-center border bg-bg-deep border-border-default hover:border-accent-amber active:bg-bg-elevated disabled:opacity-30 cursor-pointer text-sm"
              >
                <Icon :icon="getItemIcon(item)" class="w-full h-full p-2" />
              </button>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2 md:gap-4 w-full md:w-[450px] lg:w-[500px]">
            <div
              class="hidden md:flex flex-row flex-wrap justify-center items-center gap-2.5 p-2.5 bg-bg-surface/90 border border-border-default backdrop-blur-md shadow-xl min-h-[66px] min-w-[340px]"
            >
              <button
                v-for="(item, index) in playerItems"
                :key="'p-item-desktop-' + index"
                @click="playerUseItem(item)"
                :disabled="!isPlayerTurn || isActionDisabled || gameOver"
                class="w-11 h-11 flex items-center justify-center border bg-bg-deep border-border-default hover:border-accent-amber hover:shadow-[0_0_15px_rgba(255,184,48,0.2)] transition-all disabled:opacity-20 cursor-pointer"
                :title="getItemName(item)"
              >
                <Icon :icon="getItemIcon(item)" class="w-full h-full p-2" />
              </button>
            </div>

            <div class="grid grid-cols-2 md:flex md:flex-row w-full gap-2 md:gap-5">
              <button
                @click="playerShootSelf"
                :disabled="!isPlayerTurn || gameOver || cylinder.length === 0 || isActionDisabled"
                class="w-full py-3.5 md:h-14 bg-bg-surface md:border border-border-default text-text-primary text-xs md:text-base font-display font-bold tracking-widest hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-1 transition-all shadow-lg disabled:opacity-30 disabled:translate-y-0 cursor-pointer uppercase flex items-center justify-center text-center leading-tight"
              >
                Bắn bản thân
              </button>
              <button
                @click="playerShootAI"
                :disabled="!isPlayerTurn || gameOver || cylinder.length === 0 || isActionDisabled"
                class="w-full py-3.5 md:h-14 bg-bg-surface md:border border-border-default text-text-primary text-xs md:text-base font-display font-bold tracking-widest hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-1 transition-all shadow-lg disabled:opacity-30 disabled:translate-y-0 cursor-pointer uppercase flex items-center justify-center text-center leading-tight"
              >
                Bắn đối thủ
              </button>
            </div>
          </div>

          <div class="hidden md:flex flex-row items-center justify-end gap-2 flex-1 md:mr-8">
            <button
              @click="showRulesModal = true"
              class="w-24 h-14 flex flex-col items-center justify-center border border-border-default bg-bg-surface text-text-secondary hover:text-accent-sky hover:border-accent-sky transition-all cursor-pointer"
            >
              <Icon icon="mdi:book-open-variant" class="text-xl mb-0.5" />
              <span class="text-[10px] font-display font-bold tracking-widest uppercase">Luật</span>
            </button>
            <button
              @click="showSettingsModal = true"
              class="w-24 h-14 flex flex-col items-center justify-center border border-border-default bg-bg-surface text-text-secondary hover:text-accent-amber hover:border-accent-amber transition-all cursor-pointer"
            >
              <Icon icon="mdi:cog" class="text-xl mb-0.5" />
              <span class="text-[10px] font-display font-bold tracking-widest uppercase"
                >Cài đặt</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>

    <GameOverScreen :gameOver="gameOver" :winner="winner" @startNewGame="startNewGame" />

    <RulesModal v-model="showRulesModal" />

    <SettingsModal
      v-model="showSettingsModal"
      v-model:isSoundOn="isSoundOn"
      v-model:sfxVolume="sfxVolume"
      :aiDifficulty="aiDifficulty"
      :difficultyOptions="difficultyOptions"
      @changeDifficulty="changeDifficulty"
    />
  </div>
  <BackToTop />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BackToTop from '@/components/BackToTop.vue'
import { Icon } from '@iconify/vue'
import { useGameLogic } from './composables/useGameLogic'
import type { ItemType } from './composables/useGameLogic'
import type { AIDifficulty } from './composables/useAI'

// Import components
import IntroScreen from './components/IntroScreen.vue'
import GameOverScreen from './components/GameOverScreen.vue'
import RulesModal from './components/RulesModal.vue'
import SettingsModal from './components/SettingsModal.vue'

const {
  playerHp,
  aiHp,
  cylinder,
  isPlayerTurn,
  isBlackout,
  gameOver,
  winner,
  turnMessage,
  isActionDisabled,
  playerShootSelf,
  playerShootAI,
  isIntro,
  showSettingsModal,
  isSoundOn,
  sfxVolume,
  aiDifficulty,
  initIntro,
  enterGame,
  startNewGame,
  disposeAudio,
  // Hệ thống vật phẩm
  playerItems,
  aiItems,
  playerUseItem,
  isSawedOff,
  peekedBullet,
  isPlayerHandcuffed,
  isAiHandcuffed,
} = useGameLogic()

// State cho modal luật chơi
const showRulesModal = ref(false)
const showMobileMenu = ref(false)

const openRules = () => {
  showRulesModal.value = true
  showMobileMenu.value = false
}

const openSettings = () => {
  showSettingsModal.value = true
  showMobileMenu.value = false
}

const changeDifficulty = (lvl: AIDifficulty) => {
  aiDifficulty.value = lvl
  if (!isIntro.value) {
    startNewGame()
    showSettingsModal.value = false
  }
}

// Danh sách độ khó của AI
const difficultyOptions = [
  { value: 'easy', label: 'Dễ', desc: 'AI đôi khi chơi ngẫu nhiên' },
  { value: 'normal', label: 'Thường', desc: 'AI khá thông minh' },
  { value: 'hard', label: 'Khó', desc: 'AI luôn chọn nước tối ưu' },
] as const

// Icon và tên vật phẩm
function getItemIcon(item: ItemType): string {
  const map: Record<ItemType, string> = {
    cigarette: 'game-icons:cigarette',
    beer: 'hugeicons:soda-can',
    magnifying_glass: 'noto:magnifying-glass-tilted-left',
    handcuffs: 'game-icons:handcuffs',
    handsaw: 'twemoji:carpentry-saw',
  }
  return map[item]
}

function getItemName(item: ItemType): string {
  const map: Record<ItemType, string> = {
    cigarette: 'Thuốc lá (+1 HP)',
    beer: 'Bia (Loại bỏ viên đạn)',
    magnifying_glass: 'Kính lúp (Xem đạn)',
    handcuffs: 'Còng tay (Mất lượt)',
    handsaw: 'Cưa sắt (x2 sát thương)',
  }
  return map[item]
}

onMounted(() => {
  initIntro()
})

// Dọn dẹp tài nguyên âm thanh khi rời trang
onUnmounted(() => {
  disposeAudio()
})
</script>

<style scoped>
.perspective-container {
  perspective: 1200px;
}
.translate-z-neg {
  transform: translateZ(-200px);
}
.table-perspective {
  transform: rotateX(55deg) translateZ(50px);
  transform-origin: bottom;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Blackout: Sập nguồn ngay lập tức (instant), Tỉnh dậy từ từ (fade) */
.blackout-enter-active {
  transition: none !important;
}
.blackout-leave-active {
  transition: opacity 2s ease-out;
}
.blackout-enter-from {
  opacity: 1;
}
.blackout-leave-to {
  opacity: 0;
}

/* Transition cho hiệu ứng kính lúp */
.peek-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.peek-leave-active {
  transition: all 0.5s ease-out;
}
.peek-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.3);
}
.peek-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.5);
}

/* Animations that might not be in Tailwind Config */
@keyframes fade-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes unconscious-pulse {
  0%,
  100% {
    background-color: #000000;
  }
  50% {
    background-color: #0a0a0a;
  } /* Sáng lên một chút màu xám rất tối */
}

.animate-unconscious {
  animation: unconscious-pulse 3s ease-in-out infinite;
}

/* Hiệu ứng mờ ảo cho chữ khi bất tỉnh */
@keyframes text-ghost {
  0%,
  100% {
    opacity: 0.3;
    filter: blur(2px);
    transform: scale(0.98);
  }
  50% {
    opacity: 0.8;
    filter: blur(0px);
    transform: scale(1);
  }
}

.animate-text-ghost {
  animation: text-ghost 3s ease-in-out infinite;
}

.animate-fade-up {
  animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.animate-delay-2 {
  animation-delay: 200ms;
}

.animate-delay-3 {
  animation-delay: 400ms;
}

.animate-delay-4 {
  animation-delay: 600ms;
}

/* Hiệu ứng zoom kính lúp */
@keyframes peek-zoom {
  0% {
    transform: scale(0.5) rotate(-10deg);
  }
  50% {
    transform: scale(1.05) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.animate-peek-zoom {
  animation: peek-zoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
</style>
