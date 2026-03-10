<template>
  <div
    class="relative min-h-screen bg-bg-deep overflow-hidden font-body flex flex-col items-center justify-center px-4 md:px-0"
  >
    <!-- Header: Links & Metadata -->
    <div class="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-coral/5 focus:outline-none focus:ring-2 focus:ring-accent-coral"
        >
          &larr; Trang chủ
        </RouterLink>

        <!-- Nút Cài đặt -->
        <button
          @click="showSettingsModal = true"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-amber/5 focus:outline-none focus:ring-2 focus:ring-accent-amber"
        >
          Cài đặt
        </button>
      </div>

      <div
        class="hidden sm:block bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg shadow-accent-coral/20 hover:rotate-0 transition-transform cursor-default select-none"
      >
        VOL.01 / 2026
      </div>
    </div>

    <!-- Footer: Author -->
    <div
      class="absolute bottom-6 left-6 z-50 text-xs text-text-dim font-display tracking-widest select-none cursor-default opacity-80"
    >
      <span class="text-accent-coral mr-2">//</span> TÁC GIẢ: hoangphi117
    </div>

    <!-- Intro Overlay (Z-index 200) -->
    <transition name="fade">
      <div
        v-if="isIntro"
        class="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-center z-[200] backdrop-blur-md px-4 text-center"
      >
        <h1
          class="font-display text-5xl md:text-8xl font-bold mb-4 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,107,74,0.3)] text-accent-coral animate-fade-up"
        >
          BUCKSHOT ROULETTE
        </h1>
        <p
          class="text-text-secondary text-lg mb-8 tracking-widest uppercase font-display animate-fade-up animate-delay-2"
        >
          Một cuộc chơi đánh cược sinh mạng
        </p>

        <div
          class="mb-10 text-text-primary text-base md:text-lg font-body max-w-lg mx-auto !leading-relaxed text-left animate-fade-up animate-delay-3 p-6 border border-border-default bg-bg-surface/80 shadow-2xl"
        >
          <h3
            class="text-accent-amber font-display font-bold text-2xl text-center mb-4 border-b border-border-default/50 pb-2"
          >
            Luật Chơi
          </h3>
          <ul class="list-disc pl-5 space-y-3 text-text-secondary">
            <li>
              Súng sẽ nạp một số đạn <strong class="text-red-500 font-bold">THẬT</strong> và
              <strong class="text-blue-500 font-bold">RỖNG</strong> ngẫu nhiên.
            </li>
            <li>
              Đến lượt bạn, chọn bắn
              <strong class="text-text-primary uppercase font-bold text-sm">Bản Thân</strong> hoặc
              <strong class="text-text-primary uppercase font-bold text-sm">Đối Thủ</strong>.
            </li>
            <li>
              Bắn <strong>BẢN THÂN</strong> bằng đạn
              <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ được giữ lượt.
            </li>
            <li>
              Bắn <strong>ĐỐI THỦ</strong> bằng đạn
              <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ mất lượt.
            </li>
            <li>Người hết sinh mạng trước cược thua mạng sống.</li>
          </ul>
        </div>

        <div class="flex gap-4 animate-fade-up animate-delay-4">
          <button
            @click="enterGame"
            class="group relative px-12 py-5 bg-transparent border-2 border-accent-coral text-accent-coral text-xl font-display font-bold transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep hover:shadow-[0_0_30px_rgba(255,107,74,0.5)] tracking-widest cursor-pointer"
          >
            <span class="relative z-10">VÀO GAME</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Blackout Overlay (Z-index 100) / Wake-up sequence -->
    <transition name="fade">
      <div
        v-if="isBlackout"
        class="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none animate-unconscious"
      >
        <div
          class="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
        ></div>
      </div>
    </transition>

    <!-- Game Container (Perspective FPS effect) -->
    <div class="relative w-full max-w-5xl h-[85vh] mt-8 flex flex-col perspective-container">
      <!-- LAYER 1: Background (AI Character) -->
      <div
        class="absolute inset-x-0 top-0 h-[50%] flex flex-col items-center justify-center bg-[#0C141E] border-x border-t border-border-default shadow-[inset_0_0_200px_rgba(0,0,0,0.95)] translate-z-neg px-4 z-0"
      >
        <!-- Ambient lighting -->
        <div
          class="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-bg-surface/30 to-transparent pointer-events-none"
        ></div>

        <div
          class="flex flex-row items-center justify-center gap-8 md:gap-16 translate-y-8 w-full max-w-4xl mx-auto"
        >
          <div class="w-48 md:w-72 relative flex justify-center">
            <img
              src="./assets/dealer.png"
              alt="Dealer Character"
              class="relative z-10 w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
            />
          </div>

          <!-- AI HP (Lightning bolts) -->
          <div
            class="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 flex flex-col gap-3 p-3 border border-border-default/50 bg-bg-surface/40 backdrop-blur-sm shadow-inner z-20"
          >
            <svg
              v-for="i in aiHp"
              :key="'ai-hp-' + i"
              class="w-7 h-7 md:w-9 md:h-9 text-accent-sky drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
              />
            </svg>
            <span
              v-if="aiHp === 0"
              class="text-accent-coral text-xl font-display tracking-widest animate-pulse font-bold self-center px-2"
              >DECEASED</span
            >
          </div>
        </div>
      </div>

      <!-- LAYER 2: Midground (Wooden Table) -->
      <div
        class="absolute inset-x-0 bottom-[20%] h-[35%] bg-amber-950 border-2 border-border-default shadow-[0_-20px_50px_rgba(0,0,0,0.9)] table-perspective flex flex-col items-center justify-start pt-6 z-10 w-[110%] -ml-[5%]"
      >
        <div
          class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZiZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjwvc3ZnPg==')] mix-blend-overlay"
        ></div>
        <div
          class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40"
        ></div>

        <!-- Gun Representation -->
        <div
          class="relative w-64 h-20 shadow-[0_25px_40px_rgba(0,0,0,0.8)] transform hover:-translate-y-2 hover:scale-105 transition duration-500 z-10 flex items-center justify-center group pointer-events-none mt-6"
        >
          <img
            src="./assets/shotgun.png"
            alt="Shotgun"
            class="w-full h-auto object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.9)]"
          />
          <!-- Cylinder -->
          <div
            class="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-2 px-4 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl min-w-[160px] justify-center"
          >
            <div
              v-for="(isLive, index) in cylinder"
              :key="'shell-' + index"
              class="relative w-4 h-12 flex flex-col items-center transition-all duration-500 hover:-translate-y-1"
            >
              <div
                class="w-full h-10 rounded-t-sm shadow-inner relative overflow-hidden"
                :class="isLive ? 'bg-red-600' : 'bg-blue-600'"
              >
                <div class="absolute inset-y-0 left-0 w-1 bg-white/20"></div>
                <div class="absolute inset-y-0 right-0 w-1 bg-black/20"></div>
              </div>

              <div
                class="w-[110%] h-2.5 bg-yellow-600 rounded-sm border-t border-yellow-400 shadow-md"
              ></div>

              <div
                class="absolute inset-0 blur-md opacity-20 pointer-events-none"
                :class="isLive ? 'bg-red-500' : 'bg-blue-500'"
              ></div>
            </div>
          </div>
        </div>
        <!-- Message Box -->
        <div
          class="mt-20 w-full max-w-lg px-8 py-5 bg-bg-deep/95 border-2 border-accent-amber text-center shadow-[0_0_30px_rgba(255,184,48,0.15)] backdrop-blur-md relative transform hover:scale-105 transition duration-300"
        >
          <div
            class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-amber to-transparent"
          ></div>
          <p
            class="font-display text-accent-amber text-xl md:text-2xl tracking-widest font-bold uppercase drop-shadow-[0_0_10px_rgba(255,184,48,0.4)]"
          >
            {{ turnMessage }}
          </p>
        </div>
      </div>

      <!-- LAYER 3: Foreground (Player hand & Action UI) -->
      <div
        class="absolute inset-x-0 -bottom-8 h-[25%] flex items-end justify-center z-30 pointer-events-auto w-full px-4"
      >
        <!-- Action Buttons + Player HP in one row -->
        <div class="flex flex-col sm:flex-row items-stretch gap-4 w-full max-w-3xl z-40 relative">
          <button
            @click="playerShootSelf"
            :disabled="!isPlayerTurn || gameOver || cylinder.length === 0 || isActionDisabled"
            class="group relative flex-1 py-5 md:py-2 bg-bg-surface border border-border-default text-text-primary text-lg md:text-xl font-display tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-elevated hover:-translate-y-2 hover:border-accent-coral hover:shadow-[0_15px_30px_rgba(255,107,74,0.2)] overflow-hidden rounded-none"
          >
            <div
              class="absolute inset-x-0 bottom-0 h-1 bg-accent-coral translate-y-1 group-hover:translate-y-0 transition-transform duration-300 disabled:hidden"
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-t from-accent-coral/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 disabled:hidden"
            ></div>
            <span class="relative z-10 font-bold">BẮN BẢN THÂN</span>
            <span
              class="relative z-10 block text-sm font-body text-text-dim mt-2 tracking-normal group-hover:text-text-secondary"
              >Đạn rỗng: Bạn giữ lượt</span
            >
          </button>

          <button
            @click="playerShootAI"
            :disabled="!isPlayerTurn || gameOver || cylinder.length === 0 || isActionDisabled"
            class="group relative flex-1 py-5 md:py-6 bg-bg-surface border border-border-default text-text-primary text-lg md:text-xl font-display tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-elevated hover:-translate-y-2 hover:border-accent-coral hover:shadow-[0_15px_30px_rgba(255,107,74,0.2)] overflow-hidden rounded-none"
          >
            <div
              class="absolute inset-x-0 bottom-0 h-1 bg-accent-coral translate-y-1 group-hover:translate-y-0 transition-transform duration-300 disabled:hidden"
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-t from-accent-coral/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 disabled:hidden"
            ></div>
            <span class="relative z-10 font-bold">BẮN ĐỐI THỦ</span>
            <span
              class="relative z-10 block text-sm font-body text-text-dim mt-2 tracking-normal group-hover:text-text-secondary"
              >Đạn rỗng: Qua lượt của Furina</span
            >
          </button>

          <!-- Player HP (Hearts) — nằm bên phải nút bắn đối thủ -->
          <div
            class="flex sm:flex-col items-center justify-center gap-2 px-4 py-3 bg-bg-surface/80 border border-border-default/60 backdrop-blur-md shadow-lg shadow-bg-deep/50 hover:border-accent-coral/50 transition-colors duration-300 group"
          >
            <svg
              v-for="i in playerHp"
              :key="'p-hp-' + i"
              class="w-8 h-8 md:w-10 md:h-10 text-accent-coral drop-shadow-[0_0_15px_rgba(255,107,74,0.6)] group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(255,107,74,1)] transition-all duration-300"
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
              class="text-accent-coral text-lg font-display tracking-widest animate-pulse font-bold"
              >DECEASED</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over Overlay -->
    <transition name="fade">
      <div
        v-if="gameOver"
        class="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-center z-[150] backdrop-blur-md px-4 text-center"
      >
        <!-- Decoration -->
        <h2
          class="font-display text-5xl md:text-8xl font-bold mb-6 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,107,74,0.3)] animate-fade-up"
          :class="winner === 'Player' ? 'text-accent-sky' : 'text-accent-coral'"
        >
          {{ winner === 'Player' ? 'BẠN CHIẾN THẮNG' : 'BẠN ĐÃ THUA' }}
        </h2>
        <div
          class="mb-12 text-text-primary text-xl md:text-2xl font-body max-w-lg mx-auto !leading-relaxed animate-fade-up animate-delay-2 p-6 border border-border-default bg-bg-surface/50 shadow-xl"
        >
          {{
            winner === 'Player'
              ? 'Furina gục ngã.\nMạng sống của bạn được bảo toàn.'
              : 'Một kết cục được dự báo trước.\nHãy nghỉ ngơi và thử lại sau.'
          }}
        </div>

        <button
          @click="startNewGame"
          class="group relative px-12 py-5 bg-transparent border-2 border-accent-amber text-accent-amber text-xl font-display font-bold transition-all duration-300 hover:bg-accent-amber hover:text-bg-deep hover:shadow-[0_0_30px_rgba(255,184,48,0.5)] tracking-widest animate-fade-up animate-delay-3 overflow-hidden rounded-none cursor-pointer"
        >
          <span class="relative z-10">CHƠI LẠI</span>
        </button>

        <RouterLink
          to="/"
          class="mt-8 text-text-dim hover:text-text-primary transition-colors underline decoration-border-default hover:decoration-accent-coral underline-offset-4 animate-fade-up animate-delay-4"
        >
          Trở về trang chủ
        </RouterLink>
      </div>
    </transition>

    <!-- Settings Modal -->
    <transition name="fade">
      <div
        v-if="showSettingsModal"
        class="fixed inset-0 z-[250] flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
      >
        <div
          class="w-full max-w-sm border-2 border-accent-amber bg-bg-surface p-6 shadow-[0_0_30px_rgba(255,184,48,0.2)]"
        >
          <h2
            class="mb-6 font-display text-2xl font-bold uppercase tracking-widest text-accent-amber text-center"
          >
            Cài Đặt Âm Thanh
          </h2>

          <button
            type="button"
            class="mb-4 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm font-display tracking-widest transition hover:border-accent-sky hover:text-accent-sky"
            @click="isSoundOn = !isSoundOn"
          >
            {{ isSoundOn ? 'Tắt hiệu ứng (SFX)' : 'Bật hiệu ứng (SFX)' }}
          </button>

          <div class="mb-6 border border-border-default bg-bg-deep p-4">
            <p class="text-xs font-display tracking-widest text-text-dim mb-2 uppercase">
              ÂM LƯỢNG HIỆU ỨNG: {{ sfxVolume }}%
            </p>
            <input
              v-model.number="sfxVolume"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-full accent-accent-coral cursor-pointer"
            />
          </div>

          <button
            type="button"
            class="w-full border-2 border-border-default bg-transparent px-4 py-3 text-lg font-display font-bold tracking-widest transition hover:bg-border-default hover:text-bg-deep cursor-pointer"
            @click="showSettingsModal = false"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameLogic } from './composables/useGameLogic'

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
  initIntro,
  enterGame,
  startNewGame,
  disposeAudio,
} = useGameLogic()

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
</style>
